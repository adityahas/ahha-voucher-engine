import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AdjustPointsDto {
  @IsNumber()
  delta: number; // positive = add, negative = subtract

  @IsString()
  @IsNotEmpty()
  reason: string;
}
