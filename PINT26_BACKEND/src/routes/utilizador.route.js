const express = require('express');
const routerUtilizador = express.Router();
const controllerUtilizador = require('../controllers/utilizador.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');
const uploadAvatar = require('../middlewares/uploadAvatar.middleware');

routerUtilizador.get('/public/:id', controllerUtilizador.getPublicProfile);

routerUtilizador.use(authMiddleware);

routerUtilizador.post('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), uploadAvatar.single('avatar'), controllerUtilizador.createUtilizador);
routerUtilizador.get('/', controllerUtilizador.listUtilizador);
routerUtilizador.get('/perfil/:id_perfil', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerUtilizador.listByPerfil);
routerUtilizador.get('/:id', controllerUtilizador.detailUtilizador);
routerUtilizador.put('/rgpd/aceitar', controllerUtilizador.aceitarRGPD);
routerUtilizador.put('/rgpd', controllerUtilizador.aceitarRGPD);
routerUtilizador.put('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), uploadAvatar.single('avatar'), controllerUtilizador.updateUtilizador);
routerUtilizador.patch('/:id/status', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerUtilizador.updateStatusUtilizador);  // ativar/desativar conta
routerUtilizador.patch('/:id/unlock', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerUtilizador.unlockUtilizador);  // desbloquear conta por excesso de tentativas
routerUtilizador.delete('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerUtilizador.deleteUtilizador);              // soft-delete

module.exports = routerUtilizador;