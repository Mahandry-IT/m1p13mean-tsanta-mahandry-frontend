import { Component, OnInit, ViewChild, ElementRef, OnDestroy, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { DashboardService } from '../../dashboard.service';
import Chart from 'chart.js/auto';



@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: false
})
export class AdminDashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  loading = false;
  error: string | null = null;
  metrics: any = null;
  charts: any = null;

  // séries pour charting
  revenueSeries: number[] = [];
  revenueLabels: string[] = [];
  ordersSeries: number[] = [];
  ordersLabels: string[] = [];
  usersSeries: number[] = [];
  usersLabels: string[] = [];

  // autres présentations
  ordersByStatus: { status: string; count: number }[] = [];
  topProducts: any[] = [];
  topStores: any[] = [];

  // filtres optionnels
  startDate?: string;
  endDate?: string;

  // Chart.js instances
  private revenueChart: Chart | null = null;
  private ordersChart: Chart | null = null;
  private usersChart: Chart | null = null;
  private statusChart: Chart | null = null;

  @ViewChild('revenueCanvas') revenueCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('ordersCanvas') ordersCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('usersCanvas') usersCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusCanvas') statusCanvas!: ElementRef<HTMLCanvasElement>;

  constructor(private dashboardService: DashboardService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.load();
  }

  ngAfterViewInit(): void {
    // Les canvas sont prêts après cette phase
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  private destroyCharts(): void {
    this.revenueChart?.destroy();
    this.ordersChart?.destroy();
    this.usersChart?.destroy();
    this.statusChart?.destroy();
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

  private buildSeriesFromAggregation(agg: any[], valueKey: string): { labels: string[], values: number[] } {
    if (!Array.isArray(agg) || agg.length === 0) return { labels: [], values: [] };
    const mapped = agg.map(a => ({
      year: a._id?.year ?? 0,
      month: a._id?.month ?? 0,
      value: this.parseDecimal(a[valueKey])
    }));
    mapped.sort((a, b) => (a.year - b.year) || (a.month - b.month));
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    return {
      labels: mapped.map(m => `${months[m.month - 1]} ${m.year}`),
      values: mapped.map(m => m.value)
    };
  }  load(): void {
    this.loading = true;
    this.error = null;

    this.dashboardService.getAdminDashboard({ startDate: this.startDate, endDate: this.endDate }).subscribe({
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
      console.log('Dashboard response:', res);
      const payload = res?.data ?? res ?? {};
      const metrics = payload.metrics ?? null;
      const charts = payload.charts ?? null;

      if (metrics) {
        this.metrics = {
          totalRevenue: this.parseDecimal(metrics.totalRevenue),
          totalOrders: metrics.totalOrders ?? 0,
          totalUsers: metrics.totalUsers ?? 0,
          totalProducts: metrics.totalProducts ?? 0,
          totalStores: metrics.totalStores ?? 0
        };
        console.log('Parsed metrics:', this.metrics);
      }

      if (charts) {
        this.charts = charts;

        // Préparer les séries
        const revData = this.buildSeriesFromAggregation(charts.revenueEvolution ?? [], 'revenue');
        this.revenueLabels = revData.labels;
        this.revenueSeries = revData.values;
        console.log('Revenue series:', this.revenueSeries, 'Labels:', this.revenueLabels);

        const ordData = this.buildSeriesFromAggregation(charts.ordersEvolution ?? [], 'count');
        this.ordersLabels = ordData.labels;
        this.ordersSeries = ordData.values;

        const usrData = this.buildSeriesFromAggregation(charts.usersEvolution ?? [], 'count');
        this.usersLabels = usrData.labels;
        this.usersSeries = usrData.values;

        // OrdersByStatus
        this.ordersByStatus = Array.isArray(charts.ordersByStatus)
          ? charts.ordersByStatus.map((s: any) => ({ status: s._id, count: s.count }))
          : [];

        // Top products / stores (avec noms si disponibles)
        this.topProducts = Array.isArray(charts.topProducts)
          ? charts.topProducts.map((p: any) => ({
              id: p._id,
              name: p.productName || p._id,
              totalQuantity: p.totalQuantity,
              totalRevenue: this.parseDecimal(p.totalRevenue)
            }))
          : [];

        this.topStores = Array.isArray(charts.topStores)
          ? charts.topStores.map((s: any) => ({
              id: s._id,
              name: s.storeName || s._id,
              totalRevenue: this.parseDecimal(s.totalRevenue),
              totalOrders: s.totalOrders
            }))
          : [];
      }
    } catch (e) {
      console.error('Error parsing dashboard data:', e);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      if (this.charts) {
        setTimeout(() => this.createCharts(), 200);
      }
    }
  }

  onRefresh(): void {
    this.load();
  }

  private createCharts(): void {
    this.destroyCharts();

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
    }

    // Users Chart
    if (this.usersCanvas?.nativeElement && this.usersSeries.length > 0) {
      this.usersChart = new Chart(this.usersCanvas.nativeElement, {
        type: 'line',
        data: {
          labels: this.usersLabels,
          datasets: [{
            label: 'Utilisateurs',
            data: this.usersSeries,
            borderColor: '#ff9800',
            backgroundColor: 'rgba(255, 152, 0, 0.1)',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ff9800',
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
    }

    // Status Doughnut Chart
    if (this.statusCanvas?.nativeElement && this.ordersByStatus.length > 0) {
      const statusColors: Record<string, string> = {
        pending: '#ffc107',
        confirmed: '#2196f3',
        shipped: '#9c27b0',
        delivered: '#4caf50',
        cancelled: '#f44336'
      };
      this.statusChart = new Chart(this.statusCanvas.nativeElement, {
        type: 'doughnut',
        data: {
          labels: this.ordersByStatus.map(s => this.translateStatus(s.status)),
          datasets: [{
            data: this.ordersByStatus.map(s => s.count),
            backgroundColor: this.ordersByStatus.map(s => statusColors[s.status] || '#9e9e9e'),
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
    }
  }

  translateStatus(status: string): string {
    const map: Record<string, string> = {
      pending: 'En attente',
      confirmed: 'Confirmée',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée'
    };
    return map[status] || status;
  }

  totalOrdersByStatus(): number {
    return this.ordersByStatus.reduce((s, it) => s + (it.count || 0), 0);
  }
}
