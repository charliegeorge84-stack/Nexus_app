const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Component = sequelize.define('Component', {
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
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  description: {
    type: DataTypes.TEXT
  },
  languages: {
    type: DataTypes.JSON,
    defaultValue: ['English']
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  notificationSettings: {
    type: DataTypes.JSON,
    defaultValue: {
      ticketCreated: true,
      statusChanged: true,
      commentAdded: true,
      approachingDeadline: true,
      ticketLive: true
    }
  },
  escalationRules: {
    type: DataTypes.JSON,
    defaultValue: {
      enabled: true,
      hoursBeforeEscalation: 24,
      escalationEmails: []
    }
  }
});

module.exports = Component;
