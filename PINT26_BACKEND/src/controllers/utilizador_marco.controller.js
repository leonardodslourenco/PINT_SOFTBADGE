// =========================================================================
// CONTROLADOR DE MARCOS E CELEBRAÇÕES DO UTILIZADOR
// =========================================================================
const UtilizadorMarco = require('../models/utilizador_marco.model');
const ConfiguracaoMarco = require('../models/configuracao_marco.model');
const TipoMarco = require('../models/tipo_marco.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const validaUUID = require('../services/valida_UUID');
const { emitGlobal } = require('../services/websocket.service');

const controllersUtilizadorMarco = {};

/**
 * GET /utilizador-marco/por-celebrar
 * Retorna marcos conquistados pelo utilizador autenticado que ainda não foram celebrados no frontend (celebrado = false)
 */
controllersUtilizadorMarco.getMarcosPorCelebrar = async (req, res) => {
  try {
    const idUtilizador = req.auth?.sub || req.auth?.id_utilizador;
    const lang = req.lang || 'pt';

    const conquistas = await UtilizadorMarco.findAll({
      where: {
        id_utilizador: idUtilizador,
        celebrado: false
      },
      include: [
        {
          model: ConfiguracaoMarco,
          as: 'marco',
          include: [
            {
              model: TipoMarco,
              as: 'tipo_marco',
              include: [
                { model: TraducaoConteudo, as: 'traducao_titulo' },
                { model: TraducaoConteudo, as: 'traducao_descricao' }
              ]
            },
            { model: TraducaoConteudo, as: 'traducao_nome' },
            { model: TraducaoConteudo, as: 'traducao_descricao' }
          ]
        }
      ],
      order: [['data_conquista_marco', 'ASC']]
    });

    const data = conquistas.map(item => ({
      id_marco: item.id_marco,
      data_conquista_marco: item.data_conquista_marco,
      celebrado: item.celebrado,
      nome: item.marco?.traducao_nome?.[lang] || item.marco?.traducao_nome?.pt || 'Novo Marco',
      descricao: item.marco?.traducao_descricao?.[lang] || item.marco?.traducao_descricao?.pt || '',
      codigo_tipo: item.marco?.tipo_marco?.codigo_tipo,
      tipo_nome: item.marco?.tipo_marco?.traducao_titulo?.[lang] || item.marco?.tipo_marco?.traducao_titulo?.pt || '',
      quantidade_objetivo: item.marco?.quantidade_objetivo
    }));

    return res.status(200).json({
      success: true,
      message: 'Marcos pendentes de celebração recuperados com sucesso.',
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter marcos por celebrar.',
      error: error.message
    });
  }
};

/**
 * PUT /utilizador-marco/:idMarco/celebrar
 * Marca um marco conquistado como celebrado (celebrado = true)
 */
controllersUtilizadorMarco.marcarComoCelebrado = async (req, res) => {
  try {
    const idUtilizador = req.auth?.sub || req.auth?.id_utilizador;
    const { idMarco } = req.params;

    if (!validaUUID(idMarco, 7)) {
      return res.status(400).json({ success: false, message: 'ID de marco inválido.' });
    }

    const conquista = await UtilizadorMarco.findOne({
      where: {
        id_utilizador: idUtilizador,
        id_marco: idMarco
      }
    });

    if (!conquista) {
      return res.status(404).json({
        success: false,
        message: 'Registo de conquista de marco não encontrado para este utilizador.'
      });
    }

    await conquista.update({ celebrado: true });

    return res.status(200).json({
      success: true,
      message: 'Marco marcado como celebrado com sucesso.',
      data: {
        id_marco: idMarco,
        celebrado: true
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao marcar celebração do marco.',
      error: error.message
    });
  }
};

/**
 * GET /utilizador-marco/meus-marcos
 * Retorna todos os marcos conquistados pelo utilizador autenticado
 */
controllersUtilizadorMarco.getMeusMarcos = async (req, res) => {
  try {
    const idUtilizador = req.auth?.sub || req.auth?.id_utilizador;
    const lang = req.lang || 'pt';

    const conquistas = await UtilizadorMarco.findAll({
      where: { id_utilizador: idUtilizador },
      include: [
        {
          model: ConfiguracaoMarco,
          as: 'marco',
          include: [
            {
              model: TipoMarco,
              as: 'tipo_marco',
              include: [
                { model: TraducaoConteudo, as: 'traducao_titulo' },
                { model: TraducaoConteudo, as: 'traducao_descricao' }
              ]
            },
            { model: TraducaoConteudo, as: 'traducao_nome' },
            { model: TraducaoConteudo, as: 'traducao_descricao' }
          ]
        }
      ],
      order: [['data_conquista_marco', 'DESC']]
    });

    const data = conquistas.map(item => ({
      id_marco: item.id_marco,
      data_conquista_marco: item.data_conquista_marco,
      celebrado: item.celebrado,
      nome: item.marco?.traducao_nome?.[lang] || item.marco?.traducao_nome?.pt || '',
      descricao: item.marco?.traducao_descricao?.[lang] || item.marco?.traducao_descricao?.pt || '',
      codigo_tipo: item.marco?.tipo_marco?.codigo_tipo,
      tipo_nome: item.marco?.tipo_marco?.traducao_titulo?.[lang] || item.marco?.tipo_marco?.traducao_titulo?.pt || '',
      quantidade_objetivo: item.marco?.quantidade_objetivo
    }));

    return res.status(200).json({
      success: true,
      message: 'Histórico de marcos conquistados recuperado com sucesso.',
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter histórico de marcos.',
      error: error.message
    });
  }
};

/**
 * GET /utilizador-marco/configuracoes ou /utilizador-marco/catalogo
 * Lista todos os marcos existentes no sistema (somente leitura para Consultores e outros perfis)
 * Retorna Tipo, Nome, Descrição, Quantidade Objetivo e se o utilizador já o conquistou.
 */
controllersUtilizadorMarco.listarConfiguracoes = async (req, res) => {
  try {
    const lang = req.lang || 'pt';
    const idUtilizador = req.auth?.sub || req.auth?.id_utilizador;

    const marcos = await ConfiguracaoMarco.findAll({
      where: { ativo: true },
      include: [
        {
          model: TipoMarco,
          as: 'tipo_marco',
          include: [
            { model: TraducaoConteudo, as: 'traducao_titulo' },
            { model: TraducaoConteudo, as: 'traducao_descricao' }
          ]
        },
        { model: TraducaoConteudo, as: 'traducao_nome' },
        { model: TraducaoConteudo, as: 'traducao_descricao' }
      ],
      order: [
        ['id_tipo_marco', 'ASC'],
        ['quantidade_objetivo', 'ASC']
      ]
    });

    // Se houver utilizador autenticado, carregar os marcos já conquistados por ele
    const marcosConquistadosMap = new Map();
    if (idUtilizador) {
      const conquistas = await UtilizadorMarco.findAll({
        where: { id_utilizador: idUtilizador }
      });
      conquistas.forEach(c => {
        marcosConquistadosMap.set(c.id_marco, c);
      });
    }

    const data = marcos.map(m => {
      const conquista = marcosConquistadosMap.get(m.id_marco);
      return {
        id_marco: m.id_marco,
        id_tipo_marco: m.id_tipo_marco,
        codigo_tipo: m.tipo_marco?.codigo_tipo,
        tipo_nome: m.tipo_marco?.traducao_titulo?.[lang] || m.tipo_marco?.traducao_titulo?.pt || '',
        tipo_descricao: m.tipo_marco?.traducao_descricao?.[lang] || m.tipo_marco?.traducao_descricao?.pt || '',
        nome: m.traducao_nome?.[lang] || m.traducao_nome?.pt || '',
        descricao: m.traducao_descricao?.[lang] || m.traducao_descricao?.pt || '',
        quantidade_objetivo: m.quantidade_objetivo,
        ativo: m.ativo,
        conquistado: !!conquista,
        data_conquista_marco: conquista ? conquista.data_conquista_marco : null,
        celebrado: conquista ? conquista.celebrado : false
      };
    });

    return res.status(200).json({
      success: true,
      message: 'Catálogo de marcos recuperado com sucesso.',
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar catálogo de marcos.',
      error: error.message
    });
  }
};

/**
 * GET /utilizador-marco/tipos
 * Lista todos os tipos de marcos disponíveis na plataforma
 */
controllersUtilizadorMarco.listarTipos = async (req, res) => {
  try {
    const lang = req.lang || 'pt';

    const tipos = await TipoMarco.findAll({
      where: { ativo: true },
      include: [
        { model: TraducaoConteudo, as: 'traducao_titulo' },
        { model: TraducaoConteudo, as: 'traducao_descricao' }
      ],
      order: [['codigo_tipo', 'ASC']]
    });

    const data = tipos.map(t => ({
      id_tipo_marco: t.id_tipo_marco,
      codigo_tipo: t.codigo_tipo,
      titulo: t.traducao_titulo?.[lang] || t.traducao_titulo?.pt || '',
      descricao: t.traducao_descricao?.[lang] || t.traducao_descricao?.pt || ''
    }));

    return res.status(200).json({
      success: true,
      message: 'Tipos de marcos recuperados com sucesso.',
      data
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar tipos de marcos.',
      error: error.message
    });
  }
};

/**
 * POST /utilizador-marco/configuracoes
 * Cria uma nova configuração de marco (Apenas ADMIN)
 */
controllersUtilizadorMarco.criarConfiguracao = async (req, res) => {
  const sequelize = require('../config/database');
  const { gerarUUIDv7 } = require('../services/geradores');
  const { tratarPayloadTraducao } = require('../services/tradutor_helper');
  const transaction = await sequelize.transaction();

  try {
    const { id_tipo_marco, nome, descricao, quantidade_objetivo } = req.body;
    const lang = req.lang || 'pt';

    // 1. Validação estrita do ID do tipo de marco
    if (!validaUUID(id_tipo_marco, 7)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'id_tipo_marco inválido (UUID v7 esperado).' });
    }

    const tipoExiste = await TipoMarco.findByPk(id_tipo_marco, { transaction });
    if (!tipoExiste) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Tipo de marco não encontrado.' });
    }

    // 2. Validação estrita da quantidade_objetivo (apenas inteiros de 1 a 100)
    if (quantidade_objetivo === undefined || quantidade_objetivo === null || quantidade_objetivo === '') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'O campo quantidade_objetivo é obrigatório.' });
    }

    const parsedQtd = Number(quantidade_objetivo);
    if (!Number.isInteger(parsedQtd) || isNaN(parsedQtd) || String(quantidade_objetivo).includes('.') || parsedQtd < 1 || parsedQtd > 100) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'A quantidade_objetivo deve ser um número inteiro compreendido entre 1 e 100.'
      });
    }

    // 3. Validação de nome e descrição
    if (!nome) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'O nome do marco é obrigatório.' });
    }

    const payloadNome = await tratarPayloadTraducao(nome, lang);
    const payloadDescricao = await tratarPayloadTraducao(descricao || nome, lang);

    // 4. Criação das traduções
    const idTraducaoNome = gerarUUIDv7();
    const idTraducaoDescricao = gerarUUIDv7();

    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducaoNome,
      tabela: 'configuracao_marco',
      coluna: 'nome_marco',
      pt: payloadNome.pt,
      en: payloadNome.en,
      es: payloadNome.es
    }, { transaction });

    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducaoDescricao,
      tabela: 'configuracao_marco',
      coluna: 'descricao_marco',
      pt: payloadDescricao.pt,
      en: payloadDescricao.en,
      es: payloadDescricao.es
    }, { transaction });

    // 5. Criação da configuração de marco
    const novoMarco = await ConfiguracaoMarco.create({
      id_marco: gerarUUIDv7(),
      id_tipo_marco,
      id_traducao_nome: idTraducaoNome,
      id_traducao_descricao: idTraducaoDescricao,
      quantidade_objetivo: parsedQtd,
      ativo: true
    }, { transaction });

    await transaction.commit();

    emitGlobal('marco_updated', { type: 'create', id_marco: novoMarco.id_marco });
    emitGlobal('novo_marco', { type: 'create', id_marco: novoMarco.id_marco });
    emitGlobal('marco_criado', { type: 'create', id_marco: novoMarco.id_marco });

    return res.status(201).json({
      success: true,
      message: 'Configuração de marco criada com sucesso.',
      data: {
        id_marco: novoMarco.id_marco,
        id_tipo_marco: novoMarco.id_tipo_marco,
        nome: payloadNome[lang] || payloadNome.pt,
        descricao: payloadDescricao[lang] || payloadDescricao.pt,
        quantidade_objetivo: novoMarco.quantidade_objetivo
      }
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar configuração de marco.',
      error: error.message
    });
  }
};

