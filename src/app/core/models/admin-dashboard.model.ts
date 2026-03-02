/* ── Métriques globales ── */
export interface AdminMetrics {
  totalRevenue: { $numberDecimal: string } | number;
  totalOrders: number;
  totalUsers: number;
  totalProducts: number;
  totalStores: number;
}

/* ── Évolution du CA par mois ── */
export interface RevenueEvolutionItem {
  _id: { year: number; month: number };
  revenue: { $numberDecimal: string } | number;
}

/* ── Évolution commandes / utilisateurs par mois ── */
export interface CountEvolutionItem {
  _id: { year: number; month: number };
  count: number;
}

/* ── Top produits ── */
export interface TopProductItem {
  _id: string;
  totalQuantity: number;
  totalRevenue: number;
}

/* ── Commandes par statut ── */
export interface OrdersByStatusItem {
  _id: string;   // 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  count: number;
}

/* ── Top magasins ── */
export interface TopStoreItem {
  _id: string;
  totalRevenue: number;
  totalOrders: number;
}

/* ── Charts (regroupe tout) ── */
export interface AdminCharts {
  revenueEvolution: RevenueEvolutionItem[];
  ordersEvolution: CountEvolutionItem[];
  usersEvolution: CountEvolutionItem[];
  topProducts: TopProductItem[];
  ordersByStatus: OrdersByStatusItem[];
  topStores: TopStoreItem[];
}

/* ── Réponse complète du backend ── */
export interface AdminDashboardData {
  metrics: AdminMetrics;
  charts: AdminCharts;
}

export interface AdminDashboardResponse {
  success: boolean;
  message: string;
  data: AdminDashboardData;
}
