const tradutorService = require('./tradutor.service');

/**
 * Traduz um texto de um idioma de origem para os restantes idiomas do sistema
 * e devolve um objeto com as 3 traduções mapeadas (pt, en, es).
 * 
 * @param {string} textoOrigem O texto a ser traduzido.
 * @param {string} idiomaOrigem O idioma em que o texto foi escrito (ex: 'pt', 'en', 'es').
 * @returns {Promise<{pt: string, en: string, es: string}>} Objeto com as traduções mapeadas.
 */
const processarTraducao = async (textoOrigem, idiomaOrigem) => {
  if (!textoOrigem || typeof textoOrigem !== 'string' || !textoOrigem.trim()) {
    throw new Error("Texto de origem é obrigatório.");
  }

  const idiomaOrigemNorm = idiomaOrigem.toLowerCase().trim().slice(0, 2);

  try {
    const traducoes = await tradutorService.traduzir(idiomaOrigemNorm, textoOrigem);
    const obj = {};

    // Mapear o texto original
    obj[idiomaOrigemNorm] = textoOrigem;

    // Mapear as traduções da API
    if (traducoes.idioma1) obj[traducoes.idioma1] = traducoes.texto1;
    if (traducoes.idioma2) obj[traducoes.idioma2] = traducoes.texto2;

    // Garantir que todos os 3 idiomas estão preenchidos, mesmo que falhe algum, colocar vazio para evitar erros de DB
    return {
      pt: obj.pt || null,
      en: obj.en || null,
      es: obj.es || null
    };
  } catch (error) {
    console.error("Erro no processarTraducao:", error.message);
    throw error;
  }
};

const tratarPayloadTraducao = async (campoInput, langOriginal) => {
  const lang = (langOriginal || 'pt').toLowerCase().trim().slice(0, 2);
  const supported = ['pt', 'en', 'es'];
  const activeLang = supported.includes(lang) ? lang : 'pt';

  let finalInput = campoInput;

  // Se for string que pareça JSON, tenta fazer parse (necessário para uploads multipart/form-data serializados pelo frontend)
  if (typeof campoInput === 'string' && campoInput.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(campoInput);
      if (parsed && typeof parsed === 'object') {
        finalInput = parsed;
      }
    } catch (e) {
      // Ignora erro de parsing e trata como string normal
    }
  }

  // Caso 1: Já é um objeto de tradução manual (ou foi deserializado acima)
  if (finalInput && typeof finalInput === 'object') {
    const ptVal = (finalInput.pt || '').trim();
    const enVal = (finalInput.en || '').trim();
    const esVal = (finalInput.es || '').trim();

    // Encontra o texto do idioma original como base de fallback
    const baseText = finalInput[activeLang]?.trim() || ptVal || enVal || esVal || '';

    return {
      pt: ptVal || baseText,
      en: enVal || baseText,
      es: esVal || baseText
    };
  }

  // Caso 2: É texto simples, tenta tradução automática
  if (typeof finalInput === 'string' && finalInput.trim() !== '') {
    return await processarTraducao(finalInput, activeLang);
  }

  throw new Error("Formato de campo de tradução inválido.");
};

module.exports = {
  processarTraducao,
  tratarPayloadTraducao
};
