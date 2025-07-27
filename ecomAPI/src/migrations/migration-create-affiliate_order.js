'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AffiliateOrders', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      kolId: { 
        type: Sequelize.INTEGER, 
        allowNull: false
      },
      orderId: { 
        type: Sequelize.INTEGER, 
        allowNull: false
      },
      productId: { 
        type: Sequelize.INTEGER, 
        allowNull: false
      },
      linkId: { 
        type: Sequelize.INTEGER, 
        allowNull: false
      },
      revenue: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      commission: { type: Sequelize.DECIMAL(15, 2), allowNull: false },
      commissionRate: { 
        type: Sequelize.DECIMAL(5, 2), 
        allowNull: false
      },
      status: { type: Sequelize.ENUM('pending', 'completed', 'cancelled'), allowNull: false },
      confirmedAt: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AffiliateOrders');
  }
};