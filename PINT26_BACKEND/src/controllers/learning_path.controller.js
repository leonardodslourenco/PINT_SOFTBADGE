const LearningPath = require('../models/learning_path.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const sequelize = require('../config/database');
const { gerarUUIDv7 } = require('../services/geradores');
const validaIDInteiro = require('../services/valida_id_inteiro');
const { processarTraducao, tratarPayloadTraducao } = require('../services/tradutor_helper');
const { emitGlobal } = require('../services/websocket.service');

const controllersLearningPath = {};

//Caminho /learning_path
controllersLearningPath.createLearningPath = async (req, res) => {

  const transaction = await sequelize.transaction();

  try {
    const lang = req.lang;

    const { titulo, descricao, cor, visibilidade, suspenso } = req.body;
    if (!titulo || (typeof titulo !== 'string' && typeof titulo !== 'object') ||
        !descricao || (typeof descricao !== 'string' && typeof descricao !== 'object')) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Os campos 'titulo' e 'descricao' são obrigatórios.",
        data: null
      });
    }

    const idTraducaoTitulo = gerarUUIDv7();
    const idTraducaoDescricao = gerarUUIDv7();

    let tituloTraduzido, descricaoTraduzida;
    try {
      tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
      descricaoTraduzida = await tratarPayloadTraducao(descricao, lang);
    } catch (transError) {
      await transaction.rollback();
      console.error("Falha na tradução automática no createLearningPath:", transError.message);
      return res.status(422).json({
        success: false,
        code: "TRANSLATION_API_FAILED",
        message: "O serviço de tradução automática está temporariamente indisponível.",
        originalData: {
          titulo: typeof titulo === 'string' ? titulo : (titulo[lang] || titulo.pt || ""),
          descricao: typeof descricao === 'string' ? descricao : (descricao[lang] || descricao.pt || "")
        },
        lang
      });
    }

    // Tradução do TÍTULO
    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducaoTitulo,
      tabela: 'learning_path',
      coluna: 'learning_path',
      pt: tituloTraduzido.pt,
      en: tituloTraduzido.en,
      es: tituloTraduzido.es
    }, { transaction });

    // Tradução da DESCRIÇÃO
    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducaoDescricao,
      tabela: 'learning_path',
      coluna: 'descricao_lp',
      pt: descricaoTraduzida.pt,
      en: descricaoTraduzida.en,
      es: descricaoTraduzida.es
    }, { transaction });

    const payload = {
      id_traducao_learning_path: idTraducaoTitulo,
      id_traducao_descricao_lp: idTraducaoDescricao,
      cor: cor || null
    };

    if (visibilidade !== undefined) payload.visibilidade = visibilidade;
    if (suspenso !== undefined) payload.suspenso = suspenso;

    const novoLearningPath = await LearningPath.create(payload, { transaction });

    const learningPathCompleto = await LearningPath.findByPk(
      novoLearningPath.id_learning_path,
      {
        include: [
          {
            association: 'traducao_learning_path',
            attributes: [lang]
          },
          {
            association: 'traducao_descricao_lp',
            attributes: [lang]
          }
        ],
        transaction
      }
    );

    await transaction.commit();

    // mapear resposta
    const resultado = {
      id_learning_path: learningPathCompleto.id_learning_path,
      learning_path: learningPathCompleto.traducao_learning_path?.[lang] || null,
      descricao: learningPathCompleto.traducao_descricao_lp?.[lang] || null,
      cor: learningPathCompleto.cor,
      visibilidade: learningPathCompleto.visibilidade,
      suspenso: learningPathCompleto.suspenso,
      lpAtivo: learningPathCompleto.lpAtivo
    };

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'create', entity: 'learning_path', id: learningPathCompleto.id_learning_path });
    emitGlobal('learning_path_updated', { type: 'create', id: learningPathCompleto.id_learning_path });

    res.status(200).json({
      success: true,
      message: "Learning Path criado com sucesso",
      data: resultado
    });

  } catch (error) {

    await transaction.rollback();
    console.error("ERRO DETALHADO NO BACKEND - createLearningPath:", error);

    res.status(500).json({
      success: false,
      message: "Erro ao criar Learning Path",
      error: error.message
    });
  }
};

