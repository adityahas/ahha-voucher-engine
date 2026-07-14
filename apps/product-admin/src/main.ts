import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ProductAdminModule } from './product-admin.module';

async function bootstrap() {
  const app = await NestFactory.create(ProductAdminModule);
  app.setGlobalPrefix('product-admin');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = process.env.PORT_PRODUCT_ADMIN || 9007;
  await app.listen(port, () => {
    console.log(`Product Admin Service running on port ${port}`);
  });
}
bootstrap();
