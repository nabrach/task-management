export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  VIEWER = 'viewer'
}

export interface IUser {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  organizationId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateUser {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  organizationId?: number;
}

export interface IUpdateUser {
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  organizationId?: number;
}
