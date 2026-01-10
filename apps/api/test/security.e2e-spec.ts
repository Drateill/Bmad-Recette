import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Security Middleware (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Helmet Security Headers', () => {
    it('should set X-Content-Type-Options header', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect((res) => {
          expect(res.headers['x-content-type-options']).toBe('nosniff');
        });
    });

    it('should set X-Frame-Options header', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect((res) => {
          expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
        });
    });

    it('should set Strict-Transport-Security header', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect((res) => {
          expect(res.headers['strict-transport-security']).toBeDefined();
        });
    });

    it('should set X-DNS-Prefetch-Control header', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .expect((res) => {
          expect(res.headers['x-dns-prefetch-control']).toBe('off');
        });
    });
  });

  describe('CORS Configuration', () => {
    it('should allow requests from localhost:5173', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'http://localhost:5173')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
          expect(res.headers['access-control-allow-credentials']).toBe('true');
        });
    });

    it('should allow requests from localhost:3000', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'http://localhost:3000')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBe('http://localhost:3000');
        });
    });

    it('should handle preflight OPTIONS requests', () => {
      return request(app.getHttpServer())
        .options('/api/health')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET')
        .expect(204)
        .expect((res) => {
          expect(res.headers['access-control-allow-methods']).toContain('GET');
          expect(res.headers['access-control-allow-headers']).toContain('Content-Type');
          expect(res.headers['access-control-allow-headers']).toContain('Authorization');
        });
    });

    it('should reject requests from unauthorized origins', () => {
      return request(app.getHttpServer())
        .get('/api/health')
        .set('Origin', 'http://malicious-site.com')
        .expect((res) => {
          expect(res.headers['access-control-allow-origin']).toBeUndefined();
        });
    });
  });
});
