import { Component, EventEmitter, Input, OnInit, OnChanges, SimpleChanges, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Task, CreateTaskDto, UpdateTaskDto, IUser } from '@my-workspace/data';

@Component({
  selector: 'app-task-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './task-form.component.html',
  styleUrls: ['./task-form.component.css']
})
export class TaskFormComponent implements OnInit, OnChanges {
  @Input() task?: Task;
  @Input() users: IUser[] = [];
  @Input() currentUser: IUser | null = null;
  @Input() isAdmin: boolean = false;
  @Input() isOwner: boolean = false;
  @Input() isViewer: boolean = false;
  @Output() save = new EventEmitter<CreateTaskDto | UpdateTaskDto>();
  @Output() cancel = new EventEmitter<void>();

  taskForm: FormGroup;

  constructor(private fb: FormBuilder) {
            this.taskForm = this.fb.group({
          title: ['', [Validators.required, Validators.minLength(1)]],
          description: [undefined],
          completed: [false],
          status: ['new', Validators.required],
          category: ['work', Validators.required],
          assignedTo: [undefined],
          organizationId: [undefined, Validators.required]
        });
  }

  ngOnInit() {
    this.resetForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('TaskFormComponent: ngOnChanges called with:', changes);
    if (changes['task'] || changes['currentUser']) {
      console.log('TaskFormComponent: Resetting form due to input changes');
      this.resetForm();
    }
  }

  private resetForm() {
    console.log('TaskFormComponent: resetForm called - task:', this.task, 'currentUser:', this.currentUser);
    
    if (this.task) {
      // Edit mode - populate with existing task data
      console.log('TaskFormComponent: Populating form for edit mode');
      this.taskForm.patchValue({
        title: this.task.title,
        description: this.task.description || '',
        completed: this.task.completed || false,
        status: this.task.status || 'new',
        category: this.task.category || 'work',
        assignedTo: this.task.assignedTo || undefined,
        organizationId: this.task.organizationId || (this.currentUser?.organizationId || 1)
      });
    } else if (this.currentUser) {
      // Create mode - set default values including current user's organization
      console.log('TaskFormComponent: Resetting form for create mode');
      const orgId = this.currentUser.organizationId || 1;
      this.taskForm.reset({
        title: '',
        description: '',
        completed: false,
        status: 'new',
        category: 'work',
        assignedTo: undefined,
        organizationId: orgId
      });
    } else {
      // Fallback when no current user is available yet
      console.log('TaskFormComponent: No current user available, using defaults');
      this.taskForm.reset({
        title: '',
        description: '',
        completed: false,
        status: 'new',
        category: 'work',
        assignedTo: undefined,
        organizationId: 1
      });
    }
    
    console.log('TaskFormComponent: Form values after reset:', this.taskForm.value);
    console.log('TaskFormComponent: Form valid:', this.taskForm.valid);
    console.log('TaskFormComponent: Form errors:', this.getFormErrors());
  }

  onSubmit() {
    if (this.taskForm.valid) {
      const formValues = this.taskForm.value;
      console.log('TaskFormComponent: Form submitted with values:', formValues);
      
      // Clean the form data by removing undefined values
      const cleanedValues = this.cleanFormData(formValues);
      console.log('TaskFormComponent: Cleaned form values:', cleanedValues);
      
      this.save.emit(cleanedValues);
      
      // Clear the form immediately after submission for create mode
      if (!this.task) {
        console.log('TaskFormComponent: Clearing form after create submission');
        this.resetForm();
      }
    }
  }

  private cleanFormData(data: any): any {
    const cleaned: any = {};
    Object.keys(data).forEach(key => {
      // Remove undefined values and empty strings for optional fields
      if (data[key] !== undefined && data[key] !== '') {
        // Convert types to match DTO expectations
        if (key === 'assignedTo' && data[key] !== null) {
          cleaned[key] = parseInt(data[key], 10);
        } else if (key === 'organizationId' && data[key] !== null) {
          cleaned[key] = parseInt(data[key], 10);
        } else if (key === 'completed') {
          cleaned[key] = Boolean(data[key]);
        } else {
          cleaned[key] = data[key];
        }
      }
    });
    return cleaned;
  }

  onCancel() {
    console.log('TaskFormComponent: Form cancelled');
    this.cancel.emit();
  }

  // Public method to manually reset the form
  public clearForm() {
    console.log('TaskFormComponent: clearForm called externally');
    this.resetForm();
  }

  // Get display name for user selection
  getUserDisplayName(user: IUser): string {
    if (!user) {
      return 'Unknown User';
    }
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName} (${user.email})`;
    }
    return user.email || 'Unknown User';
  }

  // Helper method for debugging form errors
  private getFormErrors(): any {
    const formErrors: any = {};
    Object.keys(this.taskForm.controls).forEach(key => {
      const controlErrors = this.taskForm.get(key)?.errors;
      if (controlErrors) {
        formErrors[key] = controlErrors;
      }
    });
    return formErrors;
  }
}
