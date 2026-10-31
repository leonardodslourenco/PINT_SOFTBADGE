var Sequelize = require('sequelize');
var sequelize = require('../config/database');

var Area = sequelize.define('area', {
  id_area: {
    type: Sequelize.SMALLINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_service_line: {
    type: Sequelize.SMALLINT,
    allowNull: false
  },
  id_traducao_area: {
    type: Sequelize.UUID,
    allowNull: false
  },
  areaAtiva: {
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
      fields: ['id_traducao_area'],
      name: 'ux_traducao_area'
    }
  ]
})

module.exports = Area;