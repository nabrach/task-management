import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  @Input() tasks: TaskWithUsers[] = [];

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

  public pieChartData: ChartData<'pie', number[], string | string[]> = {
    labels: ['New', 'In Progress', 'Completed'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#3B82F6', '#F59E0B', '#10B981'],
      borderColor: ['#2563EB', '#D97706', '#059669'],
      borderWidth: 2
    }]
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

  public barChartData: ChartData<'bar'> = {
    labels: ['Work', 'Personal', 'Other'],
    datasets: [{
      data: [0, 0, 0],
      label: 'Total Tasks',
      backgroundColor: ['#3B82F6', '#8B5CF6', '#6B7280'],
      borderColor: ['#2563EB', '#7C3AED', '#4B5563'],
      borderWidth: 1
    }]
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

  public lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      data: [],
      label: 'Completed Tasks',
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  public doughnutChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
      title: {
        display: true,
        text: 'Completion Rate by Category'
      }
    }
  };

  public doughnutChartData: ChartData<'doughnut', number[], string | string[]> = {
    labels: ['Work', 'Personal', 'Other'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#3B82F6', '#8B5CF6', '#6B7280'],
      borderColor: ['#2563EB', '#7C3AED', '#4B5563'],
      borderWidth: 2
    }]
  };

  // Statistics
  public totalTasks = 0;
  public completedTasks = 0;
  public completionRate = 0;
  public averageCompletionTime = 0;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.updateCharts();
  }

  ngOnDestroy() {
    // Cleanup if needed
  }

  ngOnChanges() {
    this.updateCharts();
  }

  // Public method to force chart updates from parent component
  public refreshCharts() {
    this.updateCharts();
    this.cdr.detectChanges();
  }

  private updateCharts() {
    if (!this.tasks || this.tasks.length === 0) {
      return;
    }

    this.calculateStatistics();
    this.updatePieChart();
    this.updateBarChart();
    this.updateLineChart();
    this.updateDoughnutChart();
  }

  private calculateStatistics() {
    this.totalTasks = this.tasks.length;
    this.completedTasks = this.tasks.filter(task => task.completed).length;
    this.completionRate = this.totalTasks > 0 ? (this.completedTasks / this.totalTasks) * 100 : 0;
    
    // Calculate average completion time for completed tasks
    const completedTasks = this.tasks.filter(task => task.completed && task.createdAt && task.updatedAt);
    if (completedTasks.length > 0) {
      const totalTime = completedTasks.reduce((sum, task) => {
        const created = new Date(task.createdAt!);
        const updated = new Date(task.updatedAt!);
        return sum + (updated.getTime() - created.getTime());
      }, 0);
      this.averageCompletionTime = totalTime / completedTasks.length / (1000 * 60 * 60 * 24); // Convert to days
    }
  }

  private updatePieChart() {
    const newTasks = this.tasks.filter(task => task.status === 'new').length;
    const inProgressTasks = this.tasks.filter(task => task.status === 'in-progress').length;
    const completedTasks = this.tasks.filter(task => task.status === 'completed').length;

    this.pieChartData.datasets[0].data = [newTasks, inProgressTasks, completedTasks];
  }

  private updateBarChart() {
    const workTasks = this.tasks.filter(task => task.category === 'work').length;
    const personalTasks = this.tasks.filter(task => task.category === 'personal').length;
    const otherTasks = this.tasks.filter(task => task.category === 'other').length;

    this.barChartData.datasets[0].data = [workTasks, personalTasks, otherTasks];
  }

  private updateLineChart() {
    // Generate last 7 days labels
    const labels = [];
    const data = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
      
      // Count completed tasks for this date
      const completedCount = this.tasks.filter(task => {
        if (!task.completed || !task.updatedAt) return false;
        const taskDate = new Date(task.updatedAt);
        return taskDate.toDateString() === date.toDateString();
      }).length;
      
      data.push(completedCount);
    }

    this.lineChartData.labels = labels;
    this.lineChartData.datasets[0].data = data;
  }

  private updateDoughnutChart() {
    const workCompleted = this.tasks.filter(task => task.category === 'work' && task.completed).length;
    const personalCompleted = this.tasks.filter(task => task.category === 'personal' && task.completed).length;
    const otherCompleted = this.tasks.filter(task => task.category === 'other' && task.completed).length;

    this.doughnutChartData.datasets[0].data = [workCompleted, personalCompleted, otherCompleted];
  }

  public getCompletionRateColor(): string {
    if (this.completionRate >= 80) return 'text-green-600';
    if (this.completionRate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  }

  public formatCompletionTime(): string {
    if (this.averageCompletionTime < 1) {
      return `${Math.round(this.averageCompletionTime * 24)} hours`;
    }
    return `${this.averageCompletionTime.toFixed(1)} days`;
  }
}
