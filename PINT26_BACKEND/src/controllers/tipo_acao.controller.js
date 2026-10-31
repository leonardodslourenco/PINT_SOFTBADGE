// =========================================================================
// IMPORTAÇÃO DE MODELOS ORM E SERVIÇOS DE VALIDAÇÃO DEFENSIVA
// =========================================================================
const TipoAcao = require('../models/tipo_acao.model');             // Modelo da tabela que guarda os identificadores dos tipos de ações
const validaIDInteiro = require('../services/valida_id_inteiro');     // Utilitário de cibersegurança para higienizar parâmetros numéricos

// Objeto que agrupa e exporta os métodos do controlador
const controllersTipoAcao = {};

// =========================================================================
// MÉTODOS AUXILIARES / HELPERS (DATA MAPPERS E EAGER LOADING)
// =========================================================================

/**
 * HELPER: mapAcao
 * Atua como um Data Mapper (Transformador de Dados). Ele limpa a resposta complexa do ORM,
 * extrai a string correspondente ao idioma (lang) atual do request e descarta os metadados.
 * Entrega uma estrutura JSON limpa e perfeitamente plana ao Frontend.
 */
const mapAcao = (acao, lang) => ({
  id_tipo_acao_candidatura: acao.id_tipo_acao_candidatura,
  // Operador ternário protetivo: garante que o código não quebra se o nó de tradução vier nulo
  acao: acao.traducao_acao ? acao.traducao_acao[lang] : null
});

/**
 * HELPER: buildInclude
 * Cria dinamicamente a cláusula de junção relacional (Eager Loading) para o Sequelize.
 * Otimiza a busca instruindo o PostgreSQL a trazer UNICAMENTE a coluna do idioma ativo (pt, en ou es).
 */
const buildInclude = (lang) => [
  {
    association: 'traducao_acao', // Nome da associação definida no modelo
    attributes: [lang]            // Procura cirúrgica: traz apenas os caracteres da língua correta
  }
];

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API REST)
// =========================================================================

/**
 * 1. LISTAR TODOS OS TIPOS DE AÇÃO
 * Recupera o catálogo completo de ações configuradas no sistema para preenchimento de tabelas ou filtros.
 * Caminho: GET /tipo_acao
 */
controllersTipoAcao.listTipoAcao = async (req, res) => {
  try {
    const lang = req.lang; // Deteta o idioma preferencial do utilizador injetado pelo middleware global

    // Consulta a BD aplicando o JOIN otimizado e ordenando de forma sequencial ascendente
    const acoes = await TipoAcao.findAll({
      include: buildInclude(lang),
      order: [['id_tipo_acao_candidatura', 'ASC']] // Organiza por ID de forma crescente (1, 2, 3...)
    });

    // Retorna o status HTTP 200 (OK) formatando todo o array através do transformador (.map)
    res.status(200).json({
      success: true,
      message: "Tipo de ações da candidatura recuperados com sucesso.",
      data: acoes.map(acao => mapAcao(acao, lang)) // Formatação em lote
    });

  } catch (error) {
    // Tratamento de exceções em caso de falha de rede ou erro do PostgreSQL
    res.status(500).json({
      success: false,
      message: "Erro ao listar tipos de ações da candidatura.",
      error: error.message
    });
  }
};

/**
 * 2. DETALHAR UM TIPO DE AÇÃO ESPECÍFICO
 * Procura um único tipo de ação com base no ID passado no URL, higienizando o parâmetro.
 * Caminho: GET /tipo_acao/:id
 */
controllersTipoAcao.detailTipoAcao = async (req, res) => {
  // CIBERSEGURANÇA: Higieniza o ID recebido no URL contra ataques de injeção de código SQL (SQL Injection)
  const id_tipo_acao_candidatura = validaIDInteiro(req.params.id);

  // Early Return: Se o parâmetro não for um número inteiro válido, barra o pedido imediatamente
  if (!id_tipo_acao_candidatura) {
    return res.status(400).json({ // Status 400 Bad Request
      success: false,
      message: "ID de tipo de ação da candidatura inválido.",
      data: null
    });
  }

  try {
    const lang = req.lang;

    // Executa a busca cirúrgica baseada na Cláusula WHERE
    const acao = await TipoAcao.findOne({
      where: { id_tipo_acao_candidatura },
      include: buildInclude(lang)
    });

    // Se o ID submetido não constar na base de dados, devolve 404 Not Found
    if (!acao) {
      return res.status(404).json({
        success: false,
        message: "Tipo de ação da candidatura não encontrado.",
        data: null
      });
    }

    // Devolve o registo individual formatado com sucesso pelo Data Mapper plano
    res.status(200).json({
      success: true,
      message: "Tipo de ação da candidatura recuperado com sucesso.",
      data: mapAcao(acao, lang)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao recuperar tipo de ação da candidatura.",
      error: error.message
    });
  }
};

// Exporta o controlador para que possa ser amarrado no ficheiro de rotas do Express
module.exports = controllersTipoAcao;