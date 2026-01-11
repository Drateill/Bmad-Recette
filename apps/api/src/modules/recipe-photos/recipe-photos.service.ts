import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { RecipePhotosRepository } from './recipe-photos.repository';
import { StorageService } from '../storage/storage.service';
import { ImageProcessingService } from '../../common/services/image-processing.service';
import { RecipesRepository } from '../recipes/recipes.repository';
import { PhotoResponseDto } from './dto/photo-response.dto';
import { RecipePhoto } from '@prisma/client';

@Injectable()
export class RecipePhotosService {
  constructor(
    private recipePhotosRepository: RecipePhotosRepository,
    private storageService: StorageService,
    private imageProcessingService: ImageProcessingService,
    private recipesRepository: RecipesRepository,
  ) {}

  /**
   * Upload a photo for a recipe
   */
  async uploadPhoto(
    userId: string,
    recipeId: string,
    file: Express.Multer.File,
  ): Promise<PhotoResponseDto> {
    // Verify recipe exists and user owns it
    await this.verifyRecipeOwnership(userId, recipeId);

    // Check if this is the first photo
    const photoCount = await this.recipePhotosRepository.getPhotoCount(recipeId);
    const isPrimary = photoCount === 0;

    // Get image metadata
    const metadata = await this.imageProcessingService.getMetadata(file.buffer);

    // Extract file extension from mimetype
    const extension = this.getExtensionFromMimeType(file.mimetype);

    // Generate unique filenames
    const originalKey = this.storageService.generateFilename(
      userId,
      recipeId,
      extension,
    );
    const thumbnailKey = this.storageService.generateThumbnailFilename(originalKey);

    // Process images in parallel
    const [optimizedBuffer, thumbnailBuffer] = await Promise.all([
      this.imageProcessingService.optimizeImage(file.buffer, 1920),
      this.imageProcessingService.generateThumbnail(file.buffer, 400, 400),
    ]);

    // Upload to S3 in parallel
    const [s3Url, thumbnailUrl] = await Promise.all([
      this.storageService.uploadFile(
        originalKey,
        optimizedBuffer,
        file.mimetype,
      ),
      this.storageService.uploadFile(
        thumbnailKey,
        thumbnailBuffer,
        'image/jpeg',
      ),
    ]);

    // Create photo record
    const photo = await this.recipePhotosRepository.create(recipeId, {
      s3Url,
      thumbnailUrl,
      isPrimary,
      fileSize: file.size,
      width: metadata.width,
      height: metadata.height,
    });

    return this.mapToDto(photo);
  }

  /**
   * Set a photo as primary for a recipe
   */
  async setPrimaryPhoto(
    userId: string,
    recipeId: string,
    photoId: string,
  ): Promise<PhotoResponseDto> {
    // Verify recipe ownership
    await this.verifyRecipeOwnership(userId, recipeId);

    // Verify photo exists and belongs to recipe
    const photo = await this.recipePhotosRepository.findById(photoId);
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (photo.recipeId !== recipeId) {
      throw new NotFoundException('Photo does not belong to this recipe');
    }

    // Set as primary using transaction
    const updatedPhoto = await this.recipePhotosRepository.setPrimary(
      photoId,
      recipeId,
    );

    return this.mapToDto(updatedPhoto);
  }

  /**
   * Delete a photo
   */
  async deletePhoto(
    userId: string,
    recipeId: string,
    photoId: string,
  ): Promise<void> {
    // Verify recipe ownership
    await this.verifyRecipeOwnership(userId, recipeId);

    // Fetch photo
    const photo = await this.recipePhotosRepository.findById(photoId);
    if (!photo) {
      throw new NotFoundException('Photo not found');
    }

    if (photo.recipeId !== recipeId) {
      throw new NotFoundException('Photo does not belong to this recipe');
    }

    const wasPrimary = photo.isPrimary;

    // Extract S3 keys from URLs
    const s3Key = this.storageService.extractKeyFromUrl(photo.s3Url);
    const thumbnailKey = this.storageService.extractKeyFromUrl(
      photo.thumbnailUrl,
    );

    // Delete from S3 and database in parallel
    await Promise.all([
      this.storageService.deleteFile(s3Key),
      this.storageService.deleteFile(thumbnailKey),
      this.recipePhotosRepository.delete(photoId),
    ]);

    // If deleted photo was primary, promote another photo
    if (wasPrimary) {
      const remainingPhotos = await this.recipePhotosRepository.findByRecipeId(
        recipeId,
      );

      if (remainingPhotos.length > 0) {
        await this.recipePhotosRepository.setPrimary(
          remainingPhotos[0].id,
          recipeId,
        );
      }
    }
  }

  /**
   * Get all photos for a recipe
   */
  async getRecipePhotos(recipeId: string): Promise<PhotoResponseDto[]> {
    const photos = await this.recipePhotosRepository.findByRecipeId(recipeId);
    return photos.map((photo) => this.mapToDto(photo));
  }

  /**
   * Verify that the user owns the recipe
   */
  private async verifyRecipeOwnership(
    userId: string,
    recipeId: string,
  ): Promise<void> {
    const recipe = await this.recipesRepository.findById(recipeId);

    if (!recipe) {
      throw new NotFoundException('Recipe not found');
    }

    if (recipe.userId !== userId) {
      throw new ForbiddenException('You do not own this recipe');
    }
  }

  /**
   * Get file extension from MIME type
   */
  private getExtensionFromMimeType(mimeType: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    };

    return mimeToExt[mimeType] || 'jpg';
  }

  /**
   * Map RecipePhoto entity to DTO
   */
  private mapToDto(photo: RecipePhoto): PhotoResponseDto {
    return {
      id: photo.id,
      recipeId: photo.recipeId,
      s3Url: photo.s3Url,
      thumbnailUrl: photo.thumbnailUrl,
      isPrimary: photo.isPrimary,
      fileSize: photo.fileSize,
      width: photo.width,
      height: photo.height,
      uploadedAt: photo.uploadedAt,
    };
  }
}
