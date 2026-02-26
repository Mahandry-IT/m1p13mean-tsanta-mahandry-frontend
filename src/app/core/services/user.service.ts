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
}
