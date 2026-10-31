const CompetenciaBadge = require('../models/competencia_badge.model');
const Badge = require('../models/badge.model');
const { COMPETENCIAS_LIST } = require('./competencias_data');

async function seedCompetenciaBadge(transaction) {
  const C = {};
  COMPETENCIAS_LIST.forEach((comp, idx) => {
    C[idx + 1] = comp.id_competencia;
  });

  // Obter todos os badges existentes na base de dados
  const badges = await Badge.findAll({ transaction, order: [['createdAt', 'ASC']] });
  if (!badges || badges.length === 0) {
    console.log('[Seed CompetenciaBadge] Nenhum badge encontrado para associar.');
    return;
  }

  const relacionamentos = [];

  // Mapeamento temático baseado no id_nivel_area ou título/área
  for (const badge of badges) {
    const nivelId = badge.id_nivel_area;
    const badgeId = badge.id_badge;

    // Regras por Nível / Área
    if (nivelId >= 1 && nivelId <= 5) {
      // Low-Code / OutSystems
      relacionamentos.push({ id_competencia: C[1], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[3], id_badge: badgeId });
      if (nivelId >= 2) relacionamentos.push({ id_competencia: C[2], id_badge: badgeId });
      if (nivelId >= 2) relacionamentos.push({ id_competencia: C[4], id_badge: badgeId });
      if (nivelId >= 3) relacionamentos.push({ id_competencia: C[5], id_badge: badgeId });
      if (nivelId >= 3) relacionamentos.push({ id_competencia: C[6], id_badge: badgeId });
      if (nivelId >= 4) relacionamentos.push({ id_competencia: C[7], id_badge: badgeId });
      if (nivelId >= 4) relacionamentos.push({ id_competencia: C[8], id_badge: badgeId });
      if (nivelId >= 5) relacionamentos.push({ id_competencia: C[9], id_badge: badgeId });
      if (nivelId >= 5) relacionamentos.push({ id_competencia: C[10], id_badge: badgeId });
    } else if (nivelId === 11 || nivelId === 12) {
      // Frontend (React, Vue)
      relacionamentos.push({ id_competencia: C[3], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[17], id_badge: badgeId });
      if (nivelId === 12) relacionamentos.push({ id_competencia: C[7], id_badge: badgeId });
    } else if (nivelId === 13 || nivelId === 14) {
      // Backend (Node.js, Django)
      relacionamentos.push({ id_competencia: C[5], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[18], id_badge: badgeId });
      if (nivelId === 14) relacionamentos.push({ id_competencia: C[6], id_badge: badgeId });
    } else if (nivelId === 15 || nivelId === 16) {
      // AI / Machine Learning (TensorFlow, PyTorch)
      relacionamentos.push({ id_competencia: C[2], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[19], id_badge: badgeId });
      if (nivelId === 16) relacionamentos.push({ id_competencia: C[7], id_badge: badgeId });
    } else if (nivelId === 17 || nivelId === 18) {
      // Data Engineering (Spark, Pipelines)
      relacionamentos.push({ id_competencia: C[2], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[20], id_badge: badgeId });
      if (nivelId === 18) relacionamentos.push({ id_competencia: C[7], id_badge: badgeId });
    } else if (nivelId === 19 || nivelId === 20) {
      // Penetration Testing
      relacionamentos.push({ id_competencia: C[6], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[14], id_badge: badgeId });
      if (nivelId === 20) relacionamentos.push({ id_competencia: C[13], id_badge: badgeId });
    } else if (nivelId === 21 || nivelId === 22) {
      // Defensive Security (Firewalls, IDS)
      relacionamentos.push({ id_competencia: C[6], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[13], id_badge: badgeId });
    } else if (nivelId === 23 || nivelId === 24) {
      // Cloud AWS
      relacionamentos.push({ id_competencia: C[11], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[10], id_badge: badgeId });
      if (nivelId === 24) relacionamentos.push({ id_competencia: C[6], id_badge: badgeId });
    } else if (nivelId === 25 || nivelId === 26) {
      // Cloud Azure
      relacionamentos.push({ id_competencia: C[12], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[10], id_badge: badgeId });
      if (nivelId === 26) relacionamentos.push({ id_competencia: C[6], id_badge: badgeId });
    } else if (nivelId === 27 || nivelId === 28) {
      // CI/CD (Jenkins, Actions)
      relacionamentos.push({ id_competencia: C[10], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[15], id_badge: badgeId });
      if (nivelId === 28) relacionamentos.push({ id_competencia: C[8], id_badge: badgeId });
    } else if (nivelId === 29 || nivelId === 30) {
      // IaC (Terraform, Ansible)
      relacionamentos.push({ id_competencia: C[11], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[16], id_badge: badgeId });
      if (nivelId === 30) relacionamentos.push({ id_competencia: C[6], id_badge: badgeId });
    } else if (nivelId === 31 || nivelId === 32) {
      // iOS Development
      relacionamentos.push({ id_competencia: C[3], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[21], id_badge: badgeId });
      if (nivelId === 32) relacionamentos.push({ id_competencia: C[5], id_badge: badgeId });
    } else if (nivelId === 33 || nivelId === 34) {
      // Android Development
      relacionamentos.push({ id_competencia: C[3], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[22], id_badge: badgeId });
      if (nivelId === 34) relacionamentos.push({ id_competencia: C[5], id_badge: badgeId });
    } else if (nivelId >= 35 && nivelId <= 38) {
      // QA & Testing
      relacionamentos.push({ id_competencia: C[8], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[9], id_badge: badgeId });
      if (nivelId === 36 || nivelId === 38) relacionamentos.push({ id_competencia: C[15], id_badge: badgeId });
    } else if (nivelId >= 39 && nivelId <= 42) {
      // Wellbeing & Ergonomics
      relacionamentos.push({ id_competencia: C[25], id_badge: badgeId });
      if (nivelId >= 41) relacionamentos.push({ id_competencia: C[10], id_badge: badgeId });
    } else if (nivelId >= 43 && nivelId <= 44) {
      // Leadership & Conflict
      relacionamentos.push({ id_competencia: C[24], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[25], id_badge: badgeId });
      if (nivelId === 44) relacionamentos.push({ id_competencia: C[23], id_badge: badgeId });
    } else if (nivelId >= 45 && nivelId <= 46) {
      // Agile & Scrum
      relacionamentos.push({ id_competencia: C[23], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[9], id_badge: badgeId });
      if (nivelId === 46) relacionamentos.push({ id_competencia: C[24], id_badge: badgeId });
    } else if (nivelId >= 47 && nivelId <= 50) {
      // Compensation, Benefits & HR
      relacionamentos.push({ id_competencia: C[4], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[9], id_badge: badgeId });
      if (nivelId >= 49) relacionamentos.push({ id_competencia: C[25], id_badge: badgeId });
    } else {
      // Fallback genérico para novos badges
      relacionamentos.push({ id_competencia: C[1], id_badge: badgeId });
      relacionamentos.push({ id_competencia: C[9], id_badge: badgeId });
    }
  }

  for (const rel of relacionamentos) {
    if (rel.id_competencia && rel.id_badge) {
      await CompetenciaBadge.findOrCreate({
        where: {
          id_competencia: rel.id_competencia,
          id_badge: rel.id_badge
        },
        defaults: {
          id_competencia: rel.id_competencia,
          id_badge: rel.id_badge,
          relacionamentoAtivo: true
        },
        transaction
      });
    }
  }

  console.log(`Seed Competencia-Badge executado (${relacionamentos.length} associações registadas)`);
}

module.exports = seedCompetenciaBadge;