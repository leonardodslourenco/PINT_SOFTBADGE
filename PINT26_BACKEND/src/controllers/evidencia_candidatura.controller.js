// =========================================================================
// IMPORTAÇÃO DE MODELOS ORM, COMPONENTES DE BASE DE DADOS E DEPENDÊNCIAS
// =========================================================================
const fs = require('fs');
const path = require('path');
const { Op } = require('sequelize');                                       // Operadores lógicos do Sequelize (ex: Op.in para listas)
const EvidenciaCandidatura = require('../models/evidencia.model');         // Modelo da tabela de Evidências
const Candidatura = require('../models/candidatura_badge.model');           // Modelo da tabela de Candidaturas
const Badge = require('../models/badge.model');                             // Modelo da tabela de Badges
const RequisitoBadge = require('../models/requisito_badge.model');           // Modelo de Requisitos associados ao Badge
const sequelize = require('../config/database');                            // Ligação à BD para gerir transações estruturadas
const { PERFIS } = require('../middlewares/permissao.middleware');          // Dicionário de Perfis do sistema para autorização
const validaUUID = require('../services/valida_UUID');                      // Utilitário para validar formato estrito UUIDv7
const { TIPOS_ACAO, criarAcao } = require('../services/acao_candidatura.service'); // Serviço para registo de histórico/auditoria

const controllersEvidencia = {};

// Constantes de controlo de estados e perfis administrativos
const ESTADOS = { OPEN: 1 };
const perfisGestao = [PERFIS.ADMIN, PERFIS.SLL, PERFIS.TM];

// =========================================================================
// FUNÇÕES AUXILIARES / INTERNAS (MÉTODOS PRIVADOS DE AJUDA)
// =========================================================================

/**
 * HELPER: temPerfil
 * Valida se os perfis do token JWT do utilizador coincidem com uma lista permitida.
 */
function temPerfil(req, perfis) {
  const perfisToken = req.auth?.perfis || [];
  return perfis.some(perfil => perfisToken.includes(perfil));
}

/**
 * HELPER: getUtilizadorAutenticado
 * Captura o ID seguro do utilizador logado decodificado a partir do JWT.
 */
function getUtilizadorAutenticado(req) {
  return req.auth?.sub || req.auth?.id_utilizador || null;
}

/**
 * HELPER: buildPublicUrlFromFile
 * Normaliza o caminho do ficheiro gerado pelo sistema de ficheiros (substitui barras invertidas do Windows)
 * e gera o URL público estático correspondente para armazenamento na BD.
 */
function buildPublicUrlFromFile(file, id_candidatura) {
  const normalized = file.filename.replace(/\\/g, '/');
  return `/uploads/evidences/${id_candidatura}/${normalized}`;
}

/**
 * PARSER MULTIPARTES: Converte o upload físico do ficheiro (req.file)
 * no formato padrão de objeto de evidência que o controlador espera.
 */
function parseMultipartEvidencias(req) {
  if (!req.file) return []; // Se não houver upload de ficheiro via Multer, retorna vazio

  const idReq = Number(req.body.id_requisito);
  return [{
    id_requisito: idReq,
    nome_ficheiro: req.file.originalname,
    url_ficheiro: buildPublicUrlFromFile(req.file, req.body.id_candidatura)
  }];
}

/**
 * REGRA DE PRIVACIDADE: Um utilizador só altera evidências se for gestor administrativo
 * ou se for o dono legítimo da candidatura em questão.
 */
function podeAcederCandidatura(req, candidatura) {
  const activeRole = req.activeRole;
  if ([1, 2, 3].includes(activeRole)) return true;
  return candidatura.id_utilizador === getUtilizadorAutenticado(req);
}

/**
 * HELPER DE NEGÓCIO: Procura todos os requisitos válidos atados ao nível do badge selecionado.
 */
async function getRequisitosDoBadge(id_badge, transaction = null) {
  const badge = await Badge.findOne({ where: { id_badge, badgeAtivo: true }, transaction });
  if (!badge) return null;
  return RequisitoBadge.findAll({
    where: { id_badge: badge.id_badge, requisitoAtivo: true },
    transaction
  });
}

/**
 * MOTOR DE GRAVAÇÃO: Higieniza, valida e insere as evidências na base de dados.
 * Substitui de forma automática as versões anteriores do mesmo requisito (Versionamento).
 */
