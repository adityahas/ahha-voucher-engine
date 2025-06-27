import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseEntity } from '../../../../base/entities/base.entity';
import { RdsUserEntity } from '../../entities/rds-user.entity';

@Entity('retailers')
export class Retailer extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => RdsUserEntity, { cascade: true })
  rds_user: RdsUserEntity;

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
