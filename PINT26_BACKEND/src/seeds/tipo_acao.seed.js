const TipoAcao = require('../models/tipo_acao.model');

async function seedTipoAcao(transaction) {

  const acaoDefault = [
    { id_tipo_acao_candidatura: 1,  id_traducao_acao_candidatura: '019e4a1d-8661-76ed-bb7e-b01247ae29fb'}, //Criada
    { id_tipo_acao_candidatura: 2,  id_traducao_acao_candidatura: '019e4a1e-ad18-7225-bc33-ef5c6d1022c0'}, //Submetida
    { id_tipo_acao_candidatura: 3,  id_traducao_acao_candidatura: '019e4a1e-cc71-75e8-b90a-f2c81004f8d6'}, //Rejeitada TM
    { id_tipo_acao_candidatura: 4,  id_traducao_acao_candidatura: '019e4a1f-05cb-702d-810e-1dc76cbdc155'}, //Pré-Aprovada TM
    { id_tipo_acao_candidatura: 5,  id_traducao_acao_candidatura: '019e4a1f-2687-71de-acbc-11bb23e60ad8'}, //Rejeitada SLL
    { id_tipo_acao_candidatura: 6,  id_traducao_acao_candidatura: '019e4a1f-4f2a-77fb-b531-bba6f982e83f'}, //Aprovada SLL
    { id_tipo_acao_candidatura: 7,  id_traducao_acao_candidatura: '019e4a1f-695a-70c1-8bd1-8c9ef524f3f9'}, //Encerrada SLL
    { id_tipo_acao_candidatura: 8,  id_traducao_acao_candidatura: '019e4a1f-855a-716b-aef5-6e85dfd3b02e'}, //Cancelada Consultor
    { id_tipo_acao_candidatura: 9,  id_traducao_acao_candidatura: '019e4a1f-a209-70cd-a759-384cfbc77336'}, //Cancelada Sistema
    { id_tipo_acao_candidatura: 10, id_traducao_acao_candidatura: '019e4b73-d37c-77af-9e5c-cd765c6fd6cb'} //Anexo de evidência
  ];

  for (const tipoAcao of acaoDefault) {
    await TipoAcao.findOrCreate({
      where: { id_tipo_acao_candidatura: tipoAcao.id_tipo_acao_candidatura },
      defaults: tipoAcao,
      transaction
    });
  }

  console.log("Seed Tipo Acao executado");
}

module.exports = seedTipoAcao;