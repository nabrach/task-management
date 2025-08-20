import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IUser } from '@my-workspace/data';

@Injectable({
  providedIn: 'root'
})
export class UsersService {
  private readonly API_URL = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  getUsers(): Observable<IUser[]> {
    return this.http.get<IUser[]>(this.API_URL);
  }

  getUsersByOrganization(organizationId: number): Observable<IUser[]> {
    return this.http.get<IUser[]>(`${this.API_URL}/organization/${organizationId}`);
  }

  getUser(id: number): Observable<IUser> {
    return this.http.get<IUser>(`${this.API_URL}/${id}`);
  }
}
