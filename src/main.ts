import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

function normalizeOrigin(origin: string): string {
  return origin
    .trim()
    .replace(/^['"]|['"]$/g, '')
    .replace(/\/$/, '');
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  const configuredOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const baselineOrigins = [
    'https://aleph-front.vercel.app',
    'http://localhost:5173',
    'http://localhost:3000',
    'http://localhost:3001',
  ];

  const normalizedOrigins = Array.from(
    new Set([
      ...baselineOrigins.map(normalizeOrigin),
      ...(configuredOrigins?.map(normalizeOrigin) ?? []),
    ]),
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || normalizedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      const normalizedRequestOrigin = normalizeOrigin(origin);
      const isAllowed = normalizedOrigins.includes(normalizedRequestOrigin);

      callback(isAllowed ? null : new Error('Not allowed by CORS'), isAllowed);
    },
    credentials: true,
  });

  logger.log(`CORS allowed origins: ${normalizedOrigins.join(', ')}`);

  const swaggerEnabled = process.env.SWAGGER_ENABLED !== 'false';
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle('Aleph RWA Procurement API')
      .setDescription(
        'Backend API for permissioned procurement pools, aggregated order tokenization, financing lifecycle, and bridge preparation on Avalanche L1.',
      )
      .setVersion('1.0.0')
      .addBearerAuth()
      .addTag('rwa')
      .addTag('auth')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(process.env.SWAGGER_PATH ?? 'docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
