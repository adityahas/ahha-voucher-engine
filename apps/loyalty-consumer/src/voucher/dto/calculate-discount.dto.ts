import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CalculateDiscountDto {
  @ApiProperty({ description: 'Voucher code to validate' })
  @IsString()
  @IsNotEmpty()
  voucher_code: string;

  @ApiProperty({ description: 'ID of the product being purchased' })
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @ApiProperty({ description: 'Quantity (must be at least 1)', default: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Optional loyalty points to use',
    required: false,
  })
  @IsInt()
  @Min(0)
  @IsOptional()
  points_to_use?: number;
}
