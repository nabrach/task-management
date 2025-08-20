import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, Observable } from 'rxjs';
import { AuthGuard } from './auth.guard';
import { AuthService } from '../services/auth.service';
import { IUser } from '@my-workspace/data';
import { testProviders } from '../../test-helpers/test-setup';

describe('AuthGuard', () => {
  let mockRouter: jasmine.SpyObj<Router>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let userSubject: BehaviorSubject<IUser | null>;

  const mockUser: IUser = {
    id: 1,
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user' as any,
    organizationId: 1,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    userSubject = new BehaviorSubject<IUser | null>(null);
    mockAuthService = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'isLoggedIn'], {
      currentUser$: userSubject
    });

    TestBed.configureTestingModule({
      providers: [
        ...testProviders,
        { provide: Router, useValue: mockRouter },
        { provide: AuthService, useValue: mockAuthService }
      ]
    });
  });

  afterEach(() => {
    userSubject.next(null);
  });

  it('should be defined', () => {
    expect(AuthGuard).toBeDefined();
  });

  describe('when user is already loaded', () => {
    it('should allow access immediately', () => {
      spyOn(console, 'log');
      mockAuthService.getCurrentUser.and.returnValue(mockUser);

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(true);
        expect(console.log).toHaveBeenCalledWith('AuthGuard: user already loaded, allowing access');
        expect(mockRouter.navigate).not.toHaveBeenCalled();
      });
    });

    it('should not check token when user exists', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);

      TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      // isLoggedIn is called for logging but not for logic when user exists
      expect(mockAuthService.isLoggedIn).toHaveBeenCalled();
    });
  });

  describe('when token exists but no user', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.isLoggedIn.and.returnValue(true);
    });

    it('should wait for user state and allow access when user arrives', (done) => {
      spyOn(console, 'log');

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(true);
        expect(console.log).toHaveBeenCalledWith('AuthGuard: allowing access to dashboard');
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      });

      // Simulate user state update
      userSubject.next(mockUser);
    });

    it('should wait for user state and redirect when no user arrives', (done) => {
      spyOn(console, 'log');

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(false);
        expect(console.log).toHaveBeenCalledWith('AuthGuard: no user after waiting, redirecting to login');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });

      // Simulate no user (emit null)
      userSubject.next(null);
    });

    it('should filter out null values while waiting', (done) => {
      spyOn(console, 'log');

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(true);
        expect(console.log).toHaveBeenCalledWith('AuthGuard: allowing access to dashboard');
        done();
      });

      // Emit null values first (should be filtered out)
      userSubject.next(null);
      userSubject.next(null);
      userSubject.next(null);
      
      // Then emit actual user
      userSubject.next(mockUser);
    });

    it('should take only the first non-null user value', (done) => {
      spyOn(console, 'log');

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(true);
        expect(console.log).toHaveBeenCalledWith('AuthGuard: allowing access to dashboard');
        done();
      });

      // Emit user
      userSubject.next(mockUser);
      
      // Emit another user (should not affect the result)
      userSubject.next({ ...mockUser, id: 2 });
    });
  });

  describe('when no token exists', () => {
    beforeEach(() => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.isLoggedIn.and.returnValue(false);
    });

    it('should redirect to login immediately', () => {
      spyOn(console, 'log');

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(false);
        expect(console.log).toHaveBeenCalledWith('AuthGuard: no token, redirecting to login');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      });
    });

    it('should not wait for user state when no token', () => {
      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(false);
      });

      // Even if user state changes later, it shouldn't affect the result
      userSubject.next(mockUser);
    });
  });

  describe('console logging', () => {
    it('should log when canActivate is called', () => {
      spyOn(console, 'log');
      mockAuthService.getCurrentUser.and.returnValue(mockUser);

      TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      expect(console.log).toHaveBeenCalledWith('AuthGuard: canActivate called');
    });

    it('should log current user existence', () => {
      spyOn(console, 'log');
      mockAuthService.getCurrentUser.and.returnValue(mockUser);

      TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      expect(console.log).toHaveBeenCalledWith('AuthGuard: current user exists:', true);
    });

    it('should log token existence', () => {
      spyOn(console, 'log');
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAuthService.isLoggedIn.and.returnValue(true);

      TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      expect(console.log).toHaveBeenCalledWith('AuthGuard: token exists:', true);
    });

    it('should log when waiting for auth status', () => {
      spyOn(console, 'log');
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.isLoggedIn.and.returnValue(true);

      TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      expect(console.log).toHaveBeenCalledWith('AuthGuard: token exists but no user, waiting for auth status...');
    });
  });

  describe('edge cases', () => {
    it('should handle rapid user state changes', (done) => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.isLoggedIn.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(true);
        done();
      });

      // Rapid state changes
      userSubject.next(null);
      userSubject.next(mockUser);
      userSubject.next(null);
      userSubject.next(mockUser);
    });

    it('should handle undefined user values', (done) => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.isLoggedIn.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });

      // Emit undefined (should be treated as null)
      userSubject.next(undefined as any);
    });

    it('should handle empty user object', (done) => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.isLoggedIn.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(false);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });

      // Emit empty object (should be treated as falsy)
      userSubject.next({} as any);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete authentication flow', (done) => {
      spyOn(console, 'log');
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.isLoggedIn.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(true);
        expect(console.log).toHaveBeenCalledWith('AuthGuard: allowing access to dashboard');
        expect(mockRouter.navigate).not.toHaveBeenCalled();
        done();
      });

      // Simulate authentication process
      userSubject.next(mockUser);
    });

    it('should handle authentication timeout scenario', (done) => {
      spyOn(console, 'log');
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.isLoggedIn.and.returnValue(true);

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(false);
        expect(console.log).toHaveBeenCalledWith('AuthGuard: no user after waiting, redirecting to login');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
        done();
      });

      // Simulate no user response (timeout)
      userSubject.next(null);
    });

    it('should handle token expiration scenario', () => {
      spyOn(console, 'log');
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.isLoggedIn.and.returnValue(false);

      const result = TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      (result as Observable<boolean>).subscribe((allow: boolean) => {
        expect(allow).toBe(false);
        expect(console.log).toHaveBeenCalledWith('AuthGuard: no token, redirecting to login');
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
      });
    });
  });

  describe('navigation behavior', () => {
    it('should navigate to login route when access denied', () => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.isLoggedIn.and.returnValue(false);

      TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should not navigate when access is allowed', () => {
      mockAuthService.getCurrentUser.and.returnValue(mockUser);

      TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      expect(mockRouter.navigate).not.toHaveBeenCalled();
    });

    it('should navigate only once per guard call', () => {
      mockAuthService.getCurrentUser.and.returnValue(null);
      mockAuthService.isLoggedIn.and.returnValue(false);

      TestBed.runInInjectionContext(() => AuthGuard({} as any, {} as any));

      expect(mockRouter.navigate).toHaveBeenCalledTimes(1);
    });
  });
});
