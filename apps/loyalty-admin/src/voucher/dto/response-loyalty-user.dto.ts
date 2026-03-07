import { Expose } from '@nestjs/class-transformer';

export class ResponseLoyaltyUserDto {
  @Expose()
  id: string;

  @Expose()
  core_user_id: string;
}
