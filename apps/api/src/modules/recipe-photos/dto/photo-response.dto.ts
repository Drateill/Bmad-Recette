export class PhotoResponseDto {
  id!: string;
  recipeId!: string;
  s3Url!: string;
  thumbnailUrl!: string;
  isPrimary!: boolean;
  fileSize!: number;
  width!: number;
  height!: number;
  uploadedAt!: Date;
}
