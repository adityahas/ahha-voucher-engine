import { IsString, IsNotEmpty, IsUrl, IsOptional } from 'class-validator';

export class CreateRewardItemSourceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  source_type: string;

  @IsUrl()
  @IsOptional()
  api_endpoint?: string;

  @IsString()
  @IsOptional()
  apiKey?: string;
}
