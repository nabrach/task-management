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
      expect(component.totalTasks).toBe(0);
      expect(component.completedTasks).toBe(0);
      expect(component.completionRate).toBe(0);
      expect(component.averageCompletionTime).toBe(0);
    });

    it('should have chart configurations', () => {
      expect(component.pieChartOptions).toBeDefined();
      expect(component.barChartOptions).toBeDefined();
      expect(component.lineChartOptions).toBeDefined();
      expect(component.doughnutChartOptions).toBeDefined();
    });
  });

  describe('ngOnInit', () => {
    it('should call updateCharts on initialization', () => {
      spyOn(component as any, 'updateCharts');
      
      component.ngOnInit();
      
      expect((component as any).updateCharts).toHaveBeenCalled();
    });
  });

  describe('ngOnChanges', () => {
    it('should call updateCharts when tasks input changes', () => {
      spyOn(component as any, 'updateCharts');
      
      component.ngOnChanges();
      
      expect((component as any).updateCharts).toHaveBeenCalled();
    });
  });

  describe('refreshCharts', () => {
    it('should call updateCharts and detectChanges', () => {
      spyOn(component as any, 'updateCharts');
      spyOn((component as any).cdr, 'detectChanges');
      
      component.refreshCharts();
      
      expect((component as any).updateCharts).toHaveBeenCalled();
      expect((component as any).cdr.detectChanges).toHaveBeenCalled();
    });
  });

  describe('updateCharts', () => {
    it('should return early when tasks array is empty', () => {
      spyOn(component as any, 'calculateStatistics');
      spyOn(component as any, 'updatePieChart');
      spyOn(component as any, 'updateBarChart');
      spyOn(component as any, 'updateLineChart');
      spyOn(component as any, 'updateDoughnutChart');
      
      component.tasks = [];
      (component as any).updateCharts();
      
      expect((component as any).calculateStatistics).not.toHaveBeenCalled();
      expect((component as any).updatePieChart).not.toHaveBeenCalled();
      expect((component as any).updateBarChart).not.toHaveBeenCalled();
      expect((component as any).updateLineChart).not.toHaveBeenCalled();
      expect((component as any).updateDoughnutChart).not.toHaveBeenCalled();
    });

    it('should call all update methods when tasks exist', () => {
      spyOn(component as any, 'calculateStatistics');
      spyOn(component as any, 'updatePieChart');
      spyOn(component as any, 'updateBarChart');
      spyOn(component as any, 'updateLineChart');
      spyOn(component as any, 'updateDoughnutChart');
      
      component.tasks = mockTasks;
      (component as any).updateCharts();
      
      expect((component as any).calculateStatistics).toHaveBeenCalled();
      expect((component as any).updatePieChart).toHaveBeenCalled();
      expect((component as any).updateBarChart).toHaveBeenCalled();
      expect((component as any).updateLineChart).toHaveBeenCalled();
      expect((component as any).updateDoughnutChart).toHaveBeenCalled();
    });
  });

  describe('calculateStatistics', () => {
    beforeEach(() => {
      component.tasks = mockTasks;
    });

    it('should calculate total tasks correctly', () => {
      (component as any).calculateStatistics();
      expect(component.totalTasks).toBe(4);
    });

    it('should calculate completed tasks correctly', () => {
      (component as any).calculateStatistics();
      expect(component.completedTasks).toBe(2);
    });

    it('should calculate completion rate correctly', () => {
      (component as any).calculateStatistics();
      expect(component.completionRate).toBe(50);
    });

    it('should calculate average completion time for completed tasks', () => {
      (component as any).calculateStatistics();
      expect(component.averageCompletionTime).toBeGreaterThan(0);
    });

    it('should handle zero tasks gracefully', () => {
      component.tasks = [];
      (component as any).calculateStatistics();
      
      expect(component.totalTasks).toBe(0);
      expect(component.completedTasks).toBe(0);
      expect(component.completionRate).toBe(0);
      expect(component.averageCompletionTime).toBe(0);
    });

    it('should handle tasks without dates gracefully', () => {
      const tasksWithoutDates = mockTasks.map(task => ({
        ...task,
        createdAt: undefined,
        updatedAt: undefined
      }));
      component.tasks = tasksWithoutDates;
      
      expect(() => (component as any).calculateStatistics()).not.toThrow();
    });
  });

  describe('updatePieChart', () => {
    beforeEach(() => {
      component.tasks = mockTasks;
    });

    it('should update pie chart data with correct task counts by status', () => {
      (component as any).updatePieChart();
      
      expect(component.pieChartData.datasets[0].data).toEqual([1, 1, 2]);
    });

    it('should handle tasks with different statuses', () => {
      const mixedStatusTasks = [
        { ...mockTasks[0], status: 'new' as 'new' | 'in-progress' | 'completed' },
        { ...mockTasks[1], status: 'in-progress' as 'new' | 'in-progress' | 'completed' },
        { ...mockTasks[2], status: 'completed' as 'new' | 'in-progress' | 'completed' },
        { ...mockTasks[3], status: 'new' as 'new' | 'in-progress' | 'completed' }
      ];
      component.tasks = mixedStatusTasks;
      
      (component as any).updatePieChart();
      
      expect(component.pieChartData.datasets[0].data).toEqual([2, 1, 1]);
    });
  });

  describe('updateBarChart', () => {
    beforeEach(() => {
      component.tasks = mockTasks;
    });

    it('should update bar chart data with correct task counts by category', () => {
      (component as any).updateBarChart();
      
      expect(component.barChartData.datasets[0].data).toEqual([2, 1, 1]);
    });

    it('should handle tasks with different categories', () => {
      const mixedCategoryTasks = [
        { ...mockTasks[0], category: 'work' as 'work' | 'personal' | 'other' },
        { ...mockTasks[1], category: 'personal' as 'work' | 'personal' | 'other' },
        { ...mockTasks[2], category: 'work' as 'work' | 'personal' | 'other' },
        { ...mockTasks[3], category: 'other' as 'work' | 'personal' | 'other' }
      ];
      component.tasks = mixedCategoryTasks;
      
      (component as any).updateBarChart();
      
      expect(component.barChartData.datasets[0].data).toEqual([2, 1, 1]);
    });
  });

  describe('updateLineChart', () => {
    beforeEach(() => {
      component.tasks = mockTasks;
    });

    it('should generate last 7 days labels', () => {
      (component as any).updateLineChart();
      
      expect(component.lineChartData.labels?.length).toBe(7);
    });

    it('should count completed tasks for each day', () => {
      (component as any).updateLineChart();
      
      expect(component.lineChartData.datasets[0].data.length).toBe(7);
      expect(component.lineChartData.datasets[0].data.every(count => typeof count === 'number')).toBe(true);
    });

    it('should handle tasks without updatedAt dates', () => {
      const tasksWithoutDates = mockTasks.map(task => ({
        ...task,
        updatedAt: undefined
      }));
      component.tasks = tasksWithoutDates;
      
      expect(() => (component as any).updateLineChart()).not.toThrow();
    });
  });

  describe('updateDoughnutChart', () => {
    beforeEach(() => {
      component.tasks = mockTasks;
    });

    it('should update doughnut chart data with completed tasks by category', () => {
      (component as any).updateDoughnutChart();
      
      expect(component.doughnutChartData.datasets[0].data).toEqual([1, 0, 1]);
    });

    it('should handle tasks with different completion statuses', () => {
      const mixedCompletionTasks = [
        { ...mockTasks[0], completed: true, category: 'work' as 'work' | 'personal' | 'other' },
        { ...mockTasks[1], completed: false, category: 'personal' as 'work' | 'personal' | 'other' },
        { ...mockTasks[2], completed: true, category: 'work' as 'work' | 'personal' | 'other' },
        { ...mockTasks[3], completed: false, category: 'other' as 'work' | 'personal' | 'other' }
      ];
      component.tasks = mixedCompletionTasks;
      
      (component as any).updateDoughnutChart();
      
      expect(component.doughnutChartData.datasets[0].data).toEqual([2, 0, 0]);
    });
  });

  describe('getCompletionRateColor', () => {
    it('should return green for completion rate >= 80%', () => {
      component.completionRate = 85;
      expect(component.getCompletionRateColor()).toBe('text-green-600');
    });

    it('should return yellow for completion rate >= 60% and < 80%', () => {
      component.completionRate = 70;
      expect(component.getCompletionRateColor()).toBe('text-yellow-600');
    });

    it('should return red for completion rate < 60%', () => {
      component.completionRate = 45;
      expect(component.getCompletionRateColor()).toBe('text-red-600');
    });

    it('should handle edge cases', () => {
      component.completionRate = 80;
      expect(component.getCompletionRateColor()).toBe('text-green-600');
      
      component.completionRate = 60;
      expect(component.getCompletionRateColor()).toBe('text-yellow-600');
      
      component.completionRate = 59.9;
      expect(component.getCompletionRateColor()).toBe('text-red-600');
    });
  });

  describe('formatCompletionTime', () => {
    it('should format time in hours when less than 1 day', () => {
      component.averageCompletionTime = 0.5; // 12 hours
      expect(component.formatCompletionTime()).toBe('12 hours');
    });

    it('should format time in days when 1 day or more', () => {
      component.averageCompletionTime = 2.5;
      expect(component.formatCompletionTime()).toBe('2.5 days');
    });

    it('should handle zero time', () => {
      component.averageCompletionTime = 0;
      expect(component.formatCompletionTime()).toBe('0 hours');
    });

    it('should handle very small time values', () => {
      component.averageCompletionTime = 0.01; // 0.24 hours
      expect(component.formatCompletionTime()).toBe('0 hours');
    });
  });

  describe('chart data structure', () => {
    it('should have correct pie chart structure', () => {
      expect(component.pieChartData.labels).toEqual(['New', 'In Progress', 'Completed']);
      expect(component.pieChartData.datasets[0].backgroundColor).toBeDefined();
      expect(component.pieChartData.datasets[0].borderColor).toBeDefined();
    });

    it('should have correct bar chart structure', () => {
      expect(component.barChartData.labels).toEqual(['Work', 'Personal', 'Other']);
      expect(component.barChartData.datasets[0].label).toBe('Total Tasks');
    });

    it('should have correct line chart structure', () => {
      expect(component.lineChartData.datasets[0].label).toBe('Completed Tasks');
      expect(component.lineChartData.datasets[0].borderColor).toBe('#10B981');
    });

    it('should have correct doughnut chart structure', () => {
      expect(component.doughnutChartData.labels).toEqual(['Work', 'Personal', 'Other']);
      expect(component.doughnutChartData.datasets[0].backgroundColor).toBeDefined();
    });
  });

  describe('edge cases and error handling', () => {
    it('should handle undefined tasks gracefully', () => {
      component.tasks = undefined as any;
      
      expect(() => (component as any).updateCharts()).not.toThrow();
    });

    it('should handle null tasks gracefully', () => {
      component.tasks = null as any;
      
      expect(() => (component as any).updateCharts()).not.toThrow();
    });

    it('should handle tasks with missing properties', () => {
      const incompleteTasks = [
        { id: 1, title: 'Task 1' } as any,
        { id: 2, title: 'Task 2', status: 'new' } as any
      ];
      component.tasks = incompleteTasks;
      
      expect(() => (component as any).updateCharts()).not.toThrow();
    });
  });
});
