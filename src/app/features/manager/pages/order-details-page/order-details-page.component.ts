import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';

interface PipelineStep {
  key: string;
  label: string;
  icon: string;
  order: number;
  actionLabel?: string;
}

interface OrderUser {
  _id: string;
  email: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    address?: string;
  };
}

@Component({
  selector: 'app-manager-order-details-page',
  templateUrl: './order-details-page.component.html',
  styleUrls: ['./order-details-page.component.scss'],
  standalone: false,
})
export class ManagerOrderDetailsPageComponent implements OnInit {
  loading = false;
  error: string | null = null;
  order: any = null;
  orderId: string | null = null;
  updatingStatus = false;  // Pipeline steps matching backend statuses
  // Flow: pending → confirmed → shipped → delivered
  // Manager can only update: confirmed → shipped → delivered
  // Customer confirms pending → confirmed
  readonly pipelineSteps: PipelineStep[] = [
    { key: 'pending',   label: 'En attente',  icon: '🟡', order: 0, actionLabel: 'Confirmer' },
    { key: 'confirmed', label: 'Confirmée',   icon: '✅', order: 1, actionLabel: 'Expédier' },
    { key: 'shipped',   label: 'Expédiée',    icon: '🚚', order: 2, actionLabel: 'Livrer' },
    { key: 'delivered', label: 'Livrée',      icon: '🎉', order: 3, actionLabel: '' },
  ];

  // Valid status transitions allowed for Manager
  // Manager can: confirmed → shipped → delivered
  // Customer handles: pending → confirmed
  readonly validTransitions: Record<string, string> = {
    'confirmed': 'shipped',    // Manager: confirmed -> shipped
    'shipped': 'delivered',    // Manager: shipped -> delivered
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.orderId = this.route.snapshot.paramMap.get('id');
    if (!this.orderId) {
      this.error = 'Identifiant de commande manquant.';
      return;
    }
    this.loadOrder();
  }

  // ─── Pipeline helpers ───

  getCurrentStepOrder(): number {
    if (!this.order?.status) return -1;
    const step = this.pipelineSteps.find(s => s.key === this.order.status);
    return step?.order ?? -1;
  }

  isStepDone(stepKey: string): boolean {
    if (this.isCancelled()) return false;
    const current = this.getCurrentStepOrder();
    const step = this.pipelineSteps.find(s => s.key === stepKey);
    if (!step) return false;
    return step.order <= current;
  }

  isStepCurrent(stepKey: string): boolean {
    return this.order?.status === stepKey;
  }  isStepClickable(stepKey: string): boolean {
    if (this.isCancelled() || this.isDelivered()) return false;
    if (!this.canManagerUpdate()) return false;
    
    // Check if this step is the next valid step
    const nextStep = this.getNextStep();
    return nextStep?.key === stepKey;
  }  getNextStep(): PipelineStep | null {
    if (this.isCancelled() || this.isDelivered()) return null;
    if (!this.canManagerUpdate()) return null;
    
    const currentStatus = this.order?.status;
    if (!currentStatus) return null;
    
    // Get the next valid status from manager transitions
    const nextStatus = this.validTransitions[currentStatus];
    if (!nextStatus) return null;
    
    return this.pipelineSteps.find(s => s.key === nextStatus) || null;
  }

  // Get the actual backend status to send
  getBackendStatus(displayStatus: string): string {
    // The display status is now the same as backend status
    return this.validTransitions[this.order?.status] || displayStatus;
  }  isCancelled(): boolean {
    return this.order?.status === 'cancelled';
  }

  isDelivered(): boolean {
    return this.order?.status === 'delivered';
  }

  isPending(): boolean {
    return this.order?.status === 'pending';
  }

  canCancel(): boolean {
    // Manager can cancel only if confirmed or shipped (not pending, delivered, or already cancelled)
    const status = this.order?.status;
    return status === 'confirmed' || status === 'shipped';
  }

  canManagerUpdate(): boolean {
    // Manager can only update confirmed or shipped orders
    const status = this.order?.status;
    return status === 'confirmed' || status === 'shipped';
  }

  // ─── API calls ───

  private parseDecimal(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return parseFloat(v) || 0;
    if (typeof v === 'object' && v['$numberDecimal']) return parseFloat(v['$numberDecimal']) || 0;
    return 0;
  }

