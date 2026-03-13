// Mock data pour le dashboard manager
// Basé sur les seeds du projet pour des données réalistes

export const MANAGER_DASHBOARD_MOCK = {
  success: true,
  message: 'Tableau de bord manager récupéré avec succès',
  data: {
    globalMetrics: {
      totalStores: 2,
      activeStores: 2,
      totalRevenue: 8450000,
      totalOrders: 68,
      totalProducts: 10,
      totalCustomers: 45,
      averageOrderValue: 124264.7
    },
    storesSummary: [
      {
        storeId: '65f1c1a5e1c2a9b001001001',
        storeName: 'Ankoay',
        status: 'active',
        revenue: 5820000,
        orders: 42,
        products: 5,
        customers: 28,
        stockValue: 25000000,
        lowStockAlerts: 2,
        pendingOrders: 3
      },
      {
        storeId: '65f1c1a5e1c2a9b001001002',
        storeName: 'Ivanjo',
        status: 'active',
        revenue: 2630000,
        orders: 26,
        products: 5,
        customers: 17,
        stockValue: 8500000,
        lowStockAlerts: 1,
        pendingOrders: 1
      }
    ],
    analytics: {
      revenueEvolution: [
        { month: '2024-01', revenue: 1250000 },
        { month: '2024-02', revenue: 1580000 },
        { month: '2024-03', revenue: 1320000 },
        { month: '2024-04', revenue: 1890000 },
        { month: '2024-05', revenue: 2150000 },
        { month: '2024-06', revenue: 1260000 }
      ],
      topPerformingStores: [
        { _id: '65f1c1a5e1c2a9b001001001', storeName: 'Ankoay', revenue: 5820000 },
        { _id: '65f1c1a5e1c2a9b001001002', storeName: 'Ivanjo', revenue: 2630000 }
      ],
      topProductsAcrossStores: [
        { productName: 'Laptop Dell XPS 15', totalSold: 8, revenue: 46392000 },
        { productName: 'iPhone 15 Pro', totalSold: 5, revenue: 31495000 },
        { productName: 'MacBook Air M2', totalSold: 4, revenue: 19996000 },
        { productName: 'Samsung Galaxy S24', totalSold: 6, revenue: 23994000 },
        { productName: 'JBL Live 770NC', totalSold: 12, revenue: 1860000 }
      ],
      ordersEvolution: [
        { month: '2024-01', count: 8 },
        { month: '2024-02', count: 12 },
        { month: '2024-03', count: 9 },
        { month: '2024-04', count: 15 },
        { month: '2024-05', count: 18 },
        { month: '2024-06', count: 6 }
      ]
    },
    alerts: {
      lowStock: [
        { productName: 'iPhone 15 Pro', storeName: 'Ankoay', currentStock: 2, minStock: 5 },
        { productName: 'MacBook Air M2', storeName: 'Ankoay', currentStock: 1, minStock: 3 },
        { productName: 'Samsung Galaxy S24', storeName: 'Ivanjo', currentStock: 3, minStock: 5 }
      ],
      pendingOrders: [
        { orderId: 'ORD-2024-001', storeName: 'Ankoay', customerName: 'Tsanta Randriamihary', total: 5799000, createdAt: '2024-06-15T10:30:00Z' },
        { orderId: 'ORD-2024-002', storeName: 'Ankoay', customerName: 'Kanto Andriamalala', total: 6299000, createdAt: '2024-06-14T14:20:00Z' },
        { orderId: 'ORD-2024-003', storeName: 'Ankoay', customerName: 'Hery Rakotomalala', total: 98000, createdAt: '2024-06-13T09:15:00Z' },
        { orderId: 'ORD-2024-004', storeName: 'Ivanjo', customerName: 'Tsanta Randriamihary', total: 68000, createdAt: '2024-06-12T16:45:00Z' }
      ]
    }
  }
};
