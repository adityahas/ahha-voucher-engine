import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from '@nestjs/class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConsumerProductPurchaseDto {
  @ApiProperty({ description: 'Target product UUID' })
  @IsNotEmpty()
  @IsUUID()
  product_id: string;

  @ApiProperty({ description: 'Purchase quantity', minimum: 1, default: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ description: 'Optional voucher code' })
  @IsOptional()
  @IsString()
  voucher_code?: string;

  @ApiPropertyOptional({
    description: 'Optional loyalty points to use',
    minimum: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  points_to_use?: number;

  @ApiPropertyOptional({
    description: 'Preferred payment method',
    default: 'MANUAL_TRANSFER',
  })
  @IsOptional()
  @IsString()
  payment_method?: string;

  @ApiPropertyOptional({ description: 'Optional order notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}
