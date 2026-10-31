// =========================================================================
// SERVIÇO DE VERIFICAÇÃO PERIÓDICA DE PRAZOS DE SUBMISSÃO (LEMBRETES & CANCELAMENTO)
// =========================================================================
const { Op } = require('sequelize');
const Candidatura = require('../models/candidatura_badge.model');
const Badge = require('../models/badge.model');
const NivelArea = require('../models/nivel.model');
const Utilizador = require('../models/utilizador.model');
const ConfiguracaoSLA = require('../models/configuracao_sla.model');
const Notificacao = require('../models/notificacao.model');
const { criarENotificar } = require('./notificacao.service');
const { TIPOS_ACAO, criarAcao } = require('./acao_candidatura.service');
const { emitGlobal } = require('./websocket.service');
const { verificarTodosObjetivos } = require('./objetivo.service');

let timerLembreteRef = null;

async function verificarPrazosCandidatura() {
  try {
    const config = await ConfiguracaoSLA.findOne();
    if (!config) return;

    // Candidaturas em aberto / rascunho (Estado 1 - OPEN)
    const candidaturasAbertas = await Candidatura.findAll({
      where: {
        id_estado_candidatura: 1, // OPEN
        candidaturaAtiva: true
      },
      include: [
        {
          model: Badge,
          as: 'badge',
          include: [{
            model: NivelArea,
            as: 'nivel_area'
          }]
        },
        {
          model: Utilizador,
          as: 'consultor'
        }
      ]
    });

    const agora = new Date();

    for (const candidatura of candidaturasAbertas) {
      if (!candidatura.badge) continue;

      const dataInicio = new Date(candidatura.data_inicio_candidatura || candidatura.createdAt);
      const diasPrazo = candidatura.badge.dias_submeter 
        || (candidatura.badge.nivel_area?.candidatura_com_prazo ? candidatura.badge.nivel_area.tempo_concluir_candidatura : 7) 
        || 7;
      
      const dataLimite = new Date(dataInicio);
      dataLimite.setDate(dataLimite.getDate() + diasPrazo);

      const diasRestantes = Math.ceil((dataLimite - agora) / (1000 * 60 * 60 * 24));
      const consultor = candidatura.consultor;
      if (!consultor) continue;
      const lang = consultor.idioma_preferencial || 'pt';
      const badgeTitulo = candidatura.badge.traducao_titulo || {};
      const nomeBadgeStr = badgeTitulo[lang] || badgeTitulo.pt || 'Badge';

      // CASO 1: Prazo Expirado (< 0 dias) -> Cancelar automaticamente pelo sistema (Estado 5 CLOSED_NOK / Ação 9)
      if (diasRestantes < 0) {
        await candidatura.update({
          id_estado_candidatura: 5, // CLOSED_NOK
          data_encerramento_candidatura: agora
        });

        await criarAcao({
          id_candidatura: candidatura.id_candidatura,
          id_utilizador: null,
          tipo_acao_candidatura: TIPOS_ACAO.CANCELADA_SISTEMA
        });

        await criarENotificar({
          id_user_notificador: null,
          id_user_alvo_notificacao: consultor.id_utilizador,
          codigo_tipo: 'candidatura_cancelada_sistema',
          titulo: {
            pt: "Candidatura Cancelada pelo Sistema",
            en: "Application Cancelled by System",
            es: "Solicitud Cancelada por el Sistema"
          },
          mensagem: {
            pt: `O seu rascunho de candidatura ao badge "${nomeBadgeStr}" foi cancelado por exceder o prazo de submissão de ${diasPrazo} dias.`,
            en: `Your draft application for badge "${nomeBadgeStr}" was cancelled for exceeding the ${diasPrazo}-day submission deadline.`,
            es: `Su borrador de solicitud para la insignia "${nomeBadgeStr}" fue cancelado por exceder el plazo de ${diasPrazo} días.`
          },
          parametros: { id_candidatura: candidatura.id_candidatura, id_badge: candidatura.id_badge }
        });

        emitGlobal('candidatura_atualizada', {
          id_candidatura: candidatura.id_candidatura,
          id_estado: 5,
          acao: 'CANCELADA_SISTEMA'
        });

        console.log(`[Lembretes] Candidatura ${candidatura.id_candidatura} cancelada pelo sistema por expiração de prazo.`);
        continue;
      }

      // CASO 2: Lembretes nos marcos (5 dias, 1 dia ou no próprio dia 0)
      if (diasRestantes === 5 || diasRestantes === 1 || diasRestantes === 0) {
        const inicioDia = new Date(agora);
        inicioDia.setHours(0, 0, 0, 0);
        
        const jaNotificado = await Notificacao.findOne({
          where: {
            id_user_alvo_notificacao: candidatura.id_utilizador,
            createdAt: { [Op.gte]: inicioDia }
          },
          include: [{
            association: 'tipo',
            where: { codigo_tipo: 'lembrete_prazo' }
          }]
        });
        
        if (jaNotificado) {
          const ehMesmaCandidatura = jaNotificado.parametros && jaNotificado.parametros.id_candidatura === candidatura.id_candidatura;
          if (ehMesmaCandidatura) continue;
        }

        let ptMsg = `Lembrete: O prazo para submeter evidências ao badge "${nomeBadgeStr}" termina em ${diasRestantes} dia(s).`;
        let enMsg = `Reminder: The deadline to submit evidence for the "${nomeBadgeStr}" badge ends in ${diasRestantes} day(s).`;
        let esMsg = `Recordatorio: El plazo para enviar evidencias del badge "${nomeBadgeStr}" termina en ${diasRestantes} día(s).`;

        if (diasRestantes === 0) {
          ptMsg = `Lembrete Urgente: O prazo para submeter evidências ao badge "${nomeBadgeStr}" termina HOJE!`;
          enMsg = `Urgent Reminder: The deadline to submit evidence for the "${nomeBadgeStr}" badge ends TODAY!`;
          esMsg = `Recordatorio Urgente: ¡El plazo para enviar evidencias del badge "${nomeBadgeStr}" termina HOY!`;
        }

        await criarENotificar({
          id_user_notificador: null,
          id_user_alvo_notificacao: consultor.id_utilizador,
          codigo_tipo: 'lembrete_prazo',
          titulo: {
            pt: "Prazo de Candidatura",
            en: "Application Deadline",
            es: "Plazo de Solicitud"
          },
          mensagem: {
            pt: ptMsg,
            en: enMsg,
            es: esMsg
          },
          parametros: { id_candidatura: candidatura.id_candidatura, id_badge: candidatura.id_badge }
        });
      }
    }

  } catch (error) {
    console.error('[Lembretes] Erro ao verificar prazos:', error.message);
  }
}

async function iniciarDaemonLembretes() {
  console.log('[Lembretes] A iniciar daemon de verificação de prazos de candidatura e objetivos...');
  
  await verificarPrazosCandidatura();
  await verificarTodosObjetivos();

  try {
    const config = await ConfiguracaoSLA.findOne();
    const intervaloHoras = config?.intervalo_verificacao_badge_expirado || 24;
    const intervaloMs = intervaloHoras * 60 * 60 * 1000;

    if (timerLembreteRef) clearInterval(timerLembreteRef);

    timerLembreteRef = setInterval(async () => {
      console.log(`[Lembretes] Verificação periódica (a cada ${intervaloHoras}h) em execução...`);
      await verificarPrazosCandidatura();
      await verificarTodosObjetivos();
    }, intervaloMs);

    console.log(`[Lembretes] Daemon ativo. Verificação programada a cada ${intervaloHoras} hora(s).`);
  } catch (error) {
    console.error('[Lembretes] Erro ao programar daemon:', error.message);
  }
}

module.exports = {
  iniciarDaemonLembretes,
  verificarPrazosCandidatura
};
