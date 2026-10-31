// =========================================================================
// IMPORTAÇÃO DE PROTOCOLOS DE REDE E DEPENDÊNCIAS DE CONFIGURAÇÃO
// =========================================================================
const axios = require('axios');                    // Biblioteca HTTP baseada em Promessas usada para efetuar pedidos à API
const { TRADUTOR } = require('../config/parameters'); // Central de credenciais (API Keys, Canais e Threads do iaEdu)
const { gerarThreadId } = require('./geradores');  // Gerador de IDs de thread dinâmicos

// Matriz de línguas suportadas nativamente pelo ecossistema do SoftBadge
const IDIOMAS_VALIDOS = ['pt', 'en', 'es'];

// =========================================================================
// FUNÇÕES UTILITÁRIAS E COMPONENTES AUXILIARES
// =========================================================================

/**
 * HELPER: normalizarIdioma
 * Higieniza o idioma recebido. Limpa espaços, converte para minúsculas e extrai 
 * os dois primeiros caracteres (ex: "PT-BR" -> "pt"). Se for inválido, anula.
 */
function normalizarIdioma(idioma) {
  if (!idioma || typeof idioma !== 'string') return null;
  const normalizado = idioma.toLowerCase().trim().slice(0, 2);
  return IDIOMAS_VALIDOS.includes(normalizado) ? normalizado : null;
}

/**
 * HELPER: obterIdiomasDestino
 * Aplica uma subtração lógica na matriz de línguas. Exclui a língua de origem
 * e devolve as duas línguas para as quais o texto deve ser traduzido em paralelo.
 * Exemplo: Se origem é 'pt', devolve ['en', 'es'].
 */
function obterIdiomasDestino(idiomaOrigem) {
  return IDIOMAS_VALIDOS.filter(idioma => idioma !== idiomaOrigem);
}

/**
 * ENGENHARIA DE PROMPTS (PROMPT ENGINEERING): construirPrompt
 * Desenha uma instrução imperativa e estrita em formato de string.
 * Modela o comportamento da IA para que retorne única e exclusivamente um objeto JSON estruturado.
 */
function construirPrompt(idiomaOrigem, texto, idiomasDestino) {
  const idiomaMap = {
    pt: 'Português',
    en: 'Inglês',
    es: 'Espanhol'
  };

  const idioma1 = idiomasDestino[0];
  const idioma2 = idiomasDestino[1];

  return `Traduza o texto seguinte a partir de ${idiomaMap[idiomaOrigem]} para ${idiomaMap[idioma1]} e ${idiomaMap[idioma2]}.
Responda exclusivamente em JSON válido e sem markdown, com exatamente as chaves "idioma1", "texto1", "idioma2" e "texto2".
"idioma1" deve ser "${idioma1}" e "idioma2" deve ser "${idioma2}".
O valor de "texto1" deve estar no idioma "${idioma1}".
O valor de "texto2" deve estar no idioma "${idioma2}".
Texto de origem: "${texto}"`;
}

/**
 * MOTOR DE STREAMING DE BAIXO NÍVEL: lerRespostaStream
 * Implementa o consumo de Server-Sent Events (SSE). Escuta os eventos binários de rede
 * emitidos pela IA, decodifica-os em texto UTF-8 e remonta os blocos JSON de forma contínua.
 */
