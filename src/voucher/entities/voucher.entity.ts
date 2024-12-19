import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { VoucherValidity } from './voucher-validity.entity';
import { VoucherBinding } from './voucher-binding.entity';
import { VoucherClaim } from './voucher-claim.entity';
import { VoucherUsage } from './voucher-usage.entity';
import { BaseEntity } from '../../base/entities/base.entity';
import { VoucherCategory } from './voucher-category.entity';
import { User } from '../../user/entities/user.entity';

@Entity('vouchers')
export class Voucher extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', unique: true, nullable: false })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int', default: 1 })
  quota: number;

  @ManyToMany(() => VoucherCategory, (voucherCategory) => voucherCategory.id)
  categories: VoucherCategory[];

  @ManyToMany(() => VoucherCategory, (voucherCategory) => voucherCategory.id)
  allow_combine_categories: VoucherCategory[];

  @OneToMany(
    () => VoucherValidity,
    (voucherValidity) => voucherValidity.voucher,
  )
  validities: VoucherValidity[];

  @OneToMany(() => VoucherBinding, (voucherBinding) => voucherBinding.voucher)
  bindings: VoucherBinding[];

  @OneToMany(() => VoucherClaim, (voucherClaim) => voucherClaim.voucher)
  claims: VoucherClaim[];

  @OneToMany(() => VoucherUsage, (voucherUsage) => voucherUsage.voucher)
  usages: VoucherUsage[];

  @ManyToMany(() => User, (user) => user.id)
  target_users: User[];
}
