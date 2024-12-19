import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Voucher } from './voucher.entity';
import { User } from '../../user/entities/user.entity';
import { BaseEntity } from '../../base/entities/base.entity';

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
