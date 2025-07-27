const db = require('../models');
const { Op } = require('sequelize');

const getKolPerformanceStats = async (req, res) => {
  try {
    const kolId = req.user.id;
    const { startDate, endDate, groupBy = 'day' } = req.query;
    
    // Xây dựng điều kiện date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter[Op.between] = [new Date(startDate), new Date(endDate)];
    }
    
    // Thống kê click theo thời gian
    const clickStats = await db.AffiliateClick.findAll({
      where: {
        kolId: kolId,
        clicked_at: dateFilter
      },
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('clicked_at')), 'date'],
        [db.sequelize.fn('COUNT', '*'), 'clickCount']
      ],
      group: [db.sequelize.fn('DATE', db.sequelize.col('clicked_at'))],
      order: [[db.sequelize.fn('DATE', db.sequelize.col('clicked_at')), 'ASC']]
    });
    
    // Thống kê đơn hàng và hoa hồng theo thời gian
    const orderStats = await db.AffiliateOrders.findAll({
      where: {
        kolId: kolId,
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
    
    // Thống kê theo sản phẩm
    const productStats = await db.AffiliateOrders.findAll({
      where: { kolId: kolId },
      include: [
        { model: db.Product, as: 'product', attributes: ['id', 'name'] }
      ],
      attributes: [
        'product_id',
        [db.sequelize.fn('COUNT', '*'), 'orderCount'],
        [db.sequelize.fn('SUM', db.sequelize.col('revenue')), 'totalRevenue']
      ],
      group: ['product_id'],
      order: [[db.sequelize.fn('SUM', db.sequelize.col('commission')), 'DESC']]
    });
    
    return res.status(200).json({
      success: true,
      data: {
        clickStats,
        orderStats,
        productStats
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

const getKolEarningsReport = async (req, res) => {
  try {
    const kolId = req.user.id;
    const { month, year } = req.query;
    
    const dateFilter = {};
    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      dateFilter[Op.between] = [startDate, endDate];
    }
    
    const earnings = await db.AffiliateOrders.findAll({
      where: {
        kolId: kolId,
        confirmed_at: dateFilter,
        status: 'completed'
      },
      include: [
        { model: db.Product, as: 'product', attributes: ['name'] },
        { model: db.OrderDetail, as: 'order', attributes: ['id'] }
      ],
      order: [['confirmed_at', 'DESC']]
    });
    
    const totalEarnings = earnings.reduce((sum, order) => sum + parseFloat(order.commission), 0);
    
    return res.status(200).json({
      success: true,
      data: {
        earnings,
        totalEarnings,
        count: earnings.length
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  getKolPerformanceStats,
  getKolEarningsReport
}; 