import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'BMad Recette API v0.1.0';
  }
}
