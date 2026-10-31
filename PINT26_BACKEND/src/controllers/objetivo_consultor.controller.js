// =========================================================================
// CONTROLADOR DO SUBSISTEMA DE OBJETIVOS (CONSULTANT OBJECTIVES CONTROLLER)
// Acesso exclusivo ao Consultor (Perfil 4) com token válido
// =========================================================================

const { Op } = require('sequelize');
const ObjetivoConsultor = require('../models/objetivo_consultor.model');
const TipoObjetivo = require('../models/tipo_objetivo.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const LearningPath = require('../models/learning_path.model');
const { avaliarObjetivo, descreverMetaObjetivo } = require('../services/objetivo.service');

const controllerObjetivoConsultor = {};

/**
 * GET /objetivo_consultor/tipos
 * Lista todos os 5 tipos de objetivos disponíveis (apenas ativos)
 */
controllerObjetivoConsultor.listarTipos = async (req, res) => {
  try {
    const tipos = await TipoObjetivo.findAll({
      where: { ativo: true },
      include: [
        { model: TraducaoConteudo, as: 'traducao_titulo' },
        { model: TraducaoConteudo, as: 'traducao_descricao' }
      ],
      order: [['createdAt', 'ASC']]
    });

    // Obter também o número atual de Learning Paths para auxiliar o frontend nos limites
    const totalLearningPaths = await LearningPath.count({ where: { lpAtivo: true } });

    return res.status(200).json({
      success: true,
      data: tipos,
      meta: {
        total_learning_paths: totalLearningPaths
      }
    });
  } catch (error) {
    console.error('[ObjetivoController.listarTipos] Erro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar os tipos de objetivos.',
      error: error.message
    });
  }
};

/**
 * POST /objetivo_consultor/
 * Cria um novo objetivo pessoal para o Consultor autenticado
 */
