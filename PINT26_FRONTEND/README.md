# SoftBadge - Portal Web (Frontend)

Aplicação web de gestão e acompanhamento de competências e *badges*, desenvolvida em React e Vite. Adapta a interface consoante o perfil ativo do utilizador autenticado.

## Perfis de Utilizador

Um utilizador com mais do que um perfil atribuído pode alternar entre vistas no cabeçalho da aplicação:

1. **Administrador (`ADMIN`)** - Gestão de utilizadores, *learning paths*, regras de *badges* especiais, parâmetros de SLA e estatísticas globais.
2. **Service Line Leader (`SLL`)** - Gestão das linhas de serviço e respetivas áreas, acompanhamento das equipas, fórum de avisos e decisão final sobre candidaturas e renovações.
3. **Talent Manager (`TM`)** - Pré-validação de candidaturas a *badges*, monitorização de indicadores de SLA e acompanhamento de consultores.
4. **Consultor (`CON`)** - Consulta de *learning paths* e *badges*, submissão de candidaturas com anexos de evidência, renovações e partilha pública de certificações.

## Funcionalidades Principais

- Cabeçalho unificado com notificações em tempo real, troca de perfil ativo, seleção de idioma (PT/EN/ES) e alternância de tema (claro/escuro).
- Gestão de *learning paths*, competências, marcos e associação a linhas de serviço.
- Listagem de utilizadores e candidaturas com filtros por estado, perfil e pesquisa.
- Internacionalização com `react-i18next` e estilização baseada em variáveis CSS para suporte a temas.

## Tecnologias

- React 19 + Vite
- Axios (comunicação com a REST API)
- Context API (sessão, perfil ativo, tema e idioma)
- `react-i18next`
- SweetAlert2

## Execução Local

Pré-requisitos: Node.js 18+ e backend (`PINT26_BACKEND`) ativo na porta `3000`.

```bash
npm install
npm run dev
```

A aplicação fica disponível em `http://localhost:3001`.

## Estrutura de Pastas

```text
src/
├── components/   # Layouts e componentes partilhados entre perfis
├── config/       # Configuração de navegação e rotas por perfil
├── context/      # Contexto global (autenticação, tema, idioma)
├── i18n/         # Dicionários de tradução (PT, EN, ES)
├── services/     # Cliente HTTP (Axios)
├── styles/       # Estilos globais e variáveis de tema
└── views/        # Vistas específicas por perfil (admin, sll, tm, consult)
```
