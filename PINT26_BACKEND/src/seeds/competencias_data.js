// =========================================================================
// DATASET COMPLETO DE COMPETÊNCIAS (SKILLS) & RELACIONAMENTOS COM BADGES
// =========================================================================

const COMPETENCIAS_LIST = [
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000001',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000001',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000001',
    titulo: {
      pt: 'Fundamentos de Low-Code',
      en: 'Low-Code Fundamentals',
      es: 'Fundamentos Low-Code'
    },
    descricao: {
      pt: 'Domínio dos conceitos essenciais de desenvolvimento visual rápido, arquitetura modular e entrega ágil de aplicações empresariais sobre plataformas Low-Code.',
      en: 'Mastery of essential rapid visual development concepts, modular architecture, and agile delivery of enterprise applications on Low-Code platforms.',
      es: 'Dominio de los conceptos esenciales de desarrollo visual rápido, arquitectura modular y entrega ágil de aplicaciones empresariales en plataformas Low-Code.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000002',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000002',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000002',
    titulo: {
      pt: 'Modelação de Dados',
      en: 'Data Modeling',
      es: 'Modelado de Datos'
    },
    descricao: {
      pt: 'Capacidade de desenhar esquemas de bases de dados relacionais e não-relacionais eficientes, normalização, integridade referencial e indexação para alta escalabilidade.',
      en: 'Ability to design efficient relational and non-relational database schemas, normalization, referential integrity, and indexing for high scalability.',
      es: 'Capacidad para diseñar esquemas de bases de datos relacionales y no relacionales eficientes, normalización, integridad referencial e indexación para alta escalabilidad.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000003',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000003',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000003',
    titulo: {
      pt: 'Construção de Interfaces & UX/UI',
      en: 'UI Construction & UX/UI',
      es: 'Construcción de Interfaces y UX/UI'
    },
    descricao: {
      pt: 'Desenvolvimento de interfaces modernas, responsivas e acessíveis com base em Design Systems, boas práticas de usabilidade e componentes reutilizáveis.',
      en: 'Development of modern, responsive, and accessible user interfaces based on Design Systems, usability best practices, and reusable components.',
      es: 'Desarrollo de interfaces modernas, adaptables y accesibles basadas en Design Systems, mejores prácticas de usabilidad y componentes reutilizables.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000004',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000004',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000004',
    titulo: {
      pt: 'Automação de Processos de Negócio',
      en: 'Business Process Automation',
      es: 'Automatización de Procesos de Negocio'
    },
    descricao: {
      pt: 'Modelação, orquestração e execução de fluxos de trabalho e lógica de negócio assíncrona para automatizar rotinas operacionais complexas.',
      en: 'Modeling, orchestration, and execution of workflows and asynchronous business logic to automate complex operational routines.',
      es: 'Modelado, orquestación y ejecución de flujos de trabajo y lógica de negocio asíncrona para automatizar rutinas operativas complejas.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000005',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000005',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000005',
    titulo: {
      pt: 'Integração de Sistemas & APIs REST',
      en: 'System Integration & REST APIs',
      es: 'Integración de Sistemas y APIs REST'
    },
    descricao: {
      pt: 'Conceção, consumo e disponibilização de serviços web RESTful/SOAP, transformação de dados JSON/XML, autenticação segura OAuth2 e tratamento de resiliência.',
      en: 'Design, consumption, and exposure of RESTful/SOAP web services, JSON/XML data transformation, OAuth2 secure authentication, and resilience handling.',
      es: 'Diseño, consumo y exposición de servicios web RESTful/SOAP, transformación de datos JSON/XML, autenticación segura OAuth2 y gestión de resiliencia.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000006',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000006',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000006',
    titulo: {
      pt: 'Gestão de Segurança e Perfis de Acesso',
      en: 'Security Management & Role-Based Access',
      es: 'Gestión de Seguridad y Roles de Acceso'
    },
    descricao: {
      pt: 'Implementação de modelos de controlo de acesso baseado em funções (RBAC), encriptação de dados sensíveis e mitigação de vulnerabilidades OWASP.',
      en: 'Implementation of Role-Based Access Control (RBAC), encryption of sensitive data, and mitigation of OWASP top vulnerabilities.',
      es: 'Implementación de control de acceso basado en roles (RBAC), cifrado de datos confidenciales y mitigación de vulnerabilidades OWASP.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000007',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000007',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000007',
    titulo: {
      pt: 'Otimização e Performance de Aplicações',
      en: 'Application Performance Optimization',
      es: 'Optimización y Rendimiento de Aplicaciones'
    },
    descricao: {
      pt: 'Diagnóstico de estrangulamentos, tuning de queries na BD, caching inteligente, minimização de payloads e profiling de tempos de resposta.',
      en: 'Bottleneck diagnostics, database query tuning, intelligent caching, payload minimization, and response time profiling.',
      es: 'Diagnóstico de cuellos de botella, optimización de consultas en BD, almacenamiento en caché inteligente, minimización de cargas útiles y análisis de tiempos de respuesta.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000008',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000008',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000008',
    titulo: {
      pt: 'Qualidade e Testes de Software',
      en: 'Software Quality & Testing',
      es: 'Calidad y Pruebas de Software'
    },
    descricao: {
      pt: 'Estratégias de garantia de qualidade (QA), criação de planos de testes, testes unitários, de integração e validação de critérios de aceitação.',
      en: 'Quality assurance (QA) strategies, test plan creation, unit and integration testing, and acceptance criteria validation.',
      es: 'Estrategias de garantía de calidad (QA), creación de planes de pruebas, pruebas unitarias y de integración, y validación de criterios de aceptación.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000009',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000009',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000009',
    titulo: {
      pt: 'Documentação Técnica e Funcional',
      en: 'Technical & Functional Documentation',
      es: 'Documentación Técnica y Funcional'
    },
    descricao: {
      pt: 'Redação clara e estruturada de especificações funcionais, diagramas de arquitetura, guias de utilizador e especificações de OpenAPI/Swagger.',
      en: 'Clear and structured drafting of functional specifications, architecture diagrams, user guides, and OpenAPI/Swagger specs.',
      es: 'Redacción clara y estructurada de especificaciones funcionales, diagramas de arquitectura, manuales de usuario y especificaciones OpenAPI/Swagger.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000010',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000010',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000010',
    titulo: {
      pt: 'Deploy Contínuo e Gestão de Ambientes',
      en: 'Continuous Deployment & Environment Management',
      es: 'Despliegue Continuo y Gestión de Entornos'
    },
    descricao: {
      pt: 'Governança do ciclo de vida de aplicações (ALM), promoção controlada entre ambientes (Dev/QA/Prod) e monitorização de lançamentos.',
      en: 'Application Lifecycle Management (ALM) governance, controlled staging across environments (Dev/QA/Prod), and release monitoring.',
      es: 'Gobernanza del ciclo de vida de aplicaciones (ALM), promoción controlada entre entornos (Dev/QA/Prod) y monitorización de entregas.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000011',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000011',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000011',
    titulo: {
      pt: 'Cloud Computing & Arquitetura AWS',
      en: 'Cloud Computing & AWS Architecture',
      es: 'Cloud Computing y Arquitectura AWS'
    },
    descricao: {
      pt: 'Dimensionamento e configuração de serviços AWS (EC2, S3, RDS, Lambda, VPC), desenho de arquiteturas altamente disponíveis e com otimização de custos.',
      en: 'Sizing and configuration of AWS services (EC2, S3, RDS, Lambda, VPC), designing highly available and cost-optimized architectures.',
      es: 'Dimensionamiento y configuración de servicios AWS (EC2, S3, RDS, Lambda, VPC), diseño de arquitecturas altamente disponibles y optimizadas en costes.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000012',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000012',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000012',
    titulo: {
      pt: 'Microsoft Azure Cloud Solutions',
      en: 'Microsoft Azure Cloud Solutions',
      es: 'Soluciones Cloud Microsoft Azure'
    },
    descricao: {
      pt: 'Administração de recursos Azure, redes virtuais, identidades com Microsoft Entra ID, Azure App Services e storage empresarial.',
      en: 'Administration of Azure resources, virtual networks, identities with Microsoft Entra ID, Azure App Services, and enterprise storage.',
      es: 'Administración de recursos Azure, redes virtuales, identidades con Microsoft Entra ID, Azure App Services y almacenamiento empresarial.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000013',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000013',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000013',
    titulo: {
      pt: 'Cibersegurança Defensiva & Firewalls',
      en: 'Defensive Cybersecurity & Firewalls',
      es: 'Ciberseguridad Defensiva y Cortafuegos'
    },
    descricao: {
      pt: 'Configuração de firewalls de próxima geração, sistemas de deteção de intrusões (IDS/IPS), análise de tráfego de rede e resposta a ameaças ativas.',
      en: 'Configuration of next-generation firewalls, intrusion detection systems (IDS/IPS), network traffic analysis, and active threat response.',
      es: 'Configuración de cortafuegos de última generación, sistemas de detección de intrusiones (IDS/IPS), análisis de tráfico de red y respuesta a amenazas.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000014',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000014',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000014',
    titulo: {
      pt: 'Testes de Penetração & Ethical Hacking',
      en: 'Penetration Testing & Ethical Hacking',
      es: 'Pruebas de Penetración y Hacking Ético'
    },
    descricao: {
      pt: 'Execução de auditorias de segurança ofensiva em aplicações web e redes, exploração controlada de vulnerabilidades e elaboração de relatórios de remediação.',
      en: 'Execution of offensive security audits on web apps and networks, controlled vulnerability exploitation, and remediation report drafting.',
      es: 'Ejecución de auditorías de seguridad ofensiva en aplicaciones web y redes, explotación controlada de vulnerabilidades y elaboración de informes de remediación.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000015',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000015',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000015',
    titulo: {
      pt: 'CI/CD Pipelines com Jenkins & GitHub Actions',
      en: 'CI/CD Pipelines with Jenkins & GitHub Actions',
      es: 'Pipelines CI/CD con Jenkins y GitHub Actions'
    },
    descricao: {
      pt: 'Automação completa do ciclo de compilação, testes e entrega contínua com pipelines declarativos, gestão de segredos e estratégias de branch.',
      en: 'End-to-end automation of build, test, and continuous delivery cycles with declarative pipelines, secret management, and branching strategies.',
      es: 'Automatización completa del ciclo de compilación, pruebas y entrega continua con pipelines declarativos, gestión de secretos y ramas.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000016',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000016',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000016',
    titulo: {
      pt: 'Infraestrutura como Código (Terraform & Ansible)',
      en: 'Infrastructure as Code (Terraform & Ansible)',
      es: 'Infraestructura como Código (Terraform y Ansible)'
    },
    descricao: {
      pt: 'Aprovisionamento automatizado, idempotente e versionado de recursos de infraestrutura multi-cloud com Terraform e automação de configuração com Ansible.',
      en: 'Automated, idempotent, and version-controlled provisioning of multi-cloud infrastructure using Terraform and configuration management with Ansible.',
      es: 'Aprovisionamiento automatizado, idempotente y versionado de infraestructura multi-cloud con Terraform y gestión de configuraciones con Ansible.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000017',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000017',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000017',
    titulo: {
      pt: 'Desenvolvimento Frontend com React & Vue',
      en: 'Frontend Development with React & Vue',
      es: 'Desarrollo Frontend con React y Vue'
    },
    descricao: {
      pt: 'Criação de Single Page Applications (SPAs) reativas, gestão avançada de estado (Redux/Pinia), hooks, server-side rendering e otimização do DOM virtual.',
      en: 'Creation of reactive Single Page Applications (SPAs), advanced state management (Redux/Pinia), hooks, SSR, and virtual DOM optimization.',
      es: 'Creación de aplicaciones web SPA reactivas, gestión avanzada de estado (Redux/Pinia), hooks, SSR y optimización del DOM virtual.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000018',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000018',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000018',
    titulo: {
      pt: 'Desenvolvimento Backend com Node.js & Python',
      en: 'Backend Development with Node.js & Python',
      es: 'Desarrollo Backend con Node.js y Python'
    },
    descricao: {
      pt: 'Construção de servidores e microsserviços assíncronos de alta escalabilidade com Node.js/Express e frameworks robustos em Python (Django/FastAPI).',
      en: 'Building scalable asynchronous backend servers and microservices with Node.js/Express and robust Python frameworks (Django/FastAPI).',
      es: 'Construcción de servidores backend asíncronos y microservicios escalables con Node.js/Express y frameworks robustos en Python (Django/FastAPI).'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000019',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000019',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000019',
    titulo: {
      pt: 'Deep Learning & Redes Neuronais (TensorFlow & PyTorch)',
      en: 'Deep Learning & Neural Networks (TensorFlow & PyTorch)',
      es: 'Deep Learning y Redes Neuronales (TensorFlow y PyTorch)'
    },
    descricao: {
      pt: 'Desenvolvimento, treino e validação de modelos de aprendizagem profunda para visão computacional, processamento de linguagem natural e inferência.',
      en: 'Development, training, and validation of deep learning models for computer vision, natural language processing, and model inference.',
      es: 'Desarrollo, entrenamiento y validación de modelos de aprendizaje profundo para visión artificial, procesamiento de lenguaje natural e inferencia.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000020',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000020',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000020',
    titulo: {
      pt: 'Big Data & Pipelines de Dados (Apache Spark)',
      en: 'Big Data & Data Pipelines (Apache Spark)',
      es: 'Big Data y Pipelines de Datos (Apache Spark)'
    },
    descricao: {
      pt: 'Processamento distribuído de grandes volumes de dados em tempo real e batch, ETL escalável com Apache Spark e integração em data lakes.',
      en: 'Distributed big data processing in real-time and batch modes, scalable ETL pipelines with Apache Spark, and data lake integration.',
      es: 'Procesamiento distribuido de grandes volúmenes de datos en tiempo real y por lotes, ETL escalable con Apache Spark e integración en data lakes.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000021',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000021',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000021',
    titulo: {
      pt: 'Desenvolvimento Mobile iOS (Swift & SwiftUI)',
      en: 'iOS Mobile Development (Swift & SwiftUI)',
      es: 'Desarrollo Móvil iOS (Swift y SwiftUI)'
    },
    descricao: {
      pt: 'Desenvolvimento nativo para o ecossistema Apple com Swift e SwiftUI, arquiteturas MVVM, integração com serviços do iOS e publicação na App Store.',
      en: 'Native Apple ecosystem development using Swift and SwiftUI, MVVM architecture, iOS service integration, and App Store releases.',
      es: 'Desarrollo nativo para el ecosistema Apple con Swift y SwiftUI, arquitecturas MVVM, integración con servicios iOS y publicación en App Store.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000022',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000022',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000022',
    titulo: {
      pt: 'Desenvolvimento Mobile Android (Kotlin & Java)',
      en: 'Android Mobile Development (Kotlin & Java)',
      es: 'Desarrollo Móvil Android (Kotlin y Java)'
    },
    descricao: {
      pt: 'Construção de aplicações Android modernas e performantes com Kotlin, Jetpack Compose, coroutines e consumo de serviços em segundo plano.',
      en: 'Building modern and performant Android apps using Kotlin, Jetpack Compose, coroutines, and background services.',
      es: 'Construcción de aplicaciones Android modernas y de alto rendimiento con Kotlin, Jetpack Compose, coroutines y servicios en segundo plano.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000023',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000023',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000023',
    titulo: {
      pt: 'Gestão Ágil com Scrum & Kanban',
      en: 'Agile Management with Scrum & Kanban',
      es: 'Gestión Ágil con Scrum y Kanban'
    },
    descricao: {
      pt: 'Facilitação de cerimónias ágeis (Sprint Planning, Daily, Review, Retrospective), eliminação de impedimentos e acompanhamento de métricas de velocidade.',
      en: 'Facilitation of agile ceremonies (Sprint Planning, Daily, Review, Retrospective), impediment removal, and velocity metric tracking.',
      es: 'Facilitación de ceremonias ágiles (Sprint Planning, Daily, Review, Retrospectiva), resolución de bloqueos y seguimiento de métricas de velocidad.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000024',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000024',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000024',
    titulo: {
      pt: 'Liderança e Gestão de Equipas Técnicas',
      en: 'Technical Leadership & Team Management',
      es: 'Liderazgo y Gestión de Equipos Técnicos'
    },
    descricao: {
      pt: 'Coordenação de equipas multidisciplinares, definição de visão técnica, feedback construtivo, gestão de talento e capacitação contínua.',
      en: 'Coordination of multidisciplinary teams, technical vision definition, constructive feedback, talent management, and continuous empowerment.',
      es: 'Coordinación de equipos multidisciplinares, definición de visión técnica, retroalimentación constructiva, gestión del talento y capacitación continua.'
    }
  },
  {
    id_competencia: '019eb6e3-77e6-779a-a0df-000000000025',
    id_traducao_titulo: '019eb6e3-77e6-779a-a0df-100000000025',
    id_traducao_descricao: '019eb6e3-77e6-779a-a0df-200000000025',
    titulo: {
      pt: 'Comunicação Interpessoal & Resolução de Conflitos',
      en: 'Interpersonal Communication & Conflict Resolution',
      es: 'Comunicación Interpersonal y Resolución de Conflictos'
    },
    descricao: {
      pt: 'Habilidade de comunicação clara, escuta ativa, inteligência emocional e mediação assertiva de conflitos em ambientes empresariais dinâmicos.',
      en: 'Clear communication skills, active listening, emotional intelligence, and assertive conflict mediation in dynamic enterprise environments.',
      es: 'Habilidades de comunicación clara, escucha activa, inteligencia emocional y mediación asertiva de conflictos en entornos dinámicos.'
    }
  }
];

module.exports = {
  COMPETENCIAS_LIST
};
