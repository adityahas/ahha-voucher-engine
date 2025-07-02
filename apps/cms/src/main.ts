import { NestFactory } from '@nestjs/core';
import { CmsModule } from './cms.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(CmsModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Comment out if you want to insert nested objects without uuid
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  if (process.env.NODE_ENV === 'production') {
    app.enableCors();
  }

  const config = new DocumentBuilder()
    .setTitle('AHHA CMS API')
    .setDescription('API documentation for the AHHA CMS')
    .setVersion('1.0')
    .addServer('client1.localhost.dev:9002')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        name: 'x-api-key',
        in: 'header',
      },
      'x-api-key',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(process.env.HTTP_PORT || 9002, () => {
    console.log(`Running on ${process.env.HTTP_PORT || 9002}`);
  });
}

bootstrap();
