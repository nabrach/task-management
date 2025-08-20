import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Task, TaskWithUsers, CreateTaskDto, UpdateTaskDto } from '@my-workspace/data';

@Injectable({
  providedIn: 'root'
})
export class TasksService {
  private readonly API_URL = 'http://localhost:3000/tasks';

  constructor(private http: HttpClient) {}

  getTasks(): Observable<TaskWithUsers[]> {
    return this.http.get<TaskWithUsers[]>(this.API_URL);
  }

  getTask(id: number): Observable<Task> {
    return this.http.get<Task>(`${this.API_URL}/${id}`);
  }

  createTask(task: CreateTaskDto): Observable<TaskWithUsers> {
    return this.http.post<TaskWithUsers>(this.API_URL, task);
  }

  updateTask(id: number, task: UpdateTaskDto): Observable<TaskWithUsers> {
    return this.http.put<TaskWithUsers>(`${this.API_URL}/${id}`, task);
  }

  deleteTask(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.API_URL}/${id}`);
  }
}