controllerObjetivoConsultor.criarObjetivo = async (req, res) => {
  try {
    const idUtilizador = req.auth?.sub || req.auth?.id_utilizador;
    if (!idUtilizador) {
      return res.status(401).json({ success: false, message: 'Utilizador não identificado.' });
    }

    // 1. Verificar limite máximo de 5 objetivos ativos em simultâneo
    const objetivosAtivosCount = await ObjetivoConsultor.count({
      where: {
        id_utilizador: idUtilizador,
        objetivoAtivo: true,
        objetivo_cumprido: false,
        objetivo_expirado: false
      }
    });

    if (objetivosAtivosCount >= 5) {
      return res.status(400).json({
        success: false,
        message: 'Atingiu o limite máximo de 5 objetivos ativos em simultâneo. Conclua ou cancele um objetivo existente para criar um novo.'
      });
    }

    const {
      id_tipo_objetivo,
      quantidade_badges,
      quantidade_pontos,
      tipo_diversidade,
      quantidade_diversidade,
      prazo_valor,
      unidade_prazo
    } = req.body;

    if (!id_tipo_objetivo) {
      return res.status(400).json({ success: false, message: 'O tipo de objetivo é obrigatório.' });
    }

    // 2. Carregar e validar o tipo de objetivo
    const tipo = await TipoObjetivo.findOne({
      where: { id_tipo_objetivo, ativo: true },
      include: [
        { model: TraducaoConteudo, as: 'traducao_titulo' },
        { model: TraducaoConteudo, as: 'traducao_descricao' }
      ]
    });

    if (!tipo) {
      return res.status(404).json({ success: false, message: 'Tipo de objetivo não encontrado ou inativo.' });
    }

    // 3. Verificar duplicação: Não permitir 2 objetivos ATIVOS do mesmo tipo
    // (Pode criar do mesmo tipo se os anteriores estiverem cumpridos, expirados ou cancelados)
    const objetivoAtivoMesmoTipo = await ObjetivoConsultor.findOne({
      where: {
        id_utilizador: idUtilizador,
        id_tipo_objetivo: tipo.id_tipo_objetivo,
        objetivoAtivo: true,
        objetivo_cumprido: false,
        objetivo_expirado: false
      }
    });

    if (objetivoAtivoMesmoTipo) {
      return res.status(400).json({
        success: false,
        message: 'Já possui um objetivo ativo deste mesmo tipo. Conclua, cancele ou aguarde que o anterior expire antes de criar outro deste tipo.'
      });
    }

    // 4. Validação detalhada por tipo de objetivo
    const codigo = tipo.codigo_tipo;
    const payloadNovo = {
      id_utilizador: idUtilizador,
      id_tipo_objetivo: tipo.id_tipo_objetivo,
      data_inicio_objetivo: new Date(),
      objetivo_cumprido: false,
      objetivo_expirado: false,
      consultor_notificado: false,
      quantidade_notificacao: 0,
      objetivoAtivo: true
    };

    const validarPrazo = (valor, unidade, minDias = 7, maxDias = 90, minSemanas = 1, maxSemanas = 12, minMeses = 1, maxMeses = 12) => {
      const v = parseInt(valor, 10);
      if (isNaN(v)) return 'O valor do prazo deve ser um número inteiro válido.';

      if (unidade === 'dias') {
        if (v < minDias || v > maxDias) return `Para a unidade dias, o prazo deve estar entre ${minDias} e ${maxDias} dias.`;
      } else if (unidade === 'semanas') {
        if (v < minSemanas || v > maxSemanas) return `Para a unidade semanas, o prazo deve estar entre ${minSemanas} e ${maxSemanas} semanas.`;
      } else if (unidade === 'meses') {
        if (v < minMeses || v > maxMeses) return `Para a unidade meses, o prazo deve estar entre ${minMeses} e ${maxMeses} meses.`;
      } else {
        return 'A unidade de prazo deve ser: dias, semanas ou meses.';
      }
      return null;
    };

    const calcularDataLimite = (dataInicio, valor, unidade) => {
      const v = parseInt(valor, 10);
      const dataLimite = new Date(dataInicio);
      if (unidade === 'dias') {
        dataLimite.setDate(dataLimite.getDate() + v);
      } else if (unidade === 'semanas') {
        dataLimite.setDate(dataLimite.getDate() + (v * 7));
      } else if (unidade === 'meses') {
        dataLimite.setMonth(dataLimite.getMonth() + v);
      }
      return dataLimite;
    };

    switch (codigo) {
      case 'BADGES_NORMAL_TEMPO': {
        const qb = parseInt(quantidade_badges, 10);
        if (isNaN(qb) || qb < 3 || qb > 5) {
          return res.status(400).json({ success: false, message: 'A quantidade de badges normais deve ser entre 3 e 5.' });
        }
        const erroPrazo = validarPrazo(prazo_valor, unidade_prazo, 7, 90, 1, 12, 1, 12);
        if (erroPrazo) {
          return res.status(400).json({ success: false, message: erroPrazo });
        }

        payloadNovo.quantidade_badges = qb;
        payloadNovo.prazo_valor = parseInt(prazo_valor, 10);
        payloadNovo.unidade_prazo = unidade_prazo;
        payloadNovo.data_limite_objetivo = calcularDataLimite(payloadNovo.data_inicio_objetivo, prazo_valor, unidade_prazo);
        break;
      }

      case 'BADGES_NORMAL_DIVERSIDADE': {
        const qb = parseInt(quantidade_badges, 10);
        if (isNaN(qb) || qb < 3 || qb > 5) {
          return res.status(400).json({ success: false, message: 'A quantidade de badges normais deve ser entre 3 e 5.' });
        }

        const tiposDivValidos = ['area', 'service_line', 'learning_path'];
        if (!tiposDivValidos.includes(tipo_diversidade)) {
          return res.status(400).json({ success: false, message: 'O tipo de diversidade deve ser: area, service_line ou learning_path.' });
        }

        const qd = parseInt(quantidade_diversidade, 10);
        if (isNaN(qd)) {
          return res.status(400).json({ success: false, message: 'A quantidade de entidades distintas é obrigatória.' });
        }

        if (tipo_diversidade === 'area' && (qd < 2 || qd > 5)) {
          return res.status(400).json({ success: false, message: 'Para diversidade de Área, a quantidade deve ser entre 2 e 5.' });
        } else if (tipo_diversidade === 'service_line' && (qd < 2 || qd > 5)) {
          return res.status(400).json({ success: false, message: 'Para diversidade de Service Line, a quantidade deve ser entre 2 e 5.' });
        } else if (tipo_diversidade === 'learning_path') {
          const totalLPs = await LearningPath.count({ where: { lpAtivo: true } });
          const maxLP = Math.max(totalLPs, 1);
          if (qd < 1 || qd > maxLP) {
            return res.status(400).json({ success: false, message: `Para diversidade de Learning Path, a quantidade deve ser entre 1 e ${maxLP}.` });
          }
        }

        payloadNovo.quantidade_badges = qb;
        payloadNovo.tipo_diversidade = tipo_diversidade;
        payloadNovo.quantidade_diversidade = qd;
        payloadNovo.prazo_valor = null;
        payloadNovo.unidade_prazo = null;
        payloadNovo.data_limite_objetivo = null;
        break;
      }

      case 'PONTOS_NORMAL_TEMPO': {
        const qp = parseInt(quantidade_pontos, 10);
        if (isNaN(qp) || qp < 100 || qp > 2000) {
          return res.status(400).json({ success: false, message: 'A quantidade de pontos de badges normais deve ser entre 100 e 2000.' });
        }
        const erroPrazo = validarPrazo(prazo_valor, unidade_prazo, 7, 90, 2, 12, 2, 12);
        if (erroPrazo) {
          return res.status(400).json({ success: false, message: erroPrazo });
        }

        payloadNovo.quantidade_pontos = qp;
        payloadNovo.prazo_valor = parseInt(prazo_valor, 10);
        payloadNovo.unidade_prazo = unidade_prazo;
        payloadNovo.data_limite_objetivo = calcularDataLimite(payloadNovo.data_inicio_objetivo, prazo_valor, unidade_prazo);
        break;
      }

      case 'BADGES_ESPECIAL_TEMPO': {
        const qb = parseInt(quantidade_badges, 10);
        if (isNaN(qb) || qb < 3 || qb > 5) {
          return res.status(400).json({ success: false, message: 'A quantidade de badges especiais deve ser entre 3 e 5.' });
        }
        const erroPrazo = validarPrazo(prazo_valor, unidade_prazo, 7, 90, 1, 12, 1, 12);
        if (erroPrazo) {
          return res.status(400).json({ success: false, message: erroPrazo });
        }

        payloadNovo.quantidade_badges = qb;
        payloadNovo.prazo_valor = parseInt(prazo_valor, 10);
        payloadNovo.unidade_prazo = unidade_prazo;
        payloadNovo.data_limite_objetivo = calcularDataLimite(payloadNovo.data_inicio_objetivo, prazo_valor, unidade_prazo);
        break;
      }

      case 'PONTOS_ESPECIAL_TEMPO': {
        const qp = parseInt(quantidade_pontos, 10);
        if (isNaN(qp) || qp < 100 || qp > 2000) {
          return res.status(400).json({ success: false, message: 'A quantidade de pontos de badges especiais deve ser entre 100 e 2000.' });
        }
        const erroPrazo = validarPrazo(prazo_valor, unidade_prazo, 7, 90, 2, 12, 2, 12);
        if (erroPrazo) {
          return res.status(400).json({ success: false, message: erroPrazo });
        }

        payloadNovo.quantidade_pontos = qp;
        payloadNovo.prazo_valor = parseInt(prazo_valor, 10);
        payloadNovo.unidade_prazo = unidade_prazo;
        payloadNovo.data_limite_objetivo = calcularDataLimite(payloadNovo.data_inicio_objetivo, prazo_valor, unidade_prazo);
        break;
      }

      default:
        return res.status(400).json({ success: false, message: 'Tipo de objetivo desconhecido.' });
    }

    // 5. Criar registo na base de dados
    const novoObjetivo = await ObjetivoConsultor.create(payloadNovo);

    // Carregar com tipo e traduções para resposta completa
    const objetivoCriado = await ObjetivoConsultor.findByPk(novoObjetivo.id_objetivo, {
      include: [
        {
          model: TipoObjetivo,
          as: 'tipo_objetivo',
          include: [
            { model: TraducaoConteudo, as: 'traducao_titulo' },
            { model: TraducaoConteudo, as: 'traducao_descricao' }
          ]
        }
      ]
    });

    return res.status(201).json({
      success: true,
      message: 'Objetivo pessoal criado com sucesso!',
      data: objetivoCriado
    });
  } catch (error) {
    console.error('[ObjetivoController.criarObjetivo] Erro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao criar objetivo pessoal.',
      error: error.message
    });
  }
};

