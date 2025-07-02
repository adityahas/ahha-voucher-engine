import { IsEmail, IsNotEmpty, IsString } from '@nestjs/class-validator';

export class LoginAdminDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
