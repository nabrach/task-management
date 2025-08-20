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

export interface AuditLog {
  id: number;
  action: AuditAction;
  resource: AuditResource;
  resourceId: number;
  description?: string;
  changes?: any;
  userId: number;
  user?: {
    id: number;
    email: string;
    firstName?: string;
    lastName?: string;
    role: string;
  };
  organizationId: number;
  organization?: {
    id: number;
    name: string;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface CreateAuditLogDto {
  action: AuditAction;
  resource: AuditResource;
  resourceId: number;
  description?: string;
  changes?: any;
  userId: number;
  organizationId: number;
  ipAddress?: string;
  userAgent?: string;
}