async function guardarEvidencias(candidatura, evidencias, transaction, id_utilizador_acao) {
  const requisitos = await getRequisitosDoBadge(candidatura.id_badge, transaction);
  if (!requisitos) throw new Error('Badge não encontrado ou inativo.');

  // Cria coleções em memória (Sets) para validações rápidas de integridade O(1)
  const idsRequisitosValidos = new Set(requisitos.map(req => req.id_requisito));
  const idsRecebidos = new Set();
  const payload = [];

  for (const evidencia of evidencias) {
    const idRequisito = Number(evidencia.id_requisito);
    
    // Validação 1: O requisito submetido pertence realmente a este badge?
    if (!idRequisito || !idsRequisitosValidos.has(idRequisito)) {
      throw new Error(`Requisito inválido para este badge: ${idRequisito}.`);
    }
    // Validação 2: Deteta se o mesmo requisito foi enviado duplicado na mesma lista do pedido
    if (idsRecebidos.has(idRequisito)) {
      throw new Error(`Requisito duplicado no pedido: ${idRequisito}.`);
    }
    // Validação 3: Campos obrigatórios do documento
    if (!evidencia.nome_ficheiro || !evidencia.url_ficheiro) {
      throw new Error(`Nome e URL do ficheiro são obrigatórios para o requisito ${idRequisito}.`);
    }

    idsRecebidos.add(idRequisito);
    payload.push({
      id_candidatura: candidatura.id_candidatura,
      id_requisito: idRequisito,
      nome_ficheiro: evidencia.nome_ficheiro,
      url_ficheiro: evidencia.url_ficheiro
    });
  }

  // ALGORITMO DE SUBSTITUIÇÃO AUTOMÁTICA (VERSIONAMENTO):
  // Antes de inserir as novas provas, localiza se já existiam evidências antigas ATIVAS para estes mesmos requisitos 
  // nesta candidatura e desativa-as logicamente (Soft Delete). Isso preserva o histórico sem sobrepor registos.
  await EvidenciaCandidatura.update(
    { evidenciaAtiva: false },
    { where: { id_candidatura: candidatura.id_candidatura, id_requisito: { [Op.in]: [...idsRecebidos] }, evidenciaAtiva: true }, transaction }
  );

  // Insere em lote (Bulk Create) as novas evidências na base de dados
  const evidenciasCriadas = await EvidenciaCandidatura.bulkCreate(payload, { transaction });
  
  // Se novos registos foram gravados, dispara uma ação cronológica na auditoria da candidatura
  if (evidenciasCriadas.length > 0) {
    await criarAcao({
      id_candidatura: candidatura.id_candidatura,
      id_utilizador: id_utilizador_acao,
      tipo_acao_candidatura: TIPOS_ACAO.EVIDENCIA_ANEXADA,
      transaction
    });
  }
  return evidenciasCriadas;
}

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API REST)
// =========================================================================

/**
 * POST /evidencia
 * Ponto de entrada híbrido para anexar evidências a um processo em estado OPEN.
 */
controllersEvidencia.createEvidencias = async (req, res) => {
  const transaction = await sequelize.transaction(); // Inicia transação SQL
  try {
    const id_candidatura = req.body.id_candidatura;
    
    // Captura as duas origens possíveis de dados (Híbrido: multipart/form-data ou raw JSON)
    const evidenciasMultipart = parseMultipartEvidencias(req);
    const evidenciasJson = Array.isArray(req.body.evidencias) ? req.body.evidencias : [];
    const evidencias = evidenciasMultipart.length > 0 ? evidenciasMultipart : evidenciasJson;

    // Validações precoces de parâmetros obrigatórios
    if (!id_candidatura || !validaUUID(id_candidatura, 7) || !Array.isArray(evidencias) || evidencias.length === 0) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'id_candidatura e evidencias são obrigatórios.' });
    }

    const candidatura = await Candidatura.findByPk(id_candidatura, { transaction });
    if (!candidatura || !candidatura.candidaturaAtiva) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Candidatura não encontrada.' });
    }
    
    // Verificação de Autorização Baseada em Propriedade (Dono da conta)
    if (!podeAcederCandidatura(req, candidatura)) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Sem permissão para alterar esta candidatura.' });
    }
    
    // Regra de Negócio Bloqueante: O consultor só mexe nos documentos se a candidatura não tiver sido submetida (Estado OPEN)
    if (candidatura.id_estado_candidatura !== ESTADOS.OPEN) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'Só é possível anexar evidências quando a candidatura está em Open.' });
    }

    // Invoca a execução da lógica interna de validação e escrita
    await guardarEvidencias(candidatura, evidencias, transaction, getUtilizadorAutenticado(req));
    await transaction.commit(); // Fecha a transação salvando todas as tabelas
    
    return res.status(201).json({ success: true, message: 'Evidências guardadas com sucesso.' });
  } catch (error) {
    await transaction.rollback(); // Cancela tudo em caso de falha a meio do processo
    return res.status(500).json({ success: false, message: 'Erro ao guardar evidências.', error: error.message });
  }
};

