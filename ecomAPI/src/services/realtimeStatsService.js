const db = require('../models');
const { Op } = require('sequelize');

// Store for WebSocket connections by KOL ID
const kolConnections = new Map();

const getRealtimeStats = async (kolId = null) => {
  try {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Build filter conditions
    const clickWhereCondition = {};
    const commissionWhereCondition = {};
    
    if (kolId) {
      clickWhereCondition.kolId = kolId;
      commissionWhereCondition.kolId = kolId;
    }
    
    // Real-time statistics (last hour)
    const recentClicks = await db.AffiliateClick.count({
      where: {
        ...clickWhereCondition,
        clicked_At: {
          [Op.gte]: oneHourAgo
        }
      }
    });
    
    const recentConversions = await db.AffiliateClick.count({
      where: {
        ...clickWhereCondition,
        clicked_At: {
          [Op.gte]: oneHourAgo
        },
        converted: true
      }
    });
    

    
    const recentRevenue = await db.AffiliateLink.sum('revenue', {
      where: {
        kolId: kolId || { [Op.ne]: null },
        created_At: {
          [Op.gte]: oneHourAgo
        }
      }
    });
    
    // Today's statistics
    const todayClicks = await db.AffiliateClick.count({
      where: {
        ...clickWhereCondition,
        clicked_At: {
          [Op.gte]: today
        }
      }
    });
    
    const todayConversions = await db.AffiliateClick.count({
      where: {
        ...clickWhereCondition,
        clicked_At: {
          [Op.gte]: today
        },
        converted: true
      }
    });
    
    
    const todayRevenue = await db.AffiliateLink.sum('revenue', {
      where: {
        kolId: kolId || { [Op.ne]: null },
        created_At: {
          [Op.gte]: today
        }
      }
    });
    
    // Pending commissions

    
    // Active links count
    const activeLinks = await db.AffiliateLink.count({
      where: {
        kolId: kolId || { [Op.ne]: null }
      }
    });
    
    const recentCommissionData = recentCommissions[0] || { count: 0, total: 0 };
    const todayCommissionData = todayCommissions[0] || { count: 0, total: 0 };
    const pendingCommissionData = pendingCommissions[0] || { count: 0, total: 0 };
    
    return {
      realtime: {
        clicks: recentClicks,
        conversions: recentConversions,
        conversionRate: recentClicks > 0 ? ((recentConversions / recentClicks) * 100).toFixed(2) : 0,
        revenue: parseFloat(recentRevenue || 0),
        commissionCount: parseInt(recentCommissionData.count),
        commissionAmount: parseFloat(recentCommissionData.total || 0)
      },
      today: {
        clicks: todayClicks,
        conversions: todayConversions,
        conversionRate: todayClicks > 0 ? ((todayConversions / todayClicks) * 100).toFixed(2) : 0,
        revenue: parseFloat(todayRevenue || 0),
        commissionCount: parseInt(todayCommissionData.count),
        commissionAmount: parseFloat(todayCommissionData.total || 0)
      },
      pending: {
        commissionCount: parseInt(pendingCommissionData.count),
        commissionAmount: parseFloat(pendingCommissionData.total || 0)
      },
      overview: {
        activeLinks: activeLinks
      },
      timestamp: now
    };
  } catch (error) {
    console.error('Error getting realtime stats:', error);
    throw error;
  }
};

// WebSocket connection management
const registerKolConnection = (kolId, socketId) => {
  if (!kolConnections.has(kolId)) {
    kolConnections.set(kolId, new Set());
  }
  kolConnections.get(kolId).add(socketId);
  console.log(`KOL ${kolId} connected with socket ${socketId}`);
};

const unregisterKolConnection = (kolId, socketId) => {
  if (kolConnections.has(kolId)) {
    kolConnections.get(kolId).delete(socketId);
    if (kolConnections.get(kolId).size === 0) {
      kolConnections.delete(kolId);
    }
  }
  console.log(`KOL ${kolId} disconnected socket ${socketId}`);
};

// Broadcast stats update to connected KOL clients
const broadcastStatsUpdate = async (kolId, socketIo) => {
  try {
    if (kolConnections.has(kolId)) {
      const stats = await getRealtimeStats(kolId);
      const sockets = kolConnections.get(kolId);
      
      sockets.forEach(socketId => {
        socketIo.to(socketId).emit('statsUpdate', {
          kolId: kolId,
          stats: stats,
          timestamp: new Date()
        });
      });
      
      console.log(`Broadcasted stats update to ${sockets.size} clients for KOL ${kolId}`);
    }
  } catch (error) {
    console.error(`Error broadcasting stats update for KOL ${kolId}:`, error);
  }
};

