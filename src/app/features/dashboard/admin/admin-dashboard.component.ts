import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { AdminDashboardService } from '../../../core/services/admin-dashboard.service';
import {
  AdminDashboardData,
  AdminMetrics,
  RevenueEvolutionItem,
  CountEvolutionItem,
  TopProductItem,
  TopStoreItem,
  OrdersByStatusItem,
} from '../../../core/models/admin-dashboard.model';

/* Labels FR pour les statuts */
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'En attente',  color: '#f59e0b' },
  confirmed: { label: 'Confirmée',   color: '#3b82f6' },
  shipped:   { label: 'Expédiée',    color: '#8b5cf6' },
  delivered: { label: 'Livrée',      color: '#10b981' },
  cancelled: { label: 'Annulée',     color: '#ef4444' },
};

/* Noms des mois */
const MONTH_NAMES = [
  '', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin',
  'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc',
];

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
})
export class AdminDashboardComponent implements OnInit, OnDestroy {

  /* ── Données ── */
  metrics: AdminMetrics | null = null;
  revenueEvolution: RevenueEvolutionItem[] = [];
  ordersEvolution: CountEvolutionItem[] = [];
  usersEvolution: CountEvolutionItem[] = [];
  topProducts: TopProductItem[] = [];
  topStores: TopStoreItem[] = [];
  ordersByStatus: OrdersByStatusItem[] = [];

  /* ── UI ── */
  isLoading = true;
  errorMessage = '';

  private readonly destroy$ = new Subject<void>();

  constructor(private readonly dashboardService: AdminDashboardService) {}

  /* ────────────────────────── Lifecycle ────────────────────────── */

  ngOnInit(): void {
    this.loadDashboard();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /* ────────────────────────── Chargement ────────────────────────── */

  loadDashboard(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.dashboardService
      .getDashboard()
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => (this.isLoading = false)),
      )
      .subscribe({
        next: (data: AdminDashboardData) => {
          this.metrics          = data.metrics;
          this.revenueEvolution = data.charts.revenueEvolution  || [];
          this.ordersEvolution  = data.charts.ordersEvolution   || [];
          this.usersEvolution   = data.charts.usersEvolution    || [];
          this.topProducts      = data.charts.topProducts       || [];
          this.topStores        = data.charts.topStores         || [];
          this.ordersByStatus   = data.charts.ordersByStatus    || [];
        },
        error: (err) => {
          console.error('Erreur dashboard admin:', err);
          this.errorMessage = 'Impossible de charger le tableau de bord.';
        },
      });
  }

  /* ────────────────────────── Helpers template ────────────────────────── */

  /** Convertit un $numberDecimal MongoDB en number */
  toNum(value: { $numberDecimal: string } | number | undefined): number {
    return AdminDashboardService.toNumber(value);
  }

  /** Formate un nombre en Ariary */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('fr-MG', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0,
    }).format(value);
  }

  /** Formate un nombre avec séparateurs */
  formatNumber(value: number): string {
    return new Intl.NumberFormat('fr-MG').format(value);
  }

  /** Renvoie le label FR d'un statut */
  getStatusLabel(statusId: string): string {
    return STATUS_CONFIG[statusId]?.label ?? statusId;
  }

  /** Renvoie la couleur d'un statut */
  getStatusColor(statusId: string): string {
    return STATUS_CONFIG[statusId]?.color ?? '#6b7280';
  }

  /** Pourcentage d'un statut par rapport au total */
  getStatusPercent(count: number): number {
    const total = this.ordersByStatus.reduce((sum, s) => sum + s.count, 0);
    return total > 0 ? Math.round((count / total) * 100) : 0;
  }

  /** Label "Jan 2024" pour un item d'évolution */
  getMonthLabel(item: { _id: { year: number; month: number } }): string {
    return `${MONTH_NAMES[item._id.month]} ${item._id.year}`;
  }

  /** Hauteur d'une barre dans le chart revenu (en %) */
  getRevenueBarHeight(item: RevenueEvolutionItem): number {
    const max = Math.max(...this.revenueEvolution.map((r) => this.toNum(r.revenue)), 1);
    return (this.toNum(item.revenue) / max) * 100;
  }

  /** Hauteur d'une barre dans le chart commandes (en %) */
  getOrdersBarHeight(item: CountEvolutionItem): number {
    const max = Math.max(...this.ordersEvolution.map((o) => o.count), 1);
    return (item.count / max) * 100;
  }
}
