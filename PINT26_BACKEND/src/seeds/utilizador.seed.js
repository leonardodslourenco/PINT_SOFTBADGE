const Utilizador = require('../models/utilizador.model');

// Seed com id_area = null — área ainda não existe neste ponto (dependência circular)
async function seedUtilizador(transaction) {

  const utilizadorDefault = [
    {
      id_utilizador: '019da51a-bc13-71ae-8f15-bbaf90d72fb4',
      nome: "Sara", //Service Line Lider
      apelido: "Correia",
      email: "sara.correia@softbadge.pt",
      aceitou_rgpd: true,
      avatar: "sara_correia-sll.png",
      idioma_preferencial: "es",
      thema: 2,
      email_verificado: true,
      cod_verifica_email: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      timestamp_cod_verifica: "2026-02-01 09:45:00",
      password_hash: "$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c",
      password_default: false,
      password_temp: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      data_registo: "2026-02-01 09:00:00",
      first_login: "2026-02-01 09:46:00",
      last_login: "2026-02-01 09:46:00",
      id_area: null  // será atualizado na fase 2
    },
    {
      id_utilizador: '019dd395-b6b5-77d8-978f-083007229cc6',
      nome: "Marta", //Service Line Lider
      apelido: "Pereira",
      email: "marta.pereira@softbadge.pt",
      aceitou_rgpd: true,
      avatar: "marta_pereira-sll.png",
      idioma_preferencial: "en",
      thema: 2,
      email_verificado: true,
      cod_verifica_email: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      timestamp_cod_verifica: "2026-02-01 09:45:00",
      password_hash: "$argon2id$v=19$m=65536,t=3,p=4$h5v/xdKzU5cia8cIaMjq9A$4OsMaW4X12iZ+om5N5XDyO4goLAHTxgK/AiNjQVNupo",
      password_default: false,
      password_temp: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      data_registo: "2026-02-01 09:00:00",
      first_login: "2026-02-01 09:46:00",
      last_login: "2026-02-01 09:46:00",
      id_area: null  // será atualizado na fase 2
    },
    {
      id_utilizador: '019dd395-b6b5-77d8-978f-0ccfad7f7ee8',
      nome: "José", //Service Line Lider
      apelido: "Teixeira",
      email: "jose.teixeira@softbadge.pt",
      aceitou_rgpd: true,
      avatar: "jose_teixeira-sll.png",
      idioma_preferencial: "pt",
      thema: 2,
      email_verificado: true,
      cod_verifica_email: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      timestamp_cod_verifica: "2026-02-01 09:45:00",
      password_hash: "$argon2id$v=19$m=65536,t=3,p=4$ZwocEsXQl0URK4kRVERE9A$FyMeqxCNLxSiMdtpmZOiVqpza8y2t1X8Z1oAeOdFy/8",
      password_default: false,
      password_temp: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      data_registo: "2026-02-01 09:00:00",
      first_login: "2026-02-01 09:46:00",
      last_login: "2026-02-01 09:46:00",
      id_area: null  // será atualizado na fase 2
    },
    {
      id_utilizador: '019da529-bd4f-760a-8919-3f74d307fa8c',
      nome: "Paulo", //talent manager
      apelido: "Batista",
      email: "paulo.batista@softbadge.pt",
      aceitou_rgpd: true,
      avatar: "paulo_batista-tm.png",
      idioma_preferencial: "en",
      thema: 2,
      email_verificado: true,
      cod_verifica_email: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      timestamp_cod_verifica: "2026-02-01 09:45:00",
      password_hash: "$argon2id$v=19$m=65536,t=3,p=4$6g5dlUbKIxshCWVxAdnWTQ$OXgyMCOBzTg70kS6jbCmUjMDHorT7CtTkwPeZFEiekw",
      password_default: false,
      password_temp: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      data_registo: "2026-02-01 09:00:00",
      first_login: "2026-02-01 09:46:00",
      last_login: "2026-02-01 09:46:00",
      id_area: null  // será atualizado na fase 2
    },
    {
      id_utilizador: '019da529-f1f9-764e-a860-6d4ed4967b2e',
      nome: "Marta", //consultora
      apelido: "Queiroz",
      email: "marta.queiroz@softbadge.pt",
      aceitou_rgpd: true,
      avatar: "marta_queiroz-con.png",
      idioma_preferencial: "en",
      thema: 2,
      email_verificado: true,
      cod_verifica_email: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      timestamp_cod_verifica: "2026-02-01 09:45:00",
      password_hash: "$argon2id$v=19$m=65536,t=3,p=4$OheoxYIun8HuIP1Gn8ZsGw$dMUvzNhLiPVuErYK9czTMp1bHEsI0gKw42BKIvWYIe0",
      password_default: false,
      password_temp: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      data_registo: "2026-02-01 09:00:00",
      first_login: "2026-02-01 09:46:00",
      last_login: "2026-02-01 09:46:00",
      id_area: null  // será atualizado na fase 2
    },
    {
      id_utilizador: '019da510-d2b2-7401-aca0-93a051e8a422',
      nome: "Matilde", //Talent Management
      apelido: "Aguiar",
      email: "matilde.aguiar@softbadge.pt",
      aceitou_rgpd: true,
      avatar: "default_avatar.png",
      idioma_preferencial: "pt",
      thema: 2,
      email_verificado: true,
      cod_verifica_email: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      timestamp_cod_verifica: "2026-02-01 09:45:00",
      password_hash: "$argon2id$v=19$m=65536,t=3,p=4$Zc5VbUt1fY8j3h2UCsuaBw$sGBR3jFxSjhmxoAWBd2/N+nBRPrRWgYNSycT0o3waaY",
      password_default: false,
      password_temp: "$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg",
      data_registo: "2026-02-01 09:00:00",
      first_login: "2026-02-01 09:46:00",
      last_login: "2026-02-01 09:46:00",
      id_area: null  // será atualizado na fase 2
    },
    {
      id_utilizador: '019f3390-573f-719f-a940-32fa069ad69c',
      nome: 'Tiago',
      apelido: 'Silva',
      email: 'tiago.silva@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "tiago_silva-con.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-25 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85ce-d66212d56977',
      nome: 'Carlos',
      apelido: 'Garcia',
      email: 'carlos.garcia@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "carlos_garcia-con.png",
      idioma_preferencial: 'es',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-27 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85ce-dadf6420b9ee',
      nome: 'Joao',
      apelido: 'Santos',
      email: 'joao.santos@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "joao_santos-con.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-06 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85ce-dfeb11352d06',
      nome: 'Pierre',
      apelido: 'Dubois',
      email: 'pierre.dubois@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "pierre_dubois-con.png",
      idioma_preferencial: 'en',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-11 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85ce-e3d66cfe86ea',
      nome: 'Michael',
      apelido: 'Smith',
      email: 'michael.smith@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "michael_smith-con.png",
      idioma_preferencial: 'en',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-16 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85ce-e44410ca8383',
      nome: 'Andriy',
      apelido: 'Shevchenko',
      email: 'andriy.shevchenko@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "andriy_shevchenko-con.png",
      idioma_preferencial: 'en',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-24 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85ce-ea21cee22423',
      nome: 'Pedro',
      apelido: 'Costa',
      email: 'pedro.costa@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "pedro_costa-con.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-24 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85ce-ed0fefcfc69e',
      nome: 'Alejandro',
      apelido: 'Martinez',
      email: 'alejandro.martinez@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "alejandro_martinez-con.png",
      idioma_preferencial: 'es',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-28 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85ce-f148f699a9cf',
      nome: 'Lucas',
      apelido: 'Oliveira',
      email: 'lucas.oliveira@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "lucas_oliveira-con.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-05 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85ce-f71ea85486a2',
      nome: 'David',
      apelido: 'Johnson',
      email: 'david.johnson@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "david_johnson-con.png",
      idioma_preferencial: 'en',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-27 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85ce-fa3c5001c570',
      nome: 'Ana',
      apelido: 'Rodrigues',
      email: 'ana.rodrigues@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "ana_rodrigues-con.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-17 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85ce-fc6e13ea3421',
      nome: 'Maria',
      apelido: 'Fernandez',
      email: 'maria.fernandez@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "maria_fernandez-con.png",
      idioma_preferencial: 'es',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-07 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85cf-028c0bb51f1e',
      nome: 'Juliana',
      apelido: 'Lima',
      email: 'juliana.lima@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "juliana_lima-con.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-08 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85cf-05c87bb87de3',
      nome: 'Sophie',
      apelido: 'Martin',
      email: 'sophie.martin@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "sophie_martin-con.png",
      idioma_preferencial: 'en',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-14 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85cf-0915f056f4c1',
      nome: 'Emily',
      apelido: 'Davis',
      email: 'emily.davis@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "emily_davis-con.png",
      idioma_preferencial: 'en',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-06-23 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85cf-0c7c4fb9dd57',
      nome: 'Oksana',
      apelido: 'Ivanova',
      email: 'oksana.ivanova@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "oksana_ivanova-con.png",
      idioma_preferencial: 'en',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-04 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85cf-11d5a1b61403',
      nome: 'Catarina',
      apelido: 'Mendes',
      email: 'catarina.mendes@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "catarina_mendes-con.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-05 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85cf-1743b1fb20eb',
      nome: 'Lucia',
      apelido: 'Lopez',
      email: 'lucia.lopez@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "lucia_lopez-con.png",
      idioma_preferencial: 'es',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-04 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85cf-1809d64e893f',
      nome: 'Camila',
      apelido: 'Pereira',
      email: 'camila.pereira@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "camila_pereira-con.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-06 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f3390-5740-76f7-85cf-1cb921778500',
      nome: 'Sarah',
      apelido: 'Brown',
      email: 'sarah.brown@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "sarah_brown-con.png",
      idioma_preferencial: 'en',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-04 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    }
    ,
    {
      id_utilizador: '019f628a-8511-7225-93ea-02c8fa367b7a',
      nome: 'Tiago',
      apelido: 'Costa',
      email: 'tiago.costa@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "default_avatar.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-14 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f628a-8511-7225-93ea-05733ae63110',
      nome: 'Carlos',
      apelido: 'Ruiz',
      email: 'carlos.ruiz@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "default_avatar.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-14 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f628a-8511-7225-93ea-0b36af3045f3',
      nome: 'Oliver',
      apelido: 'Smith',
      email: 'oliver.smith@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "default_avatar.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-14 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f628a-8511-7225-93ea-0f0172de6493',
      nome: 'Nuno',
      apelido: 'Silva',
      email: 'nuno.silva@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "default_avatar.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-14 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f628a-8511-7225-93ea-1383f317668a',
      nome: 'Pablo',
      apelido: 'Lopez',
      email: 'pablo.lopez@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "default_avatar.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-14 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f628a-8511-7225-93ea-1673c836ae88',
      nome: 'Jack',
      apelido: 'Brown',
      email: 'jack.brown@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "default_avatar.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-14 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f628a-8511-7225-93ea-19b843568da4',
      nome: 'Mariana',
      apelido: 'Santos',
      email: 'mariana.santos@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "default_avatar.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-14 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f628a-8511-7225-93ea-1cf509258b4e',
      nome: 'Sofia',
      apelido: 'Martinez',
      email: 'sofia.martinez@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "default_avatar.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-14 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f628a-8511-7225-93ea-21cf544a929f',
      nome: 'Emily',
      apelido: 'Taylor',
      email: 'emily.taylor@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "default_avatar.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-14 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    },
    {
      id_utilizador: '019f628a-8511-7225-93ea-24115cb01877',
      nome: 'Diogo',
      apelido: 'Rodrigues',
      email: 'diogo.rodrigues@softbadge.pt',
      aceitou_rgpd: true,
      avatar: "default_avatar.png",
      idioma_preferencial: 'pt',
      thema: 2,
      email_verificado: true,
      cod_verifica_email: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      timestamp_cod_verifica: '2026-02-01 09:45:00',
      password_hash: '$argon2id$v=19$m=65536,t=3,p=4$MxdFoOEVaz4hwCCKHDUnew$hAbMyhvVmiIxxEebt4UoPbPAHVzGYgI23WQ5dKN4//c',
      password_default: false,
      password_temp: '$argon2id$v=19$m=65536,t=3,p=4$a0gaAbVOOGulLyawJeevFA$Xz4X1a6TpxGW2GbdCIYPHhAUlMpCjQwsDtBFpL4B0qg',
      data_registo: '2026-07-14 10:00:00',
      first_login: '2026-02-01 09:46:00',
      last_login: '2026-02-01 09:46:00',
      id_area: null
    }
  ];

  for (const utilizador of utilizadorDefault) {
    await Utilizador.findOrCreate({
      where: { email: utilizador.email },
      defaults: utilizador,
      transaction
    });
  }

  console.log("Seed utilizador executado (fase 1 - sem id_area)");
}

// Fase 2: atualizar id_area depois das áreas serem criadas  
// Mapeamento: id_utilizador → id_area definitivo
async function updateUtilizadorArea(transaction) {
  const areaMap = [
    { id_utilizador: '019d6cd2-baad-721b-8e8d-9761f013ceb6', id_area: 4 }, // John Doe (Admin)
    { id_utilizador: '019da51a-bc13-71ae-8f15-bbaf90d72fb4', id_area: 1 }, // Sara Correia (SLL SL 1)
    { id_utilizador: '019dd395-b6b5-77d8-978f-083007229cc6', id_area: 2 }, // Marta Pereira (SLL SL 2)
    { id_utilizador: '019dd395-b6b5-77d8-978f-0ccfad7f7ee8', id_area: 3 }, // José Teixeira (SLL SL 3)
    { id_utilizador: '019da529-bd4f-760a-8919-3f74d307fa8c', id_area: 4 }, // Paulo Batista (TM)
    { id_utilizador: '019da529-f1f9-764e-a860-6d4ed4967b2e', id_area: 1 }, // Marta Queiroz (Consultora)
    { id_utilizador: '019da510-d2b2-7401-aca0-93a051e8a422', id_area: 6 }, // Robson Ribeiro (TM)
    { id_utilizador: '019f3390-573f-719f-a940-32fa069ad69c', id_area: 7 }, // Tiago Silva
    { id_utilizador: '019f3390-5740-76f7-85ce-d66212d56977', id_area: 8 }, // Carlos Garcia
    { id_utilizador: '019f3390-5740-76f7-85ce-dadf6420b9ee', id_area: 9 }, // Joao Santos
    { id_utilizador: '019f3390-5740-76f7-85ce-dfeb11352d06', id_area: 10 }, // Pierre Dubois
    { id_utilizador: '019f3390-5740-76f7-85ce-e3d66cfe86ea', id_area: 11 }, // Michael Smith
    { id_utilizador: '019f3390-5740-76f7-85ce-e44410ca8383', id_area: 12 }, // Andriy Shevchenko
    { id_utilizador: '019f3390-5740-76f7-85ce-ea21cee22423', id_area: 13 }, // Pedro Costa
    { id_utilizador: '019f3390-5740-76f7-85ce-ed0fefcfc69e', id_area: 14 }, // Alejandro Martinez
    { id_utilizador: '019f3390-5740-76f7-85ce-f148f699a9cf', id_area: 15 }, // Lucas Oliveira
    { id_utilizador: '019f3390-5740-76f7-85ce-f71ea85486a2', id_area: 16 }, // David Johnson
    { id_utilizador: '019f3390-5740-76f7-85ce-fa3c5001c570', id_area: 17 }, // Ana Rodrigues
    { id_utilizador: '019f3390-5740-76f7-85ce-fc6e13ea3421', id_area: 18 }, // Maria Fernandez
    { id_utilizador: '019f3390-5740-76f7-85cf-028c0bb51f1e', id_area: 19 }, // Juliana Lima
    { id_utilizador: '019f3390-5740-76f7-85cf-05c87bb87de3', id_area: 20 }, // Sophie Martin
    { id_utilizador: '019f3390-5740-76f7-85cf-0915f056f4c1', id_area: 21 }, // Emily Davis
    { id_utilizador: '019f3390-5740-76f7-85cf-0c7c4fb9dd57', id_area: 22 }, // Oksana Ivanova
    { id_utilizador: '019f3390-5740-76f7-85cf-11d5a1b61403', id_area: 23 }, // Catarina Mendes
    { id_utilizador: '019f3390-5740-76f7-85cf-1743b1fb20eb', id_area: 1 }, // Lucia Lopez
    { id_utilizador: '019f3390-5740-76f7-85cf-1809d64e893f', id_area: 2 }, // Camila Pereira
    { id_utilizador: '019f3390-5740-76f7-85cf-1cb921778500', id_area: 3 }, // Sarah Brown
    { id_utilizador: '019f628a-8511-7225-93ea-02c8fa367b7a', id_area: 4 }, // Tiago Costa (SLL SL 4)
    { id_utilizador: '019f628a-8511-7225-93ea-05733ae63110', id_area: 5 }, // Carlos Ruiz (SLL SL 5)
    { id_utilizador: '019f628a-8511-7225-93ea-0b36af3045f3', id_area: 6 }, // Oliver Smith (SLL SL 6)
    { id_utilizador: '019f628a-8511-7225-93ea-0f0172de6493', id_area: 7 }, // Nuno Silva (SLL SL 7)
    { id_utilizador: '019f628a-8511-7225-93ea-1383f317668a', id_area: 8 }, // Pablo Lopez (SLL SL 8)
    { id_utilizador: '019f628a-8511-7225-93ea-1673c836ae88', id_area: 9 }, // Jack Brown (SLL SL 9)
    { id_utilizador: '019f628a-8511-7225-93ea-19b843568da4', id_area: 10 }, // David Pires (SLL SL 10)
    { id_utilizador: '019f628a-8511-7225-93ea-1cf509258b4e', id_area: 11 }, // Vera Fonseca (SLL SL 11)
    { id_utilizador: '019f628a-8511-7225-93ea-21cf544a929f', id_area: 12 }, // André Rocha (SLL SL 12)
    { id_utilizador: '019f628a-8511-7225-93ea-24115cb01877', id_area: 13 }  // Teresa Couto (SLL SL 13)
  ];

  for (const item of areaMap) {
    await Utilizador.update(
      { id_area: item.id_area },
      { where: { id_utilizador: item.id_utilizador }, transaction }
    );
  }

  console.log("Seed utilizador executado (fase 2 - id_area atualizado)");
}

// Fase 2: atualizar id_sl depois das Service Lines serem criadas
// Mapeamento: id_utilizador → id_sl definitivo (1 a 13 alternado)
async function updateUtilizadorServiceLine(transaction) {
  const serviceLineMap = [
    { id_utilizador: '019d6cd2-baad-721b-8e8d-9761f013ceb6', id_sl: 1 },  // John Doe (Admin)
    { id_utilizador: '019da51a-bc13-71ae-8f15-bbaf90d72fb4', id_sl: 1 },  // Sara Correia (SLL SL 1 - Nuvem Híbrida)
    { id_utilizador: '019dd395-b6b5-77d8-978f-083007229cc6', id_sl: 2 },  // Marta Pereira (SLL SL 2 - Operações de Aplicação)
    { id_utilizador: '019dd395-b6b5-77d8-978f-0ccfad7f7ee8', id_sl: 3 },  // José Teixeira (SLL SL 3 - Recrutamento e Gestão de Talentos)
    { id_utilizador: '019da529-bd4f-760a-8919-3f74d307fa8c', id_sl: 4 },  // Paulo Batista (TM)
    { id_utilizador: '019da529-f1f9-764e-a860-6d4ed4967b2e', id_sl: 5 },  // Marta Queiroz (Consultora)
    { id_utilizador: '019da510-d2b2-7401-aca0-93a051e8a422', id_sl: 6 },  // Robson Ribeiro (TM)
    { id_utilizador: '019f3390-573f-719f-a940-32fa069ad69c', id_sl: 7 },  // Tiago Silva
    { id_utilizador: '019f3390-5740-76f7-85ce-d66212d56977', id_sl: 8 },  // Carlos Garcia
    { id_utilizador: '019f3390-5740-76f7-85ce-dadf6420b9ee', id_sl: 9 },  // Joao Santos
    { id_utilizador: '019f3390-5740-76f7-85ce-dfeb11352d06', id_sl: 10 }, // Pierre Dubois
    { id_utilizador: '019f3390-5740-76f7-85ce-e3d66cfe86ea', id_sl: 11 }, // Michael Smith
    { id_utilizador: '019f3390-5740-76f7-85ce-e44410ca8383', id_sl: 12 }, // Andriy Shevchenko
    { id_utilizador: '019f3390-5740-76f7-85ce-ea21cee22423', id_sl: 13 }, // Pedro Costa
    { id_utilizador: '019f3390-5740-76f7-85ce-ed0fefcfc69e', id_sl: 1 },  // Alejandro Martinez
    { id_utilizador: '019f3390-5740-76f7-85ce-f148f699a9cf', id_sl: 2 },  // Lucas Oliveira
    { id_utilizador: '019f3390-5740-76f7-85ce-f71ea85486a2', id_sl: 3 },  // David Johnson
    { id_utilizador: '019f3390-5740-76f7-85ce-fa3c5001c570', id_sl: 4 },  // Ana Rodrigues
    { id_utilizador: '019f3390-5740-76f7-85ce-fc6e13ea3421', id_sl: 5 },  // Maria Fernandez
    { id_utilizador: '019f3390-5740-76f7-85cf-028c0bb51f1e', id_sl: 6 },  // Juliana Lima
    { id_utilizador: '019f3390-5740-76f7-85cf-05c87bb87de3', id_sl: 7 },  // Sophie Martin
    { id_utilizador: '019f3390-5740-76f7-85cf-0915f056f4c1', id_sl: 8 },  // Emily Davis
    { id_utilizador: '019f3390-5740-76f7-85cf-0c7c4fb9dd57', id_sl: 9 },  // Oksana Ivanova
    { id_utilizador: '019f3390-5740-76f7-85cf-11d5a1b61403', id_sl: 10 }, // Catarina Mendes
    { id_utilizador: '019f3390-5740-76f7-85cf-1743b1fb20eb', id_sl: 11 }, // Lucia Lopez
    { id_utilizador: '019f3390-5740-76f7-85cf-1809d64e893f', id_sl: 12 }, // Camila Pereira
    { id_utilizador: '019f3390-5740-76f7-85cf-1cb921778500', id_sl: 13 }, // Sarah Brown
    { id_utilizador: '019f628a-8511-7225-93ea-02c8fa367b7a', id_sl: 4 },  // Tiago Costa (SLL SL 4 - Software Engineering)
    { id_utilizador: '019f628a-8511-7225-93ea-05733ae63110', id_sl: 5 },  // Carlos Ruiz (SLL SL 5 - Data Science & AI)
    { id_utilizador: '019f628a-8511-7225-93ea-0b36af3045f3', id_sl: 6 },  // Oliver Smith (SLL SL 6 - Cybersecurity)
    { id_utilizador: '019f628a-8511-7225-93ea-0f0172de6493', id_sl: 7 },  // Nuno Silva (SLL SL 7 - Cloud Architecture)
    { id_utilizador: '019f628a-8511-7225-93ea-1383f317668a', id_sl: 8 },  // Pablo Lopez (SLL SL 8 - DevOps Engineering)
    { id_utilizador: '019f628a-8511-7225-93ea-1673c836ae88', id_sl: 9 },  // Jack Brown (SLL SL 9 - Mobile Development)
    { id_utilizador: '019f628a-8511-7225-93ea-19b843568da4', id_sl: 10 }, // David Pires (SLL SL 10 - Quality Assurance)
    { id_utilizador: '019f628a-8511-7225-93ea-1cf509258b4e', id_sl: 11 }, // Vera Fonseca (SLL SL 11 - Employee Wellbeing)
    { id_utilizador: '019f628a-8511-7225-93ea-21cf544a929f', id_sl: 12 }, // André Rocha (SLL SL 12 - Learning & Development)
    { id_utilizador: '019f628a-8511-7225-93ea-24115cb01877', id_sl: 13 }  // Teresa Couto (SLL SL 13 - Compensation & Benefits)
  ];

  for (const item of serviceLineMap) {
    await Utilizador.update(
      { id_sl: item.id_sl },
      { where: { id_utilizador: item.id_utilizador }, transaction }
    );
  }

  console.log("Seed utilizador executado (fase 2 - id_sl atualizado)");
}

module.exports = { seedUtilizador, updateUtilizadorArea, updateUtilizadorServiceLine };