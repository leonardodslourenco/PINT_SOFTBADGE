const AcaoCandidatura = require('../models/acao_candidatura.model'); // Modelo da tabela de ações/histórico
const Candidatura = require('../models/candidatura_badge.model'); // Modelo da tabela principal de candidaturas
const Badge = require('../models/badge.model');
const sequelize = require('../config/database'); // Instância do Sequelize para gerir a BD e transações
const validaIDInteiro = require('../services/valida_id_inteiro'); // Utilitário para validar e converter IDs numéricos
const validaUUID = require('../services/valida_UUID'); // Utilitário para validar IDs no formato UUID (versão 7
const { PERFIS } = require('../middlewares/permissao.middleware'); // Lista de perfis de utilizador permitidos no sistema
const { TIPOS_ACAO, criarAcao } = require('../services/acao_candidatura.service'); // Lógica de suporte para tipos de ações
const { processarTraducao, tratarPayloadTraducao } = require('../services/tradutor_helper'); // Serviço para tradução automática IA
const { emitToRoom } = require('../services/websocket.service'); // Serviço de WebSockets
const { criarENotificar } = require('../services/notificacao.service'); // Serviço centralizado de notificações BD + WS
const { getSllServiceLineId, checkSllScope } = require('../services/scope_check');
const AlertaExpiracao = require('../models/alerta_expiracao.model'); // Tabela de alertas de expiração de badges
const { verificarEAtribuirMarcos } = require('../services/marco.service'); // Avaliação e atribuição de marcos (milestones)
const { verificarObjetivosConsultor } = require('../services/objetivo.service'); // Avaliação e verificação de objetivos pessoais
const Utilizador = require('../models/utilizador.model');
const { buscarDetalhesBadgeParaEmail, enviarEmailParaSLLExcetoUsuario } = require('../services/candidatura_email_helper');

// Objeto que vai agrupar e exportar todos os métodos deste controlador
const controllersAcaoCandidatura = {};

const ESTADOS = {
  OPEN: 1,
  SUBMITTED: 2,
  EM_VALIDACAO: 3,
  CLOSED_OK: 4,
  CLOSED_NOK: 5
};

// Perfis que pertencem à equipa de gestão administrativa do sistema (com permissões totais)
const perfisGestao = [PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM];

//================================
// FUNÇÕES AUXILIARES / INTERNAS (CONTROLAR CANDIDATURAS E AÇÕES)
//===============================


//Verifica se o utilizador autenticado possui pelo menos um dos perfis exigidos
function temPerfil(req, perfis) {
  const perfisToken = req.auth?.perfis || [];
  return perfis.some(perfil => perfisToken.includes(perfil));
}

//Extrai de forma segura o ID do utilizador a partir do token de autenticação (JWT)
function getUtilizadorAutenticado(req) {
  return req.auth?.sub || req.auth?.id_utilizador || null;
}


//Um utilizador só pode interagir com uma candidatura se pertencer à equipa de Gestão ou se ele for o próprio dono da candidatura
function podeAcederCandidatura(req, candidatura) {
  const activeRole = req.activeRole;
  if ([1, 2, 3].includes(activeRole)) return true;
  return candidatura.id_utilizador === getUtilizadorAutenticado(req);
}

//Helper dinâmico para carregar os relacionamentos - Filtra os atributos textuais com base no idioma atual
const includeAcao = (lang) => [
  { association: 'tipo_acao', include: [{ association: 'traducao_acao', attributes: [lang] }] },
  { association: 'comentario', attributes: [lang] },
  { association: 'autor_acao', attributes: ['id_utilizador', 'nome', 'apelido', 'email'] }
];


// ==========================================
// MÉTODOS DO CONTROLADOR (ENDPOINTS API)
// ==========================================
/**
 * 1. CRIAR AÇÃO DE CANDIDATURA (Registo de histórico + mudança de estado)
 */
