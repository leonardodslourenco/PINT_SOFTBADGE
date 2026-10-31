const express = require('express');
const routerEstadoCandidatura = express.Router();
const controllerEstadoCandidatura = require('../controllers/estado_candidatura.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerEstadoCandidatura.use(authMiddleware);

routerEstadoCandidatura.get(
  '/',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]),
  controllerEstadoCandidatura.listEstadoCandidatura
);

routerEstadoCandidatura.get(
  '/:id',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerEstadoCandidatura.detailEstadoCandidatura
);

module.exports = routerEstadoCandidatura;