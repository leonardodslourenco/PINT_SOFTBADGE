const express = require('express');
const routerService = express.Router();
const controllerTradutor = require('../controllers/tradutor.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerService.use(authMiddleware);

routerService.post(
  '/tradutor',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerTradutor.traduzirConteudo
);

module.exports = routerService;