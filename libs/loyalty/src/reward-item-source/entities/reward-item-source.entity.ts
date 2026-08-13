import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('reward_item_sources')
export class RewardItemSourceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  source_type: string; // e.g. 'gopay', 'pulsa', 'kitabisa'

  @Column({ nullable: true })
  api_endpoint: string | null;

  @Column({ nullable: true })
  apiKey: string | null;
}