// Broadcast global stats update to all connected clients
const broadcastGlobalStatsUpdate = async (socketIo) => {
  try {
    const globalStats = await getRealtimeStats(); // Get stats for all KOLs
    
    // Broadcast to all connected KOLs
    for (const [kolId, sockets] of kolConnections.entries()) {
      const kolSpecificStats = await getRealtimeStats(kolId);
      sockets.forEach(socketId => {
        socketIo.to(socketId).emit('globalStatsUpdate', {
          globalStats: globalStats,
          kolStats: kolSpecificStats,
          timestamp: new Date()
        });
      });
    }
    
    console.log(`Broadcasted global stats update to ${kolConnections.size} KOLs`);
  } catch (error) {
    console.error('Error broadcasting global stats update:', error);
  }
};

// Trigger stats update when affiliate events occur
const triggerStatsUpdate = async (kolId, eventType, socketIo) => {
  try {
    console.log(`Stats update triggered for KOL ${kolId} due to ${eventType}`);
    
    // Broadcast to specific KOL
    if (kolId) {
      await broadcastStatsUpdate(kolId, socketIo);
    }
    
    // Also broadcast global update for admin dashboards
    await broadcastGlobalStatsUpdate(socketIo);
  } catch (error) {
    console.error(`Error triggering stats update for KOL ${kolId}:`, error);
  }
};

// Scheduled stats refresh (every 30 seconds)
let statsRefreshInterval;

const startStatsRefresh = (socketIo) => {
  if (statsRefreshInterval) {
    clearInterval(statsRefreshInterval);
  }
  
  statsRefreshInterval = setInterval(async () => {
    try {
      // Only refresh if there are connected clients
      if (kolConnections.size > 0) {
        await broadcastGlobalStatsUpdate(socketIo);
      }
    } catch (error) {
      console.error('Error in scheduled stats refresh:', error);
    }
  }, 30000); // 30 seconds
  
  console.log('Started scheduled stats refresh every 30 seconds');
};

const stopStatsRefresh = () => {
  if (statsRefreshInterval) {
    clearInterval(statsRefreshInterval);
    statsRefreshInterval = null;
    console.log('Stopped scheduled stats refresh');
  }
};

// HTTP endpoint for polling-based updates
const getRealtimeUpdates = async (req, res) => {
  try {
    const kolId = req.user?.id; // Get KOL ID from authenticated user
    const { includeGlobal = false } = req.query;
    
    if (!kolId) {
      return res.status(401).json({
        errCode: 1,
        errMessage: 'User not authenticated'
      });
    }
    
    // Check if user is an approved KOL
    const user = await db.User.findOne({
      where: { 
        id: kolId,
        is_kol: true,
        kol_status: 'approved'
      }
    });
    
    if (!user) {
      return res.status(403).json({
        errCode: 2,
        errMessage: 'User is not an approved KOL'
      });
    }
    
    const stats = await getRealtimeStats(kolId);
    const response = {
      errCode: 0,
      errMessage: 'Real-time stats retrieved successfully',
      data: {
        kolStats: stats,
        timestamp: new Date()
      }
    };
    
    // Include global stats if requested (for admin users)
    if (includeGlobal && (user.roleId === 'R1' || user.roleId === 'R2')) {
      const globalStats = await getRealtimeStats();
      response.data.globalStats = globalStats;
    }
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error getting real-time updates:', error);
    return res.status(500).json({ 
      errCode: -1,
      errMessage: 'Error from server',
      details: error.message 
    });
  }
};

// WebSocket event handlers
const handleWebSocketConnection = (socket, socketIo) => {
  // Handle KOL stats subscription
  socket.on('subscribeKolStats', (data) => {
    const { kolId, token } = data;
    
    // In a real implementation, you'd verify the JWT token here
    // For now, we'll assume the token is valid
    if (kolId) {
      registerKolConnection(kolId, socket.id);
      
      // Send initial stats
      getRealtimeStats(kolId).then(stats => {
        socket.emit('statsUpdate', {
          kolId: kolId,
          stats: stats,
          timestamp: new Date()
        });
      }).catch(error => {
        console.error('Error sending initial stats:', error);
        socket.emit('statsError', { error: error.message });
      });
    }
  });
  
  // Handle unsubscription
  socket.on('unsubscribeKolStats', (data) => {
    const { kolId } = data;
    if (kolId) {
      unregisterKolConnection(kolId, socket.id);
    }
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    // Remove socket from all KOL connections
    for (const [kolId, sockets] of kolConnections.entries()) {
      if (sockets.has(socket.id)) {
        unregisterKolConnection(kolId, socket.id);
      }
    }
  });
};

module.exports = {
  getRealtimeStats,
  getRealtimeUpdates,
  registerKolConnection,
  unregisterKolConnection,
  broadcastStatsUpdate,
  broadcastGlobalStatsUpdate,
  triggerStatsUpdate,
  startStatsRefresh,
  stopStatsRefresh,
  handleWebSocketConnection
}; 