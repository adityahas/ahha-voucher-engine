import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserService } from './user.service';
import { AuthModule } from '@core/auth';
import { CONNECTION } from '@core/database/database.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    forwardRef(() => AuthModule),
    forwardRef(() => AuthModule),
  ],
  providers: [
    {
      provide: 'USER_SERVICE',
      useFactory: async (connection) => {
        return new UserService(connection);
      },
      inject: [CONNECTION],
    },
  ],
  controllers: [UserController],
})
export class UserModule {}
