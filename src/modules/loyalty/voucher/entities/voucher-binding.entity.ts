import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Voucher } from './voucher.entity';
import { BaseEntity } from '../../../../base/entities/base.entity';

/*
 * VoucherBinding menghubungkan voucher dengan entitas eksternal (produk, brand, atau lainnya)
 * berdasarkan bind_type dan bind_value.
 * Voucher can be bound to user's role, product type, product SKU, product vendor, etc
 */

export enum VoucherBindingType {
  ROLE = 'role',
  PRODUCT_TYPE = 'product_type',
  PRODUCT_SKU = 'product_sku',
  PRODUCT_VENDOR = 'product_vendor',
}

@Entity('voucher_bindings')
export class VoucherBinding extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Voucher, (voucher) => voucher.bindings)
  @JoinColumn({ name: 'voucher_id' })
  voucher: Voucher;

  @Column({ type: 'varchar', nullable: false })
  bind_type: string;

  // bind_value is the value of the bind_type, e.g. role name, product type name, product SKU, etc
  @Column({ type: 'varchar', nullable: false })
  bind_value: string;
}