//Caminho /learning_path
controllersLearningPath.listLearningPath = async (req, res) => {

  try {

    const lang = req.lang;
    const ativo = req.query.ativo;

    const where = {};

    if (ativo !== undefined) {
      where.lpAtivo = ativo === 'true' || ativo === '1';
    }

    const learningPaths = await LearningPath.findAll({
      where,
      include: [
        {
          association: 'traducao_learning_path',
          attributes: [lang]
        },
        {
          association: 'traducao_descricao_lp',
          attributes: [lang]
        }
      ],

      order: [['id_learning_path', 'ASC']]

    });

    const resultado = learningPaths.map(lp => ({
      id_learning_path: lp.id_learning_path,
      learning_path: lp.traducao_learning_path
        ? lp.traducao_learning_path[lang]
        : null,
      descricao_lp: lp.traducao_descricao_lp
        ? lp.traducao_descricao_lp[lang]
        : null,
      cor: lp.cor,
      visibilidade: lp.visibilidade,
      suspenso: lp.suspenso,
      lpAtivo: lp.lpAtivo
    }));

    res.status(200).json({
      success: true,
      message: "Learning Paths recuperados com sucesso",
      data: resultado
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Erro ao listar Learning Paths",
      data: null
    });
  }

};

//Caminho /learning_path/:id
controllersLearningPath.detailLearningPath = async (req, res) => {

  const id_learning_path = validaIDInteiro(req.params.id);

  if (!id_learning_path) {
    return res.status(400).json({
      success: false,
      message: "ID inválido",
      data: null
    });
  }


  try {

    const lang = req.lang;

    const learningPath = await LearningPath.findOne({

      where: { id_learning_path },

      include: [
        {
          association: 'traducao_learning_path',
          attributes: [lang]
        },
        {
          association: 'traducao_descricao_lp',
          attributes: [lang]
        }
      ]

    });

    if (!learningPath) {

      return res.status(404).json({
        success: false,
        message: "Learning Path não encontrado",
        data: null
      });

    }

    const resultado = {
      id_learning_path: learningPath.id_learning_path,
      learning_path: learningPath.traducao_learning_path?.[lang] || null,
      descricao: learningPath.traducao_descricao_lp?.[lang] || null,
      cor: learningPath.cor,
      visibilidade: learningPath.visibilidade,
      suspenso: learningPath.suspenso,
      lpAtivo: learningPath.lpAtivo
    };

    res.status(200).json({
      success: true,
      message: "Learning Path recuperado com sucesso",
      data: resultado
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Erro ao recuperar Learning Path",
      data: null
    });

  }

};

