const BadgeAtribuido = require('../models/badge_atribuido.model');

async function seedBadgeAtribuido(transaction) {
  const badgeAtribuidoDefault = [
    {
      id_candidato: '019da529-f1f9-764e-a860-6d4ed4967b2e',
      id_candidatura: '019e4aeb-4bb0-760d-a4d8-e0f8f477747a',
      id_badge: '019e44d5-7b7d-70ac-a2ec-f23084d1d21c',
      data_atribuicao_badge: '2026-02-16 12:20:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: false,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019da529-f1f9-764e-a860-6d4ed4967b2e',
      id_candidatura: '019e4af4-8778-73b9-9cb9-a56d74dbfa61',
      id_badge: '019e44d5-b96c-7097-acda-6111fa1532f4',
      data_atribuicao_badge: '2026-02-19 13:20:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 200,
      rgdp_partilha_badge: false,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019da529-f1f9-764e-a860-6d4ed4967b2e',
      id_candidatura: '019eb744-9c11-745f-8f24-7d2dd6ce59ca',
      id_badge: '019e44e0-10ed-77fd-b037-e95c977b8bec',
      data_atribuicao_badge: '2024-10-20 16:00:00',
      data_expiracao: '2026-09-30 14:30:00',
      url_publico_badge: null,
      pontos_adquiridos: 300,
      rgdp_partilha_badge: false,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85ce-fa3c5001c570',
      id_candidatura: '01a04468-58d7-733b-833d-9314d2145f91',
      id_badge: '019f618c-b3cb-7618-9eba-5df114766503',
      data_atribuicao_badge: '2024-02-12 03:50:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85cf-1809d64e893f',
      id_candidatura: '01a04468-58d7-733b-833d-bd5262eecbd4',
      id_badge: '019f618c-7c24-72aa-9b25-019f618c0002',
      data_atribuicao_badge: '2024-04-17 10:30:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85cf-1cb921778500',
      id_candidatura: '01a04468-58d7-733b-833d-f057436196ae',
      id_badge: '019f618c-7c24-72aa-9b25-019f618c0003',
      data_atribuicao_badge: '2024-06-22 08:20:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-573f-719f-a940-32fa069ad69c',
      id_candidatura: '01a04468-58d7-733b-833e-2e394a82bc0b',
      id_badge: '019f618c-7c24-72aa-9b25-e5b83594a20c',
      data_atribuicao_badge: '2024-08-07 11:40:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 200,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85ce-d66212d56977',
      id_candidatura: '01a04469-bc95-77bb-a98d-ec996e2b994e',
      id_badge: '019f618c-7c24-72aa-9b25-f8d9c8afe7f6',
      data_atribuicao_badge: '2024-10-14 18:05:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85ce-dadf6420b9ee',
      id_candidatura: '01a04469-bc95-77bb-a98e-206cc97f7bd1',
      id_badge: '019f618c-7c24-72aa-9b26-3eca1a9ce184',
      data_atribuicao_badge: '2024-11-27 13:35:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 200,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85ce-dfeb11352d06',
      id_candidatura: '01a04469-bc95-77bb-a98e-5ca78026ef89',
      id_badge: '019f618c-7c24-72aa-9b26-83d627700248',
      data_atribuicao_badge: '2025-01-20 04:50:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85ce-e3d66cfe86ea',
      id_candidatura: '01a04469-bc95-77bb-a98e-88862a896334',
      id_badge: '019f618c-b3cb-7618-9eb9-3329bedd11d0',
      data_atribuicao_badge: '2025-03-10 09:20:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 200,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85ce-e44410ca8383',
      id_candidatura: '01a04469-bc95-77bb-a98e-bde3785591f9',
      id_badge: '019f618c-b3cb-7618-9eb9-4789761207d7',
      data_atribuicao_badge: '2025-04-24 08:05:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85ce-ea21cee22423',
      id_candidatura: '01a04469-bc95-77bb-a98e-fbbb271f70bf',
      id_badge: '019f618c-b3cb-7618-9eb9-89793e886e5b',
      data_atribuicao_badge: '2025-06-16 11:35:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 200,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85ce-ed0fefcfc69e',
      id_candidatura: '01a04469-bc95-77bb-a98f-26b1fc7f0478',
      id_badge: '019f618c-b3cb-7618-9eb9-cc0e157d2627',
      data_atribuicao_badge: '2025-07-30 16:50:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85ce-f148f699a9cf',
      id_candidatura: '01a04469-bc95-77bb-a98f-580e27b48d41',
      id_badge: '019f618c-b3cb-7618-9eba-108c1053c032',
      data_atribuicao_badge: '2025-09-12 14:40:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 200,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85ce-f71ea85486a2',
      id_candidatura: '01a0446a-1d94-7449-9823-65a153fedeb2',
      id_badge: '019f618c-b3cb-7618-9eba-26a9de43cc56',
      data_atribuicao_badge: '2025-10-27 10:20:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85ce-fc6e13ea3421',
      id_candidatura: '01a0446a-1d94-7449-9823-907664b118f8',
      id_badge: '019f618c-fbf3-732b-8945-2746eb23cca9',
      data_atribuicao_badge: '2025-12-07 05:50:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 200,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85cf-028c0bb51f1e',
      id_candidatura: '01a0446a-1d94-7449-9823-c7a9cca3ad9a',
      id_badge: '019f618c-fbf3-732b-8945-69bacdd31186',
      data_atribuicao_badge: '2026-01-17 09:20:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85cf-05c87bb87de3',
      id_candidatura: '01a0446a-1d94-7449-9824-031c76e64dbd',
      id_badge: '019f618c-fbf3-732b-8945-aee839537230',
      data_atribuicao_badge: '2026-02-22 14:35:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 200,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85cf-0915f056f4c1',
      id_candidatura: '01a0446a-1d94-7449-9824-2e7a4b8c937c',
      id_badge: '019f618c-fbf3-732b-8945-c2b2d39a1416',
      data_atribuicao_badge: '2026-03-27 12:20:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85cf-0c7c4fb9dd57',
      id_candidatura: '01a0446a-1d94-7449-9824-6172f41724dc',
      id_badge: '019f618c-fbf3-732b-8946-06d902341ea3',
      data_atribuicao_badge: '2026-04-20 19:50:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 200,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85cf-11d5a1b61403',
      id_candidatura: '01a0446a-1d94-7449-9824-9cce1976e8ea',
      id_badge: '019f618c-fbf3-732b-8946-49d80ebdd867',
      data_atribuicao_badge: '2026-05-24 03:40:00',
      data_expiracao: null,
      url_publico_badge: null,
      pontos_adquiridos: 100,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
    {
      id_candidato: '019f3390-5740-76f7-85cf-1743b1fb20eb',
      id_candidatura: '01a0446a-1d94-7449-9824-ca21ae02af81',
      id_badge: '019e44e5-025a-753f-9992-1762fc1d1fa5',
      data_atribuicao_badge: '2026-06-17 10:05:00',
      data_expiracao: '2027-06-17 10:05:00',
      url_publico_badge: null,
      pontos_adquiridos: 500,
      rgdp_partilha_badge: true,
      atribuicaoAtiva: true
    },
  ];

  for (const badgeAtribuido of badgeAtribuidoDefault) {
    const [instance, created] = await BadgeAtribuido.findOrCreate({
      where: {
        id_candidato: badgeAtribuido.id_candidato,
        id_candidatura: badgeAtribuido.id_candidatura,
        id_badge: badgeAtribuido.id_badge
      },
      defaults: badgeAtribuido,
      transaction
    });
    if (!created) {
      await instance.update({
        data_atribuicao_badge: badgeAtribuido.data_atribuicao_badge,
        data_expiracao: badgeAtribuido.data_expiracao,
        pontos_adquiridos: badgeAtribuido.pontos_adquiridos,
        rgdp_partilha_badge: badgeAtribuido.rgdp_partilha_badge,
        atribuicaoAtiva: badgeAtribuido.atribuicaoAtiva
      }, { transaction });
    }
  }

  console.log('Seed Badge Atribuido executado');
}

module.exports = seedBadgeAtribuido;