const RenovacaoBadge = require('../models/renovacao_badge.model');

async function seedRenovacaoBadge(transaction) {
  const renovacoesDefault = [
    {
      id_renovacao_badge: '01a0447c-3149-734f-95e5-be9a7d58ee9a',
      id_candidatura: '019eb744-9c11-745f-8f24-7d2dd6ce59ca', // Marta Queiroz - Senior Low Code
      id_moderador: '019d6cd2-baad-721b-8e8d-9761f013ceb6', // John Doe (Admin)
      pontos_renovacao: 50,
      data_pedido: '2025-09-25 11:00:00',
      data_renovacao: '2025-09-30 14:30:00',
      renovacao_aprovada: true,
      renovacaoAtiva: true
    }
  ];

  for (const renovacao of renovacoesDefault) {
    const [instance, created] = await RenovacaoBadge.findOrCreate({
      where: { id_renovacao_badge: renovacao.id_renovacao_badge },
      defaults: renovacao,
      transaction
    });
    if (!created) {
      await instance.update({
        id_moderador: renovacao.id_moderador,
        pontos_renovacao: renovacao.pontos_renovacao,
        data_pedido: renovacao.data_pedido,
        data_renovacao: renovacao.data_renovacao,
        renovacao_aprovada: renovacao.renovacao_aprovada,
        renovacaoAtiva: renovacao.renovacaoAtiva
      }, { transaction });
    }
  }

  console.log('Seed Renovação de Badge executado');
}

module.exports = seedRenovacaoBadge;
