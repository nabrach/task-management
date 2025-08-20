import { TestBed } from '@angular/core/testing';
import { HttpTestingController } from '@angular/common/http/testing';
import { TasksService } from './tasks.service';
import { Task, TaskWithUsers, CreateTaskDto, UpdateTaskDto } from '@my-workspace/data';
import { testProviders } from '../../test-helpers/test-setup';

describe('TasksService', () => {
  let service: TasksService;
  let httpMock: HttpTestingController;

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    status: 'new',
    category: 'work',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
    organizationId: 1
  };

  const mockTaskWithUsers: TaskWithUsers = {
    ...mockTask,
    creator: {
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user' as any
    },
    assignee: {
      id: 1,
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user' as any
    }
  };

  const mockCreateTaskDto: CreateTaskDto = {
    title: 'New Task',
    description: 'New Description',
    category: 'personal',
  };

  const mockUpdateTaskDto: UpdateTaskDto = {
    title: 'Updated Task',
    status: 'in-progress'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [...testProviders, TasksService]
    });
    service = TestBed.inject(TasksService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getTasks', () => {
    it('should fetch all tasks successfully', () => {
      const mockTasks: TaskWithUsers[] = [mockTaskWithUsers];

      service.getTasks().subscribe(tasks => {
        expect(tasks).toEqual(mockTasks);
      });

      const req = httpMock.expectOne('http://localhost:3000/tasks');
      expect(req.request.method).toBe('GET');
      req.flush(mockTasks);
    });

    it('should handle empty tasks array', () => {
      service.getTasks().subscribe(tasks => {
        expect(tasks).toEqual([]);
      });

      const req = httpMock.expectOne('http://localhost:3000/tasks');
      req.flush([]);
    });

    it('should handle HTTP error', () => {
      service.getTasks().subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/tasks');
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('getTask', () => {
    it('should fetch a single task by ID successfully', () => {
      const taskId = 1;

      service.getTask(taskId).subscribe(task => {
        expect(task).toEqual(mockTask);
      });

      const req = httpMock.expectOne(`http://localhost:3000/tasks/${taskId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockTask);
    });

    it('should handle task not found', () => {
      const taskId = 999;

      service.getTask(taskId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/tasks/${taskId}`);
      req.flush('Task not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('createTask', () => {
    it('should create a new task successfully', () => {
      service.createTask(mockCreateTaskDto).subscribe(task => {
        expect(task).toEqual(mockTaskWithUsers);
      });

      const req = httpMock.expectOne('http://localhost:3000/tasks');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockCreateTaskDto);
      req.flush(mockTaskWithUsers);
    });

    it('should handle creation validation error', () => {
      const invalidTaskDto = { ...mockCreateTaskDto, title: '' };

      service.createTask(invalidTaskDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(400);
        }
      });

      const req = httpMock.expectOne('http://localhost:3000/tasks');
      req.flush('Validation error', { status: 400, statusText: 'Bad Request' });
    });
  });

  describe('updateTask', () => {
    it('should update an existing task successfully', () => {
      const taskId = 1;

      service.updateTask(taskId, mockUpdateTaskDto).subscribe(task => {
        expect(task).toEqual(mockTaskWithUsers);
      });

      const req = httpMock.expectOne(`http://localhost:3000/tasks/${taskId}`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual(mockUpdateTaskDto);
      req.flush(mockTaskWithUsers);
    });

    it('should handle update with non-existent task ID', () => {
      const taskId = 999;

      service.updateTask(taskId, mockUpdateTaskDto).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/tasks/${taskId}`);
      req.flush('Task not found', { status: 404, statusText: 'Not Found' });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', () => {
      const taskId = 1;

      service.deleteTask(taskId).subscribe(result => {
        expect(result).toBe(true);
      });

      const req = httpMock.expectOne(`http://localhost:3000/tasks/${taskId}`);
      expect(req.request.method).toBe('DELETE');
      req.flush(true);
    });

    it('should handle deletion of non-existent task', () => {
      const taskId = 999;

      service.deleteTask(taskId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(404);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/tasks/${taskId}`);
      req.flush('Task not found', { status: 404, statusText: 'Not Found' });
    });

    it('should handle deletion error', () => {
      const taskId = 1;

      service.deleteTask(taskId).subscribe({
        next: () => fail('should have failed'),
        error: (error) => {
          expect(error.status).toBe(500);
        }
      });

      const req = httpMock.expectOne(`http://localhost:3000/tasks/${taskId}`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  describe('API URL configuration', () => {
    it('should use correct API base URL', () => {
      expect((service as any).API_URL).toBe('http://localhost:3000/tasks');
    });
  });
});
