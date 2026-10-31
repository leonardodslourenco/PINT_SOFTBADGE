const express = require('express');
const routerRenovacao = express.Router();
const controllerRenovacao = require('../controllers/renovacao_badge.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { PERFIS, autorizarPerfis } = require('../middlewares/permissao.middleware');
const uploadEvidencia = require('../middlewares/uploadEvidencia.middleware');

routerRenovacao.use(authMiddleware);

// ==========================================
// ROTAS PARA O CONSULTOR (Área Pessoal)
// ==========================================

// 1. Criar solicitação de renovação (Consultor)
routerRenovacao.post(
  '/solicitar',
  autorizarPerfis([PERFIS.CONSULTOR, PERFIS.ADMIN, PERFIS.SLL]),
  controllerRenovacao.solicitarRenovacao
);

// 2. Listar badges elegíveis para renovação (Aba 1 do consultor - expirando / expirados / rejeitados)
routerRenovacao.get(
  '/elegiveis',
  autorizarPerfis([PERFIS.CONSULTOR, PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]),
  controllerRenovacao.listarElegiveis
);

// 3. Listar histórico de pedidos de renovação do próprio utilizador (Aba 2 do consultor)
routerRenovacao.get(
  '/minhas',
  autorizarPerfis([PERFIS.CONSULTOR, PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]),
  controllerRenovacao.listarMinhas
);

// ==========================================
// ROTAS DE GESTÃO E MODERAÇÃO (Admin, SLL e TM apenas leitura)
// ==========================================

// 4. Listar todos os badges a expirar na organização / Service Line (Admin, SLL e TM)
routerRenovacao.get(
  '/gestao/expirando',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]),
  controllerRenovacao.listarGestaoExpirando
);

// 5. Listar histórico geral de pedidos de renovação com filtros de estado (Admin, SLL e TM)
routerRenovacao.get(
  '/gestao/pedidos',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]),
  controllerRenovacao.listarGestaoPedidos
);

// 6. Listar renovações pendentes de aprovação (Admin, SLL e TM)
routerRenovacao.get(
  '/pendentes',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM]),
  controllerRenovacao.listarPendentes
);

// 4. Detalhes de um pedido de renovação
routerRenovacao.get(
  '/:id',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerRenovacao.obterDetalhe
);

// 5. Aprovar renovação de badge (Admin e SLL - TM excluído / apenas leitura)
routerRenovacao.put(
  '/:id/aprovar',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]),
  controllerRenovacao.aprovarRenovacao
);

// 5.1. Rejeitar / Recusar renovação de badge (Admin e SLL - TM excluído / apenas leitura)
routerRenovacao.put(
  '/:id/rejeitar',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]),
  controllerRenovacao.rejeitarRenovacao
);

// 6. Upload de evidência para o pedido de renovação (Consultor ou moderadores Admin/SLL)
routerRenovacao.post(
  '/:id/evidencia',
  uploadEvidencia,
  autorizarPerfis([PERFIS.CONSULTOR, PERFIS.ADMIN, PERFIS.SLL]),
  controllerRenovacao.uploadEvidencia
);

// 7. Validação de evidência de renovação (Admin e SLL - TM excluído / apenas leitura)
routerRenovacao.put(
  '/evidencia/:idEvidencia/validacao',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL]),
  controllerRenovacao.validarEvidencia
);

// 8. Visualização inline do ficheiro PDF da evidência de renovação
routerRenovacao.get(
  '/evidencia/:idEvidencia/view',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerRenovacao.viewEvidencia
);

// 9. Download do ficheiro de evidência de renovação
routerRenovacao.get(
  '/evidencia/:idEvidencia/download',
  autorizarPerfis([PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM, PERFIS.CONSULTOR]),
  controllerRenovacao.downloadEvidencia
);

module.exports = routerRenovacao;
