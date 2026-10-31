const Perfil = require('../models/perfil.model');

async function seedPerfil(transaction) {

  const PerfisDefault = [
    { id_perfil: 1, id_traducao_perfil: '019d6744-2302-7429-a2b6-1f2e98bf1bd0' },
    { id_perfil: 2, id_traducao_perfil: '019d6744-2302-7429-a2b6-2169c7f94f4e' },
    { id_perfil: 3, id_traducao_perfil: '019d6744-2302-7429-a2b6-250e5bac6818' },
    { id_perfil: 4, id_traducao_perfil: '019d6744-2302-7429-a2b6-2bdb35b4f2ff' }
  ];

  for (const perfil of PerfisDefault) {
    await Perfil.findOrCreate({
      where: { id_perfil: perfil.id_perfil },
      defaults: perfil,
      transaction
    });
  }

  console.log("Seed perfil executado");
}

module.exports = seedPerfil;