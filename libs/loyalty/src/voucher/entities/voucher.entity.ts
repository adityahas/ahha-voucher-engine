import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryColumn } from 'typeorm';
import { VoucherValidityEntity } from './voucher-validity.entity';
import { VoucherBindingEntity } from './voucher-binding.entity';
import { VoucherClaimEntity } from './voucher-claim.entity';
import { VoucherUsageEntity } from './voucher-usage.entity';
import { VoucherCategoryEntity } from './voucher-category.entity';
import { BaseEntity } from '@core/base/entities/base.entity';
import { LoyaltyUserEntity } from '../../entities/loyalty-user.entity';

/**
 * Voucher adalah entitas utama yang merepresentasikan kupon yang dapat diklaim oleh user.
 * Setiap voucher memiliki kategori, masa berlaku, binding, dan daftar target user.
 */
@Entity('vouchers')
export class VoucherEntity extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', unique: true, nullable: false })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  quota: number;

  @Column({ type: 'text', nullable: true })
  image: string;

  @ManyToMany(
    () => VoucherCategoryEntity,
    (voucherCategory) => voucherCategory.slug,
    {
      cascade: true,
    },
  )
  @JoinTable({
    name: 'vouchers_categories',
  })
  categories: VoucherCategoryEntity[];

  @ManyToMany(
    () => VoucherCategoryEntity,
    (voucherCategory) => voucherCategory.slug,
    {
      cascade: true,
    },
  )
  @JoinTable({
    name: 'vouchers_allow_combine_categories',
  })
  allow_combine_categories: VoucherCategoryEntity[];

  @OneToMany(
    () => VoucherValidityEntity,
    (voucherValidity) => voucherValidity.voucher,
    {
      cascade: true,
    },
  )
  validities: VoucherValidityEntity[];

  @OneToMany(
    () => VoucherBindingEntity,
    (voucherBinding) => voucherBinding.voucher,
    {
      cascade: true,
    },
  )
  bindings: VoucherBindingEntity[];

  @OneToMany(() => VoucherClaimEntity, (voucherClaim) => voucherClaim.voucher, {
    cascade: true,
  })
  claims: VoucherClaimEntity[];

  @OneToMany(() => VoucherUsageEntity, (voucherUsage) => voucherUsage.voucher, {
    cascade: true,
  })
  usages: VoucherUsageEntity[];

  @ManyToMany(() => LoyaltyUserEntity, (user) => user.id, { cascade: true })
  @JoinTable({
    name: 'vouchers_target_users',
  })
  target_users: LoyaltyUserEntity[];
}
