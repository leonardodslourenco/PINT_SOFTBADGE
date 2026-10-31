const TipoNotificacao = require('../models/tipo_notificacao.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');

const tiposDefault = [
  {
    id_tipo_notificacao: 1,
    codigo_tipo: 'candidatura_pre_aprovada',
    id_traducao_descricao: '019fb95e-0782-7019-a380-f79d4a0f84ae',
    traducao: {
      tabela: 'tipo_notificacao',
      coluna: 'descricao',
      pt: 'Candidatura Pré-Aprovada pelo TM',
      en: 'Application Pre-Approved by TM',
      es: 'Solicitud Preadmitida por TM'
    }
  },
  {
    id_tipo_notificacao: 2,
    codigo_tipo: 'candidatura_aprovada',
    id_traducao_descricao: '019fb95e-0782-7019-a380-f94929b17d7d',
    traducao: {
      tabela: 'tipo_notificacao',
      coluna: 'descricao',
      pt: 'Candidatura Aprovada pelo SLL',
      en: 'Application Approved by SLL',
      es: 'Solicitud Aprobada por SLL'
    }
  },
  {
    id_tipo_notificacao: 3,
    codigo_tipo: 'candidatura_rejeitada',
    id_traducao_descricao: '019fb95e-0782-7019-a380-fdefcf6cb757',
    traducao: {
      tabela: 'tipo_notificacao',
      coluna: 'descricao',
      pt: 'Candidatura Rejeitada',
      en: 'Application Rejected',
      es: 'Solicitud Rechazada'
    }
  },
  {
    id_tipo_notificacao: 4,
    codigo_tipo: 'badge_atribuido',
    id_traducao_descricao: '019fb95e-0782-7019-a381-01dafa051bc1',
    traducao: {
      tabela: 'tipo_notificacao',
      coluna: 'descricao',
      pt: 'Novo Badge Conquistado',
      en: 'New Badge Awarded',
      es: 'Nuevo Badge Conseguido'
    }
  },
  {
    id_tipo_notificacao: 5,
    codigo_tipo: 'perfil_atualizado',
    id_traducao_descricao: '019fb95e-0782-7019-a381-045e875bc557',
    traducao: {
      tabela: 'tipo_notificacao',
      coluna: 'descricao',
      pt: 'Perfis de Acesso Atualizados',
      en: 'Access Profiles Updated',
      es: 'Perfiles de Acceso Actualizados'
    }
  },
  {
    id_tipo_notificacao: 6,
    codigo_tipo: 'evidencia_submetida',
    id_traducao_descricao: '019fb95e-0782-7019-a381-08cf33e377e6',
    traducao: {
      tabela: 'tipo_notificacao',
      coluna: 'descricao',
      pt: 'Nova Evidência Submetida',
      en: 'New Evidence Submitted',
      es: 'Nueva Evidencia Enviada'
    }
  },
  {
    id_tipo_notificacao: 7,
    codigo_tipo: 'nova_postagem_miniforum',
    id_traducao_descricao: '019fb95e-0782-7019-a381-0f40081d300b',
    traducao: {
      tabela: 'tipo_notificacao',
      coluna: 'descricao',
      pt: 'Nova Publicação no MiniFórum',
      en: 'New Post in MiniForum',
      es: 'Nueva Publicación en el MiniForo'
    }
  },
  {
    id_tipo_notificacao: 8,
    codigo_tipo: 'sistema_alerta',
    id_traducao_descricao: '019fb95e-0782-7019-a381-1124ca5b7037',
    traducao: {
      tabela: 'tipo_notificacao',
      coluna: 'descricao',
      pt: 'Alerta do Sistema',
      en: 'System Alert',
      es: 'Alerta del Sistema'
    }
  },
  {
    id_tipo_notificacao: 9,
    codigo_tipo: 'gestao_service_line',
    id_traducao_descricao: '019fb95e-0782-7019-a381-14f7b2c589a1',
    traducao: {
      tabela: 'tipo_notificacao',
      coluna: 'descricao',
      pt: 'Atualização na Service Line',
      en: 'Service Line Update',
      es: 'Actualización en Service Line'
    }
  },
  {
    id_tipo_notificacao: 10,
    codigo_tipo: 'gestao_area',
    id_traducao_descricao: '019fb95e-0782-7019-a381-18e3d4a991b2',
    traducao: {
      tabela: 'tipo_notificacao',
      coluna: 'descricao',
      pt: 'Atualização na Área',
      en: 'Area Update',
      es: 'Actualización en Área'
    }
  },
  {
    id_tipo_notificacao: 11,
    codigo_tipo: 'nova_candidatura_especial',
    id_traducao_descricao: '019eb900-0000-7000-8000-000000000050',
    traducao: {
      tabela: 'tipo_notificacao',
      coluna: 'descricao',
      pt: 'Nova Candidatura a Badge Especial',
      en: 'New Special Badge Application',
      es: 'Nueva Solicitud de Insignia Especial'
    }
  }
];

async function seedTipoNotificacao(transaction) {
  try {
    for (const tipo of tiposDefault) {
      await TraducaoConteudo.findOrCreate({
        where: { id_traducao_conteudo: tipo.id_traducao_descricao },
        defaults: {
          id_traducao_conteudo: tipo.id_traducao_descricao,
          ...tipo.traducao
        },
        transaction
      });

      await TipoNotificacao.findOrCreate({
        where: { id_tipo_notificacao: tipo.id_tipo_notificacao },
        defaults: {
          id_tipo_notificacao: tipo.id_tipo_notificacao,
          codigo_tipo: tipo.codigo_tipo,
          id_traducao_descricao: tipo.id_traducao_descricao,
          relacionamentoAtivo: true
        },
        transaction
      });
    }
    console.log("Seed TipoNotificacao executado com sucesso.");
  } catch (error) {
    console.error("Erro ao executar Seed TipoNotificacao:", error.message);
    throw error;
  }
}

module.exports = seedTipoNotificacao;
