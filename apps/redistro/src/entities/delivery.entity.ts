import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { SalesOrder } from './sales-order.entity';

@Entity('deliveries')
export class Delivery extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SalesOrder)
  @JoinColumn({ name: 'sales_order_id' })
  sales_order: SalesOrder;

  @Column({ type: 'uuid' })
  sales_order_id: string;

  @Column({ type: 'uuid', nullable: true })
  driver_id: string;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;

  @Column({ type: 'timestamptz', nullable: true })
  delivered_at: Date;
}
