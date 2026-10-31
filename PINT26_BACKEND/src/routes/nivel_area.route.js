const express = require('express');
const routerNivelArea = express.Router();
const controllerNivelArea = require('../controllers/nivel_area.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerNivelArea.use(authMiddleware);

routerNivelArea.post('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerNivelArea.createNivelArea);
routerNivelArea.get('/', controllerNivelArea.listNivelArea);
routerNivelArea.get('/area/:id', controllerNivelArea.listNivelByArea);   // listar por Área
routerNivelArea.get('/catalogo/area/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerNivelArea.listNivelByAreaCatalogo);
routerNivelArea.get('/catalogo', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerNivelArea.listNivelAreaCatalogo);
routerNivelArea.get('/:id', controllerNivelArea.detailNivelArea);
routerNivelArea.put('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerNivelArea.updateNivelArea);
routerNivelArea.patch('/:id/status', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerNivelArea.updateStatusNivelArea);
routerNivelArea.delete('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]), controllerNivelArea.deleteNivelArea);

module.exports = routerNivelArea;