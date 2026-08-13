import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateRewardItemDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsInt()
  stock: number;

  @IsString()
  @IsNotEmpty()
  source_id: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  point_price?: number;

  @IsOptional()
  @IsUUID()
  min_tier_id?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  exclusive_days?: number;
}
