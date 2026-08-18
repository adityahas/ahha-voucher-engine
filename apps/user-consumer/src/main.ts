import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { UserConsumerModule } from './user-consumer.module';

async function bootstrap() {
  const app = await NestFactory.create(UserConsumerModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
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
    .setTitle('AHHA User Consumer API')
    .setDescription('API documentation for the AHHA User Consumer')
    .setVersion('1.0')
    .addServer('client1.localhost.dev:9006')
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

  await app.listen(process.env.PORT_USER_CONSUMER || 9004, () => {
    console.log(`Running on ${process.env.PORT_USER_CONSUMER || 9004}`);
  });
}

bootstrap();
