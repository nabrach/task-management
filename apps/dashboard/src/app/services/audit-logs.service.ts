import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuditLog } from '@my-workspace/data';

@Injectable({
  providedIn: 'root'
})
export class AuditLogsService {
  private apiUrl = 'http://localhost:3000/audit-logs';

  constructor(private http: HttpClient) {}

  getOrganizationLogs(page: number = 1, limit: number = 50): Observable<{ logs: AuditLog[]; total: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{ logs: AuditLog[]; total: number }>(`${this.apiUrl}/organization`, { params });
  }

  getUserLogs(userId: number, page: number = 1, limit: number = 50): Observable<{ logs: AuditLog[]; total: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{ logs: AuditLog[]; total: number }>(`${this.apiUrl}/user/${userId}`, { params });
  }

  getResourceLogs(resource: string, resourceId: number): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/resource/${resource}/${resourceId}`);
  }

  getRecentActivity(days: number = 7): Observable<AuditLog[]> {
    const params = new HttpParams().set('days', days.toString());
    return this.http.get<AuditLog[]>(`${this.apiUrl}/recent`, { params });
  }

  getMyActivity(page: number = 1, limit: number = 50): Observable<{ logs: AuditLog[]; total: number }> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());
    
    return this.http.get<{ logs: AuditLog[]; total: number }>(`${this.apiUrl}/my-activity`, { params });
  }
}
