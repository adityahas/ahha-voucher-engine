import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { VoucherModule } from './voucher/voucher.module';
import { DatabaseModule } from './database/database.module';
import { QuestModule } from './quest/quest.module';
import { BaseModule } from './base/base.module';
import { AdminUserModule } from './admin-user/admin-user.module';

@Module({
  imports: [
    UserModule,
    VoucherModule,
    DatabaseModule,
    QuestModule,
    BaseModule,
    AdminUserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
