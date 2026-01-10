import redisConfig from './redis.config';

describe('redisConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default Redis URL when not set', () => {
    delete process.env.REDIS_URL;
    delete process.env.REDIS_PASSWORD;

    const config = redisConfig();

    expect(config).toEqual({
      url: 'redis://localhost:6379',
      password: undefined,
    });
  });

  it('should parse REDIS_URL from environment', () => {
    process.env.REDIS_URL = 'redis://custom-host:6380';

    const config = redisConfig();

    expect(config.url).toBe('redis://custom-host:6380');
  });

  it('should parse REDIS_PASSWORD from environment', () => {
    process.env.REDIS_PASSWORD = 'super-secret-password';

    const config = redisConfig();

    expect(config.password).toBe('super-secret-password');
  });

  it('should handle empty REDIS_PASSWORD as undefined', () => {
    process.env.REDIS_PASSWORD = '';

    const config = redisConfig();

    // Empty string is falsy, so || undefined returns undefined
    expect(config.password).toBeUndefined();
  });

  it('should use custom Redis URL and password together', () => {
    process.env.REDIS_URL = 'redis://production-redis:6379';
    process.env.REDIS_PASSWORD = 'prod-password';

    const config = redisConfig();

    expect(config.url).toBe('redis://production-redis:6379');
    expect(config.password).toBe('prod-password');
  });
});
