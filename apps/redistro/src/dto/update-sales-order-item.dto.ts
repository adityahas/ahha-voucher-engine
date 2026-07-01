import { PartialType } from '@nestjs/mapped-types';
import { CreateSalesOrderItemDto } from './create-sales-order-item.dto';

export class UpdateSalesOrderItemDto extends PartialType(
  CreateSalesOrderItemDto,
) {}
