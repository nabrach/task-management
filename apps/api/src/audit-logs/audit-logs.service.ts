import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, AuditAction, AuditResource } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogsRepository: Repository<AuditLog>,
  ) {}

  async create(createAuditLogDto: CreateAuditLogDto): Promise<AuditLog> {
    const auditLog = this.auditLogsRepository.create(createAuditLogDto);
    return await this.auditLogsRepository.save(auditLog);
  }

  async logTaskAction(
    action: AuditAction,
    taskId: number,
    userId: number,
    organizationId: number,
    description: string,
    changes?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.create({
      action,
      resource: AuditResource.TASK,
      resourceId: taskId,
      description,
      changes,
      userId,
      organizationId,
      ipAddress,
      userAgent,
    });
  }

  async logUserAction(
    action: AuditAction,
    targetUserId: number,
    userId: number,
    organizationId: number,
    description: string,
    changes?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.create({
      action,
      resource: AuditResource.USER,
      resourceId: targetUserId,
      description,
      changes,
      userId,
      organizationId,
      ipAddress,
      userAgent,
    });
  }

  async logOrganizationAction(
    action: AuditAction,
    organizationId: number,
    userId: number,
    description: string,
    changes?: any,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<AuditLog> {
    return this.create({
      action,
      resource: AuditResource.ORGANIZATION,
      resourceId: organizationId,
      description,
      changes,
      userId,
      organizationId,
      ipAddress,
      userAgent,
    });
  }

  async findByOrganization(
    organizationId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await this.auditLogsRepository.findAndCount({
      where: { organizationId },
      relations: ['user', 'organization'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { logs, total };
  }

  async findByUser(
    userId: number,
    organizationId: number,
    page: number = 1,
    limit: number = 50,
  ): Promise<{ logs: AuditLog[]; total: number }> {
    const [logs, total] = await this.auditLogsRepository.findAndCount({
      where: { userId, organizationId },
      relations: ['user', 'organization'],
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { logs, total };
  }

  async findByResource(
    resource: AuditResource,
    resourceId: number,
    organizationId: number,
  ): Promise<AuditLog[]> {
    return await this.auditLogsRepository.find({
      where: { resource, resourceId, organizationId },
      relations: ['user', 'organization'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRecentActivity(
    organizationId: number,
    days: number = 7,
  ): Promise<AuditLog[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);

    return await this.auditLogsRepository
      .createQueryBuilder('auditLog')
      .leftJoinAndSelect('auditLog.user', 'user')
      .leftJoinAndSelect('auditLog.organization', 'organization')
      .where('auditLog.organizationId = :organizationId', { organizationId })
      .andWhere('auditLog.createdAt >= :date', { date })
      .orderBy('auditLog.createdAt', 'DESC')
      .getMany();
  }
}
