const express = require('express');
const routerTipoAcao = express.Router();
const controllerTipoAcao = require('../controllers/tipo_acao.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerTipoAcao.use(authMiddleware);

routerTipoAcao.get(
  '/',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]),
  controllerTipoAcao.listTipoAcao
);

routerTipoAcao.get(
  '/:id',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerTipoAcao.detailTipoAcao
);

module.exports = routerTipoAcao;