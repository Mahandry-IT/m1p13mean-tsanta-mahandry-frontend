import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface ChangePasswordRequest {
  email: string;
  token: string;
  newPassword: string;
}

export interface ResetPasswordRequest {
  email: string;
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

  /**
   * Inscription utilisateur (customer).
   * Backend: POST /api/auth/register/user
   */
  registerUser(payload: RegisterRequest): Observable<unknown> {
    return this.api.post<unknown>('/auth/register/user', payload);
  }

  /**
   * Inscription manager.
   * Backend: POST /api/auth/register/manager
   */
  registerManager(payload: RegisterRequest): Observable<unknown> {
    return this.api.post<unknown>('/auth/register/manager', payload);
  }

  /**
   * Activation de compte.
   * Backend: PATCH /api/auth/activate/:token
   */
  activateAccount(token: string): Observable<unknown> {
    const t = encodeURIComponent(token);
    return this.api.patch<unknown>(`/auth/activate/${t}`, null);
  }

  /**
   * Changement / réinitialisation du mot de passe.
   * Backend: PATCH /api/auth/change-password
   */
  changePassword(payload: ChangePasswordRequest): Observable<unknown> {
    return this.api.patch<unknown>('/auth/change-password', payload);
  }

  /**
   * Demande de réinitialisation de mot de passe (envoi email).
   * Backend: POST /api/auth/reset-password
   */
  requestPasswordReset(payload: ResetPasswordRequest): Observable<unknown> {
    return this.api.post<unknown>('/auth/reset-password', payload);
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
