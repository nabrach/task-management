import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
  logs: AuditLog[] = [];
  totalLogs = 0;
  currentPage = 1;
  pageSize = 20;
  loading = false;
  selectedFilter = 'all';
  selectedResource = 'all';
  selectedAction = 'all';
  selectedLog: AuditLog | null = null;

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

  constructor(
    private auditLogsService: AuditLogsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadLogs();
  }

  loadLogs(): void {
    this.loading = true;
    
    this.auditLogsService.getOrganizationLogs(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.logs = this.filterLogs(response.logs);
          this.totalLogs = response.total;
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading audit logs:', error);
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  filterLogs(logs: AuditLog[]): AuditLog[] {
    let filtered = logs;

    if (this.selectedResource !== 'all') {
      filtered = filtered.filter(log => log.resource === this.selectedResource);
    }

    if (this.selectedAction !== 'all') {
      filtered = filtered.filter(log => log.action === this.selectedAction);
    }

    return filtered;
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadLogs();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
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
    return Math.ceil(this.totalLogs / this.pageSize);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  showChanges(log: AuditLog): void {
    this.selectedLog = log;
  }

  get Math() {
    return Math;
  }
}
