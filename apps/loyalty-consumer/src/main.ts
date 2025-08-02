import { NestFactory } from '@nestjs/core';
import { LoyaltyConsumerModule } from './loyalty-consumer.module';

async function bootstrap() {
  const app = await NestFactory.create(LoyaltyConsumerModule);
  await app.listen(process.env.port ?? 3000);
}

bootstrap();