/**
 * GET /evidencia/candidatura/:idCandidatura
 * Recupera e lista todas as evidências atualmente válidas e ativas de uma determinada candidatura.
 */
controllersEvidencia.listByCandidatura = async (req, res) => {
  try {
    if (!validaUUID(req.params.idCandidatura, 7)) {
      return res.status(400).json({ success: false, message: 'ID de candidatura inválido.' });
    }

    const candidatura = await Candidatura.findByPk(req.params.idCandidatura);
    if (!candidatura || !candidatura.candidaturaAtiva) return res.status(404).json({ success: false, message: 'Candidatura não encontrada.' });
    if (!podeAcederCandidatura(req, candidatura)) return res.status(403).json({ success: false, message: 'Sem permissão.' });

    // Procura na BD trazendo juntamente os metadados do requisito associado (Eager Loading)
    const evidencias = await EvidenciaCandidatura.findAll({
      where: { id_candidatura: req.params.idCandidatura, evidenciaAtiva: true },
      include: [{ association: 'requisito' }],
      order: [['data_upload_evidencia', 'DESC']] // Ficheiros mais recentes no topo
    });
    return res.status(200).json({ success: true, data: evidencias });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar evidências.', error: error.message });
  }
};

/**
 * POST /evidencia/validate/:idEvidencia
 * Sistema de aprovação em dupla camada. Permite a validação individual de um documento 
 * segmentando as respostas de aprovação se for um Talent Manager ou equipa executiva/SLL.
 */
controllersEvidencia.validateEvidencia = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    if (!validaUUID(req.params.idEvidencia, 7)) {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'ID de evidência inválido.' });
    }

    const { aprovado } = req.body; // Flag booleana (true/false) enviada pelo avaliador
    if (typeof aprovado !== 'boolean') {
      await transaction.rollback();
      return res.status(400).json({ success: false, message: 'O campo aprovado deve ser boolean.' });
    }

    const evidencia = await EvidenciaCandidatura.findByPk(req.params.idEvidencia, {
      include: [{ association: 'candidatura' }],
      transaction
    });
    if (!evidencia) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: 'Evidência não encontrada.' });
    }

    const idValidador = getUtilizadorAutenticado(req);

    // MÁQUINA DE CRITÉRIOS CORPORATIVOS: 
    // Avalia os perfis extraídos do JWT e preenche campos independentes na tabela de auditoria.
    const activeRole = req.activeRole;
    if (activeRole === 3) {
      // Se for Talent Manager, preenche a aprovação e grava o ID do validador TM
      await evidencia.update({ validado_tm: aprovado, id_tm_validador: idValidador }, { transaction });
    } else if (activeRole === 1 || activeRole === 2) {
      // Se for Service Line Leader ou Admin, preenche o campo independente de validação técnica SLL
      await evidencia.update({ validado_sll: aprovado, id_sll_validador: idValidador }, { transaction });
    } else {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: 'Perfil sem permissão para validar evidência.' });
    }

    await transaction.commit(); // Grava a aprovação com sucesso na BD
    return res.status(200).json({ success: true, message: 'Evidência validada.' });
  } catch (error) {
    await transaction.rollback();
    return res.status(500).json({ success: false, message: 'Erro ao validar evidência.', error: error.message });
  }
};


/**
 * GET /evidencia/minhas
 * Lista todas as evidências submetidas pelo utilizador autenticado (via Token) 
 * em todas as suas candidaturas ativas.
 */
