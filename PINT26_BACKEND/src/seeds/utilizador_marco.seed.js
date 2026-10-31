const UtilizadorMarco = require('../models/utilizador_marco.model');

const utilizadorMarcosDefault = [
  {
    id_utilizador: '019da529-f1f9-764e-a860-6d4ed4967b2e', // Marta Queiroz
    id_marco: '019f7301-2222-7000-8000-000000000001', // Primeiro Passo
    data_conquista_marco: new Date('2026-02-16T10:30:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019da529-f1f9-764e-a860-6d4ed4967b2e', // Marta Queiroz
    id_marco: '019f7301-2222-7000-8000-000000000003', // Pioneiro Certificado
    data_conquista_marco: new Date('2026-02-16T11:55:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-fa3c5001c570',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2024-02-10T09:30:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-fa3c5001c570',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2024-02-12T03:50:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-1809d64e893f',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2024-04-15T14:10:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-1809d64e893f',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2024-04-17T10:30:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-1cb921778500',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2024-06-20T10:00:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-1cb921778500',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2024-06-22T08:20:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-573f-719f-a940-32fa069ad69c',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2024-08-05T11:20:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-573f-719f-a940-32fa069ad69c',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2024-08-07T11:40:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-d66212d56977',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2024-10-12T15:45:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-d66212d56977',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2024-10-14T18:05:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-dadf6420b9ee',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2024-11-25T09:15:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-dadf6420b9ee',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2024-11-27T13:35:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-dfeb11352d06',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2025-01-18T10:30:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-dfeb11352d06',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2025-01-20T04:50:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-e3d66cfe86ea',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2025-03-08T13:00:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-e3d66cfe86ea',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2025-03-10T09:20:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-e44410ca8383',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2025-04-22T09:45:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-e44410ca8383',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2025-04-24T08:05:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-ea21cee22423',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2025-06-14T11:15:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-ea21cee22423',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2025-06-16T11:35:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-ed0fefcfc69e',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2025-07-28T14:30:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-ed0fefcfc69e',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2025-07-30T16:50:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-f148f699a9cf',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2025-09-10T10:20:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-f148f699a9cf',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2025-09-12T14:40:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-f71ea85486a2',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2025-10-25T16:00:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-f71ea85486a2',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2025-10-27T10:20:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-fc6e13ea3421',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2025-12-05T09:30:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85ce-fc6e13ea3421',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2025-12-07T05:50:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-028c0bb51f1e',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2026-01-15T11:00:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-028c0bb51f1e',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2026-01-17T09:20:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-05c87bb87de3',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2026-02-20T14:15:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-05c87bb87de3',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2026-02-22T14:35:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-0915f056f4c1',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2026-03-25T10:00:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-0915f056f4c1',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2026-03-27T12:20:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-0c7c4fb9dd57',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2026-04-18T15:30:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-0c7c4fb9dd57',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2026-04-20T19:50:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-11d5a1b61403',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2026-05-22T09:20:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-11d5a1b61403',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2026-05-24T03:40:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-1743b1fb20eb',
    id_marco: '019f7301-2222-7000-8000-000000000001',
    data_conquista_marco: new Date('2026-06-15T13:45:00.000Z'),
    celebrado: false
  },
  {
    id_utilizador: '019f3390-5740-76f7-85cf-1743b1fb20eb',
    id_marco: '019f7301-2222-7000-8000-000000000003',
    data_conquista_marco: new Date('2026-06-17T10:05:00.000Z'),
    celebrado: false
  },
];

async function seedUtilizadorMarco(transaction) {
  try {
    for (const item of utilizadorMarcosDefault) {
      await UtilizadorMarco.findOrCreate({
        where: {
          id_utilizador: item.id_utilizador,
          id_marco: item.id_marco
        },
        defaults: item,
        transaction
      });
    }

    console.log(`Seed UtilizadorMarco executado (${utilizadorMarcosDefault.length} marcos de utilizador registados).`);
  } catch (error) {
    console.error('Erro ao executar Seed UtilizadorMarco:', error.message);
    throw error;
  }
}

module.exports = seedUtilizadorMarco;
