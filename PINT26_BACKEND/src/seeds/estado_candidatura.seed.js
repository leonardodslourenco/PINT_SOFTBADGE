const EstadoCandidatura = require('../models/estado_candidatura.model');

async function seedEstadoCandidatura(transaction) {

  const EstadosDefault = [
    { id_estado_candidatura: 1, id_traducao_estado_candidatura: '019e4727-bd20-766e-adbd-3514d8934b3c' }, //Estado Aberto (quando a candidatura esta no lado do consultor para adicionar evidências para submeter)
    { id_estado_candidatura: 2, id_traducao_estado_candidatura: '019e4729-b95f-7068-84fb-3d05b4dac77f' }, //Estado Submetido (quando a candidatura esta no lado do TM para pré validação)
    { id_estado_candidatura: 3, id_traducao_estado_candidatura: '019e4729-b95f-7068-84fb-41444bf831ae' }, //Estado Em validação (quando o TM validou e passa para o lado do SLL para validação final)
    { id_estado_candidatura: 4, id_traducao_estado_candidatura: '019e4736-d676-732b-b883-1a21d50c1fc1' }, //Estado Fechado OK
    { id_estado_candidatura: 5, id_traducao_estado_candidatura: '019f6001-9250-72ea-829f-d4544aff446e' }, //Estado Fechado NOK
  ];

  for (const estadoCandidatura of EstadosDefault) {
    await EstadoCandidatura.findOrCreate({
      where: { id_estado_candidatura: estadoCandidatura.id_estado_candidatura },
      defaults: estadoCandidatura,
      transaction
    });
  }

  console.log("Seed Estado Candidatura executado");
}

module.exports = seedEstadoCandidatura;