/**
 * PUT /utilizador-marco/configuracoes/:id
 * Atualiza uma configuração de marco (Apenas ADMIN)
 */
controllersUtilizadorMarco.atualizarConfiguracao = async (req, res) => {
  const sequelize = require('../config/database');
  const { tratarPayloadTraducao } = require('../services/tradutor_helper');
  const transaction = await sequelize.transaction();
  const { id } = req.params;

  try {
    if (!validaUUID(id, 7)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'ID de marco inválido.' });
    }

    const marco = await ConfiguracaoMarco.findByPk(id, { transaction });
    if (!marco) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Configuração de marco não encontrada.' });
    }

    const { nome, descricao, quantidade_objetivo, ativo } = req.body;
    const lang = req.lang || 'pt';

    // Validação estrita da quantidade_objetivo (caso seja fornecida)
    if (quantidade_objetivo !== undefined && quantidade_objetivo !== null) {
      const parsedQtd = Number(quantidade_objetivo);
      if (!Number.isInteger(parsedQtd) || isNaN(parsedQtd) || String(quantidade_objetivo).includes('.') || parsedQtd < 1 || parsedQtd > 100) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'A quantidade_objetivo deve ser um número inteiro compreendido entre 1 e 100.'
        });
      }
      marco.quantidade_objetivo = parsedQtd;
    }

    if (ativo !== undefined) {
      marco.ativo = Boolean(ativo);
    }

    // Atualização de traduções de nome
    if (nome) {
      const payloadNome = await tratarPayloadTraducao(nome, lang);
      await TraducaoConteudo.update(
        { pt: payloadNome.pt, en: payloadNome.en, es: payloadNome.es },
        { where: { id_traducao_conteudo: marco.id_traducao_nome }, transaction }
      );
    }

    // Atualização de traduções de descrição
    if (descricao) {
      const payloadDesc = await tratarPayloadTraducao(descricao, lang);
      await TraducaoConteudo.update(
        { pt: payloadDesc.pt, en: payloadDesc.en, es: payloadDesc.es },
        { where: { id_traducao_conteudo: marco.id_traducao_descricao }, transaction }
      );
    }

    await marco.save({ transaction });
    await transaction.commit();

    emitGlobal('marco_updated', { type: 'update', id_marco: id });
    emitGlobal('novo_marco', { type: 'update', id_marco: id });

    return res.status(200).json({
      success: true,
      message: 'Configuração de marco atualizada com sucesso.'
    });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: 'Erro ao atualizar configuração de marco.',
      error: error.message
    });
  }
};

/**
 * DELETE /utilizador-marco/configuracoes/:id
 * Inativa uma configuração de marco (Apenas ADMIN)
 */
controllersUtilizadorMarco.eliminarConfiguracao = async (req, res) => {
  try {
    const { id } = req.params;
    if (!validaUUID(id, 7)) {
      return res.status(400).json({ success: false, message: 'ID de marco inválido.' });
    }

    const marco = await ConfiguracaoMarco.findByPk(id);
    if (!marco) {
      return res.status(404).json({ success: false, message: 'Configuração de marco não encontrada.' });
    }

    await marco.update({ ativo: false });

    emitGlobal('marco_updated', { type: 'delete', id_marco: id });
    emitGlobal('novo_marco', { type: 'delete', id_marco: id });
    emitGlobal('marco_removido', { type: 'delete', id_marco: id });

    return res.status(200).json({
      success: true,
      message: 'Configuração de marco inativada com sucesso.'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro ao inativar configuração de marco.',
      error: error.message
    });
  }
};

module.exports = controllersUtilizadorMarco;

