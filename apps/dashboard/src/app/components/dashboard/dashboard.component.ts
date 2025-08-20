import { Component, OnInit, ViewChild, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, User, Organization } from '../../services/auth.service';
import { TasksComponent } from '../tasks/tasks.component';
import { AuditLogsComponent } from '../audit-logs/audit-logs.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TasksComponent, AuditLogsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, AfterViewInit {
  currentUser: User | null = null;
  currentOrganization: Organization | null = null;
  activeTab: 'tasks' | 'audit-logs' = 'tasks';
  isMobileMenuOpen = false;

  @ViewChild(TasksComponent) tasksComponent!: TasksComponent;

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    console.log('Dashboard: ngOnInit called');
    // Subscribe to current user - the auth guard ensures we're authenticated
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      console.log('Dashboard: User loaded:', user?.email);
      
      if (user?.organizationId) {
        console.log('Dashboard: Loading organization for ID:', user.organizationId);
        this.loadOrganization(user.organizationId);
      } else {
        console.log('Dashboard: No organization ID found for user');
        this.currentOrganization = null;
        this.cdr.detectChanges();
      }
    });
  }

  ngAfterViewInit() {
    console.log('Dashboard: AfterViewInit called');
    // Force change detection to ensure ViewChild is available
    this.cdr.detectChanges();
    
    // Load tasks when dashboard initializes
    if (this.tasksComponent) {
      console.log('Dashboard: Loading tasks');
      this.tasksComponent.loadTasks();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  setActiveTab(tab: 'tasks' | 'audit-logs'): void {
    this.activeTab = tab;
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  private loadOrganization(organizationId: number | string): void {
    console.log('Dashboard: loadOrganization called with ID:', organizationId);
    
    // Convert to number if it's a string
    const orgId = typeof organizationId === 'string' ? parseInt(organizationId, 10) : organizationId;
    
    if (isNaN(orgId)) {
      console.error('Dashboard: Invalid organization ID:', organizationId);
      this.currentOrganization = null;
      return;
    }
    
    this.authService.getOrganizations().subscribe({
      next: (organizations) => {
        const foundOrg = organizations.find(org => org.id === orgId);
        this.currentOrganization = foundOrg || null;
        console.log('Dashboard: Organization loaded:', this.currentOrganization?.name || 'Not found');
        
        // Force change detection to ensure template updates
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Dashboard: Failed to load organization:', error);
        this.currentOrganization = null;
        this.cdr.detectChanges();
      }
    });
  }
}

