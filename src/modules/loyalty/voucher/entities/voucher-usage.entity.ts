import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Voucher } from './voucher.entity';
import { User } from '../../../user/entities/user.entity';
import { BaseEntity } from '../../../../base/entities/base.entity';

/**
 * VoucherUsage merepresentasikan data penggunaan voucher oleh user dalam suatu transaksi.
 */
@Entity('voucher_usages')
export class VoucherUsage extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Voucher, (voucher) => voucher.usages)
  @JoinColumn({ name: 'voucher_id' })
  voucher: Voucher;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'timetz', default: () => 'CURRENT_TIMESTAMP' })
  used_at: Date;
}
