import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface MenuItemDto {
  _id: string;
  label: string;
  path: string;
  icon?: string | null;
  order?: number | null;
  parentId?: string | null;
  badge?: string | number | null;
  badgeCount?: number | null;
  badgeText?: string | null;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}

export interface GetMenusByRoleResponse {
  success: boolean;
  message: string;
  data: MenuItemDto[];
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  constructor(private readonly api: ApiService) {}

  /** Backend: GET /api/menus/role/:roleId */
  getMenusByRole(roleId: string): Observable<GetMenusByRoleResponse> {
    const safeRoleId = encodeURIComponent(roleId);
    return this.api.get<GetMenusByRoleResponse>(`/menus/role/${safeRoleId}`);
  }
}

