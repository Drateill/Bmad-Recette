import { Module } from '@nestjs/common';
import { RecipesController } from './recipes.controller';
import { RecipesService } from './recipes.service';
import { RecipesRepository } from './recipes.repository';
import { PrismaService } from '../../database/prisma.service';

@Module({
  controllers: [RecipesController],
  providers: [RecipesService, RecipesRepository, PrismaService],
  exports: [RecipesService, RecipesRepository],
})
export class RecipesModule {}
