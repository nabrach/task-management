import { Component, Input, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgChartsModule } from 'ng2-charts';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { TaskWithUsers } from '@my-workspace/data';

@Component({
  selector: 'app-task-analytics',
  standalone: true,
  imports: [CommonModule, NgChartsModule],
  templateUrl: './task-analytics.component.html',
  styleUrls: ['./task-analytics.component.css']
})
export class TaskAnalyticsComponent implements OnInit, OnDestroy {
  @Input() set tasks(value: TaskWithUsers[]) {
    this.tasksSignal.set(value);
  }

  // Convert to signal
  private tasksSignal = signal<TaskWithUsers[]>([]);

  // Computed signals for chart data
  public pieChartData = computed(() => {
    const tasks = this.tasksSignal();
    const newCount = tasks.filter(task => task.status === 'new').length;
    const inProgressCount = tasks.filter(task => task.status === 'in-progress').length;
    const completedCount = tasks.filter(task => task.status === 'completed').length;

    return {
      labels: ['New', 'In Progress', 'Completed'],
      datasets: [{
        data: [newCount, inProgressCount, completedCount],
        backgroundColor: ['#3B82F6', '#F59E0B', '#10B981'],
        borderColor: ['#2563EB', '#D97706', '#059669'],
        borderWidth: 2
      }]
    };
  });

  public barChartData = computed(() => {
    const tasks = this.tasksSignal();
    const workCount = tasks.filter(task => task.category === 'work').length;
    const personalCount = tasks.filter(task => task.category === 'personal').length;
    const otherCount = tasks.filter(task => task.category === 'other').length;

    return {
      labels: ['Work', 'Personal', 'Other'],
      datasets: [{
        data: [workCount, personalCount, otherCount],
        label: 'Total Tasks',
        backgroundColor: ['#3B82F6', '#8B5CF6', '#6B7280'],
        borderColor: ['#2563EB', '#7C3AED', '#4B5563'],
        borderWidth: 1
      }]
    };
  });

  public lineChartData = computed(() => {
    const tasks = this.tasksSignal();
    const last7Days = this.getLast7Days();
    const completionData = last7Days.map(date => {
      const dayTasks = tasks.filter(task => {
        if (task.status === 'completed' && task.updatedAt) {
          const taskDate = new Date(task.updatedAt).toDateString();
          return taskDate === date.toDateString();
        }
        return false;
      });
      return dayTasks.length;
    });

    return {
      labels: last7Days.map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
      datasets: [{
        data: completionData,
        label: 'Completed Tasks',
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true
      }]
    };
  });

  // Chart configurations
  public pieChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Task Status Distribution'
      }
    }
  };

  public barChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tasks by Category'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  public lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      },
      title: {
        display: true,
        text: 'Task Completion Trend (Last 7 Days)'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1
        }
      }
    }
  };

  // Chart types
  public pieChartType: ChartType = 'pie';
  public barChartType: ChartType = 'bar';
  public lineChartType: ChartType = 'line';

  // Computed signals for summary statistics
  public totalTasks = computed(() => this.tasksSignal().length);
  public completedTasks = computed(() => this.tasksSignal().filter(task => task.status === 'completed').length);
  public completionRate = computed(() => {
    const total = this.totalTasks();
    return total > 0 ? Math.round((this.completedTasks() / total) * 100) : 0;
  });
  public averageCompletionTime = computed(() => {
    const completedTasks = this.tasksSignal().filter(task => task.status === 'completed');
    if (completedTasks.length === 0) return 0;

    const totalTime = completedTasks.reduce((sum, task) => {
      if (task.createdAt && task.updatedAt) {
        const created = new Date(task.createdAt);
        const completed = new Date(task.updatedAt);
        return sum + (completed.getTime() - created.getTime());
      }
      return sum;
    }, 0);

    return Math.round(totalTime / completedTasks.length / (1000 * 60 * 60 * 24)); // Days
  });

  constructor() {
    // Effect to automatically update charts when tasks change
    effect(() => {
      const tasks = this.tasksSignal();
      if (tasks.length > 0) {
        this.updateCharts();
      }
    });
  }

  ngOnInit(): void {
    // Initialization logic if needed
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  private updateCharts(): void {
    // Charts will automatically update through computed signals
    // No manual change detection needed
  }

  private getLast7Days(): Date[] {
    const dates: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date);
    }
    return dates;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getCategoryColor(category: string): string {
    switch (category) {
      case 'work': return 'bg-blue-100 text-blue-800';
      case 'personal': return 'bg-purple-100 text-purple-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }
}
