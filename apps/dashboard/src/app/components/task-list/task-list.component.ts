import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Task } from '@my-workspace/data';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './task-list.component.html',
  styleUrls: ['./task-list.component.css']
})
export class TaskListComponent {
  @Input() tasks: Task[] = [];
  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<number>();
  @Output() toggleComplete = new EventEmitter<{ id: number; completed: boolean }>();

  onEdit(task: Task) {
    this.edit.emit(task);
  }

  onDelete(id: number) {
    if (confirm('Are you sure you want to delete this task?')) {
      this.delete.emit(id);
    }
  }

  onToggleComplete(task: Task) {
    this.toggleComplete.emit({ id: task.id, completed: !(task.completed || false) });
  }

  formatDate(date: Date | string | undefined): string {
    if (date === null || date === undefined) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
