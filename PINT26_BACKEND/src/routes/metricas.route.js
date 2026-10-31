const express = require('express');
const routerMetricas = express.Router();
const controllerMetricas = require('../controllers/metricas.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerMetricas.use(authMiddleware);

// =========================================================================
// MÉTRICAS GERAIS (Admin / SLL / TM)
// =========================================================================
routerMetricas.get('/utilizadores_total', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerMetricas.utilizadoresTotal);
routerMetricas.get('/utilizadores_comparativo_mesanterior', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerMetricas.utilizadoresComparativoMesAnterior);
routerMetricas.get('/badges_total', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerMetricas.badgesTotal);
routerMetricas.get('/candidaturas/estado-contagem', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerMetricas.getCandidaturasEstadoContagem);
routerMetricas.get('/candidaturas-especiais/estado-contagem', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerMetricas.getCandidaturasEspeciaisEstadoContagem);
routerMetricas.get('/badges-atribuidos/distribuicao', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerMetricas.getDistribuicaoBadgesAtribuidos);
routerMetricas.get('/badges-distribuicao', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerMetricas.getDistribuicaoBadgesAtribuidos);
routerMetricas.get('/certificados/evolucao-mensal', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerMetricas.getCertificadosEvolucaoMensal);
routerMetricas.get('/certificados-evolucao-mensal', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerMetricas.getCertificadosEvolucaoMensal);

// =========================================================================
// SLA (Admin / SLL / TM)
// =========================================================================
routerMetricas.get('/sla/config', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerMetricas.getSlaConfig);
routerMetricas.put('/sla/config', autorizarPerfis([PERFIS.ADMIN]), controllerMetricas.updateSlaConfig);
routerMetricas.post('/expiracao/verificar', autorizarPerfis([PERFIS.ADMIN]), controllerMetricas.verificarExpiracoesManual);

// =========================================================================
// DASHBOARD TM — /metricas/dashboard/tm
// =========================================================================
routerMetricas.get('/dashboard/tm', autorizarPerfis([PERFIS.ADMIN, PERFIS.TM]), controllerMetricas.getDashboardTmMetrics);

// =========================================================================
// DASHBOARD CONSULTOR — /metricas/con-dashboard/...
// =========================================================================
routerMetricas.get('/con-dashboard/metricas-gerais', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerMetricas.getDashboardConsultorMetrics);
routerMetricas.get('/con-dashboard/progresso-lp', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerMetricas.getConsultorProgressoLP);
routerMetricas.get('/dashboard/lp-progress/:userId', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerMetricas.getDashboardLpProgress);
routerMetricas.get('/con-dashboard/badges-total', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerMetricas.getConsultorBadgesTotal);
routerMetricas.get('/con-dashboard/candidaturas-ativas', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerMetricas.getConsultorCandidaturasAtivas);
routerMetricas.get('/con-dashboard/atividades-recentes', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerMetricas.getConsultorAtividadesRecentes);
routerMetricas.get('/con-dashboard/recomendacoes-badges', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerMetricas.getConsultorRecomendacoesBadges);

// =========================================================================
// RANKING GERAL (Disponível para todos os perfis: Admin, SLL, TM e Consultor)
// =========================================================================
routerMetricas.get('/ranking-geral', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerMetricas.getRankingGeral);

// =========================================================================
// DASHBOARD SLL — /metricas/sll-dashboard/...
// =========================================================================
routerMetricas.get('/sll-dashboard/badges-mes', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerMetricas.getBadgesConquistadosMes);
routerMetricas.get('/sll-dashboard/candidaturas-pendentes', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerMetricas.getCandidaturasEstadoContagem);
routerMetricas.get('/sll-dashboard/top-consultor', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerMetricas.getTopConsultorSL);
routerMetricas.get('/sll-dashboard/sla-status', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerMetricas.getSlaStatus);
routerMetricas.get('/sll-dashboard/listagem-consultores', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerMetricas.getListagemConsultoresSL);
routerMetricas.get('/sll-dashboard/ranking-geral', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerMetricas.getRankingSll);
routerMetricas.get('/sll-dashboard/atividades-recentes', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerMetricas.getAtividadesRecentes);
routerMetricas.get('/sll-dashboard/contagem-areas', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerMetricas.getContagemPorArea);

// =========================================================================
// DASHBOARD ADMIN — /metricas/admin/...
// =========================================================================
routerMetricas.get('/admin/pedidos-pendentes', autorizarPerfis([PERFIS.ADMIN]), controllerMetricas.getAdminPedidosPendentes);
routerMetricas.get('/admin-dashboard/pedidos-pendentes', autorizarPerfis([PERFIS.ADMIN]), controllerMetricas.getAdminPedidosPendentes);
routerMetricas.get('/admin/consultores-ativos-mensal', autorizarPerfis([PERFIS.ADMIN]), controllerMetricas.getAdminConsultoresAtivosMensal);
routerMetricas.get('/admin/utilizadores-mensal', autorizarPerfis([PERFIS.ADMIN]), controllerMetricas.getAdminConsultoresAtivosMensal);
routerMetricas.get('/admin-dashboard/consultores-ativos-mensal', autorizarPerfis([PERFIS.ADMIN]), controllerMetricas.getAdminConsultoresAtivosMensal);

module.exports = routerMetricas;


