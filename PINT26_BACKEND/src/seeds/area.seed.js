const Area = require('../models/area.model');

async function seedArea(transaction) {

  const AreasDefault = [
    { id_area: 1, id_service_line: 1, id_traducao_area: '019da1a6-399b-761a-be4f-fd5ed10185c8' }, //Codificação Baixa
    { id_area: 2, id_service_line: 2, id_traducao_area: '019da1a8-f71a-7648-89d3-79ec5cc26266' }, //DevSecOps & Automatização de TI
    { id_area: 3, id_service_line: 3, id_traducao_area: '019da1ae-2adb-758c-ad02-2bdd81db06ba' }, //Gestão de talentos
  
    { id_area: 4, id_service_line: 4, id_traducao_area: '019f617a-08da-77a5-b042-e8622be1554a' }, //Frontend Development
    { id_area: 5, id_service_line: 4, id_traducao_area: '019f617a-08da-77a5-b042-ecbf6adfd684' }, //Backend Development
    { id_area: 6, id_service_line: 5, id_traducao_area: '019f617a-08da-77a5-b042-f028d1d20e04' }, //Machine Learning
    { id_area: 7, id_service_line: 5, id_traducao_area: '019f617a-08da-77a5-b042-f51cdfafbf02' }, //Data Engineering
    { id_area: 8, id_service_line: 6, id_traducao_area: '019f617a-08da-77a5-b042-f8b23e16a32d' }, //Ethical Hacking
    { id_area: 9, id_service_line: 6, id_traducao_area: '019f617a-08da-77a5-b042-feea7adf217f' }, //Network Security
    { id_area: 10, id_service_line: 7, id_traducao_area: '019f617a-08da-77a5-b043-0050061d97f2' }, //AWS Solutions
    { id_area: 11, id_service_line: 7, id_traducao_area: '019f617a-08da-77a5-b043-06be9a6a6be1' }, //Azure Solutions
    { id_area: 12, id_service_line: 8, id_traducao_area: '019f617a-08da-77a5-b043-09e26b363701' }, //Continuous Integration
    { id_area: 13, id_service_line: 8, id_traducao_area: '019f617a-08da-77a5-b043-0d1380df5911' }, //Infrastructure as Code
    { id_area: 14, id_service_line: 9, id_traducao_area: '019f617a-08da-77a5-b043-13a8abdb5761' }, //iOS Development
    { id_area: 15, id_service_line: 9, id_traducao_area: '019f617a-08da-77a5-b043-144feb8d77f9' }, //Android Development
    { id_area: 16, id_service_line: 10, id_traducao_area: '019f617a-08da-77a5-b043-1887e8039243' }, //Automated Testing
    { id_area: 17, id_service_line: 10, id_traducao_area: '019f617a-08da-77a5-b043-1dd03376b691' }, //Manual Testing
    { id_area: 18, id_service_line: 11, id_traducao_area: '019f617a-08da-77a5-b043-229a42e394df' }, //Mental Health Programs
    { id_area: 19, id_service_line: 11, id_traducao_area: '019f617a-08da-77a5-b043-25ebe05fb4cf' }, //Workplace Ergonomics
    { id_area: 20, id_service_line: 12, id_traducao_area: '019f617a-08da-77a5-b043-28689dab60ec' }, //Leadership Training
    { id_area: 21, id_service_line: 12, id_traducao_area: '019f617a-08da-77a5-b043-2f4662eaf152' }, //Technical Upskilling
    { id_area: 22, id_service_line: 13, id_traducao_area: '019f617a-08da-77a5-b043-32506c569832' }, //Payroll Management
    { id_area: 23, id_service_line: 13, id_traducao_area: '019f617a-08da-77a5-b043-37f9c1519e87' }, //Benefits Administration
  ];

  for (const area of AreasDefault) {
    await Area.findOrCreate({
      where: { id_area: area.id_area },
      defaults: area,
      transaction
    });
  }

  console.log("Seed Area executado");
}

module.exports = seedArea;