import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';

@Injectable()
export class ValidateImagePipe implements PipeTransform {
  private readonly allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];
  private readonly maxFileSize = 10 * 1024 * 1024; // 10MB

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file format. Only JPEG, PNG, and WebP are allowed',
      );
    }

    if (file.size > this.maxFileSize) {
      throw new BadRequestException('File too large. Maximum size is 10MB');
    }

    return file;
  }
}
