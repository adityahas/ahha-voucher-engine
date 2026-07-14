import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { RetailerEntity } from '../retailer/entities/retailer.entity';

@Entity('sales_orders')
export class SalesOrder extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RetailerEntity)
  @JoinColumn({ name: 'retailer_id' })
  retailer: RetailerEntity;

  @Column({ type: 'uuid' })
  retailer_id: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total_amount: number;

  @Column({ type: 'varchar', default: 'pending' })
  status: string;
}
