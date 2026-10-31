/**
 * SERVIÇO AUXILIAR REUTILIZÁVEL PARA EMAILS DO CICLO DE VIDA DE CANDIDATURAS
 * 
 * Centraliza a lógica de:
 * - Buscar detalhes completos de um badge (LP, SL, Área, Nível, Requisitos, Líder SLL)
 * - Enviar emails em massa para Talent Managers (Estado 2)
 * - Enviar email para o líder SLL (Estado 3)
 * 
 * Importado por candidatura_badge.controller.js e acao_candidatura.controller.js
 */

const Badge = require('../models/badge.model');
const Utilizador = require('../models/utilizador.model');
const PerfilUtilizador = require('../models/perfil_utilizador.model');
const ConfiguracaoSLA = require('../models/configuracao_sla.model');
const enviarEmail = require('../config/smtp');
const { templateCandidaturaParaAnaliseTM, templateCandidaturaParaValidacaoSLL } = require('./emailTemplates');

/**
 * Busca todos os detalhes de um badge necessários para compor emails de candidatura.
 * Devolve dados do Badge (nome traduzido, pontos, LP, SL, Área, Nível, Requisitos),
 * bem como o id_sl_lider da Service Line para identificação do SLL responsável.
 *
 * @param {string} id_badge - UUID do badge
 * @param {string} lang - Idioma preferencial (pt, en, es)
 * @returns {Object|null} Dados estruturados ou null se o badge não existir
 */
async function buscarDetalhesBadgeParaEmail(id_badge, lang = 'pt') {
  try {
    const detailedBadge = await Badge.findByPk(id_badge, {
      include: [
        { association: 'traducao_titulo' },
        {
          association: 'nivel_area',
          include: [
            { association: 'traducao_nivel_area' },
            {
              association: 'area',
              include: [
                { association: 'traducao_area' },
                {
                  association: 'service_line',
                  include: [
                    { association: 'traducao_service_line' },
                    { association: 'learning_path', include: [{ association: 'traducao_learning_path' }] }
                  ]
                }
              ]
            }
          ]
        },
        {
          association: 'requisitos',
          where: { requisitoAtivo: true },
          required: false,
          include: [{ association: 'traducao_titulo' }]
        }
      ]
    });

    if (!detailedBadge) return null;

    const idioma = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';

    const badgeNome = detailedBadge.traducao_titulo?.[idioma] || detailedBadge.traducao_titulo?.['pt'] || '';
    const lpNome = detailedBadge.nivel_area?.area?.service_line?.learning_path?.traducao_learning_path?.[idioma]
      || detailedBadge.nivel_area?.area?.service_line?.learning_path?.traducao_learning_path?.['pt'] || '';
    const slNome = detailedBadge.nivel_area?.area?.service_line?.traducao_service_line?.[idioma]
      || detailedBadge.nivel_area?.area?.service_line?.traducao_service_line?.['pt'] || '';
    const areaNome = detailedBadge.nivel_area?.area?.traducao_area?.[idioma]
      || detailedBadge.nivel_area?.area?.traducao_area?.['pt'] || '';
    const nivelNome = detailedBadge.nivel_area?.traducao_nivel_area?.[idioma]
      || detailedBadge.nivel_area?.traducao_nivel_area?.['pt'] || '';
    const requisitos = (detailedBadge.requisitos || []).map(r =>
      r.traducao_titulo?.[idioma] || r.traducao_titulo?.['pt'] || ''
    ).filter(Boolean);

    // Dados i18n completos do título do badge (para notificações multilingue)
    const badgeTituloI18n = {
      pt: detailedBadge.traducao_titulo?.pt || '',
      en: detailedBadge.traducao_titulo?.en || '',
      es: detailedBadge.traducao_titulo?.es || ''
    };

    // Identificação do SLL líder da Service Line
    const slId = detailedBadge.nivel_area?.area?.service_line?.id_service_line || null;
    const slLiderId = detailedBadge.nivel_area?.area?.service_line?.id_sl_lider || null;

    return {
      badgeNome,
      badgeTituloI18n,
      pontos: detailedBadge.pontos || 0,
      lpNome,
      slNome,
      areaNome,
      nivelNome,
      requisitos,
      slId,
      slLiderId
    };
  } catch (err) {
    console.error('[buscarDetalhesBadgeParaEmail] Erro:', err.message);
    return null;
  }
}

/**
 * Busca a configuração SLA ativa (primeira entrada da tabela).
 * @returns {Object} { sla_tm_horas, sla_sll_horas } ou valores padrão
 */
async function buscarConfigSLA() {
  try {
    const config = await ConfiguracaoSLA.findOne({ order: [['createdAt', 'DESC']] });
    return {
      sla_tm_horas: config?.sla_tm_horas || 48,
      sla_sll_horas: config?.sla_sll_horas || 48
    };
  } catch (err) {
    console.error('[buscarConfigSLA] Erro (usando defaults):', err.message);
    return { sla_tm_horas: 48, sla_sll_horas: 48 };
  }
}

