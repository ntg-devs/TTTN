'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('KolRequests', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      userId: { 
        type: Sequelize.INTEGER, 
        allowNull: false
      },
      status: { type: Sequelize.ENUM('pending', 'approved', 'rejected'), allowNull: false, defaultValue: 'pending' },
      reason: { type: Sequelize.TEXT, allowNull: true, defaultValue: null },
      socialMediaLinks: { 
        type: Sequelize.JSON, 
        allowNull: true,
        comment: 'JSON object containing social media profile links'
      },
      identificationDocument: { 
        type: Sequelize.JSON, 
        allowNull: true,
        comment: 'JSON object containing ID verification details'
      },
      reviewedBy: { 
        type: Sequelize.INTEGER, 
        allowNull: true,
        comment: 'Staff user ID who reviewed the application'
      },
      reviewDate: { type: Sequelize.DATE, allowNull: true },
      createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW },
      updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.NOW }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('KolRequests');
  }
};