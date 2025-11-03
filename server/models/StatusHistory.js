const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StatusHistory = sequelize.define('StatusHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  previousStatus: {
    type: DataTypes.ENUM('draft', 'in_progress', 'under_review', 'approved', 'scheduled', 'live', 'on_hold', 'closed'),
    allowNull: true
  },
  newStatus: {
    type: DataTypes.ENUM('draft', 'in_progress', 'under_review', 'approved', 'scheduled', 'live', 'on_hold', 'closed'),
    allowNull: false
  },
  reason: {
    type: DataTypes.TEXT
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  }
});

module.exports = StatusHistory;
