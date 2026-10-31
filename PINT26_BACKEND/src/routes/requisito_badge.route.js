const express = require('express');
const routerRequisitoBadge = express.Router();
const controllerRequisitoBadge = require('../controllers/requisito_badge.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerRequisitoBadge.use(authMiddleware);

routerRequisitoBadge.post('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerRequisitoBadge.createRequisitoBadge);
routerRequisitoBadge.get('/catalogo/badge/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerRequisitoBadge.listRequisitoByBadgeCatalogo);
routerRequisitoBadge.get('/', controllerRequisitoBadge.listRequisitoBadge);
routerRequisitoBadge.get('/badge/:id', controllerRequisitoBadge.listRequisitoByBadge);
routerRequisitoBadge.get('/:id', controllerRequisitoBadge.detailRequisitoBadge);
routerRequisitoBadge.put('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerRequisitoBadge.updateRequisitoBadge);
routerRequisitoBadge.patch('/:id/status', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerRequisitoBadge.updateStatusRequisitoBadge);
routerRequisitoBadge.delete('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerRequisitoBadge.deleteRequisitoBadge);

module.exports = routerRequisitoBadge;
