import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoyaltyAdminModule } from './loyalty-admin.module';

async function bootstrap() {
  const app = await NestFactory.create(LoyaltyAdminModule);
  app.useGlobalPipes(
    new ValidationPipe({
      // whitelist: true, // Comment out if you want to insert nested objects without uuid
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  if (process.env.NODE_ENV === 'production') {
    app.enableCors();
  }

  const config = new DocumentBuilder()
    .setTitle('AHHA Loyalty API')
    .setDescription('API documentation for the AHHA ADMIN')
    .setVersion('1.0')
    .addServer('client1.localhost.dev:9003')
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

  await app.listen(process.env.PORT_LOYALTY_ADMIN || 9003, () => {
    console.log(`Running on ${process.env.PORT_LOYALTY_ADMIN || 9003}`);
  });
}

bootstrap();
