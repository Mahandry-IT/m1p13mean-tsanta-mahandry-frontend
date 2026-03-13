// Mock data pour le dashboard admin
// Basé sur les seeds du projet pour des données réalistes

export const ADMIN_DASHBOARD_MOCK = {
  success: true,
  message: 'Tableau de bord admin récupéré avec succès',
  data: {
    metrics: {
      totalRevenue: 12548500,
      totalOrders: 156,
      totalUsers: 7,
      totalProducts: 15,
      totalStores: 3
    },
    charts: {
      revenueEvolution: [
        { _id: { year: 2024, month: 1 }, revenue: 1850000 },
        { _id: { year: 2024, month: 2 }, revenue: 2340000 },
        { _id: { year: 2024, month: 3 }, revenue: 1920000 },
        { _id: { year: 2024, month: 4 }, revenue: 2780000 },
        { _id: { year: 2024, month: 5 }, revenue: 3150000 },
        { _id: { year: 2024, month: 6 }, revenue: 2508500 }
      ],
      ordersEvolution: [
        { _id: { year: 2024, month: 1 }, count: 18 },
        { _id: { year: 2024, month: 2 }, count: 24 },
        { _id: { year: 2024, month: 3 }, count: 21 },
        { _id: { year: 2024, month: 4 }, count: 32 },
        { _id: { year: 2024, month: 5 }, count: 38 },
        { _id: { year: 2024, month: 6 }, count: 23 }
      ],
      usersEvolution: [
        { _id: { year: 2024, month: 1 }, count: 2 },
        { _id: { year: 2024, month: 2 }, count: 3 },
        { _id: { year: 2024, month: 3 }, count: 5 },
        { _id: { year: 2024, month: 4 }, count: 6 },
        { _id: { year: 2024, month: 5 }, count: 7 },
        { _id: { year: 2024, month: 6 }, count: 7 }
      ],
      topProducts: [
        { _id: '6990aefb7053d5bc9001e428', name: 'Laptop Dell XPS 15', totalQuantity: 12, totalRevenue: 69588000 },
        { _id: '6990aefb7053d5bc9001e429', name: 'iPhone 15 Pro', totalQuantity: 8, totalRevenue: 50392000 },
        { _id: '6990aefb7053d5bc9001e42b', name: 'MacBook Air M2', totalQuantity: 6, totalRevenue: 29994000 },
        { _id: '6990aefb7053d5bc9001e434', name: 'Sneakers Urban', totalQuantity: 15, totalRevenue: 1470000 },
        { _id: '6990aefb7053d5bc9001e435', name: 'JBL Live 770NC', totalQuantity: 9, totalRevenue: 1395000 }
      ],
      ordersByStatus: [
        { _id: 'pending', count: 12 },
        { _id: 'confirmed', count: 28 },
        { _id: 'shipped', count: 35 },
        { _id: 'delivered', count: 72 },
        { _id: 'cancelled', count: 9 }
      ],
      topStores: [
        { _id: '65f1c1a5e1c2a9b001001001', name: 'Ankoay', totalRevenue: 5820000, totalOrders: 68 },
        { _id: '65f1c1a5e1c2a9b001001002', name: 'Ivanjo', totalRevenue: 4125000, totalOrders: 52 },
        { _id: '65f1c1a5e1c2a9b001001003', name: 'Tahina', totalRevenue: 2603500, totalOrders: 36 }
      ]
    }
  }
};
