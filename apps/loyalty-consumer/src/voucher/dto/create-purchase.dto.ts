import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePurchaseDto {
  @ApiProperty({ description: 'ID of the product to purchase' })
  @IsUUID()
  @IsNotEmpty()
  product_id: string;

  @ApiProperty({ description: 'Quantity (must be at least 1)', default: 1 })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Optional voucher code to apply',
    required: false,
  })
  @IsString()
  @IsOptional()
  voucher_code?: string;
}
