import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RedisService } from './redis.service';

// Mock ioredis
const mockPing = jest.fn().mockResolvedValue('PONG');
const mockQuit = jest.fn().mockResolvedValue('OK');
const mockOn = jest.fn();

jest.mock('ioredis', () => {
  return jest.fn().mockImplementation(() => ({
    ping: mockPing,
    quit: mockQuit,
    on: mockOn,
  }));
});

describe('RedisService', () => {
  let service: RedisService;
  let configService: ConfigService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RedisService,
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'redis.url') return 'redis://localhost:6379';
              if (key === 'redis.password') return undefined;
              return null;
            }),
          },
        },
      ],
    }).compile();

    service = module.get<RedisService>(RedisService);
    configService = module.get<ConfigService>(ConfigService);
  });

  afterEach(async () => {
    if (service) {
      await service.onModuleDestroy();
    }
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('constructor', () => {
    it('should create Redis client with URL from config', () => {
      expect(configService.get).toHaveBeenCalledWith('redis.url');
    });

    it('should create Redis client with password from config', () => {
      expect(configService.get).toHaveBeenCalledWith('redis.password');
    });

    it('should register error event handler', () => {
      const client = service.getClient();
      expect(client.on).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('onModuleInit', () => {
    it('should ping Redis on module init', async () => {
      mockPing.mockResolvedValue('PONG');
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.onModuleInit();

      expect(mockPing).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Redis connection established');
    });

    it('should log warning when Redis connection fails', async () => {
      const error = new Error('Connection refused');
      mockPing.mockRejectedValue(error);
      const warnSpy = jest.spyOn(service['logger'], 'warn');

      await service.onModuleInit();

      expect(warnSpy).toHaveBeenCalledWith(
        'Redis connection failed - session management will be unavailable',
        error,
      );
    });

    it('should not throw error when Redis is unavailable', async () => {
      mockPing.mockRejectedValue(new Error('Connection refused'));

      await expect(service.onModuleInit()).resolves.not.toThrow();
    });
  });

  describe('onModuleDestroy', () => {
    it('should quit Redis connection on module destroy', async () => {
      mockQuit.mockResolvedValue('OK');
      const logSpy = jest.spyOn(service['logger'], 'log');

      await service.onModuleDestroy();

      expect(mockQuit).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith('Redis connection closed');
    });
  });

  describe('getClient', () => {
    it('should return Redis client instance', () => {
      const client = service.getClient();

      expect(client).toBeDefined();
      expect(client.ping).toBeDefined();
      expect(client.quit).toBeDefined();
    });
  });

  describe('error handling', () => {
    it('should register error event handler', () => {
      expect(mockOn).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should log error when Redis emits error event', () => {
      const errorSpy = jest.spyOn(service['logger'], 'error');
      const error = new Error('Redis error');

      // Get the error handler that was registered
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const errorHandler = mockOn.mock.calls.find((call: any[]) => call[0] === 'error')?.[1];
      if (errorHandler) {
        errorHandler(error);
      }

      expect(errorSpy).toHaveBeenCalledWith('Redis client error', error);
    });
  });
});
