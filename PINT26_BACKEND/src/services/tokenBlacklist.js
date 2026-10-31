const { Op } = require('sequelize');
const crypto = require('crypto');
const TokenBlacklist = require('../models/token_blacklist.model');

// Utilitário para gerar o Hash do Token (Segurança adicional e limite de tamanho na DB)
function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Função de limpeza assíncrona que apaga fisicamente os tokens cujo tempo de vida já ultrapassou o tempo limite natural
async function cleanup() {
  try {
    await TokenBlacklist.destroy({
      where: {
        expires_at: { [Op.lte]: new Date() }
      }
    });
  } catch (error) {
    console.error('Erro no cleanup da Token Blacklist:', error.message);
  }
}

// Guarda o token revogado permanentemente na Base de Dados até que o seu limite expire
async function revokeToken(token, expUnixSeconds) {
  cleanup(); // Despoleta limpeza de tokens antigos em background
  try {
    const expMs = (expUnixSeconds || 0) * 1000;
    const expiresAt = new Date(expMs);
    const tokenHash = hashToken(token);
    
    await TokenBlacklist.findOrCreate({
      where: { token: tokenHash },
      defaults: { expires_at: expiresAt }
    });
  } catch (error) {
    console.error('Erro ao revogar token:', error.message);
  }
}

// Verifica se o token existe na base de dados
async function isTokenRevoked(token) {
  // Limpeza condicional para manter BD limpa ocasionalmente, pode-se retirar daqui se pesar muito
  if (Math.random() < 0.05) cleanup(); 
  
  try {
    const tokenHash = hashToken(token);
    const found = await TokenBlacklist.findOne({ where: { token: tokenHash } });
    return !!found; // Devolve true se existir, false se não existir
  } catch (error) {
    console.error('Erro ao verificar revogação:', error.message);
    return false; // Por segurança, não bloqueia em caso de falha transitória do DB, o JWT default fallback assume.
  }
}

module.exports = {
  revokeToken,
  isTokenRevoked
};