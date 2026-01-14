import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { RecipeTemplatesService } from './recipe-templates.service';
import { PortionAdjustmentService } from './portion-adjustment.service';
import { RecipesRepository } from './recipes.repository';
import { TagsRepository } from '../tags/tags.repository';
import { StorageService } from '../storage/storage.service';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [RecipesController],
  providers: [
    RecipesService,
    RecipeTemplatesService,
    PortionAdjustmentService,
    RecipesRepository,
    TagsRepository,
    StorageService,
    PrismaService,
  ],
  exports: [RecipesService, RecipesRepository],
})
export class RecipesModule {}
