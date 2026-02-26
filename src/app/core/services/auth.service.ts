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

export interface LoginResponseData {
  token?: string;
  accessToken?: string;
  homePage?: string;
  user?: unknown;
  [key: string]: unknown;
}

/**
 * On garde la réponse flexible pour s'adapter à ton backend.
 * Exemples supportés:
 * - { token: '...' }
 * - { accessToken: '...' }
 * - { data: { token: '...' } }
 */
export interface LoginResponse {
  token?: string;
  accessToken?: string;
  data?: LoginResponseData;
  user?: unknown;
  success?: boolean;
  message?: string;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private static readonly TOKEN_KEY = 'auth_token';
  private static readonly HOME_PAGE_KEY = 'auth_home_page';

  constructor(private readonly api: ApiService) {}

  login(payload: LoginRequest): Observable<{ token: string; raw: LoginResponse }> {
    return this.api.post<LoginResponse>('/auth/login', payload).pipe(
      map((res) => {
        const token = (res.data?.token ?? res.token ?? res.accessToken ?? '') as string;
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

  /** Stocke la homepage renvoyée par le backend après login */
  setHomePage(homePage: string | null | undefined): void {
    if (typeof homePage === 'string' && homePage.trim()) {
      localStorage.setItem(AuthService.HOME_PAGE_KEY, homePage);
      return;
    }
    localStorage.removeItem(AuthService.HOME_PAGE_KEY);
  }

  /** Récupère la homepage stockée après login */
  getHomePage(): string | null {
    const v = localStorage.getItem(AuthService.HOME_PAGE_KEY);
    return v && v.trim() ? v : null;
  }

  clearHomePage(): void {
    localStorage.removeItem(AuthService.HOME_PAGE_KEY);
  }

  /**
   * (Legacy) Essaie d'extraire `homePage` depuis le payload du JWT.
   * Préférer `getHomePage()` car chez vous la valeur vient de la réponse login.
   */
  getHomePageFromToken(): string | null {
    const token = this.getToken();
    if (!token) return null;

    const parts = token.split('.');
    if (parts.length < 2) return null;

    try {
      const payloadBase64Url = parts[1];
      const payloadBase64 = payloadBase64Url.replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map((c) => `%${('00' + c.charCodeAt(0).toString(16)).slice(-2)}`)
          .join(''),
      );
      const payload = JSON.parse(json) as { homePage?: unknown };

      return typeof payload.homePage === 'string' && payload.homePage.trim() ? payload.homePage : null;
    } catch {
      return null;
    }
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
