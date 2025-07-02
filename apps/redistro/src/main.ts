import { NestFactory } from '@nestjs/core';
import { RedistroModule } from './redistro.module';

async function bootstrap() {
  const app = await NestFactory.create(RedistroModule);
  await app.listen(process.env.port ?? 3000);
}
bootstrap();
