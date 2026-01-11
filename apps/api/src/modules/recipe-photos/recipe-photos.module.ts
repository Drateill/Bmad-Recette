import { Module } from '@nestjs/common';
import { RecipePhotosController } from './recipe-photos.controller';
import { RecipePhotosService } from './recipe-photos.service';
import { RecipePhotosRepository } from './recipe-photos.repository';
import { StorageModule } from '../storage/storage.module';
import { ImageProcessingService } from '../../common/services/image-processing.service';
import { PrismaService } from '../../database/prisma.service';
import { RecipesModule } from '../recipes/recipes.module';

@Module({
  imports: [StorageModule, RecipesModule],
  controllers: [RecipePhotosController],
  providers: [
    RecipePhotosService,
    RecipePhotosRepository,
    ImageProcessingService,
    PrismaService,
  ],
  exports: [RecipePhotosService, RecipePhotosRepository],
})
export class RecipePhotosModule {}
