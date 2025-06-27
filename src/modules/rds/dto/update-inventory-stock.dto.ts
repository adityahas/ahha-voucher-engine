import { PartialType } from '@nestjs/mapped-types';
import { CreateInventoryStockDto } from './create-inventory-stock.dto';

export class UpdateInventoryStockDto extends PartialType(
  CreateInventoryStockDto,
) {}
