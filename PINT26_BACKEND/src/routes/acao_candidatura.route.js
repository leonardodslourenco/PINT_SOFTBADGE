const express = require('express');
const routerAcaoCandidatura = express.Router();
const controllerAcaoCandidatura = require('../controllers/acao_candidatura.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerAcaoCandidatura.use(authMiddleware);

routerAcaoCandidatura.post(
  '/',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerAcaoCandidatura.createAcao
);

routerAcaoCandidatura.get(
  '/',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]),
  controllerAcaoCandidatura.listAcoes
);

routerAcaoCandidatura.get(
  '/candidatura/:idCandidatura',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerAcaoCandidatura.listAcoesByCandidatura
);

routerAcaoCandidatura.get(
  '/:id',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerAcaoCandidatura.detailAcao
);

module.exports = routerAcaoCandidatura;