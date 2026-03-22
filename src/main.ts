import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') ?? true,
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
      .addTag('rwa')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(process.env.SWAGGER_PATH ?? 'docs', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
