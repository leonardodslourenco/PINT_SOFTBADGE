const Certificado = require('../models/certificado.model');

async function seedCertificado(transaction) {
  const CertificadosDefault = [
    {
      id_certificado: "01a006b4-6c8a-70b2-8541-568a1bd2b941",
      id_candidatura: "019e4aeb-4bb0-760d-a4d8-e0f8f477747a",
      id_consultor: "019da529-f1f9-764e-a860-6d4ed4967b2e",
      id_badge: "019e44d5-7b7d-70ac-a2ec-f23084d1d21c",
      data_emissao: "2026-08-15 11:55:00",
      codigo_validacao: "487D0B702247",
      ficheiro_path: "docs/certificados/019da529-f1f9-764e-a860-6d4ed4967b2e/01a006b4-6c8a-70b2-8541-568a1bd2b941.pdf"
    },
    {
      id_certificado: "01a006b4-6c8a-70b2-8541-59f083d1be0f",
      id_candidatura: "019e4af4-8778-73b9-9cb9-a56d74dbfa61",
      id_consultor: "019da529-f1f9-764e-a860-6d4ed4967b2e",
      id_badge: "019e44d5-b96c-7097-acda-6111fa1532f4",
      data_emissao: "2026-08-15 13:15:00",
      codigo_validacao: "BDB0B8C125B3",
      ficheiro_path: "docs/certificados/019da529-f1f9-764e-a860-6d4ed4967b2e/01a006b4-6c8a-70b2-8541-59f083d1be0f.pdf"
    },
    {
      id_certificado: "01a006b4-6c8a-70b2-8541-5c8f1a2b3c4d",
      id_candidatura: "019eb744-9c11-745f-8f24-7d2dd6ce59ca",
      id_consultor: "019da529-f1f9-764e-a860-6d4ed4967b2e",
      id_badge: "019e44e0-10ed-77fd-b037-e95c977b8bec",
      data_emissao: "2025-09-30 14:30:00",
      codigo_validacao: "E492A7C18F05",
      ficheiro_path: "docs/certificados/019da529-f1f9-764e-a860-6d4ed4967b2e/01a006b4-6c8a-70b2-8541-5c8f1a2b3c4d.pdf"
    },
    {
      id_certificado: '01a04468-58d7-733b-833d-b270bc66b759',
      id_candidatura: '01a04468-58d7-733b-833d-9314d2145f91',
      id_consultor: '019f3390-5740-76f7-85ce-fa3c5001c570',
      id_badge: '019f618c-b3cb-7618-9eba-5df114766503',
      data_emissao: '2024-02-12 03:50:00',
      codigo_validacao: '36468AD1654D',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85ce-fa3c5001c570/01a04468-58d7-733b-833d-b270bc66b759.pdf'
    },
    {
      id_certificado: '01a04468-58d7-733b-833d-dc482b269b7d',
      id_candidatura: '01a04468-58d7-733b-833d-bd5262eecbd4',
      id_consultor: '019f3390-5740-76f7-85cf-1809d64e893f',
      id_badge: '019f618c-7c24-72aa-9b25-019f618c0002',
      data_emissao: '2024-04-17 10:30:00',
      codigo_validacao: '6A2E322003D8',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85cf-1809d64e893f/01a04468-58d7-733b-833d-dc482b269b7d.pdf'
    },
    {
      id_certificado: '01a04468-58d7-733b-833e-13ae4fcf29e3',
      id_candidatura: '01a04468-58d7-733b-833d-f057436196ae',
      id_consultor: '019f3390-5740-76f7-85cf-1cb921778500',
      id_badge: '019f618c-7c24-72aa-9b25-019f618c0003',
      data_emissao: '2024-06-22 08:20:00',
      codigo_validacao: 'A89CBF3EDC46',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85cf-1cb921778500/01a04468-58d7-733b-833e-13ae4fcf29e3.pdf'
    },
    {
      id_certificado: '01a04469-bc95-77bb-a98d-e1bd523524a4',
      id_candidatura: '01a04468-58d7-733b-833e-2e394a82bc0b',
      id_consultor: '019f3390-573f-719f-a940-32fa069ad69c',
      id_badge: '019f618c-7c24-72aa-9b25-e5b83594a20c',
      data_emissao: '2024-08-07 11:40:00',
      codigo_validacao: '8A7F78DF6319',
      ficheiro_path: 'docs/certificados/019f3390-573f-719f-a940-32fa069ad69c/01a04469-bc95-77bb-a98d-e1bd523524a4.pdf'
    },
    {
      id_certificado: '01a04469-bc95-77bb-a98e-0d69d41678b1',
      id_candidatura: '01a04469-bc95-77bb-a98d-ec996e2b994e',
      id_consultor: '019f3390-5740-76f7-85ce-d66212d56977',
      id_badge: '019f618c-7c24-72aa-9b25-f8d9c8afe7f6',
      data_emissao: '2024-10-14 18:05:00',
      codigo_validacao: 'A487F6B1D6E1',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85ce-d66212d56977/01a04469-bc95-77bb-a98e-0d69d41678b1.pdf'
    },
    {
      id_certificado: '01a04469-bc95-77bb-a98e-42021220e76b',
      id_candidatura: '01a04469-bc95-77bb-a98e-206cc97f7bd1',
      id_consultor: '019f3390-5740-76f7-85ce-dadf6420b9ee',
      id_badge: '019f618c-7c24-72aa-9b26-3eca1a9ce184',
      data_emissao: '2024-11-27 13:35:00',
      codigo_validacao: '2B7BC2A8C65E',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85ce-dadf6420b9ee/01a04469-bc95-77bb-a98e-42021220e76b.pdf'
    },
    {
      id_certificado: '01a04469-bc95-77bb-a98e-7cca6b13e522',
      id_candidatura: '01a04469-bc95-77bb-a98e-5ca78026ef89',
      id_consultor: '019f3390-5740-76f7-85ce-dfeb11352d06',
      id_badge: '019f618c-7c24-72aa-9b26-83d627700248',
      data_emissao: '2025-01-20 04:50:00',
      codigo_validacao: '22388811B07D',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85ce-dfeb11352d06/01a04469-bc95-77bb-a98e-7cca6b13e522.pdf'
    },
    {
      id_certificado: '01a04469-bc95-77bb-a98e-ab185d23553a',
      id_candidatura: '01a04469-bc95-77bb-a98e-88862a896334',
      id_consultor: '019f3390-5740-76f7-85ce-e3d66cfe86ea',
      id_badge: '019f618c-b3cb-7618-9eb9-3329bedd11d0',
      data_emissao: '2025-03-10 09:20:00',
      codigo_validacao: '0EDB5F9F84BC',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85ce-e3d66cfe86ea/01a04469-bc95-77bb-a98e-ab185d23553a.pdf'
    },
    {
      id_certificado: '01a04469-bc95-77bb-a98e-df60168f82ce',
      id_candidatura: '01a04469-bc95-77bb-a98e-bde3785591f9',
      id_consultor: '019f3390-5740-76f7-85ce-e44410ca8383',
      id_badge: '019f618c-b3cb-7618-9eb9-4789761207d7',
      data_emissao: '2025-04-24 08:05:00',
      codigo_validacao: '27A805CCC132',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85ce-e44410ca8383/01a04469-bc95-77bb-a98e-df60168f82ce.pdf'
    },
    {
      id_certificado: '01a04469-bc95-77bb-a98f-19224f4de6b4',
      id_candidatura: '01a04469-bc95-77bb-a98e-fbbb271f70bf',
      id_consultor: '019f3390-5740-76f7-85ce-ea21cee22423',
      id_badge: '019f618c-b3cb-7618-9eb9-89793e886e5b',
      data_emissao: '2025-06-16 11:35:00',
      codigo_validacao: '24DFE19FFA7F',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85ce-ea21cee22423/01a04469-bc95-77bb-a98f-19224f4de6b4.pdf'
    },
    {
      id_certificado: '01a04469-bc95-77bb-a98f-4511d5d50f04',
      id_candidatura: '01a04469-bc95-77bb-a98f-26b1fc7f0478',
      id_consultor: '019f3390-5740-76f7-85ce-ed0fefcfc69e',
      id_badge: '019f618c-b3cb-7618-9eb9-cc0e157d2627',
      data_emissao: '2025-07-30 16:50:00',
      codigo_validacao: '924464770B7C',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85ce-ed0fefcfc69e/01a04469-bc95-77bb-a98f-4511d5d50f04.pdf'
    },
    {
      id_certificado: '01a0446a-1d94-7449-9823-4ae8e7a139ac',
      id_candidatura: '01a04469-bc95-77bb-a98f-580e27b48d41',
      id_consultor: '019f3390-5740-76f7-85ce-f148f699a9cf',
      id_badge: '019f618c-b3cb-7618-9eba-108c1053c032',
      data_emissao: '2025-09-12 14:40:00',
      codigo_validacao: '13FF258B44AF',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85ce-f148f699a9cf/01a0446a-1d94-7449-9823-4ae8e7a139ac.pdf'
    },
    {
      id_certificado: '01a0446a-1d94-7449-9823-86078113c333',
      id_candidatura: '01a0446a-1d94-7449-9823-65a153fedeb2',
      id_consultor: '019f3390-5740-76f7-85ce-f71ea85486a2',
      id_badge: '019f618c-b3cb-7618-9eba-26a9de43cc56',
      data_emissao: '2025-10-27 10:20:00',
      codigo_validacao: '99D28BE20DF7',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85ce-f71ea85486a2/01a0446a-1d94-7449-9823-86078113c333.pdf'
    },
    {
      id_certificado: '01a0446a-1d94-7449-9823-b2921ae53e73',
      id_candidatura: '01a0446a-1d94-7449-9823-907664b118f8',
      id_consultor: '019f3390-5740-76f7-85ce-fc6e13ea3421',
      id_badge: '019f618c-fbf3-732b-8945-2746eb23cca9',
      data_emissao: '2025-12-07 05:50:00',
      codigo_validacao: '5855ADEF56F4',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85ce-fc6e13ea3421/01a0446a-1d94-7449-9823-b2921ae53e73.pdf'
    },
    {
      id_certificado: '01a0446a-1d94-7449-9823-e7a652f37b9d',
      id_candidatura: '01a0446a-1d94-7449-9823-c7a9cca3ad9a',
      id_consultor: '019f3390-5740-76f7-85cf-028c0bb51f1e',
      id_badge: '019f618c-fbf3-732b-8945-69bacdd31186',
      data_emissao: '2026-01-17 09:20:00',
      codigo_validacao: 'F372C820FF47',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85cf-028c0bb51f1e/01a0446a-1d94-7449-9823-e7a652f37b9d.pdf'
    },
    {
      id_certificado: '01a0446a-1d94-7449-9824-23baaa76c1b6',
      id_candidatura: '01a0446a-1d94-7449-9824-031c76e64dbd',
      id_consultor: '019f3390-5740-76f7-85cf-05c87bb87de3',
      id_badge: '019f618c-fbf3-732b-8945-aee839537230',
      data_emissao: '2026-02-22 14:35:00',
      codigo_validacao: '7DCB2D4CB034',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85cf-05c87bb87de3/01a0446a-1d94-7449-9824-23baaa76c1b6.pdf'
    },
    {
      id_certificado: '01a0446a-1d94-7449-9824-4fffc0d9d3c3',
      id_candidatura: '01a0446a-1d94-7449-9824-2e7a4b8c937c',
      id_consultor: '019f3390-5740-76f7-85cf-0915f056f4c1',
      id_badge: '019f618c-fbf3-732b-8945-c2b2d39a1416',
      data_emissao: '2026-03-27 12:20:00',
      codigo_validacao: '3B031E5E59D3',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85cf-0915f056f4c1/01a0446a-1d94-7449-9824-4fffc0d9d3c3.pdf'
    },
    {
      id_certificado: '01a0446a-1d94-7449-9824-82718750bea1',
      id_candidatura: '01a0446a-1d94-7449-9824-6172f41724dc',
      id_consultor: '019f3390-5740-76f7-85cf-0c7c4fb9dd57',
      id_badge: '019f618c-fbf3-732b-8946-06d902341ea3',
      data_emissao: '2026-04-20 19:50:00',
      codigo_validacao: '72364C698D9F',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85cf-0c7c4fb9dd57/01a0446a-1d94-7449-9824-82718750bea1.pdf'
    },
    {
      id_certificado: '01a0446a-1d94-7449-9824-bd290dda53da',
      id_candidatura: '01a0446a-1d94-7449-9824-9cce1976e8ea',
      id_consultor: '019f3390-5740-76f7-85cf-11d5a1b61403',
      id_badge: '019f618c-fbf3-732b-8946-49d80ebdd867',
      data_emissao: '2026-05-24 03:40:00',
      codigo_validacao: '21E4C14BAB01',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85cf-11d5a1b61403/01a0446a-1d94-7449-9824-bd290dda53da.pdf'
    },
    {
      id_certificado: '01a0447b-bd74-727d-b614-ebaacd93a385',
      id_candidatura: '01a0446a-1d94-7449-9824-ca21ae02af81',
      id_consultor: '019f3390-5740-76f7-85cf-1743b1fb20eb',
      id_badge: '019e44e5-025a-753f-9992-1762fc1d1fa5',
      data_emissao: '2026-06-17 10:05:00',
      codigo_validacao: '0B3F3B75A1FC',
      ficheiro_path: 'docs/certificados/019f3390-5740-76f7-85cf-1743b1fb20eb/01a0447b-bd74-727d-b614-ebaacd93a385.pdf'
    },
  ];

  for (const certificado of CertificadosDefault) {
    const [instance, created] = await Certificado.findOrCreate({
      where: { id_certificado: certificado.id_certificado },
      defaults: certificado,
      transaction
    });
    if (!created) {
      await instance.update({
        id_candidatura: certificado.id_candidatura,
        id_consultor: certificado.id_consultor,
        id_badge: certificado.id_badge,
        data_emissao: certificado.data_emissao,
        codigo_validacao: certificado.codigo_validacao,
        ficheiro_path: certificado.ficheiro_path
      }, { transaction });
    }
  }

  console.log("Seed Certificado executado");
}

module.exports = seedCertificado;
