import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { VoucherModule } from './modules/voucher/voucher.module';
import { QuestModule } from './modules/quest/quest.module';
import { AdminModule } from './admin/admin.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { DatabaseModule } from './database/database.module';
import { ClientsModule } from './client/client.module';
import { SubdomainMiddleware } from './middleware/subdomain.middleware';
import { CredentialMiddleware } from './middleware/credential.middleware';
import { EncryptionModule } from './encryption/encryption.module';
import { TradingModule } from './modules/trading/trading.module';
import { CollectibleItemsModule } from './modules/collectible-items/collectible-items.module';
import { GamificationGachaModule } from './modules/gamification-gacha/gamification-gacha.module';
import { TierModule } from './modules/tier/tier.module';
import { GamificationDailyCheckinModule } from './modules/gamification-daily-checkin/gamification-daily-checkin.module';
import { TenancyModule } from './tenancy/tenancy.module';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

dotenv.config();

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: process.env.DB_SYNC == 'true',
      dropSchema: process.env.DB_DROP_SCHEMA == 'true',
      logging: process.env.DB_LOGGING != 'false',
      entities: [
        'dist/admin/**/*.entity{.ts,.js}',
        'dist/client/**/*.entity{.ts,.js}',
      ],
    }),
    DatabaseModule,
    ClientsModule,
    TenancyModule,
    UserModule,
    VoucherModule,
    QuestModule,
    AdminModule,
    EncryptionModule,
    TradingModule,
    CollectibleItemsModule,
    GamificationGachaModule,
    TierModule,
    GamificationDailyCheckinModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SubdomainMiddleware, CredentialMiddleware).forRoutes('*');
  }
}
