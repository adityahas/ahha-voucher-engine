import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { VoucherValidity } from './voucher-validity.entity';
import { VoucherBinding } from './voucher-binding.entity';
import { VoucherClaim } from './voucher-claim.entity';
import { VoucherUsage } from './voucher-usage.entity';
import { VoucherCategory } from './voucher-category.entity';
import { User } from '@core/user/entities/user.entity';
import { BaseEntity } from '@core/base/entities/base.entity';

/**
 * Voucher adalah entitas utama yang merepresentasikan kupon yang dapat diklaim oleh user.
 * Setiap voucher memiliki kategori, masa berlaku, binding, dan daftar target user.
 */
@Entity('vouchers')
export class Voucher extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', unique: true, nullable: false })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  quota: number;

  @ManyToMany(
    () => VoucherCategory,
    (voucherCategory) => voucherCategory.slug,
    {
      cascade: true,
    },
  )
  @JoinTable({
    name: 'vouchers_categories',
  })
  categories: VoucherCategory[];

  @ManyToMany(
    () => VoucherCategory,
    (voucherCategory) => voucherCategory.slug,
    {
      cascade: true,
    },
  )
  @JoinTable({
    name: 'vouchers_allow_combine_categories',
  })
  allow_combine_categories: VoucherCategory[];

  @OneToMany(
    () => VoucherValidity,
    (voucherValidity) => voucherValidity.voucher,
    {
      cascade: true,
    },
  )
  validities: VoucherValidity[];

  @OneToMany(() => VoucherBinding, (voucherBinding) => voucherBinding.voucher, {
    cascade: true,
  })
  bindings: VoucherBinding[];

  @OneToMany(() => VoucherClaim, (voucherClaim) => voucherClaim.voucher, {
    cascade: true,
  })
  claims: VoucherClaim[];

  @OneToMany(() => VoucherUsage, (voucherUsage) => voucherUsage.voucher, {
    cascade: true,
  })
  usages: VoucherUsage[];

  @ManyToMany(() => User, (user) => user.id, { cascade: true })
  @JoinTable({
    name: 'vouchers_target_users',
  })
  target_users: User[];
}
