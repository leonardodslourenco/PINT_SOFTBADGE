const ConquistaAtribuida = require('../models/conquista_atribuida.model');

const ConquistasAtribuidasDefault = [
  {
    id_conquista_atribuida: '01a04468-58d7-733b-833d-ba9b86a35783',
    id_utilizador: '019f3390-5740-76f7-85ce-fa3c5001c570',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000001',
    id_candidatura_especial: '01a04468-58d7-733b-833d-b58875a71a75',
    data_atribuicao_conquista: '2024-03-14 03:50:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04468-58d7-733b-833d-e65f0c4f3acd',
    id_utilizador: '019f3390-5740-76f7-85cf-1809d64e893f',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000002',
    id_candidatura_especial: '01a04468-58d7-733b-833d-e001d8d2612b',
    data_atribuicao_conquista: '2024-05-18 10:30:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04468-58d7-733b-833d-eed832168937',
    id_utilizador: '019f3390-5740-76f7-85cf-1809d64e893f',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000003',
    id_candidatura_especial: '01a04468-58d7-733b-833d-e90aba521d05',
    data_atribuicao_conquista: '2024-07-02 22:30:00',
    pontos_conquistados: 400,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04468-58d7-733b-833e-19408368794f',
    id_utilizador: '019f3390-5740-76f7-85cf-1cb921778500',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000003',
    id_candidatura_especial: '01a04468-58d7-733b-833e-14d06d5fa440',
    data_atribuicao_conquista: '2024-07-23 08:20:00',
    pontos_conquistados: 400,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04468-58d7-733b-833e-210f6dbddac6',
    id_utilizador: '019f3390-5740-76f7-85cf-1cb921778500',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000004',
    id_candidatura_especial: '01a04468-58d7-733b-833e-1f816448d524',
    data_atribuicao_conquista: '2024-09-06 20:20:00',
    pontos_conquistados: 350,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04468-58d7-733b-833e-2b586502ddb7',
    id_utilizador: '019f3390-5740-76f7-85cf-1cb921778500',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000005',
    id_candidatura_especial: '01a04468-58d7-733b-833e-27b776a73618',
    data_atribuicao_conquista: '2024-10-22 08:20:00',
    pontos_conquistados: 250,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98d-e8732f36698c',
    id_utilizador: '019f3390-573f-719f-a940-32fa069ad69c',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000004',
    id_candidatura_especial: '01a04469-bc95-77bb-a98d-e6d55c7a11c3',
    data_atribuicao_conquista: '2024-09-07 11:40:00',
    pontos_conquistados: 350,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98e-157a8166bc5b',
    id_utilizador: '019f3390-5740-76f7-85ce-d66212d56977',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000005',
    id_candidatura_especial: '01a04469-bc95-77bb-a98e-13edc5ce1490',
    data_atribuicao_conquista: '2024-11-14 18:05:00',
    pontos_conquistados: 250,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98e-1fbed48a79b8',
    id_utilizador: '019f3390-5740-76f7-85ce-d66212d56977',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000006',
    id_candidatura_especial: '01a04469-bc95-77bb-a98e-1b6fd8bbd308',
    data_atribuicao_conquista: '2024-12-30 06:05:00',
    pontos_conquistados: 200,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98e-4a24b22dba96',
    id_utilizador: '019f3390-5740-76f7-85ce-dadf6420b9ee',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000006',
    id_candidatura_especial: '01a04469-bc95-77bb-a98e-4541ca47bcae',
    data_atribuicao_conquista: '2024-12-28 13:35:00',
    pontos_conquistados: 200,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98e-5097a2780907',
    id_utilizador: '019f3390-5740-76f7-85ce-dadf6420b9ee',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000001',
    id_candidatura_especial: '01a04469-bc95-77bb-a98e-4f687657fa65',
    data_atribuicao_conquista: '2025-02-12 01:35:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98e-5bdb7682d801',
    id_utilizador: '019f3390-5740-76f7-85ce-dadf6420b9ee',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000002',
    id_candidatura_especial: '01a04469-bc95-77bb-a98e-56c0a587f428',
    data_atribuicao_conquista: '2025-03-29 13:35:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98e-85f84f485ec7',
    id_utilizador: '019f3390-5740-76f7-85ce-dfeb11352d06',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000001',
    id_candidatura_especial: '01a04469-bc95-77bb-a98e-803b7e6b5d3e',
    data_atribuicao_conquista: '2025-02-20 04:50:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98e-b313af29dde4',
    id_utilizador: '019f3390-5740-76f7-85ce-e3d66cfe86ea',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000002',
    id_candidatura_especial: '01a04469-bc95-77bb-a98e-aedd56e60436',
    data_atribuicao_conquista: '2025-04-10 09:20:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98e-b96762b8b702',
    id_utilizador: '019f3390-5740-76f7-85ce-e3d66cfe86ea',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000003',
    id_candidatura_especial: '01a04469-bc95-77bb-a98e-b7166696705a',
    data_atribuicao_conquista: '2025-05-25 21:20:00',
    pontos_conquistados: 400,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98e-e5ed1f081b31',
    id_utilizador: '019f3390-5740-76f7-85ce-e44410ca8383',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000003',
    id_candidatura_especial: '01a04469-bc95-77bb-a98e-e2be1bdfe9a9',
    data_atribuicao_conquista: '2025-05-25 08:05:00',
    pontos_conquistados: 400,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98e-ee5f4396f190',
    id_utilizador: '019f3390-5740-76f7-85ce-e44410ca8383',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000004',
    id_candidatura_especial: '01a04469-bc95-77bb-a98e-ea0f41faee82',
    data_atribuicao_conquista: '2025-07-09 20:05:00',
    pontos_conquistados: 350,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98e-f7f0c4c2fd97',
    id_utilizador: '019f3390-5740-76f7-85ce-e44410ca8383',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000005',
    id_candidatura_especial: '01a04469-bc95-77bb-a98e-f2a2bff2f03d',
    data_atribuicao_conquista: '2025-08-24 08:05:00',
    pontos_conquistados: 250,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98f-2016540c7c6c',
    id_utilizador: '019f3390-5740-76f7-85ce-ea21cee22423',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000004',
    id_candidatura_especial: '01a04469-bc95-77bb-a98f-1edd1aed8b5c',
    data_atribuicao_conquista: '2025-07-17 11:35:00',
    pontos_conquistados: 350,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98f-4c2df8d9c294',
    id_utilizador: '019f3390-5740-76f7-85ce-ed0fefcfc69e',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000005',
    id_candidatura_especial: '01a04469-bc95-77bb-a98f-49f52bcfcf82',
    data_atribuicao_conquista: '2025-08-30 16:50:00',
    pontos_conquistados: 250,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a04469-bc95-77bb-a98f-5507a364f461',
    id_utilizador: '019f3390-5740-76f7-85ce-ed0fefcfc69e',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000006',
    id_candidatura_especial: '01a04469-bc95-77bb-a98f-503884fe459c',
    data_atribuicao_conquista: '2025-10-15 04:50:00',
    pontos_conquistados: 200,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9823-50907ad6bc0e',
    id_utilizador: '019f3390-5740-76f7-85ce-f148f699a9cf',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000006',
    id_candidatura_especial: '01a0446a-1d94-7449-9823-4f68aa484922',
    data_atribuicao_conquista: '2025-10-13 14:40:00',
    pontos_conquistados: 200,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9823-5b3fafea6937',
    id_utilizador: '019f3390-5740-76f7-85ce-f148f699a9cf',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000001',
    id_candidatura_especial: '01a0446a-1d94-7449-9823-5524b2002e6a',
    data_atribuicao_conquista: '2025-11-28 02:40:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9823-61f96952bd4f',
    id_utilizador: '019f3390-5740-76f7-85ce-f148f699a9cf',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000002',
    id_candidatura_especial: '01a0446a-1d94-7449-9823-5e106cc825aa',
    data_atribuicao_conquista: '2026-01-12 14:40:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9823-8d0f25d44425',
    id_utilizador: '019f3390-5740-76f7-85ce-f71ea85486a2',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000001',
    id_candidatura_especial: '01a0446a-1d94-7449-9823-8a799329ed77',
    data_atribuicao_conquista: '2025-11-27 10:20:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9823-b823c8d59e67',
    id_utilizador: '019f3390-5740-76f7-85ce-fc6e13ea3421',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000002',
    id_candidatura_especial: '01a0446a-1d94-7449-9823-b5d95a2d3ffa',
    data_atribuicao_conquista: '2026-01-07 05:50:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9823-c3aafa7201c9',
    id_utilizador: '019f3390-5740-76f7-85ce-fc6e13ea3421',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000003',
    id_candidatura_especial: '01a0446a-1d94-7449-9823-bccc2790f3b9',
    data_atribuicao_conquista: '2026-02-21 17:50:00',
    pontos_conquistados: 400,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9823-ecfde1471ea7',
    id_utilizador: '019f3390-5740-76f7-85cf-028c0bb51f1e',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000003',
    id_candidatura_especial: '01a0446a-1d94-7449-9823-e8b4cc93388b',
    data_atribuicao_conquista: '2026-02-17 09:20:00',
    pontos_conquistados: 400,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9823-f40c162ff668',
    id_utilizador: '019f3390-5740-76f7-85cf-028c0bb51f1e',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000004',
    id_candidatura_especial: '01a0446a-1d94-7449-9823-f06c3fe1ac1d',
    data_atribuicao_conquista: '2026-04-03 21:20:00',
    pontos_conquistados: 350,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9823-fc20cbd3c8bf',
    id_utilizador: '019f3390-5740-76f7-85cf-028c0bb51f1e',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000005',
    id_candidatura_especial: '01a0446a-1d94-7449-9823-fb12dc6102a5',
    data_atribuicao_conquista: '2026-05-19 09:20:00',
    pontos_conquistados: 250,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9824-29ddce0859d4',
    id_utilizador: '019f3390-5740-76f7-85cf-05c87bb87de3',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000004',
    id_candidatura_especial: '01a0446a-1d94-7449-9824-27cbe19ee1fa',
    data_atribuicao_conquista: '2026-03-25 14:35:00',
    pontos_conquistados: 350,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9824-5651117cc3f9',
    id_utilizador: '019f3390-5740-76f7-85cf-0915f056f4c1',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000005',
    id_candidatura_especial: '01a0446a-1d94-7449-9824-509206795eaf',
    data_atribuicao_conquista: '2026-04-27 12:20:00',
    pontos_conquistados: 250,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9824-5f376b03ad29',
    id_utilizador: '019f3390-5740-76f7-85cf-0915f056f4c1',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000006',
    id_candidatura_especial: '01a0446a-1d94-7449-9824-59eacc9a1988',
    data_atribuicao_conquista: '2026-06-12 00:20:00',
    pontos_conquistados: 200,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9824-8a1a2710859b',
    id_utilizador: '019f3390-5740-76f7-85cf-0c7c4fb9dd57',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000006',
    id_candidatura_especial: '01a0446a-1d94-7449-9824-87ccddc43df3',
    data_atribuicao_conquista: '2026-05-21 19:50:00',
    pontos_conquistados: 200,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9824-9116c0b0b710',
    id_utilizador: '019f3390-5740-76f7-85cf-0c7c4fb9dd57',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000001',
    id_candidatura_especial: '01a0446a-1d94-7449-9824-8d2effd20eef',
    data_atribuicao_conquista: '2026-07-06 07:50:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9824-9aa4749563be',
    id_utilizador: '019f3390-5740-76f7-85cf-0c7c4fb9dd57',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000002',
    id_candidatura_especial: '01a0446a-1d94-7449-9824-95d839d07f66',
    data_atribuicao_conquista: '2026-08-20 19:50:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0446a-1d94-7449-9824-c61e4a335b74',
    id_utilizador: '019f3390-5740-76f7-85cf-11d5a1b61403',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000001',
    id_candidatura_especial: '01a0446a-1d94-7449-9824-c17a5c3753fb',
    data_atribuicao_conquista: '2026-06-24 03:40:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0447b-bd74-727d-b614-f08fc42032c1',
    id_utilizador: '019f3390-5740-76f7-85cf-1743b1fb20eb',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000002',
    id_candidatura_especial: '01a0447b-bd74-727d-b614-ed6f4e36469e',
    data_atribuicao_conquista: '2026-07-18 10:05:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  {
    id_conquista_atribuida: '01a0447b-bd74-727d-b614-f92211ec2a5d',
    id_utilizador: '019f3390-5740-76f7-85cf-1743b1fb20eb',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000003',
    id_candidatura_especial: '01a0447b-bd74-727d-b614-f60abfe8d9a4',
    data_atribuicao_conquista: '2026-09-01 22:05:00',
    pontos_conquistados: 400,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
  // Marta Queiroz — AWS Certified Cloud Practitioner (aprovada 02/09/2026 por John Doe, partilha pública ativa)
  {
    id_conquista_atribuida: '01a0447b-bd74-727d-b615-3d532b744c0a',
    id_utilizador: '019da529-f1f9-764e-a860-6d4ed4967b2e',
    id_conquista_especial: '019eb920-0000-7000-8000-000000000001',
    id_candidatura_especial: '01a0447b-bd74-727d-b615-382484b929e2',
    data_atribuicao_conquista: '2026-09-02 14:30:00',
    pontos_conquistados: 300,
    rgpd_partilha_conquista: true,
    atribuicaoAtiva: true
  },
];

async function seedConquistaAtribuida(transaction) {
  for (const item of ConquistasAtribuidasDefault) {
    await ConquistaAtribuida.findOrCreate({
      where: { id_conquista_atribuida: item.id_conquista_atribuida },
      defaults: item,
      transaction
    });
  }
  console.log(`Seed ConquistaAtribuida executado (${ConquistasAtribuidasDefault.length} conquistas atribuídas registadas).`);
}

module.exports = seedConquistaAtribuida;
