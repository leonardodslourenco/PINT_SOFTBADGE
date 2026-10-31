// =========================================================================
// DATASET ESTÁTICO DE TIPOS DE MARCO E CONFIGURAÇÕES DE MARCO (MILESTONES)
// =========================================================================

const TIPOS_MARCO_LIST = [
  {
    id_tipo_marco: '019f7301-1111-7000-8000-000000000001',
    codigo_tipo: 'INICIO_CANDIDATURA',
    id_traducao_titulo: '019f7301-1111-7000-8000-100000000001',
    id_traducao_descricao: '019f7301-1111-7000-8000-200000000001',
    titulo: {
      pt: 'Início de Candidatura',
      en: 'Application Start',
      es: 'Inicio de Solicitud'
    },
    descricao: {
      pt: 'Marco atribuído a um Consultor que iniciou o processo de candidatura por uma determinada quantidade de vezes.',
      en: 'Milestone awarded to a Consultant who has started the application process a specific number of times.',
      es: 'Marco otorgado a un Consultor que ha iniciado el proceso de solicitud una cantidad específica de veces.'
    }
  },
  {
    id_tipo_marco: '019f7301-1111-7000-8000-000000000002',
    codigo_tipo: 'CONQUISTA_BADGE',
    id_traducao_titulo: '019f7301-1111-7000-8000-100000000002',
    id_traducao_descricao: '019f7301-1111-7000-8000-200000000002',
    titulo: {
      pt: 'Conquista de Badge',
      en: 'Badge Achievement',
      es: 'Conquista de Insignia'
    },
    descricao: {
      pt: 'Marco atribuído a um Consultor que conquistou uma determinada quantidade de Badges em suas candidaturas concluídas com sucesso.',
      en: 'Milestone awarded to a Consultant who has earned a specific number of Badges in successfully completed applications.',
      es: 'Marco otorgado a un Consultor que ha obtenido una cantidad específica de Insignias en solicitudes completadas con éxito.'
    }
  },
  {
    id_tipo_marco: '019f7301-1111-7000-8000-000000000003',
    codigo_tipo: 'AREAS_DISTINTAS',
    id_traducao_titulo: '019f7301-1111-7000-8000-100000000003',
    id_traducao_descricao: '019f7301-1111-7000-8000-200000000003',
    titulo: {
      pt: 'Badges em Áreas distintas',
      en: 'Badges in Distinct Areas',
      es: 'Insignias en Áreas distintas'
    },
    descricao: {
      pt: 'Marco atribuído a um Consultor que conquistou Badges em uma quantidade X de áreas de conhecimento distintas.',
      en: 'Milestone awarded to a Consultant who has earned Badges across a specific number of distinct knowledge areas.',
      es: 'Marco otorgado a un Consultor que ha obtenido Insignias en una cantidad X de áreas de conocimiento distintas.'
    }
  },
  {
    id_tipo_marco: '019f7301-1111-7000-8000-000000000004',
    codigo_tipo: 'SL_DISTINTAS',
    id_traducao_titulo: '019f7301-1111-7000-8000-100000000004',
    id_traducao_descricao: '019f7301-1111-7000-8000-200000000004',
    titulo: {
      pt: 'Badges em Service Lines distintas',
      en: 'Badges in Distinct Service Lines',
      es: 'Insignias en Service Lines distintas'
    },
    descricao: {
      pt: 'Marco atribuído a um Consultor que conquistou Badges em uma quantidade X de Service Lines distintas.',
      en: 'Milestone awarded to a Consultant who has earned Badges across a specific number of distinct Service Lines.',
      es: 'Marco otorgado a un Consultor que ha obtenido Insignias en una cantidad X de Service Lines distintas.'
    }
  },
  {
    id_tipo_marco: '019f7301-1111-7000-8000-000000000005',
    codigo_tipo: 'MENSAL',
    id_traducao_titulo: '019f7301-1111-7000-8000-100000000005',
    id_traducao_descricao: '019f7301-1111-7000-8000-200000000005',
    titulo: {
      pt: 'Conquistas de Badges Mensal',
      en: 'Monthly Badge Achievements',
      es: 'Conquistas de Insignias Mensual'
    },
    descricao: {
      pt: 'Marco atribuído a um Consultor que conquistou uma quantidade X de Badges durante um mesmo mês civil.',
      en: 'Milestone awarded to a Consultant who has earned a specific number of Badges during a single calendar month.',
      es: 'Marco otorgado a un Consultor que ha obtenido una cantidad X de Insignias durante un mismo mes calendario.'
    }
  },
  {
    id_tipo_marco: '019f7301-1111-7000-8000-000000000006',
    codigo_tipo: 'BIMESTRAL',
    id_traducao_titulo: '019f7301-1111-7000-8000-100000000006',
    id_traducao_descricao: '019f7301-1111-7000-8000-200000000006',
    titulo: {
      pt: 'Conquistas de Badges Bimestral',
      en: 'Bimonthly Badge Achievements',
      es: 'Conquistas de Insignias Bimestral'
    },
    descricao: {
      pt: 'Marco atribuído a um Consultor que conquistou uma quantidade X de Badges durante um período de dois meses consecutivos.',
      en: 'Milestone awarded to a Consultant who has earned a specific number of Badges over a period of two consecutive months.',
      es: 'Marco otorgado a un Consultor que ha obtenido una cantidad X de Insignias durante un período de dos meses consecutivos.'
    }
  },
  {
    id_tipo_marco: '019f7301-1111-7000-8000-000000000007',
    codigo_tipo: 'TRIMESTRAL',
    id_traducao_titulo: '019f7301-1111-7000-8000-100000000007',
    id_traducao_descricao: '019f7301-1111-7000-8000-200000000007',
    titulo: {
      pt: 'Conquistas de Badges Trimestral',
      en: 'Quarterly Badge Achievements',
      es: 'Conquistas de Insignias Trimestral'
    },
    descricao: {
      pt: 'Marco atribuído a um Consultor que conquistou uma quantidade X de Badges durante um período de três meses consecutivos.',
      en: 'Milestone awarded to a Consultant who has earned a specific number of Badges over a period of three consecutive months.',
      es: 'Marco otorgado a un Consultor que ha obtenido una cantidad X de Insignias durante un período de tres meses consecutivos.'
    }
  },
  {
    id_tipo_marco: '019f7301-1111-7000-8000-000000000008',
    codigo_tipo: 'QUADRIMESTRAL',
    id_traducao_titulo: '019f7301-1111-7000-8000-100000000008',
    id_traducao_descricao: '019f7301-1111-7000-8000-200000000008',
    titulo: {
      pt: 'Conquistas de Badges Quadrimestral',
      en: 'Four-Month Badge Achievements',
      es: 'Conquistas de Insignias Cuatrimestral'
    },
    descricao: {
      pt: 'Marco atribuído a um Consultor que conquistou uma quantidade X de Badges durante um período de quatro meses consecutivos.',
      en: 'Milestone awarded to a Consultant who has earned a specific number of Badges over a period of four consecutive months.',
      es: 'Marco otorgado a un Consultor que ha obtenido una cantidad X de Insignias durante un período de cuatro meses consecutivos.'
    }
  },
  {
    id_tipo_marco: '019f7301-1111-7000-8000-000000000009',
    codigo_tipo: 'SEMESTRAL',
    id_traducao_titulo: '019f7301-1111-7000-8000-100000000009',
    id_traducao_descricao: '019f7301-1111-7000-8000-200000000009',
    titulo: {
      pt: 'Conquistas de Badges Semestral',
      en: 'Semiannual Badge Achievements',
      es: 'Conquistas de Insignias Semestral'
    },
    descricao: {
      pt: 'Marco atribuído a um Consultor que conquistou uma quantidade X de Badges durante um período de seis meses consecutivos.',
      en: 'Milestone awarded to a Consultant who has earned a specific number of Badges over a period of six consecutive months.',
      es: 'Marco otorgado a un Consultor que ha obtenido una cantidad X de Insignias durante un período de seis meses consecutivos.'
    }
  }
];

