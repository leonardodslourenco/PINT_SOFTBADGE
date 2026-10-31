const express = require('express');
const routerUtilizadorMarco = express.Router();
const controllerUtilizadorMarco = require('../controllers/utilizador_marco.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerUtilizadorMarco.use(authMiddleware);

// Lista todos os tipos de marcos disponíveis
routerUtilizadorMarco.get(
  '/tipos',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerUtilizadorMarco.listarTipos
);

// Lista todas as configurações/catálogo de marcos (somente leitura para Consultores e outros perfis)
routerUtilizadorMarco.get(
  '/configuracoes',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerUtilizadorMarco.listarConfiguracoes
);

routerUtilizadorMarco.get(
  '/catalogo',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerUtilizadorMarco.listarConfiguracoes
);

routerUtilizadorMarco.get(
  '/todos',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerUtilizadorMarco.listarConfiguracoes
);

// Criação, Edição e Inativação de Configurações de Marcos (APENAS ADMINISTRADOR)
routerUtilizadorMarco.post(
  '/configuracoes',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerUtilizadorMarco.criarConfiguracao
);

routerUtilizadorMarco.put(
  '/configuracoes/:id',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerUtilizadorMarco.atualizarConfiguracao
);

routerUtilizadorMarco.delete(
  '/configuracoes/:id',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerUtilizadorMarco.eliminarConfiguracao
);

// Obter marcos conquistados pendentes de celebração visual
routerUtilizadorMarco.get(
  '/por-celebrar',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerUtilizadorMarco.getMarcosPorCelebrar
);

// Obter histórico de marcos conquistados pelo utilizador
routerUtilizadorMarco.get(
  '/meus-marcos',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerUtilizadorMarco.getMeusMarcos
);

// Marcar um marco como celebrado após exibição no frontend
routerUtilizadorMarco.put(
  '/:idMarco/celebrar',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerUtilizadorMarco.marcarComoCelebrado
);

module.exports = routerUtilizadorMarco;
