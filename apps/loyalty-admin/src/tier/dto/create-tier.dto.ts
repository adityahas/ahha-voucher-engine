import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateTierCategoryOverrideDto {
  @IsUUID()
  @IsNotEmpty()
  category_id: string;

  @IsNumber()
  @Min(0)
  point_multiplier: number;
}

export class CreateTierDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(1)
  level: number;

  @IsNumber()
  @Min(0)
  min_points: number;

  @IsNumber()
  @Min(0)
  point_multiplier: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  extra_discount_percent?: number;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  exclusive_window_hours?: number;

  @IsOptional()
  @IsString()
  level_up_voucher_code?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTierCategoryOverrideDto)
  category_overrides?: CreateTierCategoryOverrideDto[];
}
