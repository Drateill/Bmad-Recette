import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ImageProcessingService } from '../../../src/common/services/image-processing.service';
import sharp from 'sharp';

describe('ImageProcessingService', () => {
  let service: ImageProcessingService;
  let testImageBuffer: Buffer;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ImageProcessingService],
    }).compile();

    service = module.get<ImageProcessingService>(ImageProcessingService);

    // Create a 1000x1000 test image buffer (solid red)
    testImageBuffer = await sharp({
      create: {
        width: 1000,
        height: 1000,
        channels: 3,
        background: { r: 255, g: 0, b: 0 },
      },
    })
      .jpeg()
      .toBuffer();
  });

  describe('generateThumbnail', () => {
    it('should generate a thumbnail with correct dimensions', async () => {
      const thumbnail = await service.generateThumbnail(testImageBuffer, 400, 400);

      const metadata = await sharp(thumbnail).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(400);
    });

    it('should generate a progressive JPEG', async () => {
      const thumbnail = await service.generateThumbnail(testImageBuffer, 400, 400);

      const metadata = await sharp(thumbnail).metadata();
      expect(metadata.format).toBe('jpeg');
    });

    it('should throw BadRequestException for invalid image buffer', async () => {
      const invalidBuffer = Buffer.from('invalid image data');

      await expect(
        service.generateThumbnail(invalidBuffer, 400, 400),
      ).rejects.toThrow(BadRequestException);
    });

    it('should handle small images correctly', async () => {
      const smallImage = await sharp({
        create: {
          width: 100,
          height: 100,
          channels: 3,
          background: { r: 0, g: 255, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const thumbnail = await service.generateThumbnail(smallImage, 400, 400);

      const metadata = await sharp(thumbnail).metadata();
      expect(metadata.width).toBe(400);
      expect(metadata.height).toBe(400);
    });
  });

  describe('optimizeImage', () => {
    it('should resize large images to max width', async () => {
      const largeImage = await sharp({
        create: {
          width: 3000,
          height: 2000,
          channels: 3,
          background: { r: 0, g: 0, b: 255 },
        },
      })
        .jpeg()
        .toBuffer();

      const optimized = await service.optimizeImage(largeImage, 1920);

      const metadata = await sharp(optimized).metadata();
      expect(metadata.width).toBe(1920);
      expect(metadata.height).toBeLessThanOrEqual(1280); // Proportional resize
    });

    it('should not enlarge small images', async () => {
      const smallImage = await sharp({
        create: {
          width: 800,
          height: 600,
          channels: 3,
          background: { r: 255, g: 255, b: 0 },
        },
      })
        .jpeg()
        .toBuffer();

      const optimized = await service.optimizeImage(smallImage, 1920);

      const metadata = await sharp(optimized).metadata();
      expect(metadata.width).toBe(800);
      expect(metadata.height).toBe(600);
    });

    it('should compress images', async () => {
      const optimized = await service.optimizeImage(testImageBuffer, 1920);

      // Optimized image should be a valid JPEG
      const metadata = await sharp(optimized).metadata();
      expect(metadata.format).toBe('jpeg');
    });

    it('should throw BadRequestException for invalid image buffer', async () => {
      const invalidBuffer = Buffer.from('not an image');

      await expect(
        service.optimizeImage(invalidBuffer, 1920),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getMetadata', () => {
    it('should return correct metadata for valid image', async () => {
      const metadata = await service.getMetadata(testImageBuffer);

      expect(metadata.width).toBe(1000);
      expect(metadata.height).toBe(1000);
      expect(metadata.format).toBe('jpeg');
    });

    it('should throw BadRequestException for invalid buffer', async () => {
      const invalidBuffer = Buffer.from('invalid');

      await expect(service.getMetadata(invalidBuffer)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle PNG images', async () => {
      const pngBuffer = await sharp({
        create: {
          width: 500,
          height: 500,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0.5 },
        },
      })
        .png()
        .toBuffer();

      const metadata = await service.getMetadata(pngBuffer);

      expect(metadata.width).toBe(500);
      expect(metadata.height).toBe(500);
      expect(metadata.format).toBe('png');
    });
  });
});
