import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { SalesOrder } from './sales-order.entity';
import { RedistroProductEntity } from './redistro-product.entity';

@Entity('sales_order_items')
export class SalesOrderItem extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SalesOrder)
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column({ type: 'uuid' })
  sales_order_id: string;

  @ManyToOne(() => RedistroProductEntity)
  @JoinColumn({ name: 'product_id' })
  rds_product: RedistroProductEntity;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  unit_price: number;
}
