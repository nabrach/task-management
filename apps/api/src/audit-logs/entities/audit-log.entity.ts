import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  COMPLETE = 'complete',
  ASSIGN = 'assign',
  STATUS_CHANGE = 'status_change'
}

export enum AuditResource {
  TASK = 'task',
  USER = 'user',
  ORGANIZATION = 'organization'
}

@Entity('audit_logs')
export class AuditLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50 })
  action: AuditAction;

  @Column({ type: 'varchar', length: 50 })
  resource: AuditResource;

  @Column({ type: 'int', name: 'resource_id' })
  resourceId: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'json', nullable: true })
  changes: any; // Store before/after values for updates

  @Column({ type: 'int', name: 'user_id' })
  userId: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'int', name: 'organization_id' })
  organizationId: number;

  @ManyToOne(() => Organization, { nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Column({ type: 'varchar', length: 45, nullable: true })
  ipAddress: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  userAgent: string;

  @CreateDateColumn()
  createdAt: Date;
}
