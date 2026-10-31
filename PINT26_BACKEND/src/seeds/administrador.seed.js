const Utilizador = require('../models/utilizador.model');
const PerfilUtilizador = require('../models/perfil_utilizador.model');

async function seedAdministrador() {
  const adminDefault = {
    id_utilizador: '019d6cd2-baad-721b-8e8d-9761f013ceb6',
    nome: "John Doe", //Admin
    apelido: "Smith",
    email: "john.doe@softbadge.pt",
    aceitou_rgpd: true,
    avatar: "default_avatar.png",
    idioma_preferencial: "pt",
    thema: 2,
    email_verificado: true,
    cod_verifica_email: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
    timestamp_cod_verifica: "2023-10-01 12:00:00",
    password_hash: "$argon2id$v=19$m=65536,t=3,p=4$anPkx6eFOmq3UDC3grpsHA$4KoQGf+Y7gs7x5AM2pFhnELL8AH/ntoPmuRbUVra47E",
    password_default: false,
    password_temp: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
    data_registo: "2025-11-05 12:00:00",
    first_login: "2025-11-05 12:00:00",
    last_login: "2025-11-05 12:00:00",
    id_area: null,
    id_sl: 1
  };

  try {
    const ServiceLine = require('../models/service_line.model');
    const slExists = await ServiceLine.findByPk(1);

    const dataToUse = {
      ...adminDefault,
      id_sl: slExists ? 1 : null
    };

    const [adminUser, created] = await Utilizador.findOrCreate({
      where: { email: adminDefault.email },
      defaults: dataToUse
    });
    if (!created && slExists) {
      await adminUser.update({ id_sl: 1 });
    }

    const perfisAdmin = [1, 2, 3, 4];
    for (const id_perfil of perfisAdmin) {
      await PerfilUtilizador.findOrCreate({
        where: { id_utilizador: adminDefault.id_utilizador, id_perfil },
        defaults: {
          id_utilizador: adminDefault.id_utilizador,
          id_perfil,
          relacionamentoAtivo: true
        }
      });
    }

    console.log("Seed Administrador (John Doe) e respetivos Perfis executados com sucesso.");
  } catch (error) {
    console.error("Erro ao executar Seed Administrador:", error.message);
  }
}

module.exports = seedAdministrador;