/**
 * Envia email para todos os Talent Managers (perfil 3) excepto o dono da candidatura.
 * Executar de forma assíncrona (fire-and-forget) para não bloquear a resposta HTTP.
 *
 * @param {string} id_badge - UUID do badge da candidatura
 * @param {string} idDonoCandidatura - UUID do utilizador dono da candidatura (excluído da lista)
 * @param {string} nomeConsultor - Nome completo do consultor que submeteu
 */
async function enviarEmailParaTMsExcetoUsuario(id_badge, idDonoCandidatura, nomeConsultor) {
  try {
    // 1. Buscar todos os utilizadores com perfil TM (id_perfil = 3) e relacionamento ativo
    const perfisTM = await PerfilUtilizador.findAll({
      where: { id_perfil: 3, relacionamentoAtivo: true },
      include: [{
        association: 'Utilizador',
        where: { conta_ativa: true },
        attributes: ['id_utilizador', 'nome', 'apelido', 'email', 'idioma_preferencial']
      }]
    });

    // 2. Filtrar: excluir o dono da candidatura
    const tmsElegiveis = perfisTM
      .filter(pu => pu.Utilizador && pu.Utilizador.id_utilizador !== idDonoCandidatura)
      .map(pu => pu.Utilizador);

    if (tmsElegiveis.length === 0) return;

    // 3. Buscar configuração SLA para incluir prazo no email
    const { sla_tm_horas } = await buscarConfigSLA();

    // 4. Enviar email a cada TM no idioma preferencial dele
    for (const tm of tmsElegiveis) {
      try {
        const lang = tm.idioma_preferencial || 'pt';
        const dados = await buscarDetalhesBadgeParaEmail(id_badge, lang);
        if (!dados) continue;

        const { text, html, assunto } = templateCandidaturaParaAnaliseTM({
          nomeTM: `${tm.nome} ${tm.apelido}`.trim(),
          nomeConsultor,
          lang,
          badgeNome: dados.badgeNome,
          pontos: dados.pontos,
          lpNome: dados.lpNome,
          slNome: dados.slNome,
          areaNome: dados.areaNome,
          nivelNome: dados.nivelNome,
          slaHoras: sla_tm_horas
        });

        await enviarEmail(tm.email, assunto, text, html);
      } catch (mailErr) {
        console.error(`[enviarEmailParaTMs] Erro ao enviar para ${tm.email}:`, mailErr.message);
      }
    }
  } catch (err) {
    console.error('[enviarEmailParaTMsExcetoUsuario] Erro geral:', err.message);
  }
}

/**
 * Envia email para o líder da Service Line (SLL) excepto se for o próprio dono da candidatura.
 *
 * @param {string} id_badge - UUID do badge da candidatura
 * @param {string} idDonoCandidatura - UUID do utilizador dono da candidatura
 * @param {string} nomeConsultor - Nome completo do consultor
 * @param {string} nomeTmQuePreAprovou - Nome do TM que pré-aprovou
 */
async function enviarEmailParaSLLExcetoUsuario(id_badge, idDonoCandidatura, nomeConsultor, nomeTmQuePreAprovou) {
  try {
    // 1. Buscar os detalhes do badge para identificar o líder SLL
    const dadosBadge = await buscarDetalhesBadgeParaEmail(id_badge, 'pt');
    if (!dadosBadge || !dadosBadge.slLiderId) return;

    // 2. Se o líder SLL é o próprio dono da candidatura, não enviar
    if (dadosBadge.slLiderId === idDonoCandidatura) return;

    // 3. Buscar os dados do utilizador líder SLL
    const liderSLL = await Utilizador.findByPk(dadosBadge.slLiderId, {
      attributes: ['id_utilizador', 'nome', 'apelido', 'email', 'idioma_preferencial', 'conta_ativa']
    });

    if (!liderSLL || !liderSLL.conta_ativa) return;

    // 4. Buscar configuração SLA para incluir prazo no email
    const { sla_sll_horas } = await buscarConfigSLA();

    // 5. Gerar template no idioma preferencial do SLL e enviar
    const lang = liderSLL.idioma_preferencial || 'pt';
    const dadosIdioma = await buscarDetalhesBadgeParaEmail(id_badge, lang);
    if (!dadosIdioma) return;

    const { text, html, assunto } = templateCandidaturaParaValidacaoSLL({
      nomeSLL: `${liderSLL.nome} ${liderSLL.apelido}`.trim(),
      nomeConsultor,
      nomeTmQuePreAprovou,
      lang,
      badgeNome: dadosIdioma.badgeNome,
      pontos: dadosIdioma.pontos,
      lpNome: dadosIdioma.lpNome,
      slNome: dadosIdioma.slNome,
      areaNome: dadosIdioma.areaNome,
      nivelNome: dadosIdioma.nivelNome,
      slaHoras: sla_sll_horas
    });

    await enviarEmail(liderSLL.email, assunto, text, html);
  } catch (err) {
    console.error('[enviarEmailParaSLLExcetoUsuario] Erro:', err.message);
  }
}

module.exports = {
  buscarDetalhesBadgeParaEmail,
  buscarConfigSLA,
  enviarEmailParaTMsExcetoUsuario,
  enviarEmailParaSLLExcetoUsuario
};
