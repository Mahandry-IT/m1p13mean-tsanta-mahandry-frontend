import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../../core/services/api.service';
import { ToastService } from '../../../../core/services/toast.service';

interface PipelineStep {
  key: string;
  label: string;
  icon: string;
  order: number;
}

@Component({
  selector: 'app-order-details-page',
  templateUrl: './order-details-page.component.html',
  styleUrls: ['./order-details-page.component.scss'],
  standalone: false,
})
export class OrderDetailsPageComponent implements OnInit {
  loading = false;
  error: string | null = null;
  order: any = null;
  orderId: string | null = null;
  
  // PDF download states
  downloadingOrder = false;
  downloadingReceipt = false;readonly pipelineSteps: PipelineStep[] = [
    { key: 'pending',   label: 'En attente',  icon: '🟡', order: 0 },
    { key: 'confirmed', label: 'Confirmée',   icon: '✅', order: 1 },
    { key: 'shipped',   label: 'Expédiée',    icon: '🚚', order: 2 },
    { key: 'delivered', label: 'Livrée',      icon: '🎉', order: 3 },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private toast: ToastService,
    private cdr: ChangeDetectorRef,
  ) {}
  ngOnInit(): void {
    // Use query parameter ?id= instead of route parameter :id for prerendering compatibility
    this.orderId = this.route.snapshot.queryParamMap.get('id');
    if (!this.orderId) {
      this.error = 'Identifiant de commande manquant.';
      return;
    }
    this.loadOrder();
  }

  isStepDone(stepKey: string): boolean {
    if (!this.order?.status) return false;
    const current = this.pipelineSteps.find(s => s.key === this.order.status);
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

  // ─── Status-based content helpers ───

  getPageTitle(): string {
    const titles: Record<string, string> = {
      pending: 'Commande en attente',
      confirmed: 'Commande confirmée',
      shipped: 'Commande expédiée',
      delivered: 'Commande livrée',
      cancelled: 'Commande annulée',
    };
    return titles[this.order?.status || ''] || 'Détails de la commande';
  }

  getPageIcon(): string {
    const icons: Record<string, string> = {
      pending: '🟡',
      confirmed: '✅',
      shipped: '🚚',
      delivered: '🎉',
      cancelled: '❌',
    };
    return icons[this.order?.status || ''] || '📦';
  }  getBannerIcon(): string {
    const icons: Record<string, string> = {
      pending: '⏳',
      confirmed: '✅',
      shipped: '🚚',
      delivered: '🎉',
      cancelled: '❌',
    };
    return icons[this.order?.status || ''] || '📋';
  }

  getBannerTitle(): string {
    const titles: Record<string, string> = {
      pending: 'Commande en attente de confirmation',
      confirmed: 'Commande confirmée avec succès !',
      shipped: 'Votre commande est en route !',
      delivered: 'Commande livrée avec succès !',
      cancelled: 'Commande annulée',
    };
    return titles[this.order?.status || ''] || 'Détails de votre commande';
  }

  getBannerMessage(): string {
    const messages: Record<string, string> = {
      pending: 'Votre panier est en attente. Confirmez-le pour passer commande.',
      confirmed: 'Nous avons bien reçu votre commande. Elle sera bientôt expédiée.',
      shipped: 'Votre colis est en cours de livraison. Suivez son avancement.',
      delivered: 'Votre commande a été livrée. Merci pour votre confiance !',
      cancelled: 'Cette commande a été annulée et ne sera pas traitée.',
    };
    return messages[this.order?.status || ''] || '';
  }

  getBannerType(): string {
    const types: Record<string, string> = {
      pending: 'warning',
      confirmed: 'success',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'error',
    };
    return types[this.order?.status || ''] || 'info';
  }
  isCancelled(): boolean {
    return this.order?.status === 'cancelled';
  }

  // ─── PDF Download helpers ───

  /**
   * Bon de commande disponible si statut = confirmed ou shipped
   */
  canDownloadOrderPdf(): boolean {
    const status = this.order?.status;
    return status === 'confirmed' || status === 'shipped';
  }

  /**
   * Reçu disponible seulement si statut = delivered
   */
  canDownloadReceiptPdf(): boolean {
    const status = this.order?.status;
    return status === 'delivered';
  }

  downloadOrderPdf(): void {
    if (!this.orderId || this.downloadingOrder || !this.canDownloadOrderPdf()) return;
    
    this.downloadingOrder = true;
    this.downloadPdf('order');
  }

  downloadReceiptPdf(): void {
    if (!this.orderId || this.downloadingReceipt || !this.canDownloadReceiptPdf()) return;
    
    this.downloadingReceipt = true;
    this.downloadPdf('receipt');
  }

  private downloadPdf(type: 'order' | 'receipt'): void {
    const url = `/ordersPDF/${this.orderId}/pdf?type=${type}`;
    
    this.api.getBlob(url).subscribe({
      next: (blob: Blob) => {
        // Create download link
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        // Generate filename
        const orderNum = this.order?.orderNumber || this.orderId;
        const filename = type === 'order' 
          ? `bon-de-commande-${orderNum}.pdf`
          : `recu-${orderNum}.pdf`;
        
        link.download = filename;
        link.click();
        
        // Cleanup
        window.URL.revokeObjectURL(downloadUrl);
        
        this.toast.success(type === 'order' 
          ? 'Bon de commande téléchargé !' 
          : 'Reçu téléchargé !');
        
        if (type === 'order') {
          this.downloadingOrder = false;
        } else {
          this.downloadingReceipt = false;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error downloading PDF:', err);
        this.toast.error(err?.message ?? 'Erreur lors du téléchargement du PDF');
        
        if (type === 'order') {
          this.downloadingOrder = false;
        } else {
          this.downloadingReceipt = false;
        }
        this.cdr.detectChanges();
      },
    });
  }

  loadOrder(): void {
    if (!this.orderId) return;
    this.loading = true;
    this.error = null;

    this.api.get<any>(`/orders/${encodeURIComponent(this.orderId)}`).subscribe({
      next: (res: any) => {
        try {
          const payload = res?.data ?? res ?? null;
          if (!payload) { this.order = null; this.error = 'Commande introuvable.'; return; }

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

          this.order = {
            id:          payload._id ?? payload.id ?? null,
            orderNumber: payload.orderNumber ?? payload.orderNo ?? null,
            status:      payload.status ?? null,
            createdAt:   payload.createdAt ?? null,
            items,
            subtotal,
            tax,
            total,
          };
        } catch (e) {
          console.error('Error parsing order payload:', e);
          this.order = null;
          this.error = 'Erreur lors du traitement des données.';
          this.toast.error(this.error);
        } finally {
          this.loading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.error = err?.message ?? 'Erreur lors du chargement de la commande';
        this.toast.error(this.error!);
        this.cdr.detectChanges();
      },
    });
  }
  goToProducts(): void {
    this.router.navigate(['/buy-product', 'list']);
  }

  goToCart(): void {
    this.router.navigate(['/customer', 'cart']);
  }

  backToCart(): void {
    this.router.navigate(['/customer', 'cart']);
  }
}
