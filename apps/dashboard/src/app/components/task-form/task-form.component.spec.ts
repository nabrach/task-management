import { testProviders } from '../../../test-helpers/test-setup';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { TaskFormComponent } from './task-form.component';
import { Task, CreateTaskDto, UpdateTaskDto, IUser, UserRole } from '@my-workspace/data';

describe('TaskFormComponent', () => {
  let component: TaskFormComponent;
  let fixture: ComponentFixture<TaskFormComponent>;

  const mockUser: IUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.ADMIN,
    organizationId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'new',
    category: 'work',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    organizationId: 1,
    createdBy: 1,
    assignedTo: 1
  };

  const mockUsers: IUser[] = [
    mockUser,
    {
      id: 2,
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.VIEWER,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TaskFormComponent, ReactiveFormsModule],
      providers: [...testProviders]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskFormComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.task).toBeUndefined();
      expect(component.users).toEqual([]);
      expect(component.currentUser).toBeNull();
      expect(component.isAdmin).toBe(false);
      expect(component.isOwner).toBe(false);
      expect(component.isViewer).toBe(false);
    });

    it('should create form with correct structure', () => {
      expect(component.taskForm).toBeDefined();
      expect(component.taskForm.get('title')).toBeDefined();
      expect(component.taskForm.get('description')).toBeDefined();
      expect(component.taskForm.get('completed')).toBeDefined();
      expect(component.taskForm.get('status')).toBeDefined();
      expect(component.taskForm.get('category')).toBeDefined();
      expect(component.taskForm.get('assignedTo')).toBeDefined();
      expect(component.taskForm.get('organizationId')).toBeDefined();
    });

    it('should have correct form validators', () => {
      const titleControl = component.taskForm.get('title');
      const statusControl = component.taskForm.get('status');
      const categoryControl = component.taskForm.get('category');
      const organizationIdControl = component.taskForm.get('organizationId');

      expect(titleControl?.hasValidator(Validators.required)).toBe(true);
      expect(titleControl?.hasValidator(Validators.minLength(1))).toBe(true);
      expect(statusControl?.hasValidator(Validators.required)).toBe(true);
      expect(categoryControl?.hasValidator(Validators.required)).toBe(true);
      expect(organizationIdControl?.hasValidator(Validators.required)).toBe(true);
    });
  });

  describe('ngOnInit', () => {
    it('should call resetForm on initialization', () => {
      spyOn(component as any, 'resetForm');

      component.ngOnInit();

      expect((component as any).resetForm).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should reset form when task input changes', () => {
      spyOn(component as any, 'resetForm');
      const changes = {
        task: {
          currentValue: mockTask,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        }
      };

      component.ngOnChanges(changes);

      expect((component as any).resetForm).toHaveBeenCalled();
    });

    it('should reset form when currentUser input changes', () => {
      spyOn(component as any, 'resetForm');
      const changes = {
        currentUser: {
          currentValue: mockUser,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      };

      component.ngOnChanges(changes);

      expect((component as any).resetForm).toHaveBeenCalled();
    });

    it('should not reset form for unrelated changes', () => {
      spyOn(component as any, 'resetForm');
      const changes = {
        users: {
          currentValue: mockUsers,
          previousValue: [],
          firstChange: true,
          isFirstChange: () => true
        }
      };

      component.ngOnChanges(changes);

      expect((component as any).resetForm).not.toHaveBeenCalled();
    });

    it('should handle multiple changes', () => {
      spyOn(component as any, 'resetForm');
      const changes = {
        task: {
          currentValue: mockTask,
          previousValue: undefined,
          firstChange: true,
          isFirstChange: () => true
        },
        currentUser: {
          currentValue: mockUser,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      };

      component.ngOnChanges(changes);

      expect((component as any).resetForm).toHaveBeenCalled();
    });
  });

  describe('resetForm', () => {
    it('should populate form with task data in edit mode', () => {
      component.task = mockTask;

      (component as any).resetForm();

      expect(component.taskForm.get('title')?.value).toBe('Test Task');
      expect(component.taskForm.get('description')?.value).toBe('Test Description');
      expect(component.taskForm.get('completed')?.value).toBe(false);
      expect(component.taskForm.get('status')?.value).toBe('new');
      expect(component.taskForm.get('category')?.value).toBe('work');
      expect(component.taskForm.get('assignedTo')?.value).toBe(1);
      expect(component.taskForm.get('organizationId')?.value).toBe(1);
    });

    it('should set default values in create mode', () => {
      component.currentUser = mockUser;

      (component as any).resetForm();

      expect(component.taskForm.get('title')?.value).toBe('');
      expect(component.taskForm.get('description')?.value).toBeUndefined();
      expect(component.taskForm.get('completed')?.value).toBe(false);
      expect(component.taskForm.get('status')?.value).toBe('new');
      expect(component.taskForm.get('category')?.value).toBe('work');
      expect(component.taskForm.get('assignedTo')?.value).toBeUndefined();
      expect(component.taskForm.get('organizationId')?.value).toBe(1);
    });

    it('should handle task with missing optional fields', () => {
      const incompleteTask = {
        ...mockTask,
        description: undefined,
        assignedTo: undefined
      };
      component.task = incompleteTask;

      (component as any).resetForm();

      expect(component.taskForm.get('description')?.value).toBeUndefined();
      expect(component.taskForm.get('assignedTo')?.value).toBeUndefined();
    });

    it('should handle currentUser with missing organizationId', () => {
      const userWithoutOrg = { ...mockUser, organizationId: undefined };
      component.currentUser = userWithoutOrg;

      (component as any).resetForm();

      expect(component.taskForm.get('organizationId')?.value).toBe(1);
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      spyOn(component.save, 'emit');
      spyOn(component as any, 'resetForm');
    });

    it('should emit form data when form is valid', () => {
      component.taskForm.patchValue({
        title: 'New Task',
        description: 'New Description',
        status: 'new',
        category: 'work',
        organizationId: 1
      });

      component.onSubmit();

      expect(component.save.emit).toHaveBeenCalledWith({
        title: 'New Task',
        description: 'New Description',
        status: 'new',
        category: 'work',
        organizationId: 1
      });
    });

    it('should not emit when form is invalid', () => {
      component.taskForm.patchValue({
        title: '', // Invalid - required field empty
        status: 'new',
        category: 'work',
        organizationId: 1
      });

      component.onSubmit();

      expect(component.save.emit).not.toHaveBeenCalled();
    });

    it('should reset form after create submission', () => {
      component.taskForm.patchValue({
        title: 'New Task',
        status: 'new',
        category: 'work',
        organizationId: 1
      });

      component.onSubmit();

      expect((component as any).resetForm).toHaveBeenCalled();
    });

    it('should not reset form after edit submission', () => {
      component.task = mockTask;
      component.taskForm.patchValue({
        title: 'Updated Task',
        status: 'new',
        category: 'work',
        organizationId: 1
      });

      component.onSubmit();

      expect((component as any).resetForm).toHaveBeenCalled();
    });
  });

  describe('cleanFormData', () => {
    it('should remove undefined values', () => {
      const data = {
        title: 'Task',
        description: undefined,
        status: 'new',
        category: 'work',
        organizationId: 1
      };

      const result = (component as any).cleanFormData(data);

      expect(result.description).toBeUndefined();
      expect(result.title).toBe('Task');
    });

    it('should remove empty strings for optional fields', () => {
      const data = {
        title: 'Task',
        description: '',
        status: 'new',
        category: 'work',
        organizationId: 1
      };

      const result = (component as any).cleanFormData(data);

      expect(result.description).toBeUndefined();
    });

    it('should convert assignedTo to number', () => {
      const data = {
        title: 'Task',
        assignedTo: '2',
        status: 'new',
        category: 'work',
        organizationId: 1
      };

      const result = (component as any).cleanFormData(data);

      expect(result.assignedTo).toBe(2);
    });

    it('should convert organizationId to number', () => {
      const data = {
        title: 'Task',
        status: 'new',
        category: 'work',
        organizationId: '3'
      };

      const result = (component as any).cleanFormData(data);

      expect(result.organizationId).toBe(3);
    });

    it('should convert completed to boolean', () => {
      const data = {
        title: 'Task',
        completed: 'true',
        status: 'new',
        category: 'work',
        organizationId: 1
      };

      const result = (component as any).cleanFormData(data);

      expect(result.completed).toBe(true);
    });

    it('should handle null values', () => {
      const data = {
        title: 'Task',
        assignedTo: null,
        status: 'new',
        category: 'work',
        organizationId: 1
      };

      const result = (component as any).cleanFormData(data);

      expect(result.assignedTo).toBeUndefined();
    });
  });

  describe('onCancel', () => {
    it('should emit cancel event', () => {
      spyOn(component.cancel, 'emit');

      component.onCancel();

      expect(component.cancel.emit).toHaveBeenCalled();
    });
  });

  describe('clearForm', () => {
    it('should call resetForm', () => {
      spyOn(component as any, 'resetForm');

      component.clearForm();

      expect((component as any).resetForm).toHaveBeenCalled();
    });
  });

  describe('getUserDisplayName', () => {
    it('should return full name with email when both names exist', () => {
      const user = {
        ...mockUser,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com'
      };

      const result = component.getUserDisplayName(user);

      expect(result).toBe('John Doe (john@example.com)');
    });

    it('should return only email when names are missing', () => {
      const user = {
        ...mockUser,
        firstName: undefined,
        lastName: undefined,
        email: 'john@example.com'
      };

      const result = component.getUserDisplayName(user);

      expect(result).toBe('john@example.com');
    });

    it('should return only email when names are empty strings', () => {
      const user = {
        ...mockUser,
        firstName: '',
        lastName: '',
        email: 'john@example.com'
      };

      const result = component.getUserDisplayName(user);

      expect(result).toBe('john@example.com');
    });

    it('should handle partial names', () => {
      const user = {
        ...mockUser,
        firstName: 'John',
        lastName: undefined,
        email: 'john@example.com'
      };

      const result = component.getUserDisplayName(user);

      expect(result).toBe('john@example.com');
    });
  });

  describe('form validation', () => {
    it('should be invalid when title is empty', () => {
      component.taskForm.patchValue({
        title: '',
        status: 'new',
        category: 'work',
        organizationId: 1
      });

      expect(component.taskForm.valid).toBe(false);
    });

    it('should be invalid when status is missing', () => {
      component.taskForm.patchValue({
        title: 'Task',
        status: '',
        category: 'work',
        organizationId: 1
      });

      expect(component.taskForm.valid).toBe(false);
    });

    it('should be invalid when category is missing', () => {
      component.taskForm.patchValue({
        title: 'Task',
        status: 'new',
        category: '',
        organizationId: 1
      });

      expect(component.taskForm.valid).toBe(false);
    });

    it('should be invalid when organizationId is missing', () => {
      component.taskForm.patchValue({
        title: 'Task',
        status: 'new',
        category: 'work',
        organizationId: ''
      });

      expect(component.taskForm.valid).toBe(false);
    });

    it('should be valid with all required fields', () => {
      component.taskForm.patchValue({
        title: 'Task',
        status: 'new',
        category: 'work',
        organizationId: 1
      });

      expect(component.taskForm.valid).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle form with all optional fields undefined', () => {
      const data = {
        title: 'Task',
        status: 'new',
        category: 'work',
        organizationId: 1
      };

      const result = (component as any).cleanFormData(data);

      expect(result).toEqual(data);
    });

    it('should handle form with mixed data types', () => {
      const data = {
        title: 'Task',
        description: 'Description',
        completed: 'false',
        status: 'new',
        category: 'work',
        assignedTo: '5',
        organizationId: '10'
      };

      const result = (component as any).cleanFormData(data);

      expect(result.completed).toBe(false);
      expect(result.assignedTo).toBe(5);
      expect(result.organizationId).toBe(10);
    });

    it('should handle rapid form changes', () => {
      component.task = mockTask;
      (component as any).resetForm();

      component.task = { ...mockTask, title: 'Updated Task' };
      (component as any).resetForm();

      expect(component.taskForm.get('title')?.value).toBe('Updated Task');
    });
  });
});
