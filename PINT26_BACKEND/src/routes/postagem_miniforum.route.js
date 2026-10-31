const express = require('express');
const routerPostagemMiniforum = express.Router();
const controllerPostagemMiniforum = require('../controllers/postagem_miniforum.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

routerPostagemMiniforum.use(authMiddleware);

routerPostagemMiniforum.get('/categorias', controllerPostagemMiniforum.listCategorias);
routerPostagemMiniforum.get('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerPostagemMiniforum.listPostagens);
routerPostagemMiniforum.get('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), controllerPostagemMiniforum.detailPostagem);
routerPostagemMiniforum.post('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerPostagemMiniforum.createPostagem);
routerPostagemMiniforum.put('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerPostagemMiniforum.updatePostagem);
routerPostagemMiniforum.post('/:id/lida', controllerPostagemMiniforum.marcarComoLida);
routerPostagemMiniforum.put('/:id/lida', controllerPostagemMiniforum.marcarComoLida);
routerPostagemMiniforum.patch('/:id/lida', controllerPostagemMiniforum.marcarComoLida);
routerPostagemMiniforum.delete('/:id', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controllerPostagemMiniforum.deletePostagem);

module.exports = routerPostagemMiniforum;
