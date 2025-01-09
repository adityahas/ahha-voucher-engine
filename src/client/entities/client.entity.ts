import { Column, Entity, PrimaryColumn } from 'typeorm';
import { BaseEntity } from '../../base/entities/base.entity';

@Entity('clients')
export class Client extends BaseEntity {
  @PrimaryColumn()
  database_name: string;

  @Column({ unique: true })
  subdomain: string;

  @Column()
  api_key: string;

  @Column()
  database_username: string;

  @Column()
  database_password: string;
}
