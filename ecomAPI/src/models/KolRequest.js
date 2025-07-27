'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class KolRequest extends Model {
    static associate(models) {
      KolRequest.belongsTo(models.User, { foreignKey: 'userId', targetKey: 'id', as: 'user' });
      KolRequest.belongsTo(models.User, { foreignKey: 'reviewedBy', targetKey: 'id', as: 'reviewedByUser' });
    }
  };
  KolRequest.init({
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      defaultValue: null
    },
    socialMediaLinks: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON object containing social media profile links'
    },
    identificationDocument: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'JSON object containing ID verification details'
    },
    reviewedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Staff user ID who reviewed the application'
    },
    reviewDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'KolRequest',
    timestamps: false
  });
  return KolRequest;
};
