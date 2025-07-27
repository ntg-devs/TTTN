const db = require('../models');

const createAffiliateOrder = async ({ orderDetailId, productId, kolId, revenue, commission }) => {
  return await db.AffiliateOrders.create({
    order_id: orderDetailId,
    product_id: productId,
    kolId: kolId,
    revenue,
    commission,
    status: 'pending',
    confirmed_at: null
  });
};

module.exports = {
  createAffiliateOrder
}; 