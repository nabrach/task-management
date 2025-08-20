import { testProviders } from '../../../test-helpers/test-setup';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangeDetectorRef } from '@angular/core';
import { TaskAnalyticsComponent } from './task-analytics.component';
import { TaskWithUsers } from '@my-workspace/data';

describe('TaskAnalyticsComponent', () => {
  let component: TaskAnalyticsComponent;
  let fixture: ComponentFixture<TaskAnalyticsComponent>;
  let mockChangeDetectorRef: jasmine.SpyObj<ChangeDetectorRef>;

  const mockTasks: TaskWithUsers[] = [
    {
      id: 1,
      title: 'Work Task 1',
      description: 'Description 1',
      status: 'new',
      category: 'work',
      completed: false,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      organizationId: 1,
      creator: {
        id: 1,
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as any
      },
      assignee: {
        id: 1,
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as any
      }
    },
    {
      id: 2,
      title: 'Personal Task 1',
      description: 'Description 2',
      status: 'in-progress',
      category: 'personal',
      completed: false,
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-03'),
      organizationId: 1,
      creator: {
        id: 1,
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as any
      },
      assignee: {
        id: 1,
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as any
      }
    },
    {
      id: 3,
      title: 'Completed Task 1',
      description: 'Description 3',
      status: 'completed',
      category: 'work',
      completed: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-05'),
      organizationId: 1,
      creator: {
        id: 1,
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as any
      },
      assignee: {
        id: 1,
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as any
      }
    },
    {
      id: 4,
      title: 'Other Task 1',
      description: 'Description 4',
      status: 'completed',
      category: 'other',
      completed: true,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-06'),
      organizationId: 1,
      creator: {
        id: 1,
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as any
      },
      assignee: {
        id: 1,
        email: 'user1@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user' as any
      }
    }
  ];

  beforeEach(async () => {
    mockChangeDetectorRef = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      imports: [TaskAnalyticsComponent],
      providers: [
        { provide: ChangeDetectorRef, useValue: mockChangeDetectorRef },
        ...testProviders
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TaskAnalyticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(component.tasks).toEqual([]);
      expect(component.totalTasks()).toBe(0);
      expect(component.completedTasks()).toBe(0);
      expect(component.completionRate()).toBe(0);
      expect(component.averageCompletionTime()).toBe(0);
    });

    it('should have chart configurations', () => {
      expect(component.pieChartOptions).toBeDefined();
      expect(component.barChartOptions).toBeDefined();
      expect(component.lineChartOptions).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should initialize component', () => {
      expect(component).toBeTruthy();
    });
  });

  describe('computed values', () => {
    beforeEach(() => {
      component.tasks = mockTasks;
    });

    it('should calculate total tasks correctly', () => {
      expect(component.totalTasks()).toBe(4);
    });

    it('should calculate completed tasks correctly', () => {
      expect(component.completedTasks()).toBe(2);
    });

    it('should calculate completion rate correctly', () => {
      expect(component.completionRate()).toBe(50);
    });

    it('should calculate average completion time for completed tasks', () => {
      expect(component.averageCompletionTime()).toBeGreaterThan(0);
    });

    it('should handle zero tasks gracefully', () => {
      component.tasks = [];
      expect(component.totalTasks()).toBe(0);
      expect(component.completedTasks()).toBe(0);
      expect(component.completionRate()).toBe(0);
      expect(component.averageCompletionTime()).toBe(0);
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined tasks gracefully', () => {
      component.tasks = undefined as any;
      expect(() => component.totalTasks()).not.toThrow();
    });

    it('should handle null tasks gracefully', () => {
      component.tasks = null as any;
      expect(() => component.totalTasks()).not.toThrow();
    });

    it('should handle tasks with missing properties', () => {
      const incompleteTasks = [
        { id: 1, title: 'Task 1' } as any,
        { id: 2, title: 'Task 2', status: 'new' } as any
      ];
      component.tasks = incompleteTasks;
      expect(() => component.totalTasks()).not.toThrow();
    });
  });
});
