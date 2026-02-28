import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { ApiResponse, PaginatedResponse, PaginationMeta } from '../models/pagination.model';

export interface ResourceListQuery {
  endpoint: string;
  page: number;
  limit: number;
  q?: string | null;
  filters?: Record<string, string | number | boolean | null | undefined>;
  /** si le tableau n'est pas auto-détectable, passer la clé (ex: 'users', 'products') */
  itemsKey?: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class ResourceListService {
  constructor(private readonly api: ApiService) {}

  fetchPage<TItem>(query: ResourceListQuery): Observable<PaginatedResponse<TItem>> {
    const params: Record<string, string | number | boolean | null | undefined> = {
      page: query.page,
      limit: query.limit,
      ...(query.filters ?? {}),
    };

    const q = (query.q ?? '').trim();
    if (q) params['q'] = q;

    return this.api
      .get<ApiResponse<Record<string, unknown>>>(query.endpoint, params)
      .pipe(
        map((res) => {
          const data = (res?.data ?? {}) as Record<string, unknown>;
          const pagination = (data['pagination'] ?? null) as PaginationMeta | null;

          let items: unknown[] = [];
          if (query.itemsKey && Array.isArray((data as any)[query.itemsKey])) {
            items = (data as any)[query.itemsKey] as unknown[];
          } else {
            // auto-détection: première propriété (hors pagination) qui est un tableau
            for (const [k, v] of Object.entries(data)) {
              if (k === 'pagination') continue;
              if (Array.isArray(v)) {
                items = v;
                break;
              }
            }
          }

          return {
            items: (items as TItem[]) ?? [],
            pagination: pagination ?? {
              total: (items?.length ?? 0),
              page: query.page,
              limit: query.limit,
              totalPages: 1,
              hasPrev: query.page > 1,
              hasNext: false,
            },
          };
        }),
      );
  }
}
