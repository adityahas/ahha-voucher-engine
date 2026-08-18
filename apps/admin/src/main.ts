import { NestFactory } from '@nestjs/core';
import { AdminModule } from './admin.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AdminModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Comment out if you want to insert nested objects without uuid
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.enableCors({
    origin: true,
    credentials: true,
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'x-api-key',
      'x-tenant-override',
      'x-subdomain',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  const config = new DocumentBuilder()
    .setTitle('AHHA ADMIN API')
    .setDescription('API documentation for the AHHA ADMIN')
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

  await app.listen(process.env.PORT_ADMIN || 9002, () => {
    console.log(`Running on ${process.env.PORT_ADMIN || 9002}`);
  });
}

bootstrap();
