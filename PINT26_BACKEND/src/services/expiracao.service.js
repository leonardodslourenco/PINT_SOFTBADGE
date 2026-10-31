// =========================================================================
// SERVIÇO DE VERIFICAÇÃO PERIÓDICA DE EXPIRAÇÃO DE BADGES
// Executa verificação ao arrancar o servidor e depois a cada X horas
// conforme definido no campo intervalo_verificacao_badge_expirado
// =========================================================================
const { Op } = require('sequelize');
const AlertaExpiracao = require('../models/alerta_expiracao.model');
const Candidatura = require('../models/candidatura_badge.model');
const Badge = require('../models/badge.model');
const Utilizador = require('../models/utilizador.model');
const ConfiguracaoSLA = require('../models/configuracao_sla.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const enviarEmail = require('../config/smtp');
const { templateBadgeExpirando } = require('./emailTemplates');
const { criarENotificar } = require('./notificacao.service');

let timerRef = null; // Referência ao setInterval ativo para poder reprogramar

/**
 * FORMATAR DATA: Converte um Date para dd/mm/aaaa
 */
function formatarData(data) {
  const d = new Date(data);
  const dia = String(d.getDate()).padStart(2, '0');
  const mes = String(d.getMonth() + 1).padStart(2, '0');
  const ano = d.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * SINCRONIZAÇÃO RETROATIVA:
 * Verifica candidaturas aprovadas (estado 4) cujo badge é expirável e que ainda
 * não possuem registo na tabela alerta_expiracao. Cria os registos em falta.
 */
async function sincronizarAlertasRetroativos() {
  try {
    const candidaturasAprovadas = await Candidatura.findAll({
      where: {
        id_estado_candidatura: 4, // CLOSED_OK
        candidaturaAtiva: true,
        data_encerramento_candidatura: { [Op.ne]: null }
      },
      include: [
        {
          model: Badge,
          as: 'badge',
          where: {
            badge_expiravel: true,
            tempo_expiracao: { [Op.gt]: 0 }
          },
          attributes: ['id_badge', 'tempo_expiracao', 'tempo_aviso']
        },
        {
          association: 'renovacoes',
          where: { renovacaoAtiva: true },
          required: false
        }
      ]
    });

    let criados = 0;
    for (const candidatura of candidaturasAprovadas) {
      // Se tiver renovação aprovada, usa a data de renovação mais recente
      const renovacoesAprovadas = (candidatura.renovacoes || [])
        .filter(r => r.renovacao_aprovada === true && r.data_renovacao)
        .sort((a, b) => new Date(b.data_renovacao) - new Date(a.data_renovacao));
      const ultimaRenovacao = renovacoesAprovadas[0];
      const dataReferencia = (candidatura.candidatura_renovada && ultimaRenovacao)
        ? ultimaRenovacao.data_renovacao
        : candidatura.data_encerramento_candidatura;

      const dataConquista = new Date(dataReferencia);
      const dataExpiracao = new Date(dataConquista);
      dataExpiracao.setDate(dataExpiracao.getDate() + candidatura.badge.tempo_expiracao);

      // Verificar se já existe alerta para esta candidatura
      const alertaExistente = await AlertaExpiracao.findOne({
        where: { id_candidatura: candidatura.id_candidatura }
      });

      if (!alertaExistente) {
        await AlertaExpiracao.create({
          id_candidatura: candidatura.id_candidatura,
          id_badge: candidatura.id_badge,
          data_conquista: dataConquista,
          data_expiracao: dataExpiracao,
          utilizador_avisado: candidatura.consultor_avisado || false
        });
        criados++;
      } else if (Math.abs(new Date(alertaExistente.data_expiracao) - dataExpiracao) > 1000 * 60) {
        // Se houve alteração de ciclo de renovação, atualiza o alerta
        await alertaExistente.update({
          data_conquista: dataConquista,
          data_expiracao: dataExpiracao,
          utilizador_avisado: candidatura.consultor_avisado || false,
          data_aviso: candidatura.consultor_avisado ? alertaExistente.data_aviso : null
        });
      }
    }

    if (criados > 0) {
      console.log(`[Expiração] Sincronização retroativa: ${criados} alerta(s) de expiração criado(s).`);
    }
  } catch (error) {
    console.error('[Expiração] Erro na sincronização retroativa:', error.message);
  }
}

/**
 * VERIFICAÇÃO PRINCIPAL:
 * Procura alertas pendentes cujo badge expira dentro do intervalo configurado
 * (dias_badge_expirando ou tempo_aviso do badge) e envia notificação + email ao consultor.
 */
async function verificarExpiracoes() {
  try {
    // 1. Obter configuração de SLA
    const config = await ConfiguracaoSLA.findOne();
    const diasLimitePadrao = config?.dias_badge_expirando || 30;
    const agora = new Date();

    // 2. Buscar alertas pendentes (não avisados e cuja candidatura também não foi avisada)
    const alertasPendentes = await AlertaExpiracao.findAll({
      where: {
        utilizador_avisado: false
      },
      include: [{
        model: Badge,
        as: 'badge',
        attributes: ['id_badge', 'id_traducao_badge', 'tempo_aviso'],
        include: [{
          model: TraducaoConteudo,
          as: 'traducao_titulo',
          attributes: ['pt', 'en', 'es']
        }]
      }, {
        model: Candidatura,
        as: 'candidatura',
        where: {
          consultor_avisado: false,
          candidaturaAtiva: true
        },
        attributes: ['id_candidatura', 'id_utilizador', 'consultor_avisado', 'candidatura_renovada'],
        include: [{
          model: Utilizador,
          as: 'consultor',
          attributes: ['id_utilizador', 'nome', 'apelido', 'email', 'idioma_preferencial']
        }]
      }]
    });

    if (alertasPendentes.length === 0) {
      console.log('[Expiração] Nenhum alerta de expiração pendente.');
      return;
    }

    console.log(`[Expiração] A analisar ${alertasPendentes.length} alerta(s) de expiração pendente(s)...`);

    for (const alerta of alertasPendentes) {
      try {
        const consultor = alerta.candidatura?.consultor;
        const badge = alerta.badge;

        if (!consultor || !badge) {
          console.warn(`[Expiração] Alerta ${alerta.id_alerta_expiracao} sem consultor ou badge associado. A saltar.`);
          continue;
        }

        const tempoAvisoBadge = badge.tempo_aviso || diasLimitePadrao;
        const dataLimite = new Date(agora);
        dataLimite.setDate(dataLimite.getDate() + tempoAvisoBadge);

        // Se a data de expiração ainda não está dentro da janela de aviso deste badge, não avisa ainda
        if (new Date(alerta.data_expiracao) > dataLimite) {
          continue;
        }

        const lang = consultor.idioma_preferencial || 'pt';
        const tituloTrad = badge.traducao_titulo || {};
        const badgeNome = tituloTrad[lang] || tituloTrad.pt || 'Badge';
        const diasRestantes = Math.max(0, Math.ceil((new Date(alerta.data_expiracao) - agora) / (1000 * 60 * 60 * 24)));
        const dataConquistaFormatada = formatarData(alerta.data_conquista);
        const dataExpiracaoFormatada = formatarData(alerta.data_expiracao);

        // 3. Criar notificação na BD com i18n (tabela notificacao + traducao_conteudo)
        const titulosBadge = badge.traducao_titulo || {};
        await criarENotificar({
          id_user_notificador: null, // Notificação do sistema
          id_user_alvo_notificacao: consultor.id_utilizador,
          codigo_tipo: 'sistema_alerta',
          titulo: {
            pt: `Alerta: Badge "${titulosBadge.pt || badgeNome}" a expirar`,
            en: `Alert: Badge "${titulosBadge.en || badgeNome}" expiring`,
            es: `Alerta: Badge "${titulosBadge.es || badgeNome}" por expirar`
          },
          mensagem: {
            pt: `O badge "${titulosBadge.pt || badgeNome}" conquistado em ${dataConquistaFormatada} expira em ${diasRestantes} dias (${dataExpiracaoFormatada}). Aceda à plataforma para renovar.`,
            en: `The badge "${titulosBadge.en || badgeNome}" earned on ${dataConquistaFormatada} expires in ${diasRestantes} days (${dataExpiracaoFormatada}). Access the platform to renew.`,
            es: `El badge "${titulosBadge.es || badgeNome}" obtenido el ${dataConquistaFormatada} expira en ${diasRestantes} días (${dataExpiracaoFormatada}). Acceda a la plataforma para renovar.`
          },
          parametros: { id_candidatura: alerta.id_candidatura, id_badge: alerta.id_badge }
        });

        // 4. Enviar email no idioma preferencial do consultor
        try {
          const { text, html, assunto } = templateBadgeExpirando({
            nome: consultor.nome,
            badgeNome,
            dataConquista: dataConquistaFormatada,
            dataExpiracao: dataExpiracaoFormatada,
            diasRestantes,
            lang
          });
          await enviarEmail(consultor.email, assunto, text, html);
        } catch (emailErr) {
          console.error(`[Expiração] Erro ao enviar email para ${consultor.email}:`, emailErr.message);
        }

        // 5. Marcar como avisado tanto no alerta como na candidatura para prevenir reenvios desnecessários
        await alerta.update({
          utilizador_avisado: true,
          data_aviso: new Date()
        });

        await Candidatura.update({
          consultor_avisado: true
        }, {
          where: { id_candidatura: alerta.id_candidatura }
        });

        console.log(`[Expiração] Consultor ${consultor.nome} ${consultor.apelido} notificado sobre expiração do badge "${badgeNome}" em ${diasRestantes} dias.`);

      } catch (errAlerta) {
        console.error(`[Expiração] Erro ao processar alerta ${alerta.id_alerta_expiracao}:`, errAlerta.message);
      }
    }

  } catch (error) {
    console.error('[Expiração] Erro geral na verificação de expirações:', error.message);
  }
}

/**
 * INICIALIZAR O DAEMON:
 * 1. Executa sincronização retroativa (popula alertas para candidaturas já aprovadas)
 * 2. Executa a primeira verificação de expirações
 * 3. Programa execuções periódicas conforme o intervalo definido em configuracao_sla
 */
async function iniciarDaemonExpiracao() {
  console.log('[Expiração] A iniciar daemon de verificação de expiração de badges...');

  // Sincronizar alertas retroativos para candidaturas existentes
  await sincronizarAlertasRetroativos();

  // Executar a primeira verificação imediatamente
  await verificarExpiracoes();

  // Obter o intervalo configurado e programar as próximas execuções
  try {
    const config = await ConfiguracaoSLA.findOne();
    const intervaloHoras = config?.intervalo_verificacao_badge_expirado || 24;
    const intervaloMs = intervaloHoras * 60 * 60 * 1000;

    // Limpar intervalo anterior caso exista (ex: reconfiguração)
    if (timerRef) clearInterval(timerRef);

    timerRef = setInterval(async () => {
      console.log(`[Expiração] Verificação periódica (a cada ${intervaloHoras}h) em execução...`);
      await verificarExpiracoes();
    }, intervaloMs);

    console.log(`[Expiração] Daemon ativo. Verificação programada a cada ${intervaloHoras} hora(s).`);
  } catch (error) {
    console.error('[Expiração] Erro ao programar daemon:', error.message);
  }
}

/**
 * REPROGRAMAR O DAEMON:
 * Utilizado quando o Admin altera o intervalo de verificação nas configurações de SLA.
 */
async function reprogramarDaemonExpiracao() {
  console.log('[Expiração] A reprogramar daemon com novo intervalo...');
  if (timerRef) {
    clearInterval(timerRef);
    timerRef = null;
  }

  try {
    const config = await ConfiguracaoSLA.findOne();
    const intervaloHoras = config?.intervalo_verificacao_badge_expirado || 24;
    const intervaloMs = intervaloHoras * 60 * 60 * 1000;

    timerRef = setInterval(async () => {
      console.log(`[Expiração] Verificação periódica (a cada ${intervaloHoras}h) em execução...`);
      await verificarExpiracoes();
    }, intervaloMs);

    console.log(`[Expiração] Daemon reprogramado. Verificação a cada ${intervaloHoras} hora(s).`);
  } catch (error) {
    console.error('[Expiração] Erro ao reprogramar daemon:', error.message);
  }
}

module.exports = {
  iniciarDaemonExpiracao,
  reprogramarDaemonExpiracao,
  sincronizarAlertasRetroativos,
  verificarExpiracoes
};
