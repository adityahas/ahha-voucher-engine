import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('rds_users')
export class RedistroUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  core_service_id: string;
}
