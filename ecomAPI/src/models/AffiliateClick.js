  'use strict';
  const {
    Model
  } = require('sequelize');
  module.exports = (sequelize, DataTypes) => {
    class AffiliateClick extends Model {
      static associate(models) {
        AffiliateClick.belongsTo(models.AffiliateLink, { foreignKey: 'linkId', targetKey: 'id', as: 'affiliateLink' });
        AffiliateClick.belongsTo(models.User, { foreignKey: 'kolId', targetKey: 'id', as: 'kol' });
        AffiliateClick.belongsTo(models.Product, { foreignKey: 'productId', targetKey: 'id', as: 'product' });
      }
    };
    AffiliateClick.init({
      linkId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      kolId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      productId: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      ipAddress: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: null,
        comment: 'Anonymized IP address'
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true,
        defaultValue: null,
        comment: 'Browser/device information'
      },
      clickedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
        comment: 'When the click occurred'
      },
      referrerUrl: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null,
        comment: 'Referring URL'
      },
      geoLocation: {
        type: DataTypes.STRING(255),
        allowNull: true,
        defaultValue: null
      },
      converted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Whether this click led to a conversion'
      },
      conversionId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: null,
        comment: 'Reference to Order model if converted'
      }
    }, {
      sequelize,
      modelName: 'AffiliateClick',
      timestamps: false
    });
    return AffiliateClick;
  };
