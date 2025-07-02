import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Voucher } from './voucher.entity';
import { User } from '@core/user/entities/user.entity';
import { BaseEntity } from '@core/base/entities/base.entity';

/**
 * VoucherClaim menyimpan informasi user yang telah mengklaim voucher tertentu.
 */
@Entity('voucher_claims')
export class VoucherClaim extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Voucher, (voucher) => voucher.claims)
  @JoinColumn({ name: 'voucher_id' })
  voucher: Voucher;

  @ManyToOne(() => User, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'timetz', default: () => 'CURRENT_TIMESTAMP' })
  claimed_at: Date;
}
