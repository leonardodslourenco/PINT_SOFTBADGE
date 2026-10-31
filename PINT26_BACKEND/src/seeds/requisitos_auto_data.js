// Dados automáticos de requisitos e suas respetivas traduções para todos os badges
const TRADUCOES_REQUISITOS_NOVOS = [
  // --- Requisito 5 (Node.js Júnior - 1) ---
  { id_traducao_conteudo: '01a04468-206c-72fe-97ab-4d72a6c23b1b', tabela: 'requisito_badge', coluna: 'id_traducao_requisito', pt: 'Construção de API REST com Express', en: 'Building REST API with Express', es: 'Construcción de API REST con Express' },
  { id_traducao_conteudo: '01a04468-206c-72fe-97ab-524147ec2bbc', tabela: 'requisito_badge', coluna: 'id_traducao_subtitulo_req', pt: 'Desenvolvimento de endpoints seguros e estruturados', en: 'Development of secure and structured endpoints', es: 'Desarrollo de endpoints seguros y estructurados' },
  { id_traducao_conteudo: '01a04468-206c-72fe-97ab-5528e0fff196', tabela: 'requisito_badge', coluna: 'id_traducao_descritivo_req', pt: 'Implementar uma API com rotas, controladores e validação de dados em Node.js.', en: 'Implement an API with routes, controllers and data validation in Node.js.', es: 'Implementar una API con rutas, controladores y validación de datos en Node.js.' },

  // --- Requisito 6 (Node.js Júnior - 2) ---
  { id_traducao_conteudo: '01a04468-206c-72fe-97ab-5a3a8e6ce0b7', tabela: 'requisito_badge', coluna: 'id_traducao_requisito', pt: 'Persistência de Dados com ORM', en: 'Data Persistence with ORM', es: 'Persistencia de Datos con ORM' },
  { id_traducao_conteudo: '01a04468-206c-72fe-97ab-5dff2d80ccbf', tabela: 'requisito_badge', coluna: 'id_traducao_subtitulo_req', pt: 'Mapeamento de modelos e operações CRUD', en: 'Model mapping and CRUD operations', es: 'Mapeo de modelos y operaciones CRUD' },
  { id_traducao_conteudo: '01a04468-206c-72fe-97ab-61d966cdca16', tabela: 'requisito_badge', coluna: 'id_traducao_descritivo_req', pt: 'Demonstrar persistência de dados em base relacional usando Sequelize ou similar.', en: 'Demonstrate relational data persistence using Sequelize or similar.', es: 'Demostrar persistencia de datos relacionales usando Sequelize o similar.' },

  // --- Requisito 7 (Badge 3: Sénior Low Code) ---
  { id_traducao_conteudo: '01a04468-206c-72fe-97ab-649570d11f21', tabela: 'requisito_badge', coluna: 'id_traducao_requisito', pt: 'Arquitetura Avançada em Low Code', en: 'Advanced Architecture in Low Code', es: 'Arquitectura Avanzada en Low Code' },
  { id_traducao_conteudo: '01a04468-206c-72fe-97ab-6b2a8460953d', tabela: 'requisito_badge', coluna: 'id_traducao_subtitulo_req', pt: 'Desenvolvimento e design de soluções empresariais escaláveis', en: 'Development and design of scalable enterprise solutions', es: 'Desarrollo y diseño de soluciones empresariales escalables' },
  { id_traducao_conteudo: '01a04468-206c-72fe-97ab-6c2c09eedf5a', tabela: 'requisito_badge', coluna: 'id_traducao_descritivo_req', pt: 'Apresentar arquitetura completa de uma aplicação corporativa com integrações complexas.', en: 'Submit full enterprise application architecture with complex integrations.', es: 'Presentar arquitectura completa de una aplicación corporativa con integraciones complejas.' },

  // --- Requisito 8 (Badge 4: Especialista Low Code) ---
  { id_traducao_conteudo: '01a04468-206c-72fe-97ab-7084da92009a', tabela: 'requisito_badge', coluna: 'id_traducao_requisito', pt: 'Otimização e Governação Low Code', en: 'Optimization and Governance in Low Code', es: 'Optimización y Gobernanza Low Code' },
  { id_traducao_conteudo: '01a04468-206d-7166-ad7a-9d733d432c90', tabela: 'requisito_badge', coluna: 'id_traducao_subtitulo_req', pt: 'Garantia de boas práticas, segurança e auditoria', en: 'Ensuring best practices, security and auditing', es: 'Garantía de buenas prácticas, seguridad y auditoría' },
  { id_traducao_conteudo: '01a04468-206d-7166-ad7a-a36c83bd7bd7', tabela: 'requisito_badge', coluna: 'id_traducao_descritivo_req', pt: 'Demonstrar liderança técnica e governança sobre pipelines de entrega Low Code.', en: 'Demonstrate technical leadership and governance over Low Code delivery pipelines.', es: 'Demostrar liderazgo técnico y gobernanza sobre pipelines de entrega Low Code.' },

  // --- Requisito 9 (Badge 5: Master Low Code) ---
  { id_traducao_conteudo: '01a04468-206d-7166-ad7a-a631783402c2', tabela: 'requisito_badge', coluna: 'id_traducao_requisito', pt: 'Inovação e Estratégia Tecnológica Low Code', en: 'Innovation and Strategic Low Code', es: 'Innovación y Estrategia Tecnológica Low Code' },
  { id_traducao_conteudo: '01a04468-206d-7166-ad7a-a84bd1a1ebaa', tabela: 'requisito_badge', coluna: 'id_traducao_subtitulo_req', pt: 'Transformação digital com soluções de alto impacto', en: 'Digital transformation with high-impact solutions', es: 'Transformación digital con soluciones de alto impacto' },
  { id_traducao_conteudo: '01a04468-206d-7166-ad7a-ada13b347af1', tabela: 'requisito_badge', coluna: 'id_traducao_descritivo_req', pt: 'Evidenciar mentoria, inovação de processos e impacto estratégico a nível organizacional.', en: 'Provide evidence of mentoring, process innovation and strategic organizational impact.', es: 'Evidenciar mentoría, innovación de procesos e impacto estratégico a nivel organizacional.' }
];

