// =========================================================================
// IMPORTAÇÃO DE SERVIÇOS DE NEGÓCIO EXTERNOS / LOCAIS
// =========================================================================
// Importa o método 'traduzir' do serviço dedicado, que encapsula a lógica 
// de comunicação com o motor de tradução ou API externa (como a IAEDU).
const { traduzir } = require('../services/tradutor.service');

// Cria o objeto local que vai agrupar e exportar os métodos deste controlador
const controllersTradutor = {};

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API REST)
// =========================================================================

/**
 * POST /translator/translate (ou caminho equivalente de rotas)
 * Recebe uma frase e um idioma de destino, processa a tradução e retorna o resultado.
 */
controllersTradutor.traduzirConteudo = async (req, res) => {
  try {
    // CAPTURA DEFENSIVA: Extrai o idioma pretendido e a frase do corpo da requisição (body).
    // O operador '|| {}' (fallback para objeto vazio) garante que, se o corpo da requisição 
    // vier nulo ou indefinido, o código não rebenta com um erro de runtime ao desestruturar.
    const { idioma, frase } = req.body || {};

    // VALIDAÇÃO PRECOCE (EARLY RETURN): 
    // Verifica se os parâmetros vitais foram fornecidos. Se algum falhar, barra o pedido imediatamente.
    if (!idioma || !frase) {
      return res.status(400).json({ // Status 400 Bad Request
        success: false,
        message: 'Campos obrigatórios em falta: idioma e frase.'
      });
    }

    // CHAMADA ASSÍNCRONA DE NEGÓCIO:
    // Invoca o serviço 'traduzir' passando os parâmetros validados. O uso do 'await' 
    // faz o Node.js aguardar a resposta da API externa/serviço sem bloquear outras requisições.
    const resultado = await traduzir(idioma, frase);

    // RESPOSTA DE SUCESSO:
    // Devolve o status HTTP 200 (OK) encapsulando o resultado final da tradução no JSON.
    return res.status(200).json({
      success: true,
      message: 'Tradução realizada com sucesso.',
      data: resultado
    });
  } catch (error) {
    // TRATAMENTO DE EXCEÇÕES EM CASCATA:
    // Se a API externa estiver em baixo, houver perda de rede ou qualquer outro erro inesperado,
    // o catch captura a falha, impede que o servidor Node.js vá abaixo (crash) e responde ao cliente.
    return res.status(500).json({ // Status 500 Internal Server Error
      success: false,
      message: 'Erro ao traduzir conteúdo.',
      error: error.message // Envia a mensagem descritiva do erro técnico para depuração
    });
  }
};

// Exporta o controlador para que ele possa ser mapeado e exposto no ficheiro de rotas do Express
module.exports = controllersTradutor;