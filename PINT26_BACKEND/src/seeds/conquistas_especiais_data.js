// Definição centralizada de IDs e Traduções para Badges de Conquistas Especiais

const TRADUCOES_CONQUISTAS_ESPECIAIS = [
  // 1. Tipos de Badge Especial
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000001',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_titulo',
    pt: 'Badge Externo (ex.: Credly)',
    en: 'External Badge (e.g. Credly)',
    es: 'Insignia Externa (ej.: Credly)'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000002',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_descricao',
    pt: 'Validação de certificações e credenciais digitais externas através do link público.',
    en: 'Validation of external certifications and digital credentials via public link.',
    es: 'Validación de certificaciones y credenciales digitales externas mediante enlace público.'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000003',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_titulo',
    pt: 'Curso Externo Nível 1 (Iniciante)',
    en: 'External Course Level 1 (Beginner)',
    es: 'Curso Externo Nivel 1 (Principiante)'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000004',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_descricao',
    pt: 'Cursos introdutórios com certificado PDF comprovativo (duração até 10h).',
    en: 'Introductory courses with supporting PDF certificate (up to 10h duration).',
    es: 'Cursos introductorios con certificado PDF acreditativo (duración hasta 10h).'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000005',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_titulo',
    pt: 'Curso Externo Nível 2 (Intermédio)',
    en: 'External Course Level 2 (Intermediate)',
    es: 'Curso Externo Nivel 2 (Intermedio)'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000006',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_descricao',
    pt: 'Cursos intermédios com certificado PDF comprovativo (duração 10h a 25h).',
    en: 'Intermediate courses with supporting PDF certificate (10h to 25h duration).',
    es: 'Cursos intermedios con certificado PDF acreditativo (duración 10h a 25h).'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000007',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_titulo',
    pt: 'Curso Externo Nível 3 (Avançado)',
    en: 'External Course Level 3 (Advanced)',
    es: 'Curso Externo Nivel 3 (Avanzado)'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000008',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_descricao',
    pt: 'Cursos de especialização técnica com certificado PDF comprovativo (duração 25h a 50h).',
    en: 'Technical specialization courses with supporting PDF certificate (25h to 50h duration).',
    es: 'Cursos de especialización técnica con certificado PDF acreditativo (duración 25h a 50h).'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000009',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_titulo',
    pt: 'Curso Externo Nível 4 (Especialista)',
    en: 'External Course Level 4 (Specialist)',
    es: 'Curso Externo Nivel 4 (Especialista)'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000010',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_descricao',
    pt: 'Cursos avançados de alta densidade técnica com certificado PDF (duração 50h a 100h).',
    en: 'Advanced high-density technical courses with PDF certificate (50h to 100h duration).',
    es: 'Cursos avanzados de alta densidad técnica con certificado PDF (duración 50h a 100h).'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000011',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_titulo',
    pt: 'Curso Externo Nível 5 (Master / Pós-Graduação)',
    en: 'External Course Level 5 (Master / Post-Graduation)',
    es: 'Curso Externo Nivel 5 (Máster / Posgrado)'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000012',
    tabela: 'tipo_badge_especial',
    coluna: 'id_traducao_descricao',
    pt: 'Programas de longa duração, pós-graduações ou bootcamps intensivos (+100h).',
    en: 'Long-term programs, postgraduate courses, or intensive bootcamps (+100h).',
    es: 'Programas de larga duración, posgrados o bootcamps intensivos (+100h).'
  },

  // 2. Estados de Candidatura Especial
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000021',
    tabela: 'estado_candidatura_especial',
    coluna: 'id_traducao_estado',
    pt: 'Enviada',
    en: 'Submitted',
    es: 'Enviada'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000022',
    tabela: 'estado_candidatura_especial',
    coluna: 'id_traducao_estado',
    pt: 'Aprovada',
    en: 'Approved',
    es: 'Aprobada'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000023',
    tabela: 'estado_candidatura_especial',
    coluna: 'id_traducao_estado',
    pt: 'Recusada',
    en: 'Rejected',
    es: 'Rechazada'
  },

  // 3. Badges Especiais - AWS Certified Cloud Practitioner
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000031',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_conquista_especial',
    pt: 'AWS Certified Cloud Practitioner',
    en: 'AWS Certified Cloud Practitioner',
    es: 'AWS Certified Cloud Practitioner'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000032',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_descricao_conquista_especial',
    pt: 'Certificação oficial Amazon Web Services que comprova conhecimentos fundamentais em arquitetura Cloud, segurança e serviços essenciais.',
    en: 'Official Amazon Web Services certification proving fundamental knowledge in Cloud architecture, security, and essential services.',
    es: 'Certificación oficial de Amazon Web Services que acredita conocimientos fundamentales en arquitectura Cloud, seguridad y servicios esenciales.'
  },

  // 4. Badges Especiais - Microsoft Azure Fundamentals (AZ-900)
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000033',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_conquista_especial',
    pt: 'Microsoft Certified: Azure Fundamentals (AZ-900)',
    en: 'Microsoft Certified: Azure Fundamentals (AZ-900)',
    es: 'Microsoft Certified: Azure Fundamentals (AZ-900)'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000034',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_descricao_conquista_especial',
    pt: 'Certificação oficial da Microsoft que atesta a compreensão dos conceitos de nuvem, modelos de serviço e arquitetura do Microsoft Azure.',
    en: 'Official Microsoft certification proving understanding of cloud concepts, service models, and Microsoft Azure architecture.',
    es: 'Certificación oficial de Microsoft que acredita la comprensión de conceptos de nube, modelos de servicio y arquitectura de Microsoft Azure.'
  },

  // 5. Badges Especiais - CompTIA A+
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000035',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_conquista_especial',
    pt: 'CompTIA A+ Certification',
    en: 'CompTIA A+ Certification',
    es: 'CompTIA A+ Certification'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000036',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_descricao_conquista_especial',
    pt: 'Padrão da indústria para profissionais de TI que valida competências essenciais em hardware, redes, sistemas operativos e segurança.',
    en: 'Industry standard for IT professionals validating essential skills in hardware, networking, operating systems, and security.',
    es: 'Estándar de la industria para profesionales de TI que valida habilidades esenciales en hardware, redes, sistemas operativos y seguridad.'
  },

  // 6. Badges Especiais - IBM Data Science Professional Certificate
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000037',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_conquista_especial',
    pt: 'IBM Data Science Professional Certificate',
    en: 'IBM Data Science Professional Certificate',
    es: 'IBM Data Science Professional Certificate'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000038',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_descricao_conquista_especial',
    pt: 'Certificação profissional emitida pela IBM através do Credly com domínio em Python, SQL, análise de dados e Machine Learning.',
    en: 'Professional certification issued by IBM via Credly demonstrating proficiency in Python, SQL, data analysis, and Machine Learning.',
    es: 'Certificación profesional emitida por IBM a través de Credly con dominio en Python, SQL, análisis de datos y Machine Learning.'
  },

  // 7. Badges Especiais - IBM AI for Everyone: Master the Basics (V2)
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000039',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_conquista_especial',
    pt: 'IBM AI for Everyone: Master the Basics (V2)',
    en: 'IBM AI for Everyone: Master the Basics (V2)',
    es: 'IBM AI for Everyone: Master the Basics (V2)'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000040',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_descricao_conquista_especial',
    pt: 'Distinção IBM para competências fundacionais em Inteligência Artificial Generativa, ética de IA e aplicações corporativas.',
    en: 'IBM distinction for foundational skills in Generative Artificial Intelligence, AI ethics, and enterprise applications.',
    es: 'Distinción de IBM para habilidades fundamentales en Inteligencia Artificial Generativa, ética de IA y aplicaciones corporativas.'
  },

  // 8. Badges Especiais - Curso Especializado de Kubernetes & Docker
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000041',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_conquista_especial',
    pt: 'Curso Avançado de Kubernetes & Containers',
    en: 'Advanced Kubernetes & Containers Course',
    es: 'Curso Avanzado de Kubernetes & Contenedores'
  },
  {
    id_traducao_conteudo: '019eb900-0000-7000-8000-000000000042',
    tabela: 'conquista_especial',
    coluna: 'id_traducao_descricao_conquista_especial',
    pt: 'Formação especializada externa de orquestração de microsserviços em produção comprovada por certificado PDF de conclusão.',
    en: 'Specialized external training in production microservices orchestration supported by a completion PDF certificate.',
    es: 'Formación especializada externa de orquestación de microservicios en producción acreditada por certificado PDF de finalización.'
  }
];