const REQUISITOS_BASE = [
  {
    id_requisito: 5,
    id_badge: '019f618c-7c24-72aa-9b25-5045e74284b1',
    id_traducao_requisito: '01a04468-206c-72fe-97ab-4d72a6c23b1b',
    id_traducao_subtitulo_req: '01a04468-206c-72fe-97ab-524147ec2bbc',
    id_traducao_descritivo_req: '01a04468-206c-72fe-97ab-5528e0fff196',
    obrigatoriedade_req: true,
    requisitoAtivo: true
  },
  {
    id_requisito: 6,
    id_badge: '019f618c-7c24-72aa-9b25-5045e74284b1',
    id_traducao_requisito: '01a04468-206c-72fe-97ab-5a3a8e6ce0b7',
    id_traducao_subtitulo_req: '01a04468-206c-72fe-97ab-5dff2d80ccbf',
    id_traducao_descritivo_req: '01a04468-206c-72fe-97ab-61d966cdca16',
    obrigatoriedade_req: true,
    requisitoAtivo: true
  },
  {
    id_requisito: 7,
    id_badge: '019e44e0-10ed-77fd-b037-e95c977b8bec',
    id_traducao_requisito: '01a04468-206c-72fe-97ab-649570d11f21',
    id_traducao_subtitulo_req: '01a04468-206c-72fe-97ab-6b2a8460953d',
    id_traducao_descritivo_req: '01a04468-206c-72fe-97ab-6c2c09eedf5a',
    obrigatoriedade_req: true,
    requisitoAtivo: true
  },
  {
    id_requisito: 8,
    id_badge: '019e44e3-98ed-772f-9348-0828fe8c6a20',
    id_traducao_requisito: '01a04468-206c-72fe-97ab-7084da92009a',
    id_traducao_subtitulo_req: '01a04468-206d-7166-ad7a-9d733d432c90',
    id_traducao_descritivo_req: '01a04468-206d-7166-ad7a-a36c83bd7bd7',
    obrigatoriedade_req: true,
    requisitoAtivo: true
  },
  {
    id_requisito: 9,
    id_badge: '019e44e5-025a-753f-9992-1762fc1d1fa5',
    id_traducao_requisito: '01a04468-206d-7166-ad7a-a631783402c2',
    id_traducao_subtitulo_req: '01a04468-206d-7166-ad7a-a84bd1a1ebaa',
    id_traducao_descritivo_req: '01a04468-206d-7166-ad7a-ada13b347af1',
    obrigatoriedade_req: true,
    requisitoAtivo: true
  },
  {
    id_requisito: 201,
    id_badge: '019f618c-7c24-72aa-9b25-019f618c0002',
    id_traducao_requisito: '019f618c-7c24-72aa-9b25-019f618c1005',
    id_traducao_subtitulo_req: '019f618c-7c24-72aa-9b25-019f618c1005',
    id_traducao_descritivo_req: '019f618c-7c24-72aa-9b25-019f618c1005',
    obrigatoriedade_req: true,
    requisitoAtivo: true
  },
  {
    id_requisito: 202,
    id_badge: '019f618c-7c24-72aa-9b25-019f618c0003',
    id_traducao_requisito: '019f618c-7c24-72aa-9b25-019f618c1006',
    id_traducao_subtitulo_req: '019f618c-7c24-72aa-9b25-019f618c1006',
    id_traducao_descritivo_req: '019f618c-7c24-72aa-9b25-019f618c1006',
    obrigatoriedade_req: true,
    requisitoAtivo: true
  }
];

