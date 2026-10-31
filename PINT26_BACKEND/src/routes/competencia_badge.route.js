const express = require('express');
const routerCompetenciaBadge = express.Router();
const controllerCompetenciaBadge = require('../controllers/competencia_badge.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

// Rota pública para listar competências de um badge (Microsite / Frontend público)
routerCompetenciaBadge.get(
  '/public/badge/:idBadge',
  controllerCompetenciaBadge.listByBadge
);

// Aplicar middleware de autenticação obrigatória para as restantes rotas
routerCompetenciaBadge.use(authMiddleware);

routerCompetenciaBadge.get(
  '/',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerCompetenciaBadge.listRelacionamentos
);

routerCompetenciaBadge.get(
  '/badge/:idBadge',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerCompetenciaBadge.listByBadge
);

// Criar e eliminar relacionamentos (ADMIN e SLL)
routerCompetenciaBadge.post(
  '/',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]),
  controllerCompetenciaBadge.createRelacionamento
);

routerCompetenciaBadge.delete(
  '/:idCompetencia/:idBadge',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]),
  controllerCompetenciaBadge.deleteRelacionamento
);

module.exports = routerCompetenciaBadge;