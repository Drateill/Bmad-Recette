import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { StorageService } from './storage.service';

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StorageService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              const config: Record<string, string> = {
                AWS_REGION: 'eu-west-1',
                S3_BUCKET_NAME: 'test-bucket',
                AWS_ACCESS_KEY_ID: 'test-key',
                AWS_SECRET_ACCESS_KEY: 'test-secret',
              };
              return config[key];
            }),
          },
        },
      ],
    }).compile();

    service = module.get<StorageService>(StorageService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateFilename', () => {
    it('should generate filename with correct pattern', () => {
      const filename = service.generateFilename(
        'user-123',
        'recipe-456',
        'jpg',
      );

      expect(filename).toMatch(/^user-123\/recipe-456\/[a-f0-9-]+\.jpg$/);
    });

    it('should generate unique filenames', () => {
      const filename1 = service.generateFilename(
        'user-123',
        'recipe-456',
        'jpg',
      );
      const filename2 = service.generateFilename(
        'user-123',
        'recipe-456',
        'jpg',
      );

      expect(filename1).not.toBe(filename2);
    });

    it('should handle different extensions', () => {
      const jpgFilename = service.generateFilename(
        'user-123',
        'recipe-456',
        'jpg',
      );
      const pngFilename = service.generateFilename(
        'user-123',
        'recipe-456',
        'png',
      );

      expect(jpgFilename).toContain('.jpg');
      expect(pngFilename).toContain('.png');
    });
  });

  describe('generateThumbnailFilename', () => {
    it('should add _thumb suffix before extension', () => {
      const originalKey = 'user-123/recipe-456/abc-123.jpg';
      const thumbnailKey = service.generateThumbnailFilename(originalKey);

      expect(thumbnailKey).toBe('user-123/recipe-456/abc-123_thumb.jpg');
    });

    it('should handle different extensions', () => {
      const pngKey = 'user-123/recipe-456/xyz-789.png';
      const thumbnailKey = service.generateThumbnailFilename(pngKey);

      expect(thumbnailKey).toBe('user-123/recipe-456/xyz-789_thumb.png');
    });
  });

  describe('extractKeyFromUrl', () => {
    it('should extract key from S3 URL', () => {
      const url =
        'https://test-bucket.s3.eu-west-1.amazonaws.com/user-123/recipe-456/abc.jpg';
      const key = service.extractKeyFromUrl(url);

      expect(key).toBe('user-123/recipe-456/abc.jpg');
    });

    it('should return input if not a valid S3 URL', () => {
      const key = 'user-123/recipe-456/abc.jpg';
      const result = service.extractKeyFromUrl(key);

      expect(result).toBe(key);
    });
  });
});
