import { Component, OnInit, Output, AfterViewInit, ViewChild, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Task, TaskWithUsers, CreateTaskDto, UpdateTaskDto, IUser, UserRole } from '@my-workspace/data';
import { TasksService } from '../../services/tasks.service';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { TaskFormComponent } from '../task-form/task-form.component';
import { TaskAnalyticsComponent } from '../task-analytics/task-analytics.component';

@Component({
  selector: 'app-tasks',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule, TaskFormComponent, TaskAnalyticsComponent],
  templateUrl: './tasks.component.html',
  styleUrls: ['./tasks.component.css']
})
export class TasksComponent implements OnInit, AfterViewInit {
  @ViewChild('taskForm') taskFormComponent!: TaskFormComponent;
  
  // Convert arrays to signals
  public tasks = signal<TaskWithUsers[]>([]);
  public users = signal<IUser[]>([]);
  
  // Computed values for categorized tasks
  public todoTasks = computed(() => 
    this.filterTasksByUser(this.tasks()).filter(task => task.status === 'new')
  );
  
  public inProgressTasks = computed(() => 
    this.filterTasksByUser(this.tasks()).filter(task => task.status === 'in-progress')
  );
  
  public doneTasks = computed(() => 
    this.filterTasksByUser(this.tasks()).filter(task => task.status === 'completed')
  );
  
  // UI state signals
  public showForm = signal(false);
  public editingTask = signal<Task | undefined>(undefined);
  public isLoading = signal(false);
  public error = signal<string | null>(null);
  public showAnalytics = signal(false);
  
  // Filter and sort signals
  public selectedCategory = signal('');
  public selectedStatus = signal('');
  public sortBy = signal('createdAt');
  public sortOrder = signal('desc');
  
