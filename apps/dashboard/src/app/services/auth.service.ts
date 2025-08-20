import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { UserRole } from '@my-workspace/data';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  organizationId?: number | string | null;
}

export interface Organization {
  id: number;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  organizationId?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  message?: string;
  user?: User;
  access_token?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = 'http://localhost:3000/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private authInProgress = false;

  constructor(private http: HttpClient) {
    console.log('AuthService constructor - checking for existing token...');
    // Check if user is already logged in
    this.checkAuthStatus();
    
    // Set up periodic token validation (every 5 minutes)
    setInterval(() => {
      if (this.isLoggedIn()) {
        this.checkAuthStatus();
      }
    }, 5 * 60 * 1000);
  }

  login(credentials: LoginCredentials): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, credentials).pipe(
      tap(response => {
        console.log('Login tap - response:', response);
        if (response.access_token && response.user) {
          console.log('Login tap - user object:', response.user);
          console.log('Login tap - user organizationId:', response.user.organizationId);
          console.log('Login tap - user organizationId type:', typeof response.user.organizationId);
          console.log('Storing token and updating user state...');
          // Store token in sessionStorage (more secure than localStorage)
          sessionStorage.setItem('access_token', response.access_token);
          console.log('Token stored in sessionStorage:', sessionStorage.getItem('access_token'));
          // Update user state immediately with the response data
          this.currentUserSubject.next(response.user);
          console.log('User state updated:', this.currentUserSubject.value);
        }
      })
    );
  }

  register(userData: RegisterData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/register`, userData);
  }

  getOrganizations(): Observable<Organization[]> {
    return this.http.get<Organization[]>(`http://localhost:3000/organizations`);
  }

  logout(): void {
    console.log('Logout called - clearing token and user state');
    sessionStorage.removeItem('access_token');
    this.currentUserSubject.next(null);
    console.log('Token cleared, sessionStorage now empty:', !sessionStorage.getItem('access_token'));
  }

  isLoggedIn(): boolean {
    const token = sessionStorage.getItem('access_token');
    console.log('isLoggedIn check - token exists:', !!token);
    return !!token;
  }

  getToken(): string | null {
    const token = sessionStorage.getItem('access_token');
    console.log('getToken called - token:', token ? 'exists' : 'null');
    return token;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  checkAuthStatus(): void {
    const token = this.getToken();
    console.log('checkAuthStatus called, token exists:', !!token);
    
    if (token && this.isTokenValid(token) && !this.authInProgress) {
      console.log('Making status API call...');
      this.authInProgress = true;
      this.http.get<AuthResponse>(`${this.API_URL}/status`).subscribe({
        next: (response) => {
          console.log('Status API response:', response);
          if (response.user) {
            console.log('Status API - user object:', response.user);
            console.log('Status API - user organizationId:', response.user.organizationId);
            console.log('Status API - user organizationId type:', typeof response.user.organizationId);
            console.log('Updating user state with:', response.user);
            this.currentUserSubject.next(response.user);
          } else {
            console.log('No user data in response');
          }
          this.authInProgress = false;
        },
        error: (error) => {
          console.error('Auth status check failed:', error);
          this.authInProgress = false;
          // Check if token was cleared externally (by interceptor)
          if (!this.getToken()) {
            console.log('Token was cleared externally, updating user state');
            this.currentUserSubject.next(null);
          } else {
            // Token is invalid, clear it
            this.logout();
          }
        }
      });
    } else if (token && !this.isTokenValid(token)) {
      console.log('Token is invalid, logging out');
      // Token is expired, clear it
      this.logout();
    } else {
      console.log('No token or auth in progress');
    }
  }

  private isTokenValid(token: string): boolean {
    try {
      console.log('isTokenValid: checking token...');
      // Decode the JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      console.log('isTokenValid: decoded payload:', payload);
      const currentTime = Math.floor(Date.now() / 1000);
      console.log('isTokenValid: current time:', currentTime);
      
      // Check if token is expired
      if (payload.exp && payload.exp < currentTime) {
        console.log('isTokenValid: token expired');
        return false;
      }
      
      console.log('isTokenValid: token is valid');
      return true;
    } catch (error) {
      console.error('isTokenValid: error decoding token:', error);
      // If we can't decode the token, consider it invalid
      return false;
    }
  }
}
