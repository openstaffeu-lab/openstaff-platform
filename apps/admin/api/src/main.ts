import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { randomUUID } from 'node:crypto';
import { join } from 'node:path';
import { API_CORS_ORIGINS, loadSecrets } from './app.config';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';
import { StructuredLoggingInterceptor } from './common/structured-logging.interceptor';
import {
  assertRuntimeEnvironment,
  RuntimeConfigService,
} from './config/runtime-config.service';

async function bootstrap() {
  await loadSecrets();
  assertRuntimeEnvironment(process.env);
  const app = await NestFactory.create(AppModule);
  const runtimeConfig = app.get(RuntimeConfigService);

  runtimeConfig.logValidationWarnings();

  app.enableCors({
    origin: API_CORS_ORIGINS,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use((req: any, res: any, next: () => void) => {
    const requestId =
      (Array.isArray(req.headers['x-request-id'])
        ? req.headers['x-request-id'][0]
        : req.headers['x-request-id']) ?? randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);
    next();
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new StructuredLoggingInterceptor(runtimeConfig));
  app.use('/dev-files', express.static(join(process.cwd(), 'uploads', 'actors')));

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
