import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { VoucherModule } from './voucher/voucher.module';

@Module({
  imports: [UserModule, VoucherModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
