const express = require('express');
const routerBadge = express.Router();
const controllerBadge = require('../controllers/badge.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

const uploadLogoBadge = require('../middlewares/uploadLogoBadge.middleware');

routerBadge.get('/public/random', controllerBadge.getRandomBadgesPublic);

routerBadge.use(authMiddleware);

//Rotas Estáticas
routerBadge.get('/sync', controllerBadge.sync);
routerBadge.get('/catalogo', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerBadge.getCatalogoBadges);
routerBadge.get('/catalogo/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerBadge.getBadgeDetailCatalogo);
//Rotas com Prefixos
routerBadge.get('/nivel/:id', controllerBadge.listBadgeByNivel);
//Rotas de Raiz
routerBadge.post('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), uploadLogoBadge.single('logo'), controllerBadge.createBadge);
routerBadge.get('/', controllerBadge.listBadge);
//Rotas Dinâmicas
routerBadge.get('/:id', controllerBadge.detailBadge);
routerBadge.put('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), uploadLogoBadge.single('logo'), controllerBadge.updateBadge);
routerBadge.patch('/:id/status', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerBadge.updateStatusBadge);
routerBadge.delete('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerBadge.deleteBadge);

module.exports = routerBadge;