//Caminho /learning_path/:id
controllersLearningPath.updateLearningPath = async (req, res) => {

  const transaction = await sequelize.transaction();

  try {
    const lang = req.lang;
    const id_learning_path = validaIDInteiro(req.params.id);
    if (!id_learning_path) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
        data: null
      });
    }

    const learningPath = await LearningPath.findByPk(id_learning_path);
    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: "Learning Path não encontrado"
      });

    }

    //Bloquear a edição das traduções se estiver inativo
    if (!learningPath.lpAtivo) {
      return res.status(400).json({
        success: false,
        message: "Não é possível editar um Learning Path inativo",
        data: null
      });
    }

    const { titulo, descricao, cor, visibilidade, suspenso } = req.body;
    
    const updates = {};
    if (cor !== undefined) updates.cor = cor || null;
    if (visibilidade !== undefined) updates.visibilidade = visibilidade;
    if (suspenso !== undefined) updates.suspenso = suspenso;
    
    if (Object.keys(updates).length > 0) {
      await learningPath.update(updates, { transaction });
    }
    
    try {
      if (titulo && (typeof titulo === 'string' || typeof titulo === 'object')) {
        const tituloTraduzido = await tratarPayloadTraducao(titulo, lang);
        await TraducaoConteudo.update({
          pt: tituloTraduzido.pt,
          en: tituloTraduzido.en,
          es: tituloTraduzido.es
        }, {
          where: {
            id_traducao_conteudo: learningPath.id_traducao_learning_path
          },
          transaction
        });
      }

      if (descricao && (typeof descricao === 'string' || typeof descricao === 'object')) {
        const descricaoTraduzida = await tratarPayloadTraducao(descricao, lang);
        await TraducaoConteudo.update({
          pt: descricaoTraduzida.pt,
          en: descricaoTraduzida.en,
          es: descricaoTraduzida.es
        }, {
          where: {
            id_traducao_conteudo: learningPath.id_traducao_descricao_lp
          },
          transaction
        });
      }
    } catch (transError) {
      await transaction.rollback();
      console.error("Falha na tradução automática no updateLearningPath:", transError.message);
      return res.status(422).json({
        success: false,
        code: "TRANSLATION_API_FAILED",
        message: "O serviço de tradução automática está temporariamente indisponível.",
        originalData: {
          titulo: typeof titulo === 'string' ? titulo : (titulo ? (titulo[lang] || titulo.pt || "") : ""),
          descricao: typeof descricao === 'string' ? descricao : (descricao ? (descricao[lang] || descricao.pt || "") : "")
        },
        lang
      });
    }

    await transaction.commit();

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'update', entity: 'learning_path', id: id_learning_path });
    emitGlobal('learning_path_updated', { type: 'update', id: id_learning_path });

    res.status(200).json({
      success: true,
      message: "Learning Path atualizado"
    });

  } catch (error) {

    await transaction.rollback();
    console.error("ERRO DETALHADO NO BACKEND - updateLearningPath:", error);

    res.status(500).json({
      success: false,
      message: "Erro ao atualizar Learning Path",
      error: error.message
    });

  }

};

controllersLearningPath.updateStatusLearningPath = async (req, res) => {

  try {

    const id_learning_path = validaIDInteiro(req.params.id);
    if (!id_learning_path) {
      return res.status(400).json({
        success: false,
        message: "ID inválido"
      });
    }

    const { lpAtivo } = req.body;

    if (typeof lpAtivo !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "Campo lpAtivo deve ser boolean"
      });
    }

    const learningPath = await LearningPath.findByPk(id_learning_path);

    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: "Learning Path não encontrado"
      });
    }

    await learningPath.update({ lpAtivo });

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'status', entity: 'learning_path', id: id_learning_path, active: lpAtivo });
    emitGlobal('learning_path_updated', { type: 'status', id: id_learning_path, active: lpAtivo });

    res.status(200).json({
      success: true,
      message: `Learning Path ${lpAtivo ? 'ativado' : 'inativado'} com sucesso`
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Erro ao atualizar estado",
      error: error.message
    });

  }

};

//Caminho /learning_path/:id
controllersLearningPath.deleteLearningPath = async (req, res) => {

  const transaction = await sequelize.transaction();

  try {

    const id_learning_path = validaIDInteiro(req.params.id);
    if (!id_learning_path) {
      return res.status(400).json({
        success: false,
        message: "ID inválido",
        data: null
      });
    }

    const learningPath = await LearningPath.findByPk(id_learning_path);
    if (!learningPath) {
      return res.status(404).json({
        success: false,
        message: "Learning Path não encontrado"
      });
    }
    //Não vai eliminar da base de dados, vai marcar como inativo
    //await learningPath.destroy({ transaction });

    /*await TraducaoConteudo.destroy({
      where: {
        id_traducao_conteudo: [
          learningPath.id_traducao_learning_path,
          learningPath.id_traducao_descricao_lp
        ]
      },
      transaction
    });*/
    await learningPath.update(
      { lpAtivo: false },
      { transaction }
    );

    await transaction.commit();

    // Emissão de evento em tempo real via WebSockets
    emitGlobal('gestao_area', { type: 'delete', entity: 'learning_path', id: id_learning_path });
    emitGlobal('learning_path_updated', { type: 'delete', id: id_learning_path });

    res.status(200).json({
      success: true,
      message: "Learning Path desativado sem eliminar da base de dados"
    });

  } catch (error) {

    await transaction.rollback();

    res.status(500).json({
      success: false,
      message: "Erro ao apagar/desativar Learning Path",
      error: error.message
    });
  }

};

module.exports = controllersLearningPath;