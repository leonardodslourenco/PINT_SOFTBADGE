const express = require('express');
const routerPerfil = express.Router();
const controllerPerfil = require('../controllers/perfil.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerPerfil.use(authMiddleware);

routerPerfil.post('/', autorizarPerfis([PERFIS.ADMIN]), controllerPerfil.createPerfil);
routerPerfil.get('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerPerfil.listPerfil);
routerPerfil.get('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerPerfil.detailPerfil);
routerPerfil.put('/:id', autorizarPerfis([PERFIS.ADMIN]), controllerPerfil.updatePerfil);
routerPerfil.delete('/:id', autorizarPerfis([PERFIS.ADMIN]), controllerPerfil.deletePerfil);

module.exports = routerPerfil;