module.exports = function (req, res, next) {

  const supportedLangs = ['pt', 'en', 'es'];

  let lang = req.query.lang;

  // Se o Axios duplicar o parâmetro (ex: ?lang=pt&lang=en), req.query.lang será um Array.
  // Escolhemos o primeiro elemento, que corresponde ao parâmetro explicitamente definido na URL.
  if (Array.isArray(lang)) {
    lang = lang[0];
  }

  lang = lang || 'pt';

  if (!supportedLangs.includes(lang)) {
    lang = 'pt';
  }

  req.lang = lang;

  next();
};