import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../../base/entities/base.entity';

/**
 * VoucherCategory mendefinisikan kategori dari voucher, seperti makanan, minuman, dll,
 * untuk keperluan pengelompokan dan filtering.
 */
@Entity('voucher_categories')
export class VoucherCategory extends BaseEntity {
  @PrimaryColumn({ type: 'varchar', unique: true, nullable: false })
  slug: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'varchar' })
  image: string;
}
