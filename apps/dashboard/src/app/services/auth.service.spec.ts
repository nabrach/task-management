import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { AuthService, LoginCredentials, RegisterData, User } from './auth.service';
import { UserRole } from '@my-workspace/data';
import { BehaviorSubject } from 'rxjs';
import { testProviders } from '../../test-helpers/test-setup';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.VIEWER,
    organizationId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockAuthResponse = {
    message: 'Login successful',
    user: mockUser,
    access_token: 'mock-jwt-token'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...testProviders, AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear sessionStorage before each test
    sessionStorage.clear();
    
    // Reset the service's internal state
    (service as any).currentUserSubject = new BehaviorSubject<User | null>(null);
    (service as any).authInProgress = false;
  });

  afterEach(() => {
    httpMock.verify();
    sessionStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should login successfully and store token', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
        expect(sessionStorage.getItem('access_token')).toBe('mock-jwt-token');
        expect(service.getCurrentUser()).toEqual(mockUser);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(mockAuthResponse);
    });

    it('should handle login error', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'wrongpassword'
      };

      const errorResponse = { error: { message: 'Invalid credentials' } };

      service.login(credentials).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.error.message).toBe('Invalid credentials');
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/login');
      req.flush(errorResponse, { status: 401, statusText: 'Unauthorized' });
    });

    it('should not store token if response is missing access_token', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };

      const responseWithoutToken = { message: 'Success', user: mockUser };

      service.login(credentials).subscribe(response => {
        expect(response).toEqual(responseWithoutToken);
        expect(sessionStorage.getItem('access_token')).toBeNull();
        expect(service.getCurrentUser()).toBeNull();
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/login');
      req.flush(responseWithoutToken);
    });
  });

  describe('register', () => {
    it('should register user successfully', () => {
      const userData: RegisterData = {
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'Jane',
        lastName: 'Smith'
      };

      service.register(userData).subscribe(response => {
        expect(response).toEqual(mockAuthResponse);
      });

      const req = httpMock.expectOne('http://localhost:3000/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(userData);
      req.flush(mockAuthResponse);
    });
  });

  describe('getOrganizations', () => {
    it('should fetch organizations successfully', () => {
      const mockOrganizations = [
        { id: 1, name: 'Org 1', description: 'Description 1' },
        { id: 2, name: 'Org 2', description: 'Description 2' }
      ];

      service.getOrganizations().subscribe(organizations => {
        expect(organizations).toEqual(mockOrganizations);
      });

      const req = httpMock.expectOne('http://localhost:3000/organizations');
      expect(req.request.method).toBe('GET');
      req.flush(mockOrganizations);
    });
  });

  describe('logout', () => {
    it('should clear token and user state', () => {
      // First login to set up state
      sessionStorage.setItem('access_token', 'mock-token');
      (service as any).currentUserSubject.next(mockUser);

      service.logout();

      expect(sessionStorage.getItem('access_token')).toBeNull();
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true when token exists', () => {
      sessionStorage.setItem('access_token', 'mock-token');
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false when token does not exist', () => {
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('getToken', () => {
    it('should return token when it exists', () => {
      sessionStorage.setItem('access_token', 'mock-token');
      expect(service.getToken()).toBe('mock-token');
    });

    it('should return null when token does not exist', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user when logged in', () => {
      (service as any).currentUserSubject.next(mockUser);
      expect(service.getCurrentUser()).toEqual(mockUser);
    });

    it('should return null when not logged in', () => {
      expect(service.getCurrentUser()).toBeNull();
    });
  });

  describe('checkAuthStatus', () => {
    it('should check auth status when valid token exists', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.signature';
      sessionStorage.setItem('access_token', validToken);

      service.checkAuthStatus();

      const req = httpMock.expectOne('http://localhost:3000/auth/status');
      expect(req.request.method).toBe('GET');
      req.flush({ user: mockUser });
    });

    it('should not check auth status when no token exists', () => {
      service.checkAuthStatus();
      httpMock.expectNone('http://localhost:3000/auth/status');
    });

    it('should handle auth status check error and logout if token is invalid', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.signature';
      sessionStorage.setItem('access_token', expiredToken);

      service.checkAuthStatus();

      const req = httpMock.expectOne('http://localhost:3000/auth/status');
      req.flush({}, { status: 401, statusText: 'Unauthorized' });

      // Should logout due to invalid token
      expect(sessionStorage.getItem('access_token')).toBeNull();
    });
  });

  describe('isTokenValid', () => {
    it('should return true for valid token', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjk5OTk5OTk5OTl9.signature';
      const result = (service as any).isTokenValid(validToken);
      expect(result).toBe(true);
    });

    it('should return false for expired token', () => {
      const expiredToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjF9.signature';
      const result = (service as any).isTokenValid(expiredToken);
      expect(result).toBe(false);
    });

    it('should return false for malformed token', () => {
      const malformedToken = 'invalid-token';
      const result = (service as any).isTokenValid(malformedToken);
      expect(result).toBe(false);
    });
  });

  describe('currentUser$ observable', () => {
    it('should emit current user updates', (done) => {
      service.currentUser$.subscribe(user => {
        expect(user).toEqual(mockUser);
        done();
      });

      (service as any).currentUserSubject.next(mockUser);
    });
  });
});
