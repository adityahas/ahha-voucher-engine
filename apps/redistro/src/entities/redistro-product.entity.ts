import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rds_products')
export class RedistroProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  core_product_id: string;
}