  // Computed filtered tasks
  public filteredTasks = computed(() => {
    let tasks = this.tasks();
    
    // Apply category filter
    if (this.selectedCategory()) {
      tasks = tasks.filter(task => task.category === this.selectedCategory());
    }
    
    // Apply status filter
    if (this.selectedStatus()) {
      tasks = tasks.filter(task => task.status === this.selectedStatus());
    }
    
    // Apply sorting
    const sortBy = this.sortBy();
    const sortOrder = this.sortOrder();
    
    tasks.sort((a, b) => {
      let aValue = a[sortBy as keyof TaskWithUsers];
      let bValue = b[sortBy as keyof TaskWithUsers];
      
      // Handle undefined values
      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return sortOrder === 'asc' ? -1 : 1;
      if (bValue === undefined) return sortOrder === 'asc' ? 1 : -1;
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    
    return tasks;
  });
  
  // User state signals (will be initialized in ngOnInit)
  public currentUser: any;
  public isOwner: any;
  public isAdmin: any;
  public isViewer: any;

  constructor(
    private tasksService: TasksService,
    private authService: AuthService,
    private usersService: UsersService
  ) {
    // Effect to automatically load users when user changes
    effect(() => {
      const user = this.currentUser?.();
      if (user && (this.isOwner?.() || this.isAdmin?.())) {
        this.loadUsers();
      }
    });
  }

  ngOnInit() {
    // Initialize computed values after constructor
    this.currentUser = this.authService.currentUser;
    this.isOwner = computed(() => this.currentUser()?.role === UserRole.OWNER);
    this.isAdmin = computed(() => this.currentUser()?.role === UserRole.ADMIN);
    this.isViewer = computed(() => this.currentUser()?.role === UserRole.VIEWER);
    
    this.loadCurrentUser();
    this.loadTasks();
  }

  ngAfterViewInit() {
    console.log('TasksComponent: ngAfterViewInit called');
  }

  private loadCurrentUser() {
    // User is already loaded via signal, no need to subscribe
    console.log('TasksComponent: Current user loaded via signal');
  }

  private loadUsers() {
    const user = this.currentUser();
    if (user?.organizationId) {
      console.log('Loading users for organization:', user.organizationId);
      this.usersService.getUsersByOrganization(user.organizationId).subscribe({
        next: (users) => {
          console.log('Users loaded:', users);
          this.users.set(users);
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.error.set('Failed to load users. Please try again.');
        }
      });
    } else {
      console.log('Loading users for default organization: 1');
      this.usersService.getUsersByOrganization(1).subscribe({
        next: (users) => {
          console.log('Users loaded for default organization:', users);
          this.users.set(users);
        },
        error: (error) => {
          console.error('Error loading users for default organization:', error);
          this.error.set('Failed to load users. Please try again.');
        }
      });
    }
  }

  public canEditTask(task: Task): boolean {
    const user = this.currentUser();
    if (!user) return false;
    
    // Owner and Admin can edit any task in their organization
    if ((this.isOwner() || this.isAdmin()) && (task.organizationId || 1) === (user.organizationId || 1)) {
      return true;
    }
    
    // Viewers cannot edit tasks
    if (this.isViewer()) return false;
    
    // Regular users can only edit tasks they created or are assigned to
    return (task.createdBy || 0) === user.id || (task.assignedTo || 0) === user.id;
  }

  public canDeleteTask(task: Task): boolean {
    const user = this.currentUser();
    if (!user) return false;
    
    // Owner and Admin can delete any task in their organization
    if ((this.isOwner() || this.isAdmin()) && (task.organizationId || 1) === (user.organizationId || 1)) {
      return true;
    }
    
    // Viewers cannot delete tasks
    if (this.isViewer()) return false;
    
    // Regular users can only delete tasks they created
    return (task.createdBy || 0) === user.id;
  }

  public getAssigneeName(task: TaskWithUsers): string {
    if (!task.assignee) return '';
    return task.assignee.firstName && task.assignee.lastName 
      ? `${task.assignee.firstName} ${task.assignee.lastName}` 
      : task.assignee.email;
  }

  public getCreatorName(task: TaskWithUsers): string {
    if (!task.creator) return '';
    return task.creator.firstName && task.creator.lastName 
      ? `${task.creator.firstName} ${task.creator.lastName}` 
      : task.creator.email;
  }

  public getStatusLabel(task: TaskWithUsers): string {
    if (task.completed) return 'Completed';
    switch (task.status) {
      case 'new': return 'New';
      case 'in-progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Unknown';
    }
  }

  private filterTasksByUser(tasks: Task[]): Task[] {
    const user = this.currentUser();
    if (!user) return [];
    
    if (this.isOwner() || this.isAdmin()) {
      // Owner and Admin see all tasks in their organization
      return tasks.filter(task => (task.organizationId || 1) === (user.organizationId || 1));
    } else if (this.isViewer()) {
      // Viewers see tasks they created or are assigned to
      return tasks.filter(task => 
        (task.createdBy || 0) === user.id || 
        (task.assignedTo || 0) === user.id
      );
    } else {
      // Regular users see tasks they created or are assigned to
      return tasks.filter(task => 
        (task.createdBy || 0) === user.id || 
        (task.assignedTo || 0) === user.id
      );
    }
  }

  loadTasks() {
    console.log('TasksComponent: loadTasks called');
    
    this.isLoading.set(true);
    this.error.set(null);
    
    this.tasksService.getTasks().subscribe({
      next: (tasks) => {
        console.log('TasksComponent: Tasks loaded successfully:', tasks);
        this.tasks.set(tasks);
        this.isLoading.set(false);
      },
      error: (error) => {
        console.error('TasksComponent: Error loading tasks:', error);
        this.error.set('Failed to load tasks. Please try again.');
        this.isLoading.set(false);
      }
    });
  }

  onDrop(event: CdkDragDrop<Task[]>) {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
      
      // Update the task status based on the new container
      const task = event.container.data[event.currentIndex];
      const newStatus = this.getStatusFromContainer(event.container.id);
      
      if (task && newStatus) {
        // If task is moved to Completed column, automatically mark it as completed
        const shouldMarkCompleted = newStatus === 'completed';
        const updateData: UpdateTaskDto = { 
          status: newStatus,
          ...(shouldMarkCompleted && { completed: true })
        };
        
        this.updateTaskStatus(task.id, newStatus, updateData);
      }
    }
  }

  private getStatusFromContainer(containerId: string): 'new' | 'in-progress' | 'completed' | null {
    switch (containerId) {
      case 'todo-container':
        return 'new';
      case 'in-progress-container':
        return 'in-progress';
      case 'done-container':
        return 'completed';
      default:
        return null;
    }
  }

  private updateTaskStatus(taskId: number, newStatus: 'new' | 'in-progress' | 'completed', updateData: UpdateTaskDto) {
    this.tasksService.updateTask(taskId, updateData).subscribe({
      next: (updatedTask) => {
        console.log('Task status updated successfully:', updatedTask);
        
        // Update the task in the main tasks array
        this.tasks.update(tasks => {
          const index = tasks.findIndex(t => t.id === updatedTask.id);
          if (index !== -1) {
            const newTasks = [...tasks];
            newTasks[index] = updatedTask;
            return newTasks;
          }
          return tasks;
        });
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        this.error.set('Failed to update task status. Please try again.');
      }
    });
  }

  showCreateForm() {
    this.editingTask.set(undefined);
    this.showForm.set(true);
    console.log('Showing create form');
  }

  showEditForm(task: Task) {
    this.editingTask.set(task);
    this.showForm.set(true);
    console.log('Showing edit form for task:', task.id);
  }

  hideForm() {
    console.log('TasksComponent: hideForm called');
    
    if (this.taskFormComponent) {
      console.log('TasksComponent: Clearing form before hiding');
      this.taskFormComponent.clearForm();
    }
    
    this.showForm.set(false);
    this.editingTask.set(undefined);
    
    console.log('TasksComponent: Form hidden, showForm:', this.showForm());
  }

  onSave(taskData: CreateTaskDto | UpdateTaskDto) {
    const editingTask = this.editingTask();
    
    if (editingTask) {
      // Update existing task
      console.log('TasksComponent: Updating task:', editingTask.id, taskData);
      
      // Check if user has permission to edit this task
      if (!this.canEditTask(editingTask)) {
        this.error.set('You do not have permission to edit this task.');
        return;
      }
      
      this.tasksService.updateTask(editingTask.id, taskData as UpdateTaskDto).subscribe({
        next: (updatedTask) => {
          console.log('TasksComponent: Task updated successfully:', updatedTask);
          
          // Update the task in the main tasks array
          this.tasks.update(tasks => {
            const index = tasks.findIndex(t => t.id === updatedTask.id);
            if (index !== -1) {
              const newTasks = [...tasks];
              newTasks[index] = updatedTask;
              return newTasks;
            }
            return tasks;
          });
          
          this.hideForm();
          this.error.set(null);
        },
        error: (error) => {
          console.error('TasksComponent: Error updating task:', error);
          this.error.set('Failed to update task. Please try again.');
        }
      });
    } else {
      // Create new task
      console.log('TasksComponent: Creating new task:', taskData);
      const user = this.currentUser();
      const newTaskData = { 
        ...taskData, 
        status: 'new',
        organizationId: user?.organizationId || 1,
        createdBy: user?.id || 1
      } as CreateTaskDto;
      
      // If no user is assigned, assign to the creator
      if (!newTaskData.assignedTo) {
        newTaskData.assignedTo = user?.id || 1;
      }
      
      this.tasksService.createTask(newTaskData).subscribe({
        next: (newTask) => {
          console.log('TasksComponent: Task created successfully:', newTask);
          
          // Add the new task to the tasks array
          this.tasks.update(tasks => [newTask, ...tasks]);
          
          console.log('TasksComponent: New task added to arrays. Total tasks:', this.tasks().length);
          
          this.hideForm();
          this.error.set(null);
        },
        error: (error) => {
          console.error('TasksComponent: Error creating task:', error);
          this.error.set('Failed to create task. Please try again.');
        }
      });
    }
  }

  onDelete(taskId: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.tasksService.deleteTask(taskId).subscribe({
        next: () => {
          console.log('TasksComponent: Task deleted successfully');
          
          // Remove the task from the tasks array
          this.tasks.update(tasks => tasks.filter(t => t.id !== taskId));
          
          this.error.set(null);
        },
        error: (error) => {
          console.error('TasksComponent: Error deleting task:', error);
          this.error.set('Failed to delete task. Please try again.');
        }
      });
    }
  }

  onFilterChange() {
    // Filtering is now handled automatically by computed values
    console.log('Filter changed - tasks will update automatically');
  }

  onSortChange() {
    // Sorting is now handled automatically by computed values
    console.log('Sort changed - tasks will update automatically');
  }

  toggleAnalytics() {
    this.showAnalytics.update(current => !current);
  }

  clearError() {
    this.error.set(null);
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }
}
