const NivelArea = require('../models/nivel.model');

async function seedNivelArea(transaction) {

  const NivelAreaDefault = [
    { id_nivel_area: 1, id_area_sl: 1, id_traducao_nivel_area: '019e3aaf-02ad-7530-9688-a6a7161d4235', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Low Code
    { id_nivel_area: 2, id_area_sl: 1, id_traducao_nivel_area: '019e3b5e-8e2b-7377-b439-08450ad6c0a2', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Low Code
    { id_nivel_area: 3, id_area_sl: 1, id_traducao_nivel_area: '019e3b5e-8e2b-7377-b439-0eb7e01a8bc7', candidatura_com_prazo: true, tempo_concluir_candidatura: 30 }, //Nível Senior - Low Code
    { id_nivel_area: 4, id_area_sl: 1, id_traducao_nivel_area: '019e3b5e-8e2b-7377-b439-136bd32e0aec', candidatura_com_prazo: true, tempo_concluir_candidatura: 20 }, //Nível Especialista - Low Code
    { id_nivel_area: 5, id_area_sl: 1, id_traducao_nivel_area: '019e3b5e-8e2b-7377-b439-17351da616fc', candidatura_com_prazo: true, tempo_concluir_candidatura: 10 }, //Nível Líder - Low Code
    { id_nivel_area: 6, id_area_sl: 2, id_traducao_nivel_area: '019e3b71-336b-74bc-9b3b-6b7c137f29fc', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - DevSecOps & Automatização de TI
    { id_nivel_area: 7, id_area_sl: 2, id_traducao_nivel_area: '019e3b71-336b-74bc-9b3b-6ef832a0da17', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - DevSecOps & Automatização de TI
    { id_nivel_area: 8, id_area_sl: 2, id_traducao_nivel_area: '019e3b71-336b-74bc-9b3b-70fe97f60b84', candidatura_com_prazo: true, tempo_concluir_candidatura: 30 }, //Nível Senior - DevSecOps & Automatização de TI
    { id_nivel_area: 9, id_area_sl: 2, id_traducao_nivel_area: '019e3b71-336b-74bc-9b3b-753dfd5cf3dd', candidatura_com_prazo: true, tempo_concluir_candidatura: 20 }, //Nível Especialista - DevSecOps & Automatização de TI
    { id_nivel_area: 10, id_area_sl: 2, id_traducao_nivel_area: '019e3b71-336b-74bc-9b3b-794e9c2b2799', candidatura_com_prazo: true, tempo_concluir_candidatura: 10 }, //Nível Líder - DevSecOps & Automatização de TI
  
    { id_nivel_area: 11, id_area_sl: 4, id_traducao_nivel_area: '019f618c-7c24-72aa-9b25-122f8fa7e62f', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Frontend Development
    { id_nivel_area: 12, id_area_sl: 4, id_traducao_nivel_area: '019f618c-7c24-72aa-9b25-1697d2fe5105', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Frontend Development
    { id_nivel_area: 13, id_area_sl: 5, id_traducao_nivel_area: '019f618c-7c24-72aa-9b25-4b42ddda8399', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Backend Development
    { id_nivel_area: 14, id_area_sl: 5, id_traducao_nivel_area: '019f618c-7c24-72aa-9b25-4caf0d8bca60', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Backend Development
    { id_nivel_area: 15, id_area_sl: 6, id_traducao_nivel_area: '019f618c-7c24-72aa-9b25-83bab6ff1ebd', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Machine Learning
    { id_nivel_area: 16, id_area_sl: 6, id_traducao_nivel_area: '019f618c-7c24-72aa-9b25-857b17f5004d', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Machine Learning
    { id_nivel_area: 17, id_area_sl: 7, id_traducao_nivel_area: '019f618c-7c24-72aa-9b25-b89d6a9f99d5', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Data Engineering
    { id_nivel_area: 18, id_area_sl: 7, id_traducao_nivel_area: '019f618c-7c24-72aa-9b25-be5b26af525b', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Data Engineering
    { id_nivel_area: 19, id_area_sl: 8, id_traducao_nivel_area: '019f618c-7c24-72aa-9b25-f3f7d2861547', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Ethical Hacking
    { id_nivel_area: 20, id_area_sl: 8, id_traducao_nivel_area: '019f618c-7c24-72aa-9b25-f495d4886f0b', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Ethical Hacking
    { id_nivel_area: 21, id_area_sl: 9, id_traducao_nivel_area: '019f618c-7c24-72aa-9b26-2a37540fcb60', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Network Security
    { id_nivel_area: 22, id_area_sl: 9, id_traducao_nivel_area: '019f618c-7c24-72aa-9b26-2d115ef03d5c', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Network Security
    { id_nivel_area: 23, id_area_sl: 10, id_traducao_nivel_area: '019f618c-7c24-72aa-9b26-60f125ca0920', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - AWS Solutions
    { id_nivel_area: 24, id_area_sl: 10, id_traducao_nivel_area: '019f618c-7c24-72aa-9b26-64748985d216', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - AWS Solutions
    { id_nivel_area: 25, id_area_sl: 11, id_traducao_nivel_area: '019f618c-7c24-72aa-9b26-9bd4be7995db', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Azure Solutions
    { id_nivel_area: 26, id_area_sl: 11, id_traducao_nivel_area: '019f618c-7c24-72aa-9b26-9cb004d5ef86', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Azure Solutions
    { id_nivel_area: 27, id_area_sl: 12, id_traducao_nivel_area: '019f618c-b3cb-7618-9eb9-3f999468f0cd', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Continuous Integration
    { id_nivel_area: 28, id_area_sl: 12, id_traducao_nivel_area: '019f618c-b3cb-7618-9eb9-421a5c2d81cd', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Continuous Integration
    { id_nivel_area: 29, id_area_sl: 13, id_traducao_nivel_area: '019f618c-b3cb-7618-9eb9-745f75d78aa9', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Infrastructure as Code
    { id_nivel_area: 30, id_area_sl: 13, id_traducao_nivel_area: '019f618c-b3cb-7618-9eb9-7bd399806213', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Infrastructure as Code
    { id_nivel_area: 31, id_area_sl: 14, id_traducao_nivel_area: '019f618c-b3cb-7618-9eb9-acd64aed8b30', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - iOS Development
    { id_nivel_area: 32, id_area_sl: 14, id_traducao_nivel_area: '019f618c-b3cb-7618-9eb9-b2317d64b620', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - iOS Development
    { id_nivel_area: 33, id_area_sl: 15, id_traducao_nivel_area: '019f618c-b3cb-7618-9eb9-e4acb8981ccc', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Android Development
    { id_nivel_area: 34, id_area_sl: 15, id_traducao_nivel_area: '019f618c-b3cb-7618-9eb9-ea8ed37e0a04', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Android Development
    { id_nivel_area: 35, id_area_sl: 16, id_traducao_nivel_area: '019f618c-b3cb-7618-9eba-1dba48998699', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Automated Testing
    { id_nivel_area: 36, id_area_sl: 16, id_traducao_nivel_area: '019f618c-b3cb-7618-9eba-23bb53bf769f', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Automated Testing
    { id_nivel_area: 37, id_area_sl: 17, id_traducao_nivel_area: '019f618c-b3cb-7618-9eba-56d184af1244', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Manual Testing
    { id_nivel_area: 38, id_area_sl: 17, id_traducao_nivel_area: '019f618c-b3cb-7618-9eba-58f50cb4b0d3', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Manual Testing
    { id_nivel_area: 39, id_area_sl: 18, id_traducao_nivel_area: '019f618c-b3cb-7618-9eba-8e321cf851cc', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Mental Health Programs
    { id_nivel_area: 40, id_area_sl: 18, id_traducao_nivel_area: '019f618c-b3cb-7618-9eba-90f93afea82f', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Mental Health Programs
    { id_nivel_area: 41, id_area_sl: 19, id_traducao_nivel_area: '019f618c-fbf3-732b-8945-493c217e4619', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Workplace Ergonomics
    { id_nivel_area: 42, id_area_sl: 19, id_traducao_nivel_area: '019f618c-fbf3-732b-8945-4d46c28edc9f', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Workplace Ergonomics
    { id_nivel_area: 43, id_area_sl: 20, id_traducao_nivel_area: '019f618c-fbf3-732b-8945-825731940d4a', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Leadership Training
    { id_nivel_area: 44, id_area_sl: 20, id_traducao_nivel_area: '019f618c-fbf3-732b-8945-8678f865b33a', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Leadership Training
    { id_nivel_area: 45, id_area_sl: 21, id_traducao_nivel_area: '019f618c-fbf3-732b-8945-bb6e9330b697', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Technical Upskilling
    { id_nivel_area: 46, id_area_sl: 21, id_traducao_nivel_area: '019f618c-fbf3-732b-8945-bea43b9e65a4', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Technical Upskilling
    { id_nivel_area: 47, id_area_sl: 22, id_traducao_nivel_area: '019f618c-fbf3-732b-8945-f320e80af2a8', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Payroll Management
    { id_nivel_area: 48, id_area_sl: 22, id_traducao_nivel_area: '019f618c-fbf3-732b-8945-f7c5eae72411', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Payroll Management
    { id_nivel_area: 49, id_area_sl: 23, id_traducao_nivel_area: '019f618c-fbf3-732b-8946-2b62fdb6f1f9', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Júnior - Benefits Administration
    { id_nivel_area: 50, id_area_sl: 23, id_traducao_nivel_area: '019f618c-fbf3-732b-8946-2d902c23984b', candidatura_com_prazo: false, tempo_concluir_candidatura: null }, //Nível Intermédio - Benefits Administration
    { id_nivel_area: 51, id_area_sl: 3, id_traducao_nivel_area: '019f618c-7c24-72aa-9b25-019f618c1007', candidatura_com_prazo: false, tempo_concluir_candidatura: null } //Nível Júnior - Gestão de Talentos
  ];

  for (const nivelArea of NivelAreaDefault) {
    await NivelArea.findOrCreate({
      where: { id_nivel_area: nivelArea.id_nivel_area },
      defaults: nivelArea,
      transaction
    });
  }

  console.log("Seed Nível Área executado");
}

module.exports = seedNivelArea;