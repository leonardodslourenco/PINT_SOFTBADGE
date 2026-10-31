const Sequelize = require('sequelize');
const sequelize = require('../config/database');

const NivelArea = sequelize.define('nivel_area', {
  id_nivel_area: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },
  id_area_sl: {
    type: Sequelize.SMALLINT,
    allowNull: false
  },
  id_traducao_nivel_area: {
    type: Sequelize.UUID,
    allowNull: false
  },
  candidatura_com_prazo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  tempo_concluir_candidatura: {
    type: Sequelize.SMALLINT,
    allowNull: true
  },
  nivelAtivo: {
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
      fields: ['id_traducao_nivel_area'],
      name: 'ux_traducao_nivel_area'
    }
  ]
});

module.exports = NivelArea;