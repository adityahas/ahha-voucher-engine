import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { VoucherModule } from './voucher/voucher.module';
import { QuestModule } from './quest/quest.module';
import { AdminModule } from './admin/admin.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { DatabaseModule } from './database/database.module';
import { ClientsModule } from './client/client.module';
import { SubdomainMiddleware } from './middleware/subdomain.middleware';
import { CredentialMiddleware } from './middleware/credential.middleware';
import { EncryptionModule } from './encryption/encryption.module';
import { TradingModule } from './trading/trading.module';
import { CollectibleItemsModule } from './collectible-items/collectible-items.module';
import { GamificationGachaModule } from './gamification-gacha/gamification-gacha.module';
import { TierModule } from './tier/tier.module';
import { GamificationDailyCheckinModule } from './gamification-daily-checkin/gamification-daily-checkin.module';
import { TenancyModule } from './tenancy/tenancy.module';

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
