import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Replace default logger with Pino
  app.useLogger(app.get(Logger));

  const configService = app.get(ConfigService);

  // CORS configuration (must be before Helmet)
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || [
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    exposedHeaders: ['Set-Cookie'],
  });

  // Security headers with Helmet (after CORS)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // Disable CSP in development
    }),
  );

  // Cookie parser middleware
  app.use(cookieParser());

  // Set global API prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('app.port') || 3001;
  const logger = app.get(Logger);

  await app.listen(port);

  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`CORS enabled for: ${corsOrigins.join(', ')}`);
}
bootstrap();
