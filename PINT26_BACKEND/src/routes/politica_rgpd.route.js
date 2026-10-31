const express = require('express');
const routerPoliticaRGPD = express.Router();
const controllerPoliticaRGPD = require('../controllers/politica_rgpd.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

// Obriga à autenticação com token JWT válido para todas as rotas
routerPoliticaRGPD.use(authMiddleware);

// Obter política de RGPD (acessível por qualquer perfil autenticado)
routerPoliticaRGPD.get(
  '/',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerPoliticaRGPD.getPolitica
);

// Atualizar política de RGPD (restrito apenas ao Admin)
routerPoliticaRGPD.put(
  '/',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerPoliticaRGPD.updatePolitica
);

module.exports = routerPoliticaRGPD;
