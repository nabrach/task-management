import { Component, OnInit, Output, AfterViewInit, ChangeDetectorRef, ViewChild } from '@angular/core';
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
  
  tasks: TaskWithUsers[] = [];
  todoTasks: TaskWithUsers[] = [];
  inProgressTasks: TaskWithUsers[] = [];
  doneTasks: TaskWithUsers[] = [];
  
  showForm = false;
  editingTask: Task | undefined = undefined;
  isLoading = false;
  error: string | null = null;
  
  currentUser: IUser | null = null;
  users: IUser[] = [];
  isAdmin: boolean = false;
  isOwner: boolean = false;
  isViewer: boolean = false;

  // Analytics and filtering properties
  showAnalytics = false;
  selectedCategory = '';
  selectedStatus = '';
  sortBy = 'createdAt';
  sortOrder = 'desc';
  filteredTasks: TaskWithUsers[] = [];

  constructor(
    private tasksService: TasksService,
    private authService: AuthService,
    private usersService: UsersService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('TasksComponent: ngOnInit called');
    this.loadCurrentUser();
    this.loadTasks();
  }

  ngAfterViewInit() {
    console.log('TasksComponent: ngAfterViewInit called');
  }

  private loadCurrentUser() {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isOwner = user?.role === UserRole.OWNER;
      this.isAdmin = user?.role === UserRole.ADMIN;
      this.isViewer = user?.role === UserRole.VIEWER;
      
      // Owner and Admin can load users for assignment
      if (this.isOwner || this.isAdmin) {
        this.loadUsers();
      }
    });
  }

  private loadUsers() {
    if (this.currentUser?.organizationId) {
      console.log('Loading users for organization:', this.currentUser.organizationId);
      this.usersService.getUsersByOrganization(this.currentUser.organizationId).subscribe({
        next: (users) => {
          console.log('Users loaded:', users);
          this.users = users;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading users:', error);
          this.error = 'Failed to load users. Please try again.';
        }
      });
    } else {
      console.log('Loading users for default organization: 1');
      this.usersService.getUsersByOrganization(1).subscribe({
        next: (users) => {
          console.log('Users loaded for default organization:', users);
          this.users = users;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading users for default organization:', error);
          this.error = 'Failed to load users. Please try again.';
        }
      });
    }
  }

  public canEditTask(task: Task): boolean {
    if (!this.currentUser) return false;
    
    // Owner and Admin can edit any task in their organization
    if ((this.isOwner || this.isAdmin) && (task.organizationId || 1) === (this.currentUser.organizationId || 1)) {
      return true;
    }
    
    // Viewers cannot edit tasks
    if (this.isViewer) {
      return false;
    }
    
    // Regular users can only edit tasks they created or are assigned to
    return (task.createdBy || 0) === this.currentUser.id || (task.assignedTo || 0) === this.currentUser.id;
  }

  public canDeleteTask(task: Task): boolean {
    if (!this.currentUser) return false;
    
    // Owner and Admin can delete any task in their organization
    if ((this.isOwner || this.isAdmin) && (task.organizationId || 1) === (this.currentUser.organizationId || 1)) {
      return true;
    }
    
    // Viewers cannot delete tasks
    if (this.isViewer) {
      return false;
    }
    
    // Regular users can only delete tasks they created
    return (task.createdBy || 0) === this.currentUser.id;
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
    if (!this.currentUser) return [];
    
    if (this.isOwner || this.isAdmin) {
      // Owner and Admin see all tasks in their organization
      return tasks.filter(task => (task.organizationId || 1) === (this.currentUser?.organizationId || 1));
    } else if (this.isViewer) {
      // Viewers see tasks they created or are assigned to
      return tasks.filter(task => 
        (task.createdBy || 0) === this.currentUser?.id || 
        (task.assignedTo || 0) === this.currentUser?.id
      );
    } else {
      // Regular users see tasks they created or are assigned to
      return tasks.filter(task => 
        (task.createdBy || 0) === this.currentUser?.id || 
        (task.assignedTo || 0) === this.currentUser?.id
      );
    }
  }

  loadTasks() {
    console.log('TasksComponent: loadTasks called');
    
    this.isLoading = true;
    this.error = null;
    
    this.tasksService.getTasks().subscribe({
      next: (tasks) => {
        console.log('TasksComponent: Tasks loaded successfully:', tasks);
        this.tasks = tasks;
        this.filteredTasks = [...tasks]; // Initialize filtered tasks
        this.categorizeTasks(true);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('TasksComponent: Error loading tasks:', error);
        this.error = 'Failed to load tasks. Please try again.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private categorizeTasks(shouldDetectChanges = false) {
    // Always use the main tasks array as the source of truth
    const tasksToCategorize = this.tasks;
    const filteredTasks = this.filterTasksByUser(tasksToCategorize);
    
    // Update the column arrays
    this.todoTasks = filteredTasks.filter(task => task.status === 'new');
    this.inProgressTasks = filteredTasks.filter(task => task.status === 'in-progress');
    this.doneTasks = filteredTasks.filter(task => task.status === 'completed');
    
    console.log('TasksComponent: categorizeTasks - Total tasks:', this.tasks.length);
    console.log('TasksComponent: categorizeTasks - Filtered tasks:', filteredTasks.length);
    console.log('TasksComponent: categorizeTasks - Todo tasks:', this.todoTasks.length);
    console.log('TasksComponent: categorizeTasks - In Progress tasks:', this.inProgressTasks.length);
    console.log('TasksComponent: categorizeTasks - Done tasks:', this.doneTasks.length);
    
    if (shouldDetectChanges) {
      this.cdr.detectChanges();
    }
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
        const index = this.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
          
          // Also update the filteredTasks array if it exists
          const filteredIndex = this.filteredTasks.findIndex(t => t.id === updatedTask.id);
          if (filteredIndex !== -1) {
            this.filteredTasks[filteredIndex] = updatedTask;
          }
        }
        
        // Recategorize tasks to update the columns
        this.categorizeTasks(true);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error updating task status:', error);
        this.error = 'Failed to update task status. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }



  showCreateForm() {
    this.editingTask = undefined;
    this.showForm = true;
    console.log('Showing create form');
  }

  showEditForm(task: Task) {
    this.editingTask = task;
    this.showForm = true;
    console.log('Showing edit form for task:', task.id);
  }

  hideForm() {
    console.log('TasksComponent: hideForm called');
    
    if (this.taskFormComponent) {
      console.log('TasksComponent: Clearing form before hiding');
      this.taskFormComponent.clearForm();
    }
    
    this.showForm = false;
    this.editingTask = undefined;
    this.cdr.detectChanges();
    
    console.log('TasksComponent: Form hidden, showForm:', this.showForm);
  }

  onSave(taskData: CreateTaskDto | UpdateTaskDto) {
    if (this.editingTask) {
      // Update existing task
      console.log('TasksComponent: Updating task:', this.editingTask.id, taskData);
      
      // Check if user has permission to edit this task
      if (!this.canEditTask(this.editingTask)) {
        this.error = 'You do not have permission to edit this task.';
        this.cdr.detectChanges();
        return;
      }
      
      this.tasksService.updateTask(this.editingTask.id, taskData as UpdateTaskDto).subscribe({
        next: (updatedTask) => {
          console.log('TasksComponent: Task updated successfully:', updatedTask);
          
          const index = this.tasks.findIndex(t => t.id === updatedTask.id);
          if (index !== -1) {
            this.tasks[index] = updatedTask;
            
            // Also update the filteredTasks array if it exists
            const filteredIndex = this.filteredTasks.findIndex(t => t.id === updatedTask.id);
            if (filteredIndex !== -1) {
              this.filteredTasks[filteredIndex] = updatedTask;
            }
          }
          
          this.categorizeTasks(true);
          this.cdr.detectChanges();
          this.hideForm();
          this.error = null;
        },
        error: (error) => {
          console.error('TasksComponent: Error updating task:', error);
          this.error = 'Failed to update task. Please try again.';
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new task
      console.log('TasksComponent: Creating new task:', taskData);
      const newTaskData = { 
        ...taskData, 
        status: 'new',
        organizationId: this.currentUser?.organizationId || 1,
        createdBy: this.currentUser?.id || 1
      } as CreateTaskDto;
      
      // If no user is assigned, assign to the creator
      if (!newTaskData.assignedTo) {
        newTaskData.assignedTo = this.currentUser?.id || 1;
      }
      
      this.tasksService.createTask(newTaskData).subscribe({
        next: (newTask) => {
          console.log('TasksComponent: Task created successfully:', newTask);
          
          // Add the new task to both arrays
          this.tasks.unshift(newTask);
          this.filteredTasks.unshift(newTask);
          
          console.log('TasksComponent: New task added to arrays. Total tasks:', this.tasks.length);
          
          // Recategorize tasks to update the columns
          this.categorizeTasks(true);
          this.cdr.detectChanges();
          this.hideForm();
          this.error = null;
        },
        error: (error) => {
          console.error('TasksComponent: Error creating task:', error);
          this.error = 'Failed to create task. Please try again.';
          this.cdr.detectChanges();
        }
      });
    }
  }

  onDelete(taskId: number) {
    console.log('TasksComponent: Deleting task with ID:', taskId);
    
    this.tasksService.deleteTask(taskId).subscribe({
      next: () => {
        console.log('Task deleted successfully from API');
        
        // Remove from both arrays
        this.tasks = this.tasks.filter(t => t.id !== taskId);
        this.filteredTasks = this.filteredTasks.filter(t => t.id !== taskId);
        
        this.categorizeTasks(true);
        this.cdr.detectChanges();
        this.error = null;
        
        console.log('TasksComponent: Task deletion completed successfully');
      },
      error: (error) => {
        console.error('TasksComponent: Error deleting task:', error);
        this.error = 'Failed to delete task. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  onToggleComplete(data: { id: number; completed: boolean }) {
    console.log('TasksComponent: Toggling completion for task ID:', data.id, 'to:', data.completed);
    
    // Find the current task to determine its current status
    const currentTask = this.tasks.find(t => t.id === data.id);
    if (!currentTask) {
      console.error('Task not found for ID:', data.id);
      return;
    }
    
    let newStatus: 'new' | 'in-progress' | 'completed';
    
    if (data.completed) {
      // If marking as completed, move to completed status
      newStatus = 'completed';
    } else {
      // If unchecking, determine appropriate status based on current status
      if (currentTask.status === 'completed') {
        // If it was completed, move back to in-progress
        newStatus = 'in-progress';
      } else if (currentTask.status === 'new') {
        // If it was new, keep it as new
        newStatus = 'new';
      } else {
        // If it was in-progress, keep it as in-progress
        newStatus = 'in-progress';
      }
    }
    
    const updateData: UpdateTaskDto = { 
      completed: data.completed,
      status: newStatus
    };
    
    this.tasksService.updateTask(data.id, updateData).subscribe({
      next: (updatedTask) => {
        console.log('Task completion updated successfully:', updatedTask);
        
        // Update the task in the main tasks array
        const index = this.tasks.findIndex(t => t.id === updatedTask.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        
        // Recategorize tasks to update the columns immediately
        this.categorizeTasks(true);
        this.cdr.detectChanges();
        
        // Clear any errors
        this.error = null;
      },
      error: (error) => {
        console.error('TasksComponent: Error updating task completion:', error);
        this.error = 'Failed to update task. Please try again.';
        this.cdr.detectChanges();
      }
    });
  }

  clearError() {
    this.error = null;
  }

  trackByTaskId(index: number, task: Task): number {
    return task.id;
  }

  // Analytics methods
  toggleAnalytics() {
    this.showAnalytics = !this.showAnalytics;
  }

  // Filtering and sorting methods
  applyFilters() {
    this.filteredTasks = [...this.tasks];
    
    // Apply category filter
    if (this.selectedCategory) {
      this.filteredTasks = this.filteredTasks.filter(task => 
        task.category === this.selectedCategory
      );
    }
    
    // Apply status filter
    if (this.selectedStatus) {
      this.filteredTasks = this.filteredTasks.filter(task => 
        task.status === this.selectedStatus
      );
    }
    
    // Apply sorting
    this.filteredTasks.sort((a, b) => {
      let aValue: any;
      let bValue: any;
      
      switch (this.sortBy) {
        case 'title':
          aValue = a.title?.toLowerCase() || '';
          bValue = b.title?.toLowerCase() || '';
          break;
        case 'category':
          aValue = a.category?.toLowerCase() || '';
          bValue = b.category?.toLowerCase() || '';
          break;
        case 'status':
          aValue = a.status?.toLowerCase() || '';
          bValue = b.status?.toLowerCase() || '';
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt || '').getTime();
          bValue = new Date(b.createdAt || '').getTime();
          break;
      }
      
      if (this.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });
    
    // Update the categorized task arrays
    this.categorizeTasks(true);
  }

  clearFilters() {
    this.selectedCategory = '';
    this.selectedStatus = '';
    this.sortBy = 'createdAt';
    this.sortOrder = 'desc';
    this.filteredTasks = [...this.tasks];
    this.categorizeTasks(true);
  }
}
