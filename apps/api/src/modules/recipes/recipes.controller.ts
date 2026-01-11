import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { RecipesService } from './recipes.service';
import { CreateRecipeDto } from './dto/create-recipe.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('recipes')
export class RecipesController {
  constructor(private readonly recipesService: RecipesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async createRecipe(
    @Body() createRecipeDto: CreateRecipeDto,
    @Request() req: Express.Request & { user: { id: string; email: string } },
  ) {
    const userId = req.user.id;
    return this.recipesService.create(userId, createRecipeDto);
  }
}
