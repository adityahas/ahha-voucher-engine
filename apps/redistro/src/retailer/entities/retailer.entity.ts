import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { RedistroUserEntity } from '../../entities/redistro-user.entity';
import { BaseEntity } from '@core/base/entities/base.entity';

@Entity('retailers')
export class Retailer extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => RedistroUserEntity, { cascade: true })
  rds_user: RedistroUserEntity;

  @Column({ type: 'varchar', nullable: true })
  name: string;

  @Column({ type: 'varchar', nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'varchar', nullable: true }) // GEOMETRY type, using varchar for now
  location: string;

  @Column({ type: 'boolean', default: true })
  is_active: boolean;
}
