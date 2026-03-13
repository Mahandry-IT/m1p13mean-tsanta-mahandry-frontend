import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';

interface OrderUser {
  _id: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
  };
}

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
  user?: OrderUser;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

@Component({
  selector: 'app-manager-orders-list-page',
  templateUrl: './orders-list-page.component.html',
  styleUrls: ['./orders-list-page.component.scss'],
  standalone: false,
})
export class ManagerOrdersListPageComponent implements OnInit {
  loading = false;
  error: string | null = null;
  orders: Order[] = [];
  pagination: Pagination = { total: 0, page: 1, limit: 10, pages: 1 };  // Filtres
  statusFilter: string = '';
  readonly statusOptions = [
    { value: '', label: 'Tous les statuts', icon: '📋' },
    { value: 'pending', label: 'En attente', icon: '🟡' },
    { value: 'confirmed', label: 'Confirmée', icon: '✅' },
    { value: 'shipped', label: 'Expédiée', icon: '🚚' },
    { value: 'delivered', label: 'Livrée', icon: '🎉' },
    { value: 'cancelled', label: 'Annulée', icon: '❌' },
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
  }

  getStatusLabel(status: string): string {
    const option = this.statusOptions.find(o => o.value === status);
    return option?.label || status || '—';
  }

  getStatusIcon(status: string): string {
    const option = this.statusOptions.find(o => o.value === status);
    return option?.icon || '📋';
  }

  getStatusClass(status: string): string {
    return `status-${status || 'pending'}`;
  }

  getCustomerName(user?: OrderUser): string {
    if (!user) return '—';
    const firstName = user.profile?.firstName || '';
    const lastName = user.profile?.lastName || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return user.email || '—';
  }

  getCustomerEmail(user?: OrderUser): string {
    return user?.email || '—';
  }

  loadOrders(): void {
    this.loading = true;
    this.error = null;

    const params: any = {
      page: this.pagination.page,
      limit: this.pagination.limit,
    };
    if (this.statusFilter) {
      params.status = this.statusFilter;
    }

    this.api.get<any>('/orders/all', params).subscribe({
      next: (res) => {
        try {
          const payload = res?.data ?? res ?? {};

          // Handle multiple response formats
          let rawOrders: any[] = [];
          if (Array.isArray(payload.orders)) {
            rawOrders = payload.orders;
          } else if (Array.isArray(payload)) {
            rawOrders = payload;
          } else if (Array.isArray(res?.orders)) {
            rawOrders = res.orders;
          }

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
            user: o.user ?? null,
          }));

          const pag = payload.pagination ?? res?.pagination ?? {};
          const totalOrders = pag.total ?? this.orders.length;
          this.pagination = {
            total: totalOrders,
            page: pag.page ?? this.pagination.page,
            limit: pag.limit ?? this.pagination.limit,
            pages: pag.pages ?? (Math.ceil(totalOrders / this.pagination.limit) || 1),
          };

          // Force UI update with setTimeout (same fix as other pages)
          setTimeout(() => {
            this.loading = false;
            try {
              this.cdr.markForCheck?.();
              this.cdr.detectChanges();
            } catch { /* ignore */ }
          }, 0);
        } catch (e) {
          console.error('[ManagerOrdersListPage] Error parsing response:', e);
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
    this.router.navigate(['/manager', 'orders', order._id]);
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
  // Stats rapides
  getOrdersCountByStatus(status: string): number {
    // Cette méthode serait idéalement alimentée par une API séparée
    // Pour l'instant, on compte sur la page courante
    return this.orders.filter(o => o.status === status).length;
  }

  // Pagination: show only relevant page numbers
  shouldShowPageNumber(page: number): boolean {
    const current = this.pagination.page;
    const total = this.pagination.pages;
    // Always show first, last, current, and neighbors
    if (page === 1 || page === total) return true;
    if (Math.abs(page - current) <= 1) return true;
    return false;
  }
}
