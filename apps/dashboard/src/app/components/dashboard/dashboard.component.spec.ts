import { testProviders } from '../../../test-helpers/test-setup';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { DashboardComponent } from './dashboard.component';
import { AuthService, User } from '../../services/auth.service';
import { ChangeDetectorRef } from '@angular/core';
import { UserRole } from '@my-workspace/data';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;

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

  let userSubject: BehaviorSubject<User | null>;

  beforeEach(async () => {
    userSubject = new BehaviorSubject<User | null>(null);
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUser$: userSubject
    });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter },
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        ...testProviders
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with null current user', () => {
      expect(component.currentUser).toBeNull();
    });

    it('should have activeTab set to tasks by default', () => {
      expect(component.activeTab).toBe('tasks');
    });
  });

  describe('ngOnInit', () => {
    it('should update currentUser when auth service emits user', () => {
      component.ngOnInit();
      
      userSubject.next(mockUser);
      
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should handle user logout by setting currentUser to null', () => {
      userSubject.next(mockUser); // Set initial user
      component.ngOnInit();
      
      userSubject.next(null);
      
      expect(component.currentUser).toBeNull();
    });
  });

  describe('ngAfterViewInit', () => {
    beforeEach(() => {
      spyOn(console, 'log');
    });
  });

  describe('logout', () => {
    it('should call auth service logout method', () => {
      component.logout();
      
      expect(mockAuthService.logout).toHaveBeenCalled();
    });

    it('should navigate to login page after logout', () => {
      component.logout();
      
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should clear current user state', () => {
      component.currentUser = mockUser;
      
      component.logout();
      
      expect(component.currentUser).toBeNull();
    });
  });

  describe('setActiveTab', () => {
    it('should set activeTab to tasks', () => {
      component.setActiveTab('tasks');
      expect(component.activeTab).toBe('tasks');
    });

    it('should set activeTab to audit-logs', () => {
      component.setActiveTab('audit-logs');
      expect(component.activeTab).toBe('audit-logs');
    });
  });

  describe('user state management', () => {
    it('should update currentUser when user logs in', () => {
      component.ngOnInit();
      
      userSubject.next(mockUser);
      
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should handle multiple user state changes', () => {
      component.ngOnInit();
      
      userSubject.next(mockUser);
      expect(component.currentUser).toEqual(mockUser);
      
      userSubject.next(null);
      expect(component.currentUser).toBeNull();
      
      userSubject.next(mockUser);
      expect(component.currentUser).toEqual(mockUser);
    });

    it('should handle user with different roles', () => {
      const adminUser: User = {
        ...mockUser,
        role: UserRole.ADMIN
      };
      
      component.ngOnInit();
      
      userSubject.next(adminUser);
      
      expect(component.currentUser?.role).toBe(UserRole.ADMIN);
    });
  });



  describe('error handling', () => {
    it('should handle auth service errors gracefully', () => {
      expect(() => component.ngOnInit()).not.toThrow();
      
      // Simulate error by emitting null
      userSubject.next(null);
      
      expect(component.currentUser).toBeNull();
    });

    it('should handle undefined user properties gracefully', () => {
      const incompleteUser = {
        id: 1,
        email: 'test@example.com'
        // Missing other properties
      } as User;
      
      component.ngOnInit();
      
      userSubject.next(incompleteUser);
      
      expect(component.currentUser).toEqual(incompleteUser);
    });
  });



  describe('edge cases', () => {
    it('should handle rapid user state changes', () => {
      component.ngOnInit();
      
      // Rapid state changes
      userSubject.next(mockUser);
      userSubject.next(null);
      userSubject.next(mockUser);
      userSubject.next(null);
      
      expect(component.currentUser).toBeNull();
    });

    it('should handle multiple logout calls', () => {
      component.logout();
      component.logout();
      component.logout();
      
      expect(mockAuthService.logout).toHaveBeenCalledTimes(3);
      expect(mockRouter.navigate).toHaveBeenCalledTimes(3);
    });

    it('should handle component destruction gracefully', () => {
      component.ngOnInit();
      
      // Simulate component destruction
      fixture.destroy();
      
      // Should not throw errors
      expect(() => userSubject.next(mockUser)).not.toThrow();
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user workflow', () => {
      // Initialize
      component.ngOnInit();
      expect(component.currentUser).toBeNull();
      
      // User logs in
      userSubject.next(mockUser);
      expect(component.currentUser).toEqual(mockUser);
      
      // User logs out
      component.logout();
      expect(mockAuthService.logout).toHaveBeenCalled();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should handle user session timeout', () => {
      userSubject.next(mockUser);
      
      component.ngOnInit();
      expect(component.currentUser).toEqual(mockUser);
      
      // Simulate session timeout
      userSubject.next(null);
      expect(component.currentUser).toBeNull();
    });
  });
});
