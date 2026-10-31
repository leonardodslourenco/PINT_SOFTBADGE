const PoliticaRGPD = require('../models/politica_rgpd.model');
const { tratarPayloadTraducao } = require('../services/tradutor_helper');
const { emitGlobal } = require('../services/websocket.service');
const { criarENotificar } = require('../services/notificacao.service');
const Utilizador = require('../models/utilizador.model');
const Perfil = require('../models/perfil.model');

const controllersPoliticaRGPD = {};

// Helper para obter o ID do utilizador autenticado a partir do token
function getUtilizadorAutenticado(req) {
  return req.auth?.sub || req.auth?.id_utilizador || null;
}

/**
 * GET /politica_rgpd
 * Obtém os textos da política RGPD (Geral e Candidatura em PT, EN, ES + versões localizadas).
 * Acesso: Qualquer utilizador autenticado (Consultor, SLL, TM, Admin).
 */
controllersPoliticaRGPD.getPolitica = async (req, res) => {
  try {
    const politica = await PoliticaRGPD.findByPk(1);

    if (!politica) {
      return res.status(404).json({ success: false, message: 'Política de RGPD não configurada.' });
    }

    const lang = (req.lang || 'pt').toLowerCase().trim().slice(0, 2);
    const geral_localizado = politica[`geral_${lang}`] || politica.geral_pt;
    const candidatura_localizado = politica[`candidatura_${lang}`] || politica.candidatura_pt;

    return res.status(200).json({
      success: true,
      message: 'Política de RGPD recuperada com sucesso.',
      data: {
        id_politica: politica.id_politica,
        geral_pt: politica.geral_pt,
        geral_en: politica.geral_en,
        geral_es: politica.geral_es,
        candidatura_pt: politica.candidatura_pt,
        candidatura_en: politica.candidatura_en,
        candidatura_es: politica.candidatura_es,
        geral_localizado,
        candidatura_localizado
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao recuperar política de RGPD.', error: error.message });
  }
};

/**
 * PUT /politica_rgpd
 * Atualiza o texto da política de RGPD (Geral, Candidatura ou Ambos).
 * Se a política Geral for alterada, revoga o consentimento (aceitou_rgpd = false) de todos os utilizadores
 * e notifica todos em tempo real.
 * Acesso: Apenas Admin.
 */
controllersPoliticaRGPD.updatePolitica = async (req, res) => {
  try {
    const { tipo, texto_geral, texto_candidatura, texto, geral, candidatura } = req.body;

    const payloadGeral = texto_geral || geral || (tipo === 'geral' ? texto : (!tipo && !texto_candidatura && !candidatura ? texto : null));
    const payloadCandidatura = texto_candidatura || candidatura || (tipo === 'candidatura' ? texto : null);

    if (!payloadGeral && !payloadCandidatura) {
      return res.status(400).json({
        success: false,
        message: 'É necessário fornecer texto para pelo menos um dos âmbitos ("geral" ou "candidatura").'
      });
    }

    const adminId = getUtilizadorAutenticado(req);

    // Obter ou criar a política
    let politica = await PoliticaRGPD.findByPk(1);
    if (!politica) {
      politica = await PoliticaRGPD.create({
        id_politica: 1,
        geral_pt: 'Termos Gerais de RGPD.',
        geral_en: 'General GDPR Terms.',
        geral_es: 'Términos Generales de RGPD.',
        candidatura_pt: 'Termos de RGPD de Candidatura.',
        candidatura_en: 'Application GDPR Terms.',
        candidatura_es: 'Términos de RGPD de Candidatura.'
      });
    }

    const updates = {};
    let geralModificado = false;

    // 1. Processar atualização do RGPD Geral se fornecido
    if (payloadGeral) {
      try {
        const transGeral = await tratarPayloadTraducao(payloadGeral, req.lang);
        updates.geral_pt = transGeral.pt;
        updates.geral_en = transGeral.en;
        updates.geral_es = transGeral.es;
        geralModificado = true;
      } catch (errGeral) {
        console.error("Falha na tradução da política geral:", errGeral.message);
        return res.status(422).json({
          success: false,
          code: "TRANSLATION_API_FAILED",
          message: "O serviço de tradução automática está indisponível para o texto geral."
        });
      }
    }

    // 2. Processar atualização do RGPD de Candidatura se fornecido
    if (payloadCandidatura) {
      try {
        const transCand = await tratarPayloadTraducao(payloadCandidatura, req.lang);
        updates.candidatura_pt = transCand.pt;
        updates.candidatura_en = transCand.en;
        updates.candidatura_es = transCand.es;
      } catch (errCand) {
        console.error("Falha na tradução da política de candidatura:", errCand.message);
        return res.status(422).json({
          success: false,
          code: "TRANSLATION_API_FAILED",
          message: "O serviço de tradução automática está indisponível para o texto de candidatura."
        });
      }
    }

    // Grava as alterações na base de dados
    await politica.update(updates);

    // 3. Regra de Negócio: Se a política Geral foi alterada, revoga o consentimento de todos os utilizadores
    if (geralModificado) {
      await Utilizador.update({ aceitou_rgpd: false }, { where: {} });
      console.log('[RGPD] Termos gerais atualizados: aceitou_rgpd reposto a false para todos os utilizadores.');

      // Obter todos os utilizadores para notificação
      const todosUtilizadores = await Utilizador.findAll({
        attributes: ['id_utilizador']
      });

      for (const u of todosUtilizadores) {
        await criarENotificar({
          id_user_notificador: adminId,
          id_user_alvo_notificacao: u.id_utilizador,
          codigo_tipo: 'sistema_alerta',
          titulo: {
            pt: "Atualização dos Termos Gerais de RGPD",
            en: "General GDPR Terms Update",
            es: "Actualización de Términos Generales de RGPD"
          },
          mensagem: {
            pt: "Os Termos Gerais de RGPD foram atualizados pelo Administrador. Por favor, consulte e aceite os novos termos para continuar.",
            en: "General GDPR Terms have been updated by the Administrator. Please review and accept the new terms to proceed.",
            es: "Los Términos Generales de RGPD han sido actualizados por el Administrador. Por favor, consulte y acepte los nuevos términos."
          }
        });
      }

      // Notificar todos os clientes conectados via WebSocket para forçar a revalidação/exibição do modal
      emitGlobal('rgpd_revogado_global', {
        message: 'Os Termos Gerais de RGPD foram alterados. Todos os utilizadores devem revalidar o consentimento.',
        data: {
          geral_pt: politica.geral_pt,
          geral_en: politica.geral_en,
          geral_es: politica.geral_es
        }
      });
    }

    // Notificação global de atualização de política
    emitGlobal('politica_rgpd_alterada', {
      message: 'A Política de RGPD foi atualizada.',
      data: {
        geral_pt: politica.geral_pt,
        geral_en: politica.geral_en,
        geral_es: politica.geral_es,
        candidatura_pt: politica.candidatura_pt,
        candidatura_en: politica.candidatura_en,
        candidatura_es: politica.candidatura_es
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Política de RGPD atualizada com sucesso e utilizadores notificados.',
      data: politica
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao atualizar política de RGPD.', error: error.message });
  }
};

module.exports = controllersPoliticaRGPD;
