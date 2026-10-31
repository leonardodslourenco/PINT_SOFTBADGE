const express = require('express');
const routerArea = express.Router();
const controllerArea = require('../controllers/area.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerArea.use(authMiddleware);

routerArea.post('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerArea.createArea);
routerArea.get('/', controllerArea.listArea);
routerArea.get('/sl/:id', controllerArea.listAreaBySL);
routerArea.get('/:id', controllerArea.detailArea);
routerArea.put('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerArea.updateArea);
routerArea.patch('/:id/status', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerArea.updateStatusArea);
routerArea.delete('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerArea.deleteArea);

module.exports = routerArea;