controllersAcaoCandidatura.createAcao = async (req, res) => {
  // Inicia uma transação SQL. Se algo falhar a meio, nenhuma alteração é gravada na base de dados
  const transaction = await sequelize.transaction();

  try {
    const { id_candidatura, tipo_acao_candidatura, novo_estado, comentario } = req.body;
    const id_utilizador = getUtilizadorAutenticado(req);

    // Validações básicas de tipo e preenchimento de campos obrigatórios
    const tipoAcaoInt = validaIDInteiro(tipo_acao_candidatura);
    if (!id_candidatura || !tipoAcaoInt || !validaUUID(id_candidatura, 7)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'id_candidatura and tipo_acao_candidatura são obrigatórios.' });
    }

    // Verifica se o tipo de ação enviado existe nas constantes mapeadas no sistema
    if (!Object.values(TIPOS_ACAO).includes(tipoAcaoInt)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'tipo_acao_candidatura inválido.' });
    }

    // Procura a candidatura e valida se ela existe e está ativa
    const candidatura = await Candidatura.findByPk(id_candidatura, { transaction });
    if (!candidatura || !candidatura.candidaturaAtiva) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Candidatura inválida.' });
    }

    // Validação de Escopo para SLL
    const activeRole = req.activeRole;
    if (activeRole === 2) {
      const belongs = await checkSllScope(id_utilizador, 'candidatura', id_candidatura);
      if (!belongs) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: 'Acesso negado: Esta candidatura não pertence a um badge da sua Service Line.' });
      }
    }

    // Verifica se o utilizador logado tem permissão para atuar sobre esta candidatura
    if (!podeAcederCandidatura(req, candidatura)) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Sem permissão para criar ação nesta candidatura.' });
    }

    // Filtro de Segurança Anti-fraude: O Consultor comum só pode submeter a ação de CANCELAR.
    const isGestor = [1, 2, 3].includes(activeRole);
    if (!isGestor) {
      if (tipoAcaoInt !== TIPOS_ACAO.CANCELADA_CONSULTOR) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: 'Apenas gestores podem realizar esta ação.' });
      }
      if (novo_estado && parseInt(novo_estado) !== ESTADOS.CLOSED_NOK) {
        await transaction.rollback();
        return res.status(403).json({ success: false, message: 'Consultores não podem forçar estados de aprovação.' });
      }
    }

    // Processamento da tradução (suporta texto plano ou objeto manual)
    let comentarioTraduzido = null;
    if (comentario) {
      try {
        comentarioTraduzido = await tratarPayloadTraducao(comentario, req.lang);
      } catch (transError) {
        await transaction.rollback();
        console.error("Falha ao processar tradução do comentário:", transError.message);
        return res.status(422).json({
          success: false,
          code: "TRANSLATION_API_FAILED",
          message: "O serviço de tradução automática está temporariamente indisponível.",
          originalData: {
            comentario: typeof comentario === 'string' ? comentario : (comentario[req.lang] || comentario.pt || "")
          },
          lang: req.lang
        });
      }
    }

    // Executa o serviço que cria o registo da ação (ex: "Submeteu", "Validou", "Comentou") na BDN
    const acao = await criarAcao({
      id_candidatura,
      id_utilizador,
      tipo_acao_candidatura: tipoAcaoInt,
      comentario: comentarioTraduzido,
      transaction
    });

    // Se o pedido também solicitar uma alteração no estado geral da candidatura (ex: passar de OPEN para SUBMITTED)
    if (novo_estado) {
      const novoEstadoInt = validaIDInteiro(novo_estado);
      if (!novoEstadoInt) {
        await transaction.rollback();
        return res.status(400).json({ success: false, message: 'novo_estado inválido.' });
      }

      const updatePayload = { id_estado_candidatura: novoEstadoInt };

      //Se o novo estado for FECHADO (OK ou NOK), regista automaticamente a data/hora atual
      if (novoEstadoInt === ESTADOS.CLOSED_OK || novoEstadoInt === ESTADOS.CLOSED_NOK) {
        updatePayload.data_encerramento_candidatura = new Date();
      }

      // Atualiza a tabela principal da candidatura
      await candidatura.update(updatePayload, { transaction });
    }

    // Commit das alterações na base de dados. A partir deste ponto, todas as alterações são permanentes
    await transaction.commit();

    // DISPARADORES DE NOTIFICAÇÕES EM TEMPO REAL (WEBSOCKETS + BASE DE DADOS + EMAILS)
    if (tipoAcaoInt === TIPOS_ACAO.PRE_APROVADA_TM) {
      // 1. Buscar detalhes do badge para personalizar notificações e emails
      let badgeTitle = { pt: '', en: '', es: '' };
      let slLiderId = null;
      try {
        const dadosBadge = await buscarDetalhesBadgeParaEmail(candidatura.id_badge, 'pt');
        if (dadosBadge) {
          badgeTitle = dadosBadge.badgeTituloI18n;
          slLiderId = dadosBadge.slLiderId;
        }
      } catch (errBadge) {
        console.error('Erro ao buscar dados do badge para pré-aprovação:', errBadge.message);
      }

      // 2. Notificação persistente no sino para o líder SLL da Service Line (se existir)
      if (slLiderId && slLiderId !== candidatura.id_utilizador) {
        try {
          await criarENotificar({
            id_user_notificador: id_utilizador,
            id_user_alvo_notificacao: slLiderId,
            codigo_tipo: 'candidatura_pre_aprovada',
            titulo: {
              pt: "Nova Candidatura Pré-Aprovada",
              en: "New Pre-Approved Application",
              es: "Nueva Solicitud Preaprobada"
            },
            mensagem: {
              pt: `A candidatura ao badge "${badgeTitle.pt || 'Badge'}" foi pré-aprovada pelo TM e aguarda a sua validação final.`,
              en: `The application for badge "${badgeTitle.en || 'Badge'}" was pre-approved by the TM and awaits your final validation.`,
              es: `La solicitud para el badge "${badgeTitle.es || 'Badge'}" fue preaprobada por el TM y espera su validación final.`
            },
            parametros: { id_candidatura, id_badge: candidatura.id_badge }
          });
        } catch (errNotifSLL) {
          console.error('Erro ao notificar SLL no sino (não-crítico):', errNotifSLL.message);
        }
      }

      // 3. Notificação persistente no sino para o Consultor dono da candidatura
      try {
        await criarENotificar({
          id_user_notificador: id_utilizador,
          id_user_alvo_notificacao: candidatura.id_utilizador,
          codigo_tipo: 'candidatura_avancou',
          titulo: {
            pt: "Candidatura Pré-Aprovada pelo TM",
            en: "Application Pre-Approved by TM",
            es: "Solicitud Preaprobada por el TM"
          },
          mensagem: {
            pt: `A sua candidatura ao badge "${badgeTitle.pt || 'Badge'}" foi pré-aprovada pelo Talent Manager e seguiu para validação do SLL.`,
            en: `Your application for badge "${badgeTitle.en || 'Badge'}" was pre-approved by the Talent Manager and forwarded for SLL validation.`,
            es: `Su solicitud para el badge "${badgeTitle.es || 'Badge'}" fue preaprobada por el Talent Manager y enviada para validación del SLL.`
          },
          parametros: { id_candidatura, id_badge: candidatura.id_badge }
        });
      } catch (errNotifConsultor) {
        console.error('Erro ao notificar Consultor no sino (não-crítico):', errNotifConsultor.message);
      }

      // 4. Enviar email em segundo plano ao líder SLL (excepto se for o próprio dono da candidatura)
      (async () => {
        try {
          const [consultor, autorTM] = await Promise.all([
            Utilizador.findByPk(candidatura.id_utilizador),
            Utilizador.findByPk(id_utilizador)
          ]);
          const nomeConsultor = consultor ? `${consultor.nome} ${consultor.apelido}`.trim() : 'Consultor';
          const nomeTM = autorTM ? `${autorTM.nome} ${autorTM.apelido}`.trim() : 'Talent Manager';
          await enviarEmailParaSLLExcetoUsuario(candidatura.id_badge, candidatura.id_utilizador, nomeConsultor, nomeTM);
        } catch (errEmailSLL) {
          console.error('Erro ao enviar email ao SLL (não-crítico):', errEmailSLL.message);
        }
      })();

      // 5. Avisar salas via WebSocket para atualização em tempo real
      emitToRoom('room_sll', 'candidatura_pre_aprovada', {
        id_candidatura,
        mensagem: "Nova candidatura pré-aprovada pendente da sua validação"
      });
      emitToRoom('room_sll', 'candidatura_avancou', { id_candidatura });
      emitToRoom('room_tm', 'candidatura_pre_aprovada', { id_candidatura });
      emitToRoom('room_tm', 'candidatura_avancou', { id_candidatura });
      emitToRoom('room_admin', 'candidatura_pre_aprovada', { id_candidatura });
      emitToRoom('room_admin', 'candidatura_avancou', { id_candidatura });
      emitToRoom(`user_${candidatura.id_utilizador}`, 'candidatura_avancou', {
        id_candidatura,
        mensagem: "A sua candidatura foi pré-aprovada pelo TM e submetida com sucesso.",
        parametros: { id_candidatura, id_badge: candidatura.id_badge }
      });
    } else if (tipoAcaoInt === TIPOS_ACAO.APROVADA_SLL) {
      // 1. Criar e notificar individualmente o dono da candidatura (Consultor) com SLL como notificador
      let badgeTitle = '';
      let badgePoints = 0;
      try {
        const badgeInfo = await Badge.findOne({
          where: { id_badge: candidatura.id_badge, badgeAtivo: true },
          include: [{ association: 'traducao_titulo', attributes: ['pt', 'en', 'es'] }]
        });
        if (badgeInfo) {
          const tituloTrad = badgeInfo.traducao_titulo || {};
          badgeTitle = {
            pt: tituloTrad.pt || '',
            en: tituloTrad.en || '',
            es: tituloTrad.es || ''
          };
          badgePoints = badgeInfo.pontos || 0;
        }
      } catch (errBadge) {
        console.error('Erro ao buscar badge para notificação (não-crítico):', errBadge.message);
      }

      try {
        await criarENotificar({
          id_user_notificador: id_utilizador,
          id_user_alvo_notificacao: candidatura.id_utilizador,
          codigo_tipo: 'candidatura_badge_emitido',
          titulo: {
            pt: "Parabéns! Novo Badge Atribuído",
            en: "Congratulations! New Badge Awarded",
            es: "¡Felicidades! Nueva Insignia Concedida"
          },
          mensagem: {
            pt: `Parabéns! A sua candidatura foi aprovada e o Badge "${badgeTitle.pt}" foi emitido com sucesso. Você ganhou ${badgePoints} pontos.`,
            en: `Congratulations! Your application was approved and the Badge "${badgeTitle.en}" has been successfully issued. You earned ${badgePoints} points.`,
            es: `¡Felicidades! Su candidatura fue aprobada y el Badge "${badgeTitle.es}" se ha emitido con éxito. Has ganado ${badgePoints} puntos.`
          },
          parametros: { id_candidatura, id_badge: candidatura.id_badge }
        });
      } catch (errNotif) {
        console.error('Erro ao notificar consultor (não-crítico):', errNotif.message);
      }

      // 2. Criar e notificar especificamente o TM que fez a pré-aprovação com SLL como notificador
      try {
        const preAprovacao = await AcaoCandidatura.findOne({
          where: {
            id_candidatura,
            tipo_acao_candidatura: TIPOS_ACAO.PRE_APROVADA_TM
          }
        });

        if (preAprovacao) {
          await criarENotificar({
            id_user_notificador: id_utilizador,
            id_user_alvo_notificacao: preAprovacao.id_utilizador,
            codigo_tipo: 'candidatura_aprovada',
            titulo: {
              pt: "Candidatura Pré-aprovada Finalizada",
              en: "Pre-approved Application Completed",
              es: "Solicitud Preaprobada Finalizada"
            },
            mensagem: {
              pt: "Uma candidatura que você pré-aprovou recebeu aprovação final do SLL.",
              en: "An application you pre-approved received final approval from SLL.",
              es: "Una candidatura que preaprobó recibió la aprobación final del SLL."
            },
            parametros: { id_candidatura, id_badge: candidatura.id_badge }
          });
        }
      } catch (errTM) {
        console.error('Erro ao notificar TM (não-crítico):', errTM.message);
      }

      // 3. Avisar moderadores para atualizarem as suas contagens no painel lateral e listagem
      emitToRoom('room_sll', 'candidatura_aprovada', { id_candidatura });
      emitToRoom('room_sll', 'candidatura_avancou', { id_candidatura });
      emitToRoom('room_tm', 'candidatura_aprovada', { id_candidatura });
      emitToRoom('room_tm', 'candidatura_avancou', { id_candidatura });
      emitToRoom('room_admin', 'candidatura_aprovada', { id_candidatura });
      emitToRoom('room_admin', 'candidatura_avancou', { id_candidatura });
      // 4. Avisar individualmente o consultor
      emitToRoom(`user_${candidatura.id_utilizador}`, 'candidatura_avancou', { id_candidatura });

      // 5. Gerar Certificado de Conclusão de forma assíncrona
      (async () => {
        try {
          const { gerarCertificado } = require('../services/certificadoPDF.service');
          await gerarCertificado(id_candidatura);
        } catch (errCert) {
          console.error('Erro ao gerar certificado de candidatura aprovada:', errCert.message);
        }
      })();

      // 6. Registar alerta de expiração (se o badge for expirável)
      (async () => {
        try {
          const badgeCompleto = await Badge.findByPk(candidatura.id_badge);
          if (badgeCompleto && badgeCompleto.badge_expiravel && badgeCompleto.tempo_expiracao > 0) {
            const dataConquista = candidatura.data_encerramento_candidatura || new Date();
            const dataExpiracao = new Date(dataConquista);
            dataExpiracao.setDate(dataExpiracao.getDate() + badgeCompleto.tempo_expiracao);

            await AlertaExpiracao.create({
              id_candidatura: candidatura.id_candidatura,
              id_consultor: candidatura.id_utilizador,
              id_badge: candidatura.id_badge,
              data_expiracao: dataExpiracao,
              alerta_enviado: false
            });
          }
        } catch (errAlert) {
          console.error('Erro ao registar alerta de expiração:', errAlert.message);
        }
      })();

      // 7. Avaliar e atribuir marcos por conquista de badges / áreas / service lines / períodos
      (async () => {
        try {
          await verificarEAtribuirMarcos(candidatura.id_utilizador, 'APROVACAO_CANDIDATURA');
        } catch (errMarcos) {
          console.error('Erro ao verificar marcos após aprovação SLL:', errMarcos.message);
        }
      })();

      // 8. Avaliar e verificar objetivos pessoais do consultor
      (async () => {
        try {
          await verificarObjetivosConsultor(candidatura.id_utilizador);
        } catch (errObj) {
          console.error('Erro ao verificar objetivos do consultor após aprovação SLL:', errObj.message);
        }
      })();
    } else if (tipoAcaoInt === TIPOS_ACAO.REJEITADA_TM) {
      // Devolução pelo TM (Estado 2 -> 1): Notificar Consultor com o comentário/motivo
      const textoComentarioPt = comentarioTraduzido?.pt || '';
      const textoComentarioEn = comentarioTraduzido?.en || textoComentarioPt;
      const textoComentarioEs = comentarioTraduzido?.es || textoComentarioPt;

      try {
        await criarENotificar({
          id_user_notificador: id_utilizador,
          id_user_alvo_notificacao: candidatura.id_utilizador,
          codigo_tipo: 'candidatura_rejeitada',
          titulo: {
            pt: "Candidatura Devolvida pelo TM",
            en: "Application Returned by TM",
            es: "Solicitud Devuelta por el TM"
          },
          mensagem: {
            pt: `A sua candidatura necessita de revisão e foi devolvida para rascunho pelo Talent Manager.${textoComentarioPt ? ` Motivo: "${textoComentarioPt}"` : ''}`,
            en: `Your application requires review and was returned to draft by the Talent Manager.${textoComentarioEn ? ` Reason: "${textoComentarioEn}"` : ''}`,
            es: `Su solicitud requiere revisión y fue devuelta a borrador por el Talent Manager.${textoComentarioEs ? ` Motivo: "${textoComentarioEs}"` : ''}`
          },
          parametros: { id_candidatura, id_badge: candidatura.id_badge }
        });
      } catch (errNotifRejTM) {
        console.error('Erro ao notificar Consultor sobre devolução TM:', errNotifRejTM.message);
      }

      // Avisar moderadores e consultor
      emitToRoom('room_tm', 'candidatura_submetida', { id_candidatura });
      emitToRoom('room_tm', 'candidatura_avancou', { id_candidatura });
      emitToRoom('room_sll', 'candidatura_pre_aprovada', { id_candidatura });
      emitToRoom('room_sll', 'candidatura_avancou', { id_candidatura });
      emitToRoom('room_admin', 'candidatura_submetida', { id_candidatura });
      emitToRoom('room_admin', 'candidatura_avancou', { id_candidatura });
      emitToRoom(`user_${candidatura.id_utilizador}`, 'candidatura_avancou', { id_candidatura });
    } else if (tipoAcaoInt === TIPOS_ACAO.REJEITADA_SLL || tipoAcaoInt === TIPOS_ACAO.ENCERRADA_SLL) {
      const textoComentarioPt = comentarioTraduzido?.pt || '';
      const textoComentarioEn = comentarioTraduzido?.en || textoComentarioPt;
      const textoComentarioEs = comentarioTraduzido?.es || textoComentarioPt;
      const novoEstadoInt = novo_estado ? parseInt(novo_estado) : null;

      if (novoEstadoInt === ESTADOS.CLOSED_NOK || tipoAcaoInt === TIPOS_ACAO.ENCERRADA_SLL) {
        // Rejeição Definitiva pelo SLL (Estado 3 -> 5)
        try {
          await criarENotificar({
            id_user_notificador: id_utilizador,
            id_user_alvo_notificacao: candidatura.id_utilizador,
            codigo_tipo: 'candidatura_recusada',
            titulo: {
              pt: "Candidatura Recusada pelo SLL",
              en: "Application Rejected by SLL",
              es: "Solicitud Rechazada por el SLL"
            },
            mensagem: {
              pt: `A sua candidatura foi recusada definitivamente pelo líder da Service Line.${textoComentarioPt ? ` Motivo: "${textoComentarioPt}"` : ''}`,
              en: `Your application was permanently rejected by the Service Line leader.${textoComentarioEn ? ` Reason: "${textoComentarioEn}"` : ''}`,
              es: `Su solicitud fue rechazada definitivamente por el líder de la Service Line.${textoComentarioEs ? ` Motivo: "${textoComentarioEs}"` : ''}`
            },
            parametros: { id_candidatura, id_badge: candidatura.id_badge }
          });
        } catch (errNotifRejSLL) {
          console.error('Erro ao notificar Consultor sobre rejeição definitiva SLL:', errNotifRejSLL.message);
        }
      } else {
        // Devolução para Correções pelo SLL (Estado 3 -> 1)
        try {
          await criarENotificar({
            id_user_notificador: id_utilizador,
            id_user_alvo_notificacao: candidatura.id_utilizador,
            codigo_tipo: 'candidatura_rejeitada',
            titulo: {
              pt: "Candidatura Devolvida pelo SLL",
              en: "Application Returned by SLL",
              es: "Solicitud Devuelta por el SLL"
            },
            mensagem: {
              pt: `A sua candidatura foi devolvida para correções pelo líder da Service Line.${textoComentarioPt ? ` Motivo: "${textoComentarioPt}"` : ''}`,
              en: `Your application was returned for corrections by the Service Line leader.${textoComentarioEn ? ` Reason: "${textoComentarioEn}"` : ''}`,
              es: `Su solicitud fue devuelta para correcciones por el líder de la Service Line.${textoComentarioEs ? ` Motivo: "${textoComentarioEs}"` : ''}`
            },
            parametros: { id_candidatura, id_badge: candidatura.id_badge }
          });
        } catch (errNotifDevSLL) {
          console.error('Erro ao notificar Consultor sobre devolução SLL:', errNotifDevSLL.message);
        }
      }

      // Avisar moderadores e consultor
      emitToRoom('room_tm', 'candidatura_submetida', { id_candidatura });
      emitToRoom('room_tm', 'candidatura_avancou', { id_candidatura });
      emitToRoom('room_sll', 'candidatura_pre_aprovada', { id_candidatura });
      emitToRoom('room_sll', 'candidatura_avancou', { id_candidatura });
      emitToRoom('room_admin', 'candidatura_submetida', { id_candidatura });
      emitToRoom('room_admin', 'candidatura_avancou', { id_candidatura });
      emitToRoom(`user_${candidatura.id_utilizador}`, 'candidatura_avancou', { id_candidatura });
    } else if ([TIPOS_ACAO.CANCELADA_CONSULTOR, TIPOS_ACAO.CANCELADA_SISTEMA].includes(tipoAcaoInt)) {
      // 1. Avisar todos os moderadores para atualizarem as suas contagens e listagens
      emitToRoom('room_tm', 'candidatura_submetida', { id_candidatura });
      emitToRoom('room_tm', 'candidatura_avancou', { id_candidatura });
      emitToRoom('room_sll', 'candidatura_pre_aprovada', { id_candidatura });
      emitToRoom('room_sll', 'candidatura_avancou', { id_candidatura });
      emitToRoom('room_admin', 'candidatura_submetida', { id_candidatura });
      emitToRoom('room_admin', 'candidatura_avancou', { id_candidatura });
      emitToRoom(`user_${candidatura.id_utilizador}`, 'candidatura_avancou', { id_candidatura });
    }

    return res.status(201).json({
      success: true,
      message: 'Ação de candidatura criada com sucesso.',
      data: { id_acao_candidatura: acao.id_acao_candidatura }
    });
  } catch (error) {
    // Só faz rollback se a transação ainda não foi finalizada (commit ou rollback anterior)
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return res.status(500).json({ success: false, message: 'Erro ao criar ação de candidatura.', error: error.message });
  }
};

