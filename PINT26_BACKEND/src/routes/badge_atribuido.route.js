const express = require('express');
const routerBadgeAtribuido = express.Router();
const controllerBadgeAtribuido = require('../controllers/badge_atribuido.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerBadgeAtribuido.use(authMiddleware);

routerBadgeAtribuido.get('/dashboard_sl', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerBadgeAtribuido.getDashboardSlSummary);
routerBadgeAtribuido.get('/', controllerBadgeAtribuido.listBadgesAtribuidos);
routerBadgeAtribuido.get('/:id', controllerBadgeAtribuido.detailBadgeAtribuido);
routerBadgeAtribuido.post('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerBadgeAtribuido.createBadgeAtribuido);

module.exports = routerBadgeAtribuido;