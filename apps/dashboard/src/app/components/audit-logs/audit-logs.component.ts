import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuditLogsService } from '../../services/audit-logs.service';
import { AuditLog, AuditAction, AuditResource } from '@my-workspace/data';

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  // Convert properties to signals
  public logs = signal<AuditLog[]>([]);
  public totalLogs = signal(0);
  public currentPage = signal(1);
  public pageSize = signal(20);
  public loading = signal(false);
  public selectedFilter = signal('all');
  public selectedResource = signal('all');
  public selectedAction = signal('all');
  public selectedLog = signal<AuditLog | null>(null);

  // Computed signals for filtered logs
  public filteredLogs = computed(() => {
    let filtered = this.logs();
    
    if (this.selectedResource() !== 'all') {
      filtered = filtered.filter(log => log.resource === this.selectedResource());
    }

    if (this.selectedAction() !== 'all') {
      filtered = filtered.filter(log => log.action === this.selectedAction());
    }

    return filtered;
  });

  // Filter options
  resourceOptions = [
    { value: 'all', label: 'All Resources' },
    { value: AuditResource.TASK, label: 'Tasks' }
  ];

  actionOptions = [
    { value: 'all', label: 'All Actions' },
    { value: AuditAction.CREATE, label: 'Create' },
    { value: AuditAction.UPDATE, label: 'Update' },
    { value: AuditAction.DELETE, label: 'Delete' },
    { value: AuditAction.COMPLETE, label: 'Complete' },
    { value: AuditAction.ASSIGN, label: 'Assign' },
    { value: AuditAction.STATUS_CHANGE, label: 'Status Change' }
  ];

  constructor(private auditLogsService: AuditLogsService) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading.set(true);
    
    this.auditLogsService.getOrganizationLogs(this.currentPage(), this.pageSize())
      .subscribe({
        next: (response) => {
          this.logs.set(response.logs);
          this.totalLogs.set(response.total);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error loading audit logs:', error);
          this.loading.set(false);
        }
      });
  }

  onFilterChange(): void {
    this.currentPage.set(1);
    this.loadLogs();
  }

  onResourceChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedResource.set(target.value);
    this.onFilterChange();
  }

  onActionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedAction.set(target.value);
    this.onFilterChange();
  }

  onPageChange(page: number): void {
    this.currentPage.set(page);
    this.loadLogs();
  }

  getActionIcon(action: AuditAction): string {
    switch (action) {
      case AuditAction.CREATE:
        return '➕';
      case AuditAction.UPDATE:
        return '✏️';
      case AuditAction.DELETE:
        return '🗑️';
      case AuditAction.COMPLETE:
        return '✅';
      case AuditAction.ASSIGN:
        return '👤';
      case AuditAction.STATUS_CHANGE:
        return '🔄';
      default:
        return '📝';
    }
  }

  getActionColor(action: AuditAction): string {
    switch (action) {
      case AuditAction.CREATE:
        return 'text-green-600';
      case AuditAction.UPDATE:
        return 'text-blue-600';
      case AuditAction.DELETE:
        return 'text-red-600';
      case AuditAction.COMPLETE:
        return 'text-green-600';
      case AuditAction.ASSIGN:
        return 'text-purple-600';
      case AuditAction.STATUS_CHANGE:
        return 'text-orange-600';
      default:
        return 'text-gray-600';
    }
  }

  getResourceIcon(resource: AuditResource): string {
    switch (resource) {
      case AuditResource.TASK:
        return '📋';
      case AuditResource.USER:
        return '👤';
      case AuditResource.ORGANIZATION:
        return '🏢';
      default:
        return '📄';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleString();
  }

  getUserDisplayName(user: any): string {
    if (!user) {
      return 'Unknown User';
    }
    
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.email || 'Unknown User';
  }

  getTotalPages(): number {
    return Math.ceil(this.totalLogs() / this.pageSize());
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage() - 2);
    const end = Math.min(totalPages, this.currentPage() + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  showChanges(log: AuditLog): void {
    this.selectedLog.set(log);
  }

  get Math() {
    return Math;
  }
}
