const express = require('express');
const router = express.Router();
const controller = require('../controllers/perfil_utilizador.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

router.use(authMiddleware);

router.post('/', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controller.addPerfil);
router.get('/:id_utilizador', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controller.listPerfis);
router.delete('/:id_utilizador/:id_perfil', autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]), controller.deletePerfil);

module.exports = router;