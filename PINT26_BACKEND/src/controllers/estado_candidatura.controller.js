// =========================================================================
// IMPORTAÇÃO DE MODELOS ORM E SERVIÇOS DE VALIDAÇÃO DEFENSIVA
// =========================================================================
const EstadoCandidatura = require('../models/estado_candidatura.model'); // Modelo da tabela que guarda os cabeçalhos dos estados
const validaIDInteiro = require('../services/valida_id_inteiro');     // Utilitário para higienizar e validar parâmetros numéricos

const controllersEstadoCandidatura = {};

// =========================================================================
// MÉTODOS AUXILIARES / HELPERS (DATA MAPPERS E EAGER LOADING)
// =========================================================================

/**
 * HELPER: mapEstado
 * Atua como um Data Mapper (Transformador de Dados). Ele limpa a resposta complexa
 * do ORM e extrai dinamicamente a string correspondente ao idioma (lang) atual,
 * entregando uma estrutura JSON perfeitamente plana e limpa ao Frontend.
 */
const mapEstado = (estado, lang) => ({
  id_estado_candidatura: estado.id_estado_candidatura,
  // Operador ternário que valida se o nó de tradução existe antes de tentar ler a propriedade do idioma (evita quebras de runtime)
  estado: estado.traducao_estado ? estado.traducao_estado[lang] : null
});

/**
 * HELPER: buildInclude
 * Cria de forma dinâmica a cláusula de relacionamento para o Sequelize (Eager Loading).
 * Instruiu o PostgreSQL a fazer um JOIN com a tabela de traduções e a trazer 
 * EXCLUSIVAMENTE a coluna do idioma ativo (ex: 'pt', 'en' ou 'es') do utilizador.
 */
const buildInclude = (lang) => [
  {
    association: 'traducao_estado',
    attributes: [lang] // Traz apenas os caracteres do idioma configurado no request
  }
];

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API REST)
// =========================================================================

/**
 * GET /estado-candidatura
 * Recupera e lista todos os estados de candidatura configurados no sistema.
 */
controllersEstadoCandidatura.listEstadoCandidatura = async (req, res) => {
  try {
    const lang = req.lang; // Identifica o idioma do cabeçalho injetado pelo teu middleware de tradução

    // Procura todos os estados na BD aplicando o JOIN traduzido e ordenando de forma sequencial ascendente
    const estados = await EstadoCandidatura.findAll({
      include: buildInclude(lang),
      order: [['id_estado_candidatura', 'ASC']] // Organiza por ID de forma crescente (1, 2, 3...)
    });

    // Devolve a resposta com status HTTP 200 (OK) mapeando todo o array através do transformador plano
    res.status(200).json({
      success: true,
      message: "Estados de candidatura recuperados com sucesso.",
      data: estados.map(estado => mapEstado(estado, lang)) // Formatação dinâmica em lote (.map)
    });

  } catch (error) {
    // Caso ocorra alguma falha na ligação com o PostgreSQL, dispara o status 500 (Internal Server Error)
    res.status(500).json({
      success: false,
      message: "Erro ao listar estados de candidatura.",
      error: error.message
    });
  }
};

/**
 * GET /estado-candidatura/:id
 * Recupera o detalhe traduzido de um único estado de candidatura com base no ID passado no URL.
 */
controllersEstadoCandidatura.detailEstadoCandidatura = async (req, res) => {
  // CIBERSEGURANÇA: Higieniza o parâmetro da rota imediatamente para bloquear ataques de injeção de código SQL (SQL Injection)
  const id_estado_candidatura = validaIDInteiro(req.params.id);

  // Se o utilizador passou um caractere que não é um número inteiro válido, barra no imediato
  if (!id_estado_candidatura) {
    return res.status(400).json({ // Status 400 Bad Request
      success: false,
      message: "ID de estado de candidatura inválido.",
      data: null
    });
  }

  try {
    const lang = req.lang;

    // Procura por um registo específico utilizando a cláusula WHERE
    const estado = await EstadoCandidatura.findOne({
      where: { id_estado_candidatura },
      include: buildInclude(lang)
    });

    // Se a query retornar nula (ID não existe na BD), devolve um erro descritivo
    if (!estado) {
      return res.status(404).json({ // Status 404 Not Found
        success: false,
        message: "Estado de candidatura não encontrado.",
        data: null
      });
    }

    // Devolve o registo individual formatado com sucesso pelo Data Mapper
    res.status(200).json({
      success: true,
      message: "Estado de candidatura recuperado com sucesso.",
      data: mapEstado(estado, lang)
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao recuperar estado de candidatura.",
      error: error.message
    });
  }
};

// Exporta o objeto controlador para ser mapeado no ficheiro de rotas do Express
module.exports = controllersEstadoCandidatura;