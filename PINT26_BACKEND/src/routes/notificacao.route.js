const express = require('express');
const routerNotificacao = express.Router();
const controllerNotificacao = require('../controllers/notificacao.controller');
const authMiddleware = require('../middlewares/auth.middleware');

routerNotificacao.use(authMiddleware);

routerNotificacao.get('/', controllerNotificacao.listMinhasNotificacoes);
routerNotificacao.get('/nao-lidas-count', controllerNotificacao.countNaoLidas);
routerNotificacao.put('/lidas-todas', controllerNotificacao.marcarTodasComoLidas);
routerNotificacao.post('/lidas-todas', controllerNotificacao.marcarTodasComoLidas);
routerNotificacao.put('/:id/lida', controllerNotificacao.marcarComoLida);
routerNotificacao.post('/:id/lida', controllerNotificacao.marcarComoLida);
routerNotificacao.patch('/:id/lida', controllerNotificacao.marcarComoLida);

module.exports = routerNotificacao;
