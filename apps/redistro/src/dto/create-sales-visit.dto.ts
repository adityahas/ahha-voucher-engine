import { IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateSalesVisitDto {
  @IsNotEmpty()
  @IsUUID()
  retailer_id: string;

  @IsOptional()
  @IsUUID()
  sales_person_id?: string;

  @IsOptional()
  @IsString()
  visit_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
