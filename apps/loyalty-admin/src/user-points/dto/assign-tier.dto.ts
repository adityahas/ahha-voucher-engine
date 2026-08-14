import { IsNotEmpty, IsUUID } from 'class-validator';

export class AssignTierDto {
  @IsUUID()
  @IsNotEmpty()
  tier_id: string;
}
