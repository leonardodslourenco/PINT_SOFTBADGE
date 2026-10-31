const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TokenBlacklist = sequelize.define('TokenBlacklist', {
  token: {
    type: DataTypes.STRING(64),
    primaryKey: true,
    allowNull: false
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false
  }
}, {
  tableName: 'token_blacklist',
  timestamps: true
});

module.exports = TokenBlacklist;
