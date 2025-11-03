const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  isInternal: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isResolved: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  resolvedBy: {
    type: DataTypes.INTEGER
  },
  resolvedAt: {
    type: DataTypes.DATE
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  }
});

module.exports = Comment;
