const EvidenciaRenovacao = require('../models/evidencia_renovacao.model');

async function seedEvidenciaRenovacao(transaction) {
  const evidenciasDefault = [
    {
      id_evidencia_renovacao: '01a0447c-5500-754f-95e5-be9a7d58ee01',
      id_renovacao_badge: '01a0447c-3149-734f-95e5-be9a7d58ee9a', // Marta Queiroz - Renovação Senior Low Code
      id_requisito: 7, // Requisito do Badge Senior Low-Code
      nome_ficheiro: 'renew_20251220.pdf',
      url_ficheiro: '/uploads/evidences/019eb744-9c11-745f-8f24-7d2dd6ce59ca/renew_20251220.pdf',
      data_upload_evidencia: '2025-09-25 11:30:00',
      validado_moderador: true,
      id_moderador_validador: '019d6cd2-baad-721b-8e8d-9761f013ceb6', // John Doe (Admin)
      evidenciaAtiva: true
    }
  ];

  for (const evidencia of evidenciasDefault) {
    const [instance, created] = await EvidenciaRenovacao.findOrCreate({
      where: { id_evidencia_renovacao: evidencia.id_evidencia_renovacao },
      defaults: evidencia,
      transaction
    });
    if (!created) {
      await instance.update({
        id_renovacao_badge: evidencia.id_renovacao_badge,
        id_requisito: evidencia.id_requisito,
        nome_ficheiro: evidencia.nome_ficheiro,
        url_ficheiro: evidencia.url_ficheiro,
        data_upload_evidencia: evidencia.data_upload_evidencia,
        validado_moderador: evidencia.validado_moderador,
        id_moderador_validador: evidencia.id_moderador_validador,
        evidenciaAtiva: evidencia.evidenciaAtiva
      }, { transaction });
    }
  }

  console.log('Seed Evidência de Renovação executado');
}

module.exports = seedEvidenciaRenovacao;