// Lista dos restantes badges (React, Vue, Django, TensorFlow, etc.) a partir do id_requisito 10
const OTHER_BADGES_DATA = [
  { id: '019f618c-7c24-72aa-9b25-1b358e57f113', name: 'React Júnior' },
  { id: '019f618c-7c24-72aa-9b25-27daf1067b64', name: 'React Intermédio' },
  { id: '019f618c-7c24-72aa-9b25-31f4f4958640', name: 'Vue Júnior' },
  { id: '019f618c-7c24-72aa-9b25-3e2695b353ff', name: 'Vue Intermédio' },
  { id: '019f618c-7c24-72aa-9b25-5dc28b60d0a8', name: 'Node.js Intermédio' },
  { id: '019f618c-7c24-72aa-9b25-6a1589c55e0b', name: 'Python Django Júnior' },
  { id: '019f618c-7c24-72aa-9b25-7486075e886d', name: 'Python Django Intermédio' },
  { id: '019f618c-7c24-72aa-9b25-8b1b5817a056', name: 'TensorFlow Júnior' },
  { id: '019f618c-7c24-72aa-9b25-969725f11dff', name: 'TensorFlow Intermédio' },
  { id: '019f618c-7c24-72aa-9b25-a3672ebef5a4', name: 'PyTorch Júnior' },
  { id: '019f618c-7c24-72aa-9b25-ac76e3076219', name: 'PyTorch Intermédio' },
  { id: '019f618c-7c24-72aa-9b25-c27e7db059f7', name: 'Apache Spark Júnior' },
  { id: '019f618c-7c24-72aa-9b25-cdd12fe33a7d', name: 'Apache Spark Intermédio' },
  { id: '019f618c-7c24-72aa-9b25-da8feb35536b', name: 'Data Pipelines Júnior' },
  { id: '019f618c-7c24-72aa-9b25-e5b83594a20c', name: 'Data Pipelines Intermédio' },
  { id: '019f618c-7c24-72aa-9b25-f8d9c8afe7f6', name: 'Web Pen Testing Júnior' },
  { id: '019f618c-7c24-72aa-9b26-04623c4abf60', name: 'Web Pen Testing Intermédio' },
  { id: '019f618c-7c24-72aa-9b26-12109b2dcb31', name: 'Network Pen Testing Júnior' },
  { id: '019f618c-7c24-72aa-9b26-1f0d9a957100', name: 'Network Pen Testing Intermédio' },
  { id: '019f618c-7c24-72aa-9b26-3172f3d684d7', name: 'Firewall Config Júnior' },
  { id: '019f618c-7c24-72aa-9b26-3eca1a9ce184', name: 'Firewall Config Intermédio' },
  { id: '019f618c-7c24-72aa-9b26-4915a6032f48', name: 'Intrusion Detection Júnior' },
  { id: '019f618c-7c24-72aa-9b26-54adb5036d59', name: 'Intrusion Detection Intermédio' },
  { id: '019f618c-7c24-72aa-9b26-6a8c5d543cf5', name: 'AWS Cloud Practitioner Júnior' },
  { id: '019f618c-7c24-72aa-9b26-755f6ff3e899', name: 'AWS Cloud Practitioner Intermédio' },
  { id: '019f618c-7c24-72aa-9b26-83d627700248', name: 'AWS Solutions Architect Júnior' },
  { id: '019f618c-7c24-72aa-9b26-8e0757dd0caa', name: 'AWS Solutions Architect Intermédio' },
  { id: '019f618c-b3cb-7618-9eb9-0c16bfba52f4', name: 'Azure Fundamentals Júnior' },
  { id: '019f618c-b3cb-7618-9eb9-1a0fe13f00b2', name: 'Azure Fundamentals Intermédio' },
  { id: '019f618c-b3cb-7618-9eb9-2404b2162d8a', name: 'Azure Administrator Júnior' },
  { id: '019f618c-b3cb-7618-9eb9-3329bedd11d0', name: 'Azure Administrator Intermédio' },
  { id: '019f618c-b3cb-7618-9eb9-4789761207d7', name: 'Jenkins Pipelines Júnior' },
  { id: '019f618c-b3cb-7618-9eb9-512cbf6599d3', name: 'Jenkins Pipelines Intermédio' },
  { id: '019f618c-b3cb-7618-9eb9-5c03e5e28b1d', name: 'GitHub Actions Júnior' },
  { id: '019f618c-b3cb-7618-9eb9-6a0a6cb89c5a', name: 'GitHub Actions Intermédio' },
  { id: '019f618c-b3cb-7618-9eb9-7fd6a6069e57', name: 'Terraform Júnior' },
  { id: '019f618c-b3cb-7618-9eb9-89793e886e5b', name: 'Terraform Intermédio' },
  { id: '019f618c-b3cb-7618-9eb9-94f713b1c7b4', name: 'Ansible Júnior' },
  { id: '019f618c-b3cb-7618-9eb9-a031e3350f3c', name: 'Ansible Intermédio' },
  { id: '019f618c-b3cb-7618-9eb9-b54c0de8c894', name: 'Swift UI Júnior' },
  { id: '019f618c-b3cb-7618-9eb9-c07999aff916', name: 'Swift UI Intermédio' },
  { id: '019f618c-b3cb-7618-9eb9-cc0e157d2627', name: 'Objective-C Júnior' },
  { id: '019f618c-b3cb-7618-9eb9-d978f037edfd', name: 'Objective-C Intermédio' },
  { id: '019f618c-b3cb-7618-9eb9-ef91029c1040', name: 'Kotlin Júnior' },
  { id: '019f618c-b3cb-7618-9eb9-fb9869dd88da', name: 'Kotlin Intermédio' },
  { id: '019f618c-b3cb-7618-9eba-060fce761de3', name: 'Java Júnior' },
  { id: '019f618c-b3cb-7618-9eba-108c1053c032', name: 'Java Intermédio' },
  { id: '019f618c-b3cb-7618-9eba-26a9de43cc56', name: 'Selenium Júnior' },
  { id: '019f618c-b3cb-7618-9eba-312b0e6e4bf2', name: 'Selenium Intermédio' },
  { id: '019f618c-b3cb-7618-9eba-3e393a116ec7', name: 'Cypress Júnior' },
  { id: '019f618c-b3cb-7618-9eba-49301697939c', name: 'Cypress Intermédio' },
  { id: '019f618c-b3cb-7618-9eba-5df114766503', name: 'Test Case Design Júnior' },
  { id: '019f618c-b3cb-7618-9eba-6a1983c39191', name: 'Test Case Design Intermédio' },
  { id: '019f618c-b3cb-7618-9eba-76093e41b244', name: 'Exploratory Testing Júnior' },
  { id: '019f618c-b3cb-7618-9eba-80257fff5680', name: 'Exploratory Testing Intermédio' },
  { id: '019f618c-b3cb-7618-9eba-969ea549fd06', name: 'Mindfulness Júnior' },
  { id: '019f618c-fbf3-732b-8945-2746eb23cca9', name: 'Mindfulness Intermédio' },
  { id: '019f618c-fbf3-732b-8945-33941a184dcf', name: 'Stress Management Júnior' },
  { id: '019f618c-fbf3-732b-8945-3fc54a5a82ca', name: 'Stress Management Intermédio' },
  { id: '019f618c-fbf3-732b-8945-51d42f380361', name: 'Office Ergonomics Júnior' },
  { id: '019f618c-fbf3-732b-8945-5ed90c103857', name: 'Office Ergonomics Intermédio' },
  { id: '019f618c-fbf3-732b-8945-69bacdd31186', name: 'Remote Setup Júnior' },
  { id: '019f618c-fbf3-732b-8945-757b1982353d', name: 'Remote Setup Intermédio' },
  { id: '019f618c-fbf3-732b-8945-89120846c074', name: 'Team Management Júnior' },
  { id: '019f618c-fbf3-732b-8945-945f7e92b09d', name: 'Team Management Intermédio' },
  { id: '019f618c-fbf3-732b-8945-a139e5d283ea', name: 'Conflict Resolution Júnior' },
  { id: '019f618c-fbf3-732b-8945-aee839537230', name: 'Conflict Resolution Intermédio' },
  { id: '019f618c-fbf3-732b-8945-c2b2d39a1416', name: 'Agile Methodologies Júnior' },
  { id: '019f618c-fbf3-732b-8945-cd11757d9be8', name: 'Agile Methodologies Intermédio' },
  { id: '019f618c-fbf3-732b-8945-d8e91e02c96f', name: 'Scrum Master Júnior' },
  { id: '019f618c-fbf3-732b-8945-e7c16a86c6da', name: 'Scrum Master Intermédio' },
  { id: '019f618c-fbf3-732b-8945-f9021fe6c907', name: 'Compensation Structuring Júnior' },
  { id: '019f618c-fbf3-732b-8946-06d902341ea3', name: 'Compensation Structuring Intermédio' },
  { id: '019f618c-fbf3-732b-8946-133c2375b019', name: 'Payroll Processing Júnior' },
  { id: '019f618c-fbf3-732b-8946-1fc4235bc7bf', name: 'Payroll Processing Intermédio' },
  { id: '019f618c-fbf3-732b-8946-31d95356ae42', name: 'Health Plans Júnior' },
  { id: '019f618c-fbf3-732b-8946-3cae15380f50', name: 'Health Plans Intermédio' },
  { id: '019f618c-fbf3-732b-8946-49d80ebdd867', name: 'Retirement Plans Júnior' },
  { id: '019f618c-fbf3-732b-8946-55d9a6d7c81b', name: 'Retirement Plans Intermédio' }
];

