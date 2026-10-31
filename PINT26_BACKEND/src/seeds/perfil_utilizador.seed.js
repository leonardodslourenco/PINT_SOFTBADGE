const PerfilUtilizador = require('../models/perfil_utilizador.model');

async function seedPerfilUtilizador(transaction) {

  const dados = [

    {
      id_utilizador: '019da51a-bc13-71ae-8f15-bbaf90d72fb4', //Sara Correia
      id_perfil: 2,
      relacionamentoAtivo: true
    },
    {
      id_utilizador: '019da51a-bc13-71ae-8f15-bbaf90d72fb4', //Sara Correia
      id_perfil: 4,
      relacionamentoAtivo: true
    },

    {
      id_utilizador: '019dd395-b6b5-77d8-978f-083007229cc6', //Marta Pereira
      id_perfil: 2,
      relacionamentoAtivo: true
    },
    {
      id_utilizador: '019dd395-b6b5-77d8-978f-083007229cc6', //Marta Pereira
      id_perfil: 4,
      relacionamentoAtivo: true
    },

    {
      id_utilizador: '019dd395-b6b5-77d8-978f-0ccfad7f7ee8', //José Teixeira
      id_perfil: 2,
      relacionamentoAtivo: true
    },
    {
      id_utilizador: '019dd395-b6b5-77d8-978f-0ccfad7f7ee8', //José Teixeira
      id_perfil: 4,
      relacionamentoAtivo: true
    },

    {
      id_utilizador: '019da529-bd4f-760a-8919-3f74d307fa8c', //Paulo Batista
      id_perfil: 3,
      relacionamentoAtivo: true
    },
    {
      id_utilizador: '019da529-bd4f-760a-8919-3f74d307fa8c', //Paulo Batista
      id_perfil: 4,
      relacionamentoAtivo: true
    },
    {
      id_utilizador: '019da529-f1f9-764e-a860-6d4ed4967b2e', //Marta Queiros
      id_perfil: 4,
      relacionamentoAtivo: true
    },
    {
      id_utilizador: '019da510-d2b2-7401-aca0-93a051e8a422', //Robson Ribeiro
      id_perfil: 3,
      relacionamentoAtivo: true
    },
    {
      id_utilizador: '019da510-d2b2-7401-aca0-93a051e8a422', //Robson Ribeiro
      id_perfil: 1,
      relacionamentoAtivo: false
    },
    {
      id_utilizador: '019da510-d2b2-7401-aca0-93a051e8a422', //Robson Ribeiro
      id_perfil: 4,
      relacionamentoAtivo: true
    },
    { id_utilizador: '019f3390-573f-719f-a940-32fa069ad69c', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85ce-d66212d56977', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85ce-dadf6420b9ee', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85ce-dfeb11352d06', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85ce-e3d66cfe86ea', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85ce-e44410ca8383', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85ce-ea21cee22423', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85ce-ed0fefcfc69e', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85ce-f148f699a9cf', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85ce-f71ea85486a2', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85ce-fa3c5001c570', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85ce-fc6e13ea3421', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85cf-028c0bb51f1e', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85cf-05c87bb87de3', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85cf-0915f056f4c1', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85cf-0c7c4fb9dd57', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85cf-11d5a1b61403', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85cf-1743b1fb20eb', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85cf-1809d64e893f', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f3390-5740-76f7-85cf-1cb921778500', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-02c8fa367b7a', id_perfil: 2, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-02c8fa367b7a', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-05733ae63110', id_perfil: 2, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-05733ae63110', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-0b36af3045f3', id_perfil: 2, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-0b36af3045f3', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-0f0172de6493', id_perfil: 2, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-0f0172de6493', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-1383f317668a', id_perfil: 2, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-1383f317668a', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-1673c836ae88', id_perfil: 2, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-1673c836ae88', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-19b843568da4', id_perfil: 2, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-19b843568da4', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-1cf509258b4e', id_perfil: 2, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-1cf509258b4e', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-21cf544a929f', id_perfil: 2, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-21cf544a929f', id_perfil: 4, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-24115cb01877', id_perfil: 2, relacionamentoAtivo: true },
    { id_utilizador: '019f628a-8511-7225-93ea-24115cb01877', id_perfil: 4, relacionamentoAtivo: true }

  ];

  for (const item of dados) {

    await PerfilUtilizador.findOrCreate({
      where: {
        id_utilizador: item.id_utilizador,
        id_perfil: item.id_perfil
      },
      defaults: item,
      transaction
    });

  }

  console.log("Seed perfil_utilizador executado");
}

module.exports = seedPerfilUtilizador;