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
import { VoucherClaimEntity } from './voucher-claim.entity';

/**
 * VoucherUsage merepresentasikan data penggunaan voucher oleh user dalam suatu transaksi.
 * Setiap usage mengkonsumsi satu VoucherClaim (1 use per claim).
 */
@Entity('voucher_usages')
export class VoucherUsageEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => VoucherEntity, (voucher) => voucher.usages)
  @JoinColumn({ name: 'voucher_id' })
  voucher: VoucherEntity;

  @ManyToOne(() => LoyaltyUserEntity, (user) => user.id)
  @JoinColumn({ name: 'user_id' })
  user: LoyaltyUserEntity;

  @ManyToOne(() => VoucherClaimEntity, { nullable: true })
  @JoinColumn({ name: 'claim_id' })
  claim: VoucherClaimEntity;

  @Column({ type: 'timetz', default: () => 'CURRENT_TIMESTAMP' })
  used_at: Date;
}
