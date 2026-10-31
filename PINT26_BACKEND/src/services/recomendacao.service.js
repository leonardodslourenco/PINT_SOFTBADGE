// =========================================================================
// SERVIÇO DE RECOMENDAÇÃO INTELIGENTE DE BADGES (RECOMMENDER SERVICE)
// =========================================================================
const Utilizador = require('../models/utilizador.model');
const Candidatura = require('../models/candidatura_badge.model');
const Badge = require('../models/badge.model');
const NivelArea = require('../models/nivel.model');
const Area = require('../models/area.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const sequelize = require('../config/database');
const { Op } = require('sequelize');

/**
 * Obtém a lista de badges recomendados para um determinado consultor
 * baseando-se em 3 fases hierárquicas de popularidade e na sua preferência de quantidade.
 * 
 * @param {string} idUtilizador UUID do utilizador
 * @param {string} lang Idioma para tradução ('pt' | 'en' | 'es')
 * @param {number} [customLimit] Limite opcional (deve pertencer a [3, 6, 9, 12])
 * @returns {Promise<Object>} Lista e metadados de badges recomendados
 */
async function obterBadgesRecomendados(idUtilizador, lang = 'pt', customLimit = null) {
  // 1. Carregar o utilizador para obter área de preferência e preferência de quantidade
  const utilizador = await Utilizador.findByPk(idUtilizador);
  if (!utilizador) {
    throw new Error('Utilizador não encontrado.');
  }

  // Determinar limite total de recomendações (3, 6, 9 ou 12)
  let limiteTotal = 6;
  if (customLimit && [3, 6, 9, 12].includes(Number(customLimit))) {
    limiteTotal = Number(customLimit);
  } else if (utilizador.recomendacoes_badge && [3, 6, 9, 12].includes(Number(utilizador.recomendacoes_badge))) {
    limiteTotal = Number(utilizador.recomendacoes_badge);
  }

  const quotaPorFase = Math.floor(limiteTotal / 3);
  const idAreaPreferencia = Number(utilizador.id_area);

  // 2. Identificar candidaturas do utilizador:
  // - Ignorar badges já conquistados (estado 4) ou em curso (estados 1, 2, 3) com candidaturaAtiva = true
  // - Extrair áreas de histórico prévio (para a Fase 2)
  const candidaturasDoUtilizador = await Candidatura.findAll({
    where: {
      id_utilizador: idUtilizador,
      candidaturaAtiva: true
    },
    include: [{
      model: Badge,
      as: 'badge',
      include: [{
        model: NivelArea,
        as: 'nivel_area'
      }]
    }]
  });

  const idsBadgesIgnorados = new Set();
  const idsAreasComHistorico = new Set();

  candidaturasDoUtilizador.forEach(c => {
    // Apenas ignora se estiver em progresso (1, 2, 3) ou já concluída com sucesso (4)
    if ([1, 2, 3, 4].includes(c.id_estado_candidatura)) {
      idsBadgesIgnorados.add(c.id_badge);
    }
    const idArea = c.badge?.nivel_area?.id_area_sl;
    if (idArea) {
      idsAreasComHistorico.add(Number(idArea));
    }
  });

  // Áreas secundárias exploradas pelo consultor (excluindo a área de preferência)
  const idsAreasSecundarias = new Set(
    [...idsAreasComHistorico].filter(id => id !== idAreaPreferencia)
  );

  // 3. Calcular popularidade global de todos os badges (número de conclusões com estado 4)
  const contagensConquistas = await Candidatura.findAll({
    attributes: [
      'id_badge',
      [sequelize.fn('COUNT', sequelize.col('id_candidatura')), 'total_conquistas']
    ],
    where: {
      id_estado_candidatura: 4,
      candidaturaAtiva: true
    },
    group: ['id_badge'],
    raw: true
  });

  const popularidadeMap = new Map();
  contagensConquistas.forEach(row => {
    popularidadeMap.set(row.id_badge, parseInt(row.total_conquistas, 10) || 0);
  });

  // 4. Carregar todos os badges ativos do sistema com traduções de área e nível
  const todosBadges = await Badge.findAll({
    where: { badgeAtivo: true },
    include: [
      {
        model: TraducaoConteudo,
        as: 'traducao_titulo'
      },
      {
        model: TraducaoConteudo,
        as: 'traducao_descricao'
      },
      {
        model: NivelArea,
        as: 'nivel_area',
        include: [
          {
            model: TraducaoConteudo,
            as: 'traducao_nivel_area'
          },
          {
            model: Area,
            as: 'area',
            include: [{
              model: TraducaoConteudo,
              as: 'traducao_area'
            }]
          }
        ]
      }
    ]
  });

  // Filtrar apenas badges que o consultor NÃO possui e NÃO tem candidatura em curso
  const badgesElegiveis = todosBadges
    .filter(b => !idsBadgesIgnorados.has(b.id_badge))
    .map(b => {
      const idAreaBadge = Number(b.nivel_area?.id_area_sl || b.nivel_area?.area?.id_area || 0);
      const totalConquistas = popularidadeMap.get(b.id_badge) || 0;
      return {
        id_badge: b.id_badge,
        titulo: b.traducao_titulo?.[lang] || b.traducao_titulo?.pt || '',
        descricao: b.traducao_descricao?.[lang] || b.traducao_descricao?.pt || '',
        logo: b.logo,
        pontos: b.pontos,
        badge_expiravel: b.badge_expiravel,
        tempo_expiracao: b.tempo_expiracao,
        id_area: idAreaBadge,
        area_nome: b.nivel_area?.area?.traducao_area?.[lang] || b.nivel_area?.area?.traducao_area?.pt || '',
        nivel: b.nivel_area?.traducao_nivel_area?.[lang] || b.nivel_area?.traducao_nivel_area?.pt || '',
        total_conquistas_comunidade: totalConquistas
      };
    });

  // Ordenar elegíveis por popularidade decrescente e depois por pontos
  badgesElegiveis.sort((a, b) => {
    if (b.total_conquistas_comunidade !== a.total_conquistas_comunidade) {
      return b.total_conquistas_comunidade - a.total_conquistas_comunidade;
    }
    return a.pontos - b.pontos;
  });

  const recomendacoes = [];
  const idsAdicionados = new Set();

  const adicionarBadge = (badge, motivo) => {
    if (!idsAdicionados.has(badge.id_badge) && recomendacoes.length < limiteTotal) {
      idsAdicionados.add(badge.id_badge);
      recomendacoes.push({
        ...badge,
        motivo_recomendacao: motivo
      });
      return true;
    }
    return false;
  };

  // -------------------------------------------------------------------------
  // FASE 1: Badges Mais Populares na Área de Preferência do Consultor
  // -------------------------------------------------------------------------
  if (idAreaPreferencia) {
    const badgesFase1 = badgesElegiveis.filter(b => b.id_area === idAreaPreferencia);
    let adicionadosFase1 = 0;
    for (const b of badgesFase1) {
      if (adicionadosFase1 >= quotaPorFase) break;
      if (adicionarBadge(b, 'AREA_PREFERENCIAL')) {
        adicionadosFase1++;
      }
    }
  }

  // -------------------------------------------------------------------------
  // FASE 2: Badges Mais Populares em Áreas Secundárias com Histórico
  // -------------------------------------------------------------------------
  if (idsAreasSecundarias.size > 0) {
    const badgesFase2 = badgesElegiveis.filter(
      b => idsAreasSecundarias.has(b.id_area) && !idsAdicionados.has(b.id_badge)
    );
    let adicionadosFase2 = 0;
    for (const b of badgesFase2) {
      if (adicionadosFase2 >= quotaPorFase) break;
      if (adicionarBadge(b, 'AREA_EXPLORADA')) {
        adicionadosFase2++;
      }
    }
  }

  // -------------------------------------------------------------------------
  // FASE 3: Badges Mais Populares da Plataforma (Tendência Global)
  // -------------------------------------------------------------------------
  const badgesFase3 = badgesElegiveis.filter(b => !idsAdicionados.has(b.id_badge));
  let adicionadosFase3 = 0;
  for (const b of badgesFase3) {
    if (adicionadosFase3 >= quotaPorFase) break;
    if (adicionarBadge(b, 'TENDENCIA_GLOBAL')) {
      adicionadosFase3++;
    }
  }

  // -------------------------------------------------------------------------
  // FASE 4: Compensação / Fallback Automático (se alguma fase teve poucas opções)
  // -------------------------------------------------------------------------
  if (recomendacoes.length < limiteTotal) {
    for (const b of badgesElegiveis) {
      if (recomendacoes.length >= limiteTotal) break;
      adicionarBadge(b, 'TENDENCIA_GLOBAL');
    }
  }

  return {
    limite_configurado: limiteTotal,
    total_recomendacoes: recomendacoes.length,
    badges: recomendacoes
  };
}

module.exports = {
  obterBadgesRecomendados
};