const TIPOS_BADGE_ESPECIAL_LIST = [
  {
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000001',
    codigo_tipo: 'BADGE_EXTERNO',
    id_traducao_titulo: '019eb900-0000-7000-8000-000000000001',
    id_traducao_descricao: '019eb900-0000-7000-8000-000000000002',
    requer_link: true,
    requer_ficheiro: false
  },
  {
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000002',
    codigo_tipo: 'CURSO_EXTERNO_N1',
    id_traducao_titulo: '019eb900-0000-7000-8000-000000000003',
    id_traducao_descricao: '019eb900-0000-7000-8000-000000000004',
    requer_link: false,
    requer_ficheiro: true
  },
  {
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000003',
    codigo_tipo: 'CURSO_EXTERNO_N2',
    id_traducao_titulo: '019eb900-0000-7000-8000-000000000005',
    id_traducao_descricao: '019eb900-0000-7000-8000-000000000006',
    requer_link: false,
    requer_ficheiro: true
  },
  {
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000004',
    codigo_tipo: 'CURSO_EXTERNO_N3',
    id_traducao_titulo: '019eb900-0000-7000-8000-000000000007',
    id_traducao_descricao: '019eb900-0000-7000-8000-000000000008',
    requer_link: false,
    requer_ficheiro: true
  },
  {
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000005',
    codigo_tipo: 'CURSO_EXTERNO_N4',
    id_traducao_titulo: '019eb900-0000-7000-8000-000000000009',
    id_traducao_descricao: '019eb900-0000-7000-8000-000000000010',
    requer_link: false,
    requer_ficheiro: true
  },
  {
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000006',
    codigo_tipo: 'CURSO_EXTERNO_N5',
    id_traducao_titulo: '019eb900-0000-7000-8000-000000000011',
    id_traducao_descricao: '019eb900-0000-7000-8000-000000000012',
    requer_link: false,
    requer_ficheiro: true
  }
];

