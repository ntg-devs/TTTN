'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('AffiliateClicks', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true, allowNull: false },
      linkId: { 
        type: Sequelize.INTEGER, 
        allowNull: false
      },
      kolId: { 
        type: Sequelize.INTEGER, 
        allowNull: false
      },
      productId: { 
        type: Sequelize.INTEGER, 
        allowNull: false
      },
      ipAddress: { 
        type: Sequelize.STRING(50), 
        allowNull: true, 
        defaultValue: null,
        comment: 'Anonymized IP address'
      },
      userAgent: { 
        type: Sequelize.TEXT, 
        allowNull: true, 
        defaultValue: null,
        comment: 'Browser/device information'
      },
      clickedAt: { 
        type: Sequelize.DATE, 
        allowNull: false, 
        defaultValue: Sequelize.NOW,
        comment: 'When the click occurred'
      },
      referrerUrl: { 
        type: Sequelize.STRING(255), 
        allowNull: true, 
        defaultValue: null,
        comment: 'Referring URL'
      },
      geoLocation: { 
        type: Sequelize.STRING(255), 
        allowNull: true, 
        defaultValue: null 
      },
      converted: { 
        type: Sequelize.BOOLEAN, 
        allowNull: false, 
        defaultValue: false,
        comment: 'Whether this click led to a conversion'
      },
      conversionId: { 
        type: Sequelize.INTEGER, 
        allowNull: true, 
        defaultValue: null,
        comment: 'Reference to Order model if converted'
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('AffiliateClicks');
  }
};