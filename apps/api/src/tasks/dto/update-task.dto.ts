import { IsString, IsOptional, IsBoolean, IsIn, IsNumber } from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  completed?: boolean;

  @IsString()
  @IsOptional()
  @IsIn(['new', 'in-progress', 'completed'])
  status?: string;

  @IsString()
  @IsOptional()
  @IsIn(['work', 'personal', 'other'])
  category?: string;

  @IsNumber()
  @IsOptional()
  assignedTo?: number;

  @IsNumber()
  @IsOptional()
  organizationId?: number;
}
