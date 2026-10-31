const express = require('express');
const routerServiceLine = express.Router();
const controllerServiceLine = require('../controllers/service_line.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerServiceLine.use(authMiddleware);

routerServiceLine.post('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerServiceLine.createServiceLine);
routerServiceLine.get('/', controllerServiceLine.listServiceLine);
routerServiceLine.get('/lp/:id', controllerServiceLine.listServiceLineByLP);
routerServiceLine.get('/sll/:id', controllerServiceLine.listServiceLineBySLL);
routerServiceLine.get('/:id', controllerServiceLine.detailServiceLine);
routerServiceLine.put('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerServiceLine.updateServiceLine);
routerServiceLine.patch('/:id/status', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerServiceLine.updateStatusServiceLine);
routerServiceLine.delete('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerServiceLine.deleteServiceLine);

module.exports = routerServiceLine;