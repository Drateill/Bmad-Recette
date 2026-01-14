import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { RecipesService } from '../../src/modules/recipes/recipes.service';
import { RecipesRepository } from '../../src/modules/recipes/recipes.repository';
import { PortionAdjustmentService } from '../../src/modules/recipes/portion-adjustment.service';
import { PrismaService } from '../../src/database/prisma.service';
import { StorageService } from '../../src/modules/storage/storage.service';
import { Prisma } from '@prisma/client';

describe('RecipesService - delete', () => {
  let service: RecipesService;
  let repository: RecipesRepository;
  let prisma: PrismaService;
  let storageService: StorageService;

  const mockUserId = 'user-123';
  const mockRecipeId = 'recipe-456';
  const mockOtherUserId = 'user-789';

  const mockRecipe = {
    id: mockRecipeId,
    userId: mockUserId,
    title: 'Test Recipe',
    description: 'Test description',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    rating: null,
    source: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    version: 1,
    ingredients: [],
    steps: [],
    tags: [],
    photos: [],
  };

  const mockPhotos = [
    {
      s3Url: 'https://bucket.s3.amazonaws.com/user-123/recipe-456/photo1.jpg',
      thumbnailUrl:
        'https://bucket.s3.amazonaws.com/user-123/recipe-456/photo1_thumb.jpg',
    },
    {
      s3Url: 'https://bucket.s3.amazonaws.com/user-123/recipe-456/photo2.jpg',
      thumbnailUrl:
        'https://bucket.s3.amazonaws.com/user-123/recipe-456/photo2_thumb.jpg',
    },
  ] as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RecipesService,
        {
          provide: RecipesRepository,
          useValue: {
            findById: jest.fn(),
            delete: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            recipePhoto: {
              findMany: jest.fn(),
            },
          },
        },
        {
          provide: StorageService,
          useValue: {
            deleteFile: jest.fn(),
            extractKeyFromUrl: jest.fn((url) => {
              const parts = url.split('.amazonaws.com/');
              return parts[1] || url;
            }),
          },
        },
        {
          provide: PortionAdjustmentService,
          useValue: {
            adjustIngredients: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<RecipesService>(RecipesService);
    repository = module.get<RecipesRepository>(RecipesRepository);
    prisma = module.get<PrismaService>(PrismaService);
    storageService = module.get<StorageService>(StorageService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('successful deletion', () => {
    it('should delete recipe with no photos', async () => {
      // Arrange
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe);
      jest.spyOn(prisma.recipePhoto, 'findMany').mockResolvedValue([]);
      jest.spyOn(repository, 'delete').mockResolvedValue(undefined);

      // Act
      await service.delete(mockRecipeId, mockUserId);

      // Assert
      expect(repository.findById).toHaveBeenCalledWith(mockRecipeId);
      expect(prisma.recipePhoto.findMany).toHaveBeenCalledWith({
        where: { recipeId: mockRecipeId },
        select: { s3Url: true, thumbnailUrl: true },
      });
      expect(repository.delete).toHaveBeenCalledWith(mockRecipeId);
      expect(storageService.deleteFile).not.toHaveBeenCalled();
    });

    it('should delete recipe with photos and queue S3 deletion', async () => {
      // Arrange
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe);
      jest.spyOn(prisma.recipePhoto, 'findMany').mockResolvedValue(mockPhotos);
      jest.spyOn(repository, 'delete').mockResolvedValue(undefined);
      jest.spyOn(storageService, 'deleteFile').mockResolvedValue(undefined);

      // Act
      await service.delete(mockRecipeId, mockUserId);

      // Assert
      expect(repository.findById).toHaveBeenCalledWith(mockRecipeId);
      expect(prisma.recipePhoto.findMany).toHaveBeenCalledWith({
        where: { recipeId: mockRecipeId },
        select: { s3Url: true, thumbnailUrl: true },
      });
      expect(repository.delete).toHaveBeenCalledWith(mockRecipeId);

      // S3 deletion is async, so we need to wait a bit
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Verify S3 deletion was called for all photos (original + thumbnail)
      expect(storageService.deleteFile).toHaveBeenCalledTimes(4);
      expect(storageService.extractKeyFromUrl).toHaveBeenCalledTimes(4);
    });
  });

  describe('authorization', () => {
    it('should throw NotFoundException when recipe does not exist', async () => {
      // Arrange
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete(mockRecipeId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.delete(mockRecipeId, mockUserId)).rejects.toThrow(
        'Recipe not found',
      );

      expect(repository.findById).toHaveBeenCalledWith(mockRecipeId);
      expect(prisma.recipePhoto.findMany).not.toHaveBeenCalled();
      expect(repository.delete).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when user does not own recipe', async () => {
      // Arrange
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe);

      // Act & Assert
      await expect(
        service.delete(mockRecipeId, mockOtherUserId),
      ).rejects.toThrow(NotFoundException);
      await expect(
        service.delete(mockRecipeId, mockOtherUserId),
      ).rejects.toThrow('Recipe not found');

      expect(repository.findById).toHaveBeenCalledWith(mockRecipeId);
      expect(prisma.recipePhoto.findMany).not.toHaveBeenCalled();
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('S3 deletion handling', () => {
    it('should not block deletion if S3 deletion fails', async () => {
      // Arrange
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe);
      jest.spyOn(prisma.recipePhoto, 'findMany').mockResolvedValue(mockPhotos);
      jest.spyOn(repository, 'delete').mockResolvedValue(undefined);
      jest
        .spyOn(storageService, 'deleteFile')
        .mockRejectedValue(new Error('S3 error'));

      // Act - should not throw even if S3 fails
      await expect(
        service.delete(mockRecipeId, mockUserId),
      ).resolves.not.toThrow();

      // Assert
      expect(repository.delete).toHaveBeenCalledWith(mockRecipeId);
    });

    it('should handle recipe with empty photos array', async () => {
      // Arrange
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe);
      jest.spyOn(prisma.recipePhoto, 'findMany').mockResolvedValue([]);
      jest.spyOn(repository, 'delete').mockResolvedValue(undefined);

      // Act
      await service.delete(mockRecipeId, mockUserId);

      // Assert
      expect(repository.delete).toHaveBeenCalledWith(mockRecipeId);
      expect(storageService.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('deletion logging', () => {
    it('should log deletion event with recipe details', async () => {
      // Arrange
      const loggerSpy = jest.spyOn(service['logger'], 'log');
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe);
      jest.spyOn(prisma.recipePhoto, 'findMany').mockResolvedValue(mockPhotos);
      jest.spyOn(repository, 'delete').mockResolvedValue(undefined);

      // Act
      await service.delete(mockRecipeId, mockUserId);

      // Assert
      expect(loggerSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'recipe_deleted',
          userId: mockUserId,
          recipeId: mockRecipeId,
          recipeTitle: 'Test Recipe',
          photoCount: 2,
          deletedAt: expect.any(String),
        }),
      );
    });
  });

  describe('error handling', () => {
    it('should handle Prisma P2025 error (record not found)', async () => {
      // Arrange
      const prismaError = new Prisma.PrismaClientKnownRequestError(
        'Record not found',
        {
          code: 'P2025',
          clientVersion: '5.8.0',
        },
      );

      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe);
      jest.spyOn(prisma.recipePhoto, 'findMany').mockResolvedValue([]);
      jest.spyOn(repository, 'delete').mockRejectedValue(prismaError);

      // Act & Assert
      await expect(service.delete(mockRecipeId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should log and rethrow unexpected errors', async () => {
      // Arrange
      const loggerSpy = jest.spyOn(service['logger'], 'error');
      const unexpectedError = new Error('Unexpected database error');
      jest.spyOn(repository, 'findById').mockResolvedValue(mockRecipe);
      jest.spyOn(prisma.recipePhoto, 'findMany').mockResolvedValue([]);
      jest.spyOn(repository, 'delete').mockRejectedValue(unexpectedError);

      // Act & Assert
      await expect(service.delete(mockRecipeId, mockUserId)).rejects.toThrow(
        unexpectedError,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete recipe'),
        unexpectedError,
      );
    });
  });

  describe('idempotency', () => {
    it('should return 404 when trying to delete already deleted recipe', async () => {
      // Arrange
      jest.spyOn(repository, 'findById').mockResolvedValue(null);

      // Act & Assert
      await expect(service.delete(mockRecipeId, mockUserId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
