import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CANCELED = 'CANCELED',
}

export enum OrderPaymentStatus {
  PAID = 'PAID',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
}

@Entity('orders')
export class OrderEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  user_id: string;

  @Column({ type: 'uuid' })
  product_id: string;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  discount_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  voucher_discount_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  points_used: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  point_discount_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  cash_amount: number;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  total_price: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({
    type: 'enum',
    enum: OrderPaymentStatus,
    default: OrderPaymentStatus.PENDING_PAYMENT,
  })
  payment_status: OrderPaymentStatus;

  @Column({ type: 'varchar', nullable: true })
  voucher_code: string;
}
