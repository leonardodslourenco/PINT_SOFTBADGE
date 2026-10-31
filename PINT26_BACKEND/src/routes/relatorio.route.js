const express = require('express');
const routerRelatorio = express.Router();
const controllersRelatorio = require('../controllers/relatorio.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

// Proteção por autenticação
routerRelatorio.use(authMiddleware);

// Perfis com acesso aos relatórios: Administrador, Service Line Leader (SLL) e Team Manager (TM)
const perfisGestao = [PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM];

// 1. Relatório de Badges Atribuídos por Área e Período
routerRelatorio.post('/badges-atribuidos', autorizarPerfis(perfisGestao), controllersRelatorio.relatorioBadgesAtribuidos);
routerRelatorio.get('/badges-atribuidos', autorizarPerfis(perfisGestao), controllersRelatorio.relatorioBadgesAtribuidos);

// 2. Relatório de Candidaturas / Pedidos por Estado (1 a 5 ou 6 para todos)
routerRelatorio.post('/candidaturas', autorizarPerfis(perfisGestao), controllersRelatorio.relatorioCandidaturas);
routerRelatorio.get('/candidaturas', autorizarPerfis(perfisGestao), controllersRelatorio.relatorioCandidaturas);

// 3. Relatório do Catálogo Geral de Badges
routerRelatorio.post('/badges', autorizarPerfis(perfisGestao), controllersRelatorio.relatorioBadges);
routerRelatorio.get('/badges', autorizarPerfis(perfisGestao), controllersRelatorio.relatorioBadges);

// 4. Relatório Geral sobre os Consultores
routerRelatorio.post('/consultores', autorizarPerfis(perfisGestao), controllersRelatorio.relatorioConsultores);
routerRelatorio.get('/consultores', autorizarPerfis(perfisGestao), controllersRelatorio.relatorioConsultores);

module.exports = routerRelatorio;