/**
 * GET /objetivo_consultor/meus
 * Lista todos os objetivos do consultor autenticado com cálculo de progresso em tempo real
 * Suporta filtro por query: ?status=ativos|cumpridos|expirados|cancelados|todos (default: todos)
 */
controllerObjetivoConsultor.listarMeusObjetivos = async (req, res) => {
  try {
    const idUtilizador = req.auth?.sub || req.auth?.id_utilizador;
    if (!idUtilizador) {
      return res.status(401).json({ success: false, message: 'Utilizador não identificado.' });
    }

    const { status = 'todos' } = req.query;

    const whereCond = { id_utilizador: idUtilizador };

    if (status === 'ativos') {
      whereCond.objetivoAtivo = true;
      whereCond.objetivo_cumprido = false;
      whereCond.objetivo_expirado = false;
    } else if (status === 'cumpridos') {
      whereCond.objetivoAtivo = true;
      whereCond.objetivo_cumprido = true;
    } else if (status === 'expirados') {
      whereCond.objetivoAtivo = true;
      whereCond.objetivo_expirado = true;
      whereCond.objetivo_cumprido = false;
    } else if (status === 'cancelados') {
      whereCond.objetivoAtivo = false;
    }

    const objetivos = await ObjetivoConsultor.findAll({
      where: whereCond,
      include: [
        {
          model: TipoObjetivo,
          as: 'tipo_objetivo',
          include: [
            { model: TraducaoConteudo, as: 'traducao_titulo' },
            { model: TraducaoConteudo, as: 'traducao_descricao' }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Calcular o progresso atual de cada objetivo em tempo real
    const resultados = await Promise.all(
      objetivos.map(async (obj) => {
        const objJson = obj.toJSON();
        const avaliacao = await avaliarObjetivo(obj);
        objJson.progresso = {
          atingiu: avaliacao.atingiu,
          progresso_atual: avaliacao.progressoAtual,
          meta_total: avaliacao.metaTotal,
          descricao_meta: descreverMetaObjetivo(obj, 'pt')
        };
        return objJson;
      })
    );

    return res.status(200).json({
      success: true,
      data: resultados,
      total: resultados.length
    });
  } catch (error) {
    console.error('[ObjetivoController.listarMeusObjetivos] Erro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao listar os seus objetivos.',
      error: error.message
    });
  }
};

/**
 * GET /objetivo_consultor/:id
 * Detalhes de um objetivo específico do consultor com progresso em tempo real
 */
controllerObjetivoConsultor.obterObjetivo = async (req, res) => {
  try {
    const idUtilizador = req.auth?.sub || req.auth?.id_utilizador;
    const { id } = req.params;

    const objetivo = await ObjetivoConsultor.findOne({
      where: {
        id_objetivo: id,
        id_utilizador: idUtilizador
      },
      include: [
        {
          model: TipoObjetivo,
          as: 'tipo_objetivo',
          include: [
            { model: TraducaoConteudo, as: 'traducao_titulo' },
            { model: TraducaoConteudo, as: 'traducao_descricao' }
          ]
        }
      ]
    });

    if (!objetivo) {
      return res.status(404).json({
        success: false,
        message: 'Objetivo não encontrado.'
      });
    }

    const objJson = objetivo.toJSON();
    const avaliacao = await avaliarObjetivo(objetivo);
    objJson.progresso = {
      atingiu: avaliacao.atingiu,
      progresso_atual: avaliacao.progressoAtual,
      meta_total: avaliacao.metaTotal,
      descricao_meta: descreverMetaObjetivo(objetivo, 'pt')
    };

    return res.status(200).json({
      success: true,
      data: objJson
    });
  } catch (error) {
    console.error('[ObjetivoController.obterObjetivo] Erro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao obter detalhes do objetivo.',
      error: error.message
    });
  }
};

/**
 * DELETE /objetivo_consultor/:id
 * Cancela (soft-delete) um objetivo ativo que ainda não foi cumprido
 */
controllerObjetivoConsultor.cancelarObjetivo = async (req, res) => {
  try {
    const idUtilizador = req.auth?.sub || req.auth?.id_utilizador;
    const { id } = req.params;

    const objetivo = await ObjetivoConsultor.findOne({
      where: {
        id_objetivo: id,
        id_utilizador: idUtilizador
      }
    });

    if (!objetivo) {
      return res.status(404).json({
        success: false,
        message: 'Objetivo não encontrado.'
      });
    }

    if (objetivo.objetivo_cumprido) {
      return res.status(400).json({
        success: false,
        message: 'Não é possível cancelar um objetivo que já foi cumprido com sucesso.'
      });
    }

    if (!objetivo.objetivoAtivo) {
      return res.status(400).json({
        success: false,
        message: 'O objetivo já se encontra cancelado.'
      });
    }

    await objetivo.update({
      objetivoAtivo: false
    });

    return res.status(200).json({
      success: true,
      message: 'Objetivo cancelado com sucesso.'
    });
  } catch (error) {
    console.error('[ObjetivoController.cancelarObjetivo] Erro:', error);
    return res.status(500).json({
      success: false,
      message: 'Erro ao cancelar objetivo.',
      error: error.message
    });
  }
};

module.exports = controllerObjetivoConsultor;
