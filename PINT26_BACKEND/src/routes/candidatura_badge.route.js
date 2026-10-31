const express = require('express');
const routerCandidatura = express.Router();
const controllerCandidatura = require('../controllers/candidatura_badge.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerCandidatura.get(
  '/public/:id',
  controllerCandidatura.detailCandidaturaPublic
);

routerCandidatura.use(authMiddleware);

routerCandidatura.patch(
  '/:id/share',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.CONSULTOR]),
  controllerCandidatura.togglePublicSharing
);

routerCandidatura.post(
  '/',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerCandidatura.createCandidatura
);

routerCandidatura.get(
  '/',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerCandidatura.listCandidaturas
);

routerCandidatura.get(
  '/:id',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerCandidatura.detailCandidatura
);

routerCandidatura.post(
  '/:id/submeter',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerCandidatura.submitCandidatura
);

module.exports = routerCandidatura;