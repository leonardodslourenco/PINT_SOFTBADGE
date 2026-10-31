/**
 * FORMATADOR: Transforma minutos em texto descritivo e amigável.
 * 
 * @param {number} minutes - O tempo em minutos a formatar.
 * @returns {string} - String formatada (ex: "1 hora" ou "30 minutos").
 */
function formatTempoRestante(minutes) {
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    return `${hours} hora${hours > 1 ? 's' : ''}`;
  }
  return `${minutes} minuto${minutes > 1 ? 's' : ''}`;
}

module.exports = {
  formatTempoRestante
};
