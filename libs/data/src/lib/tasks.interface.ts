export interface Task {
  id: number;
  title: string;
  description?: string;
  completed?: boolean;
  status: 'new' | 'in-progress' | 'completed';
  category?: 'work' | 'personal' | 'other';
  createdAt?: Date | string;
  updatedAt?: Date | string;
  createdBy?: number; // User ID of the task creator (nullable during migration)
  assignedTo?: number; // User ID of the assigned user (optional)
  organizationId?: number; // Organization ID the task belongs to (nullable during migration)
}

export interface TaskWithUsers extends Task {
  creator?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
  };
  assignee?: {
    id: number;
    firstName?: string;
    lastName?: string;
    email: string;
    role: string;
  };
}
