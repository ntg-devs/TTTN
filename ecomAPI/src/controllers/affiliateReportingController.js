const db = require('../models');
const { Op } = require('sequelize');

const getAffiliateDashboard = async (req, res) => {
  try {
    const { startDate, endDate, kolId } = req.query;
    
    // Xây dựng điều kiện filter
    const whereCondition = {};
    if (kolId) {
      whereCondition.kolId = kolId;
    }
    
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter[Op.between] = [new Date(startDate), new Date(endDate)];
    }
    
    // Thống kê tổng quan
    const totalClicks = await db.AffiliateClick.count({
      where: {
        ...whereCondition,
        clicked_at: dateFilter
      }
    });
    
    const totalOrders = await db.AffiliateOrders.count({
      where: {
        ...whereCondition,
        status: 'completed',
        confirmed_at: dateFilter
      }
    });
    
    const totalRevenue = await db.AffiliateOrders.sum('revenue', {
      where: {
        ...whereCondition,
        status: 'completed',
        confirmed_at: dateFilter
      }
    });
    
    
    // Conversion rate
    const conversionRate = totalClicks > 0 ? (totalOrders / totalClicks * 100).toFixed(2) : 0;
    
    // Thống kê theo KOL
    const kolStats = await db.AffiliateOrders.findAll({
      where: {
        status: 'completed',
        confirmed_at: dateFilter
      },
      include: [
        { model: db.User, as: 'kol', attributes: ['id', 'firstName', 'lastName', 'kol_tier'] }
      ],
      attributes: [
        'kolId',
        [db.sequelize.fn('COUNT', '*'), 'orderCount'],
        [db.sequelize.fn('SUM', db.sequelize.col('revenue')), 'totalRevenue'],
        [db.sequelize.fn('SUM', db.sequelize.col('commission')), 'totalCommission']
      ],
      group: ['kolId'],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('commission')), 'DESC']]
    });
    
    // Thống kê theo sản phẩm
    const productStats = await db.AffiliateOrders.findAll({
      where: {
        status: 'completed',
        confirmed_at: dateFilter
      },
      include: [
        { model: db.Product, as: 'product', attributes: ['id', 'name'] }
      ],
      attributes: [
        'product_id',
        [db.sequelize.fn('COUNT', '*'), 'orderCount'],
        [db.sequelize.fn('SUM', db.sequelize.col('revenue')), 'totalRevenue']
      ],
      group: ['product_id'],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('revenue')), 'DESC']]
    });
    
    // Thống kê theo ngày
    const dailyStats = await db.AffiliateOrders.findAll({
      where: {
        status: 'completed',
        confirmed_at: dateFilter
      },
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('confirmed_at')), 'date'],
        [db.sequelize.fn('COUNT', '*'), 'orderCount'],
        [db.sequelize.fn('SUM', db.sequelize.col('revenue')), 'totalRevenue']
      ],
      group: [db.sequelize.fn('DATE', db.sequelize.col('confirmed_at'))],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('confirmed_at')), 'ASC']]
    });
    
    return res.status(200).json({
      success: true,
      data: {
        overview: {
          totalClicks,
          totalOrders,
          totalRevenue: totalRevenue || 0,
          conversionRate: parseFloat(conversionRate)
        },
        kolStats,
        productStats,
        dailyStats
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  getAffiliateDashboard
}; 