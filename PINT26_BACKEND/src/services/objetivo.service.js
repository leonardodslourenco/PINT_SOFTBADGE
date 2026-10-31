// =========================================================================
// SERVIÇO DO SUBSISTEMA DE OBJETIVOS (OBJECTIVES SERVICE)
// Responsável pela verificação, cálculo de metas, envio de notificações e emails
// =========================================================================

const { Op } = require('sequelize');
const ObjetivoConsultor = require('../models/objetivo_consultor.model');
const TipoObjetivo = require('../models/tipo_objetivo.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const Utilizador = require('../models/utilizador.model');
const Candidatura = require('../models/candidatura_badge.model');
const Badge = require('../models/badge.model');
const NivelArea = require('../models/nivel.model');
const Area = require('../models/area.model');
const ServiceLine = require('../models/service_line.model');
const BadgeAtribuido = require('../models/badge_atribuido.model');
const CandidaturaEspecial = require('../models/candidatura_especial.model');
const ConquistaAtribuida = require('../models/conquista_atribuida.model');

const { emitToRoom } = require('./websocket.service');
const { criarENotificar } = require('./notificacao.service');
const enviarEmail = require('../config/smtp');
const {
  templateObjetivoCumprido,
  templateObjetivoAvisoPrazo,
  templateObjetivoExpirado,
  templateObjetivoProgressoSemanal
} = require('./emailTemplates');

/**
 * Retorna texto descritivo da meta configurada no objetivo
 */
function descreverMetaObjetivo(obj, lang = 'pt') {
  const tipo = obj.tipo_objetivo?.codigo_tipo;

  switch (tipo) {
    case 'BADGES_NORMAL_TEMPO':
      return lang === 'en'
        ? `Earn ${obj.quantidade_badges} normal badges within ${obj.prazo_valor} ${obj.unidade_prazo}`
        : lang === 'es'
        ? `Obtener ${obj.quantidade_badges} badges normales en ${obj.prazo_valor} ${obj.unidade_prazo}`
        : `Obter ${obj.quantidade_badges} badges normais em ${obj.prazo_valor} ${obj.unidade_prazo}`;

    case 'BADGES_NORMAL_DIVERSIDADE': {
      const entLabel = {
        area: { pt: 'áreas', en: 'areas', es: 'áreas' },
        service_line: { pt: 'service lines', en: 'service lines', es: 'service lines' },
        learning_path: { pt: 'learning paths', en: 'learning paths', es: 'learning paths' }
      }[obj.tipo_diversidade] || { pt: 'entidades', en: 'entities', es: 'entidades' };

      const label = entLabel[lang] || entLabel.pt;
      return lang === 'en'
        ? `Earn ${obj.quantidade_badges} normal badges across ${obj.quantidade_diversidade} distinct ${label}`
        : lang === 'es'
        ? `Obtener ${obj.quantidade_badges} badges normales en ${obj.quantidade_diversidade} ${label} distintas`
        : `Obter ${obj.quantidade_badges} badges normais em ${obj.quantidade_diversidade} ${label} distintas`;
    }

    case 'PONTOS_NORMAL_TEMPO':
      return lang === 'en'
        ? `Accumulate ${obj.quantidade_pontos} normal badge points within ${obj.prazo_valor} ${obj.unidade_prazo}`
        : lang === 'es'
        ? `Acumular ${obj.quantidade_pontos} puntos de badges normales en ${obj.prazo_valor} ${obj.unidade_prazo}`
        : `Acumular ${obj.quantidade_pontos} pontos de badges normais em ${obj.prazo_valor} ${obj.unidade_prazo}`;

    case 'BADGES_ESPECIAL_TEMPO':
      return lang === 'en'
        ? `Earn ${obj.quantidade_badges} special badges within ${obj.prazo_valor} ${obj.unidade_prazo}`
        : lang === 'es'
        ? `Obtener ${obj.quantidade_badges} badges especiales en ${obj.prazo_valor} ${obj.unidade_prazo}`
        : `Obter ${obj.quantidade_badges} badges especiais em ${obj.prazo_valor} ${obj.unidade_prazo}`;

    case 'PONTOS_ESPECIAL_TEMPO':
      return lang === 'en'
        ? `Accumulate ${obj.quantidade_pontos} special badge points within ${obj.prazo_valor} ${obj.unidade_prazo}`
        : lang === 'es'
        ? `Acumular ${obj.quantidade_pontos} puntos de badges especiales en ${obj.prazo_valor} ${obj.unidade_prazo}`
        : `Acumular ${obj.quantidade_pontos} pontos de badges especiais em ${obj.prazo_valor} ${obj.unidade_prazo}`;

    default:
      return 'Objetivo Pessoal';
  }
}

/**
 * Obtém dados de candidaturas normais aprovadas e calcula entidades distintas para o Tipo 2
 */
async function obterProgressoDiversidade(idUtilizador, dataInicio, transaction = null) {
  const candidaturas = await Candidatura.findAll({
    where: {
      id_utilizador: idUtilizador,
      id_estado_candidatura: 4, // ENCERRADA COM SUCESSO
      candidaturaAtiva: true,
      data_encerramento_candidatura: {
        [Op.gte]: dataInicio
      }
    },
    include: [{
      model: Badge,
      as: 'badge',
      include: [{
        model: NivelArea,
        as: 'nivel_area',
        include: [{
          model: Area,
          as: 'area',
          include: [{
            model: ServiceLine,
            as: 'service_line'
          }]
        }]
      }]
    }],
    transaction
  });

  const areasUnicas = new Set();
  const serviceLinesUnicas = new Set();
  const learningPathsUnicas = new Set();

  for (const c of candidaturas) {
    const area = c.badge?.nivel_area?.area;
    if (area?.id_area) {
      areasUnicas.add(String(area.id_area));
    }
    const sl = area?.service_line;
    if (sl?.id_service_line) {
      serviceLinesUnicas.add(String(sl.id_service_line));
      if (sl.id_learning_path) {
        learningPathsUnicas.add(String(sl.id_learning_path));
      }
    }
  }

  return {
    totalBadges: candidaturas.length,
    areasCount: areasUnicas.size,
    serviceLinesCount: serviceLinesUnicas.size,
    learningPathsCount: learningPathsUnicas.size
  };
}

/**
 * Avalia se um objetivo específico foi cumprido
 */
async function avaliarObjetivo(obj, transaction = null) {
  const codigo = obj.tipo_objetivo?.codigo_tipo;
  const dataInicio = new Date(obj.data_inicio_objetivo);
  const dataLimite = obj.data_limite_objetivo ? new Date(obj.data_limite_objetivo) : null;
  const agora = new Date();

  switch (codigo) {
    case 'BADGES_NORMAL_TEMPO': {
      // Badges normais encerrados (estado 4) entre data_inicio e data_limite
      const whereCond = {
        id_utilizador: obj.id_utilizador,
        id_estado_candidatura: 4,
        candidaturaAtiva: true,
        data_encerramento_candidatura: {
          [Op.gte]: dataInicio
        }
      };

      if (dataLimite) {
        whereCond.data_encerramento_candidatura[Op.lte] = dataLimite;
      }

      const totalConcluidos = await Candidatura.count({
        where: whereCond,
        transaction
      });

      return {
        atingiu: totalConcluidos >= obj.quantidade_badges,
        progressoAtual: totalConcluidos,
        metaTotal: obj.quantidade_badges
      };
    }

    case 'BADGES_NORMAL_DIVERSIDADE': {
      const prog = await obterProgressoDiversidade(obj.id_utilizador, dataInicio, transaction);
      let entidadesDistintas = 0;
      if (obj.tipo_diversidade === 'area') {
        entidadesDistintas = prog.areasCount;
      } else if (obj.tipo_diversidade === 'service_line') {
        entidadesDistintas = prog.serviceLinesCount;
      } else if (obj.tipo_diversidade === 'learning_path') {
        entidadesDistintas = prog.learningPathsCount;
      }

      const atingiu = prog.totalBadges >= obj.quantidade_badges && entidadesDistintas >= obj.quantidade_diversidade;

      // Calcular o progresso misto em percentagem [0, 100]
      const badgeProgress = Math.min(prog.totalBadges / (obj.quantidade_badges || 1), 1);
      const divProgress = Math.min(entidadesDistintas / (obj.quantidade_diversidade || 1), 1);
      const progressoMisto = Math.round(((badgeProgress + divProgress) / 2) * 100);

      return {
        atingiu,
        progressoAtual: progressoMisto,
        metaTotal: 100
      };
    }

    case 'PONTOS_NORMAL_TEMPO': {
      // Soma pontos adquiridos em badge_atribuido entre data_inicio e data_limite
      const whereCond = {
        id_candidato: obj.id_utilizador,
        atribuicaoAtiva: true,
        data_atribuicao_badge: {
          [Op.gte]: dataInicio
        }
      };

      if (dataLimite) {
        whereCond.data_atribuicao_badge[Op.lte] = dataLimite;
      }

      const atribuicoes = await BadgeAtribuido.findAll({
        where: whereCond,
        attributes: ['pontos_adquiridos'],
        transaction
      });

      const totalPontos = atribuicoes.reduce((acc, curr) => acc + (curr.pontos_adquiridos || 0), 0);

      return {
        atingiu: totalPontos >= obj.quantidade_pontos,
        progressoAtual: totalPontos,
        metaTotal: obj.quantidade_pontos
      };
    }

    case 'BADGES_ESPECIAL_TEMPO': {
      // Candidaturas especiais aprovadas (estado 3) entre data_inicio e data_limite
      const whereCond = {
        id_utilizador: obj.id_utilizador,
        id_estado_candidatura_especial: 3, // APROVADA
        candidaturaEspecialAtiva: true,
        data_decisao: {
          [Op.gte]: dataInicio
        }
      };

      if (dataLimite) {
        whereCond.data_decisao[Op.lte] = dataLimite;
      }

      const totalEspeciais = await CandidaturaEspecial.count({
        where: whereCond,
        transaction
      });

      return {
        atingiu: totalEspeciais >= obj.quantidade_badges,
        progressoAtual: totalEspeciais,
        metaTotal: obj.quantidade_badges
      };
    }

    case 'PONTOS_ESPECIAL_TEMPO': {
      // Conquistas especiais atribuídas entre data_inicio e data_limite
      const whereCond = {
        id_utilizador: obj.id_utilizador,
        atribuicaoAtiva: true,
        data_atribuicao_conquista: {
          [Op.gte]: dataInicio
        }
      };

      if (dataLimite) {
        whereCond.data_atribuicao_conquista[Op.lte] = dataLimite;
      }

      const atribuicoes = await ConquistaAtribuida.findAll({
        where: whereCond,
        attributes: ['pontos_conquistados'],
        transaction
      });

      const totalPontos = atribuicoes.reduce((acc, curr) => acc + (curr.pontos_conquistados || 0), 0);

      return {
        atingiu: totalPontos >= obj.quantidade_pontos,
        progressoAtual: totalPontos,
        metaTotal: obj.quantidade_pontos
      };
    }

    default:
      return { atingiu: false, progressoAtual: 0, metaTotal: 0 };
  }
}

/**
 * Conclui um objetivo, marca como cumprido e dispara celebrações (WS + Push + Notificação + Email)
 */
async function celebrarObjetivoCumprido(obj, consultor, transaction = null) {
  const agora = new Date();

  await obj.update({
    objetivo_cumprido: true,
    data_cumprimento: agora
  }, { transaction });

  const tipo = obj.tipo_objetivo;
  const lang = consultor?.idioma_preferencial || 'pt';

  const tipoNome = tipo?.traducao_titulo?.[lang] || tipo?.traducao_titulo?.pt || 'Objetivo Pessoal';
  const descricaoObj = descreverMetaObjetivo(obj, lang);

  // 1. Notificação na base de dados (e WebSocket/Push integrados)
  try {
    await criarENotificar({
      id_user_alvo_notificacao: obj.id_utilizador,
      codigo_tipo: 'sistema_alerta',
      titulo: {
        pt: `🎯 Objetivo Cumprido: ${tipo?.traducao_titulo?.pt || tipoNome}`,
        en: `🎯 Goal Achieved: ${tipo?.traducao_titulo?.en || tipoNome}`,
        es: `🎯 Objetivo Cumplido: ${tipo?.traducao_titulo?.es || tipoNome}`
      },
      mensagem: {
        pt: `Parabéns! Concluiu com sucesso o seu objetivo pessoal: ${descreverMetaObjetivo(obj, 'pt')}.`,
        en: `Congratulations! You successfully achieved your personal goal: ${descreverMetaObjetivo(obj, 'en')}.`,
        es: `¡Felicidades! Completó con éxito su objetivo personal: ${descreverMetaObjetivo(obj, 'es')}.`
      },
      parametros: {
        id_objetivo: obj.id_objetivo,
        id_tipo_objetivo: obj.id_tipo_objetivo,
        codigo_tipo: tipo?.codigo_tipo
      },
      transaction
    });
  } catch (errNotif) {
    console.error(`[Objetivos] Erro ao criar notificação de objetivo cumprido:`, errNotif.message);
  }

  // 2. Emissão WebSocket dedicada para celebração visual no frontend
  emitToRoom(`user_${obj.id_utilizador}`, 'novo_objetivo_cumprido', {
    id_objetivo: obj.id_objetivo,
    codigo_tipo: tipo?.codigo_tipo,
    tipo_nome: tipoNome,
    descricao: descricaoObj,
    data_cumprimento: agora
  });

  // 3. Envio de Email i18n
  if (consultor?.email) {
    try {
      const { text, html, assunto } = templateObjetivoCumprido({
        nome: `${consultor.nome || ''} ${consultor.apelido || ''}`.trim() || 'Consultor',
        tipoNome,
        descricaoObjetivo: descricaoObj,
        lang
      });
      await enviarEmail(consultor.email, assunto, text, html);
    } catch (errMail) {
      console.error(`[Objetivos] Erro ao enviar email de objetivo cumprido para ${consultor.email}:`, errMail.message);
    }
  }

  console.log(`[Objetivos] Objetivo "${tipoNome}" cumprido pelo consultor ${obj.id_utilizador}.`);
}

/**
 * Disparo reativo: verifica todos os objetivos pendentes de um consultor específico
 * Chamado logo após a aprovação de candidatura
 */
async function verificarObjetivosConsultor(idUtilizador, transaction = null) {
  if (!idUtilizador) return;

  try {
    const objetivos = await ObjetivoConsultor.findAll({
      where: {
        id_utilizador: idUtilizador,
        objetivo_cumprido: false,
        objetivo_expirado: false,
        objetivoAtivo: true
      },
      include: [
        {
          model: TipoObjetivo,
          as: 'tipo_objetivo',
          include: [
            { model: TraducaoConteudo, as: 'traducao_titulo' },
            { model: TraducaoConteudo, as: 'traducao_descricao' }
          ]
        },
        {
          model: Utilizador,
          as: 'consultor'
        }
      ],
      transaction
    });

    if (!objetivos || objetivos.length === 0) return;

    for (const obj of objetivos) {
      const { atingiu } = await avaliarObjetivo(obj, transaction);
      if (atingiu) {
        await celebrarObjetivoCumprido(obj, obj.consultor, transaction);
      }
    }
  } catch (error) {
    console.error(`[Objetivos] Erro ao verificar objetivos do consultor ${idUtilizador}:`, error.message);
  }
}

/**
 * Disparo periódico do daemon (sincronizado com SLA):
 * 1. Avalia se algum objetivo foi atingido
 * 2. Verifica se objetivos com prazo expiraram
 * 3. Envia avisos de prazo a expirar (2 dias, 1 semana, 15 dias)
 * 4. Envia acompanhamentos semanais para objetivos do Tipo 2
 */
async function verificarTodosObjetivos() {
  try {
    console.log('[Objetivos] A executar verificação periódica de objetivos...');

    const objetivos = await ObjetivoConsultor.findAll({
      where: {
        objetivo_cumprido: false,
        objetivo_expirado: false,
        objetivoAtivo: true
      },
      include: [
        {
          model: TipoObjetivo,
          as: 'tipo_objetivo',
          include: [
            { model: TraducaoConteudo, as: 'traducao_titulo' },
            { model: TraducaoConteudo, as: 'traducao_descricao' }
          ]
        },
        {
          model: Utilizador,
          as: 'consultor'
        }
      ]
    });

    if (!objetivos || objetivos.length === 0) {
      console.log('[Objetivos] Nenhum objetivo pendente para verificação.');
      return;
    }

    const agora = new Date();

    for (const obj of objetivos) {
      const consultor = obj.consultor;
      const lang = consultor?.idioma_preferencial || 'pt';
      const tipo = obj.tipo_objetivo;
      const tipoNome = tipo?.traducao_titulo?.[lang] || tipo?.traducao_titulo?.pt || 'Objetivo Pessoal';
      const descricaoObj = descreverMetaObjetivo(obj, lang);
      const nomeConsultor = `${consultor?.nome || ''} ${consultor?.apelido || ''}`.trim() || 'Consultor';

      // 1. Avaliar se o objetivo foi cumprido
      const avaliacao = await avaliarObjetivo(obj);
      if (avaliacao.atingiu) {
        await celebrarObjetivoCumprido(obj, consultor);
        continue;
      }

      // 2. Objetivos COM PRAZO (Tipos 1, 3, 4, 5)
      if (tipo?.tem_prazo && obj.data_limite_objetivo) {
        const dataLimite = new Date(obj.data_limite_objetivo);

        // a) Prazo expirado
        if (agora > dataLimite) {
          await obj.update({
            objetivo_expirado: true
          });

          const dataLimiteFmt = dataLimite.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-PT');

          // Notificação de expiração
          try {
            await criarENotificar({
              id_user_alvo_notificacao: obj.id_utilizador,
              codigo_tipo: 'sistema_alerta',
              titulo: {
                pt: `⚠️ Prazo Expirado: ${tipo?.traducao_titulo?.pt || tipoNome}`,
                en: `⚠️ Deadline Expired: ${tipo?.traducao_titulo?.en || tipoNome}`,
                es: `⚠️ Plazo Expirado: ${tipo?.traducao_titulo?.es || tipoNome}`
              },
              mensagem: {
                pt: `O prazo para o objetivo "${descreverMetaObjetivo(obj, 'pt')}" terminou em ${dataLimiteFmt}.`,
                en: `The deadline for goal "${descreverMetaObjetivo(obj, 'en')}" ended on ${dataLimiteFmt}.`,
                es: `El plazo para el objetivo "${descreverMetaObjetivo(obj, 'es')}" finalizó el ${dataLimiteFmt}.`
              },
              parametros: {
                id_objetivo: obj.id_objetivo,
                expirado: true
              }
            });
          } catch (errNotif) {
            console.error('[Objetivos] Erro ao notificar expiração:', errNotif.message);
          }

          // Email de expiração
          if (consultor?.email) {
            try {
              const { text, html, assunto } = templateObjetivoExpirado({
                nome: nomeConsultor,
                tipoNome,
                descricaoObjetivo: descricaoObj,
                dataLimite: dataLimiteFmt,
                lang
              });
              await enviarEmail(consultor.email, assunto, text, html);
            } catch (errMail) {
              console.error(`[Objetivos] Erro ao enviar email de expiração para ${consultor.email}:`, errMail.message);
            }
          }

          console.log(`[Objetivos] Objetivo ${obj.id_objetivo} do consultor ${obj.id_utilizador} marcado como expirado.`);
          continue;
        }

        // b) Aviso de prazo a aproximar-se do fim
        // Apenas avisar se ainda não foi notificado do aviso prévio (consultor_notificado = false)
        if (!obj.consultor_notificado) {
          const diffMs = dataLimite.getTime() - agora.getTime();
          const diasRestantes = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          const unidade = obj.unidade_prazo; // 'dias' | 'semanas' | 'meses'

          let deveAvisar = false;
          let tempoRestanteTexto = '';

          if (unidade === 'dias' && diasRestantes <= 2 && diasRestantes > 0) {
            deveAvisar = true;
            tempoRestanteTexto = lang === 'en' ? `${diasRestantes} days` : lang === 'es' ? `${diasRestantes} días` : `${diasRestantes} dias`;
          } else if (unidade === 'semanas' && diasRestantes <= 7 && diasRestantes > 0) {
            deveAvisar = true;
            tempoRestanteTexto = lang === 'en' ? `${diasRestantes} days` : lang === 'es' ? `${diasRestantes} días` : `${diasRestantes} dias`;
          } else if (unidade === 'meses' && diasRestantes <= 15 && diasRestantes > 0) {
            deveAvisar = true;
            tempoRestanteTexto = lang === 'en' ? `${diasRestantes} days` : lang === 'es' ? `${diasRestantes} días` : `${diasRestantes} dias`;
          }

          if (deveAvisar) {
            await obj.update({
              consultor_notificado: true,
              data_ultima_notificacao: agora,
              quantidade_notificacao: (obj.quantidade_notificacao || 0) + 1
            });

            const dataLimiteFmt = dataLimite.toLocaleDateString(lang === 'en' ? 'en-US' : lang === 'es' ? 'es-ES' : 'pt-PT');

            // Notificação na plataforma
            try {
              await criarENotificar({
                id_user_alvo_notificacao: obj.id_utilizador,
                codigo_tipo: 'sistema_alerta',
                titulo: {
                  pt: `⏰ Prazo a Terminar: ${tipo?.traducao_titulo?.pt || tipoNome}`,
                  en: `⏰ Deadline Approaching: ${tipo?.traducao_titulo?.en || tipoNome}`,
                  es: `⏰ Plazo por Vencer: ${tipo?.traducao_titulo?.es || tipoNome}`
                },
                mensagem: {
                  pt: `Faltam ${tempoRestanteTexto} para terminar o prazo do seu objetivo: ${descreverMetaObjetivo(obj, 'pt')}.`,
                  en: `${tempoRestanteTexto} remaining until the deadline for your goal: ${descreverMetaObjetivo(obj, 'en')}.`,
                  es: `Quedan ${tempoRestanteTexto} para finalizar el plazo de su objetivo: ${descreverMetaObjetivo(obj, 'es')}.`
                },
                parametros: {
                  id_objetivo: obj.id_objetivo,
                  dias_restantes: diasRestantes
                }
              });
            } catch (errNotif) {
              console.error('[Objetivos] Erro ao notificar aviso de prazo:', errNotif.message);
            }

            // Email com template i18n
            if (consultor?.email) {
              try {
                const { text, html, assunto } = templateObjetivoAvisoPrazo({
                  nome: nomeConsultor,
                  tipoNome,
                  descricaoObjetivo: descricaoObj,
                  tempoRestanteTexto,
                  dataLimite: dataLimiteFmt,
                  lang
                });
                await enviarEmail(consultor.email, assunto, text, html);
              } catch (errMail) {
                console.error(`[Objetivos] Erro ao enviar email de aviso de prazo para ${consultor.email}:`, errMail.message);
              }
            }

            console.log(`[Objetivos] Aviso de prazo enviado ao consultor ${obj.id_utilizador} para objetivo ${obj.id_objetivo}.`);
          }
        }
      }

      // 3. Objetivos SEM PRAZO (Tipo 2 - Diversidade)
      if (!tipo?.tem_prazo) {
        const dataInicio = new Date(obj.data_inicio_objetivo);
        const diasDecorridos = Math.floor((agora.getTime() - dataInicio.getTime()) / (1000 * 60 * 60 * 24));
        const ciclosEsperados = Math.floor(diasDecorridos / 7);
        const notificacoesFeitas = obj.quantidade_notificacao || 0;

        // Se já passou pelo menos 7 dias e ainda não foi notificado para este ciclo semanal
        if (diasDecorridos >= 7 && notificacoesFeitas < ciclosEsperados) {
          await obj.update({
            consultor_notificado: true,
            data_ultima_notificacao: agora,
            quantidade_notificacao: notificacoesFeitas + 1
          });

          // Notificação na plataforma
          try {
            await criarENotificar({
              id_user_alvo_notificacao: obj.id_utilizador,
              codigo_tipo: 'sistema_alerta',
              titulo: {
                pt: `📊 Acompanhamento: ${tipo?.traducao_titulo?.pt || tipoNome}`,
                en: `📊 Follow-up: ${tipo?.traducao_titulo?.en || tipoNome}`,
                es: `📊 Seguimiento: ${tipo?.traducao_titulo?.es || tipoNome}`
              },
              mensagem: {
                pt: `Passaram ${diasDecorridos} dias desde o início do seu objetivo. Progresso: ${avaliacao.progressoAtual} de ${avaliacao.metaTotal}.`,
                en: `${diasDecorridos} days have passed since starting your goal. Progress: ${avaliacao.progressoAtual} of ${avaliacao.metaTotal}.`,
                es: `Han transcurrido ${diasDecorridos} días desde el inicio de su objetivo. Progreso: ${avaliacao.progressoAtual} de ${avaliacao.metaTotal}.`
              },
              parametros: {
                id_objetivo: obj.id_objetivo,
                dias_decorridos: diasDecorridos
              }
            });
          } catch (errNotif) {
            console.error('[Objetivos] Erro ao enviar notificação semanal de progresso:', errNotif.message);
          }

          // Email semanal com template i18n
          if (consultor?.email) {
            try {
              const { text, html, assunto } = templateObjetivoProgressoSemanal({
                nome: nomeConsultor,
                tipoNome,
                descricaoObjetivo: descricaoObj,
                diasDecorridos,
                progressoAtual: avaliacao.progressoAtual,
                metaTotal: avaliacao.metaTotal,
                lang
              });
              await enviarEmail(consultor.email, assunto, text, html);
            } catch (errMail) {
              console.error(`[Objetivos] Erro ao enviar email semanal para ${consultor.email}:`, errMail.message);
            }
          }

          console.log(`[Objetivos] Acompanhamento semanal (#${notificacoesFeitas + 1}) enviado ao consultor ${obj.id_utilizador}.`);
        }
      }
    }
  } catch (error) {
    console.error('[Objetivos] Erro durante verificação periódica:', error);
  }
}

module.exports = {
  verificarObjetivosConsultor,
  verificarTodosObjetivos,
  avaliarObjetivo,
  descreverMetaObjetivo
};
