const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');

const PostagemMiniforum = sequelize.define('postagem_miniforum', {
  id_postagem_miniforum: {
    type: DataTypes.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: () => gerarUUIDv7()
  },
  id_utilizador_autor: {
    type: DataTypes.UUID,
    allowNull: false // Chave FK do autor da postagem (ex: SLL, TM, Admin)
  },
  id_categoria_miniforum: {
    type: DataTypes.INTEGER,
    allowNull: false // Chave FK para a categoria do minifórum
  },
  id_perfil_alvo: {
    type: DataTypes.INTEGER,
    allowNull: true // Null = Todos os perfis / público global; 1 = Admin; 2 = SLL; 3 = TM; 4 = Consultor
  },
  id_traducao_titulo: {
    type: DataTypes.UUID,
    allowNull: false // Chave FK para traducao_conteudo (i18n do título)
  },
  id_traducao_mensagem: {
    type: DataTypes.UUID,
    allowNull: false // Chave FK para traducao_conteudo (i18n do conteúdo)
  },
  data_postagem: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  postagem_visivel: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
  }
}, {
  freezeTableName: true
});

module.exports = PostagemMiniforum;
