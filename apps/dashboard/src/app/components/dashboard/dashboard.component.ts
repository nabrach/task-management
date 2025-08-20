import { Component, OnInit, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UsersService } from '../../services/users.service';
import { TasksComponent } from '../tasks/tasks.component';
import { AuditLogsComponent } from '../audit-logs/audit-logs.component';
import { IUser, IOrganization } from '@my-workspace/data';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, TasksComponent, AuditLogsComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  // Convert component properties to signals
  public activeTab = signal<'tasks' | 'audit-logs'>('tasks');
  public isMobileMenuOpen = signal(false);
  
  // Organization state
  public currentOrganization = signal<IOrganization | null>(null);
  public isLoadingOrganization = signal(false);
  public organizationError = signal<string | null>(null);

  // Computed values for derived state (will be initialized in ngOnInit)
  public currentUser: any;
  public currentUserRole: any;
  public currentUserOrganizationId: any;

  constructor(
    private authService: AuthService,
    private usersService: UsersService,
    private router: Router
  ) {
    // Initialize computed values in constructor (injection context)
    this.currentUser = this.authService.currentUser;
    this.currentUserRole = computed(() => this.currentUser()?.role);
    this.currentUserOrganizationId = computed(() => this.currentUser()?.organizationId);
    
    // Effect to automatically load organization when user changes
    effect(() => {
      const user = this.currentUser();
      if (user?.organizationId) {
        this.loadOrganization(user.organizationId);
      } else {
        this.currentOrganization.set(null);
      }
    });
  }

  ngOnInit() {
    this.loadCurrentUser();
    this.loadTasks();
  }

  private loadCurrentUser() {
    // User is already loaded via signal, no need to subscribe
    console.log('DashboardComponent: Current user loaded via signal');
  }

  private loadTasks() {
    // This method is called by the tasks component, not needed here
    console.log('DashboardComponent: Tasks loading handled by tasks component');
  }

  setActiveTab(tab: 'tasks' | 'audit-logs') {
    this.activeTab.set(tab);
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen.update(current => !current);
  }

  closeMobileMenu() {
    this.isMobileMenuOpen.set(false);
  }

  logout() {
    console.log('DashboardComponent: logout called');
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  private loadOrganization(organizationId: number) {
    this.isLoadingOrganization.set(true);
    this.organizationError.set(null);
    
    // Use the authService to get organizations instead
    this.authService.getOrganizations().subscribe({
      next: (organizations: IOrganization[]) => {
        const organization = organizations.find(org => org.id === organizationId);
        console.log('Organization loaded:', organization);
        this.currentOrganization.set(organization || null);
        this.isLoadingOrganization.set(false);
      },
      error: (error: any) => {
        console.error('Error loading organization:', error);
        this.organizationError.set('Failed to load organization information');
        this.isLoadingOrganization.set(false);
      }
    });
  }
}

