'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AffiliateLinks', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      kolId: { 
        type: Sequelize.INTEGER, 
        allowNull: false
      },
      productId: { 
        type: Sequelize.INTEGER, 
        allowNull: false
      },
      originalUrl: { type: Sequelize.STRING(500), allowNull: false },
      shortUrl: { type: Sequelize.STRING(255), allowNull: false },
      shortCode: { type: Sequelize.STRING(255), allowNull: false },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      clickCount: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      conversions: { 
        type: Sequelize.INTEGER, 
        allowNull: false, 
        defaultValue: 0,
        comment: 'Number of conversions from this link'
      },
      revenue: { 
        type: Sequelize.DECIMAL(15, 2), 
        allowNull: false, 
        defaultValue: 0.00,
        comment: 'Total revenue generated from this link'
      },
      commission: { 
        type: Sequelize.DECIMAL(15, 2), 
        allowNull: false, 
        defaultValue: 0.00,
        comment: 'Total commission earned from this link'
      },
      expiresAt: { type: Sequelize.DATE, allowNull: true, defaultValue: null },
      platform: { type: Sequelize.STRING(50), allowNull: true, defaultValue: null }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AffiliateLinks');
  }
};