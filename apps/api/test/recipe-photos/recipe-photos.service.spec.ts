import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { RecipePhotosService } from '../../src/modules/recipe-photos/recipe-photos.service';
import { RecipePhotosRepository } from '../../src/modules/recipe-photos/recipe-photos.repository';
import { StorageService } from '../../src/modules/storage/storage.service';
import { ImageProcessingService } from '../../src/common/services/image-processing.service';
import { RecipesRepository } from '../../src/modules/recipes/recipes.repository';

describe('RecipePhotosService', () => {
  let service: RecipePhotosService;
  let recipePhotosRepository: any;
  let storageService: any;
  let imageProcessingService: any;
  let recipesRepository: any;

  const mockFile = {
    fieldname: 'photo',
    originalname: 'test.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    size: 1024 * 1024, // 1MB
    buffer: Buffer.from('fake image data'),
    stream: null as any,
    destination: '',
    filename: '',
    path: '',
  };

  const mockRecipe = {
    id: 'recipe-1',
    userId: 'user-1',
    title: 'Test Recipe',
    description: 'Test',
    prepTime: 30,
    cookTime: 45,
    servings: 4,
    difficulty: 'medium' as const,
    cuisine: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPhoto = {
    id: 'photo-1',
    recipeId: 'recipe-1',
    s3Url: 'https://bucket.s3.amazonaws.com/user-1/recipe-1/photo.jpg',
    thumbnailUrl: 'https://bucket.s3.amazonaws.com/user-1/recipe-1/photo_thumb.jpg',
    isPrimary: true,
    fileSize: 1024 * 1024,
    width: 1920,
    height: 1080,
    uploadedAt: new Date(),
  };

  beforeEach(async () => {
    const mockRecipePhotosRepository = {
      create: jest.fn(),
      findById: jest.fn(),
      findByRecipeId: jest.fn(),
      setPrimary: jest.fn(),
      delete: jest.fn(),
      getPhotoCount: jest.fn(),
    };

    const mockStorageService = {
      uploadFile: jest.fn(),
      deleteFile: jest.fn(),
      generateFilename: jest.fn(),
      generateThumbnailFilename: jest.fn(),
      extractKeyFromUrl: jest.fn(),
    };

    const mockImageProcessingService = {
      optimizeImage: jest.fn(),
      generateThumbnail: jest.fn(),
      getMetadata: jest.fn(),
    };

    const mockRecipesRepository = {
      findById: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipePhotosService,
        {
          provide: RecipePhotosRepository,
          useValue: mockRecipePhotosRepository,
        },
        {
          provide: StorageService,
          useValue: mockStorageService,
        },
        {
          provide: ImageProcessingService,
          useValue: mockImageProcessingService,
        },
        {
          provide: RecipesRepository,
          useValue: mockRecipesRepository,
        },
      ],
    }).compile();

    service = module.get<RecipePhotosService>(RecipePhotosService);
    recipePhotosRepository = module.get(RecipePhotosRepository);
    storageService = module.get(StorageService);
    imageProcessingService = module.get(ImageProcessingService);
    recipesRepository = module.get(RecipesRepository);
  });

  describe('uploadPhoto', () => {
    it('should upload a photo successfully', async () => {
      recipesRepository.findById.mockResolvedValue(mockRecipe);
      recipePhotosRepository.getPhotoCount.mockResolvedValue(0);
      imageProcessingService.getMetadata.mockResolvedValue({
        width: 1920,
        height: 1080,
        format: 'jpeg',
      });
      storageService.generateFilename.mockReturnValue('user-1/recipe-1/uuid.jpg');
      storageService.generateThumbnailFilename.mockReturnValue('user-1/recipe-1/uuid_thumb.jpg');
      imageProcessingService.optimizeImage.mockResolvedValue(Buffer.from('optimized'));
      imageProcessingService.generateThumbnail.mockResolvedValue(Buffer.from('thumbnail'));
      storageService.uploadFile
        .mockResolvedValueOnce('https://bucket.s3.amazonaws.com/user-1/recipe-1/uuid.jpg')
        .mockResolvedValueOnce('https://bucket.s3.amazonaws.com/user-1/recipe-1/uuid_thumb.jpg');
      recipePhotosRepository.create.mockResolvedValue(mockPhoto);

      const result = await service.uploadPhoto('user-1', 'recipe-1', mockFile);

      expect(result).toEqual({
        id: mockPhoto.id,
        recipeId: mockPhoto.recipeId,
        s3Url: mockPhoto.s3Url,
        thumbnailUrl: mockPhoto.thumbnailUrl,
        isPrimary: mockPhoto.isPrimary,
        fileSize: mockPhoto.fileSize,
        width: mockPhoto.width,
        height: mockPhoto.height,
        uploadedAt: mockPhoto.uploadedAt,
      });
      expect(recipesRepository.findById).toHaveBeenCalledWith('recipe-1');
      expect(recipePhotosRepository.getPhotoCount).toHaveBeenCalledWith('recipe-1');
    });

    it('should mark first photo as primary', async () => {
      recipesRepository.findById.mockResolvedValue(mockRecipe);
      recipePhotosRepository.getPhotoCount.mockResolvedValue(0);
      imageProcessingService.getMetadata.mockResolvedValue({
        width: 1920,
        height: 1080,
        format: 'jpeg',
      });
      storageService.generateFilename.mockReturnValue('user-1/recipe-1/uuid.jpg');
      storageService.generateThumbnailFilename.mockReturnValue('user-1/recipe-1/uuid_thumb.jpg');
      imageProcessingService.optimizeImage.mockResolvedValue(Buffer.from('optimized'));
      imageProcessingService.generateThumbnail.mockResolvedValue(Buffer.from('thumbnail'));
      storageService.uploadFile.mockResolvedValue('https://bucket.s3.amazonaws.com/photo.jpg');
      recipePhotosRepository.create.mockResolvedValue(mockPhoto);

      await service.uploadPhoto('user-1', 'recipe-1', mockFile);

      expect(recipePhotosRepository.create).toHaveBeenCalledWith('recipe-1', expect.objectContaining({
        isPrimary: true,
      }));
    });

    it('should not mark subsequent photos as primary', async () => {
      recipesRepository.findById.mockResolvedValue(mockRecipe);
      recipePhotosRepository.getPhotoCount.mockResolvedValue(1);
      imageProcessingService.getMetadata.mockResolvedValue({
        width: 1920,
        height: 1080,
        format: 'jpeg',
      });
      storageService.generateFilename.mockReturnValue('user-1/recipe-1/uuid.jpg');
      storageService.generateThumbnailFilename.mockReturnValue('user-1/recipe-1/uuid_thumb.jpg');
      imageProcessingService.optimizeImage.mockResolvedValue(Buffer.from('optimized'));
      imageProcessingService.generateThumbnail.mockResolvedValue(Buffer.from('thumbnail'));
      storageService.uploadFile.mockResolvedValue('https://bucket.s3.amazonaws.com/photo.jpg');
      recipePhotosRepository.create.mockResolvedValue({ ...mockPhoto, isPrimary: false });

      await service.uploadPhoto('user-1', 'recipe-1', mockFile);

      expect(recipePhotosRepository.create).toHaveBeenCalledWith('recipe-1', expect.objectContaining({
        isPrimary: false,
      }));
    });

    it('should throw NotFoundException if recipe does not exist', async () => {
      recipesRepository.findById.mockResolvedValue(null);

      await expect(service.uploadPhoto('user-1', 'recipe-1', mockFile)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw ForbiddenException if user does not own recipe', async () => {
      recipesRepository.findById.mockResolvedValue({ ...mockRecipe, userId: 'user-2' });

      await expect(service.uploadPhoto('user-1', 'recipe-1', mockFile)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('setPrimaryPhoto', () => {
    it('should set a photo as primary', async () => {
      recipesRepository.findById.mockResolvedValue(mockRecipe);
      recipePhotosRepository.findById.mockResolvedValue(mockPhoto);
      recipePhotosRepository.setPrimary.mockResolvedValue({ ...mockPhoto, isPrimary: true });

      const result = await service.setPrimaryPhoto('user-1', 'recipe-1', 'photo-1');

      expect(result.isPrimary).toBe(true);
      expect(recipePhotosRepository.setPrimary).toHaveBeenCalledWith('photo-1', 'recipe-1');
    });

    it('should throw NotFoundException if photo does not exist', async () => {
      recipesRepository.findById.mockResolvedValue(mockRecipe);
      recipePhotosRepository.findById.mockResolvedValue(null);

      await expect(service.setPrimaryPhoto('user-1', 'recipe-1', 'photo-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if photo does not belong to recipe', async () => {
      recipesRepository.findById.mockResolvedValue(mockRecipe);
      recipePhotosRepository.findById.mockResolvedValue({ ...mockPhoto, recipeId: 'recipe-2' });

      await expect(service.setPrimaryPhoto('user-1', 'recipe-1', 'photo-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deletePhoto', () => {
    it('should delete a photo successfully', async () => {
      recipesRepository.findById.mockResolvedValue(mockRecipe);
      recipePhotosRepository.findById.mockResolvedValue({ ...mockPhoto, isPrimary: false });
      storageService.extractKeyFromUrl.mockReturnValue('user-1/recipe-1/photo.jpg');
      recipePhotosRepository.findByRecipeId.mockResolvedValue([]);

      await service.deletePhoto('user-1', 'recipe-1', 'photo-1');

      expect(storageService.deleteFile).toHaveBeenCalledTimes(2);
      expect(recipePhotosRepository.delete).toHaveBeenCalledWith('photo-1');
    });

    it('should promote another photo when deleting primary photo', async () => {
      const secondPhoto = { ...mockPhoto, id: 'photo-2', isPrimary: false };
      recipesRepository.findById.mockResolvedValue(mockRecipe);
      recipePhotosRepository.findById.mockResolvedValue(mockPhoto);
      storageService.extractKeyFromUrl.mockReturnValue('user-1/recipe-1/photo.jpg');
      recipePhotosRepository.findByRecipeId.mockResolvedValue([secondPhoto]);

      await service.deletePhoto('user-1', 'recipe-1', 'photo-1');

      expect(recipePhotosRepository.setPrimary).toHaveBeenCalledWith('photo-2', 'recipe-1');
    });

    it('should throw NotFoundException if photo does not exist', async () => {
      recipesRepository.findById.mockResolvedValue(mockRecipe);
      recipePhotosRepository.findById.mockResolvedValue(null);

      await expect(service.deletePhoto('user-1', 'recipe-1', 'photo-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
