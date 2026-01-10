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

  // Security headers with Helmet
  app.use(helmet());

  // Cookie parser middleware
  app.use(cookieParser());

  // CORS configuration
  const corsOrigins = configService.get<string[]>('app.corsOrigins') || [
    'http://localhost:5173',
    'http://localhost:3000',
  ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Set global API prefix
  app.setGlobalPrefix('api');

  const port = configService.get<number>('app.port') || 3001;
  const logger = app.get(Logger);

  await app.listen(port);

  logger.log(`Application is running on: ${await app.getUrl()}`);
  logger.log(`CORS enabled for: ${corsOrigins.join(', ')}`);
}
bootstrap();
