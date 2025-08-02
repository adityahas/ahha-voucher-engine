import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '@core/base/entities/base.entity';

///
/// Quest entity is a class that represents a quest or task that need to be done by a user to get a reward.
///
@Entity({
  name: 'quests',
})
export class QuestEntity extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'varchar' })
  description: string;
}
