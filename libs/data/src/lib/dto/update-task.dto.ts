export interface UpdateTaskDto {
  title?: string;
  description?: string;
  completed?: boolean;
  status?: 'new' | 'in-progress' | 'completed';
  category?: 'work' | 'personal' | 'other';
  assignedTo?: number;
  organizationId?: number;
}
