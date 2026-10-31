const express = require('express');
const routerObjetivoConsultor = express.Router();
const controllerObjetivoConsultor = require('../controllers/objetivo_consultor.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');

// Todas as rotas deste subsistema exigem autenticação válida e perfil de Consultor
routerObjetivoConsultor.use(authMiddleware);
routerObjetivoConsultor.use(autorizarPerfis([PERFIS.CONSULTOR]));

// 1. Listar os tipos de objetivos disponíveis (5 tipos fixos)
routerObjetivoConsultor.get(
  '/tipos',
  controllerObjetivoConsultor.listarTipos
);

// 2. Criar um novo objetivo pessoal
routerObjetivoConsultor.post(
  '/',
  controllerObjetivoConsultor.criarObjetivo
);

// 3. Listar objetivos do consultor autenticado (suporta ?status=ativos|cumpridos|expirados|cancelados|todos)
routerObjetivoConsultor.get(
  '/meus',
  controllerObjetivoConsultor.listarMeusObjetivos
);

// 4. Obter detalhe de um objetivo específico do consultor
routerObjetivoConsultor.get(
  '/:id',
  controllerObjetivoConsultor.obterObjetivo
);

// 5. Cancelar um objetivo pendente (soft-delete)
routerObjetivoConsultor.delete(
  '/:id',
  controllerObjetivoConsultor.cancelarObjetivo
);

module.exports = routerObjetivoConsultor;
