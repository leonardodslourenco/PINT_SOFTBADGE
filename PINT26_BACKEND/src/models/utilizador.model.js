var Sequelize = require('sequelize');
var sequelize = require('../config/database');
const { gerarUUIDv7, gerarCodigoEpassword } = require('../services/geradores');

var Utilizador = sequelize.define('utilizador', {
  id_utilizador: {
    type: Sequelize.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  nome: {
    type: Sequelize.STRING(30),
    allowNull: false
  },
  apelido: {
    type: Sequelize.STRING(80),
    allowNull: false
  },
  email: {
    type: Sequelize.STRING(100),
    allowNull: false,
    unique: true
  },
  avatar: {
    type: Sequelize.STRING(255),
    allowNull: true,
    defaultValue: 'default_avatar.png'
  },
  idioma_preferencial: {
    type: Sequelize.ENUM('pt', 'en', 'es'),
    allowNull: false
  },
  thema: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 2,
    validate: {
      isIn: [[1, 2, 3]]
    }
  },
  email_verificado: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  aceitou_rgpd: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  cod_verifica_email: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  timestamp_cod_verifica: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  password_hash: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  password_default: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  conta_bloqueada: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  contador_bloqueio: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 0
  },
  recovery_mode: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  password_temp: {
    type: Sequelize.TEXT,
    allowNull: false
  },
  timestamp_password_temp: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: "1970-01-01T00:00:00Z"
  },
  data_registo: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  first_login: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: "1970-01-01T00:00:00Z"
  },
  last_login: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: "1970-01-01T00:00:00Z"
  },
  id_area: {
    type: Sequelize.SMALLINT,
    allowNull: true
  },
  id_sl: {
    type: Sequelize.SMALLINT,
    allowNull: true
  },
  conta_ativa: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  },
  recomendacoes_badge: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 3,
    validate: {
      isIn: [[3, 6, 9, 12]]
    }
  }
}, {
  freezeTableName: true,

  hooks: {

    beforeCreate: async (utilizador) => {

      if (!utilizador.cod_verifica_email) {
        const emailCode = await gerarCodigoEpassword(10);
        utilizador.cod_verifica_email = emailCode.hash;
      }

      if (!utilizador.password_hash) {
        const password = await gerarCodigoEpassword(20);
        utilizador.password_hash = password.hash;
      }

      if (!utilizador.password_temp) {
        const tempPassword = await gerarCodigoEpassword(20);
        utilizador.password_temp = tempPassword.hash;
      }

    }

  }

});

module.exports = Utilizador;