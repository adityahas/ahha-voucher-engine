import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClientEntity } from './entities/client.entity';
import { EncryptionModule } from '@core/encryption';

export const CONNECTION = 'CONNECTION';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([ClientEntity]), EncryptionModule],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
