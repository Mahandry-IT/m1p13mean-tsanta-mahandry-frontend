import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * On garde la réponse flexible pour s'adapter à ton backend.
 * Si ton API renvoie un autre nom (ex: accessToken), on le mappe.
 */
export interface LoginResponse {
  token?: string;
  accessToken?: string;
  user?: unknown;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';

  constructor(private readonly api: ApiService) {}

  login(payload: LoginRequest): Observable<{ token: string; raw: LoginResponse }> {
    return this.api.post<LoginResponse>('/auth/login', payload).pipe(
      map((res) => {
        const token = (res.token ?? res.accessToken ?? '') as string;
        return { token, raw: res };
      }),
    );
  }

  setToken(token: string): void {
    localStorage.setItem(AuthService.TOKEN_KEY, token);
  }

  getToken(): string | null {
    return localStorage.getItem(AuthService.TOKEN_KEY);
  }

  clearToken(): void {
    localStorage.removeItem(AuthService.TOKEN_KEY);
  }
}

