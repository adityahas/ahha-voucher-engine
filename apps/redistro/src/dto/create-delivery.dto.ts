import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateDeliveryDto {
  @IsNotEmpty()
  @IsUUID()
  sales_order_id: string;

  @IsOptional()
  @IsUUID()
  driver_id?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
