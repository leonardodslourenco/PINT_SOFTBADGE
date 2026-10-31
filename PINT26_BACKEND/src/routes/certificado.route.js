const express = require('express');
const routerCertificado = express.Router();
const controllerCertificado = require('../controllers/certificado.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

// Rota pública para validação de certificados via Microsite
routerCertificado.get(
  '/public/validar',
  controllerCertificado.validarCertificadoPublic
);

// Aplicar middleware de autenticação obrigatória para as restantes rotas
routerCertificado.use(authMiddleware);

// Rota para aceder aos metadados do certificado associado a uma candidatura
routerCertificado.get(
  '/candidatura/:id_candidatura',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerCertificado.detailCertificadoByCandidatura
);

// Rota para descarregar o ficheiro PDF do certificado
routerCertificado.get(
  '/:id_certificado/download',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerCertificado.downloadCertificado
);

// Rota para visualizar o ficheiro PDF do certificado
routerCertificado.get(
  '/:id_certificado/view',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerCertificado.viewCertificado
);

module.exports = routerCertificado;
