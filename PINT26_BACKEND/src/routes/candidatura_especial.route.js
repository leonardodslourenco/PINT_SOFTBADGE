const express = require('express');
const routerCandidaturaEspecial = express.Router();
const controllerCandidaturaEspecial = require('../controllers/candidatura_especial.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');
const uploadCertificadoEspecial = require('../middlewares/uploadCertificadoEspecial.middleware');

// Rotas Públicas para o Microsite / Shares (sem autenticação)
routerCandidaturaEspecial.get(
  '/public/:id',
  controllerCandidaturaEspecial.detailCandidaturaEspecialPublic
);

routerCandidaturaEspecial.get(
  '/public/:id_candidatura/:id_conquista',
  controllerCandidaturaEspecial.detailCandidaturaEspecialPublic
);

routerCandidaturaEspecial.use(authMiddleware);

// Consultor: Submeter candidatura a Badge Especial (com suporte a anexo PDF)
routerCandidaturaEspecial.post(
  '/',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.CONSULTOR]),
  uploadCertificadoEspecial.single('ficheiro_comprovativo'),
  controllerCandidaturaEspecial.createCandidatura
);

// Consultor: Listar as suas próprias candidaturas
routerCandidaturaEspecial.get(
  '/minhas',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.CONSULTOR]),
  controllerCandidaturaEspecial.listMinhasCandidaturas
);

// Consultor / Assinatura de Email: Listar conquistas especiais aprovadas e partilháveis
routerCandidaturaEspecial.get(
  '/assinatura',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.CONSULTOR, PERFIS.TM, PERFIS.SLL]),
  controllerCandidaturaEspecial.listConquistasAssinatura
);

// Admin: Listar todas as candidaturas especiais
routerCandidaturaEspecial.get(
  '/',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerCandidaturaEspecial.listAllCandidaturas
);

// Consultor / Admin: Detalhe de uma candidatura especial
routerCandidaturaEspecial.get(
  '/:id',
  controllerCandidaturaEspecial.getCandidaturaById
);

// Consultor / Admin: Download / visualização do PDF comprovativo
routerCandidaturaEspecial.get(
  '/:id/ficheiro',
  controllerCandidaturaEspecial.downloadFicheiro
);

// Admin: Decidir candidatura (Aprovar ou Recusar)
routerCandidaturaEspecial.patch(
  '/:id/decisao',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerCandidaturaEspecial.decidirCandidatura
);

// Consultor: Comutar partilha pública da conquista (RGPD)
routerCandidaturaEspecial.patch(
  '/:id/share',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.CONSULTOR]),
  controllerCandidaturaEspecial.toggleShare
);

module.exports = routerCandidaturaEspecial;
