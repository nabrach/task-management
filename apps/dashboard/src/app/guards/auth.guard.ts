import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, take, filter } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean> => {
  const router = inject(Router);
  const authService = inject(AuthService);
  
  console.log('AuthGuard: canActivate called');
  console.log('AuthGuard: current user exists:', !!authService.getCurrentUser());
  console.log('AuthGuard: token exists:', authService.isLoggedIn());
  
  // If user is already loaded, allow access
  if (authService.getCurrentUser()) {
    console.log('AuthGuard: user already loaded, allowing access');
    return of(true);
  }

  // If there's a token but no user, wait for any existing auth check to complete
  if (authService.isLoggedIn()) {
    console.log('AuthGuard: token exists but no user, waiting for auth status...');
    
    // Wait for a non-null user value, then check
    return authService.currentUser$.pipe(
      // Skip null values and wait for actual user data
      filter((user: any) => user !== null),
      take(1),
      map(user => {
        console.log('AuthGuard: user state updated, user exists:', !!user);
        if (user) {
          console.log('AuthGuard: allowing access to dashboard');
          return true;
        } else {
          console.log('AuthGuard: no user after waiting, redirecting to login');
          // If still no user after waiting, redirect to login
          router.navigate(['/login']);
          return false;
        }
      })
    );
  }

  console.log('AuthGuard: no token, redirecting to login');
  // No token, redirect to login
  router.navigate(['/login']);
  return of(false);
};
