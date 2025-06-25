import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity()
export class Permission {
  @PrimaryColumn()
  name: string;

  @Column()
  description: string;
}
