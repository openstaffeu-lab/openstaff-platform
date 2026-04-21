async function bootstrap() {
  const app = await (await import('@nestjs/core')).NestFactory.create(
    (await import('./app.module')).AppModule,
  );

  await app.listen(3002);
}
bootstrap();