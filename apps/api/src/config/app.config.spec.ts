import appConfig from './app.config';

describe('appConfig', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should return default configuration when no env vars are set', () => {
    delete process.env.NODE_ENV;
    delete process.env.PORT;
    delete process.env.API_VERSION;
    delete process.env.CORS_ORIGINS;
    delete process.env.LOG_LEVEL;

    const config = appConfig();

    expect(config).toEqual({
      nodeEnv: 'development',
      port: 3001,
      version: '0.1.0',
      corsOrigins: ['http://localhost:5173', 'http://localhost:3000'],
      logLevel: 'info',
    });
  });

  it('should parse PORT as integer', () => {
    process.env.PORT = '4000';

    const config = appConfig();

    expect(config.port).toBe(4000);
    expect(typeof config.port).toBe('number');
  });

  it('should parse CORS_ORIGINS as array', () => {
    process.env.CORS_ORIGINS = 'http://example.com,http://test.com,http://localhost:3000';

    const config = appConfig();

    expect(config.corsOrigins).toEqual([
      'http://example.com',
      'http://test.com',
      'http://localhost:3000',
    ]);
    expect(Array.isArray(config.corsOrigins)).toBe(true);
  });

  it('should use environment-specific values when set', () => {
    process.env.NODE_ENV = 'production';
    process.env.PORT = '8080';
    process.env.API_VERSION = '1.0.0';
    process.env.LOG_LEVEL = 'warn';

    const config = appConfig();

    expect(config.nodeEnv).toBe('production');
    expect(config.port).toBe(8080);
    expect(config.version).toBe('1.0.0');
    expect(config.logLevel).toBe('warn');
  });

  it('should handle invalid PORT gracefully', () => {
    process.env.PORT = 'invalid';

    const config = appConfig();

    expect(config.port).toBeNaN();
  });

  it('should handle single CORS origin', () => {
    process.env.CORS_ORIGINS = 'http://single-origin.com';

    const config = appConfig();

    expect(config.corsOrigins).toEqual(['http://single-origin.com']);
  });
});
