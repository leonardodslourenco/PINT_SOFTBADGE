var Sequelize = require('sequelize');
var sequelize = require('../config/database');

var Perfil = sequelize.define('perfil', {
  id_perfil: {
    type: Sequelize.SMALLINT,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_traducao_perfil: {
    type: Sequelize.UUID,
    allowNull: false
  }
}, 
{
  freezeTableName: true,
  indexes: [
    {
      unique: true,
      fields: ['id_traducao_perfil'],
      name: 'ux_perfil_traducao'
    }
  ]
})

module.exports = Perfil;