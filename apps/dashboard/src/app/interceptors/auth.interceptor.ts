import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { Router } from '@angular/router';

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  
  // Get the token directly from sessionStorage to avoid circular dependency
  const token = sessionStorage.getItem('access_token');
  
  // If token exists, add it to the Authorization header
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  // Handle the request and catch any errors
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.log('HTTP interceptor caught error:', error.status);
      // If we get a 401 Unauthorized, the token is invalid
      if (error.status === 401) {
        console.log('401 error - clearing token and redirecting to login');
        // Clear the invalid token directly from sessionStorage
        sessionStorage.removeItem('access_token');
        // Redirect to login
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};
