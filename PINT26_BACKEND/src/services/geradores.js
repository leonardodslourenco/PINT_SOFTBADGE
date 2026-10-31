// =========================================================================
// IMPORTAÇÃO DE BIBLIOTECAS ESPECIALISTAS EM CRIPTOGRAFIA E IDENTIFICAÇÃO
// =========================================================================
const { v7: uuidv7 } = require('uuid'); // Importa a especificação v7 para criação de IDs universais ordenados por tempo
const crypto = require('crypto');       // Módulo nativo do Node.js para segurança criptográfica baseada em hardware (CSPRNG)
const argon2 = require('argon2');       // Algoritmo topo de gama para hashing seguro e proteção contra ataques GPU/ASIC

/**
 * FUNÇÃO: gerarUUIDv7
 * Gera e retorna um identificador universal único (UUID) versão 7.
 * Os primeiros bits contêm um carimbo de data/hora (timestamp), tornando-o ideal para ordenação na BD.
 */
function gerarUUIDv7() {
  return uuidv7();
}

/**
 * FUNÇÃO: gerarCodigoEpassword
 * Cria uma sequência aleatória complexa (de tamanho customizável) contendo obrigatoriamente
 * números, letras e caracteres especiais, devolvendo o texto limpo e a sua respetiva hash encriptada.
 */
async function gerarCodigoEpassword(tamanho = 10) {

  // Matriz de caracteres para garantir uma distribuição diversificada e alta complexidade (entropia)
  const numeros = "0123456789";
  const minusculas = "abcdefghijklmnopqrstuvwxyz";
  const maiusculas = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const especiais = "!@#$%&*";

  // Agrupa os conjuntos para sorteio aleatório indexado
  const grupos = [numeros, minusculas, maiusculas, especiais];
  let codigo = "";

  // Ciclo FOR que itera até preencher o tamanho total solicitado para a chave (ex: 10 ou 12 caracteres)
  for (let i = 0; i < tamanho; i++) {

    // CIBERSEGURANÇA: Sorteia um índice do grupo de caracteres usando crypto.randomInt().
    // Ao contrário de Math.random(), este método extrai entropia diretamente do sistema operacional,
    // sendo imune a ataques de previsão estatística.
    const tipo = crypto.randomInt(0, grupos.length);

    // Obtém a string do grupo sorteado (ex: o grupo dos caracteres especiais)
    const grupoEscolhido = grupos[tipo];

    // Sorteia de forma segura qual o caractere específico daquele grupo vai entrar na password
    const caractere =
      grupoEscolhido[crypto.randomInt(0, grupoEscolhido.length)];

    // Concatena o caractere sorteado na string final do código
    codigo += caractere;
  }

  // PROTEÇÃO DE PERSISTÊNCIA: Pega no texto limpo recém-gerado e cria uma hash robusta usando Argon2.
  // Esta hash será armazenada na BD para futuras comparações, impedindo que administradores ou invasores leiam a pass original.
  const hash = await argon2.hash(codigo);

  // Retorna um objeto contendo o segredo em texto limpo (para ser enviado ao utilizador via e-mail SMTP)
  // e a hash de segurança (para ser gravada na base de dados imediatamente)
  return {
    codigo,
    hash
  };
}

/**
 * FUNÇÃO: gerarThreadId
 * Gera uma string alfanumérica aleatória de 21 caracteres para ser usada
 * como thread_id dinâmico na API de tradução externa, evitando limite de contexto.
 */
function gerarThreadId() {
  const caracteres = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let threadId = "";
  for (let i = 0; i < 21; i++) {
    threadId += caracteres[crypto.randomInt(0, caracteres.length)];
  }
  return threadId;
}

// Exporta as funções para serem consumidas pelos controladores de Autenticação e Utilizadores
module.exports = {
  gerarUUIDv7,
  gerarCodigoEpassword,
  gerarThreadId
};