import { testProviders } from '../../../test-helpers/test-setup';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TaskListComponent } from './task-list.component';
import { Task } from '@my-workspace/data';

describe('TaskListComponent', () => {
  let component: TaskListComponent;
  let fixture: ComponentFixture<TaskListComponent>;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'new',
    category: 'work',
    completed: false,
    createdAt: new Date('2024-01-01T10:00:00'),
    updatedAt: new Date('2024-01-01T10:00:00'),
    organizationId: 1,
    createdBy: 1,
    assignedTo: 1
  };

  const mockTasks: Task[] = [
    mockTask,
    {
      ...mockTask,
      id: 2,
      title: 'Task 2',
      completed: true,
    },
    {
      ...mockTask,
      id: 3,
      title: 'Task 3',
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskListComponent],
      providers: [...testProviders]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.tasks).toEqual([]);
    });

    it('should have correct inputs and outputs', () => {
      expect(component.tasks).toBeDefined();
      expect(component.edit).toBeDefined();
      expect(component.delete).toBeDefined();
      expect(component.toggleComplete).toBeDefined();
    });
  });

  describe('onEdit', () => {
    it('should emit edit event with task', () => {
      spyOn(component.edit, 'emit');

      component.onEdit(mockTask);

      expect(component.edit.emit).toHaveBeenCalledWith(mockTask);
    });

    it('should handle edit for different tasks', () => {
      spyOn(component.edit, 'emit');
      const differentTask = { ...mockTask, id: 2, title: 'Different Task' };

      component.onEdit(differentTask);

      expect(component.edit.emit).toHaveBeenCalledWith(differentTask);
    });
  });

  describe('onDelete', () => {
    beforeEach(() => {
      spyOn(component.delete, 'emit');
      spyOn(window, 'confirm').and.returnValue(true);
    });

    it('should emit delete event when confirmed', () => {
      component.onDelete(mockTask.id);

      expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this task?');
      expect(component.delete.emit).toHaveBeenCalledWith(mockTask.id);
    });

    it('should not emit delete event when not confirmed', () => {
      (window.confirm as jasmine.Spy).and.returnValue(false);

      component.onDelete(mockTask.id);

      expect(component.delete.emit).not.toHaveBeenCalled();
    });

    it('should handle delete for different task IDs', () => {
      const taskId = 999;

      component.onDelete(taskId);

      expect(component.delete.emit).toHaveBeenCalledWith(taskId);
    });

    it('should handle delete for zero ID', () => {
      component.onDelete(0);

      expect(component.delete.emit).toHaveBeenCalledWith(0);
    });

    it('should handle delete for negative ID', () => {
      component.onDelete(-1);

      expect(component.delete.emit).toHaveBeenCalledWith(-1);
    });
  });

  describe('onToggleComplete', () => {
    it('should emit toggleComplete event with correct data for incomplete task', () => {
      spyOn(component.toggleComplete, 'emit');
      const incompleteTask = { ...mockTask, completed: false };

      component.onToggleComplete(incompleteTask);

      expect(component.toggleComplete.emit).toHaveBeenCalledWith({
        id: incompleteTask.id,
        completed: true
      });
    });

    it('should emit toggleComplete event with correct data for completed task', () => {
      spyOn(component.toggleComplete, 'emit');
      const completedTask = { ...mockTask, completed: true };

      component.onToggleComplete(completedTask);

      expect(component.toggleComplete.emit).toHaveBeenCalledWith({
        id: completedTask.id,
        completed: false
      });
    });

    it('should handle task with undefined completed status', () => {
      spyOn(component.toggleComplete, 'emit');
      const taskWithUndefinedStatus = { ...mockTask, completed: undefined };

      component.onToggleComplete(taskWithUndefinedStatus);

      expect(component.toggleComplete.emit).toHaveBeenCalledWith({
        id: taskWithUndefinedStatus.id,
        completed: true
      });
    });

    it('should handle task with null completed status', () => {
      spyOn(component.toggleComplete, 'emit');
      const taskWithNullStatus = { ...mockTask, completed: null as any };

      component.onToggleComplete(taskWithNullStatus);

      expect(component.toggleComplete.emit).toHaveBeenCalledWith({
        id: taskWithNullStatus.id,
        completed: true
      });
    });
  });

  describe('formatDate', () => {
    it('should format Date object correctly', () => {
      const date = new Date('2024-01-01T10:30:00');
      const result = component.formatDate(date);

      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2} [AP]M/);
    });

    it('should format date string correctly', () => {
      const dateString = '2024-01-01T10:30:00';
      const result = component.formatDate(dateString);

      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2} [AP]M/);
    });

    it('should return empty string for undefined date', () => {
      const result = component.formatDate(undefined);

      expect(result).toBe('');
    });

    it('should return empty string for null date', () => {
      const result = component.formatDate(null as any);

      expect(result).toBe('');
    });

    it('should handle invalid date string', () => {
      const invalidDate = 'invalid-date';
      const result = component.formatDate(invalidDate);

      expect(result).toMatch(/Invalid Date/);
    });

    it('should handle empty date string', () => {
      const emptyDate = '';
      const result = component.formatDate(emptyDate);

      expect(result).toMatch(/Invalid Date/);
    });

    it('should format different date formats consistently', () => {
      const date1 = new Date('2024-01-01T00:00:00');
      const date2 = new Date('2024-12-31T23:59:59');
      const date3 = new Date('2024-06-15T12:30:45');

      const result1 = component.formatDate(date1);
      const result2 = component.formatDate(date2);
      const result3 = component.formatDate(date3);

      expect(result1).toMatch(/\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2} [AP]M/);
      expect(result2).toMatch(/\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2} [AP]M/);
      expect(result3).toMatch(/\d{1,2}\/\d{1,2}\/\d{4} \d{1,2}:\d{2} [AP]M/);
    });
  });

  describe('input handling', () => {
    it('should accept tasks array input', () => {
      component.tasks = mockTasks;

      expect(component.tasks).toEqual(mockTasks);
      expect(component.tasks.length).toBe(3);
    });

    it('should handle empty tasks array', () => {
      component.tasks = [];

      expect(component.tasks).toEqual([]);
      expect(component.tasks.length).toBe(0);
    });

    it('should handle single task', () => {
      component.tasks = [mockTask];

      expect(component.tasks).toEqual([mockTask]);
      expect(component.tasks.length).toBe(1);
    });

    it('should handle large tasks array', () => {
      const largeTasksArray = Array.from({ length: 100 }, (_, i) => ({
        ...mockTask,
        id: i + 1,
        title: `Task ${i + 1}`
      }));
      component.tasks = largeTasksArray;

      expect(component.tasks.length).toBe(100);
      expect(component.tasks[0].id).toBe(1);
      expect(component.tasks[99].id).toBe(100);
    });
  });

  describe('event emission', () => {
    it('should emit edit event multiple times', () => {
      spyOn(component.edit, 'emit');

      component.onEdit(mockTask);
      component.onEdit({ ...mockTask, id: 2 });
      component.onEdit({ ...mockTask, id: 3 });

      expect(component.edit.emit).toHaveBeenCalledTimes(3);
    });

    it('should emit delete event multiple times', () => {
      spyOn(component.delete, 'emit');
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDelete(1);
      component.onDelete(2);
      component.onDelete(3);

      expect(component.delete.emit).toHaveBeenCalledTimes(3);
    });

    it('should emit toggleComplete event multiple times', () => {
      spyOn(component.toggleComplete, 'emit');

      component.onToggleComplete(mockTask);
      component.onToggleComplete({ ...mockTask, id: 2, completed: true });

      expect(component.toggleComplete.emit).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('should handle task with missing properties', () => {
      const incompleteTask = {
        id: 1,
        title: 'Incomplete Task'
      } as Task;

      spyOn(component.edit, 'emit');
      spyOn(component.toggleComplete, 'emit');

      component.onEdit(incompleteTask);
      component.onToggleComplete(incompleteTask);

      expect(component.edit.emit).toHaveBeenCalledWith(incompleteTask);
      expect(component.toggleComplete.emit).toHaveBeenCalledWith({
        id: 1,
        completed: true
      });
    });

    it('should handle rapid event emissions', () => {
      spyOn(component.edit, 'emit');
      spyOn(component.delete, 'emit');
      spyOn(component.toggleComplete, 'emit');
      spyOn(window, 'confirm').and.returnValue(true);

      // Rapid operations
      for (let i = 0; i < 10; i++) {
        component.onEdit({ ...mockTask, id: i });
        component.onDelete(i);
        component.onToggleComplete({ ...mockTask, id: i });
      }

      expect(component.edit.emit).toHaveBeenCalledTimes(10);
      expect(component.delete.emit).toHaveBeenCalledTimes(10);
      expect(component.toggleComplete.emit).toHaveBeenCalledTimes(10);
    });

    it('should handle very large task IDs', () => {
      const largeId = Number.MAX_SAFE_INTEGER;
      spyOn(component.delete, 'emit');
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDelete(largeId);

      expect(component.delete.emit).toHaveBeenCalledWith(largeId);
    });

    it('should handle very small task IDs', () => {
      const smallId = Number.MIN_SAFE_INTEGER;
      spyOn(component.delete, 'emit');
      spyOn(window, 'confirm').and.returnValue(true);

      component.onDelete(smallId);

      expect(component.delete.emit).toHaveBeenCalledWith(smallId);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete task lifecycle', () => {
      spyOn(component.edit, 'emit');
      spyOn(component.delete, 'emit');
      spyOn(component.toggleComplete, 'emit');
      spyOn(window, 'confirm').and.returnValue(true);

      // Create task (input)
      component.tasks = [mockTask];

      // Edit task
      component.onEdit(mockTask);

      // Toggle completion
      component.onToggleComplete(mockTask);

      // Delete task
      component.onDelete(mockTask.id);

      expect(component.tasks).toEqual([mockTask]);
      expect(component.edit.emit).toHaveBeenCalledWith(mockTask);
      expect(component.toggleComplete.emit).toHaveBeenCalledWith({
        id: mockTask.id,
        completed: true
      });
      expect(component.delete.emit).toHaveBeenCalledWith(mockTask.id);
    });

    it('should handle multiple tasks with different operations', () => {
      spyOn(component.edit, 'emit');
      spyOn(component.delete, 'emit');
      spyOn(component.toggleComplete, 'emit');
      spyOn(window, 'confirm').and.returnValue(true);

      component.tasks = mockTasks;

      // Edit first task
      component.onEdit(mockTasks[0]);

      // Toggle second task
      component.onToggleComplete(mockTasks[1]);

      // Delete third task
      component.onDelete(mockTasks[2].id);

      expect(component.edit.emit).toHaveBeenCalledWith(mockTasks[0]);
      expect(component.toggleComplete.emit).toHaveBeenCalledWith({
        id: mockTasks[1].id,
        completed: false
      });
      expect(component.delete.emit).toHaveBeenCalledWith(mockTasks[2].id);
    });
  });
});
