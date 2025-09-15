import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVoucherCategoryDto {
  @ApiProperty({
    description: 'Unique slug for the voucher category',
    example: 'food-and-beverage',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  slug: string;

  @ApiProperty({
    description: 'Name of the voucher category',
    example: 'Food & Beverage',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  name: string;

  @ApiProperty({
    description: 'Description of the voucher category',
    example: 'Food and beverage vouchers for restaurants, cafes, and bars',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 500)
  description: string;

  @ApiProperty({
    description: 'Image URL for the voucher category',
    example: 'https://example.com/images/food-beverage.png',
  })
  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  image: string;
}
