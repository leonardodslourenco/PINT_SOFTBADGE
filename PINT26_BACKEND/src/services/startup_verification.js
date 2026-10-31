const fs = require('fs');
const path = require('path');
const sequelize = require('../config/database');
const Utilizador = require('../models/utilizador.model');
const Perfil = require('../models/perfil.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const ConfiguracaoSLA = require('../models/configuracao_sla.model');

// Seeds que devem ser injetados inicialmente
const seedAdministrador = require('../seeds/administrador.seed');
const seedTraducaoConteudo = require('../seeds/traducao_conteudo.seed');
const seedPerfil = require('../seeds/perfil.seed');
const garanteAdminAtivo = require('./habilita_admin');

// Estrutura esperada de diretórios em /uploads
const UPLOADS_DIRS = [
  'avatars',
  'certificados',
  'docs',
  'docs/certificados',
  'evidences',
  'logo_badges',
  'logo_especial'
];

/**
 * Elimina e recria completamente a estrutura limpa de uploads.
 */
function recreateUploadsStructure(uploadsPath) {
  if (fs.existsSync(uploadsPath)) {
    fs.rmSync(uploadsPath, { recursive: true, force: true });
  }
  fs.mkdirSync(uploadsPath, { recursive: true });
  for (const subDir of UPLOADS_DIRS) {
    fs.mkdirSync(path.join(uploadsPath, subDir), { recursive: true });
  }
}

/**
 * Garante que as subpastas da estrutura base existem.
 * Usado quando a base de dados já possui utilizadores.
 */
function ensureDirectoryStructure(uploadsPath) {
  if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath, { recursive: true });
  }
  for (const subDir of UPLOADS_DIRS) {
    const fullPath = path.join(uploadsPath, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  }
}

/**
 * Verifica se a DB está vazia, limpa ficheiros antigos,
 * inicializa as pastas corretas, e insere os dados base.
 */
async function verifyAndInitialize() {
  const countUtilizadores = await Utilizador.count();
  const uploadsPath = path.join(__dirname, '..', 'uploads');

  // Se a DB não estiver vazia, apenas garantimos que as pastas existem
  if (countUtilizadores > 0) {
    ensureDirectoryStructure(uploadsPath);
    await garanteAdminAtivo(); // Garante o desbloqueio do Admin a cada arranque
    try {
      const ServiceLine = require('../models/service_line.model');
      const slExists = await ServiceLine.findByPk(1);
      if (slExists) {
        await Utilizador.update({ id_sl: 1 }, { where: { id_sl: null } });
      }
    } catch (updateErr) {
      // Ignora se não houver registos a atualizar
    }
    return;
  }

  console.log("Tabela de utilizadores vazia. A preparar ambiente limpo (uploads e dependências)...");

  // 1. Eliminar e recriar o diretório uploads e todos os subdiretórios vazios
  recreateUploadsStructure(uploadsPath);

  // 2. Cópia exclusiva do default_avatar.png (necessário para o Admin inicial)
  const defaultAvatarSource = path.join(__dirname, '..', 'seeds', 'avatar', 'default_avatar.png');
  const defaultAvatarDest = path.join(uploadsPath, 'avatars', 'default_avatar.png');

  if (fs.existsSync(defaultAvatarSource)) {
    fs.copyFileSync(defaultAvatarSource, defaultAvatarDest);
    console.log('✔ default_avatar.png copiado com sucesso para uploads/avatars');
  } else {
    console.warn(`Aviso: Ficheiro default_avatar.png não encontrado em ${defaultAvatarSource}`);
  }

  // 3. Executar seeds iniciais obrigatórias (Traduções, Perfis, SLA, Admin)
  const transaction = await sequelize.transaction();
  try {
    const countTraducoes = await TraducaoConteudo.count({ transaction });
    if (countTraducoes === 0) {
      await seedTraducaoConteudo(transaction);
    }

    const countPerfis = await Perfil.count({ transaction });
    if (countPerfis === 0) {
      await seedPerfil(transaction);
    }

    const countSLA = await ConfiguracaoSLA.count({ transaction });
    if (countSLA === 0) {
      await ConfiguracaoSLA.create({
        sla_tm_horas: 48,
        sla_sll_horas: 48,
        enviar_email_pendentes: true,
        aviso_email_horas_restantes: 12,
        notificar_admin_sll_expirado: true,
        dias_badge_expirando: 30,
        intervalo_verificacao_badge_expirado: 2
      }, { transaction });
      console.log("Configuração padrão de SLA inicializada.");
    }
    await transaction.commit();
  } catch (err) {
    await transaction.rollback();
    console.error("Erro ao executar seeds de dependência: ", err.message);
  }

  await seedAdministrador();
  await garanteAdminAtivo(); // Garante o desbloqueio do Admin no primeiro arranque
  console.log("Ambiente inicial preparado com sucesso!");
}

module.exports = {
  verifyAndInitialize
};
