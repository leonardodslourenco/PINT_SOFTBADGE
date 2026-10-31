var Sequelize = require('sequelize');
var sequelize = require('../config/database');

var LearningPath = sequelize.define('learning_path', {
  id_learning_path: {
    type: Sequelize.SMALLINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_traducao_learning_path: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_traducao_descricao_lp: {
    type: Sequelize.UUID,
    allowNull: false
  },
  cor: {
    type: Sequelize.STRING(50),
    allowNull: true
  },
  lpAtivo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  visibilidade: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  suspenso: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  }
}, 
{
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['id_traducao_learning_path'],
      name: 'ux_traducao_learning_path'
    }
  ]
})

module.exports = LearningPath;