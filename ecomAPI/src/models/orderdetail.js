'use strict';
const {
    Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class OrderDetail extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            OrderDetail.belongsTo(models.OrderProduct, { foreignKey: 'orderId', targetKey: 'id', as: 'order' })
            OrderDetail.belongsTo(models.Product, { foreignKey: 'productId', targetKey: 'id', as: 'product' })
            OrderDetail.hasMany(models.AffiliateOrders, { foreignKey: 'orderId', as: 'affiliateOrders' })
        }
    };
    OrderDetail.init({
        orderId: DataTypes.INTEGER,
        productId: DataTypes.INTEGER,
        quantity: DataTypes.INTEGER,
        realPrice: DataTypes.BIGINT
    }, {
        sequelize,
        modelName: 'OrderDetail',
    });
    return OrderDetail;
};