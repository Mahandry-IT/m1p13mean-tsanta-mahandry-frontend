import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';


export interface CheckProfileResponse {
  success: boolean;
  message: string;
  data: {
    hasProfile: boolean;
  };
}

export interface CreateProfileResponse {
  success?: boolean;
  message?: string;
  data?: unknown;
  [key: string]: unknown;
}

export interface MeResponse {
  success?: boolean;
  message?: string;
  data?: any;
  user?: any;
  [key: string]: unknown;
}

export interface UpdateMeResponse {
  success?: boolean;
  message?: string;
  data?: any;
  user?: any;
  [key: string]: unknown;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private readonly api: ApiService) {}

  /**
   * Vérification de profil (vérifier si on a un profil)
   * Backend: POST /api/users/check-profile
   */
  checkProfile(email: string): Observable<CheckProfileResponse> {
    return this.api.post<CheckProfileResponse>(`/users/check-profile`, { email });
  }

  /**
   * Création du profil utilisateur
   * Backend: POST /api/users/profile
   * Body: multipart/form-data (FormData)
   */
  createProfile(formData: FormData): Observable<CreateProfileResponse> {
    return this.api.post<CreateProfileResponse>(`/users/profile`, formData);
  }

  /**
   * Récupère l'utilisateur courant
   * Backend (convention): GET /api/users/me
   */
  getMe(): Observable<MeResponse> {
    return this.api.get<MeResponse>('/users/me');
  }

  /**
   * Mise à jour utilisateur courant
   * Backend (convention): PUT /api/users/me
   * Body: { username?, profile?: { firstName?, lastName?, phone?, birthday?, gender? } }
   */
  updateMe(payload: any): Observable<UpdateMeResponse> {
    return this.api.put<UpdateMeResponse>('/users/me', payload);
  }

  /**
   * Mise à jour utilisateur courant (multipart) pour avatar
   * Backend attendu: PUT /api/users/me
   */
  updateMeFormData(formData: FormData): Observable<UpdateMeResponse> {
    return this.api.put<UpdateMeResponse>('/users/me', formData);
  }
}
