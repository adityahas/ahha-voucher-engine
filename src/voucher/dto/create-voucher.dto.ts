import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from '@nestjs/class-validator';

export class CreateVoucherDto {
  @IsString()
  @MaxLength(255)
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsInt()
  quota?: number;

  @IsOptional()
  @IsBoolean()
  is_combinable?: boolean;

  @IsOptional()
  @IsString()
  combine_rule?: string;
}
