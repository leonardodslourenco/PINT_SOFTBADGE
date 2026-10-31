const express = require('express');
const routerConfigBadgeEspecial = express.Router();
const controllerConfigBadgeEspecial = require('../controllers/configuracao_badge_especial.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerConfigBadgeEspecial.use(authMiddleware);

routerConfigBadgeEspecial.get('/', controllerConfigBadgeEspecial.listConfiguracoes);

routerConfigBadgeEspecial.post(
  '/',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerConfigBadgeEspecial.createConfiguracao
);

routerConfigBadgeEspecial.delete(
  '/:id',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerConfigBadgeEspecial.deleteConfiguracao
);

module.exports = routerConfigBadgeEspecial;
