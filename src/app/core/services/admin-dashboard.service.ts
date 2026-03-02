import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { AdminDashboardResponse, AdminDashboardData } from '../models/admin-dashboard.model';

@Injectable({
  providedIn: 'root',
})
export class AdminDashboardService {
  private readonly basePath = '/dashboards/admin';

  constructor(private readonly api: ApiService) {}

  /**
   * GET /api/dashboards/admin
   * Récupère toutes les données du dashboard admin.
   * Le token est déjà injecté par l'interceptor.
   */
  getDashboard(): Observable<AdminDashboardData> {
    return this.api.get<AdminDashboardResponse>(this.basePath).pipe(
      map((res) => res.data),
    );
  }

  /**
   * Utilitaire : convertit un champ $numberDecimal en number.
   * Le backend MongoDB renvoie parfois { $numberDecimal: "123.45" }.
   */
  static toNumber(value: { $numberDecimal: string } | number | undefined): number {
    if (value == null) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'object' && '$numberDecimal' in value) {
      return parseFloat(value.$numberDecimal) || 0;
    }
    return 0;
  }
}
