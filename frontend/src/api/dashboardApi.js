import api from './axios';

/**
 * Dashboard API Service
 * Fetches real data from backend based on user role
 * without modifying backend endpoints
 */

/**
 * Get NGO dashboard stats
 * Uses inventory and orders endpoints
 */
export const getNgoDashboardStats = async () => {
  try {
    const [inventoryRes, ordersRes] = await Promise.all([
      api.get('/inventory'),
      api.get('/orders/admin/stats').catch(() => ({ data: { paidOrdersCount: 0, unitsPurchased: 0 } }))
    ]);

    const inventory = inventoryRes.data || [];
    const ordersStats = ordersRes.data || {};

    // Calculate inventory stats
    const totalStock = inventory.reduce((sum, item) => sum + (item.totalStock || 0), 0);
    const lowStockItems = inventory.filter(item => item.totalStock <= 20).length;
    const inventoryCount = inventory.length;

    // Calculate pending requests from orders data (if available)
    // For now, estimate based on inventory movement
    const pendingRequests = Math.max(0, Math.floor(ordersStats.unitsPurchased / 100));

    return {
      success: true,
      stats: {
        totalRequests: ordersStats.paidOrdersCount || 0,
        pendingRequests: pendingRequests,
        inventoryItems: totalStock,
        lowStockCount: lowStockItems,
        inventoryCategories: inventoryCount
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stats: null
    };
  }
};

/**
 * Get User/Beneficiary dashboard stats
 * Uses menstrual records and orders endpoints
 */
export const getUserDashboardStats = async () => {
  try {
    const [recordsRes, ordersRes] = await Promise.all([
      api.get('/records').catch(() => ({ data: [] })),
      api.get('/orders').catch(() => ({ data: { orders: [] } }))
    ]);

    const records = recordsRes.data || [];
    const orders = ordersRes.data?.orders || [];

    // Get the most recent menstrual record
    const latestRecord = records.length > 0
      ? records.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0]
      : null;

    // Calculate cycle info
    let currentCycleDay = '-';
    let nextPeriodIn = '-';
    let phase = '-';

    if (latestRecord) {
      const lastPeriod = new Date(latestRecord.lastPeriodDate);
      const cycleLength = latestRecord.cycleLength || 28;
      const today = new Date();

      // Days since last period
      const daysSince = Math.floor((today - lastPeriod) / (1000 * 60 * 60 * 24));
      currentCycleDay = Math.max(1, daysSince % cycleLength);

      // Days until next period
      const daysUntil = cycleLength - (daysSince % cycleLength);
      nextPeriodIn = daysUntil;

      // Determine phase
      if (currentCycleDay <= 5) phase = 'Menstrual phase';
      else if (currentCycleDay <= 13) phase = 'Follicular phase';
      else if (currentCycleDay <= 15) phase = 'Ovulation phase';
      else phase = 'Luteal phase';
    }

    // Count active requests from orders
    const activeRequests = orders.filter(o => o.orderStatus === 'PENDING').length;
    const completedOrders = orders.filter(o => o.orderStatus === 'PAID').length;

    return {
      success: true,
      stats: {
        currentCycleDay: latestRecord ? `Day ${currentCycleDay}` : 'Not tracked',
        nextPeriodIn: latestRecord ? `${nextPeriodIn} Days` : 'Set up tracking',
        cyclePhase: phase,
        activeRequests: activeRequests,
        productsReceived: completedOrders,
        hasRecord: !!latestRecord,
        recordCount: records.length
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stats: null
    };
  }
};

/**
 * Get chart data for Admin - user registration trends over time
 */
export const getAdminChartData = async (days = 30) => {
  try {
    const [usersRes, ordersRes] = await Promise.all([
      api.get('/users').catch(() => ({ data: [] })),
      api.get('/orders/admin/stats').catch(() => ({ data: { paidOrdersCount: 0, unitsPurchased: 0 } }))
    ]);

    const users = usersRes.data || [];

    // Generate daily registration data
    const now = Date.now();
    const dailyData = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - i * 24 * 60 * 60 * 1000);
      const dateStr = date.toISOString().slice(0, 10);
      const count = users.filter(u => {
        const created = new Date(u.createdAt);
        return created.toISOString().slice(0, 10) === dateStr;
      }).length;
      dailyData.push({ date: dateStr, total: count, label: 'New Users' });
    }

    // Calculate role distribution
    const roleDist = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    return {
      success: true,
      dailyTotals: dailyData,
      roleDistribution: roleDist,
      totalUsers: users.length
    };
  } catch (error) {
    return { success: false, error: error.message, dailyTotals: [] };
  }
};

/**
 * Get chart data for NGO - inventory distribution
 */
