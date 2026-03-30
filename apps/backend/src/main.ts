import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all APIs. E.x: /users => /api/users
  app.setGlobalPrefix('api');

  // Allow frontend with port :3000 call APIs
  app.enableCors({
    origin: ['http://localhost:3000'],
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Keep all fields declared in DTO, other extra fields are eliminated.
      transform: true, // Automatically convert data type
      forbidNonWhitelisted: true, // Always report the error (not just delete it) (fields are not declared in DTO)
    }),
  );

  const port = Number(process.env.PORT || 3001);
  await app.listen(port);

  console.log(`TinySteps backend listening on http://localhost:${port}/api`);
}

void bootstrap();
