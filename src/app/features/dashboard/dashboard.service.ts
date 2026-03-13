import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../../core/services/api.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
	constructor(private api: ApiService) {}

	/**
	 * Récupère le dashboard admin. Les paramètres startDate et endDate sont optionnels.
	 */
	getAdminDashboard(params?: { startDate?: string; endDate?: string }): Observable<any> {
		// Passe les params tels quels à ApiService — l'interceptor ajoutera le token.
		return this.api.get('/dashboards/admin', params || {});
	}

	/**
	 * Récupère le dashboard manager. Filtres optionnels : dates et storeIds.
	 */
	getManagerDashboard(params?: { startDate?: string; endDate?: string; storeIds?: string[] }): Observable<any> {
		const queryParams: any = {};
		if (params?.startDate) queryParams.startDate = params.startDate;
		if (params?.endDate) queryParams.endDate = params.endDate;
		if (params?.storeIds?.length) queryParams.storeIds = params.storeIds.join(',');
		return this.api.get('/dashboards/manager', queryParams);
	}
}
