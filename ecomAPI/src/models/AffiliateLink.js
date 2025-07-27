'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AffiliateLink extends Model {
    static associate(models) {
      AffiliateLink.belongsTo(models.User, { foreignKey: 'kolId', targetKey: 'id', as: 'kol' });
      AffiliateLink.belongsTo(models.Product, { foreignKey: 'productId', targetKey: 'id', as: 'product' });
      AffiliateLink.hasMany(models.AffiliateClick, { foreignKey: 'linkId', as: 'clicks' });
    }
  };
  AffiliateLink.init({
    kolId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    productId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    originalUrl: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    shortUrl: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    shortCode: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    clickCount: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    conversions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Number of conversions from this link'
    },
    revenue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Total revenue generated from this link'
    },
    commission: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0.00,
      comment: 'Total commission earned from this link'
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: null
    },
    platform: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: null
    }
  }, {
    sequelize,
    modelName: 'AffiliateLink',
    timestamps: false
  });
  return AffiliateLink;
};
