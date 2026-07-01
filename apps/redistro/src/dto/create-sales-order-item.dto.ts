import { IsNotEmpty, IsNumber, IsUUID } from 'class-validator';

export class CreateSalesOrderItemDto {
  @IsNotEmpty()
  @IsUUID()
  sales_order_id: string;

  @IsNotEmpty()
  @IsUUID()
  product_id: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  unit_price: number;
}
