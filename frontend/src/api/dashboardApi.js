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
 * Get dashboard stats based on user role
 * @param {string} role - user role (ngo, donor, user, beneficiary)
 */
export const getDashboardStatsByRole = async (role) => {
  switch (role) {
    case 'ngo':
      return getNgoDashboardStats();
    case 'user':
    case 'beneficiary':
      return getUserDashboardStats();
    default:
      return { success: false, stats: null, error: 'Unknown role' };
  }
};
