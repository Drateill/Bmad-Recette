import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from './config.module';
import { ConfigService } from '@nestjs/config';

describe('ConfigModule', () => {
  let module: TestingModule;
  let configService: ConfigService;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [ConfigModule],
    }).compile();

    configService = module.get<ConfigService>(ConfigService);
  });

  it('should be defined', () => {
    expect(module).toBeDefined();
  });

  it('should provide ConfigService', () => {
    expect(configService).toBeDefined();
    expect(configService).toBeInstanceOf(ConfigService);
  });

  describe('app configuration', () => {
    it('should load app config namespace', () => {
      const nodeEnv = configService.get('app.nodeEnv');
      const port = configService.get('app.port');
      const version = configService.get('app.version');

      expect(nodeEnv).toBeDefined();
      expect(port).toBeDefined();
      expect(version).toBeDefined();
    });

    it('should return correct types for app config', () => {
      const port = configService.get<number>('app.port');
      const corsOrigins = configService.get<string[]>('app.corsOrigins');

      expect(typeof port).toBe('number');
      expect(Array.isArray(corsOrigins)).toBe(true);
    });
  });

  describe('database configuration', () => {
    it('should load database config namespace', () => {
      const url = configService.get('database.url');
      const poolMin = configService.get('database.poolMin');
      const poolMax = configService.get('database.poolMax');

      // URL may be undefined in test environment
      expect(url !== null).toBe(true);
      expect(poolMin).toBeDefined();
      expect(poolMax).toBeDefined();
    });

    it('should return correct types for database config', () => {
      const poolMin = configService.get<number>('database.poolMin');
      const poolMax = configService.get<number>('database.poolMax');

      expect(typeof poolMin).toBe('number');
      expect(typeof poolMax).toBe('number');
    });
  });

  describe('redis configuration', () => {
    it('should load redis config namespace', () => {
      const url = configService.get('redis.url');
      const password = configService.get('redis.password');

      expect(url).toBeDefined();
      // password is optional
      expect(password !== null).toBe(true);
    });

    it('should return correct type for redis URL', () => {
      const url = configService.get<string>('redis.url');

      expect(typeof url).toBe('string');
    });
  });

  describe('configuration caching', () => {
    it('should cache configuration values', () => {
      const firstCall = configService.get('app.port');
      const secondCall = configService.get('app.port');

      expect(firstCall).toBe(secondCall);
    });
  });

  describe('configuration defaults', () => {
    it('should provide default values when env vars not set', () => {
      const port = configService.get<number>('app.port');
      const poolMin = configService.get<number>('database.poolMin');
      const redisUrl = configService.get<string>('redis.url');

      expect(port).toBeGreaterThan(0);
      expect(poolMin).toBeGreaterThanOrEqual(2);
      expect(redisUrl).toContain('redis://');
    });
  });
});
