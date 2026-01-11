import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';

@Injectable()
export class ImageProcessingService {
  /**
   * Generate a thumbnail from an image buffer
   * @param buffer - Original image buffer
   * @param width - Thumbnail width
   * @param height - Thumbnail height
   * @returns Optimized thumbnail buffer
   */
  async generateThumbnail(
    buffer: Buffer,
    width: number,
    height: number,
  ): Promise<Buffer> {
    try {
      return await sharp(buffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .jpeg({ quality: 80, progressive: true })
        .toBuffer();
    } catch (error) {
      throw new BadRequestException(
        'Unable to process image. File may be corrupted.',
      );
    }
  }

  /**
   * Optimize an image by resizing and compressing
   * @param buffer - Original image buffer
   * @param maxWidth - Maximum width in pixels
   * @returns Optimized image buffer
   */
  async optimizeImage(buffer: Buffer, maxWidth: number): Promise<Buffer> {
    try {
      const metadata = await sharp(buffer).metadata();

      if (metadata.width && metadata.width > maxWidth) {
        return await sharp(buffer)
          .resize(maxWidth, null, { withoutEnlargement: true })
          .jpeg({ quality: 85, progressive: true })
          .toBuffer();
      }

      // Already small enough, just compress
      return await sharp(buffer)
        .jpeg({ quality: 85, progressive: true })
        .toBuffer();
    } catch (error) {
      throw new BadRequestException(
        'Unable to process image. File may be corrupted.',
      );
    }
  }

  /**
   * Get image metadata (width, height, format)
   * @param buffer - Image buffer
   * @returns Image metadata
   */
  async getMetadata(buffer: Buffer): Promise<{
    width: number;
    height: number;
    format: string;
  }> {
    try {
      const metadata = await sharp(buffer).metadata();
      return {
        width: metadata.width || 0,
        height: metadata.height || 0,
        format: metadata.format || 'unknown',
      };
    } catch (error) {
      throw new BadRequestException(
        'Unable to read image metadata. File may be corrupted.',
      );
    }
  }
}
