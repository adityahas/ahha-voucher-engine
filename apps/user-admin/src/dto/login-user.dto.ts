import { IsEmail, IsNotEmpty, IsString } from '@nestjs/class-validator';

export class LoginUserDto {
  @IsString()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
