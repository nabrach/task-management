import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService, LoginCredentials } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  credentials: LoginCredentials = {
    email: '',
    password: ''
  };
  isLoading = false;
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credentials).subscribe({
      next: (response) => {
        console.log('Login response:', response);
        this.isLoading = false;
        if (response.access_token && response.user) {
          console.log('Login successful, navigating to dashboard...');
          // Wait a moment for the user state to be updated
          setTimeout(() => {
            this.router.navigate(['/dashboard']);
          }, 100);
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || 'Invalid credentials. Please try again.';
      }
    });
  }
}

