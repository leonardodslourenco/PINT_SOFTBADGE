const RequisitoBadge = require('../models/requisito_badge.model');

async function seedRequisitoBadge(transaction) {

  const RequisitoBadgeDefault = [
    { id_requisito: 1, id_badge: '019e44d5-7b7d-70ac-a2ec-f23084d1d21c', id_traducao_requisito: '019e3ba2-3f91-72d2-ba21-6663ac5fd7ff', id_traducao_subtitulo_req: '019e3ba9-20df-728a-a0d9-874f7c204c9a', id_traducao_descritivo_req: '019e3baa-32d7-7218-b2c2-68f4b4d4816e', obrigatoriedade_req: true, requisitoAtivo: true }, // Requisito 1 para o Badge Low Code Júnior
    { id_requisito: 2, id_badge: '019e44d5-7b7d-70ac-a2ec-f23084d1d21c', id_traducao_requisito: '019e3c99-866b-7052-92ac-acfa11e002d3', id_traducao_subtitulo_req: '019e3c8b-3d14-727f-9cb4-619b0a5b0db5', id_traducao_descritivo_req: '019e3c8c-669c-7350-b3fa-9d374de34486', obrigatoriedade_req: true, requisitoAtivo: true }, // Requisito 2 para o Badge Low Code Júnior
    { id_requisito: 3, id_badge: '019e44d5-b96c-7097-acda-6111fa1532f4', id_traducao_requisito: '019eb744-9c09-71aa-9b81-e4ea115041e6', id_traducao_subtitulo_req: '019eb744-9c10-764d-b110-7dbd6050be2e', id_traducao_descritivo_req: '019eb744-9c10-764d-b110-83b07dcf7585', obrigatoriedade_req: true, requisitoAtivo: true }, // Requisito 1 para o Badge DevSecOps Intermédio
    { id_requisito: 4, id_badge: '019e44d5-b96c-7097-acda-6111fa1532f4', id_traducao_requisito: '019eb744-9c10-764d-b110-869a72232b6a', id_traducao_subtitulo_req: '019eb744-9c11-745f-8f24-7694cd7263a0', id_traducao_descritivo_req: '019eb744-9c11-745f-8f24-7a0a7d3d6f94', obrigatoriedade_req: true, requisitoAtivo: true }, // Requisito 2 para o Badge DevSecOps Intermédio
  ];

  for (const reqBadge of RequisitoBadgeDefault) {
    await RequisitoBadge.findOrCreate({
      where: { id_requisito: reqBadge.id_requisito },
      defaults: reqBadge,
      transaction
    });
  }

  // Novos requisitos para todos os badges restantes
  const { REQUISITOS_NOVOS } = require('./requisitos_auto_data');
  for (const reqBadge of REQUISITOS_NOVOS) {
    await RequisitoBadge.findOrCreate({
      where: { id_requisito: reqBadge.id_requisito },
      defaults: reqBadge,
      transaction
    });
  }

  console.log("Seed Requisito Badge executado");
}

module.exports = seedRequisitoBadge;
