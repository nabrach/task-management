import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, RegisterData, Organization } from '../../services/auth.service';
import { UserRole } from '@my-workspace/data';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  userData: RegisterData = {
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: UserRole.VIEWER,
    organizationId: undefined
  };
  
  organizations: Organization[] = [];
  roles = [
    { value: UserRole.VIEWER, label: 'Viewer' },
    { value: UserRole.ADMIN, label: 'Admin' },
    { value: UserRole.OWNER, label: 'Owner' }
  ];
  
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadOrganizations();
  }

  loadOrganizations() {
    this.authService.getOrganizations().subscribe({
      next: (organizations) => {
        this.organizations = organizations;
      },
      error: (error) => {
        console.error('Failed to load organizations:', error);
        // Don't show error to user, just log it
      }
    });
  }

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Clean up the data before sending
    const cleanData = { ...this.userData };
    
    // Handle empty organization selection
    if (cleanData.organizationId === '' || cleanData.organizationId === null || cleanData.organizationId === 'null') {
      cleanData.organizationId = undefined;
    } else if (typeof cleanData.organizationId === 'string') {
      // Convert string to number if it's a valid number
      const num = parseInt(cleanData.organizationId, 10);
      cleanData.organizationId = isNaN(num) ? undefined : num;
    }
    
    console.log('Sending registration data:', cleanData);

    this.authService.register(cleanData).subscribe({
      next: (response) => {
        this.successMessage = response.message || 'Registration successful!';
        this.isLoading = false;
        
        // Redirect to login after successful registration
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.errorMessage = error?.error?.message || 'Registration failed. Please try again.';
        this.isLoading = false;
      }
    });
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }
}
