import { IsString, IsOptional, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVoucherCategoryDto {
  @ApiProperty({
    description: 'Name of the voucher category',
    example: 'Food & Beverage',
  })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  name?: string;

  @ApiProperty({
    description: 'Description of the voucher category',
    example: 'Food and beverage vouchers for restaurants, cafes, and bars',
  })
  @IsString()
  @IsOptional()
  @Length(1, 500)
  description?: string;

  @ApiProperty({
    description: 'Image URL for the voucher category',
    example: 'https://example.com/images/food-beverage.png',
  })
  @IsString()
  @IsOptional()
  @Length(1, 255)
  image?: string;
}
