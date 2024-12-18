import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Voucher } from './voucher.entity';
import { BaseEntity } from '../../base/entities/base.entity';

@Entity('voucher_bindings')
export class VoucherBinding extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Voucher, (voucher) => voucher.bindings)
  @JoinColumn({ name: 'voucher_id' })
  voucher: Voucher;

  @Column({ type: 'varchar', nullable: false })
  bind_type: string;

  @Column({ type: 'varchar', nullable: false })
  bind_value: string;
}
