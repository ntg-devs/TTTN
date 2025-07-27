'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AffiliateOrders extends Model {
    static associate(models) {
      AffiliateOrders.belongsTo(models.User, { foreignKey: 'kolId', targetKey: 'id', as: 'kol' });
      AffiliateOrders.belongsTo(models.OrderProduct, { foreignKey: 'orderId', targetKey: 'id', as: 'order' });
      AffiliateOrders.belongsTo(models.Product, { foreignKey: 'productId', targetKey: 'id', as: 'product' });
    }
  };
  AffiliateOrders.init({
    kolId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    orderId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    revenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    commission: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      allowNull: false
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    sequelize,
    modelName: 'AffiliateOrders',
    timestamps: false
  });
  return AffiliateOrders;
};
