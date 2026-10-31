const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const ConfiguracaoSLA = sequelize.define('configuracao_sla', {
  id_configuracao: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  sla_tm_horas: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 48
  },
  sla_sll_horas: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 48
  },
  enviar_email_pendentes: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  aviso_email_horas_restantes: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 12
  },
  notificar_admin_sll_expirado: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  dias_badge_expirando: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 30,
    validate: {
      min: 1,
      max: 1825
    }
  },
  intervalo_verificacao_badge_expirado: {
    type: Sequelize.INTEGER,
    allowNull: false,
    defaultValue: 24,
    validate: {
      min: 2,
      max: 24
    }
  }
}, {
  freezeTableName: true,
  tableName: 'configuracao_sla'
});

module.exports = ConfiguracaoSLA;
