import {
  Controller,
  Post,
  Put,
  Delete,
  Get,
  Param,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { RecipePhotosService } from './recipe-photos.service';
import { ValidateImagePipe } from './dto/validate-image.pipe';
import { PhotoResponseDto } from './dto/photo-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('recipes/:recipeId/photos')
@UseGuards(JwtAuthGuard)
export class RecipePhotosController {
  constructor(private recipePhotosService: RecipePhotosService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('photo', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 1,
      },
    }),
  )
  async uploadPhoto(
    @Param('recipeId') recipeId: string,
    @UploadedFile(ValidateImagePipe) file: Express.Multer.File,
    @Req() request: any,
  ): Promise<PhotoResponseDto> {
    const userId = request.user.id;
    return this.recipePhotosService.uploadPhoto(userId, recipeId, file);
  }

  @Get()
  async getPhotos(
    @Param('recipeId') recipeId: string,
  ): Promise<PhotoResponseDto[]> {
    return this.recipePhotosService.getRecipePhotos(recipeId);
  }

  @Put(':photoId/primary')
  async setPrimaryPhoto(
    @Param('recipeId') recipeId: string,
    @Param('photoId') photoId: string,
    @Req() request: any,
  ): Promise<PhotoResponseDto> {
    const userId = request.user.id;
    return this.recipePhotosService.setPrimaryPhoto(userId, recipeId, photoId);
  }

  @Delete(':photoId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePhoto(
    @Param('recipeId') recipeId: string,
    @Param('photoId') photoId: string,
    @Req() request: any,
  ): Promise<void> {
    const userId = request.user.id;
    await this.recipePhotosService.deletePhoto(userId, recipeId, photoId);
  }
}
