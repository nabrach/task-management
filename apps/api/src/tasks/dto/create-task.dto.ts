import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsIn, IsNumber } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title: string;

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
  @IsNotEmpty()
  organizationId: number;

  @IsNumber()
  @IsOptional()
  createdBy?: number;
}
