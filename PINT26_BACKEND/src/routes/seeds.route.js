const express = require('express');
const router = express.Router();
const seedsController = require('../controllers/seeds.controller');
const verificaToken = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

// Ambas as rotas protegidas pelo middleware de autenticação JWT e de perfil Administrador
router.post('/all', verificaToken, autorizarPerfis([PERFIS.ADMIN]), seedsController.seedAll);
router.post('/:entidade', verificaToken, autorizarPerfis([PERFIS.ADMIN]), seedsController.seedEntity);

module.exports = router;