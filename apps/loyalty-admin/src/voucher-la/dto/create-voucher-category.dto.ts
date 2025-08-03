import { IsNotEmpty, IsString } from '@nestjs/class-validator';

export class CreateVoucherCategoryDto {
  @IsString()
  @IsNotEmpty()
  slug: string;

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
