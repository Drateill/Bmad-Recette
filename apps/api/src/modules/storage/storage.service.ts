import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private region: string;

  constructor(private configService: ConfigService) {
    this.region = this.configService.get<string>('AWS_REGION') || 'eu-west-1';
    this.bucketName = this.configService.get<string>('S3_BUCKET_NAME') || '';

    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') || '',
        secretAccessKey:
          this.configService.get<string>('AWS_SECRET_ACCESS_KEY') || '',
      },
    });
  }

  /**
   * Upload a file to S3
   * @param key - S3 object key (path)
   * @param buffer - File buffer
   * @param contentType - MIME type
   * @returns Public URL of the uploaded file
   */
  async uploadFile(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        ACL: 'public-read',
      });

      await this.s3Client.send(command);

      return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    } catch (error) {
      throw new InternalServerErrorException(
        'Unable to upload image. Please try again.',
      );
    }
  }

  /**
   * Delete a file from S3
   * @param key - S3 object key (path)
   */
  async deleteFile(key: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
    } catch (error) {
      // Log error but don't throw - file might already be deleted
      this.logger.error(
        `Failed to delete S3 object`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  /**
   * Generate a unique filename for S3 storage
   * @param userId - User ID
   * @param recipeId - Recipe ID
   * @param extension - File extension (e.g., 'jpg', 'png')
   * @returns S3 key in format: userId/recipeId/uuid.ext
   */
  generateFilename(
    userId: string,
    recipeId: string,
    extension: string,
  ): string {
    return `${userId}/${recipeId}/${randomUUID()}.${extension}`;
  }

  /**
   * Generate a thumbnail filename based on original filename
   * @param originalKey - Original S3 key
   * @returns Thumbnail key with _thumb suffix
   */
  generateThumbnailFilename(originalKey: string): string {
    const parts = originalKey.split('.');
    const ext = parts.pop();
    return `${parts.join('.')}_thumb.${ext}`;
  }

  /**
   * Extract S3 key from full URL
   * @param url - Full S3 URL
   * @returns S3 key (path)
   */
  extractKeyFromUrl(url: string): string {
    const urlParts = url.split('.amazonaws.com/');
    return urlParts.length > 1 ? urlParts[1] : url;
  }
}