export const getNgoChartData = async () => {
  try {
    const [inventoryRes, ordersRes] = await Promise.all([
      api.get('/inventory').catch(() => ({ data: [] })),
      api.get('/orders/admin/stats').catch(() => ({ data: { paidOrdersCount: 0, unitsPurchased: 0 } }))
    ]);

    const inventory = inventoryRes.data || [];

    // Group by product type
    const typeData = inventory.reduce((acc, item) => {
      const type = item.productType || 'Other';
      acc[type] = (acc[type] || 0) + (item.totalStock || 0);
      return acc;
    }, {});

    const distribution = Object.entries(typeData).map(([name, value]) => ({
      name,
      value,
      color: getChartColor(name)
    }));

    return {
      success: true,
      inventoryDistribution: distribution,
      totalStock: inventory.reduce((sum, item) => sum + (item.totalStock || 0), 0)
    };
  } catch (error) {
    return { success: false, error: error.message, inventoryDistribution: [] };
  }
};

/**
 * Get chart data for User/Beneficiary - cycle history
 */
export const getUserChartData = async () => {
  try {
    const recordsRes = await api.get('/records').catch(() => ({ data: [] }));
    const records = recordsRes.data || [];

    // Sort by date and take last 6 records
    const sortedRecords = records
      .sort((a, b) => new Date(a.lastPeriodDate) - new Date(b.lastPeriodDate))
      .slice(-6);

    const cycleData = sortedRecords.map((record, index) => ({
      date: record.lastPeriodDate?.slice(0, 10) || '',
      cycleLength: record.cycleLength || 28,
      flowIntensity: record.flowIntensity || 'medium',
      index: index + 1
    }));

    return {
      success: true,
      cycleHistory: cycleData,
      recordCount: records.length
    };
  } catch (error) {
    return { success: false, error: error.message, cycleHistory: [] };
  }
};

// Helper function for chart colors
function getChartColor(type) {
  const colors = {
    'Pads': '#ec4899',
    'Tampons': '#8b5cf6',
    'Cups': '#06b6d4',
    'Liners': '#10b981',
    'Other': '#f59e0b'
  };
  return colors[type] || '#6b7280';
}

/**
 * Get Admin dashboard stats - comprehensive summary of all system data
 * Uses multiple endpoints to aggregate system-wide statistics
 */
export const getAdminDashboardStats = async () => {
  try {
    const [usersRes, inventoryRes, ordersRes, recordsRes] = await Promise.all([
      api.get('/users').catch(() => ({ data: [] })),
      api.get('/inventory').catch(() => ({ data: [] })),
      api.get('/orders/admin/stats').catch(() => ({ data: { paidOrdersCount: 0, unitsPurchased: 0 } })),
      api.get('/records/admin/all').catch(() => ({ data: { records: [], analytics: {} } }))
    ]);

    const users = usersRes.data || [];
    const inventory = inventoryRes.data || [];
    const ordersStats = ordersRes.data || {};
    const recordsData = recordsRes.data || {};
    const records = recordsData.records || [];
    const recordsAnalytics = recordsData.analytics || {};

    // Calculate user stats by role
    const usersByRole = users.reduce((acc, user) => {
      acc[user.role] = (acc[user.role] || 0) + 1;
      return acc;
    }, {});

    // Calculate inventory stats
    const totalStock = inventory.reduce((sum, item) => sum + (item.totalStock || 0), 0);
    const lowStockItems = inventory.filter(item => item.totalStock <= 20).length;

    // Calculate total donations value from paid orders
    const totalDonations = ordersStats.unitsPurchased || 0;
    const paidOrdersCount = ordersStats.paidOrdersCount || 0;

    return {
      success: true,
      stats: {
        // User statistics
        totalUsers: users.length,
        totalDonors: usersByRole.donor || 0,
        totalNgos: usersByRole.ngo || 0,
        totalBeneficiaries: (usersByRole.user || 0) + (usersByRole.beneficiary || 0),
        totalAdmins: usersByRole.admin || 0,

        // Inventory statistics
        totalInventory: totalStock,
        inventoryCategories: inventory.length,
        lowStockItems: lowStockItems,

        // Order/Donation statistics
        totalDonations: totalDonations,
        totalOrders: paidOrdersCount,

        // Menstrual records statistics
        totalRecords: recordsAnalytics.totalRecords || records.length,
        averageCycleLength: recordsAnalytics.averageCycleLength || 0,
        irregularCycles: recordsAnalytics.irregularCycles || 0
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stats: null
    };
  }
};

/**
 * Get dashboard stats based on user role
 * @param {string} role - user role (ngo, donor, user, beneficiary, admin)
 */
export const getDashboardStatsByRole = async (role) => {
  switch (role) {
    case 'admin':
      return getAdminDashboardStats();
    case 'ngo':
      return getNgoDashboardStats();
    case 'user':
    case 'beneficiary':
      return getUserDashboardStats();
    default:
      return { success: false, stats: null, error: 'Unknown role' };
  }
};
