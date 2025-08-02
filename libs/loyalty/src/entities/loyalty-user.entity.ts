import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('loyalty_users')
export class LoyaltyUserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid', unique: true })
  core_user_id: string;
}