  loadOrder(): void {
    if (!this.orderId) return;
    this.loading = true;
    this.error = null;

    this.api.get<any>(`/orders/${this.orderId}`).subscribe({
      next: (res) => {
        try {
          const payload = res?.data ?? res ?? null;
          if (!payload) {
            this.error = 'Commande introuvable.';
            return;
          }

          const items = Array.isArray(payload.items)
            ? payload.items.map((it: any) => ({
                ...it,
                unitPriceNum: this.parseDecimal(it.unitPrice),
                totalPriceNum: this.parseDecimal(it.totalPrice),
              }))
            : [];          this.order = {
            id: payload._id ?? payload.id ?? null,
            orderNumber: payload.orderNumber ?? payload.orderNo ?? '—',
            status: payload.status ?? 'pending',
            createdAt: payload.createdAt ?? null,
            updatedAt: payload.updatedAt ?? null,
            items,
            subtotal: this.parseDecimal(payload.subtotal ?? payload.subTotal ?? 0),
            tax: this.parseDecimal(payload.tax ?? 0),
            total: this.parseDecimal(payload.total ?? payload.grandTotal ?? 0),
            user: payload.userId ?? payload.user ?? payload.customer ?? null,
            shippingAddress: payload.shippingAddress ?? null,
            notes: payload.notes ?? null,
          };

          setTimeout(() => {
            this.loading = false;
            try {
              this.cdr.markForCheck?.();
              this.cdr.detectChanges();
            } catch { /* ignore */ }
          }, 0);
        } catch (e) {
          console.error('Error parsing order:', e);
          this.error = 'Erreur lors du traitement des données.';
          this.toast.error(this.error);
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.message ?? 'Erreur lors du chargement de la commande';
        this.toast.error(this.error!);
        this.cdr.detectChanges();
      },
    });
  }
  updateStatus(newStatus: string): void {
    if (!this.orderId || this.updatingStatus) return;

    // Get the actual backend status to send
    const backendStatus = this.getBackendStatus(newStatus);
    if (!backendStatus) {
      this.toast.error('Transition de statut invalide');
      return;
    }

    this.updatingStatus = true;    this.api.patch<any>(`/orders/${this.orderId}/status`, { status: backendStatus }).subscribe({
      next: (res) => {
        const updatedOrder = res?.data ?? res;
        if (updatedOrder?.status) {
          this.order.status = updatedOrder.status;
        } else {
          this.order.status = backendStatus;
        }
        this.toast.success(`Commande passée à "${this.getStatusLabel(this.order.status)}"`);
        this.updatingStatus = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.updatingStatus = false;
        this.toast.error(err?.message ?? 'Erreur lors de la mise à jour du statut');
        this.cdr.detectChanges();
      },
    });
  }

  cancelOrder(): void {
    if (!this.orderId || this.updatingStatus || !this.canCancel()) return;

    if (!confirm('Êtes-vous sûr de vouloir annuler cette commande ? Cette action est irréversible.')) {
      return;
    }

    this.updatingStatus = true;

    this.api.patch<any>(`/orders/${this.orderId}/status`, { status: 'cancelled' }).subscribe({
      next: (res) => {
        const updatedOrder = res?.data ?? res;
        if (updatedOrder?.status) {
          this.order.status = updatedOrder.status;
        } else {
          this.order.status = 'cancelled';
        }
        this.toast.success('Commande annulée');
        this.updatingStatus = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.updatingStatus = false;
        this.toast.error(err?.message ?? 'Erreur lors de l\'annulation');
        this.cdr.detectChanges();
      },
    });
  }

  // ─── Formatting helpers ───

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

  getCustomerName(): string {
    const user = this.order?.user as OrderUser | null;
    if (!user) return '—';
    const firstName = user.profile?.firstName || '';
    const lastName = user.profile?.lastName || '';
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    return user.email || '—';
  }

  getCustomerEmail(): string {
    return this.order?.user?.email || '—';
  }

  getCustomerPhone(): string {
    return this.order?.user?.profile?.phone || '—';
  }

  goBack(): void {
    this.router.navigate(['/manager', 'orders']);
  }
}
