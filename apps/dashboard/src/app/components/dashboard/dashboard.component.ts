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
    // Effect to automatically load organization when user changes
    effect(() => {
      const user = this.authService.currentUser();
      if (user?.organizationId) {
        this.loadOrganization(user.organizationId);
      } else {
        this.currentOrganization.set(null);
      }
    });
  }

  ngOnInit() {
    console.log('DashboardComponent: ngOnInit called');
    
    // Initialize computed values after constructor
    this.currentUser = this.authService.currentUser;
    this.currentUserRole = this.authService.currentUserRole;
    this.currentUserOrganizationId = this.authService.currentUserOrganizationId;
    
    // Check if user is logged in
    if (!this.authService.isLoggedIn()) {
      console.log('User not logged in, redirecting to login');
      this.router.navigate(['/login']);
      return;
    }
    
    console.log('DashboardComponent: User is logged in');
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

