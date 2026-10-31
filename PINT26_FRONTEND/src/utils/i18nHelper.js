/**
 * Helper utilitário para extrair dinamicamente a string traduzida no idioma ativo (PT, EN, ES)
 * independentemente de o Backend retornar um Objeto { pt, en, es }, uma String JSON ou uma String Simples.
 * Normaliza códigos de locale compostos (ex: 'en-US' -> 'en', 'es-ES' -> 'es').
 */
export function resolveI18nText(field, lang = 'pt') {
  if (!field) return '';
  const cleanLang = String(lang || 'pt').split('-')[0].toLowerCase();
  let obj = field;

  if (typeof field === 'string') {
    const trimmed = field.trim();
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        obj = JSON.parse(field);
      } catch (e) {
        return field;
      }
    } else {
      return field;
    }
  }

  if (typeof obj === 'object' && obj !== null) {
    return obj[cleanLang] || obj.pt || obj.en || obj.es || Object.values(obj)[0] || '';
  }

  return String(field);
}