// UUIDs pré-alocados de uuids.txt (linhas 16 a 252)
const ALLOCATED_UUIDS = [
  '01a04468-206d-7166-ad7a-b317637290c0', '01a04468-206d-7166-ad7a-b68d23ae7cef', '01a04468-206d-7166-ad7a-bb292f2d4500',
  '01a04468-206d-7166-ad7a-be602eda5a71', '01a04468-206d-7166-ad7a-c26f8ad60b94', '01a04468-206d-7166-ad7a-c6ead980e986',
  '01a04468-206d-7166-ad7a-cbfaa1e6d137', '01a04468-206d-7166-ad7a-cc6b85248f11', '01a04468-206d-7166-ad7a-d3525197f54c',
  '01a04468-206d-7166-ad7a-d79729632e52', '01a04468-206d-7166-ad7a-d810a1b831d1', '01a04468-206d-7166-ad7a-ddfb2da9d0b5',
  '01a04468-206d-7166-ad7a-e03a53736ceb', '01a04468-206d-7166-ad7a-e4a936c83e76', '01a04468-206d-7166-ad7a-e855147ce8ea',
  '01a04468-206d-7166-ad7a-ecaea029d8c3', '01a04468-206d-7166-ad7a-f0301d371f8a', '01a04468-206d-7166-ad7a-f73b6d5c5b01',
  '01a04468-206d-7166-ad7a-fb031934f0fb', '01a04468-206d-7166-ad7a-fda733470235', '01a04468-206d-7166-ad7b-021884baf407',
  '01a04468-206d-7166-ad7b-04b6e634769c', '01a04468-206d-7166-ad7b-0961745bb385', '01a04468-206d-7166-ad7b-0d70dec2b986',
  '01a04468-206d-7166-ad7b-135fa4851616', '01a04468-206d-7166-ad7b-168d4c6295a3', '01a04468-206d-7166-ad7b-1b775d4fa1cd',
  '01a04468-206d-7166-ad7b-1cfc707577e8', '01a04468-206d-7166-ad7b-2073c86bb8b7', '01a04468-206d-7166-ad7b-24c877e75de9',
  '01a04468-206d-7166-ad7b-2a90db5270f4', '01a04468-206d-7166-ad7b-2f976fd8a129', '01a04468-206d-7166-ad7b-337c91ca96c8',
  '01a04468-206d-7166-ad7b-37d931c648e5', '01a04468-206d-7166-ad7b-3a11c88166a0', '01a04468-206d-7166-ad7b-3c86cf6cd1a9',
  '01a04468-206d-7166-ad7b-40194cd541fb', '01a04468-206d-7166-ad7b-4633f02624a9', '01a04468-206d-7166-ad7b-4ad1f3e743fc',
  '01a04468-206d-7166-ad7b-4d0e7d835a54', '01a04468-206d-7166-ad7b-526869582a84', '01a04468-206d-7166-ad7b-56aa8e2b0e85',
  '01a04468-206d-7166-ad7b-58c561812513', '01a04468-206d-7166-ad7b-5dd4e0b7f910', '01a04468-206d-7166-ad7b-6012915c2f76',
  '01a04468-206d-7166-ad7b-66d12ddcdbbb', '01a04468-206d-7166-ad7b-6b98217e1a14', '01a04468-206d-7166-ad7b-6c90c43aa092',
  '01a04468-206d-7166-ad7b-719f31849829', '01a04468-206d-7166-ad7b-7628806ff86b', '01a04468-206d-7166-ad7b-78aa9701a490',
  '01a04468-206d-7166-ad7b-7c4d631cd546', '01a04468-206d-7166-ad7b-8325a2fb1177', '01a04468-206d-7166-ad7b-844f26cc0c20',
  '01a04468-206d-7166-ad7b-88b2af061ee7', '01a04468-206d-7166-ad7b-8eb538331ba8', '01a04468-206d-7166-ad7b-9120e54ca444',
  '01a04468-206d-7166-ad7b-977fd22f4436', '01a04468-206d-7166-ad7b-98a77a6aec17', '01a04468-206d-7166-ad7b-9dbec0969750',
  '01a04468-206d-7166-ad7b-a1ee8923de77', '01a04468-206d-7166-ad7b-a71951ff3b70', '01a04468-206d-7166-ad7b-aa1f89f1c741',
  '01a04468-206d-7166-ad7b-ac02660227d6', '01a04468-206d-7166-ad7b-b03214a86b2d', '01a04468-206d-7166-ad7b-b57af9ee5864',
  '01a04468-206d-7166-ad7b-ba205001b56e', '01a04468-206d-7166-ad7b-bfe238dfa07e', '01a04468-206d-7166-ad7b-c07f20ccda8f',
  '01a04468-206d-7166-ad7b-c77d604d12af', '01a04468-206d-7166-ad7b-c9af4b409166', '01a04468-206d-7166-ad7b-ccf0d20ae976',
  '01a04468-206d-7166-ad7b-d186f83c786b', '01a04468-206d-7166-ad7b-d5a43759c552', '01a04468-206d-7166-ad7b-db9ce0ff8c11',
  '01a04468-206d-7166-ad7b-dc1dd8d81a48', '01a04468-206d-7166-ad7b-e195a60a8cf2', '01a04468-206d-7166-ad7b-e674c8bc2cd4',
  '01a04468-206d-7166-ad7b-ea59df9a15bd', '01a04468-206d-7166-ad7b-ed387e3d10bc', '01a04468-206d-7166-ad7b-f33ded0ea2ff',
  '01a04468-206d-7166-ad7b-f47d29498113', '01a04468-206d-7166-ad7b-f861e5c7b92f', '01a04468-206d-7166-ad7b-ff56d9a2eff1',
  '01a04468-206d-7166-ad7c-02898291769c', '01a04468-3f18-7718-92ce-13cfec29eec8', '01a04468-3f18-7718-92ce-16a069c31678',
  '01a04468-3f18-7718-92ce-1a1c904c8551', '01a04468-3f18-7718-92ce-1cc329480e6b', '01a04468-3f18-7718-92ce-2134c7974945',
  '01a04468-3f18-7718-92ce-26a73e2d8d4a', '01a04468-3f18-7718-92ce-2be97ea1977e', '01a04468-3f18-7718-92ce-2d3c69cd3067',
  '01a04468-3f18-7718-92ce-32f19f9a4f8a', '01a04468-3f18-7718-92ce-340458f2cb1d', '01a04468-3f18-7718-92ce-3beade15243a',
  '01a04468-3f18-7718-92ce-3de8e708b855', '01a04468-3f18-7718-92ce-400214411a2d', '01a04468-3f18-7718-92ce-455c25a60134',
  '01a04468-3f18-7718-92ce-49d7ecee0110', '01a04468-3f18-7718-92ce-4f18962e53d5', '01a04468-3f18-7718-92ce-5205e9bd22e8',
  '01a04468-3f18-7718-92ce-57dcfbf383b2', '01a04468-3f18-7718-92ce-5a74bc5bfa8d', '01a04468-3f18-7718-92ce-5edb4af9c7b7',
  '01a04468-3f18-7718-92ce-61bf31efbb42', '01a04468-3f18-7718-92ce-66cf0e3dac84', '01a04468-3f18-7718-92ce-6a005caebdcc',
  '01a04468-3f18-7718-92ce-6ffdc89c2fb7', '01a04468-3f18-7718-92ce-701daf4b39a8', '01a04468-3f18-7718-92ce-77844abd5784',
  '01a04468-3f18-7718-92ce-784efad2af03', '01a04468-3f18-7718-92ce-7c10488e5cc6', '01a04468-3f18-7718-92ce-8094b616bcf4',
  '01a04468-3f18-7718-92ce-8604ed301514', '01a04468-3f18-7718-92ce-89af3eaf2a1b', '01a04468-3f18-7718-92ce-8f09893f2d10',
  '01a04468-3f18-7718-92ce-93fc549b93c6', '01a04468-3f18-7718-92ce-94d00567bf51', '01a04468-3f18-7718-92ce-99838de02652',
  '01a04468-3f18-7718-92ce-9cc3d0120d63', '01a04468-3f18-7718-92ce-a08a4db5c23a', '01a04468-3f18-7718-92ce-a432d6affb7d',
  '01a04468-3f19-72d4-b08c-95f1b0ad6176', '01a04468-3f19-72d4-b08c-9b3dc0f35f46', '01a04468-3f19-72d4-b08c-9fa637e57449',
  '01a04468-3f19-72d4-b08c-a2120dad3177', '01a04468-3f19-72d4-b08c-a527ae730646', '01a04468-3f19-72d4-b08c-abbfa4f1e801',
  '01a04468-3f19-72d4-b08c-af80936c47cd', '01a04468-3f19-72d4-b08c-b31d3d8d5219', '01a04468-3f19-72d4-b08c-b4efb16ea1ef',
  '01a04468-3f19-72d4-b08c-bb077378fff0', '01a04468-3f19-72d4-b08c-bd02680bfe15', '01a04468-3f19-72d4-b08c-c1cfe0e56bc3',
  '01a04468-3f19-72d4-b08c-c7ea03c82d33', '01a04468-3f19-72d4-b08c-c9cd903d94e8', '01a04468-3f19-72d4-b08c-cd969a17a2e7',
  '01a04468-3f19-72d4-b08c-d13d7067a980', '01a04468-3f19-72d4-b08c-d54f43dceeac', '01a04468-3f19-72d4-b08c-d8893d716701',
  '01a04468-3f19-72d4-b08c-dc58252b4278', '01a04468-3f19-72d4-b08c-e0c71622da3a', '01a04468-3f19-72d4-b08c-e5cab4ffe738',
  '01a04468-3f19-72d4-b08c-e9a64d06ec4c', '01a04468-3f19-72d4-b08c-ee822eba4e55', '01a04468-3f19-72d4-b08c-f3a842f1b02f',
  '01a04468-3f19-72d4-b08c-f7e2905b9a28', '01a04468-3f19-72d4-b08c-fb1382390588', '01a04468-3f19-72d4-b08c-fe00e9ac89cd',
  '01a04468-3f19-72d4-b08d-00a680aa8698', '01a04468-3f19-72d4-b08d-076fa6777103', '01a04468-3f19-72d4-b08d-0a3a2ccfbfa8',
  '01a04468-3f19-72d4-b08d-0cb2b47e1c76', '01a04468-3f19-72d4-b08d-11d6763ffdaf', '01a04468-3f19-72d4-b08d-15faa65b78f0',
  '01a04468-3f19-72d4-b08d-19de6eb6549b', '01a04468-3f19-72d4-b08d-1e37d5da0456', '01a04468-3f19-72d4-b08d-2282c00bcc2b',
  '01a04468-3f19-72d4-b08d-27519e3d346e', '01a04468-3f19-72d4-b08d-2975e2dae295', '01a04468-3f19-72d4-b08d-2dbacd0c6d28',
  '01a04468-3f19-72d4-b08d-30632bf26b88', '01a04468-3f19-72d4-b08d-37ec951c0523', '01a04468-3f19-72d4-b08d-39be4def4423',
  '01a04468-3f19-72d4-b08d-3fe69e0d3cb5', '01a04468-3f19-72d4-b08d-4169be665580', '01a04468-3f19-72d4-b08d-47b0114aa7fd',
  '01a04468-3f19-72d4-b08d-4ae6ca5b60e0', '01a04468-3f19-72d4-b08d-4fb45173d4e9', '01a04468-3f19-72d4-b08d-50f5c160035c',
  '01a04468-3f19-72d4-b08d-574570ab6a36', '01a04468-3f19-72d4-b08d-5a1daa9b90e0', '01a04468-3f19-72d4-b08d-5d098e6a8df0',
  '01a04468-3f19-72d4-b08d-61b44dfd034b', '01a04468-3f19-72d4-b08d-67ab7902525e', '01a04468-3f19-72d4-b08d-69d21bed80f8',
  '01a04468-3f19-72d4-b08d-6cca97421689', '01a04468-3f19-72d4-b08d-728bfcef25bd', '01a04468-3f19-72d4-b08d-774bafcc7ffe',
  '01a04468-3f19-72d4-b08d-78ca47370c54', '01a04468-3f19-72d4-b08d-7f3fb4d09d82', '01a04468-3f19-72d4-b08d-83e7dc6e166c',
  '01a04468-3f19-72d4-b08d-840cf700fe01', '01a04468-3f19-72d4-b08d-8aebc0e999f3', '01a04468-58d7-733b-833c-bffc2af8a80e',
  '01a04468-58d7-733b-833c-c25d97ed9936', '01a04468-58d7-733b-833c-c557bdda3f2b', '01a04468-58d7-733b-833c-c91f44655419',
  '01a04468-58d7-733b-833c-ccf39c96fec3', '01a04468-58d7-733b-833c-d3c977c6adbb', '01a04468-58d7-733b-833c-d570f1020513',
  '01a04468-58d7-733b-833c-d90936e64f45', '01a04468-58d7-733b-833c-dc8abbc0b39d', '01a04468-58d7-733b-833c-e02859eed393',
  '01a04468-58d7-733b-833c-e493ad8639b8', '01a04468-58d7-733b-833c-eb40bf8ee89d', '01a04468-58d7-733b-833c-ec4bb9f43312',
  '01a04468-58d7-733b-833c-f384fc76c845', '01a04468-58d7-733b-833c-f52513a89c54', '01a04468-58d7-733b-833c-f9426a3df57e',
  '01a04468-58d7-733b-833c-ffb1a32ceeb2', '01a04468-58d7-733b-833d-0130ab3aa044', '01a04468-58d7-733b-833d-05b0eb9faa14',
  '01a04468-58d7-733b-833d-08ed5a429660', '01a04468-58d7-733b-833d-0f818b7bedcf', '01a04468-58d7-733b-833d-10b0ef70f6d1',
  '01a04468-58d7-733b-833d-14674acaa992', '01a04468-58d7-733b-833d-1a68aaea0e7c', '01a04468-58d7-733b-833d-1dcd8c23e2a6',
  '01a04468-58d7-733b-833d-2008c1707355', '01a04468-58d7-733b-833d-266677ad43a9', '01a04468-58d7-733b-833d-294fc6f60411',
  '01a04468-58d7-733b-833d-2ef28238f28b', '01a04468-58d7-733b-833d-32befc558dda', '01a04468-58d7-733b-833d-34efd952bb90',
  '01a04468-58d7-733b-833d-3aff13e809b6', '01a04468-58d7-733b-833d-3c449678d2ed', '01a04468-58d7-733b-833d-40c595a1ffbc',
  '01a04468-58d7-733b-833d-458f74a29bc4', '01a04468-58d7-733b-833d-4b613e18b0b3', '01a04468-58d7-733b-833d-4cfc400c2ecf',
  '01a04468-58d7-733b-833d-518a0323ff4e', '01a04468-58d7-733b-833d-54c60446da1c', '01a04468-58d7-733b-833d-5b684e29c305',
  '01a04468-58d7-733b-833d-5ef4ffde586e', '01a04468-58d7-733b-833d-632a668172af', '01a04468-58d7-733b-833d-67ecf3977a6a',
  '01a04468-58d7-733b-833d-6ae9fd2e19f5', '01a04468-58d7-733b-833d-6d095f3ada73', '01a04468-58d7-733b-833d-73b2b5a4b24b',
  '01a04468-58d7-733b-833d-75ec4048a323', '01a04468-58d7-733b-833d-78ce490f5543', '01a04468-58d7-733b-833d-7d704f549bf1',
  '01a04468-58d7-733b-833d-80066eb7d8a3', '01a04468-58d7-733b-833d-8452509323be', '01a04468-58d7-733b-833d-89271b0a902d'
];

