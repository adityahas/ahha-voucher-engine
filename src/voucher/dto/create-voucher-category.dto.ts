import { IsString, IsNotEmpty } from '@nestjs/class-validator';

export class CreateVoucherCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  image: string;
}
