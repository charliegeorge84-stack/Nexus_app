const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProcessTicket = sequelize.define('ProcessTicket', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('draft', 'in_progress', 'under_review', 'approved', 'scheduled', 'live', 'on_hold', 'closed'),
    allowNull: false,
    defaultValue: 'draft'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'critical'),
    defaultValue: 'medium'
  },
  scheduledDate: {
    type: DataTypes.DATE
  },
  publishedDate: {
    type: DataTypes.DATE
  },
  deadline: {
    type: DataTypes.DATE
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: []
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {}
  },
  version: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
});

module.exports = ProcessTicket;
