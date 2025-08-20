import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { UsersService } from './users.service';
import { IUser } from '@my-workspace/data';
import { testProviders } from '../../test-helpers/test-setup';

describe('UsersService', () => {
  let service: UsersService;
  let httpMock: HttpTestingController;

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

  const mockUsers: IUser[] = [
    mockUser,
    {
      id: 2,
      email: 'jane@example.com',
      firstName: 'Jane',
      lastName: 'Smith',
      role: 'admin' as any,
      organizationId: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...testProviders, UsersService]
    });
    service = TestBed.inject(UsersService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getUsers', () => {
    it('should fetch all users successfully', () => {
      service.getUsers().subscribe(users => {
        expect(users).toEqual(mockUsers);
      });

      const req = httpMock.expectOne('http://localhost:3000/users');
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should handle empty users array', () => {
      service.getUsers().subscribe(users => {
        expect(users).toEqual([]);
      });

      const req = httpMock.expectOne('http://localhost:3000/users');
      req.flush([]);
    });

    it('should handle HTTP error', () => {
      service.getUsers().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/users');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getUsersByOrganization', () => {
    it('should fetch users by organization ID successfully', () => {
      const organizationId = 1;

      service.getUsersByOrganization(organizationId).subscribe(users => {
        expect(users).toEqual(mockUsers);
      });

      const req = httpMock.expectOne(`http://localhost:3000/users/organization/${organizationId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUsers);
    });

    it('should handle organization with no users', () => {
      const organizationId = 2;

      service.getUsersByOrganization(organizationId).subscribe(users => {
        expect(users).toEqual([]);
      });

      const req = httpMock.expectOne(`http://localhost:3000/users/organization/${organizationId}`);
      req.flush([]);
    });

    it('should handle organization not found', () => {
      const organizationId = 999;

      service.getUsersByOrganization(organizationId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/users/organization/${organizationId}`);
      req.flush('Organization not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('getUser', () => {
    it('should fetch a single user by ID successfully', () => {
      const userId = 1;

      service.getUser(userId).subscribe(user => {
        expect(user).toEqual(mockUser);
      });

      const req = httpMock.expectOne(`http://localhost:3000/users/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockUser);
    });

    it('should handle user not found', () => {
      const userId = 999;

      service.getUser(userId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/users/${userId}`);
      req.flush('User not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle invalid user ID', () => {
      const userId = -1;

      service.getUser(userId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/users/${userId}`);
      req.flush('Invalid user ID', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('API URL configuration', () => {
    it('should use correct API base URL', () => {
      expect((service as any).API_URL).toBe('http://localhost:3000/users');
    });
  });

  describe('HTTP method verification', () => {
    it('should use GET method for all requests', () => {
      service.getUsers().subscribe();
      service.getUsersByOrganization(1).subscribe();
      service.getUser(1).subscribe();

      const req1 = httpMock.expectOne('http://localhost:3000/users');
      const req2 = httpMock.expectOne('http://localhost:3000/users/organization/1');
      const req3 = httpMock.expectOne('http://localhost:3000/users/1');

      expect(req1.request.method).toBe('GET');
      expect(req2.request.method).toBe('GET');
      expect(req3.request.method).toBe('GET');

      req1.flush(mockUsers);
      req2.flush(mockUsers);
      req3.flush(mockUser);
    });
  });
});
