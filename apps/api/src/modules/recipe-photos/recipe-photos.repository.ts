import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { RecipePhoto } from '@prisma/client';

export interface CreatePhotoData {
  s3Url: string;
  thumbnailUrl: string;
  isPrimary: boolean;
  fileSize: number;
  width: number;
  height: number;
}

@Injectable()
export class RecipePhotosRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a new photo record
   */
  async create(
    recipeId: string,
    photoData: CreatePhotoData,
  ): Promise<RecipePhoto> {
    return this.prisma.recipePhoto.create({
      data: {
        recipeId,
        ...photoData,
      },
    });
  }

  /**
   * Find all photos for a recipe
   * Ordered by isPrimary DESC, uploadedAt ASC (primary photo first)
   */
  async findByRecipeId(recipeId: string): Promise<RecipePhoto[]> {
    return this.prisma.recipePhoto.findMany({
      where: { recipeId },
      orderBy: [{ isPrimary: 'desc' }, { uploadedAt: 'asc' }],
    });
  }

  /**
   * Find a single photo by ID with recipe relation
   */
  async findById(photoId: string): Promise<RecipePhoto | null> {
    return this.prisma.recipePhoto.findUnique({
      where: { id: photoId },
      include: { recipe: true },
    });
  }

  /**
   * Set a photo as primary (within a transaction)
   * First sets all photos for recipe to isPrimary=false
   * Then sets the target photo to isPrimary=true
   */
  async setPrimary(photoId: string, recipeId: string): Promise<RecipePhoto> {
    return this.prisma.$transaction(async (tx) => {
      // Set all photos for recipe to isPrimary=false
      await tx.recipePhoto.updateMany({
        where: { recipeId },
        data: { isPrimary: false },
      });

      // Set target photo to isPrimary=true
      return tx.recipePhoto.update({
        where: { id: photoId },
        data: { isPrimary: true },
      });
    });
  }

  /**
   * Delete a photo
   */
  async delete(photoId: string): Promise<void> {
    await this.prisma.recipePhoto.delete({
      where: { id: photoId },
    });
  }

  /**
   * Get photo count for a recipe
   * Used to determine if uploaded photo should be marked as primary
   */
  async getPhotoCount(recipeId: string): Promise<number> {
    return this.prisma.recipePhoto.count({
      where: { recipeId },
    });
  }
}
