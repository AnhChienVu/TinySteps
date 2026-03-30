import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

function getAllowedOrigins() {
  const configuredOrigins = (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return configuredOrigins.length > 0
    ? configuredOrigins
    : ['http://localhost:3000', 'http://localhost:3001'];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Set global prefix for all APIs. E.x: /users => /api/users
  app.setGlobalPrefix('api');

  const allowedOrigins = getAllowedOrigins();

  // Allow local development and configured frontend deployments to call the API.
  app.enableCors({
    origin: (
      requestOrigin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => {
      if (!requestOrigin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(requestOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${requestOrigin}`), false);
    },
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
  console.log(`Allowed CORS origins: ${allowedOrigins.join(', ')}`);
}

void bootstrap();
