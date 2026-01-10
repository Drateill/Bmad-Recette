import databaseConfig from './database.config';

describe('databaseConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default pool settings when not set', () => {
    delete process.env.DATABASE_URL;
    delete process.env.DATABASE_POOL_MIN;
    delete process.env.DATABASE_POOL_MAX;

    const config = databaseConfig();

    expect(config).toEqual({
      url: undefined,
      poolMin: 2,
      poolMax: 10,
    });
  });

  it('should parse DATABASE_URL from environment', () => {
    process.env.DATABASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

    const config = databaseConfig();

    expect(config.url).toBe('postgresql://user:pass@localhost:5432/testdb');
  });

  it('should parse pool size settings as integers', () => {
    process.env.DATABASE_POOL_MIN = '5';
    process.env.DATABASE_POOL_MAX = '20';

    const config = databaseConfig();

    expect(config.poolMin).toBe(5);
    expect(config.poolMax).toBe(20);
    expect(typeof config.poolMin).toBe('number');
    expect(typeof config.poolMax).toBe('number');
  });

  it('should handle invalid pool settings gracefully', () => {
    process.env.DATABASE_POOL_MIN = 'invalid';
    process.env.DATABASE_POOL_MAX = 'invalid';

    const config = databaseConfig();

    expect(config.poolMin).toBeNaN();
    expect(config.poolMax).toBeNaN();
  });

  it('should allow undefined DATABASE_URL for testing environments', () => {
    delete process.env.DATABASE_URL;

    const config = databaseConfig();

    expect(config.url).toBeUndefined();
  });
});
