import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { DashboardService } from '../../dashboard.service';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-manager-dashboard',
  templateUrl: './manager-dashboard.component.html',
  styleUrls: ['./manager-dashboard.component.scss'],
  standalone: false
})
export class ManagerDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  loading = false;
  error: string | null = null;
  globalMetrics: any = null;
  storesSummary: any[] = [];
  analytics: any = null;
  alerts: any = null;

  // Séries pour charts
  revenueLabels: string[] = [];
  revenueSeries: number[] = [];
  ordersLabels: string[] = [];
  ordersSeries: number[] = [];

  // Top données
  topStores: any[] = [];
  topProducts: any[] = [];
  lowStockAlerts: any[] = [];
  pendingOrders: any[] = [];

  // Filtres
  startDate?: string;
  endDate?: string;
  selectedStoreIds: string[] = [];
  availableStores: { id: string; name: string }[] = [];

  // Chart.js instances
  private revenueChart: Chart | null = null;
  private ordersChart: Chart | null = null;
  private storesChart: Chart | null = null;

  // View lifecycle helpers to avoid race between data & view rendering
  private viewReady = false;
  private needCreateCharts = false;

  @ViewChild('revenueCanvas') revenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersCanvas') ordersCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('storesCanvas') storesCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    // Mark that the view (and canvas elements) are available
    this.viewReady = true;
    if (this.needCreateCharts) {
      // If data arrived before the view was ready, create charts now
      this.needCreateCharts = false;
      // small timeout to ensure DOM painted
      setTimeout(() => this.createCharts(), 50);
    }
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    this.revenueChart?.destroy();
    this.ordersChart?.destroy();
    this.storesChart?.destroy();
  }

  parseDecimal(v: any): number {
    if (v == null) return 0;
    if (typeof v === 'number') return v;
    if (typeof v === 'string') return parseFloat(v) || 0;
    if (typeof v === 'object' && v['$numberDecimal']) return parseFloat(v['$numberDecimal']) || 0;
    return 0;
  }

  formatCurrency(v: number): string {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MGA' }).format(v);
  }

  formatNumber(v: number): string {
    return new Intl.NumberFormat('fr-FR').format(v);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  private parseMonthLabel(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return `${months[parseInt(month, 10) - 1]} ${year}`;
  }

  load(): void {
    this.loading = true;
    this.error = null;

    // Use real API for manager dashboard
    this.dashboardService.getManagerDashboard({
      startDate: this.startDate,
      endDate: this.endDate,
      storeIds: this.selectedStoreIds.length > 0 ? this.selectedStoreIds : undefined
    }).subscribe({
      next: (res) => this.processResponse(res),
      error: (err) => {
        console.error('Dashboard API error:', err);
        this.error = err?.message || 'Erreur lors du chargement du dashboard';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private processResponse(res: any): void {
    try {
      console.log('Manager Dashboard response:', res);
      const payload = res?.data ?? res ?? {};

      // Global Metrics
      if (payload.globalMetrics) {
        this.globalMetrics = {
          totalStores: payload.globalMetrics.totalStores ?? 0,
          activeStores: payload.globalMetrics.activeStores ?? 0,
          totalRevenue: this.parseDecimal(payload.globalMetrics.totalRevenue),
          totalOrders: payload.globalMetrics.totalOrders ?? 0,
          totalProducts: payload.globalMetrics.totalProducts ?? 0,
          totalCustomers: payload.globalMetrics.totalCustomers ?? 0,
          averageOrderValue: this.parseDecimal(payload.globalMetrics.averageOrderValue)
        };
      }

      // Stores Summary
      if (Array.isArray(payload.storesSummary)) {
        this.storesSummary = payload.storesSummary.map((s: any) => ({
          storeId: s.storeId,
          storeName: s.storeName,
          status: s.status,
          revenue: this.parseDecimal(s.revenue),
          orders: s.orders ?? 0,
          products: s.products ?? 0,
          customers: s.customers ?? 0,
          stockValue: this.parseDecimal(s.stockValue),
          lowStockAlerts: s.lowStockAlerts ?? 0,
          pendingOrders: s.pendingOrders ?? 0
        }));

        // Populate available stores for filter
        this.availableStores = this.storesSummary.map(s => ({ id: s.storeId, name: s.storeName }));
      }

      // Analytics
      if (payload.analytics) {
        this.analytics = payload.analytics;

        // Revenue Evolution
        if (Array.isArray(payload.analytics.revenueEvolution)) {
          this.revenueLabels = payload.analytics.revenueEvolution.map((r: any) => this.parseMonthLabel(r.month));
          this.revenueSeries = payload.analytics.revenueEvolution.map((r: any) => this.parseDecimal(r.revenue));
        }

        // Orders Evolution
        if (Array.isArray(payload.analytics.ordersEvolution)) {
          this.ordersLabels = payload.analytics.ordersEvolution.map((o: any) => this.parseMonthLabel(o.month));
          this.ordersSeries = payload.analytics.ordersEvolution.map((o: any) => this.parseDecimal(o.count));
        }

        // Top Stores
        this.topStores = Array.isArray(payload.analytics.topPerformingStores)
          ? payload.analytics.topPerformingStores.map((s: any) => ({
              id: s.storeId ?? s._id ?? s.id,
              name: s.storeName ?? s.name ?? (`Store ${s.storeId ?? s._id ?? ''}`),
              revenue: this.parseDecimal(s.revenue)
            }))
          : [];

        // Top Products
        this.topProducts = Array.isArray(payload.analytics.topProductsAcrossStores)
          ? payload.analytics.topProductsAcrossStores.map((p: any) => ({
              name: p.productName ?? p.name ?? 'Produit',
              totalSold: p.totalSold ?? p.totalSoldAcross ?? 0,
              revenue: this.parseDecimal(p.revenue)
            }))
          : [];
      }

      // Alerts
      if (payload.alerts) {
        this.alerts = payload.alerts;
        // Normalize low stock alerts: backend may send 'stock' and no minStock
        this.lowStockAlerts = Array.isArray(payload.alerts.lowStock)
          ? payload.alerts.lowStock.map((a: any) => ({
              _id: a._id ?? a.id,
              storeId: a.storeId ?? a.storeId,
              storeName: a.storeName ?? a.store ?? 'Boutique',
              productName: a.productName ?? a.name ?? 'Produit',
              currentStock: a.stock ?? a.currentStock ?? 0,
              minStock: a.minStock ?? a.min ?? null
            }))
          : [];

        // Normalize pending orders: ensure orderNumber, customerName, total, createdAt exist
        this.pendingOrders = Array.isArray(payload.alerts.pendingOrders)
          ? payload.alerts.pendingOrders.map((o: any) => ({
              storeId: o.storeId ?? o.storeId,
              storeName: o.storeName ?? o.store ?? 'Boutique',
              orderId: o.orderId ?? o.id,
              orderNumber: o.orderNumber ?? o.orderNo ?? o.orderId ?? '—',
              customerName: o.customerName ?? o.customer ?? 'Client',
              total: this.parseDecimal(o.total ?? o.amount ?? 0),
              createdAt: o.createdAt ?? o.createdAtDate ?? null
            }))
          : [];
      }

    } catch (e) {
      console.error('Error parsing manager dashboard data:', e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      if (this.analytics) {
        // Create charts only if the view is ready, otherwise mark to create later
        if (this.viewReady) {
          setTimeout(() => this.createCharts(), 100);
        } else {
          this.needCreateCharts = true;
        }
      }
    }
  }

  onRefresh(): void {
    this.load();
  }

  toggleStoreSelection(storeId: string): void {
    const index = this.selectedStoreIds.indexOf(storeId);
    if (index > -1) {
      this.selectedStoreIds.splice(index, 1);
    } else {
      this.selectedStoreIds.push(storeId);
    }
  }

  isStoreSelected(storeId: string): boolean {
    return this.selectedStoreIds.includes(storeId);
  }

  private createCharts(): void {
    this.destroyCharts();

    // Debug logs to ensure canvases and series are available
    console.log('createCharts: revenueCanvas=', !!this.revenueCanvas?.nativeElement, 'ordersCanvas=', !!this.ordersCanvas?.nativeElement, 'storesCanvas=', !!this.storesCanvas?.nativeElement);
    console.log('createCharts: revenueSeries.length=', this.revenueSeries.length, 'ordersSeries.length=', this.ordersSeries.length, 'topStores.length=', this.topStores.length);

    // Revenue Chart
    if (this.revenueCanvas?.nativeElement && this.revenueSeries.length > 0) {
      this.revenueChart = new Chart(this.revenueCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: this.revenueLabels,
          datasets: [{
            label: 'Revenu (MGA)',
            data: this.revenueSeries,
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    } else {
      console.warn('Revenue chart not created: canvas or data missing');
    }

    // Orders Chart
    if (this.ordersCanvas?.nativeElement && this.ordersSeries.length > 0) {
      this.ordersChart = new Chart(this.ordersCanvas.nativeElement, {
        type: 'bar',
        data: {
          labels: this.ordersLabels,
          datasets: [{
            label: 'Commandes',
            data: this.ordersSeries,
            backgroundColor: 'rgba(76, 175, 80, 0.8)',
            borderRadius: 8
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } },
          scales: {
            y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.05)' } },
            x: { grid: { display: false } }
          }
        }
      });
    } else {
      console.warn('Orders chart not created: canvas or data missing');
    }

    // Stores Performance Chart (Doughnut)
    if (this.storesCanvas?.nativeElement && this.topStores.length > 0) {
      const storeColors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe'];
      this.storesChart = new Chart(this.storesCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: this.topStores.map(s => s.name),
          datasets: [{
            data: this.topStores.map(s => s.revenue),
            backgroundColor: this.topStores.map((_, i) => storeColors[i % storeColors.length]),
            borderWidth: 0
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'bottom', labels: { padding: 16, usePointStyle: true } }
          }
        }
      });
    } else {
      console.warn('Stores doughnut not created: canvas or data missing');
    }
  }

  getStatusClass(status: string): string {
    return status === 'active' ? 'status-active' : 'status-inactive';
  }

  getStatusLabel(status: string): string {
    return status === 'active' ? 'Actif' : 'Inactif';
  }
}
