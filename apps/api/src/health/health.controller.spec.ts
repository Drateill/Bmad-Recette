import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { HealthController } from './health.controller';
import { PrismaService } from '../database/prisma.service';
import { RedisService } from '../redis/redis.service';

describe('HealthController', () => {
  let controller: HealthController;
  let prismaService: PrismaService;
  let redisService: RedisService;

  beforeEach(async () => {
    const mockPrismaService = {
      $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
    };

    const mockRedisService = {
      getClient: jest.fn().mockReturnValue({
        ping: jest.fn().mockResolvedValue('PONG'),
      }),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'app.version') return '0.1.0';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        { provide: ConfigService, useValue: mockConfigService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: RedisService, useValue: mockRedisService },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    prismaService = module.get<PrismaService>(PrismaService);
    redisService = module.get<RedisService>(RedisService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health status with timestamp and version', async () => {
    const result = await controller.getHealth();

    expect(result).toMatchObject({
      status: 'ok',
      timestamp: expect.any(String),
      version: '0.1.0',
      services: {
        database: 'healthy',
        redis: 'healthy',
      },
    });
  });

  it('should report unhealthy database when connection fails', async () => {
    jest.spyOn(prismaService, '$queryRaw').mockRejectedValueOnce(new Error('Connection failed'));

    const result = await controller.getHealth();

    expect(result.services.database).toBe('unhealthy');
    expect(result.services.redis).toBe('healthy');
  });

  it('should report unhealthy redis when connection fails', async () => {
    const mockClient = {
      ping: jest.fn().mockRejectedValueOnce(new Error('Connection refused')),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jest.spyOn(redisService, 'getClient').mockReturnValue(mockClient as any);

    const result = await controller.getHealth();

    expect(result.services.database).toBe('healthy');
    expect(result.services.redis).toBe('unhealthy');
  });
});
