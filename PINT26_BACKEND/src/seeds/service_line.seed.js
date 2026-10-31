const ServiceLine = require('../models/service_line.model');

async function seedServiceLine(transaction) {

  const ServiceLinesDefault = [
    { id_service_line: 1, id_learning_path: 1, id_traducao_service_line: '019da121-ba24-764e-ba39-b2568eb6e5a4', id_sl_lider: '019da51a-bc13-71ae-8f15-bbaf90d72fb4' }, //Núvem Híbrida
    { id_service_line: 2, id_learning_path: 1, id_traducao_service_line: '019da126-cd35-71db-bd9a-42cc5c7a1d8d', id_sl_lider: '019dd395-b6b5-77d8-978f-083007229cc6' }, //Operações de Aplicação
    { id_service_line: 3, id_learning_path: 2, id_traducao_service_line: '019da128-7ff2-767e-88b6-68b4b48396ae', id_sl_lider: '019dd395-b6b5-77d8-978f-0ccfad7f7ee8' }, //Recrutamento e Gestão de Talentos
  
    { id_service_line: 4, id_learning_path: 1, id_traducao_service_line: '019f617a-08da-77a5-b042-c222252238aa', id_sl_lider: '019f628a-8511-7225-93ea-02c8fa367b7a' }, //Software Engineering
    { id_service_line: 5, id_learning_path: 1, id_traducao_service_line: '019f617a-08da-77a5-b042-c455acd01d16', id_sl_lider: '019f628a-8511-7225-93ea-05733ae63110' }, //Data Science & AI
    { id_service_line: 6, id_learning_path: 1, id_traducao_service_line: '019f617a-08da-77a5-b042-cb219ad53322', id_sl_lider: '019f628a-8511-7225-93ea-0b36af3045f3' }, //Cybersecurity
    { id_service_line: 7, id_learning_path: 1, id_traducao_service_line: '019f617a-08da-77a5-b042-ce6c2aed3734', id_sl_lider: '019f628a-8511-7225-93ea-0f0172de6493' }, //Cloud Architecture
    { id_service_line: 8, id_learning_path: 1, id_traducao_service_line: '019f617a-08da-77a5-b042-d1b785f03cbe', id_sl_lider: '019f628a-8511-7225-93ea-1383f317668a' }, //DevOps Engineering
    { id_service_line: 9, id_learning_path: 1, id_traducao_service_line: '019f617a-08da-77a5-b042-d4e436591671', id_sl_lider: '019f628a-8511-7225-93ea-1673c836ae88' }, //Mobile Development
    { id_service_line: 10, id_learning_path: 1, id_traducao_service_line: '019f617a-08da-77a5-b042-d953e1e2644d', id_sl_lider: '019f628a-8511-7225-93ea-19b843568da4' }, //Quality Assurance
    { id_service_line: 11, id_learning_path: 2, id_traducao_service_line: '019f617a-08da-77a5-b042-dd360639722c', id_sl_lider: '019f628a-8511-7225-93ea-1cf509258b4e' }, //Employee Wellbeing
    { id_service_line: 12, id_learning_path: 2, id_traducao_service_line: '019f617a-08da-77a5-b042-e304e6b82961', id_sl_lider: '019f628a-8511-7225-93ea-21cf544a929f' }, //Learning & Development
    { id_service_line: 13, id_learning_path: 2, id_traducao_service_line: '019f617a-08da-77a5-b042-e52926d09185', id_sl_lider: '019f628a-8511-7225-93ea-24115cb01877' }, //Compensation & Benefits
  ];

  for (const serviceLine of ServiceLinesDefault) {
    await ServiceLine.findOrCreate({
      where: { id_service_line: serviceLine.id_service_line },
      defaults: serviceLine,
      transaction
    });
  }

  console.log("Seed service line executado");
}

module.exports = seedServiceLine;