const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Integration = sequelize.define('Integration', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  type: {
    type: DataTypes.ENUM('document360', 'jira', 'slack', 'teams', 'custom'),
    allowNull: false
  },
  isEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  config: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  lastSync: {
    type: DataTypes.DATE
  },
  syncStatus: {
    type: DataTypes.ENUM('success', 'failed', 'in_progress'),
    defaultValue: 'success'
  },
  errorMessage: {
    type: DataTypes.TEXT
  }
});

module.exports = Integration;
