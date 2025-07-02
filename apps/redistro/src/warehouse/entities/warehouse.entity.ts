import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';
import { User } from '@core/user/entities/user.entity';

@Entity('warehouses')
export class Warehouse extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true })
  rds_user: User;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar', nullable: true }) // GEOMETRY type, using varchar for now
  location: string;
}
