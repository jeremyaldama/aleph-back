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
  const app = await NestFactory.create(AppModule);

  const allowedOrigins = process.env.CORS_ORIGIN?.split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  const normalizedOrigins = allowedOrigins?.map(normalizeOrigin) ?? [];

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
