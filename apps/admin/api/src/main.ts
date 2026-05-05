import 'dotenv/config';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import express from 'express';
import { join } from 'node:path';
import { API_CORS_ORIGINS, loadSecrets } from './app.config';
import { AppModule } from './app.module';

async function bootstrap() {
  await loadSecrets();
  const app = await NestFactory.create(AppModule);

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
  app.use('/dev-files', express.static(join(process.cwd(), 'uploads', 'actors')));

  const port = process.env.PORT || 8080;
  await app.listen(port, '0.0.0.0');
}

bootstrap();
