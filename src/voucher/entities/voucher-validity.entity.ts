import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Voucher } from './voucher.entity';
import { BaseEntity } from '../../base/entities/base.entity';

/*
 * Voucher can have one or more of this validity dates: daily, birthday, weekly, monthly, one-time, etc
 */

enum VoucherValidityType {
  DAILY = 'daily', // Voucher is valid every day from start_date to end_date
  BIRTHDAY = 'birthday', // Voucher is valid only on user's birthday
  WEEKLY = 'weekly', // Voucher is valid every week from start_date to end_date
  MONTHLY = 'monthly', // Voucher is valid every month from start_date to end_date
  ONE_TIME = 'one_time', // Voucher is valid only once from start_date to end_date
}

@Entity('voucher_validity')
export class VoucherValidity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Voucher, (voucher) => voucher.validities)
  @JoinColumn({ name: 'voucher_id' })
  voucher: Voucher;

  @Column({ type: 'varchar', nullable: true })
  type: string;

  @Column({ type: 'timetz', nullable: false })
  start_date: Date;

  @Column({ type: 'timetz', nullable: true })
  end_date: Date;

  @Column({ type: 'time without time zone', default: () => '00:00:00' })
  start_time: Date;

  @Column({ type: 'time with time zone', default: () => '23:59:59' })
  end_time: Date;
}
