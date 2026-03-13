import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';

interface Order {
  _id: string;
  orderNumber: string;
  status: string;
  items: any[];
  subtotal: number;
  tax: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Component({
  selector: 'app-orders-list-page',
  templateUrl: './orders-list-page.component.html',
  styleUrls: ['./orders-list-page.component.scss'],
  standalone: false,
})
export class OrdersListPageComponent implements OnInit {
  loading = false;
  error: string | null = null;
  orders: Order[] = [];
  pagination: Pagination = { total: 0, page: 1, limit: 10, pages: 1 };  // Filtres
  statusFilter: string = '';
  readonly statusOptions = [
    { value: '', label: 'Tous les statuts' },
    { value: 'pending', label: 'En attente' },
    { value: 'confirmed', label: 'Confirmée' },
    { value: 'shipped', label: 'Expédiée' },
    { value: 'delivered', label: 'Livrée' },
    { value: 'cancelled', label: 'Annulée' },
  ];

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  private parseDecimal(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return parseFloat(v) || 0;
    if (typeof v === 'object' && v['$numberDecimal']) return parseFloat(v['$numberDecimal']) || 0;
    return 0;
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(v);
  }  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status] || status || '—';
  }

  getStatusClass(status: string): string {
    return `status-${status || 'pending'}`;
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit,
    };
    if (this.statusFilter) {
      params.status = this.statusFilter;
    }

    this.api.get<any>('/orders/my', params).subscribe({
      next: (res) => {
        console.log('[OrdersListPage] API response:', res);
        try {
          const payload = res?.data ?? res ?? {};
          console.log('[OrdersListPage] payload:', payload);
          
          // Handle multiple response formats:
          // 1. { orders: [...], pagination: {...} }
          // 2. { data: { orders: [...], pagination: {...} } }
          // 3. Direct array response [...]
          let rawOrders: any[] = [];
          if (Array.isArray(payload.orders)) {
            rawOrders = payload.orders;
          } else if (Array.isArray(payload)) {
            rawOrders = payload;
          } else if (Array.isArray(res?.orders)) {
            rawOrders = res.orders;
          }
          console.log('[OrdersListPage] rawOrders:', rawOrders);

          this.orders = rawOrders.map((o: any) => ({
            _id: o._id ?? o.id ?? '',
            orderNumber: o.orderNumber ?? o.orderNo ?? '—',
            status: o.status ?? 'pending',
            items: Array.isArray(o.items) ? o.items : [],
            subtotal: this.parseDecimal(o.subtotal),
            tax: this.parseDecimal(o.tax),
            total: this.parseDecimal(o.total),
            createdAt: o.createdAt ?? '',
            updatedAt: o.updatedAt ?? '',
          }));
          console.log('[OrdersListPage] mapped orders:', this.orders);          const pag = payload.pagination ?? res?.pagination ?? {};
          const totalOrders = pag.total ?? this.orders.length;
          this.pagination = {
            total: totalOrders,
            page: pag.page ?? this.pagination.page,
            limit: pag.limit ?? this.pagination.limit,
            pages: pag.pages ?? (Math.ceil(totalOrders / this.pagination.limit) || 1),
          };
          console.log('[OrdersListPage] pagination:', this.pagination);

          // Force UI update with setTimeout (same fix as cart-page)
          setTimeout(() => {
            this.loading = false;
            try {
              this.cdr.markForCheck?.();
              this.cdr.detectChanges();
            } catch { /* ignore */ }
          }, 0);
        } catch (e) {
          console.error('[OrdersListPage] Error parsing response:', e);
          this.error = 'Erreur lors du traitement des données.';
          this.toast.error(this.error);
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message ?? 'Erreur lors du chargement des commandes';
        this.toast.error(this.error!);
        setTimeout(() => {
          try {
            this.cdr.markForCheck?.();
            this.cdr.detectChanges();
          } catch { /* ignore */ }
        }, 0);
      },
    });
  }

  onPageChange(page: number): void {
    if (page < 1 || page > this.pagination.pages) return;
    this.pagination.page = page;
    this.loadOrders();
  }

  onStatusFilterChange(): void {
    this.pagination.page = 1;
    this.loadOrders();
  }

  viewOrder(order: Order): void {
    this.router.navigate(['/customer', 'order'], { queryParams: { id: order._id } });
  }

  getItemsPreview(items: any[]): string {
    if (!items || items.length === 0) return 'Aucun article';
    const first = items[0];
    const name = first?.productName || first?.name || 'Article';
    if (items.length === 1) return name;
    return `${name} +${items.length - 1} autre${items.length > 2 ? 's' : ''}`;
  }

  getTotalItems(items: any[]): number {
    if (!items || items.length === 0) return 0;
    return items.reduce((sum, it) => sum + (it.quantity || 1), 0);
  }
}