/**
 * 2. LISTAR TODAS AS AÇÕES
 */
controllersAcaoCandidatura.listAcoes = async (req, res) => {
  try {
    const lang = req.lang;
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    const where = { acaoAtiva: true }; // Só traz ações que não tenham sido apagadas logicamente

    //Filtra por candidatura se o parâmetro id_candidatura for fornecido na query string
    if (req.query.id_candidatura) {
      if (!validaUUID(req.query.id_candidatura, 7)) {
        return res.status(400).json({ success: false, message: 'id_candidatura inválido.' });
      }

      // Se for SLL, valida se a candidatura pertence à sua Service Line
      if (activeRole === 2) {
        const belongs = await checkSllScope(userId, 'candidatura', req.query.id_candidatura);
        if (!belongs) {
          return res.status(403).json({ success: false, message: 'Acesso negado: Esta candidatura não pertence a um badge da sua Service Line.' });
        }
      }
      where.id_candidatura = req.query.id_candidatura;
    } else if (activeRole === 2) {
      // Se for SLL e não passou candidatura, restringe as ações às candidaturas da sua Service Line
      const slId = await getSllServiceLineId(userId);
      if (!slId) {
        return res.status(200).json({ success: true, data: [] });
      }
      where['$candidatura.badge.nivel_area.area.id_service_line$'] = slId;
    }

    const include = [...includeAcao(lang)];
    if (activeRole === 2 && !req.query.id_candidatura) {
      // Adiciona o include necessário para fazer a validação aninhada
      include.push({
        association: 'candidatura',
        include: [{
          association: 'badge',
          include: [{
            association: 'nivel_area',
            include: [{ association: 'area' }]
          }]
        }]
      });
    }

    // Procura na BD aplicando ordenação decrescente
    const acoes = await AcaoCandidatura.findAll({
      where,
      include,
      order: [['data_acao_candidatura', 'DESC']]
    });

    return res.status(200).json({ success: true, message: 'Ações de candidatura recuperadas com sucesso.', data: acoes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar ações de candidatura.', error: error.message });
  }
};

/**
 * 3. PROCURA AÇÃO POR ID
 */
controllersAcaoCandidatura.detailAcao = async (req, res) => {
  try {
    if (!validaUUID(req.params.id, 7)) {
      return res.status(400).json({ success: false, message: 'ID de ação inválido.' });
    }

    // Procura pela Chave Primária (PK) e anexa também dados básicos da candidatura correspondente
    const acao = await AcaoCandidatura.findByPk(req.params.id, {
      include: [
        ...includeAcao(req.lang),
        {
          association: 'candidatura',
          attributes: ['id_candidatura', 'id_utilizador', 'id_badge', 'id_estado_candidatura'],
          include: [{
            association: 'badge',
            include: [{
              association: 'nivel_area',
              include: [{ association: 'area' }]
            }]
          }]
        }
      ]
    });

    if (!acao || !acao.acaoAtiva) {
      return res.status(404).json({ success: false, message: 'Ação de candidatura não encontrada.' });
    }

    // Validação de Escopo para SLL
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'candidatura', acao.id_candidatura);
      if (!belongs) {
        return res.status(403).json({ success: false, message: 'Acesso negado: Esta ação pertence a uma candidatura fora do escopo da sua Service Line.' });
      }
    }

    // Aplica o filtro de segurança antes de expor os detalhes na resposta JSON
    if (!podeAcederCandidatura(req, acao.candidatura)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para consultar esta ação.' });
    }

    return res.status(200).json({ success: true, message: 'Ação de candidatura recuperada com sucesso.', data: acao });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao recuperar ação de candidatura.', error: error.message });
  }
};

