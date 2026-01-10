import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

@Controller('api/health')
export class HealthController {
  constructor(
    private configService: ConfigService,
    private prismaService: PrismaService,
    private redisService: RedisService,
  ) {}

  @Get()
  async getHealth() {
    const services = {
      database: 'unknown',
      redis: 'unknown',
    };

    // Check database
    try {
      await this.prismaService.$queryRaw`SELECT 1`;
      services.database = 'healthy';
    } catch (error) {
      services.database = 'unhealthy';
    }

    // Check Redis
    try {
      await this.redisService.getClient().ping();
      services.redis = 'healthy';
    } catch (error) {
      services.redis = 'unhealthy';
    }

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: this.configService.get<string>('app.version'),
      services,
    };
  }
}
