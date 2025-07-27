'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class User extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            User.belongsTo(models.Allcode, { foreignKey: 'genderId', targetKey: 'code', as: 'genderData' })
            User.belongsTo(models.Allcode, { foreignKey: 'roleId', targetKey: 'code', as: 'roleData' })
            
            // KOL-related associations
            User.hasMany(models.KolRequest, { foreignKey: 'userId', as: 'kolRequests' })
            User.hasMany(models.AffiliateLink, { foreignKey: 'kolId', as: 'affiliateLinks' })
            User.hasMany(models.AffiliateClick, { foreignKey: 'kolId', as: 'affiliateClicks' })
            User.hasMany(models.AffiliateOrders, { foreignKey: 'kolId', as: 'affiliateOrders' })
        }
    };
    User.init({
        email: DataTypes.STRING,
        password: DataTypes.STRING,
        firstName: DataTypes.STRING,
        lastName: DataTypes.STRING,
        address: DataTypes.STRING,
        genderId: DataTypes.STRING,
        phonenumber: DataTypes.STRING,
        image: DataTypes.BLOB('long'),
        dob: DataTypes.STRING,
        isActiveEmail: DataTypes.BOOLEAN,
        roleId: DataTypes.STRING,
        statusId: DataTypes.STRING,
        usertoken: DataTypes.STRING,
        is_kol: {
            type: DataTypes.BOOLEAN,
            defaultValue: false
        },
        kol_status: DataTypes.ENUM('pending', 'approved', 'rejected'),
        kol_tier: DataTypes.STRING,
        kol_commission_rate: {
            type: DataTypes.DECIMAL(5,2),
            defaultValue: 5.00
        },
        total_sales: {
            type: DataTypes.INTEGER,
            defaultValue: 0
        },
        total_followers: DataTypes.INTEGER,
        facebook_link: DataTypes.STRING,
        instagram_link: DataTypes.STRING,
        tiktok_link: DataTypes.STRING,
        youtube_link: DataTypes.STRING,
        twitter_link: DataTypes.STRING,
        other_link: DataTypes.STRING,
        bank_name: DataTypes.STRING,
        bank_account_number: DataTypes.STRING,
        bank_account_name: DataTypes.STRING,
        bank_branch: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'User',
    });
    return User;
};