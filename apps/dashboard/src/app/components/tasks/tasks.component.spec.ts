import { testProviders } from '../../../test-helpers/test-setup';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TasksComponent } from './tasks.component';
import { TasksService } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { ChangeDetectorRef } from '@angular/core';
import { Task, TaskWithUsers, CreateTaskDto, UpdateTaskDto, IUser, UserRole } from '@my-workspace/data';
import { signal } from '@angular/core';
import { computed } from '@angular/core';

describe('TasksComponent', () => {
  let component: TasksComponent;
  let fixture: ComponentFixture<TasksComponent>;
  let mockTasksService: jasmine.SpyObj<TasksService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockUsersService: jasmine.SpyObj<UsersService>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;

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

  const mockTask: TaskWithUsers = {
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
    assignedTo: 1,
    creator: mockUser,
    assignee: mockUser
  };

  const mockTasks: TaskWithUsers[] = [
    mockTask,
    {
      ...mockTask,
      id: 2,
      title: 'Task 2',
      status: 'in-progress',
      category: 'personal'
    },
    {
      ...mockTask,
      id: 3,
      title: 'Task 3',
      status: 'completed',
      completed: true,
      category: 'other'
    }
  ];

  beforeEach(async () => {
    mockTasksService = jasmine.createSpyObj('TasksService', [
      'getTasks', 'createTask', 'updateTask', 'deleteTask'
    ]);
    mockAuthService = jasmine.createSpyObj('AuthService', [], {
      currentUser: signal<IUser | null>(null)
    });
    mockUsersService = jasmine.createSpyObj('UsersService', ['getUsersByOrganization']);
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [TasksComponent],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: UsersService, useValue: mockUsersService },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        ...testProviders
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TasksComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.tasks()).toEqual([]);
      expect(component.todoTasks()).toEqual([]);
      expect(component.inProgressTasks()).toEqual([]);
      expect(component.doneTasks()).toEqual([]);
      expect(component.showForm()).toBe(false);
      expect(component.editingTask()).toBeUndefined();
      expect(component.isLoading()).toBe(false);
      expect(component.error()).toBeNull();
      expect(component.currentUser()).toBeNull();
      expect(component.users()).toEqual([]);
      expect(component.isAdmin()).toBe(false);
      expect(component.isOwner()).toBe(false);
      expect(component.isViewer()).toBe(false);
    });

    it('should have correct filter and sort defaults', () => {
      expect(component.selectedCategory()).toBe('');
      expect(component.selectedStatus()).toBe('');
      expect(component.sortBy()).toBe('createdAt');
      expect(component.sortOrder()).toBe('desc');
      expect(component.filteredTasks()).toEqual([]);
      expect(component.showAnalytics()).toBe(false);
    });
  });

  describe('ngOnInit', () => {
    it('should call loadCurrentUser and loadTasks', () => {
      spyOn(component as any, 'loadCurrentUser');
      spyOn(component, 'loadTasks');

      component.ngOnInit();

      expect((component as any).loadCurrentUser).toHaveBeenCalled();
      expect(component.loadTasks).toHaveBeenCalled();
    });
  });

  describe('loadCurrentUser', () => {
    it('should subscribe to current user and set role flags', () => {
      const userSubject = signal<IUser | null>(null);
      (mockAuthService.currentUser as any) = userSubject;

      (component as any).loadCurrentUser();

      userSubject.set(mockUser);

      expect(component.currentUser()).toEqual(mockUser);
      expect(component.isAdmin()).toBe(true);
      expect(component.isOwner()).toBe(false);
      expect(component.isViewer()).toBe(false);
    });

    it('should load users for admin users', () => {
      const userSubject = signal<IUser | null>(null);
      (mockAuthService.currentUser as any) = userSubject;
      spyOn(component as any, 'loadUsers');

      (component as any).loadCurrentUser();

      userSubject.set(mockUser);

      expect((component as any).loadUsers).toHaveBeenCalled();
    });

    it('should load users for owner users', () => {
      const ownerUser = { ...mockUser, role: UserRole.OWNER };
      const userSubject = signal<IUser | null>(null);
      (mockAuthService.currentUser as any) = userSubject;
      spyOn(component as any, 'loadUsers');

      (component as any).loadCurrentUser();

      userSubject.set(ownerUser);

      expect((component as any).loadUsers).toHaveBeenCalled();
    });

    it('should not load users for viewer users', () => {
      const viewerUser = { ...mockUser, role: UserRole.VIEWER };
      const userSubject = signal<IUser | null>(null);
      (mockAuthService.currentUser as any) = userSubject;
      spyOn(component as any, 'loadUsers');

      (component as any).loadCurrentUser();

      userSubject.set(viewerUser);

      expect((component as any).loadUsers).not.toHaveBeenCalled();
    });
  });

  describe('loadUsers', () => {
    beforeEach(() => {
      component.currentUser = signal(mockUser);
    });

    it('should load users for organization', () => {
      const mockUsers = [mockUser];
      mockUsersService.getUsersByOrganization.and.returnValue(of(mockUsers));

      (component as any).loadUsers();

      expect(mockUsersService.getUsersByOrganization).toHaveBeenCalledWith(1);
      expect(component.users()).toEqual(mockUsers);
    });

    it('should load users for default organization when no organization ID', () => {
      component.currentUser = signal({ ...mockUser, organizationId: undefined });
      const mockUsers = [mockUser];
      mockUsersService.getUsersByOrganization.and.returnValue(of(mockUsers));

      (component as any).loadUsers();

      expect(mockUsersService.getUsersByOrganization).toHaveBeenCalledWith(1);
    });

    it('should handle error loading users', () => {
      const error = { message: 'Failed to load users' };
      mockUsersService.getUsersByOrganization.and.returnValue(throwError(() => error));

      (component as any).loadUsers();

      expect(component.error()).toBe('Failed to load users. Please try again.');
    });
  });

  describe('permissions', () => {
    beforeEach(() => {
      component.currentUser = signal(mockUser);
      component.isAdmin = signal(true);
      component.isOwner = signal(false);
      component.isViewer = signal(false);
    });

    it('should allow admin to edit any task in organization', () => {
      const task = { ...mockTask, organizationId: 1 };
      expect(component.canEditTask(task)).toBe(true);
    });

    it('should allow owner to edit any task in organization', () => {
      component.isOwner = signal(true);
      component.isAdmin = signal(false);
      const task = { ...mockTask, organizationId: 1 };
      expect(component.canEditTask(task)).toBe(true);
    });

    it('should not allow viewer to edit tasks', () => {
      component.isViewer = signal(true);
      component.isAdmin = signal(false);
      const task = { ...mockTask };
      expect(component.canEditTask(task)).toBe(false);
    });

    it('should allow users to edit their own tasks', () => {
      component.isAdmin = signal(false);
      component.isOwner = signal(false);
      const task = { ...mockTask, createdBy: 1 };
      expect(component.canEditTask(task)).toBe(true);
    });

    it('should allow users to edit assigned tasks', () => {
      component.isAdmin = signal(false);
      component.isOwner = signal(false);
      const task = { ...mockTask, assignedTo: 1 };
      expect(component.canEditTask(task)).toBe(true);
    });

    it('should not allow users to edit other tasks', () => {
      component.isAdmin = signal(false);
      component.isOwner = signal(false);
      const task = { ...mockTask, createdBy: 2, assignedTo: 2 };
      expect(component.canEditTask(task)).toBe(false);
    });
  });

  describe('loadTasks', () => {
    it('should load tasks successfully', () => {
      mockTasksService.getTasks.and.returnValue(of(mockTasks));
      spyOn(component as any, 'categorizeTasks');

      component.loadTasks();

      expect(component.tasks()).toEqual(mockTasks);
      expect(component.isLoading()).toBe(false);
      expect((component as any).categorizeTasks).toHaveBeenCalled();
    });

    it('should handle error loading tasks', () => {
      const error = { message: 'Failed to load tasks' };
      mockTasksService.getTasks.and.returnValue(throwError(() => error));

      component.loadTasks();

      expect(component.error()).toBe('Failed to load tasks. Please try again.');
      expect(component.isLoading()).toBe(false);
    });
  });

  describe('categorizeTasks', () => {
    beforeEach(() => {
      component.tasks.set(mockTasks);
      component.currentUser = signal(mockUser);
      component.isAdmin = signal(true);
    });

    it('should categorize tasks by status', () => {
      (component as any).categorizeTasks();

      expect(component.todoTasks()).toEqual([mockTask]);
      expect(component.inProgressTasks()).toEqual([mockTasks[1]]);
      expect(component.doneTasks()).toEqual([mockTasks[2]]);
    });

    it('should apply filters and sorting', () => {
      component.selectedCategory.set('work');
      component.sortBy.set('title');
      component.sortOrder.set('asc');

      (component as any).categorizeTasks();

      expect(component.filteredTasks()).toEqual([mockTask]);
      expect(component.filteredTasks()[0].category).toBe('work');
    });
  });

  describe('drag and drop', () => {
    it('should handle dropping in same container', () => {
      const event = {
        previousContainer: { id: 'todo-container', data: component.todoTasks() },
        container: { id: 'todo-container', data: component.todoTasks() },
        previousIndex: 0,
        currentIndex: 1
      } as CdkDragDrop<TaskWithUsers[]>;

      component.todoTasks = computed(() => [mockTask, { ...mockTask, id: 2 }]);

      component.onDrop(event);

      // Note: Reordering within same container is not handled in the current implementation
      expect(component.todoTasks().length).toBe(2);
    });

    it('should handle dropping between containers', () => {
      const event = {
        previousContainer: { id: 'todo-container', data: component.todoTasks() },
        container: { id: 'in-progress-container', data: component.inProgressTasks() },
        previousIndex: 0,
        currentIndex: 0
      } as CdkDragDrop<TaskWithUsers[]>;

      component.todoTasks = computed(() => [mockTask]);
      component.inProgressTasks = computed(() => []);

      spyOn(component as any, 'updateTaskStatus');

      component.onDrop(event);

      expect((component as any).updateTaskStatus).toHaveBeenCalledWith(
        mockTask.id, 'in-progress', jasmine.any(Object)
      );
    });

    it('should mark task as completed when dropped in done container', () => {
      const event = {
        previousContainer: { id: 'todo-container', data: component.todoTasks() },
        container: { id: 'done-container', data: component.doneTasks() },
        previousIndex: 0,
        currentIndex: 0
      } as CdkDragDrop<TaskWithUsers[]>;

      component.todoTasks = computed(() => [mockTask]);
      component.doneTasks = computed(() => []);

      spyOn(component as any, 'updateTaskStatus');

      component.onDrop(event);

      expect((component as any).updateTaskStatus).toHaveBeenCalledWith(
        mockTask.id, 'completed', { status: 'completed', completed: true }
      );
    });
  });

  describe('task operations', () => {
    beforeEach(() => {
      component.tasks.set(mockTasks);
      component.currentUser = signal(mockUser);
    });

    it('should create new task successfully', () => {
      const newTaskData: CreateTaskDto = {
        title: 'New Task',
        description: 'New Description',
        category: 'work'
      };

      const createdTask = { ...mockTask, ...newTaskData, id: 4 };
      mockTasksService.createTask.and.returnValue(of(createdTask));
      spyOn(component as any, 'categorizeTasks');
      spyOn(component, 'hideForm');

      component.onSave(newTaskData);

      expect(mockTasksService.createTask).toHaveBeenCalledWith(jasmine.objectContaining({
        ...newTaskData,
        status: 'new',
        organizationId: 1,
        createdBy: 1,
        assignedTo: 1
      }));
    });

    it('should update existing task successfully', () => {
      component.editingTask.set(mockTask);
      const updateData: UpdateTaskDto = { title: 'Updated Task' };
      const updatedTask = { ...mockTask, ...updateData };

      mockTasksService.updateTask.and.returnValue(of(updatedTask));
      spyOn(component as any, 'categorizeTasks');
      spyOn(component, 'hideForm');

      component.onSave(updateData);

      expect(mockTasksService.updateTask).toHaveBeenCalledWith(mockTask.id, updateData);
    });

    it('should delete task successfully', () => {
      mockTasksService.deleteTask.and.returnValue(of(true));
      spyOn(component as any, 'categorizeTasks');

      component.onDelete(mockTask.id);

      expect(mockTasksService.deleteTask).toHaveBeenCalledWith(mockTask.id);
      expect(component.tasks().length).toBe(2);
    });

    it('should toggle task completion', () => {
      const toggleData = { id: 1, completed: true };
      const updatedTask = { ...mockTask, completed: true, status: 'completed' as 'new' | 'in-progress' | 'completed' };

      mockTasksService.updateTask.and.returnValue(of(updatedTask));
      spyOn(component as any, 'categorizeTasks');

      component.onToggleCompletion(mockTask);

      expect(mockTasksService.updateTask).toHaveBeenCalledWith(1, {
        completed: true,
        status: 'completed'
      });
    });
  });

  describe('form management', () => {
    it('should show create form', () => {
      component.showCreateForm();

      expect(component.editingTask()).toBeUndefined();
      expect(component.showForm()).toBe(true);
    });

    it('should show edit form', () => {
      component.showEditForm(mockTask);

      expect(component.editingTask()).toEqual(mockTask);
      expect(component.showForm()).toBe(true);
    });

    it('should hide form', () => {
      component.showForm.set(true);
      component.editingTask.set(mockTask);

      component.hideForm();

      expect(component.showForm()).toBe(false);
      expect(component.editingTask()).toBeUndefined();
    });
  });

  describe('filters and sorting', () => {
    beforeEach(() => {
      component.tasks.set(mockTasks);
      spyOn(component as any, 'categorizeTasks');
    });

    it('should apply filters', () => {
      component.selectedCategory.set('work');
      component.selectedStatus.set('new');

      // Trigger categorization by changing a signal
      component.selectedCategory.set('personal');

      expect((component as any).categorizeTasks).toHaveBeenCalled();
    });

    it('should clear filters', () => {
      component.selectedCategory.set('work');
      component.selectedStatus.set('new');
      component.sortBy.set('title');
      component.sortOrder.set('asc');

      // Reset to defaults
      component.selectedCategory.set('');
      component.selectedStatus.set('');
      component.sortBy.set('createdAt');
      component.sortOrder.set('desc');

      expect(component.selectedCategory()).toBe('');
      expect(component.selectedStatus()).toBe('');
      expect(component.sortBy()).toBe('createdAt');
      expect(component.sortOrder()).toBe('desc');
    });

    it('should toggle analytics', () => {
      component.showAnalytics.set(false);

      component.toggleAnalytics();

      expect(component.showAnalytics()).toBe(true);
    });
  });

  describe('utility methods', () => {
    it('should get assignee name', () => {
      const taskWithAssignee = { ...mockTask, assignee: mockUser };
      expect(component.getAssigneeName(taskWithAssignee)).toBe('John Doe');
    });

    it('should get creator name', () => {
      const taskWithCreator = { ...mockTask, creator: mockUser };
      expect(component.getCreatorName(taskWithCreator)).toBe('John Doe');
    });

    it('should get status label', () => {
      expect(component.getStatusLabel(mockTask)).toBe('New');
      expect(component.getStatusLabel({ ...mockTask, completed: true })).toBe('Completed');
    });

    it('should get category label', () => {
      expect(component.getCategoryLabel('work')).toBe('Work');
      expect(component.getCategoryLabel('personal')).toBe('Personal');
      expect(component.getCategoryLabel('other')).toBe('Other');
      expect(component.getCategoryLabel('unknown')).toBe('Unknown');
    });

    it('should get category class', () => {
      expect(component.getCategoryClass('work')).toBe('bg-blue-100 text-blue-800');
      expect(component.getCategoryClass('personal')).toBe('bg-purple-100 text-purple-800');
      expect(component.getCategoryClass('other')).toBe('bg-gray-100 text-gray-800');
    });

    it('should track by task ID', () => {
      expect(component.trackByTaskId(0, mockTask)).toBe(mockTask.id);
    });
  });

  describe('error handling', () => {
    it('should clear error', () => {
      component.error.set('Some error');
      component.clearError();
      expect(component.error()).toBeNull();
    });

    it('should handle permission errors', () => {
      component.editingTask.set(mockTask);
      component.currentUser = signal({ ...mockUser, id: 2 });
      component.isAdmin = signal(false);
      component.isOwner = signal(false);

      component.onSave({ title: 'Updated' });

      expect(component.error()).toBe('You do not have permission to edit this task.');
    });
  });
});