async function lerRespostaStream(stream) {
  // Embrulha o processamento assíncrono baseado em eventos numa Promessa para podermos usar await à frente
  return new Promise((resolve, reject) => {
    let fullMessageText = ''; // Variável que vai acumular a mensagem completa finalizada
    let buffer = '';          // Buffer de memória para segurar fragmentos parciais de linhas truncadas

    stream.on('data', chunk => {
      const text = chunk.toString('utf8'); // Transforma o binário em texto legível
      buffer += text;                      // Acumula no buffer
      const lines = buffer.split('\n');    // Divide o texto por quebras de linha (padrão do protocolo SSE)
      buffer = lines.pop() || '';          // Remove a última linha (que pode estar incompleta) e guarda-a de volta no buffer

      // Itera sobre cada linha de dados extraída no chunk atual
      for (const line of lines) {
        if (!line.trim()) continue; // Ignora linhas em branco de respiração de rede
        try {
          // Limpa o prefixo do protocolo SSE ("data: ") se ele estiver presente
          const cleanedLine = line.startsWith('data: ') ? line.slice(6) : line;
          const json = JSON.parse(cleanedLine); // Tenta efetuar o parsing do JSON do evento

          // Máquina de estados baseada nos tipos de pacotes emitidos pela API da iaEdu
          if (json.type === 'token') {
            fullMessageText += json.content || ''; // Se for um token de geração, anexa diretamente o caractere
          } else if (json.type === 'message') {
            // Se for um bloco consolidado de mensagem, lida com variações de tipagem do objeto
            if (typeof json.content === 'object' && json.content?.content) {
              fullMessageText = json.content.content;
            } else if (typeof json.content === 'string') {
              fullMessageText = json.content;
            }
          }
        } catch (error) {
          // Arquitetura Tolerante a Falhas: Se uma linha vier malformada, ignora e avança para o próximo fragmento
          continue;
        }
      }
    });

    // Evento acionado quando a conexão HTTP da stream é encerrada com sucesso pela API
    stream.on('end', () => {
      // Processa qualquer resíduo textual que tenha sobrado no buffer final
      if (buffer.trim()) {
        try {
          const cleanedLine = buffer.startsWith('data: ') ? buffer.slice(6) : buffer;
          const json = JSON.parse(cleanedLine);
          if (json.type === 'token') {
            fullMessageText += json.content || '';
          } else if (json.type === 'message') {
            if (typeof json.content === 'object' && json.content?.content) {
              fullMessageText = json.content.content;
            } else if (typeof json.content === 'string') {
              fullMessageText = json.content;
            }
          }
        } catch (error) {
          // Ignora falhas de fragmentos truncados finais
        }
      }
      resolve(fullMessageText); // Cumpre a promessa retornando o bloco textual completo gerado pela IA
    });

    // Evento acionado caso ocorra um erro de rede crítico a meio da transmissão da stream
    stream.on('error', reject); // Quebra a promessa devolvendo o erro para o catch principal
  });
}

/**
 * PARSER SEGURO: extrairJsonDaResposta
 * Captura a string bruta retornada pela IA e higieniza-a.
 * Utiliza Expressões Regulares (Regex) para expurgar blocos de código markdown (```json ... ```)
 * e isola cirurgicamente as chavetas do objeto JSON para garantir um parsing livre de falhas de runtime.
 */
function extrairJsonDaResposta(texto) {
  if (!texto || typeof texto !== 'string') return null;
  
  // Remove as marcações visuais de blocos markdown de código JSON
  const limpo = texto.replace(/```json\n?|```/g, '').trim();

  // Regex avançada: Captura tudo o que estiver compreendido entre a primeira { e a última }
  const jsonMatch = limpo.match(/\{[\s\S]*\}/);
  const alvo = jsonMatch ? jsonMatch[0] : limpo;

  try {
    return JSON.parse(alvo); // Converte para objeto JavaScript
  } catch (error) {
    return null; // Retorna nulo caso o JSON esteja irremediavelmente corrompido
  }
}

// =========================================================================
// MÉTODO EXPOSTO INTERNO (API DE COMUNICAÇÃO DE DOMÍNIO)
// =========================================================================

/**
 * FUNÇÃO CORE: traduzir
 * Orquestra de ponta a ponta o pedido de tradução paralela simultânea ao iaEdu.
 */
