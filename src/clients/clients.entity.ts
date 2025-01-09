import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { BaseEntity } from '../base/entities/base.entity';

@Entity('clients')
export class Client extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  subdomain: string;

  @Column()
  api_key: string;

  @Column()
  database_name: string;

  @Column()
  database_host: string;

  @Column()
  database_port: number;

  @Column()
  database_username: string;

  @Column()
  database_password: string;
}
