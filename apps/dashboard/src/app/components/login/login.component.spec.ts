import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { LoginComponent } from './login.component';
import { AuthService, LoginCredentials } from '../../services/auth.service';
import { testProviders } from '../../../test-helpers/test-setup';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockLoginResponse: any = {
    message: 'Login successful',
    user: {
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user' as any,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    access_token: 'mock-jwt-token'
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['login']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        ...testProviders,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.credentials.email).toBe('');
      expect(component.credentials.password).toBe('');
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
    });
  });

  describe('onSubmit', () => {
    it('should set loading state and clear error message on submit', () => {
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(component.isLoading).toBe(true);
      expect(component.errorMessage).toBe('');
    });

    it('should call auth service with correct credentials', () => {
      const credentials: LoginCredentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      component.credentials = credentials;
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalledWith(credentials);
    });

    it('should handle successful login and navigate to dashboard', (done) => {
      mockAuthService.login.and.returnValue(of(mockLoginResponse));
      spyOn(window, 'setTimeout').and.callFake((callback: any) => {
        callback();
        return 1;
      });

      component.onSubmit();

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should handle successful login without access token', () => {
      const responseWithoutToken = { ...mockLoginResponse };
      delete responseWithoutToken.access_token;
      mockAuthService.login.and.returnValue(of(responseWithoutToken));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle successful login without user data', () => {
      const responseWithoutUser = { ...mockLoginResponse };
      delete responseWithoutUser.user;
      mockAuthService.login.and.returnValue(of(responseWithoutUser));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should handle login error and display error message', () => {
      const errorResponse = {
        error: { message: 'Invalid credentials' }
      };
      mockAuthService.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Invalid credentials');
    });

    it('should handle login error without error message and use default', () => {
      const errorResponse = {};
      mockAuthService.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Invalid credentials. Please try again.');
    });

    it('should handle login error with different error structure', () => {
      const errorResponse = {
        message: 'Server error'
      };
      mockAuthService.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Invalid credentials. Please try again.');
    });

    it('should handle network error gracefully', () => {
      const networkError = new Error('Network error');
      mockAuthService.login.and.returnValue(throwError(() => networkError));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('Invalid credentials. Please try again.');
    });
  });

  describe('form validation', () => {
    it('should handle empty credentials', () => {
      component.credentials = { email: '', password: '' };
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalledWith({ email: '', password: '' });
    });

    it('should handle whitespace in credentials', () => {
      component.credentials = { email: '  test@example.com  ', password: '  password123  ' };
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalledWith({ 
        email: '  test@example.com  ', 
        password: '  password123  ' 
      });
    });
  });

  describe('loading state management', () => {
    it('should set loading to true when starting login', () => {
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(component.isLoading).toBe(true);
    });

    it('should set loading to false on successful login', (done) => {
      mockAuthService.login.and.returnValue(of(mockLoginResponse));
      spyOn(window, 'setTimeout').and.callFake((callback: any) => {
        callback();
        return 1;
      });

      component.onSubmit();

      setTimeout(() => {
        expect(component.isLoading).toBe(false);
        done();
      });
    });

    it('should set loading to false on login error', () => {
      mockAuthService.login.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

      component.onSubmit();

      expect(component.isLoading).toBe(false);
    });
  });

  describe('error message handling', () => {
    it('should clear error message on new submit', () => {
      component.errorMessage = 'Previous error';
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(component.errorMessage).toBe('');
    });

    it('should preserve error message structure from API response', () => {
      const errorResponse = {
        error: { message: 'Custom error message' }
      };
      mockAuthService.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.errorMessage).toBe('Custom error message');
    });
  });

  describe('navigation behavior', () => {
    it('should navigate to dashboard after successful login', (done) => {
      mockAuthService.login.and.returnValue(of(mockLoginResponse));
      spyOn(window, 'setTimeout').and.callFake((callback: any) => {
        callback();
        return 1;
      });

      component.onSubmit();

      setTimeout(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard']);
        done();
      });
    });

    it('should not navigate on login failure', () => {
      mockAuthService.login.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

      component.onSubmit();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when missing access token', () => {
      const responseWithoutToken = { ...mockLoginResponse };
      delete responseWithoutToken.access_token;
      mockAuthService.login.and.returnValue(of(responseWithoutToken));

      component.onSubmit();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should not navigate when missing user data', () => {
      const responseWithoutUser = { ...mockLoginResponse };
      delete responseWithoutUser.user;
      mockAuthService.login.and.returnValue(of(responseWithoutUser));

      component.onSubmit();

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid submissions', () => {
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();
      component.onSubmit();
      component.onSubmit();

      expect(mockAuthService.login).toHaveBeenCalledTimes(3);
    });

    it('should handle service throwing non-error objects', () => {
      mockAuthService.login.and.returnValue(throwError(() => 'string error'));

      expect(() => component.onSubmit()).not.toThrow();
      expect(component.isLoading).toBe(false);
    });

    it('should handle undefined error response', () => {
      mockAuthService.login.and.returnValue(throwError(() => undefined));

      expect(() => component.onSubmit()).not.toThrow();
      expect(component.isLoading).toBe(false);
    });
  });

  describe('console logging', () => {
    it('should log login response on success', () => {
      spyOn(console, 'log');
      mockAuthService.login.and.returnValue(of(mockLoginResponse));

      component.onSubmit();

      expect(console.log).toHaveBeenCalledWith('Login response:', mockLoginResponse);
    });

    it('should log successful login message', (done) => {
      spyOn(console, 'log');
      mockAuthService.login.and.returnValue(of(mockLoginResponse));
      spyOn(window, 'setTimeout').and.callFake((callback: any) => {
        callback();
        return 1;
      });

      component.onSubmit();

      setTimeout(() => {
        expect(console.log).toHaveBeenCalledWith('Login successful, navigating to dashboard...');
        done();
      });
    });

    it('should log login errors', () => {
      spyOn(console, 'error');
      const errorResponse = { error: { message: 'Error' } };
      mockAuthService.login.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(console.error).toHaveBeenCalledWith('Login error:', errorResponse);
    });
  });
});
