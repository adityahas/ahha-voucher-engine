import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { VoucherEntity } from './voucher.entity';
import { BaseEntity } from '@core/base/entities/base.entity';
import { LoyaltyUserEntity } from '../../entities/loyalty-user.entity';

/**
 * VoucherClaim menyimpan informasi user yang telah mengklaim voucher tertentu.
 */
@Entity('voucher_claims')
export class VoucherClaimEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => VoucherEntity, (voucher) => voucher.claims)
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity;

  @ManyToOne(() => LoyaltyUserEntity, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: LoyaltyUserEntity;

  @Column({ type: 'timetz', default: () => 'CURRENT_TIMESTAMP' })
  claimed_at: Date;
}
