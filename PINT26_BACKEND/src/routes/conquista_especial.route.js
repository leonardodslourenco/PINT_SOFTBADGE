const express = require('express');
const routerConquistaEspecial = express.Router();
const controllerConquistaEspecial = require('../controllers/conquista_especial.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');
const uploadLogoEspecial = require('../middlewares/uploadLogoEspecial.middleware');

routerConquistaEspecial.use(authMiddleware);

// Endpoints auxiliares para dropdowns
routerConquistaEspecial.get('/tipos', controllerConquistaEspecial.listTipos);
routerConquistaEspecial.get('/configuracoes', controllerConquistaEspecial.listConfiguracoes);

// CRUD de Badges Especiais
routerConquistaEspecial.post(
  '/',
  autorizarPerfis([PERFIS.ADMIN]),
  uploadLogoEspecial.single('logo'),
  controllerConquistaEspecial.createConquistaEspecial
);

routerConquistaEspecial.get('/', controllerConquistaEspecial.listConquistasEspeciais);
routerConquistaEspecial.get('/:id', controllerConquistaEspecial.getConquistaEspecialById);

routerConquistaEspecial.put(
  '/:id',
  autorizarPerfis([PERFIS.ADMIN]),
  uploadLogoEspecial.single('logo'),
  controllerConquistaEspecial.updateConquistaEspecial
);

routerConquistaEspecial.delete(
  '/:id',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerConquistaEspecial.deleteConquistaEspecial
);

module.exports = routerConquistaEspecial;
