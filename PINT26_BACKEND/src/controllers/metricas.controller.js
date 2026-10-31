const Utilizador = require('../models/utilizador.model');
const Badge = require('../models/badge.model');
const { Op } = require('sequelize');
const ConfiguracaoSLA = require('../models/configuracao_sla.model');
const { reprogramarDaemonExpiracao } = require('../services/expiracao.service');
const Candidatura = require('../models/candidatura_badge.model');
const CandidaturaEspecial = require('../models/candidatura_especial.model');
const ConquistaAtribuida = require('../models/conquista_atribuida.model');
const Certificado = require('../models/certificado.model');
const AcaoCandidatura = require('../models/acao_candidatura.model');
const sequelize = require('../config/database');
const { getSllServiceLineId, checkSllScope } = require('../services/scope_check');
const Area = require('../models/area.model');
const LearningPath = require('../models/learning_path.model');
const ServiceLine = require('../models/service_line.model');
const NivelArea = require('../models/nivel.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const validaIDInteiro = require('../services/valida_id_inteiro');
const PerfilUtilizador = require('../models/perfil_utilizador.model');
const RenovacaoBadge = require('../models/renovacao_badge.model');
const { PERFIS } = require('../middlewares/permissao.middleware');

const controllersMetricas = {};

controllersMetricas.utilizadoresTotal = async (req, res) => {
    try {
        const activeRole = req.activeRole;
        const userId = req.auth?.sub || req.auth?.id_utilizador;

        let where = { conta_ativa: true, conta_bloqueada: false };

        if (activeRole === 2) {
            // SLL: filtra apenas consultores pertencentes à Service Line que lidera
            const slId = await getSllServiceLineId(userId);
            if (!slId) {
                return res.status(200).json({
                    success: true,
                    message: "Total de consultores na Service Line",
                    data: { total: 0 }
                });
            }

            const areas = await Area.findAll({ where: { id_service_line: slId }, attributes: ['id_area'] });
            const areasIds = areas.map(a => a.id_area);

            const perfisConsultores = await PerfilUtilizador.findAll({
                where: { id_perfil: PERFIS.CONSULTOR, relacionamentoAtivo: true },
                attributes: ['id_utilizador']
            });
            const consultoresIds = perfisConsultores.map(p => p.id_utilizador);

            where = {
                id_utilizador: { [Op.in]: consultoresIds },
                conta_ativa: true,
                conta_bloqueada: false,
                [Op.or]: [
                    { id_sl: slId },
                    ...(areasIds.length > 0 ? [{ id_area: { [Op.in]: areasIds } }] : [])
                ]
            };
        }

        const total = await Utilizador.count({ where });
        res.status(200).json({
            success: true,
            message: "Total de utilizadores",
            data: { total }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro ao obter total de utilizadores",
            error: error.message
        });
    }
};

controllersMetricas.utilizadoresComparativoMesAnterior = async (req, res) => {
    try {
        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        
        // Data início e fim do mês atual
        const inicioMesAtual = new Date(anoAtual, mesAtual, 1);
        const fimMesAtual = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59);
        
        // Data início e fim do mês anterior
        let mesAnterior = mesAtual - 1;
        let anoMesAnterior = anoAtual;
        if (mesAnterior < 0) {
            mesAnterior = 11;
            anoMesAnterior--;
        }
        const inicioMesAnterior = new Date(anoMesAnterior, mesAnterior, 1);
        const fimMesAnterior = new Date(anoMesAnterior, mesAnterior + 1, 0, 23, 59, 59);

        // Contagem de utilizadores registados no mês atual
        const novosMesAtual = await Utilizador.count({
            where: {
                data_registo: {
                    [Op.between]: [inicioMesAnterior, fimMesAtual] // Usaremos JS filter depois ou query direta
                }
            }
        });
        
        // Forma correta com between exato para postgres
        const countAtual = await Utilizador.count({
            where: {
                data_registo: {
                    [Op.gte]: inicioMesAtual,
                    [Op.lte]: fimMesAtual
                }
            }
        });

        const countAnterior = await Utilizador.count({
            where: {
                data_registo: {
                    [Op.gte]: inicioMesAnterior,
                    [Op.lte]: fimMesAnterior
                }
            }
        });

        let percentagem = 0;
        if (countAnterior > 0) {
            percentagem = ((countAtual - countAnterior) / countAnterior) * 100;
        } else if (countAtual > 0) {
            percentagem = 100; 
        }

        res.status(200).json({
            success: true,
            message: "Comparativo de utilizadores",
            data: {
                mes_atual: countAtual,
                mes_anterior: countAnterior,
                percentagem: Math.round(percentagem * 100) / 100
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro ao calcular comparativo de utilizadores",
            error: error.message
        });
    }
};

controllersMetricas.badgesTotal = async (req, res) => {
    try {
        const total = await Badge.count();
        res.status(200).json({
            success: true,
            message: "Total de badges",
            data: { total }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro ao obter total de badges",
            error: error.message
        });
    }
};

controllersMetricas.badgesComparativoMesAnterior = async (req, res) => {
    try {
        const hoje = new Date();
        const mesAtual = hoje.getMonth();
        const anoAtual = hoje.getFullYear();
        
        // Data início e fim do mês atual
        const inicioMesAtual = new Date(anoAtual, mesAtual, 1);
        const fimMesAtual = new Date(anoAtual, mesAtual + 1, 0, 23, 59, 59);
        
        // Data início e fim do mês anterior
        let mesAnterior = mesAtual - 1;
        let anoMesAnterior = anoAtual;
        if (mesAnterior < 0) {
            mesAnterior = 11;
            anoMesAnterior--;
        }
        const inicioMesAnterior = new Date(anoMesAnterior, mesAnterior, 1);
        const fimMesAnterior = new Date(anoMesAnterior, mesAnterior + 1, 0, 23, 59, 59);

        const countAtual = await Badge.count({
            where: {
                createdAt: {
                    [Op.gte]: inicioMesAtual,
                    [Op.lte]: fimMesAtual
                }
            }
        });

        const countAnterior = await Badge.count({
            where: {
                createdAt: {
                    [Op.gte]: inicioMesAnterior,
                    [Op.lte]: fimMesAnterior
                }
            }
        });

        let percentagem = 0;
        if (countAnterior > 0) {
            percentagem = ((countAtual - countAnterior) / countAnterior) * 100;
        } else if (countAtual > 0) {
            percentagem = 100; 
        }

        res.status(200).json({
            success: true,
            message: "Comparativo de badges",
            data: {
                mes_atual: countAtual,
                mes_anterior: countAnterior,
                percentagem: Math.round(percentagem * 100) / 100
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro ao calcular comparativo de badges",
            error: error.message
        });
    }
};

controllersMetricas.getSlaConfig = async (req, res) => {
    try {
        const config = await ConfiguracaoSLA.findOne();
        res.status(200).json({
            success: true,
            message: "Configurações de SLA recuperadas",
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro ao obter configurações de SLA",
            error: error.message
        });
    }
};

controllersMetricas.updateSlaConfig = async (req, res) => {
    try {
        const { sla_tm_horas, sla_sll_horas, enviar_email_pendentes, aviso_email_horas_restantes, notificar_admin_sll_expirado, dias_badge_expirando, intervalo_verificacao_badge_expirado } = req.body;
        
        // Validação estrita de dias_badge_expirando se fornecido
        if (dias_badge_expirando !== undefined) {
            const diasInt = validaIDInteiro(dias_badge_expirando);
            if (diasInt === null || diasInt < 1 || diasInt > 1825) {
                return res.status(400).json({
                    success: false,
                    message: "O campo dias_badge_expirando deve ser um número inteiro entre 1 e 1825."
                });
            }
        }

        // Validação estrita de intervalo_verificacao_badge_expirado se fornecido
        if (intervalo_verificacao_badge_expirado !== undefined) {
            const intervaloInt = validaIDInteiro(intervalo_verificacao_badge_expirado);
            if (intervaloInt === null || intervaloInt < 2 || intervaloInt > 24) {
                return res.status(400).json({
                    success: false,
                    message: "O campo intervalo_verificacao_badge_expirado deve ser um número inteiro entre 2 e 24."
                });
            }
        }

        let config = await ConfiguracaoSLA.findOne();
        if (!config) {
            config = await ConfiguracaoSLA.create({
                sla_tm_horas: sla_tm_horas !== undefined ? sla_tm_horas : 48,
                sla_sll_horas: sla_sll_horas !== undefined ? sla_sll_horas : 48,
                enviar_email_pendentes: enviar_email_pendentes !== undefined ? enviar_email_pendentes : true,
                aviso_email_horas_restantes: aviso_email_horas_restantes !== undefined ? aviso_email_horas_restantes : 12,
                notificar_admin_sll_expirado: notificar_admin_sll_expirado !== undefined ? notificar_admin_sll_expirado : true,
                dias_badge_expirando: dias_badge_expirando !== undefined ? parseInt(dias_badge_expirando, 10) : 30,
                intervalo_verificacao_badge_expirado: intervalo_verificacao_badge_expirado !== undefined ? parseInt(intervalo_verificacao_badge_expirado, 10) : 24
            });
        } else {
            const intervaloAnterior = config.intervalo_verificacao_badge_expirado;

            await config.update({
                sla_tm_horas: sla_tm_horas !== undefined ? sla_tm_horas : config.sla_tm_horas,
                sla_sll_horas: sla_sll_horas !== undefined ? sla_sll_horas : config.sla_sll_horas,
                enviar_email_pendentes: enviar_email_pendentes !== undefined ? enviar_email_pendentes : config.enviar_email_pendentes,
                aviso_email_horas_restantes: aviso_email_horas_restantes !== undefined ? aviso_email_horas_restantes : config.aviso_email_horas_restantes,
                notificar_admin_sll_expirado: notificar_admin_sll_expirado !== undefined ? notificar_admin_sll_expirado : config.notificar_admin_sll_expirado,
                dias_badge_expirando: dias_badge_expirando !== undefined ? parseInt(dias_badge_expirando, 10) : config.dias_badge_expirando,
                intervalo_verificacao_badge_expirado: intervalo_verificacao_badge_expirado !== undefined ? parseInt(intervalo_verificacao_badge_expirado, 10) : config.intervalo_verificacao_badge_expirado
            });

            // Se o intervalo de verificação mudou, reprogramar o daemon
            if (intervalo_verificacao_badge_expirado !== undefined && parseInt(intervalo_verificacao_badge_expirado, 10) !== intervaloAnterior) {
              try {
                await reprogramarDaemonExpiracao();
              } catch (errDaemon) {
                console.error('Erro ao reprogramar daemon de expiração (não-crítico):', errDaemon.message);
              }
            }
        }

        res.status(200).json({
            success: true,
            message: "Configurações de SLA atualizadas com sucesso",
            data: config
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro ao atualizar configurações de SLA",
            error: error.message
        });
    }
};

/**
 * Executa manualmente a verificação de expiração de badges e sincronização retroativa.
 * Apenas acessível a administradores.
 */
controllersMetricas.verificarExpiracoesManual = async (req, res) => {
    try {
        const { verificarExpiracoes, sincronizarAlertasRetroativos } = require('../services/expiracao.service');
        
        console.log('[Expiração] Execução manual acionada por Admin.');
        
        // Executa a sincronização de eventuais alertas em falta
        await sincronizarAlertasRetroativos();
        
        // Executa a verificação e disparo das notificações
        await verificarExpiracoes();
        
        res.status(200).json({
            success: true,
            message: "Verificação de expiração de badges executada com sucesso."
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro ao executar verificação de expiração manual.",
            error: error.message
        });
    }
};

controllersMetricas.getDashboardTmMetrics = async (req, res) => {
    try {
        const loggedInUserId = req.auth?.sub || req.auth?.id_utilizador;
        
        // 1. Validações Pendentes (estado = 2: Submetida / Pendente TM)
        const pendingCount = await Candidatura.count({
            where: { id_estado_candidatura: 2 }
        });

        // 2. Validados Hoje (TM aprovou ou rejeitou hoje)
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const validatedToday = await AcaoCandidatura.count({
            where: {
                id_utilizador: loggedInUserId,
                tipo_acao_candidatura: [3, 4], // 3: Rejeitada TM, 4: Pré-Aprovada TM
                data_acao_candidatura: {
                    [Op.gte]: todayStart
                }
            }
        });

        // 3. Tempo Médio de Resposta e SLA Cumprimento
        const configSla = await ConfiguracaoSLA.findOne();
        const slaTmHoras = configSla ? configSla.sla_tm_horas : 48;

        const candidaturas = await Candidatura.findAll({
            include: [{
                model: AcaoCandidatura,
                as: 'acoes',
                where: {
                    tipo_acao_candidatura: [2, 3, 4] // 2: Submetida, 3: Rejeitada TM, 4: Pré-Aprovada TM
                },
                required: true
            }],
            order: [
                ['id_candidatura', 'ASC'],
                [{ model: AcaoCandidatura, as: 'acoes' }, 'data_acao_candidatura', 'ASC']
            ]
        });

        let totalHours = 0;
        let cycleCount = 0;
        let compliantCount = 0;

        candidaturas.forEach(cand => {
            let lastSubmissionTime = null;
            if (cand.acoes && cand.acoes.length > 0) {
                cand.acoes.forEach(acao => {
                    if (acao.tipo_acao_candidatura === 2) {
                        lastSubmissionTime = new Date(acao.data_acao_candidatura);
                    } else if ((acao.tipo_acao_candidatura === 3 || acao.tipo_acao_candidatura === 4) && lastSubmissionTime) {
                        if (acao.id_utilizador === loggedInUserId) {
                            const end = new Date(acao.data_acao_candidatura);
                            const diffMs = end - lastSubmissionTime;
                            const diffHours = diffMs / (1000 * 60 * 60);

                            totalHours += diffHours;
                            cycleCount++;
                            if (diffHours <= slaTmHoras) {
                                compliantCount++;
                            }
                        }
                        lastSubmissionTime = null;
                    }
                });
            }
        });

        const avgResponseTime = cycleCount > 0 
            ? `${Math.round(totalHours / cycleCount)}h` 
            : '—';

        const slaCompliance = cycleCount > 0 
            ? `${Math.round((compliantCount / cycleCount) * 100)}%` 
            : '100%';

        res.status(200).json({
            success: true,
            message: "Métricas do dashboard do TM recuperadas",
            data: {
                pendingPreApprovals: pendingCount,
                validatedToday,
                avgResponseTime,
                slaCompliance
            }
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Erro ao obter métricas do dashboard do TM",
            error: error.message
        });
    }
};

controllersMetricas.getBadgesConquistadosMes = async (req, res) => {
    try {
        const activeRole = req.activeRole;
        const userId = req.auth?.sub || req.auth?.id_utilizador;

        // Sem filtro de data — devolve o total acumulado de badges atribuídos (estado 4) na SL
        const where = {
            candidaturaAtiva: true
        };

        if (activeRole === 2) {
            const slId = await getSllServiceLineId(userId);
            if (!slId) return res.status(200).json({ success: true, data: { percentagem: 0, concluidas: 0, total: 0 } });
            where['$badge.nivel_area.area.id_service_line$'] = slId;
        }

        const candidaturas = await Candidatura.findAll({
            where,
            include: [{
                association: 'badge',
                include: [{ association: 'nivel_area', include: [{ association: 'area' }] }]
            }]
        });

        const totalCandidaturas = candidaturas.length;
        const concluidas = candidaturas.filter(c => c.id_estado_candidatura === 4).length;
        const percentagem = totalCandidaturas > 0 ? (concluidas / totalCandidaturas) * 100 : 0;

        return res.status(200).json({
            success: true,
            data: { percentagem: Math.round(percentagem * 100) / 100, concluidas, total: totalCandidaturas }
        });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * Retorna contagens de candidaturas pendentes.
 */
controllersMetricas.getCandidaturasEstadoContagem = async (req, res) => {
    try {
        const activeRole = req.activeRole;
        const userId = req.auth?.sub || req.auth?.id_utilizador;
        const where = { candidaturaAtiva: true };

        // Se for SLL (2), restringe apenas à sua Service Line
        if (activeRole === 2) {
            const slId = await getSllServiceLineId(userId);
            if (!slId) {
                return res.status(200).json({
                    success: true,
                    data: { total_in_progress: 0, total_in_validation: 0 }
                });
            }
            where['$badge.nivel_area.area.id_service_line$'] = slId;
        }

        // Procura todas as candidaturas ativas que combinem com a restrição
        const candidaturas = await Candidatura.findAll({
            where,
            include: [{
                association: 'badge',
                include: [{
                    association: 'nivel_area',
                    include: [{ association: 'area' }]
                }]
            }]
        });

        const contagem = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

        candidaturas.forEach(cand => {
            const estado = cand.id_estado_candidatura;
            if (contagem[estado] !== undefined) {
                contagem[estado]++;
            }
        });

        return res.status(200).json({
            success: true,
            message: "Contagem de candidaturas pendentes recuperada com sucesso.",
            data: {
                "1": contagem[1],
                "2": contagem[2],
                "3": contagem[3],
                "4": contagem[4],
                "5": contagem[5],
                total_in_progress: contagem[1] + contagem[2] + contagem[3],
                total_in_validation: contagem[3]
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Erro ao calcular contagem de candidaturas por estado.",
            error: error.message
        });
    }
};

/**
 * GET /metricas/sll-dashboard/ranking-geral
 * GET /metricas/sll-dashboard/top-consultor
 * Endpoint exclusivo para o Dashboard SLL.
 * Filtra estritamente pelos consultores da Service Line liderada pelo SLL autenticado.
 * Se o utilizador não liderar nenhuma SL (ex: John Doe), retorna lista vazia [].
 */
controllersMetricas.getRankingSll = async (req, res) => {
    try {
        const userId = req.auth?.sub || req.auth?.id_utilizador;
        const lang = req.lang || 'pt';

        // 1. Obter a Service Line que o SLL autenticado lidera
        let slId = await getSllServiceLineId(userId);
        if (!slId && req.query.id_service_line) {
            slId = Number(req.query.id_service_line);
        }

        if (!slId) {
            return res.status(200).json({ success: true, data: [] });
        }

        const sl = await ServiceLine.findByPk(slId, {
            include: [{ association: 'traducao_service_line' }]
        });
        const nomeSL = sl?.traducao_service_line?.[lang] || sl?.traducao_service_line?.pt || '';

        // 2. Buscar todas as áreas da Service Line do SLL
        const areas = await Area.findAll({
            where: { id_service_line: slId },
            attributes: ['id_area']
        });
        const areasIds = areas.map(a => a.id_area);

        // 3. Buscar IDs de utilizadores com perfil Consultor (id_perfil = 4) ativo
        const perfisConsultores = await PerfilUtilizador.findAll({
            where: { id_perfil: PERFIS.CONSULTOR, relacionamentoAtivo: true },
            attributes: ['id_utilizador']
        });
        const consultoresIds = perfisConsultores.map(p => p.id_utilizador);

        // 4. Buscar todos os consultores ativos pertencentes a esta Service Line (por id_sl ou por id_area)
        const whereConsultores = {
            id_utilizador: { [Op.in]: consultoresIds },
            conta_ativa: true,
            conta_bloqueada: false,
            [Op.or]: [
                { id_sl: slId },
                ...(areasIds.length > 0 ? [{ id_area: { [Op.in]: areasIds } }] : [])
            ]
        };

        const consultores = await Utilizador.findAll({
            where: whereConsultores,
            attributes: ['id_utilizador', 'nome', 'apelido', 'avatar', 'email', 'id_sl']
        });

        if (consultores.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        const slConsultoresIds = consultores.map(c => c.id_utilizador);
        const userPoints = {};

        // 5. Inicializar a pontuação de todos os consultores da SL a 0
        for (const c of consultores) {
            userPoints[c.id_utilizador] = {
                consultor: {
                    id_utilizador: c.id_utilizador,
                    nome: c.nome,
                    apelido: c.apelido,
                    avatar: c.avatar,
                    email: c.email,
                    id_sl: slId,
                    nome_sl: nomeSL
                },
                pontos: 0,
                last_approved: null
            };
        }

        // 6. Buscar todas as candidaturas aprovadas (estado 4) dos consultores da SL
        const candidaturas = await Candidatura.findAll({
            where: {
                candidaturaAtiva: true,
                id_estado_candidatura: 4,
                id_utilizador: { [Op.in]: slConsultoresIds }
            },
            include: [
                {
                    association: 'badge'
                }
            ]
        });

        // 7. Somar os pontos de badges aprovados
        candidaturas.forEach(cand => {
            const uid = cand.id_utilizador;
            if (userPoints[uid]) {
                userPoints[uid].pontos += (cand.badge?.pontos || 0);
                if (!userPoints[uid].last_approved || cand.data_encerramento_candidatura > userPoints[uid].last_approved) {
                    userPoints[uid].last_approved = cand.data_encerramento_candidatura;
                }
            }
        });

        // 8. Somar os pontos de conquistas especiais (Badges Especiais) atribuídas aos consultores da SL
        const conquistasAtribuidas = await ConquistaAtribuida.findAll({
            where: {
                id_utilizador: { [Op.in]: slConsultoresIds },
                atribuicaoAtiva: true
            }
        });

        conquistasAtribuidas.forEach(ca => {
            const uid = ca.id_utilizador;
            if (userPoints[uid]) {
                userPoints[uid].pontos += (ca.pontos_conquistados || 0);
                if (!userPoints[uid].last_approved || ca.data_atribuicao_conquista > userPoints[uid].last_approved) {
                    userPoints[uid].last_approved = ca.data_atribuicao_conquista;
                }
            }
        });

        // 9. Somar os pontos de renovações de badges concluídas dos consultores da SL
        const renovacoesSL = await RenovacaoBadge.findAll({
            where: {
                renovacaoAtiva: true,
                renovacao_aprovada: true,
                data_renovacao: { [Op.ne]: null },
                '$candidatura.id_utilizador$': { [Op.in]: slConsultoresIds }
            },
            include: [{
                association: 'candidatura'
            }]
        });

        renovacoesSL.forEach(ren => {
            const uid = ren.candidatura?.id_utilizador;
            if (uid && userPoints[uid]) {
                userPoints[uid].pontos += (ren.pontos_renovacao || 0);
                if (!userPoints[uid].last_approved || ren.data_renovacao > userPoints[uid].last_approved) {
                    userPoints[uid].last_approved = ren.data_renovacao;
                }
            }
        });

        // 10. Ordenar e atribuir posições relativas à Service Line (1..N)
        const ranking = Object.values(userPoints).sort((a, b) => {
            if (b.pontos !== a.pontos) return b.pontos - a.pontos;
            if (a.last_approved && b.last_approved) {
                return new Date(a.last_approved).getTime() - new Date(b.last_approved).getTime();
            }
            if (a.last_approved) return -1;
            if (b.last_approved) return 1;
            return (a.consultor?.nome || '').localeCompare(b.consultor?.nome || '');
        }).map((item, index) => ({
            posicao: index + 1,
            ...item
        }));

        return res.status(200).json({ success: true, data: ranking });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

controllersMetricas.getTopConsultorSL = controllersMetricas.getRankingSll;

/**
 * GET /metricas/ranking-geral
 * Endpoint universal de Ranking Geral da Plataforma.
 * Disponível para todos os perfis (Admin, SLL, TM e Consultor).
 * Não aplica NENHUM filtro de Service Line ou perfil do utilizador requisitante.
 * Retorna todos os consultores ativos da organização com pontuação e posição global.
 */
controllersMetricas.getRankingGeral = async (req, res) => {
    try {
        const lang = req.lang || 'pt';
        const userPoints = {};

        const consultorAttributes = ['id_utilizador', 'nome', 'apelido', 'avatar', 'email', 'id_sl'];
        const consultorInclude = [{
            association: 'service_line',
            include: [{ association: 'traducao_service_line' }]
        }];

        const formatConsultor = (u) => {
            if (!u) return null;
            return {
                id_utilizador: u.id_utilizador,
                nome: u.nome,
                apelido: u.apelido,
                avatar: u.avatar,
                email: u.email,
                id_sl: u.id_sl || null,
                nome_sl: u.service_line?.traducao_service_line?.[lang] || u.service_line?.traducao_service_line?.pt || null
            };
        };

        // 1. Buscar todas as candidaturas aprovadas (estado 4) na plataforma
        const candidaturas = await Candidatura.findAll({
            where: {
                candidaturaAtiva: true,
                id_estado_candidatura: 4
            },
            include: [
                {
                    association: 'badge',
                    include: [{ association: 'nivel_area', include: [{ association: 'area' }] }]
                },
                {
                    association: 'consultor',
                    attributes: consultorAttributes,
                    include: consultorInclude
                }
            ]
        });

        candidaturas.forEach(cand => {
            const uid = cand.id_utilizador;
            if (!userPoints[uid]) {
                userPoints[uid] = {
                    consultor: formatConsultor(cand.consultor),
                    pontos: 0,
                    last_approved: cand.data_encerramento_candidatura
                };
            }
            userPoints[uid].pontos += (cand.badge?.pontos || 0);
            if (cand.data_encerramento_candidatura > userPoints[uid].last_approved) {
                userPoints[uid].last_approved = cand.data_encerramento_candidatura;
            }
        });

        // 2. Buscar todas as conquistas especiais atribuídas e aprovadas na plataforma
        const conquistasAtribuidas = await ConquistaAtribuida.findAll({
            include: [{
                association: 'consultor',
                attributes: consultorAttributes,
                include: consultorInclude
            }]
        });

        conquistasAtribuidas.forEach(ca => {
            const uid = ca.id_utilizador;
            if (!userPoints[uid]) {
                userPoints[uid] = {
                    consultor: formatConsultor(ca.consultor),
                    pontos: 0,
                    last_approved: ca.data_atribuicao_conquista
                };
            }
            userPoints[uid].pontos += (ca.pontos_conquistados || 0);
            if (ca.data_atribuicao_conquista > userPoints[uid].last_approved) {
                userPoints[uid].last_approved = ca.data_atribuicao_conquista;
            }
        });

        // 3. Buscar todas as renovações de badges aprovadas e concluídas na plataforma
        const renovacoesConcluidas = await RenovacaoBadge.findAll({
            where: {
                renovacaoAtiva: true,
                renovacao_aprovada: true,
                data_renovacao: { [Op.ne]: null }
            },
            include: [{
                association: 'candidatura',
                include: [{
                    association: 'consultor',
                    attributes: consultorAttributes,
                    include: consultorInclude
                }]
            }]
        });

        renovacoesConcluidas.forEach(ren => {
            const uid = ren.candidatura?.id_utilizador;
            if (uid) {
                if (!userPoints[uid]) {
                    userPoints[uid] = {
                        consultor: formatConsultor(ren.candidatura?.consultor),
                        pontos: 0,
                        last_approved: ren.data_renovacao
                    };
                }
                userPoints[uid].pontos += (ren.pontos_renovacao || 0);
                if (ren.data_renovacao > userPoints[uid].last_approved) {
                    userPoints[uid].last_approved = ren.data_renovacao;
                }
            }
        });

        // 4. Buscar TODOS os utilizadores com perfil Consultor (id_perfil = 4) ativo para garantir que todos aparecem no ranking geral
        const perfisConsultores = await PerfilUtilizador.findAll({
            where: { id_perfil: PERFIS.CONSULTOR, relacionamentoAtivo: true },
            attributes: ['id_utilizador']
        });
        const consultoresIds = perfisConsultores.map(p => p.id_utilizador);

        const todosConsultores = await Utilizador.findAll({
            where: {
                id_utilizador: { [Op.in]: consultoresIds },
                conta_ativa: true,
                conta_bloqueada: false
            },
            include: [
                {
                    association: 'service_line',
                    include: [{ association: 'traducao_service_line' }]
                }
            ],
            attributes: consultorAttributes
        });

        todosConsultores.forEach(u => {
            if (!userPoints[u.id_utilizador]) {
                userPoints[u.id_utilizador] = {
                    consultor: formatConsultor(u),
                    pontos: 0,
                    last_approved: null
                };
            }
        });

        // 5. Ordenar globalmente por pontuação e atribuir posições globais (1..N)
        const ranking = Object.values(userPoints).sort((a, b) => {
            if (b.pontos !== a.pontos) return b.pontos - a.pontos;
            if (a.last_approved && b.last_approved) {
                return new Date(a.last_approved).getTime() - new Date(b.last_approved).getTime();
            }
            if (a.last_approved) return -1;
            if (b.last_approved) return 1;
            return (a.consultor?.nome || '').localeCompare(b.consultor?.nome || '');
        }).map((item, index) => ({
            posicao: index + 1,
            ...item
        }));

        return res.status(200).json({ success: true, data: ranking });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

controllersMetricas.getSlaStatus = async (req, res) => {
    try {
        const activeRole = req.activeRole;
        const userId = req.auth?.sub || req.auth?.id_utilizador;
        
        const configSla = await ConfiguracaoSLA.findOne();
        const slaSllHoras = configSla ? configSla.sla_sll_horas : 48;
        const agora = new Date().getTime();

        const where = { candidaturaAtiva: true, id_estado_candidatura: 3 }; // EM_VALIDACAO
        if (activeRole === 2) {
            const slId = await getSllServiceLineId(userId);
            if (!slId) return res.status(200).json({ success: true, data: [] });
            where['$badge.nivel_area.area.id_service_line$'] = slId;
        }

        const candidaturas = await Candidatura.findAll({
            where,
            include: [
                {
                    association: 'badge',
                    include: [{ association: 'nivel_area', include: [{ association: 'area' }] }]
                },
                {
                    association: 'acoes',
                    where: { tipo_acao_candidatura: 4 }, // PRE_APROVADA_TM
                    required: true
                },
                {
                    association: 'consultor',
                    attributes: ['id_utilizador', 'nome', 'apelido', 'avatar']
                }
            ]
        });

        const list = candidaturas.map(cand => {
            const sortedAcoes = cand.acoes.sort((a, b) => new Date(b.data_acao_candidatura) - new Date(a.data_acao_candidatura));
            const dataPreAprovacao = new Date(sortedAcoes[0].data_acao_candidatura).getTime();
            const horasPassadas = (agora - dataPreAprovacao) / (1000 * 60 * 60);
            
            return {
                id_candidatura: cand.id_candidatura,
                consultor: cand.consultor,
                badge: cand.badge,
                data_pre_aprovacao: sortedAcoes[0].data_acao_candidatura,
                horas_passadas: Math.round(horasPassadas),
                sla_horas: slaSllHoras,
                expirado: horasPassadas > slaSllHoras
            };
        });

        return res.status(200).json({ success: true, data: list });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

controllersMetricas.getListagemConsultoresSL = async (req, res) => {
    try {
        const activeRole = req.activeRole;
        const userId = req.auth?.sub || req.auth?.id_utilizador;
        const lang = req.lang || 'pt';

        // Determinar o ID da Service Line do SLL autenticado
        let slId = null;
        if (activeRole === 2) {
            slId = await getSllServiceLineId(userId);
            if (!slId) return res.status(200).json({ success: true, data: [] });
        }

        // 1. Buscar IDs das áreas pertencentes à Service Line
        const whereArea = {};
        if (slId) whereArea.id_service_line = slId;
        const areas = await Area.findAll({ where: whereArea, attributes: ['id_area'] });
        const areasIds = areas.map(a => a.id_area);

        if (areasIds.length === 0 && !slId) return res.status(200).json({ success: true, data: [] });

        // 2. Buscar IDs de utilizadores com perfil Consultor (id_perfil = 4) ativo
        const perfisConsultores = await PerfilUtilizador.findAll({
            where: { id_perfil: 4, relacionamentoAtivo: true },
            attributes: ['id_utilizador']
        });
        const consultoresIds = perfisConsultores.map(p => p.id_utilizador);

        // 3. Buscar todos os utilizadores ativos pertencentes à SL ou às áreas da SL
        const whereConsultores = {
            id_utilizador: { [Op.in]: consultoresIds },
            conta_ativa: true
        };
        if (slId) {
            whereConsultores[Op.or] = [
                { id_sl: slId },
                { id_area: { [Op.in]: areasIds } }
            ];
        }

        const consultores = await Utilizador.findAll({
            where: whereConsultores,
            attributes: ['id_utilizador', 'nome', 'apelido', 'avatar', 'email', 'id_sl'],
            include: [{
                association: 'service_line',
                include: [{ association: 'traducao_service_line' }]
            }]
        });

        // 4. Para cada consultor, buscar as candidaturas e conquistas para calcular pontos e badges
        const resultado = [];
        for (const consultor of consultores) {
            const whereCand = {
                id_utilizador: consultor.id_utilizador,
                candidaturaAtiva: true
            };

            const candidaturas = await Candidatura.findAll({
                where: whereCand,
                include: [{
                    association: 'badge',
                    include: [
                        { association: 'nivel_area', include: [{ association: 'area' }] },
                        { association: 'traducao_titulo' }
                    ]
                }]
            });

            let totalPontos = 0;
            const badges = candidaturas.map(cand => {
                const pts = (cand.id_estado_candidatura === 4 && cand.badge?.pontos) ? cand.badge.pontos : 0;
                totalPontos += pts;
                return {
                    id_candidatura: cand.id_candidatura,
                    nome_badge: cand.badge?.traducao_titulo || { pt: '', en: '', es: '' },
                    pontos: cand.badge?.pontos || 0,
                    area: cand.badge?.nivel_area?.area,
                    nivel: cand.badge?.nivel_area?.nivel || '',
                    estado: cand.id_estado_candidatura
                };
            });

            // Somar pontos de conquistas especiais (Badges Especiais)
            const conquistasConsultor = await ConquistaAtribuida.findAll({
                where: {
                    id_utilizador: consultor.id_utilizador,
                    atribuicaoAtiva: true
                },
                include: [{
                    association: 'conquista_especial',
                    include: [{ association: 'traducao_titulo' }]
                }]
            });
            conquistasConsultor.forEach(ca => {
                totalPontos += (ca.pontos_conquistados || 0);
            });

            // Somar pontos de renovações concluídas do consultor
            const whereRen = {
                renovacaoAtiva: true,
                renovacao_aprovada: true,
                data_renovacao: { [Op.ne]: null },
                '$candidatura.id_utilizador$': consultor.id_utilizador
            };
            const renovacoesConsultor = await RenovacaoBadge.findAll({
                where: whereRen,
                include: [{
                    association: 'candidatura',
                    include: [{
                        association: 'badge',
                        include: [{ association: 'nivel_area', include: [{ association: 'area' }] }]
                    }]
                }]
            });
            renovacoesConsultor.forEach(ren => {
                totalPontos += (ren.pontos_renovacao || 0);
            });

            resultado.push({
                consultor: {
                    id_utilizador: consultor.id_utilizador,
                    nome: consultor.nome,
                    apelido: consultor.apelido,
                    avatar: consultor.avatar,
                    email: consultor.email
                },
                total_pontos_sl: totalPontos,
                badges
            });
        }

        return res.status(200).json({ success: true, data: resultado });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

controllersMetricas.getAtividadesRecentes = async (req, res) => {
    try {
        const activeRole = req.activeRole;
        const userId = req.auth?.sub || req.auth?.id_utilizador;
        
        let slId = null;
        if (activeRole === 2) {
            slId = await getSllServiceLineId(userId);
            if (!slId) return res.status(200).json({ success: true, data: [] });
        } else if (req.query.id_service_line) {
            slId = Number(req.query.id_service_line);
        }

        const whereAcao = {
            acaoAtiva: true,
            tipo_acao_candidatura: {
                [Op.between]: [1, 10]
            }
        };

        if (slId) {
            // 1. Obter consultores associados à SL (por id_sl ou por id_area nas áreas da SL)
            const perfisConsultores = await PerfilUtilizador.findAll({
                where: { id_perfil: PERFIS.CONSULTOR, relacionamentoAtivo: true },
                attributes: ['id_utilizador']
            });
            const consultoresIds = perfisConsultores.map(p => p.id_utilizador);

            const areas = await Area.findAll({ where: { id_service_line: slId }, attributes: ['id_area'] });
            const areasIds = areas.map(a => a.id_area);

            const consultoresSL = await Utilizador.findAll({
                where: {
                    id_utilizador: { [Op.in]: consultoresIds },
                    conta_ativa: true,
                    [Op.or]: [
                        { id_sl: slId },
                        ...(areasIds.length > 0 ? [{ id_area: { [Op.in]: areasIds } }] : [])
                    ]
                },
                attributes: ['id_utilizador']
            });
            const slConsultoresIds = consultoresSL.map(c => c.id_utilizador);

            // 2. Obter candidaturas dos consultores da SL ou cujos badges pertençam a áreas da SL
            const candidaturasSL = await Candidatura.findAll({
                where: {
                    candidaturaAtiva: true,
                    [Op.or]: [
                        ...(slConsultoresIds.length > 0 ? [{ id_utilizador: { [Op.in]: slConsultoresIds } }] : []),
                        ...(areasIds.length > 0 ? [{ '$badge.nivel_area.id_area_sl$': { [Op.in]: areasIds } }] : [])
                    ]
                },
                include: [{
                    association: 'badge',
                    include: [{ association: 'nivel_area' }]
                }],
                attributes: ['id_candidatura']
            });

            const candidaturasIds = candidaturasSL.map(c => c.id_candidatura);
            if (candidaturasIds.length === 0) {
                return res.status(200).json({ success: true, data: [] });
            }

            whereAcao.id_candidatura = { [Op.in]: candidaturasIds };
        }

        const acoes = await AcaoCandidatura.findAll({
            where: whereAcao,
            include: [
                {
                    association: 'candidatura',
                    include: [{
                        association: 'badge',
                        include: [
                            { association: 'nivel_area', include: [{ association: 'area' }] },
                            { association: 'traducao_titulo' }
                        ]
                    }]
                },
                {
                    association: 'autor_acao',
                    attributes: ['id_utilizador', 'nome', 'apelido', 'avatar']
                },
                {
                    association: 'tipo_acao',
                    include: [{ association: 'traducao_acao' }]
                }
            ],
            order: [['data_acao_candidatura', 'DESC']],
            limit: 10
        });

        const list = acoes.map(acao => ({
            id_acao_candidatura: acao.id_acao_candidatura,
            autor: acao.autor_acao,
            badge: acao.candidatura?.badge,
            tipo_acao: acao.tipo_acao,
            data_acao: acao.data_acao_candidatura
        }));

        return res.status(200).json({ success: true, data: list });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

controllersMetricas.getContagemPorArea = async (req, res) => {
    try {
        const activeRole = req.activeRole;
        const userId = req.auth?.sub || req.auth?.id_utilizador;
        
        // Identificar a Service Line liderada pelo utilizador autenticado
        let slId = await getSllServiceLineId(userId);
        if (!slId && req.query.id_service_line) {
            slId = Number(req.query.id_service_line);
        }

        // Se não for identificada uma Service Line válida para o SLL, devolve lista vazia (nunca todas as áreas globais)
        if (!slId) {
            return res.status(200).json({ success: true, data: [] });
        }

        const whereArea = { 
            areaAtiva: true,
            id_service_line: slId
        };

        // 1. Buscar apenas as Áreas pertencentes à Service Line do SLL
        const areas = await Area.findAll({
            where: whereArea,
            include: [{ association: 'traducao_area' }]
        });

        const areasIds = areas.map(a => a.id_area);
        if (areasIds.length === 0) {
            return res.status(200).json({ success: true, data: [] });
        }

        // 2. Inicializar a contagem por área
        const areaCounts = {};
        areas.forEach(a => {
            areaCounts[a.id_area] = {
                area: a,
                completadas: 0,
                nao_iniciadas: 0,
                em_progresso: 0
            };
        });

        // 3. Mapear Níveis e Badges pertencentes a essas áreas da SL
        const niveis = await NivelArea.findAll({
            where: { id_area_sl: { [Op.in]: areasIds } },
            attributes: ['id_nivel_area', 'id_area_sl']
        });
        const nivelToArea = {};
        const niveisIds = niveis.map(n => {
            nivelToArea[n.id_nivel_area] = n.id_area_sl;
            return n.id_nivel_area;
        });

        if (niveisIds.length === 0) {
            return res.status(200).json({ success: true, data: Object.values(areaCounts) });
        }

        const badges = await Badge.findAll({
            where: { id_nivel_area: { [Op.in]: niveisIds } },
            attributes: ['id_badge', 'id_nivel_area']
        });
        const badgeToArea = {};
        const badgesIds = badges.map(b => {
            badgeToArea[b.id_badge] = nivelToArea[b.id_nivel_area];
            return b.id_badge;
        });

        if (badgesIds.length === 0) {
            return res.status(200).json({ success: true, data: Object.values(areaCounts) });
        }

        // 4. Buscar todas as candidaturas ativas dos badges da SL
        const candidaturas = await Candidatura.findAll({
            where: {
                candidaturaAtiva: true,
                id_badge: { [Op.in]: badgesIds }
            },
            attributes: ['id_candidatura', 'id_badge', 'id_estado_candidatura']
        });

        // 5. Contabilizar por estado:
        // - Estado 4: Concluídas / Aprovadas
        // - Estado 1: Não Iniciadas / Rascunhos
        // - Estados 2 e 3: Em Progresso (Submetida / Em Validação)
        candidaturas.forEach(cand => {
            const idArea = badgeToArea[cand.id_badge];
            if (idArea && areaCounts[idArea]) {
                const est = Number(cand.id_estado_candidatura);
                if (est === 4) {
                    areaCounts[idArea].completadas++;
                } else if (est === 1) {
                    areaCounts[idArea].nao_iniciadas++;
                } else if (est === 2 || est === 3) {
                    areaCounts[idArea].em_progresso++;
                }
            }
        });

        const lang = req.lang || req.query.lang || 'pt';

        // 5. Formatar a resposta final para coincidir com o modelo do frontend
        const resultado = Object.values(areaCounts).map(item => {
            const area = item.area;
            const nomeArea = area.traducao_area?.[lang] || area.traducao_area?.pt || `Área ${area.id_area}`;
            const total = item.completadas + item.em_progresso + item.nao_iniciadas;

            return {
                id_area: item.area.id_area,
                nome: nomeArea,
                total: total,
                completadas: item.completadas,
                em_progresso: item.em_progresso,
                nao_iniciadas: item.nao_iniciadas
            };
        });

        return res.status(200).json({ success: true, data: resultado });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

controllersMetricas.getDashboardConsultorMetrics = async (req, res) => {
    try {
        const userId = req.auth?.sub || req.auth?.id_utilizador;
        
        const candidaturas = await Candidatura.findAll({
            where: {
                id_utilizador: userId,
                candidaturaAtiva: true
            },
            include: [{
                association: 'badge'
            }]
        });

        let badgesCount = 0;
        let activeAppsCount = 0;
        let totalPoints = 0;

        candidaturas.forEach(cand => {
            const estado = cand.id_estado_candidatura;
            // Apenas candidaturas finalizadas com sucesso
            if (estado === 4) {
                badgesCount++;
                totalPoints += (cand.badge?.pontos || 0);
            } 
            // Apenas candidaturas em rascunho (1), submetidas (2) ou em validação (3)
            else if ([1, 2, 3].includes(estado)) {
                activeAppsCount++;
            }
            // Estado 5 (Canceladas/Rejeitadas) são ignoradas nestas métricas
        });

        // Somar conquistas especiais atribuídas ao consultor (candidaturas especiais aprovadas)
        const conquistasAtribuidas = await ConquistaAtribuida.findAll({
            where: { id_utilizador: userId }
        });

        conquistasAtribuidas.forEach(ca => {
            totalPoints += (ca.pontos_conquistados || 0);
            badgesCount++;
        });

        // Somar pontos de renovações de badges concluídas
        const renovacoesConcluidas = await RenovacaoBadge.findAll({
            where: {
                renovacaoAtiva: true,
                renovacao_aprovada: true,
                data_renovacao: { [Op.ne]: null },
                '$candidatura.id_utilizador$': userId
            },
            include: [{ association: 'candidatura' }]
        });
        renovacoesConcluidas.forEach(ren => {
            totalPoints += (ren.pontos_renovacao || 0);
        });

        // Somar candidaturas especiais ativas (estado 1 - pendente de moderação)
        const candidaturasEspeciaisPendentes = await CandidaturaEspecial.count({
            where: {
                id_utilizador: userId,
                id_estado_candidatura_especial: 1
            }
        });
        activeAppsCount += candidaturasEspeciaisPendentes;

        // Somar pedidos de renovação pendentes do consultor
        const renovacoesPendentes = await RenovacaoBadge.count({
            where: {
                renovacaoAtiva: true,
                renovacao_aprovada: null,
                '$candidatura.id_utilizador$': userId
            },
            include: [{ association: 'candidatura' }]
        });
        activeAppsCount += renovacoesPendentes;

        return res.status(200).json({
            success: true,
            message: "Métricas do dashboard do consultor recuperadas",
            data: {
                badgesCount,
                activeAppsCount,
                totalPoints
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Erro ao obter métricas do dashboard do consultor",
            error: error.message
        });
    }
};

/**
 * GET /con-dashboard/progresso-lp
 * Devolve o progresso do consultor autenticado em cada Learning Path e Service Line.
 * Calcula a quantidade de Badges conquistados vs total existente e percentagem de conclusão.
 */
controllersMetricas.getConsultorProgressoLP = async (req, res) => {
    try {
        const userId = req.auth?.sub || req.auth?.id_utilizador;
        const lang = req.lang || 'pt';

        // 1. Obter todos os Learning Paths ativos com Service Lines, Áreas, Níveis e Badges ativos
        const learningPaths = await LearningPath.findAll({
            where: { lpAtivo: true },
            include: [
                {
                    model: TraducaoConteudo,
                    as: 'traducao_learning_path'
                },
                {
                    model: ServiceLine,
                    as: 'service_lines',
                    where: { slAtivo: true },
                    required: false,
                    include: [
                        {
                            model: TraducaoConteudo,
                            as: 'traducao_service_line'
                        },
                        {
                            model: Area,
                            as: 'areas',
                            where: { areaAtiva: true },
                            required: false,
                            include: [
                                {
                                    model: TraducaoConteudo,
                                    as: 'traducao_area'
                                },
                                {
                                    model: NivelArea,
                                    as: 'niveis',
                                    where: { nivelAtivo: true },
                                    required: false,
                                    include: [
                                        {
                                            model: Badge,
                                            as: 'badges',
                                            where: { badgeAtivo: true },
                                            required: false,
                                            attributes: ['id_badge', 'pontos']
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [
                ['id_learning_path', 'ASC'],
                [{ model: ServiceLine, as: 'service_lines' }, 'id_service_line', 'ASC']
            ]
        });

        // 2. Obter todas as candidaturas concluídas do consultor (Estado 4 - Encerrada OK)
        const candidaturasConcluidas = await Candidatura.findAll({
            where: {
                id_utilizador: userId,
                id_estado_candidatura: 4,
                candidaturaAtiva: true
            },
            attributes: ['id_badge']
        });

        const idsBadgesConquistados = new Set(candidaturasConcluidas.map(c => c.id_badge));

        // 3. Montar a estrutura de progresso por LP e Service Line
        const progressoLista = [];

        learningPaths.forEach(lp => {
            const lpNome = lp.traducao_learning_path?.[lang] || lp.traducao_learning_path?.pt || '';
            const serviceLines = lp.service_lines || [];

            serviceLines.forEach(sl => {
                const slNome = sl.traducao_service_line?.[lang] || sl.traducao_service_line?.pt || '';
                
                // Extrair todos os badges únicos desta Service Line e agrupar áreas/níveis
                const badgesSL = [];
                const areasList = [];

                (sl.areas || []).forEach(area => {
                    const areaNome = area.traducao_area?.[lang] || area.traducao_area?.pt || '';
                    let niveis_completos = 0;
                    let niveis_em_progresso = 0;
                    const niveisList = [];

                    (area.niveis || []).forEach(nivel => {
                        const nivelNome = 'Nível ' + nivel.id_nivel_area;
                        let badges_completos = 0;
                        const total_badges = (nivel.badges || []).length;

                        (nivel.badges || []).forEach(badge => {
                            badgesSL.push(badge);
                            if (idsBadgesConquistados.has(badge.id_badge)) {
                                badges_completos++;
                            }
                        });

                        if (total_badges > 0) {
                            if (badges_completos === total_badges) {
                                niveis_completos++;
                            } else if (badges_completos > 0) {
                                niveis_em_progresso++;
                            }
                        }

                        niveisList.push({
                            id_nivel: nivel.id_nivel_area,
                            nome: nivelNome,
                            total_badges,
                            badges_completos
                        });
                    });

                    areasList.push({
                        id_area: area.id_area,
                        nome: areaNome,
                        total_niveis: (area.niveis || []).length,
                        niveis_completos,
                        niveis_em_progresso,
                        niveis: niveisList
                    });
                });

                const totalBadges = badgesSL.length;
                console.log('SL:', slNome, 'Areas count:', (sl.areas || []).length);
                const badgesConquistados = badgesSL.filter(b => idsBadgesConquistados.has(b.id_badge)).length;
                const percentagem = totalBadges > 0 ? Math.round((badgesConquistados / totalBadges) * 100) : 0;
                
                const pontosConquistados = badgesSL
                    .filter(b => idsBadgesConquistados.has(b.id_badge))
                    .reduce((sum, b) => sum + (b.pontos || 0), 0);
                
                const pontosTotal = badgesSL
                    .reduce((sum, b) => sum + (b.pontos || 0), 0);

                progressoLista.push({
                    id_learning_path: lp.id_learning_path,
                    lp_nome: lpNome,
                    id_service_line: sl.id_service_line,
                    sl_nome: slNome,
                    badges_conquistados: badgesConquistados,
                    badges_total: totalBadges,
                    percentagem,
                    pontos_conquistados: pontosConquistados,
                    pontos_total: pontosTotal,
                    areas: areasList
                });
            });
        });

        return res.status(200).json({
            success: true,
            message: "Progresso nos Learning Paths recuperado com sucesso.",
            data: progressoLista
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Erro ao calcular progresso nos Learning Paths.",
            error: error.message
        });
    }
};

/**
 * GET /con-dashboard/badges-total
 * Retorna contagem de badges conquistados e pontos totais do consultor.
 */
controllersMetricas.getConsultorBadgesTotal = async (req, res) => {
    try {
        const userId = req.auth?.sub || req.auth?.id_utilizador;

        const candidaturas = await Candidatura.findAll({
            where: {
                id_utilizador: userId,
                id_estado_candidatura: 4,
                candidaturaAtiva: true
            },
            include: [{
                association: 'badge',
                attributes: ['pontos']
            }]
        });

        let badgesCount = candidaturas.length;
        let totalPoints = candidaturas.reduce((sum, c) => sum + (c.badge?.pontos || 0), 0);

        // Somar conquistas especiais atribuídas
        const conquistasAtribuidas = await ConquistaAtribuida.findAll({
            where: { id_utilizador: userId }
        });

        conquistasAtribuidas.forEach(ca => {
            totalPoints += (ca.pontos_conquistados || 0);
            badgesCount++;
        });

        // Somar pontos de renovações de badges concluídas
        const renovacoesConcluidas = await RenovacaoBadge.findAll({
            where: {
                renovacaoAtiva: true,
                renovacao_aprovada: true,
                data_renovacao: { [Op.ne]: null },
                '$candidatura.id_utilizador$': userId
            },
            include: [{ association: 'candidatura' }]
        });
        renovacoesConcluidas.forEach(ren => {
            totalPoints += (ren.pontos_renovacao || 0);
        });

        return res.status(200).json({
            success: true,
            data: {
                badgesCount,
                totalPoints
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Erro ao obter total de badges do consultor.",
            error: error.message
        });
    }
};

/**
 * GET /con-dashboard/candidaturas-ativas
 * Retorna contagem de candidaturas em curso do consultor (estados 1, 2 e 3).
 */
controllersMetricas.getConsultorCandidaturasAtivas = async (req, res) => {
    try {
        const userId = req.auth?.sub || req.auth?.id_utilizador;

        const candidaturas = await Candidatura.findAll({
            where: {
                id_utilizador: userId,
                id_estado_candidatura: [1, 2, 3],
                candidaturaAtiva: true
            }
        });

        const contagemPorEstado = {
            "1": candidaturas.filter(c => c.id_estado_candidatura === 1).length,
            "2": candidaturas.filter(c => c.id_estado_candidatura === 2).length,
            "3": candidaturas.filter(c => c.id_estado_candidatura === 3).length
        };

        return res.status(200).json({
            success: true,
            data: {
                activeAppsCount: candidaturas.length,
                estados: contagemPorEstado
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Erro ao obter candidaturas ativas do consultor.",
            error: error.message
        });
    }
};

/**
 * GET /con-dashboard/atividades-recentes
 * Retorna as atividades/ações recentes do consultor autenticado.
 */
controllersMetricas.getConsultorAtividadesRecentes = async (req, res) => {
    try {
        const userId = req.auth?.sub || req.auth?.id_utilizador;
        const lang = req.lang || 'pt';

        const acoes = await AcaoCandidatura.findAll({
            include: [
                {
                    association: 'candidatura',
                    where: { id_utilizador: userId, candidaturaAtiva: true },
                    include: [{
                        association: 'badge',
                        include: [{ association: 'traducao_titulo' }]
                    }]
                },
                {
                    association: 'tipo_acao',
                    include: [{ association: 'traducao_acao' }]
                }
            ],
            order: [['data_acao_candidatura', 'DESC']],
            limit: 10
        });

        const data = acoes.map(a => ({
            id_acao_candidatura: a.id_acao_candidatura,
            id_candidatura: a.id_candidatura,
            tipo_acao: a.tipo_acao?.traducao_acao?.[lang] || a.tipo_acao?.traducao_acao?.pt || '',
            badge_nome: a.candidatura?.badge?.traducao_titulo?.[lang] || a.candidatura?.badge?.traducao_titulo?.pt || '',
            data_acao: a.data_acao_candidatura
        }));

        return res.status(200).json({
            success: true,
            data
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Erro ao obter atividades recentes do consultor.",
            error: error.message
        });
    }
};

/**
 * GET /metricas/candidaturas-especiais/estado-contagem
 * Retorna contagem de candidaturas especiais por estado (ex: ?estado=1 para pendentes).
 * Se nenhum estado for fornecido, retorna o sumário agrupado de todos os estados (1, 2, 3 e total).
 */
controllersMetricas.getCandidaturasEspeciaisEstadoContagem = async (req, res) => {
    try {
        const queryRole = req.query.role || req.query.perfil || req.query.activeRole;
        const effectiveRole = queryRole !== undefined ? Number(queryRole) : req.activeRole;
        const userId = req.auth?.sub || req.auth?.id_utilizador;
        const apenasMinhas = req.query.apenas_minhas === 'true' || req.query.minhas === 'true';

        const where = { candidaturaEspecialAtiva: true };

        // Se o perfil ativo for Consultor (4) ou se for explicitamente solicitado apenas_minhas:
        // filtra estritamente pelas candidaturas do utilizador logado
        if (effectiveRole === 4 || apenasMinhas) {
            where.id_utilizador = userId;
        }

        const { estado } = req.query;

        if (estado !== undefined) {
            const estadoId = Number(estado);
            where.id_estado_candidatura_especial = estadoId;
            const contagem = await CandidaturaEspecial.count({ where });

            return res.status(200).json({
                success: true,
                message: `Contagem de candidaturas especiais para o estado ${estadoId} recuperada com sucesso.`,
                data: {
                    estado: estadoId,
                    contagem
                }
            });
        }

        // Sem query param: conta todos os estados
        const candidaturas = await CandidaturaEspecial.findAll({
            where,
            attributes: ['id_estado_candidatura_especial']
        });

        const contagem = { "1": 0, "2": 0, "3": 0 };
        let total = 0;

        candidaturas.forEach(cand => {
            const est = String(cand.id_estado_candidatura_especial);
            if (contagem[est] !== undefined) {
                contagem[est]++;
            }
            total++;
        });

        return res.status(200).json({
            success: true,
            message: "Contagem de candidaturas especiais recuperada com sucesso.",
            data: {
                "1": contagem["1"],
                "2": contagem["2"],
                "3": contagem["3"],
                total
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Erro ao obter contagem de candidaturas especiais.",
            error: error.message
        });
    }
};

/**
 * GET /metricas/con-dashboard/recomendacoes-badges
 * Devolve a lista de badges recomendados para o consultor autenticado
 * com base na sua área de preferência, áreas com histórico e tendências globais.
 */
controllersMetricas.getConsultorRecomendacoesBadges = async (req, res) => {
    try {
        const userId = req.auth?.sub || req.auth?.id_utilizador;
        const lang = req.lang || 'pt';
        const { limit } = req.query;

        const effectiveRole = req.activeRole || (req.auth?.perfis && req.auth.perfis[0]);

        // Apenas acessível quando a atuar com o perfil ativo de Consultor (4)
        if (effectiveRole !== 4) {
            return res.status(403).json({
                success: false,
                message: "Acesso restrito. Este endpoint requer o perfil ativo de Consultor."
            });
        }

        const { obterBadgesRecomendados } = require('../services/recomendacao.service');
        const resultado = await obterBadgesRecomendados(userId, lang, limit ? Number(limit) : null);

        return res.status(200).json({
            success: true,
            message: "Recomendações de badges geradas com sucesso.",
            data: resultado
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Erro ao gerar recomendações de badges.",
            error: error.message
        });
    }
};

/**
 * GET /metricas/badges-atribuidos/distribuicao
 * Retorna a contagem agregada e percentual de badges atribuídos (concluídos)
 * agrupados por:
 * - 'lp' (Learning Path)
 * - 'sl' (Service Line)
 * - 'area' (Área)
 * Respeita estritamente o idioma do utilizador (req.lang || query.lang || 'pt')
 */
controllersMetricas.getDistribuicaoBadgesAtribuidos = async (req, res) => {
    try {
        const lang = req.lang || req.query.lang || 'pt';
        const agruparPorRaw = (req.query.agrupar_por || req.query.agrupamento || req.query.tipo || 'sl').toLowerCase().trim();

        let agruparPor = 'service_line';
        if (agruparPorRaw === 'lp' || agruparPorRaw === 'learning_path' || agruparPorRaw === 'learningpath') {
            agruparPor = 'learning_path';
        } else if (agruparPorRaw === 'area' || agruparPorRaw === 'área') {
            agruparPor = 'area';
        } else {
            agruparPor = 'service_line';
        }

        // 1. Obter todas as entidades do grupo selecionado com traduções
        let entidades = [];
        if (agruparPor === 'learning_path') {
            const lps = await LearningPath.findAll({
                where: { lpAtivo: true },
                include: [{ model: TraducaoConteudo, as: 'traducao_learning_path' }]
            });
            entidades = lps.map(lp => ({
                id: lp.id_learning_path,
                nome: lp.traducao_learning_path?.[lang] || lp.traducao_learning_path?.pt || `Learning Path ${lp.id_learning_path}`,
                cor: lp.cor || null
            }));
        } else if (agruparPor === 'service_line') {
            const sls = await ServiceLine.findAll({
                where: { slAtivo: true },
                include: [{ model: TraducaoConteudo, as: 'traducao_service_line' }]
            });
            entidades = sls.map(sl => ({
                id: sl.id_service_line,
                nome: sl.traducao_service_line?.[lang] || sl.traducao_service_line?.pt || `Service Line ${sl.id_service_line}`,
                id_learning_path: sl.id_learning_path
            }));
        } else {
            const areas = await Area.findAll({
                where: { areaAtiva: true },
                include: [{ model: TraducaoConteudo, as: 'traducao_area' }]
            });
            entidades = areas.map(a => ({
                id: a.id_area,
                nome: a.traducao_area?.[lang] || a.traducao_area?.pt || `Área ${a.id_area}`,
                id_service_line: a.id_service_line
            }));
        }

        // 2. Buscar todas as candidaturas aprovadas (estado 4) com árvore de níveis e áreas
        const candidaturas = await Candidatura.findAll({
            where: {
                id_estado_candidatura: 4,
                candidaturaAtiva: true
            },
            include: [
                {
                    model: Badge,
                    as: 'badge',
                    required: true,
                    include: [
                        {
                            model: NivelArea,
                            as: 'nivel_area',
                            required: true,
                            include: [
                                {
                                    model: Area,
                                    as: 'area',
                                    required: true,
                                    include: [
                                        {
                                            model: ServiceLine,
                                            as: 'service_line',
                                            required: true,
                                            include: [
                                                {
                                                    model: LearningPath,
                                                    as: 'learning_path',
                                                    required: true
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ]
        });

        // 3. Contabilizar badges por id da entidade
        const contagemMap = new Map();
        entidades.forEach(e => contagemMap.set(Number(e.id), 0));

        let totalGeral = 0;
        candidaturas.forEach(c => {
            const b = c.badge;
            const na = b?.nivel_area;
            const a = na?.area;
            const sl = a?.service_line;
            const lp = sl?.learning_path;

            let alvoId = null;
            if (agruparPor === 'learning_path') {
                alvoId = lp ? Number(lp.id_learning_path) : null;
            } else if (agruparPor === 'service_line') {
                alvoId = sl ? Number(sl.id_service_line) : null;
            } else {
                alvoId = a ? Number(a.id_area) : null;
            }

            if (alvoId !== null) {
                const atual = contagemMap.get(alvoId) || 0;
                contagemMap.set(alvoId, atual + 1);
                totalGeral++;
            }
        });

        // 4. Montar lista de resposta ordenada
        const itens = entidades.map(e => {
            const total = contagemMap.get(Number(e.id)) || 0;
            const percentagem = totalGeral > 0 ? Number(((total / totalGeral) * 100).toFixed(2)) : 0;
            return {
                id: e.id,
                nome: e.nome,
                ...(e.cor ? { cor: e.cor } : {}),
                total,
                percentagem
            };
        }).sort((a, b) => b.total - a.total || a.nome.localeCompare(b.nome));

        return res.status(200).json({
            success: true,
            message: "Distribuição de badges atribuídos recuperada com sucesso.",
            data: {
                agrupamento: agruparPor,
                total_geral: totalGeral,
                itens
            }
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Erro ao obter distribuição de badges atribuídos.",
            error: error.message
        });
    }
};

/**
 * GET /metricas/certificados/evolucao-mensal
 * Retorna a contagem de certificados emitidos em cada mês (Janeiro a Dezembro) para o ano especificado.
 * Filtros de segurança:
 * - Apenas número inteiro.
 * - Ano permitido: entre (anoAtual - 10) e anoAtual.
 * - Recusa letras, caracteres inválidos, anos anteriores a 10 anos ou futuros.
 * - Por omissão (se vazio/omitido): assume o ano atual.
 */
controllersMetricas.getCertificadosEvolucaoMensal = async (req, res) => {
    try {
        const agora = new Date();
        const anoAtual = agora.getFullYear();
        const anoMinimo = anoAtual - 10;

        let { ano } = req.query;

        // Se omitido ou vazio, assume o ano atual
        if (ano === undefined || ano === null || (typeof ano === 'string' && ano.trim() === '')) {
            ano = anoAtual;
        } else {
            // Se for fornecido, validar rigorosamente
            if (typeof ano === 'string') {
                ano = ano.trim();
                // Validar se contém estritamente 4 dígitos numéricos
                if (!/^\d{4}$/.test(ano)) {
                    return res.status(400).json({
                        success: false,
                        message: `O ano fornecido é inválido ('${ano}'). Deve ser um número inteiro de 4 dígitos entre ${anoMinimo} e ${anoAtual}, sem letras ou caracteres especiais.`
                    });
                }
            }

            const anoNum = Number(ano);

            if (!Number.isInteger(anoNum)) {
                return res.status(400).json({
                    success: false,
                    message: `O ano deve ser um número inteiro válido.`
                });
            }

            if (anoNum < anoMinimo || anoNum > anoAtual) {
                return res.status(400).json({
                    success: false,
                    message: `O ano ${anoNum} está fora do intervalo permitido. Deve estar compreendido entre ${anoMinimo} e ${anoAtual}.`
                });
            }

            ano = anoNum;
        }

        // Definir limites de data para o ano selecionado
        const dataInicioAno = new Date(ano, 0, 1, 0, 0, 0, 0);
        const dataFimAno = new Date(ano, 11, 31, 23, 59, 59, 999);

        // Buscar todos os certificados emitidos dentro do ano
        const certificados = await Certificado.findAll({
            where: {
                data_emissao: {
                    [Op.between]: [dataInicioAno, dataFimAno]
                }
            },
            attributes: ['id_certificado', 'data_emissao']
        });

        // Contabilizar por mês (0 = Jan, 11 = Dez)
        const contagemMeses = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        certificados.forEach(c => {
            if (c.data_emissao) {
                const d = new Date(c.data_emissao);
                const mesIdx = d.getMonth(); // 0 a 11
                if (mesIdx >= 0 && mesIdx <= 11) {
                    contagemMeses[mesIdx]++;
                }
            }
        });

        const siglas = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const mesesObj = {};
        siglas.forEach((sigla, idx) => {
            mesesObj[sigla] = contagemMeses[idx];
        });

        const totalAno = contagemMeses.reduce((sum, val) => sum + val, 0);

        return res.status(200).json({
            success: true,
            message: `Evolução mensal de certificados para o ano ${ano} recuperada com sucesso.`,
            data: {
                ano,
                total_ano: totalAno,
                meses: mesesObj,
                valores: contagemMeses,
                detalhes: siglas.map((sigla, idx) => ({
                    mes: idx + 1,
                    sigla,
                    total: contagemMeses[idx]
                }))
            }
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Erro ao obter evolução mensal de certificados.",
            error: error.message
        });
    }
};

controllersMetricas.getDashboardLpProgress = async (req, res) => {
    try {
        const userId = req.params.userId || req.auth?.sub || req.auth?.id_utilizador;
        const lang = req.query.lang || req.lang || 'pt';

        const learningPaths = await LearningPath.findAll({
            where: { lpAtivo: true },
            include: [
                { model: TraducaoConteudo, as: 'traducao_learning_path' },
                {
                    model: ServiceLine, as: 'service_lines', where: { slAtivo: true }, required: false,
                    include: [
                        { model: TraducaoConteudo, as: 'traducao_service_line' },
                        {
                            model: Area, as: 'areas', where: { areaAtiva: true }, required: false,
                            include: [
                                { model: TraducaoConteudo, as: 'traducao_area' },
                                {
                                    model: NivelArea, as: 'niveis', where: { nivelAtivo: true }, required: false,
                                    include: [
                                        { model: Badge, as: 'badges', where: { badgeAtivo: true }, required: false, attributes: ['id_badge', 'pontos'] }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            ],
            order: [['id_learning_path', 'ASC'], [{ model: ServiceLine, as: 'service_lines' }, 'id_service_line', 'ASC']]
        });

        const candidaturasConcluidas = await Candidatura.findAll({
            where: { id_utilizador: userId, id_estado_candidatura: 4, candidaturaAtiva: true },
            attributes: ['id_badge']
        });
        const idsBadgesConquistados = new Set(candidaturasConcluidas.map(c => c.id_badge));

        const progressoLista = [];

        learningPaths.forEach(lp => {
            const lpNome = lp.traducao_learning_path?.[lang] || lp.traducao_learning_path?.pt || '';
            const serviceLines = lp.service_lines || [];
            
            const slsList = [];
            let sls_completas = 0;
            let sls_em_progresso = 0;

            serviceLines.forEach(sl => {
                const slNome = sl.traducao_service_line?.[lang] || sl.traducao_service_line?.pt || '';
                const areasList = [];
                let areas_completas = 0;
                let areas_em_progresso = 0;

                (sl.areas || []).forEach(area => {
                    const areaNome = area.traducao_area?.[lang] || area.traducao_area?.pt || '';
                    const niveisList = [];
                    let niveis_completos = 0;
                    let niveis_em_progresso = 0;

                    (area.niveis || []).forEach(nivel => {
                        const nivelNome = 'Nível ' + nivel.id_nivel_area;
                        let badges_completos = 0;
                        const total_badges = (nivel.badges || []).length;

                        (nivel.badges || []).forEach(badge => {
                            if (idsBadgesConquistados.has(badge.id_badge)) {
                                badges_completos++;
                            }
                        });

                        if (total_badges > 0) {
                            if (badges_completos === total_badges) {
                                niveis_completos++;
                            } else if (badges_completos > 0) {
                                niveis_em_progresso++;
                            }
                        }

                        niveisList.push({
                            id_nivel: nivel.id_nivel_area,
                            nome: nivelNome,
                            total_badges: total_badges,
                            badges_completos: badges_completos
                        });
                    });

                    const total_niveis = (area.niveis || []).length;
                    if (total_niveis > 0) {
                        if (niveis_completos === total_niveis) {
                            areas_completas++;
                        } else if (niveis_completos > 0 || niveis_em_progresso > 0) {
                            areas_em_progresso++;
                        }
                    }

                    areasList.push({
                        id_area: area.id_area,
                        nome: areaNome,
                        total_niveis: total_niveis,
                        niveis_completos: niveis_completos,
                        niveis_em_progresso: niveis_em_progresso,
                        niveis: niveisList
                    });
                });

                const total_areas = (sl.areas || []).length;
                if (total_areas > 0) {
                    if (areas_completas === total_areas) {
                        sls_completas++;
                    } else if (areas_completas > 0 || areas_em_progresso > 0) {
                        sls_em_progresso++;
                    }
                }

                slsList.push({
                    id_service_line: sl.id_service_line,
                    nome: slNome,
                    total_areas: total_areas,
                    areas_completas: areas_completas,
                    areas_em_progresso: areas_em_progresso,
                    areas: areasList
                });
            });

            progressoLista.push({
                id_learning_path: lp.id_learning_path,
                nome: lpNome,
                total_sls: serviceLines.length,
                sls_completas: sls_completas,
                sls_em_progresso: sls_em_progresso,
                service_lines: slsList
            });
        });

        return res.status(200).json({ success: true, data: progressoLista });
    } catch (error) {
        return res.status(500).json({ success: false, error: error.message });
    }
};

/**
 * GET /metricas/admin/pedidos-pendentes
 * Retorna a contagem de candidaturas pendentes (estados 2 e 3)
 * e o tempo decorrido desde a candidatura mais antiga.
 * Exclusivo para Administrador (PERFIS.ADMIN).
 */
controllersMetricas.getAdminPedidosPendentes = async (req, res) => {
    try {
        const candidaturas = await Candidatura.findAll({
            where: {
                id_estado_candidatura: { [Op.in]: [2, 3] },
                candidaturaAtiva: true
            },
            attributes: ['id_candidatura', 'id_estado_candidatura', 'data_candidatura'],
            order: [['data_candidatura', 'ASC']]
        });

        const total = candidaturas.length;

        let totalSubmetidas = 0; // Estado 2 (aguardando revisão TM)
        let totalEmAnalise = 0;  // Estado 3 (aguardando revisão SLL)

        candidaturas.forEach(c => {
            if (c.id_estado_candidatura === 2) totalSubmetidas++;
            if (c.id_estado_candidatura === 3) totalEmAnalise++;
        });

        if (total === 0) {
            return res.status(200).json({
                success: true,
                message: "Nenhum pedido pendente de validação encontrado.",
                data: {
                    total_pedidos_pendentes: 0,
                    total: 0,
                    quantidade: 0,
                    total_submetidas: 0,
                    total_em_analise: 0,
                    total_aguardando_tm: 0,
                    total_aguardando_sll: 0,
                    data_mais_antiga: null,
                    horas_aguardo_mais_antigo: 0,
                    horas: 0,
                    dias_aguardo_mais_antigo: 0,
                    dias: 0,
                    minutos_aguardo_mais_antigo: 0,
                    tempo_decorrido_formatado: "0 horas"
                }
            });
        }

        const maisAntiga = candidaturas[0];
        const dataMaisAntiga = new Date(maisAntiga.data_candidatura);
        const agora = new Date();

        const diffMs = Math.max(0, agora.getTime() - dataMaisAntiga.getTime());
        const totalMinutos = Math.floor(diffMs / (1000 * 60));
        const totalHoras = Math.floor(diffMs / (1000 * 60 * 60));
        const totalDias = Math.floor(totalHoras / 24);

        let tempoFormatado = '';
        if (totalDias >= 1) {
            tempoFormatado = `${totalDias} ${totalDias === 1 ? 'dia' : 'dias'}`;
        } else {
            tempoFormatado = `${totalHoras} ${totalHoras === 1 ? 'hora' : 'horas'}`;
        }

        return res.status(200).json({
            success: true,
            message: "Métricas de pedidos pendentes recuperadas com sucesso.",
            data: {
                total_pedidos_pendentes: total,
                total: total,
                quantidade: total,
                total_submetidas: totalSubmetidas,
                total_em_analise: totalEmAnalise,
                total_aguardando_tm: totalSubmetidas,
                total_aguardando_sll: totalEmAnalise,
                data_mais_antiga: dataMaisAntiga.toISOString(),
                horas_aguardo_mais_antigo: totalHoras,
                horas: totalHoras,
                dias_aguardo_mais_antigo: totalDias,
                dias: totalDias,
                minutos_aguardo_mais_antigo: totalMinutos,
                tempo_decorrido_formatado: tempoFormatado
            }
        });
    } catch (error) {
        console.error('Erro ao buscar pedidos pendentes do admin:', error);
        return res.status(500).json({
            success: false,
            message: "Erro interno ao calcular métricas de pedidos pendentes.",
            error: error.message
        });
    }
};

/**
 * GET /metricas/admin/consultores-ativos-mensal
 * GET /metricas/admin/utilizadores-mensal
 * Retorna a distribuição mensal de utilizadores registados e ativos para um determinado ano,
 * comparando com o total geral de utilizadores na base de dados.
 * Parâmetro query opcional: ano (ou year). Por defeito: ano atual.
 * Exclusivo para Administrador (PERFIS.ADMIN).
 */
controllersMetricas.getAdminConsultoresAtivosMensal = async (req, res) => {
    try {
        const anoAtual = new Date().getFullYear();
        const anoMinimo = anoAtual - 10;
        const anoMaximo = anoAtual;

        let targetAno = parseInt(req.query.ano || req.query.year, 10);
        if (isNaN(targetAno)) {
            targetAno = anoAtual;
        }

        // Total geral de utilizadores registados na base de dados (ativos ou inativos)
        const totalGeral = await Utilizador.count();

        // Limites para cobrir todos os anos do intervalo permitido (ano atual até -10 anos)
        const inicioPeriodo = new Date(Date.UTC(anoMinimo, 0, 1, 0, 0, 0, 0));
        const fimPeriodo = new Date(Date.UTC(anoMaximo, 11, 31, 23, 59, 59, 999));

        // Procura todos os utilizadores registados no intervalo com conta_ativa = true
        const utilizadores = await Utilizador.findAll({
            where: {
                data_registo: {
                    [Op.gte]: inicioPeriodo,
                    [Op.lte]: fimPeriodo
                },
                conta_ativa: true
            },
            attributes: ['id_utilizador', 'data_registo']
        });

        // Nomes dos meses em português e chaves curtas
        const mesesKeys = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
        const mesesNomes = [
            'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
        ];

        // Estrutura de agregação para cada ano do período
        const agregacaoPorAno = {};
        const anosDisponiveis = [];

        for (let a = anoMaximo; a >= anoMinimo; a--) {
            anosDisponiveis.push(a);
            agregacaoPorAno[a] = {
                total_ativos_ano: 0,
                contagem_meses: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
            };
        }

        // Agrupa cada utilizador pelo ano e mês de registo
        utilizadores.forEach(u => {
            const d = new Date(u.data_registo);
            const yr = d.getUTCFullYear();
            const m = d.getUTCMonth(); // 0 a 11
            if (agregacaoPorAno[yr] && m >= 0 && m <= 11) {
                agregacaoPorAno[yr].total_ativos_ano++;
                agregacaoPorAno[yr].contagem_meses[m]++;
            }
        });

        // Constrói o mapa formatado para cada ano
        const mapaAnos = {};
        const anosComRegistos = [];

        anosDisponiveis.forEach(a => {
            const item = agregacaoPorAno[a];
            const totAno = item.total_ativos_ano;
            if (totAno > 0) {
                anosComRegistos.push(a);
            }

            const mesesObj = {};
            const percentagensAnoObj = {};
            const percentagensTotalGeralObj = {};
            const detalhesMensais = [];

            mesesKeys.forEach((k, idx) => {
                const count = item.contagem_meses[idx];
                // % relativa ao total de registos daquele ano
                const pctAno = totAno > 0 ? Number(((count / totAno) * 100).toFixed(2)) : 0;
                // % relativa ao total geral acumulado na base de dados
                const pctTotGeral = totalGeral > 0 ? Number(((count / totalGeral) * 100).toFixed(2)) : 0;

                mesesObj[k] = count;
                percentagensAnoObj[k] = pctAno;
                percentagensTotalGeralObj[k] = pctTotGeral;

                detalhesMensais.push({
                    mes: idx + 1,
                    chave: k,
                    nome: mesesNomes[idx],
                    contagem: count,
                    percentagem: pctAno, // Por defeito, percentagem sobre o ano
                    percentagem_ano: pctAno,
                    percentagem_total_geral: pctTotGeral
                });
            });

            mapaAnos[a] = {
                ano: a,
                TotalGeral: totalGeral,
                totalGeral: totalGeral,
                total_geral: totalGeral,
                total_ativos_ano: totAno,
                ...mesesObj,
                meses: mesesObj,
                percentagens: percentagensAnoObj,
                percentagens_ano: percentagensAnoObj,
                percentagens_total_geral: percentagensTotalGeralObj,
                detalhes_mensais: detalhesMensais
            };
        });

        // Seleciona os dados do ano solicitado (ou cria vazio se fora do intervalo)
        const dadosAnoSelecionado = mapaAnos[targetAno] || {
            ano: targetAno,
            TotalGeral: totalGeral,
            totalGeral: totalGeral,
            total_geral: totalGeral,
            total_ativos_ano: 0,
            ...Object.fromEntries(mesesKeys.map(k => [k, 0])),
            meses: Object.fromEntries(mesesKeys.map(k => [k, 0])),
            percentagens: Object.fromEntries(mesesKeys.map(k => [k, 0])),
            percentagens_ano: Object.fromEntries(mesesKeys.map(k => [k, 0])),
            percentagens_total_geral: Object.fromEntries(mesesKeys.map(k => [k, 0])),
            detalhes_mensais: mesesKeys.map((k, idx) => ({
                mes: idx + 1,
                chave: k,
                nome: mesesNomes[idx],
                contagem: 0,
                percentagem: 0,
                percentagem_ano: 0,
                percentagem_total_geral: 0
            }))
        };

        return res.status(200).json({
            success: true,
            message: `Métricas mensais de utilizadores ativos para o ano ${targetAno} recuperadas com sucesso.`,
            data: {
                ...dadosAnoSelecionado,
                ano_minimo: anoMinimo,
                ano_maximo: anoMaximo,
                anos_disponiveis: anosDisponiveis,
                anos_com_registos: anosComRegistos,
                anos: mapaAnos
            }
        });
    } catch (error) {
        console.error('Erro ao buscar distribuição mensal de utilizadores do admin:', error);
        return res.status(500).json({
            success: false,
            message: "Erro interno ao calcular distribuição mensal de utilizadores.",
            error: error.message
        });
    }
};

module.exports = controllersMetricas;
