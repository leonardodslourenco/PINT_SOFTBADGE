const PERFIS = {
  ADMIN: 1,
  SLL: 2,
  TM: 3,
  CONSULTOR: 4
};

function autorizarPerfis(perfisPermitidos = []) {
  return (req, res, next) => {
    const perfisToken = req.auth?.perfis;

    if (!Array.isArray(perfisToken) || perfisToken.length === 0) {
      return res.status(403).json({ success: false, message: 'Acesso negado: perfil ausente no token.' });
    }

    const permitido = perfisPermitidos.some(p => perfisToken.includes(p));
    if (!permitido) {
      return res.status(403).json({ success: false, message: 'Acesso negado: perfil sem permissão para este endpoint.' });
    }

    return next();
  };
}

module.exports = {
  PERFIS,
  autorizarPerfis
};