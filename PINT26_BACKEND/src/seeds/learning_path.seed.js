const LearningPath = require('../models/learning_path.model');

async function seedLearningPath(transaction) {

  const LearningPathsDefault = [
    { id_learning_path: 1, id_traducao_learning_path: '019d728a-02fd-77e6-8e9f-f75c314d93e6', id_traducao_descricao_lp: '019d729c-b28f-73ff-a88a-2dc40c4d9db3', cor: '--color1-LP', visibilidade: true, suspenso: false }, //Jornada Técnica
    { id_learning_path: 2, id_traducao_learning_path: '019d728a-02fd-77e6-8e9f-fb40c9e1d0bd', id_traducao_descricao_lp: '019d729c-b290-760d-bb5c-910cdc2e9ca5', cor: '--color2-LP', visibilidade: true, suspenso: false } //Jornada de Recursos Humanos
  ];

  for (const learningPath of LearningPathsDefault) {
    await LearningPath.findOrCreate({
      where: { id_learning_path: learningPath.id_learning_path },
      defaults: learningPath,
      transaction
    });
  }

  console.log("Seed Learning_Path executado");
}

module.exports = seedLearningPath;