let reqIdCounter = 10;
let uuidIdx = 0;

for (const b of OTHER_BADGES_DATA) {
  const titUuid = ALLOCATED_UUIDS[uuidIdx++];
  const subUuid = ALLOCATED_UUIDS[uuidIdx++];
  const descUuid = ALLOCATED_UUIDS[uuidIdx++];

  TRADUCOES_REQUISITOS_NOVOS.push(
    { id_traducao_conteudo: titUuid, tabela: 'requisito_badge', coluna: 'id_traducao_requisito', pt: `Requisito Principal - ${b.name}`, en: `Main Requirement - ${b.name}`, es: `Requisito Principal - ${b.name}` },
    { id_traducao_conteudo: subUuid, tabela: 'requisito_badge', coluna: 'id_traducao_subtitulo_req', pt: `Demonstração de competência prática em ${b.name}`, en: `Practical competency demonstration in ${b.name}`, es: `Demostración de competencia práctica en ${b.name}` },
    { id_traducao_conteudo: descUuid, tabela: 'requisito_badge', coluna: 'id_traducao_descritivo_req', pt: `Apresentar evidências concretas ou projetos que comprovem domínio no âmbito de ${b.name}.`, en: `Submit concrete evidence or projects demonstrating mastery in ${b.name}.`, es: `Presentar evidencias concretas o proyectos que demuestren dominio en el ámbito de ${b.name}.` }
  );

  REQUISITOS_BASE.push({
    id_requisito: reqIdCounter++,
    id_badge: b.id,
    id_traducao_requisito: titUuid,
    id_traducao_subtitulo_req: subUuid,
    id_traducao_descritivo_req: descUuid,
    obrigatoriedade_req: true,
    requisitoAtivo: true
  });
}

module.exports = {
  TRADUCOES_REQUISITOS_NOVOS,
  REQUISITOS_NOVOS: REQUISITOS_BASE
};
