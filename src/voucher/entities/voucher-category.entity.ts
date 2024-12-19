import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { BaseEntity } from '../../base/entities/base.entity';

@Entity('voucher_categories')
export class VoucherCategory extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  description: string;

  @Column({ type: 'varchar' })
  image: string;
}
