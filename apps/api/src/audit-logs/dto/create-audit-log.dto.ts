import { IsString, IsNotEmpty, IsNumber, IsOptional, IsEnum } from 'class-validator';
import { AuditAction, AuditResource } from '../entities/audit-log.entity';

export class CreateAuditLogDto {
  @IsEnum(AuditAction)
  @IsNotEmpty()
  action: AuditAction;

  @IsEnum(AuditResource)
  @IsNotEmpty()
  resource: AuditResource;

  @IsNumber()
  @IsNotEmpty()
  resourceId: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  changes?: any;

  @IsNumber()
  @IsNotEmpty()
  userId: number;

  @IsNumber()
  @IsNotEmpty()
  organizationId: number;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  userAgent?: string;
}