const ESTADOS_CANDIDATURA_ESPECIAL_LIST = [
  {
    id_estado_candidatura_especial: 1,
    id_traducao_estado: '019eb900-0000-7000-8000-000000000021'
  },
  {
    id_estado_candidatura_especial: 2,
    id_traducao_estado: '019eb900-0000-7000-8000-000000000022'
  },
  {
    id_estado_candidatura_especial: 3,
    id_traducao_estado: '019eb900-0000-7000-8000-000000000023'
  }
];

const CONQUISTAS_ESPECIAIS_LIST = [
  {
    id_conquista_especial: '019eb920-0000-7000-8000-000000000001',
    id_traducao_conquista_especial: '019eb900-0000-7000-8000-000000000031',
    id_traducao_descricao_conquista_especial: '019eb900-0000-7000-8000-000000000032',
    pontos_bonus: 300,
    logo_conquista: 'AWS_Certified_Cloud_Practitioner.png',
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000001' // Badge Externo
  },
  {
    id_conquista_especial: '019eb920-0000-7000-8000-000000000002',
    id_traducao_conquista_especial: '019eb900-0000-7000-8000-000000000033',
    id_traducao_descricao_conquista_especial: '019eb900-0000-7000-8000-000000000034',
    pontos_bonus: 300,
    logo_conquista: 'Microsoft_Certified_Azure_Fundamentals.png',
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000001' // Badge Externo
  },
  {
    id_conquista_especial: '019eb920-0000-7000-8000-000000000003',
    id_traducao_conquista_especial: '019eb900-0000-7000-8000-000000000035',
    id_traducao_descricao_conquista_especial: '019eb900-0000-7000-8000-000000000036',
    pontos_bonus: 400,
    logo_conquista: 'CompTIA_A+_Certification.png',
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000001' // Badge Externo
  },
  {
    id_conquista_especial: '019eb920-0000-7000-8000-000000000004',
    id_traducao_conquista_especial: '019eb900-0000-7000-8000-000000000037',
    id_traducao_descricao_conquista_especial: '019eb900-0000-7000-8000-000000000038',
    pontos_bonus: 350,
    logo_conquista: 'IBM_Data_Science_Professional_Certificate.png',
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000001' // Badge Externo (Credly)
  },
  {
    id_conquista_especial: '019eb920-0000-7000-8000-000000000005',
    id_traducao_conquista_especial: '019eb900-0000-7000-8000-000000000039',
    id_traducao_descricao_conquista_especial: '019eb900-0000-7000-8000-000000000040',
    pontos_bonus: 250,
    logo_conquista: 'AI_for_Everyone_Master_the_Basics_V2.png',
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000001' // Badge Externo (Credly)
  },
  {
    id_conquista_especial: '019eb920-0000-7000-8000-000000000006',
    id_traducao_conquista_especial: '019eb900-0000-7000-8000-000000000041',
    id_traducao_descricao_conquista_especial: '019eb900-0000-7000-8000-000000000042',
    pontos_bonus: 200,
    logo_conquista: 'IBM_Containers_and_Kubernetes.png',
    id_tipo_badge_especial: '019eb910-0000-7000-8000-000000000004' // Curso Externo Nível 3 (PDF)
  }
];

module.exports = {
  TRADUCOES_CONQUISTAS_ESPECIAIS,
  TIPOS_BADGE_ESPECIAL_LIST,
  ESTADOS_CANDIDATURA_ESPECIAL_LIST,
  CONQUISTAS_ESPECIAIS_LIST
};
