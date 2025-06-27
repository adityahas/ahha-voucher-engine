import { IsInt, IsUUID } from 'class-validator';

export class CreateInventoryStockDto {
  @IsUUID()
  product_id: string;

  @IsUUID()
  warehouse_id: string;

  @IsInt()
  quantity: number;
}
