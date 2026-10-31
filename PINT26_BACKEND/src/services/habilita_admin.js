const Utilizador = require('../models/utilizador.model');

async function garanteAdminAtivo() {
  const adminId = '019d6cd2-baad-721b-8e8d-9761f013ceb6';
  
  try {
    const adminUser = await Utilizador.findByPk(adminId);
    if (adminUser) {
      if (!adminUser.conta_ativa || adminUser.conta_bloqueada || adminUser.contador_bloqueio > 0) {
        await adminUser.update({
          conta_ativa: true,
          conta_bloqueada: false,
          contador_bloqueio: 0
        });
        console.log("Serviço de Segurança: A conta do Administrador principal foi reativada e desbloqueada com sucesso.");
      }
    }
  } catch (error) {
    console.error("Erro ao verificar/garantir conta de Admin:", error.message);
  }
}

module.exports = garanteAdminAtivo;
