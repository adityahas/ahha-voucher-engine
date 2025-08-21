import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class CreateRewardItemSourceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsUrl()
  @IsOptional()
  url?: string;
}
