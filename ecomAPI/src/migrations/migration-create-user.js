'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      firstName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.STRING
      },
      genderId: {
        type: Sequelize.STRING
      },
      phonenumber: {
        type: Sequelize.STRING
      },
      image: {
        type: Sequelize.BLOB('long')
      },
      dob: {
        type: Sequelize.STRING
      },
      isActiveEmail: {
        type: Sequelize.BOOLEAN
      },
      roleId: {
        type: Sequelize.STRING
      },
      statusId: {
        type: Sequelize.STRING
      },
      usertoken: {
        type: Sequelize.STRING
      },
      is_kol: {
        type: Sequelize.BOOLEAN
      },
      kol_status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected')
      },
      kol_tier: {
        type: Sequelize.STRING
      },
      kol_commission_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0.00
      },
      total_sales: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      total_followers: {
        type: Sequelize.INTEGER
      },
      facebook_link: {
        type: Sequelize.STRING
      },
      instagram_link: {
        type: Sequelize.STRING
      },
      tiktok_link: {
        type: Sequelize.STRING
      },
      youtube_link: {
        type: Sequelize.STRING
      },
      twitter_link: {
        type: Sequelize.STRING
      },
      other_link: {
        type: Sequelize.STRING
      },
      bank_name: {
        type: Sequelize.STRING
      },
      bank_account_number: {
        type: Sequelize.STRING
      },
      bank_account_name: {
        type: Sequelize.STRING
      },
      bank_branch: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};
