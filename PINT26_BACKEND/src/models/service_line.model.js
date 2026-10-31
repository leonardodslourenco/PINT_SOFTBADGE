var Sequelize = require('sequelize');
var sequelize = require('../config/database');

var ServiceLine = sequelize.define('service_line', {
  id_service_line: {
    type: Sequelize.SMALLINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_learning_path: {
    type: Sequelize.SMALLINT,
    allowNull: false
  },
  id_traducao_service_line: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_sl_lider: {
    type: Sequelize.UUID,
    allowNull: true, // Permite para evitar dependência circular/ precisa fazer update em seeds para colocar um Líder após carregar os utilizadores.
    unique: true //Pode liderar apenas uma Service Line
  },
    slAtivo: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
}, 
{
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['id_traducao_service_line'],
      name: 'ux_traducao_service_line'
    }
  ]
})

module.exports = ServiceLine;