/**
 * 4. LISTAR TODAS AS AÇÕES DE UMA CANDIDATURA 
 */
controllersAcaoCandidatura.listAcoesByCandidatura = async (req, res) => {
  try {
    if (!validaUUID(req.params.idCandidatura, 7)) {
      return res.status(400).json({ success: false, message: 'ID de candidatura inválido.' });
    }

    const candidatura = await Candidatura.findByPk(req.params.idCandidatura);
    if (!candidatura || !candidatura.candidaturaAtiva) {
      return res.status(404).json({ success: false, message: 'Candidatura não encontrada.' });
    }

    // Validação de Escopo para SLL
    const activeRole = req.activeRole;
    const userId = req.auth?.sub || req.auth?.id_utilizador;
    if (activeRole === 2) {
      const belongs = await checkSllScope(userId, 'candidatura', req.params.idCandidatura);
      if (!belongs) {
        return res.status(403).json({ success: false, message: 'Acesso negado: Esta candidatura não pertence a um badge da sua Service Line.' });
      }
    }

    // Validação de segurança (Evita que o Utilizador A espie a linha do tempo da candidatura do Utilizador B)
    if (!podeAcederCandidatura(req, candidatura)) {
      return res.status(403).json({ success: false, message: 'Sem permissão para consultar as ações desta candidatura.' });
    }

    // Procura todas as ações desta candidatura por ordem crescente (ASC)
    const acoes = await AcaoCandidatura.findAll({
      where: { id_candidatura: req.params.idCandidatura, acaoAtiva: true },
      include: includeAcao(req.lang),
      order: [['data_acao_candidatura', 'ASC']]
    });

    return res.status(200).json({ success: true, message: 'Ações da candidatura recuperadas com sucesso.', data: acoes });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar ações da candidatura.', error: error.message });
  }
};

module.exports = controllersAcaoCandidatura;