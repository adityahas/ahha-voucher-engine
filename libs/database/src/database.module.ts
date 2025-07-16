import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Client } from './entities/client.entity';
import { EncryptionModule } from '@core/encryption';

export const CONNECTION = 'CONNECTION';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Client]), EncryptionModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
