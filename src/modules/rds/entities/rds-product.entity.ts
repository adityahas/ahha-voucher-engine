import { Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from '../../product/entities/product.entity';

@Entity('rds_products')
export class RdsProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Product, { cascade: true })
  product: Product;
}
