import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './modules/user/user.module';
import { VoucherModule } from './modules/voucher/voucher.module';
import { QuestModule } from './modules/quest/quest.module';
import { BaseModule } from './base/base.module';
import { AdminUserModule } from './modules/admin-user/admin-user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { DatabaseModule } from './database/database.module';
import { ClientsModule } from './clients/clients.module';
import { SubdomainMiddleware } from './middleware/subdomain.middleware';
import { CredentialMiddleware } from './middleware/credential.middleware';

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
      autoLoadEntities: process.env.DB_AUTOLOAD_ENTITIES === 'true',
    }),
    DatabaseModule,
    ClientsModule,
    UserModule,
    VoucherModule,
    QuestModule,
    BaseModule,
    AdminUserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SubdomainMiddleware, CredentialMiddleware).forRoutes('*');
  }
}
