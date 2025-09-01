import { NestFactory } from '@nestjs/core';
import { ProductAdminModule } from './product-admin.module';

async function bootstrap() {
  const app = await NestFactory.create(ProductAdminModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
