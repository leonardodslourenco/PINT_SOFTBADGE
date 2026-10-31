const express = require('express');
const routerCompetencia = express.Router();
const controllerCompetencia = require('../controllers/competencia.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

// Rotas públicas para visualização no Microsite / Frontend (Sem Token)
routerCompetencia.get('/public', controllerCompetencia.listCompetenciasPublic);
routerCompetencia.get('/public/:id', controllerCompetencia.detailCompetenciaPublic);

// Aplicar middleware de autenticação obrigatória para as restantes rotas
routerCompetencia.use(authMiddleware);

// Listar e detalhar competências (todos os perfis autenticados)
routerCompetencia.get(
  '/',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerCompetencia.listCompetencias
);

routerCompetencia.get(
  '/:id',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerCompetencia.detailCompetencia
);

// Criação, Edição e Eliminação (APENAS ADMINISTRADOR)
routerCompetencia.post(
  '/',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerCompetencia.createCompetencia
);

routerCompetencia.put(
  '/:id',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerCompetencia.updateCompetencia
);

routerCompetencia.delete(
  '/:id',
  autorizarPerfis([PERFIS.ADMIN]),
  controllerCompetencia.deleteCompetencia
);

module.exports = routerCompetencia;