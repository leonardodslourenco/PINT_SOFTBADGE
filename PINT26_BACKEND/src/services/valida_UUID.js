// =========================================================================
// EXPRESSÕES REGULARES E CONFIGURAÇÕES DE FIREWALL SINTÁTICO
// =========================================================================
// REGEX robusta que valida a estrutura padrão de um UUID (8-4-4-4-12 caracteres hexadecimais).
// A variante estrita [89ab] valida a conformidade dos bits de variante exigidos pela especificação RFC 4122/9562.
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * FUNÇÃO PRINCIPAL: validaUUID
 * Valida se uma string é um UUID legítimo, permitindo a checagem opcional de uma versão específica.
 */
function validaUUID(uuid, versaoEsperada = null, opcoes = {}) {
  // 1. ANÁLISE SINTÁTICA PRECOCE (Programação Defensiva)
  if (typeof uuid !== 'string') return false; // Evita quebras se enviarem objetos, números ou undefined
  if (uuid.length !== 36) return false;       // O tamanho exato de um UUID com hífenes é sempre 36 caracteres
  if (!UUID_REGEX.test(uuid)) return false;   // Valida o esqueleto e caracteres hexadecimais permitidos

  // 2. EXTRAÇÃO ANATÓMICA DA VERSÃO:
  // De acordo com a especificação RFC, o 15.º caractere (índice 14 da string) indica sempre a versão do UUID.
  const versao = Number(uuid[14]);

  // Valida se o caractere extraído mapeia uma versão inteira reconhecida (atualmente do v1 ao v8)
  if (!Number.isInteger(versao) || versao < 1 || versao > 8) {
    return false;
  }

  // 3. FILTRAGEM RESTRITIVA DE VERSÃO:
  // Se o controlador exigiu uma versão estrita (ex: apenas UUID v7), intercheca e barra se não coincidir
  if (versaoEsperada !== null && versao !== Number(versaoEsperada)) {
    return false;
  }

  // 4. DESVIO POLIMÓRFICO CONDICIONAL:
  // Se detetar que o identificador é da versão 7, aciona regras de auditoria temporal adicionais
  if (versao === 7) {
    return validaUUIDv7(uuid, opcoes);
  }

  return true; // Se passou em todas as camadas e não for v7, é considerado um UUID genérico válido
}

/**
 * FUNÇÃO COMPLEMENTAR: validaUUIDv7
 * Executa uma análise profunda sobre o carimbo de tempo (timestamp) embutido no UUIDv7.
 */
function validaUUIDv7(uuid, opcoes = {}) {
  // Configura um limite opcional em milissegundos para tolerar desvios de relógio entre servidores
  const toleranciaFuturaMs = Number(opcoes.toleranciaFuturaMs || 0);
  
  // EXTRAÇÃO DO TIMESTAMP HEXADECIMAL:
  // Um UUIDv7 armazena os primeiros 48 bits (12 caracteres hex) como o carimbo de data UNIX em milissegundos.
  // Fatiamos a string omitindo o primeiro hífen: os primeiros 8 caracteres + os 4 caracteres do segundo bloco.
  const timestampHex = uuid.slice(0, 8) + uuid.slice(9, 13);
  
  // Converte a string hexadecimal da data para um número inteiro decimal em milissegundos (Base 16 -> Base 10)
  const timestampMs = Number.parseInt(timestampHex, 16);

  // Valida a integridade do número gerado (Garante que está na janela segura do Javascript e é positivo)
  if (!Number.isSafeInteger(timestampMs) || timestampMs <= 0) {
    return false;
  }

  // AUDITORIA CRONOLÓGICA CONTRA FRAUDES / ANOMALIAS:
  // Como o UUIDv7 é gerado com base no tempo real, o timestamp dele nunca pode apontar para o futuro.
  // Se a data embutida no UUID for superior à hora atual do servidor (mais a tolerância), rejeita o ID por fraude ou relógio corrompido.
  if (timestampMs > Date.now() + toleranciaFuturaMs) {
    return false;
  }

  return true; // Passou em todas as auditorias anatómicas e cronológicas
}

// Exporta a função mestre de validação para ser consumida pelos middlewares e controladores do ecossistema
module.exports = validaUUID;