controllersEvidencia.listMyEvidencias = async (req, res) => {
  try {
    // 1. Extrai de forma segura o ID do teu token, usando a tua própria função helper!
    const meuId = getUtilizadorAutenticado(req);

    if (!meuId) {
      return res.status(401).json({ success: false, message: 'Utilizador não identificado no token.' });
    }

    // 2. Faz a pesquisa na BD puxando apenas o que é teu
    const minhasEvidencias = await EvidenciaCandidatura.findAll({
      where: { evidenciaAtiva: true },
      include: [
        {
          association: 'candidatura', // Faz a ponte com a tabela Candidatura
          where: { id_utilizador: meuId, candidaturaAtiva: true }, // Filtra para ser só as tuas
          attributes: ['id_candidatura', 'id_estado_candidatura'] // Traz só o essencial da candidatura para não pesar
        },
        { 
          association: 'requisito' // Traz a descrição do requisito (igual ao que fazes no listByCandidatura)
        }
      ],
      order: [['data_upload_evidencia', 'DESC']] // Mais recentes primeiro
    });

    // 3. Devolve para o Flutter!
    return res.status(200).json({ success: true, data: minhasEvidencias });
    
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao listar as tuas evidências.', error: error.message });
  }
};

/**
 * GET /evidencia/:idEvidencia/view
 * Visualização inline do ficheiro PDF / documento da evidência no browser/modal.
 */
controllersEvidencia.viewEvidencia = async (req, res) => {
  try {
    const { idEvidencia } = req.params;

    if (!validaUUID(idEvidencia, 7)) {
      return res.status(400).json({ success: false, message: 'ID de evidência inválido.' });
    }

    const evidencia = await EvidenciaCandidatura.findByPk(idEvidencia, {
      include: [{ association: 'candidatura' }]
    });

    if (!evidencia) {
      return res.status(404).json({ success: false, message: 'Evidência não encontrada.' });
    }

    // Regra de Acesso:
    // - Perfis de Gestão (Admin = 1, SLL = 2, TM = 3) podem visualizar todas as evidências.
    // - Consultor (4) só pode visualizar as evidências das suas próprias candidaturas.
    const activeRole = req.activeRole;
    const userId = getUtilizadorAutenticado(req);

    if (![1, 2, 3].includes(activeRole) && evidencia.candidatura?.id_utilizador !== userId) {
      return res.status(403).json({ success: false, message: 'Acesso negado: Não tem permissão para visualizar esta evidência.' });
    }

    const relativePath = evidencia.url_ficheiro.replace(/^\/uploads\//, '');
    const filePhysicalPath = path.join(__dirname, '..', 'uploads', relativePath);

    if (!fs.existsSync(filePhysicalPath)) {
      return res.status(404).json({ success: false, message: 'Ficheiro físico da evidência não foi encontrado no servidor.' });
    }

    const ext = path.extname(filePhysicalPath).toLowerCase();
    const contentType = ext === '.pdf' ? 'application/pdf' : (ext === '.zip' ? 'application/zip' : 'application/octet-stream');

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${evidencia.nome_ficheiro || 'evidencia.pdf'}"`);
    return fs.createReadStream(filePhysicalPath).pipe(res);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao visualizar evidência.', error: error.message });
  }
};

/**
 * GET /evidencia/:idEvidencia/download
 * Download direto do ficheiro da evidência.
 */
controllersEvidencia.downloadEvidencia = async (req, res) => {
  try {
    const { idEvidencia } = req.params;

    if (!validaUUID(idEvidencia, 7)) {
      return res.status(400).json({ success: false, message: 'ID de evidência inválido.' });
    }

    const evidencia = await EvidenciaCandidatura.findByPk(idEvidencia, {
      include: [{ association: 'candidatura' }]
    });

    if (!evidencia) {
      return res.status(404).json({ success: false, message: 'Evidência não encontrada.' });
    }

    const activeRole = req.activeRole;
    const userId = getUtilizadorAutenticado(req);

    if (![1, 2, 3].includes(activeRole) && evidencia.candidatura?.id_utilizador !== userId) {
      return res.status(403).json({ success: false, message: 'Acesso negado: Não tem permissão para descarregar esta evidência.' });
    }

    const relativePath = evidencia.url_ficheiro.replace(/^\/uploads\//, '');
    const filePhysicalPath = path.join(__dirname, '..', 'uploads', relativePath);

    if (!fs.existsSync(filePhysicalPath)) {
      return res.status(404).json({ success: false, message: 'Ficheiro físico da evidência não foi encontrado no servidor.' });
    }

    return res.download(filePhysicalPath, evidencia.nome_ficheiro || path.basename(filePhysicalPath));
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao descarregar evidência.', error: error.message });
  }
};

module.exports = controllersEvidencia;