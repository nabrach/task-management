import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { RegisterComponent } from './register.component';
import { AuthService, RegisterData, Organization } from '../../services/auth.service';
import { UserRole } from '@my-workspace/data';
import { testProviders } from '../../../test-helpers/test-setup';

describe('RegisterComponent', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;

  const mockOrganizations: Organization[] = [
    { id: 1, name: 'Organization 1', description: 'Description 1' },
    { id: 2, name: 'Organization 2', description: 'Description 2' }
  ];

  const mockRegisterResponse = {
    message: 'Registration successful',
    user: {
      id: 1,
      email: 'newuser@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.VIEWER,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  };

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['register', 'getOrganizations']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [
        ...testProviders,
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.userData.email).toBe('');
      expect(component.userData.password).toBe('');
      expect(component.userData.firstName).toBe('');
      expect(component.userData.lastName).toBe('');
      expect(component.userData.role).toBe(UserRole.VIEWER);
      expect(component.userData.organizationId).toBeUndefined();
      expect(component.organizations).toEqual([]);
      expect(component.isLoading).toBe(false);
      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('');
    });

    it('should have correct roles array', () => {
      expect(component.roles).toEqual([
        { value: UserRole.VIEWER, label: 'Viewer' },
        { value: UserRole.ADMIN, label: 'Admin' },
        { value: UserRole.OWNER, label: 'Owner' }
      ]);
    });
  });

  describe('ngOnInit', () => {
    it('should call loadOrganizations on initialization', () => {
      spyOn(component, 'loadOrganizations');
      
      component.ngOnInit();
      
      expect(component.loadOrganizations).toHaveBeenCalled();
    });
  });

  describe('loadOrganizations', () => {
    it('should load organizations successfully', () => {
      mockAuthService.getOrganizations.and.returnValue(of(mockOrganizations));

      component.loadOrganizations();

      expect(component.organizations).toEqual(mockOrganizations);
    });

    it('should handle organization loading error gracefully', () => {
      spyOn(console, 'error');
      const error = { message: 'Failed to load organizations' };
      mockAuthService.getOrganizations.and.returnValue(throwError(() => error));

      component.loadOrganizations();

      expect(console.error).toHaveBeenCalledWith('Failed to load organizations:', error);
      expect(component.organizations).toEqual([]);
    });

    it('should handle empty organizations array', () => {
      mockAuthService.getOrganizations.and.returnValue(of([]));

      component.loadOrganizations();

      expect(component.organizations).toEqual([]);
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      mockAuthService.register.and.returnValue(of(mockRegisterResponse));
    });

    it('should set loading state and clear messages on submit', () => {
      component.onSubmit();

      expect(component.isLoading).toBe(true);
      expect(component.errorMessage).toBe('');
      expect(component.successMessage).toBe('');
    });

    it('should call auth service with cleaned user data', () => {
      component.userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ADMIN,
        organizationId: 1
      };

      component.onSubmit();

      expect(mockAuthService.register).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.ADMIN,
        organizationId: 1
      });
    });

    it('should handle empty organization selection', () => {
      component.userData.organizationId = '';

      component.onSubmit();

      expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        organizationId: undefined
      }));
    });

    it('should handle null organization selection', () => {
      component.userData.organizationId = null;

      component.onSubmit();

      expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        organizationId: undefined
      }));
    });

    it('should handle string "null" organization selection', () => {
      component.userData.organizationId = 'null';

      component.onSubmit();

      expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        organizationId: undefined
      }));
    });

    it('should convert valid string organization ID to number', () => {
      component.userData.organizationId = '2';

      component.onSubmit();

      expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        organizationId: 2
      }));
    });

    it('should handle invalid string organization ID', () => {
      component.userData.organizationId = 'invalid';

      component.onSubmit();

      expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        organizationId: undefined
      }));
    });

    it('should handle successful registration and show success message', () => {
      component.onSubmit();

      expect(component.successMessage).toBe('Registration successful');
      expect(component.isLoading).toBe(false);
    });

    it('should handle successful registration without message and use default', () => {
      const responseWithoutMessage: any = { ...mockRegisterResponse };
      delete responseWithoutMessage.message;
      mockAuthService.register.and.returnValue(of(responseWithoutMessage));

      component.onSubmit();

      expect(component.successMessage).toBe('Registration successful!');
    });

    it('should navigate to login after successful registration', (done) => {
      spyOn(window, 'setTimeout').and.callFake((callback: any) => {
        callback();
        return 0;
      });

      component.onSubmit();

      setTimeout(() => {
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });
    });

    it('should handle registration error and display error message', () => {
      const errorResponse = {
        error: { message: 'Email already exists' }
      };
      mockAuthService.register.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.errorMessage).toBe('Email already exists');
      expect(component.isLoading).toBe(false);
    });

    it('should handle registration error without error message and use default', () => {
      const errorResponse = {};
      mockAuthService.register.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.errorMessage).toBe('Registration failed. Please try again.');
    });

    it('should handle registration error with different error structure', () => {
      const errorResponse = {
        message: 'Server error'
      };
      mockAuthService.register.and.returnValue(throwError(() => errorResponse));

      component.onSubmit();

      expect(component.errorMessage).toBe('Registration failed. Please try again.');
    });

    it('should log registration data before sending', () => {
      spyOn(console, 'log');
      component.userData.email = 'test@example.com';

      component.onSubmit();

      expect(console.log).toHaveBeenCalledWith('Sending registration data:', jasmine.any(Object));
    });
  });

  describe('goToLogin', () => {
    it('should navigate to login page', () => {
      component.goToLogin();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('data cleaning', () => {
    it('should clean organization ID from empty string', () => {
      mockAuthService.register.and.returnValue(of(mockRegisterResponse));
      component.userData.organizationId = '';
      
      component.onSubmit();
      
      expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        organizationId: undefined
      }));
    });

    it('should clean organization ID from null', () => {
      mockAuthService.register.and.returnValue(of(mockRegisterResponse));
      component.userData.organizationId = null;
      
      component.onSubmit();
      
      expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        organizationId: undefined
      }));
    });

    it('should clean organization ID from string "null"', () => {
      mockAuthService.register.and.returnValue(of(mockRegisterResponse));
      component.userData.organizationId = 'null';
      
      component.onSubmit();
      
      expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        organizationId: undefined
      }));
    });

    it('should convert valid numeric string to number', () => {
      mockAuthService.register.and.returnValue(of(mockRegisterResponse));
      component.userData.organizationId = '5';
      
      component.onSubmit();
      
      expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        organizationId: 5
      }));
    });

    it('should handle invalid numeric string', () => {
      mockAuthService.register.and.returnValue(of(mockRegisterResponse));
      component.userData.organizationId = 'abc123';
      
      component.onSubmit();
      
      expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        organizationId: undefined
      }));
    });

    it('should preserve valid numeric organization ID', () => {
      mockAuthService.register.and.returnValue(of(mockRegisterResponse));
      component.userData.organizationId = 3;
      
      component.onSubmit();
      
      expect(mockAuthService.register).toHaveBeenCalledWith(jasmine.objectContaining({
        organizationId: 3
      }));
    });
  });

  describe('edge cases', () => {
    it('should handle multiple rapid submissions', () => {
      mockAuthService.register.and.returnValue(of(mockRegisterResponse));
      
      component.onSubmit();
      component.onSubmit();
      component.onSubmit();

      expect(mockAuthService.register).toHaveBeenCalledTimes(3);
    });

    it('should handle service throwing non-error objects', () => {
      mockAuthService.register.and.returnValue(throwError(() => 'string error'));

      component.onSubmit();
      
      expect(component.errorMessage).toBe('Registration failed. Please try again.');
      expect(component.isLoading).toBe(false);
    });

    it('should handle undefined error response', () => {
      mockAuthService.register.and.returnValue(throwError(() => undefined));

      component.onSubmit();

      expect(component.errorMessage).toBe('Registration failed. Please try again.');
      expect(component.isLoading).toBe(false);
    });

    it('should handle very long organization names', () => {
      const longOrgName = 'A'.repeat(1000);
      const longOrganizations = [{ id: 1, name: longOrgName, description: 'Long description' }];
      mockAuthService.getOrganizations.and.returnValue(of(longOrganizations));

      component.loadOrganizations();

      expect(component.organizations).toEqual(longOrganizations);
    });
  });

  describe('form validation scenarios', () => {
    it('should handle all required fields filled', () => {
      mockAuthService.register.and.returnValue(of(mockRegisterResponse));
      component.userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'John',
        lastName: 'Doe',
        role: UserRole.VIEWER,
        organizationId: undefined
      };

      component.onSubmit();

      expect(mockAuthService.register).toHaveBeenCalledWith(component.userData);
    });

    it('should handle partial data', () => {
      mockAuthService.register.and.returnValue(of(mockRegisterResponse));
      component.userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: '',
        lastName: '',
        role: UserRole.VIEWER,
        organizationId: undefined
      };

      component.onSubmit();

      expect(mockAuthService.register).toHaveBeenCalledWith(component.userData);
    });
  });
});
