const Sequelize = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const ObjetivoConsultor = sequelize.define('objetivo_consultor', {
  id_objetivo: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: () => gerarUUIDv7()
  },
  id_utilizador: {
    type: Sequelize.UUID,
    allowNull: false
  },
  id_tipo_objetivo: {
    type: Sequelize.UUID,
    allowNull: false
  },
  // Para tipos 1, 2, 4 — quantidade de badges a obter (min 3, max 5)
  quantidade_badges: {
    type: Sequelize.SMALLINT,
    allowNull: true,
    defaultValue: null,
    validate: {
      min: { args: [3], msg: 'A quantidade mínima de badges é 3.' },
      max: { args: [5], msg: 'A quantidade máxima de badges é 5.' }
    }
  },
  // Para tipos 3, 5 — quantidade de pontos a obter (min 100, max 2000)
  quantidade_pontos: {
    type: Sequelize.INTEGER,
    allowNull: true,
    defaultValue: null,
    validate: {
      min: { args: [100], msg: 'A quantidade mínima de pontos é 100.' },
      max: { args: [2000], msg: 'A quantidade máxima de pontos é 2000.' }
    }
  },
  // Para tipo 2 — tipo de diversidade: 'area', 'service_line', 'learning_path'
  tipo_diversidade: {
    type: Sequelize.STRING(20),
    allowNull: true,
    defaultValue: null,
    validate: {
      isIn: {
        args: [['area', 'service_line', 'learning_path']],
        msg: 'O tipo de diversidade deve ser: area, service_line ou learning_path.'
      }
    }
  },
  // Para tipo 2 — quantidade de entidades distintas
  quantidade_diversidade: {
    type: Sequelize.SMALLINT,
    allowNull: true,
    defaultValue: null
  },
  // Para tipos com prazo (1, 3, 4, 5) — valor numérico do prazo
  prazo_valor: {
    type: Sequelize.SMALLINT,
    allowNull: true,
    defaultValue: null
  },
  // Para tipos com prazo — unidade: 'dias', 'semanas', 'meses'
  unidade_prazo: {
    type: Sequelize.STRING(10),
    allowNull: true,
    defaultValue: null,
    validate: {
      isIn: {
        args: [['dias', 'semanas', 'meses']],
        msg: 'A unidade de prazo deve ser: dias, semanas ou meses.'
      }
    }
  },
  // Data em que o consultor criou o objetivo
  data_inicio_objetivo: {
    type: Sequelize.DATE,
    allowNull: false,
    defaultValue: Sequelize.NOW
  },
  // Calculada pelo backend: data_inicio + prazo (NULL para tipo 2)
  data_limite_objetivo: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null
  },
  // Passa a true quando o sistema verifica que o objetivo foi atingido
  objetivo_cumprido: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // Data em que o objetivo foi cumprido
  data_cumprimento: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null
  },
  // Se o consultor já foi notificado pelo daemon pelo menos uma vez
  consultor_notificado: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // Data da última notificação enviada pelo daemon
  data_ultima_notificacao: {
    type: Sequelize.DATE,
    allowNull: true,
    defaultValue: null
  },
  // Contador de notificações periódicas enviadas
  quantidade_notificacao: {
    type: Sequelize.SMALLINT,
    allowNull: false,
    defaultValue: 0
  },
  // Para tipos com prazo: true quando data_limite_objetivo < NOW() e objetivo_cumprido = false
  objetivo_expirado: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  // Soft-delete
  objetivoAtivo: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

module.exports = ObjetivoConsultor;
