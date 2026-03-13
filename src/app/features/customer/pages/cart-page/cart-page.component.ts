import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';
import { Router } from '@angular/router';

interface PipelineStep {
  key: string;
  label: string;
  icon: string;
  order: number;
}

@Component({
  selector: 'app-customer-cart-page',
  templateUrl: './cart-page.component.html',
  styleUrls: ['./cart-page.component.scss'],
  standalone: false,
})
export class CartPageComponent implements OnInit {
  loading = false;
  error: string | null = null;
  cart: any = null;  readonly pipelineSteps: PipelineStep[] = [
    { key: 'pending',   label: 'En attente',  icon: '🟡', order: 0 },
    { key: 'confirmed', label: 'Confirmée',   icon: '✅', order: 1 },
    { key: 'shipped',   label: 'Expédiée',    icon: '🚚', order: 2 },
    { key: 'delivered', label: 'Livrée',      icon: '🎉', order: 3 },
  ];

  constructor(
    private api: ApiService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  /** Returns true if the step is at or before the current status */
  isStepDone(stepKey: string): boolean {
    if (!this.cart?.status) return false;
    const current = this.pipelineSteps.find(s => s.key === this.cart.status);
    const step    = this.pipelineSteps.find(s => s.key === stepKey);
    if (!current || !step) return false;
    return step.order <= current.order;
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
  }  getStatusLabel(status: string | null): string {
    const labels: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
    };
    return labels[status || ''] || status || '—';
  }
  // Track items being removed to disable buttons
  removingIds: Set<string> | null = null;

  // prevent double-confirm
  confirming = false;

  // prevent double-cancel
  cancelling = false;

  removeItem(item: any): void {
    // Robust id extraction
    const orderId = String(this.cart?.id ?? this.cart?._id ?? this.cart?.orderId ?? '').trim();
    const productId = String(item?.productId ?? item?.product?._id ?? item?._id ?? item?.id ?? '').trim();
    const storeId = String(item?.storeId ?? item?.sellerId ?? item?.shopId ?? item?.store?._id ?? '').trim();

    if (!orderId || !productId || !storeId) {
      this.toast.error('Impossible d\'identifier l\'article (ids manquants).');
      return;
    }

    const uniqueKey = `${productId}::${storeId}`;
    if (!this.removingIds) this.removingIds = new Set<string>();
    this.removingIds.add(uniqueKey);
    this.cdr.detectChanges();

    const url = `/orders/${encodeURIComponent(orderId)}/items/${encodeURIComponent(productId)}/${encodeURIComponent(storeId)}`;

    this.api.delete<any>(url).subscribe({
      next: () => {
        this.toast.success('Article retiré du panier');
        // Reload cart to reflect server state
        this.loadCart();
      },
      error: (err: any) => {
        const msg = err?.message ?? 'Erreur lors de la suppression de l\'article';
        this.toast.error(msg);
      },
      complete: () => {
        this.removingIds?.delete(uniqueKey);
        this.cdr.detectChanges();
      }
    });
  }

  confirmCart(): void {
    const orderId = String(this.cart?.id ?? this.cart?._id ?? this.cart?.orderId ?? '').trim();
    if (!orderId) { this.toast.error('Impossible de confirmer : identifiant du panier introuvable.'); return; }
    if (this.confirming) return;

    this.confirming = true;
    this.cdr.detectChanges();    const url = `/orders/${encodeURIComponent(orderId)}/confirm`;
    this.api.post<any>(url, {}).subscribe({
      next: (res: any) => {
        const createdOrder = res?.data ?? res ?? {};
        const orderIdResp = createdOrder._id ?? createdOrder.id ?? orderId;
        this.toast.success('Panier confirmé');
        // navigate using query param ?id= for prerendering compatibility
        this.router.navigate(['/customer', 'order'], { queryParams: { id: orderIdResp } });
      },
      error: (err: any) => {
        this.toast.error(err?.message ?? 'Erreur lors de la confirmation du panier');
      },      complete: () => {
        this.confirming = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancelCart(): void {
    const orderId = String(this.cart?.id ?? this.cart?._id ?? this.cart?.orderId ?? '').trim();
    if (!orderId) { this.toast.error('Impossible d\'annuler : identifiant du panier introuvable.'); return; }
    if (this.cancelling) return;

    this.cancelling = true;
    this.cdr.detectChanges();

    const url = `/orders/${encodeURIComponent(orderId)}/cancel-cart`;
    this.api.delete<any>(url).subscribe({
      next: () => {
        this.toast.success('Panier annulé avec succès');
        // Navigate to products list
        this.router.navigate(['/buy-product', 'list']);
      },
      error: (err: any) => {
        this.toast.error(err?.message ?? 'Erreur lors de l\'annulation du panier');
      },
      complete: () => {
        this.cancelling = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCart(): void {
    this.loading = true;
    this.error = null;
    this.api.get<any>('/orders/cart').subscribe({
      next: (res: any) => {
        try {
          const payload = res?.data ?? res ?? null;
          if (!payload) { this.cart = null; return; }

          const items = Array.isArray(payload.items)
            ? payload.items.map((it: any) => ({
                ...it,
                unitPriceNum:  this.parseDecimal(it.unitPrice),
                totalPriceNum: this.parseDecimal(it.totalPrice),
              }))
            : [];

          const subtotal = this.parseDecimal(payload.subtotal ?? payload.subTotal ?? 0);
          const tax      = this.parseDecimal(payload.tax ?? 0);
          const total    = this.parseDecimal(payload.total ?? payload.grandTotal ?? subtotal + tax);

          this.cart = {
            id:          payload._id ?? payload.id ?? null,
            orderNumber: payload.orderNumber ?? payload.orderNo ?? null,
            status:      payload.status ?? null,
            createdAt:   payload.createdAt ?? null,
            items,
            subtotal,
            tax,
            total,
          };

          setTimeout(() => {
            this.loading = false;
            try { this.cdr.markForCheck?.(); this.cdr.detectChanges(); } catch { /* ignore */ }
          }, 0);

        } catch (e) {
          console.error('Error parsing cart payload:', e);
          this.cart  = null;
          this.error = 'Erreur lors du traitement des données du panier.';
          this.toast.error(this.error);
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error   = err?.message ?? 'Erreur lors du chargement du panier';
        this.toast.error(this.error!);
        this.cdr.detectChanges();
      },
    });
  }
}