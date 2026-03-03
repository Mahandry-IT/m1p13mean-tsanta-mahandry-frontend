// import { Injectable } from '@angular/core';
// import { Observable } from 'rxjs';
// import { map } from 'rxjs/operators';
// import { ApiService } from './api.service';
// import { Store, StoreRequest, StoreListResponse } from '../../features/stores/models/store.model';

// // Interface pour la réponse COMPLÈTE du backend
// interface ApiResponse<T> {
//   success: boolean;
//   message: string;
//   data: T;
// }

// @Injectable({
//   providedIn: 'root'
// })
// export class StoreService {

//   constructor(private readonly api: ApiService) {}

// // Liste toutes les boutiques avec filtres
//   getAllStores(filters?: { status?: string; isActive?: boolean; page?: number; limit?: number }): Observable<StoreListResponse> {
//     let url = '/stores';
//     if (filters) {
//       const params = new URLSearchParams();
//       if (filters.status) params.append('status', filters.status);
//       if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
//       if (filters.page) params.append('page', filters.page.toString());
//       if (filters.limit) params.append('limit', filters.limit.toString());
//       url += `?${params.toString()}`;
//     }
    
//     // 👇 EXTRAIRE data de la réponse
//     return this.api.get<ApiResponse<StoreListResponse>>(url).pipe(
//       map(response => response.data)
//     );
//   }

//   // Mes boutiques (Manager)
//   getMyStores(): Observable<Store[]> {
//     return this.api.get<Store[]>('/stores/my');
//   }

//   // Détail d'une boutique
//   getStoreById(id: string): Observable<Store> {
//     return this.api.get<Store>(`/stores/${id}`);
//   }

//   // Demander création d'une boutique
//   requestStore(data: StoreRequest): Observable<Store> {
//     return this.api.post<Store>('/stores/request', data);
//   }

//   // Activer une boutique (Admin)
//   activateStore(id: string): Observable<Store> {
//     return this.api.patch<ApiResponse<Store>>(`/stores/${id}/activate`, {}).pipe(
//       map(response => response.data)
//     );
//   }

//   // Désactiver une boutique (Admin)
//   deactivateStore(id: string): Observable<Store> {
//     return this.api.patch<ApiResponse<Store>>(`/stores/${id}/deactivate`, {}).pipe(
//       map(response => response.data)
//     );
//   }
// }

import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root'
})
export class StoreService {
  constructor(private readonly api: ApiService) {}

  // Activer une boutique
  activate(id: string): Observable<any> {
    return this.api.patch<any>(`/stores/${id}/activate`, {});
  }

  // Désactiver une boutique
  deactivate(id: string): Observable<any> {
    return this.api.patch<any>(`/stores/${id}/deactivate`, {});
  }

  // Demander la création d'une boutique
  requestStore(data: { name: string; address: string; phone: string; email: string }): Observable<any> {
    return this.api.post<any>('/stores/request', data);
  }

  // Rejeter une boutique (Admin)
  reject(id: string): Observable<any> {
    return this.api.patch<any>(`/stores/${id}/reject`, {});
  }
}