const CONFIGURACOES_MARCO_DEFAULT = [
  {
    id_marco: '019f7301-2222-7000-8000-000000000001',
    id_tipo_marco: '019f7301-1111-7000-8000-000000000001', // INICIO_CANDIDATURA
    quantidade_objetivo: 1,
    id_traducao_nome: '019f7301-2222-7000-8000-100000000001',
    id_traducao_descricao: '019f7301-2222-7000-8000-200000000001',
    nome: {
      pt: 'Primeiro Passo',
      en: 'First Step',
      es: 'Primer Paso'
    },
    descricao: {
      pt: 'Iniciou a sua primeira candidatura a um Badge na plataforma.',
      en: 'Started your first Badge application on the platform.',
      es: 'Inició su primera solicitud de Insignia en la plataforma.'
    }
  },
  {
    id_marco: '019f7301-2222-7000-8000-000000000002',
    id_tipo_marco: '019f7301-1111-7000-8000-000000000001', // INICIO_CANDIDATURA
    quantidade_objetivo: 5,
    id_traducao_nome: '019f7301-2222-7000-8000-100000000002',
    id_traducao_descricao: '019f7301-2222-7000-8000-200000000002',
    nome: {
      pt: 'Empreendedor do Conhecimento',
      en: 'Knowledge Entrepreneur',
      es: 'Emprendedor del Conocimiento'
    },
    descricao: {
      pt: 'Iniciou 5 candidaturas a Badges no sistema.',
      en: 'Started 5 Badge applications in the system.',
      es: 'Inició 5 solicitudes de Insignias en el sistema.'
    }
  },
  {
    id_marco: '019f7301-2222-7000-8000-000000000003',
    id_tipo_marco: '019f7301-1111-7000-8000-000000000002', // CONQUISTA_BADGE
    quantidade_objetivo: 1,
    id_traducao_nome: '019f7301-2222-7000-8000-100000000003',
    id_traducao_descricao: '019f7301-2222-7000-8000-200000000003',
    nome: {
      pt: 'Pioneiro Certificado',
      en: 'Certified Pioneer',
      es: 'Pionero Certificado'
    },
    descricao: {
      pt: 'Conquistou com sucesso o seu primeiro Badge oficial.',
      en: 'Successfully earned your first official Badge.',
      es: 'Obtuvo con éxito su primera Insignia oficial.'
    }
  },
  {
    id_marco: '019f7301-2222-7000-8000-000000000004',
    id_tipo_marco: '019f7301-1111-7000-8000-000000000002', // CONQUISTA_BADGE
    quantidade_objetivo: 5,
    id_traducao_nome: '019f7301-2222-7000-8000-100000000004',
    id_traducao_descricao: '019f7301-2222-7000-8000-200000000004',
    nome: {
      pt: 'Colecionador de Competências',
      en: 'Skills Collector',
      es: 'Coleccionador de Competencias'
    },
    descricao: {
      pt: 'Alcançou a impressionante marca de 5 Badges conquistados.',
      en: 'Reached the impressive milestone of 5 earned Badges.',
      es: 'Alcanzó la impresionante meta de 5 Insignias obtenidas.'
    }
  },
  {
    id_marco: '019f7301-2222-7000-8000-000000000005',
    id_tipo_marco: '019f7301-1111-7000-8000-000000000003', // AREAS_DISTINTAS
    quantidade_objetivo: 2,
    id_traducao_nome: '019f7301-2222-7000-8000-100000000005',
    id_traducao_descricao: '019f7301-2222-7000-8000-200000000005',
    nome: {
      pt: 'Perfil Multidisciplinar',
      en: 'Multidisciplinary Profile',
      es: 'Perfil Multidisciplinar'
    },
    descricao: {
      pt: 'Conquistou Badges em pelo menos 2 áreas de especialização distintas.',
      en: 'Earned Badges across at least 2 distinct areas of expertise.',
      es: 'Obtuvo Insignias en al menos 2 áreas de especialización distintas.'
    }
  },
  {
    id_marco: '019f7301-2222-7000-8000-000000000006',
    id_tipo_marco: '019f7301-1111-7000-8000-000000000004', // SL_DISTINTAS
    quantidade_objetivo: 2,
    id_traducao_nome: '019f7301-2222-7000-8000-100000000006',
    id_traducao_descricao: '019f7301-2222-7000-8000-200000000006',
    nome: {
      pt: 'Visão Holística da Organização',
      en: 'Holistic Organizational View',
      es: 'Visión Holística Organizacional'
    },
    descricao: {
      pt: 'Conquistou Badges em pelo menos 2 Service Lines distintas.',
      en: 'Earned Badges across at least 2 distinct Service Lines.',
      es: 'Obtuvo Insignias en al menos 2 Service Lines distintas.'
    }
  },
  {
    id_marco: '019f7301-2222-7000-8000-000000000007',
    id_tipo_marco: '019f7301-1111-7000-8000-000000000005', // MENSAL
    quantidade_objetivo: 3,
    id_traducao_nome: '019f7301-2222-7000-8000-100000000007',
    id_traducao_descricao: '019f7301-2222-7000-8000-200000000007',
    nome: {
      pt: 'Mês de Alta Performance',
      en: 'High Performance Month',
      es: 'Mes de Alto Rendimiento'
    },
    descricao: {
      pt: 'Conquistou 3 Badges aprovados no mesmo mês.',
      en: 'Earned 3 approved Badges in the same month.',
      es: 'Obtuvo 3 Insignias aprobadas en el mismo mes.'
    }
  }
];

module.exports = {
  TIPOS_MARCO_LIST,
  CONFIGURACOES_MARCO_DEFAULT
};