async function traduzir(idioma, frase) {
  // 1. Sanitização e Validação dos dados do pedido
  const idiomaOrigem = normalizarIdioma(idioma);
  if (!idiomaOrigem) {
    throw new Error('Idioma de origem inválido. Utilize pt, en ou es.');
  }

  if (!frase || typeof frase !== 'string' || !frase.trim()) {
    throw new Error('A frase a traduzir é obrigatória.');
  }

  // 2. Auditoria defensiva de chaves e variáveis de ambiente obrigatórias
  if (!TRADUTOR.API_KEY || !TRADUTOR.CHANNEL_ID) {
    throw new Error('Configuração da tradução incompleta. Verifique as variáveis de ambiente da IAEDU.');
  }

  // Constrói o endpoint correto aceitando caminhos diretos ou gerando dinamicamente através do ID do Agente
  const endpoint = TRADUTOR.API_ENDPOINT
    || (TRADUTOR.AGENT_ID ? `${TRADUTOR.API_BASE_URL}/${TRADUTOR.AGENT_ID}/stream` : null);

  if (!endpoint) {
    throw new Error('Endpoint da IAEDU não configurado. Defina IAEDU_API_ENDPOINT ou IAEDU_AGENT_ID.');
  }

  // 3. Orquestração estruturada do Prompt
  const idiomasDestino = obterIdiomasDestino(idiomaOrigem);
  const prompt = construirPrompt(idiomaOrigem, frase.trim(), idiomasDestino);

  // Instancia um objeto FormData padrão, uma vez que a API externa espera receber dados multipart/form-data
  const formData = new FormData();
  formData.append('channel_id', TRADUTOR.CHANNEL_ID);
  formData.append('thread_id', gerarThreadId());
  formData.append('user_info', JSON.stringify({ idioma_origem: idiomaOrigem })); // Fornece metadados contextuais em string JSON
  formData.append('message', prompt);

  // 4. Execução do pedido HTTP assíncrono via Axios
  const response = await axios.post(endpoint, formData, {
    headers: {
      'x-api-key': TRADUTOR.API_KEY,               // Injeta a credencial de segurança proprietária
      'Content-Type': 'multipart/form-data'        // Especifica o tipo MIME correto da carga binária
    },
    responseType: 'stream',                        // CONCEITO AVANÇADO: Instrui o Axios a abrir uma ligação de canal/stream ativa
    timeout: TRADUTOR.TIMEOUT_MS                   // Evita bloqueios infinitos de rede aplicando um tempo limite (timeout)
  });

  // 5. Consumo e tratamento de dados
  const responseText = await lerRespostaStream(response.data); // Alimenta a função de parsing de fluxo com a stream recebida
  const jsonTraduzido = extrairJsonDaResposta(responseText);   // Higieniza e extrai o objeto JSON da resposta em texto

  if (!jsonTraduzido) {
    throw new Error('Não foi possível interpretar a resposta da tradução.');
  }

  // Lógica Adaptativa e Flexível de Mapeamento:
  // Tenta ler as propriedades padrão ('idioma1' / 'texto1'), mas possui caminhos de fallback inteligentes
  // que procuram as chaves em letras maiúsculas ou pelo próprio nome da string caso a IA tenha variado a nomenclatura.
  const idioma1 = jsonTraduzido.idioma1 || idiomasDestino[0];
  const idioma2 = jsonTraduzido.idioma2 || idiomasDestino[1];
  const texto1 = jsonTraduzido.texto1 || jsonTraduzido[idioma1?.toUpperCase?.()] || jsonTraduzido[idioma1] || null;
  const texto2 = jsonTraduzido.texto2 || jsonTraduzido[idioma2?.toUpperCase?.()] || jsonTraduzido[idioma2] || null;

  // Validação Final de Sanidade lúdica antes de autorizar a entrega dos dados
  if (!idioma1 || !idioma2 || !texto1 || !texto2) {
    throw new Error('A resposta da tradução não continha os dados esperados.');
  }

  // Devolve o objeto perfeitamente formatado e contendo as duas traduções prontas
  return {
    idioma1,
    texto1,
    idioma2,
    texto2
  };
}

module.exports = {
  traduzir
};