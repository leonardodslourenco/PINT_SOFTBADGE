// =========================================================================
// IMPORTAÇÃO DE MODELOS ORM E SERVIÇOS CRIPTOGRÁFICOS DE INFRAESTRUTURA
// =========================================================================
const AcaoCandidatura = require('../models/acao_candidatura.model'); // Modelo da tabela de logs/histórico de ações
const TraducaoConteudo = require('../models/traducao_conteudo.model'); // Tabela central para persistência de strings multi-idioma
const { gerarUUIDv7 } = require('./geradores');                     // Gerador de chaves criptográficas cronológicas (UUIDv7)

// ENUMERAÇÃO (DICTIONARY): Mapeamento estrito de códigos numéricos
// que representam cada estado do ciclo de vida de uma candidatura na base de dados.
const TIPOS_ACAO = {
  CANDIDATURA_CRIADA: 1,
  CANDIDATURA_ENVIADA_ANALISE: 2,
  REJEITADA_TM: 3,
  PRE_APROVADA_TM: 4,
  REJEITADA_SLL: 5, // Representa o fluxo de devolução ("Send back") para o consultor corrigir
  APROVADA_SLL: 6,
  ENCERRADA_SLL: 7,
  CANCELADA_CONSULTOR: 8,
  CANCELADA_SISTEMA: 9,
  EVIDENCIA_ANEXADA: 10
};

// MAPEAMENTO DE METADADOS ESTÁTICOS (SEMENTES / SEEDS):
// Guarda chaves UUIDv7 fixas que apontam para textos pré-traduzidos já guardados na base de dados.
// Evita redundância de dados e poupa escritas desnecessárias para ações comuns do sistema.
const COMENTARIOS_PADRAO_ACAO = {
  [TIPOS_ACAO.CANDIDATURA_CRIADA]: '019e4b93-3dc6-7331-afc3-23a8b4ba0f5a',
  [TIPOS_ACAO.CANDIDATURA_ENVIADA_ANALISE]: '019e4b96-3376-7387-9c2d-f470afde7335',
  [TIPOS_ACAO.CANCELADA_SISTEMA]: '019e4b98-0b2f-74a9-b15a-e5bb6ea03d61',
  [TIPOS_ACAO.EVIDENCIA_ANEXADA]: '019e4b9a-382e-76fb-9bde-9224a4a37b08'
};

// =========================================================================
// FUNÇÕES AUXILIARES / HELPERS INTERNOS (MÉTODOS PRIVADOS DE SUPORTE)
// =========================================================================

/**
 * HELPER LÓGICO: Analisa se o comentário enviado pelo avaliador ou sistema
 * possui chaves válidas de tradução customizada (Pelo menos um idioma PT, EN ou ES preenchido).
 */
function temComentarioCustom(comentario) {
  return Boolean(comentario && (comentario.pt || comentario.en || comentario.es));
}

/**
 * SERVIÇO DE PERSISTÊNCIA: Cria um novo registo na tabela central de idiomas,
 * gerando um ID estável cronologicamente, sob isolamento transacional.
 */
async function criarTraducaoComentario(comentario, transaction) {
  const idTraducaoComentario = gerarUUIDv7(); // ID ordenável por tempo para indexação rápida no Postgres

  await TraducaoConteudo.create({
    id_traducao_conteudo: idTraducaoComentario,
    tabela: 'acao_candidatura',
    coluna: 'comentario',
    pt: comentario.pt || '', // Fallback para string vazia caso o idioma não seja fornecido
    en: comentario.en || '',
    es: comentario.es || ''
  }, { transaction }); // Vincula a operação à transação ativa do controlador chamador

  return idTraducaoComentario; // Retorna a chave gerada para ser usada como FK na tabela de ações
}

// =========================================================================
// MÉTODOS EXPOSTOS / CORE DOMAIN LOGIC (API DO SERVIÇO)
// =========================================================================

/**
 * MÉTODO DE CORE: criarAcao
 * Centraliza e encapsula o registo de logs e histórico do ciclo de vida das candidaturas.
 */
async function criarAcao({
  id_candidatura,
  id_utilizador,
  tipo_acao_candidatura,
  comentario = null,
  transaction = null // Permite que este log participe em blocos de transação ACID complexos externos
}) {
  // FLUXO POR DEFEITO: Assume inicialmente que a ação utiliza um comentário predefinido/estático do sistema
  let id_traducao_comentario_acao = COMENTARIOS_PADRAO_ACAO[tipo_acao_candidatura] || null;

  // FLUXO DINÂMICO CUSTOMIZADO:
  // Se quem invocou o serviço passou um texto livre (ex: justificativa de rejeição de um avaliador),
  // desvia o fluxo, invoca a criação de um novo dicionário idiomático e substitui o ID alvo pelo novo UUID.
  if (temComentarioCustom(comentario)) {
    id_traducao_comentario_acao = await criarTraducaoComentario(comentario, transaction);
  }

  // Insere a linha de auditoria cronológica em definitivo na tabela de ações do PostgreSQL
  return AcaoCandidatura.create({
    id_candidatura,
    id_utilizador,
    tipo_acao_candidatura,
    id_traducao_comentario_acao // Chave estrangeira (FK) que aponta ou para o ID padrão ou para o ID customizado criado
  }, { transaction });
}

// Exporta as constantes e a função para serem integradas nos controladores do ecossistema
module.exports = {
  TIPOS_ACAO,
  criarAcao
};