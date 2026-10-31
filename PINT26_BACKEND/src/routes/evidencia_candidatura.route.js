const express = require('express');
const routerEvidencia = express.Router();
const controllerEvidencia = require('../controllers/evidencia_candidatura.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');
const uploadEvidencia = require('../middlewares/uploadEvidencia.middleware');

routerEvidencia.use(authMiddleware);

routerEvidencia.post(
  '/',
  uploadEvidencia,
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerEvidencia.createEvidencias
);

routerEvidencia.get(
  '/candidatura/:idCandidatura',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerEvidencia.listByCandidatura
);

routerEvidencia.put(
  '/:idEvidencia/validacao',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]),
  controllerEvidencia.validateEvidencia
);


routerEvidencia.get(
  '/minhas',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]), // Proteção aplicada!
  controllerEvidencia.listMyEvidencias
);

// Visualização inline segura do documento PDF (com controlo estrito de permissões)
routerEvidencia.get(
  '/:idEvidencia/view',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerEvidencia.viewEvidencia
);

// Download do ficheiro da evidência
routerEvidencia.get(
  '/:idEvidencia/download',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerEvidencia.downloadEvidencia
);

module.exports = routerEvidencia;