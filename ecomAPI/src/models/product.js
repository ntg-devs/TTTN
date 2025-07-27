'use strict';

const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Product extends Model {

        static associate(models) {
            Product.belongsTo(models.Allcode, { foreignKey: 'categoryId', targetKey: 'code', as: 'categoryData' })
            Product.belongsTo(models.Allcode, { foreignKey: 'brandId', targetKey: 'code', as: 'brandData' })
            Product.belongsTo(models.Allcode, { foreignKey: 'statusId', targetKey: 'code', as: 'statusData' })
            Product.hasMany(models.ProductDetail, { foreignKey: 'productId', as: 'productDetails' })
            Product.hasMany(models.AffiliateLink, { foreignKey: 'productId', as: 'affiliateLinks' })
            Product.hasMany(models.AffiliateClick, { foreignKey: 'productId', as: 'affiliateClicks' })
            Product.hasMany(models.AffiliateOrders, { foreignKey: 'productId', as: 'affiliateOrders' })
        }
    };
    Product.init({
        name: DataTypes.STRING,
        contentHTML: DataTypes.TEXT('long'),
        contentMarkdown: DataTypes.TEXT('long'),
        statusId: DataTypes.STRING,
        categoryId: DataTypes.STRING,
        view: DataTypes.INTEGER,

        madeby: DataTypes.STRING,
        material: DataTypes.STRING,
        brandId: DataTypes.STRING
    }, {
        sequelize,
        modelName: 'Product',
    });
    return Product;
};