const db = require('../models');
const affiliateClickService = require('../services/affiliateClickService');


const getKolDashboard = async (req, res) => {
  try {
    const kolId = req.user.id;
    
    // Lấy thống kê tổng quan
    const totalClicks = await db.AffiliateClick.count({ where: { kolId: kolId } });
    const totalOrders = await db.AffiliateOrders.count({ where: { kolId: kolId } });
    const totalCommission = await db.AffiliateOrders.sum('commission', { where: { kolId: kolId } });
    
    // Lấy danh sách giao dịch gần đây

    
    return res.status(200).json({
      success: true,
      data: {
        totalClicks,
        totalOrders,
        totalCommission: totalCommission || 0,
        recentTransactions
      }
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

const getProductsForKol = async (req, res) => {
  try {
    const products = await db.Product.findAll({
      where: { statusId: 'S1' }, // Chỉ lấy sản phẩm active
      include: [
        { model: db.Allcode, as: 'categoryData' },
        { model: db.Allcode, as: 'brandData' }
      ]
    });
    
    return res.status(200).json({
      success: true,
      data: products
    });
  } catch (e) {
    return res.status(500).json({ success: false, message: e.message });
  }
};

module.exports = {
  getKolDashboard,
  getProductsForKol
}; 