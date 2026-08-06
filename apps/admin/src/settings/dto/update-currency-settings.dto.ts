import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class NumberFormatOptionsDto {
  @IsOptional()
  @IsIn(['lookup', 'best fit'])
  localeMatcher?: 'lookup' | 'best fit';

  @IsOptional()
  @IsIn(['decimal', 'currency', 'percent'])
  style?: 'decimal' | 'currency' | 'percent';

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsIn(['code', 'symbol', 'narrowSymbol', 'name'])
  currencyDisplay?: 'code' | 'symbol' | 'narrowSymbol' | 'name';

  @IsOptional()
  @IsIn(['standard', 'accounting'])
  currencySign?: 'standard' | 'accounting';

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsIn(['short', 'long', 'narrow'])
  unitDisplay?: 'short' | 'long' | 'narrow';

  @IsOptional()
  @IsBoolean()
  useGrouping?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(21)
  minimumIntegerDigits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  minimumFractionDigits?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  maximumFractionDigits?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(21)
  minimumSignificantDigits?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(21)
  maximumSignificantDigits?: number;

  @IsOptional()
  @IsIn(['auto', 'always', 'exceptZero', 'negative'])
  signDisplay?: 'auto' | 'always' | 'exceptZero';

  @IsOptional()
  @IsIn(['standard', 'scientific', 'engineering', 'compact'])
  notation?: 'standard' | 'scientific' | 'engineering' | 'compact';

  @IsOptional()
  @IsIn(['short', 'long'])
  compactDisplay?: 'short' | 'long';

  @IsOptional()
  @IsIn([
    'ceil',
    'floor',
    'expand',
    'trunc',
    'halfCeil',
    'halfFloor',
    'halfExpand',
    'halfTrunc',
    'halfEven',
  ])
  roundingMode?:
    | 'ceil'
    | 'floor'
    | 'expand'
    | 'trunc'
    | 'halfCeil'
    | 'halfFloor'
    | 'halfExpand'
    | 'halfTrunc'
    | 'halfEven';

  @IsOptional()
  @IsIn(['auto', 'morePrecision', 'lessPrecision'])
  roundingPriority?: 'auto' | 'morePrecision' | 'lessPrecision';

  @IsOptional()
  @IsIn(['auto', 'stripIfInteger'])
  trailingZeroDisplay?: 'auto' | 'stripIfInteger';
}

export class UpdateCurrencySettingsDto {
  @IsOptional()
  @IsString()
  currency_code?: string;

  @IsOptional()
  @IsString()
  locale?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => NumberFormatOptionsDto)
  number_format_options?: NumberFormatOptionsDto;
}
