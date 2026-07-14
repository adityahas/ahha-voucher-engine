import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ProductConsumerModule } from './product-consumer.module';

async function bootstrap() {
  const app = await NestFactory.create(ProductConsumerModule);
  app.setGlobalPrefix('product');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('AHHA Product Consumer API')
    .setDescription('Consumer-facing product catalog API')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-api-key', in: 'header' }, 'x-api-key')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT_PRODUCT_CONSUMER || 9008;
  await app.listen(port, () => {
    console.log(`Product Consumer Service running on port ${port}`);
  });
}
bootstrap();
