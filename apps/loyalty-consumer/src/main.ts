import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoyaltyConsumerModule } from './loyalty-consumer.module';

async function bootstrap() {
  const app = await NestFactory.create(LoyaltyConsumerModule);
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
    .setTitle('AHHA Loyalty Consumer API')
    .setDescription('API documentation for the AHHA Loyalty Consumer')
    .setVersion('1.0')
    .addServer('client1.localhost.dev:9004')
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

  await app.listen(process.env.PORT_LOYALTY_CONSUMER || 9005, () => {
    console.log(`Running on ${process.env.PORT_LOYALTY_CONSUMER || 9005}`);
  });
}

bootstrap();
