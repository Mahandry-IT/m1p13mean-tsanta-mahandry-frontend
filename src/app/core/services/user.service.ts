import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  constructor(private api: ApiService) {}
  list(): Observable<User[]>{ return this.api.get<User[]>('/users'); }
  get(id:string): Observable<User>{ return this.api.get<User>(`/users/${id}`); }
}

