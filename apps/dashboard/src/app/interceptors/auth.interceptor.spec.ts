import { TestBed } from '@angular/core/testing';
import { HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthInterceptor } from './auth.interceptor';
import { testProviders } from '../../test-helpers/test-setup';

describe('AuthInterceptor', () => {
  let mockRouter: jasmine.SpyObj<Router>;
  let mockHttpHandler: jasmine.SpyObj<HttpHandler>;
  let mockRequest: HttpRequest<any>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockHttpHandler = jasmine.createSpyObj('HttpHandler', ['handle']);
    mockRequest = new HttpRequest('GET', 'http://localhost:3000/api/test');

    TestBed.configureTestingModule({
      providers: [
        ...testProviders,
        { provide: Router, useValue: mockRouter }
      ]
    });

    // Clear sessionStorage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should be defined', () => {
    expect(AuthInterceptor).toBeDefined();
  });

  describe('token handling', () => {
    it('should add Authorization header when token exists', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      mockHttpHandler.handle.and.returnValue(of(new HttpResponse({ body: {} })));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe();
      });

      expect(mockHttpHandler.handle).toHaveBeenCalledWith(
        jasmine.objectContaining({
          headers: jasmine.objectContaining({
            lazyUpdate: jasmine.arrayContaining([
              jasmine.objectContaining({
                name: 'Authorization',
                value: `Bearer ${token}`
              })
            ])
          })
        })
      );
    });

    it('should not add Authorization header when no token exists', () => {
      mockHttpHandler.handle.and.returnValue(of(new HttpResponse({ body: {} })));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe();
      });

      expect(mockHttpHandler.handle).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle empty token string', () => {
      sessionStorage.setItem('access_token', '');
      mockHttpHandler.handle.and.returnValue(of(new HttpResponse({ body: {} })));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe();
      });

      expect(mockHttpHandler.handle).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle whitespace-only token', () => {
      sessionStorage.setItem('access_token', '   ');
      mockHttpHandler.handle.and.returnValue(of(new HttpResponse({ body: {} })));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe();
      });

      expect(mockHttpHandler.handle).toHaveBeenCalledWith(mockRequest);
    });

    it('should preserve existing headers when adding Authorization', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      const requestWithHeaders = new HttpRequest('GET', 'http://localhost:3000/api/test', null, {
        headers: new HttpHeaders({
          'Content-Type': 'application/json',
          'Custom-Header': 'custom-value'
        })
      });
      mockHttpHandler.handle.and.returnValue(of(new HttpResponse({ body: {} })));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(requestWithHeaders, mockHttpHandler.handle);
        result.subscribe();
      });

      expect(mockHttpHandler.handle).toHaveBeenCalledWith(
        jasmine.objectContaining({
          headers: jasmine.objectContaining({
            lazyUpdate: jasmine.arrayContaining([
              jasmine.objectContaining({
                name: 'Authorization',
                value: `Bearer ${token}`
              })
            ])
          })
        })
      );
    });
  });

  describe('request handling', () => {
    it('should pass through successful requests unchanged', () => {
      const mockResponse = new HttpResponse({ body: { data: 'success' } });
      mockHttpHandler.handle.and.returnValue(of(mockResponse));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe(response => {
          expect(response).toEqual(mockResponse);
        });
      });

      expect(mockHttpHandler.handle).toHaveBeenCalledWith(mockRequest);
    });

    it('should handle different HTTP methods', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      const methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'];
      
      methods.forEach(method => {
        const request = new HttpRequest(method as any, 'http://localhost:3000/api/test');
        mockHttpHandler.handle.and.returnValue(of(new HttpResponse({ body: {} })));

        TestBed.runInInjectionContext(() => {
          const result = AuthInterceptor(request, mockHttpHandler.handle);
          result.subscribe();
        });

        expect(mockHttpHandler.handle).toHaveBeenCalledWith(
          jasmine.objectContaining({
            method: method
          })
        );
      });
    });

    it('should handle different URLs', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      const urls = [
        'http://localhost:3000/api/tasks',
        'http://localhost:3000/api/users',
        'http://localhost:3000/api/organizations'
      ];
      
      urls.forEach(url => {
        const request = new HttpRequest('GET', url);
        mockHttpHandler.handle.and.returnValue(of(new HttpResponse({ body: {} })));

        TestBed.runInInjectionContext(() => {
          const result = AuthInterceptor(request, mockHttpHandler.handle);
          result.subscribe();
        });

        expect(mockHttpHandler.handle).toHaveBeenCalledWith(
          jasmine.objectContaining({
            url: url
          })
        );
      });
    });
  });

  describe('error handling', () => {
    it('should handle 401 Unauthorized error', () => {
      spyOn(console, 'log');
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: (err) => {
            expect(err).toEqual(error);
            expect(console.log).toHaveBeenCalledWith('401 error - clearing token and redirecting to login');
            expect(sessionStorage.getItem('access_token')).toBeNull();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
          }
        });
      });
    });

    it('should clear token on 401 error', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(sessionStorage.getItem('access_token')).toBeNull();
          }
        });
      });
    });

    it('should redirect to login on 401 error', () => {
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
          }
        });
      });
    });

    it('should not clear token on non-401 errors', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      const error = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(sessionStorage.getItem('access_token')).toBe(token);
            expect(mockRouter.navigate).not.toHaveBeenCalled();
          }
        });
      });
    });

    it('should handle 403 Forbidden error without clearing token', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      const error = new HttpErrorResponse({ status: 403, statusText: 'Forbidden' });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(sessionStorage.getItem('access_token')).toBe(token);
            expect(mockRouter.navigate).not.toHaveBeenCalled();
          }
        });
      });
    });

    it('should handle 404 Not Found error without clearing token', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      const error = new HttpErrorResponse({ status: 404, statusText: 'Not Found' });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(sessionStorage.getItem('access_token')).toBe(token);
            expect(mockRouter.navigate).not.toHaveBeenCalled();
          }
        });
      });
    });

    it('should handle 500 Internal Server Error without clearing token', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      const error = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(sessionStorage.getItem('access_token')).toBe(token);
            expect(mockRouter.navigate).not.toHaveBeenCalled();
          }
        });
      });
    });

    it('should handle network errors without clearing token', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      const error = new HttpErrorResponse({ error: new ErrorEvent('Network error') });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(sessionStorage.getItem('access_token')).toBe(token);
            expect(mockRouter.navigate).not.toHaveBeenCalled();
          }
        });
      });
    });
  });

  describe('console logging', () => {
    it('should log HTTP interceptor errors', () => {
      spyOn(console, 'log');
      const error = new HttpErrorResponse({ status: 500, statusText: 'Internal Server Error' });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(console.log).toHaveBeenCalledWith('HTTP interceptor caught error:', 500);
          }
        });
      });
    });

    it('should log 401 errors specifically', () => {
      spyOn(console, 'log');
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(console.log).toHaveBeenCalledWith('HTTP interceptor caught error:', 401);
            expect(console.log).toHaveBeenCalledWith('401 error - clearing token and redirecting to login');
          }
        });
      });
    });
  });

  describe('edge cases', () => {
    it('should handle undefined error status', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      const error = new HttpErrorResponse({ error: new Error('Unknown error') });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(sessionStorage.getItem('access_token')).toBe(token);
            expect(mockRouter.navigate).not.toHaveBeenCalled();
          }
        });
      });
    });

    it('should handle null error status', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      const error = new HttpErrorResponse({ status: null as any, statusText: 'Unknown' });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(sessionStorage.getItem('access_token')).toBe(token);
            expect(mockRouter.navigate).not.toHaveBeenCalled();
          }
        });
      });
    });

    it('should handle rapid successive requests', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      mockHttpHandler.handle.and.returnValue(of(new HttpResponse({ body: {} })));

      TestBed.runInInjectionContext(() => {
        // Make multiple rapid requests
        for (let i = 0; i < 5; i++) {
          const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
          result.subscribe();
        }

        expect(mockHttpHandler.handle).toHaveBeenCalledTimes(5);
      });
    });

    it('should handle token changes between requests', () => {
      mockHttpHandler.handle.and.returnValue(of(new HttpResponse({ body: {} })));

      TestBed.runInInjectionContext(() => {
        // First request without token
        let result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe();

        // Second request with token
        sessionStorage.setItem('access_token', 'new-token');
        result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe();

        expect(mockHttpHandler.handle).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete authentication flow', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      mockHttpHandler.handle.and.returnValue(of(new HttpResponse({ body: { data: 'success' } })));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe(response => {
          expect(response).toEqual(jasmine.objectContaining({ body: { data: 'success' } }));
        });
      });

      expect(mockHttpHandler.handle).toHaveBeenCalledWith(
        jasmine.objectContaining({
          headers: jasmine.objectContaining({
            lazyUpdate: jasmine.arrayContaining([
              jasmine.objectContaining({
                name: 'Authorization',
                value: `Bearer ${token}`
              })
            ])
          })
        })
      );
    });

    it('should handle authentication failure and recovery', () => {
      const token = 'mock-jwt-token';
      sessionStorage.setItem('access_token', token);
      
      // First request fails with 401
      const error = new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' });
      mockHttpHandler.handle.and.returnValue(throwError(() => error));

      TestBed.runInInjectionContext(() => {
        const result = AuthInterceptor(mockRequest, mockHttpHandler.handle);
        result.subscribe({
          next: () => fail('should have failed'),
          error: () => {
            expect(sessionStorage.getItem('access_token')).toBeNull();
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
          }
        });
      });

      // Token should be cleared
      expect(sessionStorage.getItem('access_token')).toBeNull();
    });
  });
});
