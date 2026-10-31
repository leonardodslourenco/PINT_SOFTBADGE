const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const Notificacao = sequelize.define('notificacao', {
  id_notificacao: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  id_user_notificador: {
    type: DataTypes.UUID,
    allowNull: true // Pode ser nulo se for uma notificação automática do sistema
  },
  id_user_alvo_notificacao: {
    type: DataTypes.UUID,
    allowNull: false // Utilizador destinatário da notificação
  },
  id_tipo_notificacao: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  id_traducao_titulo: {
    type: DataTypes.UUID,
    allowNull: false // Chave para traducao_conteudo (i18n do título)
  },
  id_traducao_mensagem: {
    type: DataTypes.UUID,
    allowNull: false // Chave para traducao_conteudo (i18n da mensagem)
  },
  lida: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  data_leitura: {
    type: DataTypes.DATE,
    allowNull: true,
    defaultValue: null
  },
  parametros: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: null // Metadados em JSON para redirecionamento/contexto (ex: { id_candidatura, id_badge })
  }
}, {
  freezeTableName: true
});

module.exports = Notificacao;
