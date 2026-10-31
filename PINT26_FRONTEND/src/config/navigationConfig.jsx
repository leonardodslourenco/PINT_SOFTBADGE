/**
 * navigationConfig.jsx
 * ====================
 * Tabela mestre declarativa que define TODOS os menus do sistema SoftBadge.
 * Cada entrada especifica: chave, ícone SVG, label i18n, perfis autorizados
 * e o componente de conteúdo a renderizar.
 *
 * Dois modos de resolução de componente:
 *   - `component`       → Componente ÚNICO partilhado por todos os perfis autorizados.
 *   - `componentByRole` → Mapa { [ROLE]: Componente } para conteúdos diferentes por perfil.
 *
 * Campos especiais:
 *   - `isAction: true`  → Menu que não renderiza conteúdo mas executa uma ação (ex: seed).
 *
 * Guia rápido para a equipa:
 *   - Para dar acesso a um menu existente a um novo perfil: adicionar ROLE.X ao `rolesAllowed`.
 *   - Para criar um menu novo: criar componente em contents_universal/ e adicionar entrada aqui.
 *   - Para ter conteúdo diferente por perfil: usar `componentByRole` em vez de `component`.
 */
import { ROLE } from '../constants/roles';

// ─── Conteúdos Universais ──────────────────────────────────────────────────────
// Dashboards por perfil (componentByRole)
import HomeAdmin from '../views/contents_universal/HomeAdmin';
import HomeSll from '../views/contents_universal/HomeSll';
import HomeTm from '../views/contents_universal/HomeTm';
import HomeConsult from '../views/contents_universal/HomeConsult';

// Módulos partilhados (component único)
import UsersManagement from '../views/contents_universal/UsersManagement';
import GestaoLearningPath from '../views/contents_universal/GestaoLearningPath';
import SlaManagement from '../views/contents_universal/SlaManagement';
import SkillsManagement from '../views/contents_universal/SkillsManagement';
import SettingsMarco from '../views/contents_universal/SettingsMarco';
import MarcoConsult from '../views/contents_universal/MarcoConsult';
import SettingsEspecial from '../views/contents_universal/SettingsEspecial';
import FinalApprovalSll from '../views/contents_universal/FinalApprovalSll';
import ConsultSLL from '../views/contents_universal/ConsultSLL';
import PreApprovalTm from '../views/contents_universal/PreApprovalTm';
import ApplicationsConsult from '../views/contents_universal/ApplicationsConsult';
import AllApplicationsManagement from '../views/contents_universal/AllApplicationsManagement';
import RgpdManagement from '../views/contents_universal/RgpdManagement';
import ObjetivosConsult from '../views/contents_universal/ObjetivosConsult';

// Módulos com componentByRole
import BadgesManagement from '../views/contents_universal/BadgesManagement';
import BadgesConsult from '../views/contents_universal/BadgesConsult';
import BadgesList from '../views/contents_universal/BadgesList';
import EspecialManagement from '../views/contents_universal/EspecialManagement';
import EspecialConsult from '../views/contents_universal/EspecialConsult';
import EspecialList from '../views/contents_universal/EspecialList';
import MiniForumManagement from '../views/contents_universal/MiniForumManagement';
import NotificationsManagement from '../views/contents_universal/NotificationsManagement';
import ReportsManagement from '../views/contents_universal/ReportsManagement';
import SettingsAdmin from '../views/contents_universal/SettingsAdmin';
import SettingsConsult from '../views/contents_universal/SettingsConsult';
import SettingsTM from '../views/contents_universal/SettingsTM';
import SettingsSLL from '../views/contents_universal/SettingsSLL';
import RenewManagementAdmin from '../views/contents_universal/RenewManagementAdmin';
import RenewManagementConsult from '../views/contents_universal/RenewManagementConsult';
import RenewList from '../views/contents_universal/RenewList';
import RankingGeral from '../views/contents_universal/RankingGeral';

// ─── Ícones SVG ────────────────────────────────────────────────────────────────
const icons = {
  home: (
    <svg viewBox="0 0 24 24">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  users: (
    <svg viewBox="0 0 24 24">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  badges: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  ),
  lp: (
    <svg viewBox="0 0 24 24">
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M9 6h4a2 2 0 0 1 2 2v8a2 2 0 0 0 2 2h1" />
    </svg>
  ),
  sla: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  reports: (
    <svg viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="18" x2="8" y2="14" />
      <line x1="12" y1="18" x2="12" y2="11" />
      <line x1="16" y1="18" x2="16" y2="8" />
    </svg>
  ),
  miniforum: (
    <svg viewBox="0 0 24 24">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  notices: (
    <svg viewBox="0 0 24 24">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  skills: (
    <svg viewBox="0 0 24 24">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  settings: (
    <svg viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  rgpd: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  seed: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  finalApproval: (
    <svg viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="9 15 11 17 15 12" />
    </svg>
  ),
  preApproval: (
    <svg viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="9 15 11 17 15 12" />
    </svg>
  ),
  applications: (
    <svg viewBox="0 0 24 24">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  marcos: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 22h16" />
      <path d="M10 14.66V17c0 .55-.45 1-1 1H8c-.55 0-1 .45-1 1v1c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-1c0-.55-.45-1-1-1h-1c-.55 0-1-.45-1-1v-2.34" />
      <path d="M6 4h12a2 2 0 0 1 2 2v3a6 6 0 0 1-6 6h0a6 6 0 0 1-6-6V6a2 2 0 0 1 2-2z" />
    </svg>
  ),
  especiais: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polygon points="12 4.5 13.3 7.2 16.2 7.6 14.1 9.7 14.6 12.6 12 11.2 9.4 12.6 9.9 9.7 7.8 7.6 10.7 7.2 12 4.5" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  settingsEspecial: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  consultants: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <polyline points="17 11 19 13 23 9" />
    </svg>
  ),
  renewals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  ranking: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8m-4-4v4M6 4h12v4c0 3.314-2.686 6-6 6s-6-2.686-6-6V4z" />
      <path d="M6 6H3a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4h1M18 6h3a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4h-1" />
    </svg>
  ),
  goals: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
};

// ─── Configuração de Navegação ─────────────────────────────────────────────────
export const navigationConfig = [
  // ──────────── Menu Início (Dashboard) ────────────
  {
    key: 'home',
    labelKey: 'menuHome',
    icon: icons.home,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL, ROLE.TM, ROLE.CON],
    order: { [ROLE.ADMIN]: 1, [ROLE.SLL]: 1, [ROLE.TM]: 1, [ROLE.CON]: 1 },
    componentByRole: {
      [ROLE.ADMIN]: HomeAdmin,
      [ROLE.SLL]: HomeSll,
      [ROLE.TM]: HomeTm,
      [ROLE.CON]: HomeConsult,
    },
  },

  // ──────────── Gestão de Utilizadores ────────────
  {
    key: 'users',
    labelKey: 'menuUsers',
    icon: icons.users,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL],
    order: { [ROLE.ADMIN]: 2, [ROLE.SLL]: 2 },
    componentByRole: {
      [ROLE.ADMIN]: UsersManagement,
      [ROLE.SLL]: UsersManagement,
    },
  },

  // ──────────── Learning Paths ────────────
  {
    key: 'lp',
    labelKey: 'menuLearningPath',
    icon: icons.lp,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL],
    order: { [ROLE.ADMIN]: 3, [ROLE.SLL]: 4 },
    component: GestaoLearningPath,
  },

  // ──────────── Competências ────────────
  {
    key: 'skills',
    labelKey: 'menuSkills',
    icon: icons.skills,
    rolesAllowed: [ROLE.ADMIN],
    order: { [ROLE.ADMIN]: 4 },
    component: SkillsManagement,
  },

  // ──────────── Marcos (Admin) ────────────
  {
    key: 'marcos',
    labelKey: 'menuMarcos',
    icon: icons.marcos,
    rolesAllowed: [ROLE.ADMIN],
    order: { [ROLE.ADMIN]: 5 },
    component: SettingsMarco,
  },

  // ──────────── Badges Especiais (Gestão de Conquistas especiais) ────────────
  {
    key: 'especiais',
    labelKey: 'menuEspeciais',
    icon: icons.especiais,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL, ROLE.TM, ROLE.CON],
    order: { [ROLE.ADMIN]: 6, [ROLE.SLL]: 6, [ROLE.TM]: 3, [ROLE.CON]: 3 },
    componentByRole: {
      [ROLE.ADMIN]: EspecialManagement,
      [ROLE.SLL]: EspecialList,
      [ROLE.TM]: EspecialList,
      [ROLE.CON]: EspecialConsult,
    },
  },

  // ──────────── Regras de Badges Especiais (Admin) ────────────
  {
    key: 'settings_especial',
    labelKey: 'menuSettingsEspecial',
    icon: icons.settingsEspecial,
    rolesAllowed: [ROLE.ADMIN],
    order: { [ROLE.ADMIN]: 7 },
    component: SettingsEspecial,
  },

  // ──────────── Badges (Catálogo Geral de Badges) ────────────
  {
    key: 'badges',
    labelKey: 'menuBadges',
    icon: icons.badges,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL, ROLE.TM, ROLE.CON],
    order: { [ROLE.ADMIN]: 8, [ROLE.SLL]: 5, [ROLE.TM]: 2, [ROLE.CON]: 2 },
    componentByRole: {
      [ROLE.ADMIN]: BadgesList,
      [ROLE.SLL]: BadgesList,
      [ROLE.TM]: BadgesList,
      [ROLE.CON]: BadgesConsult,
    },
  },

  // ──────────── Gestão de Badges (Apenas Admin) ────────────
  {
    key: 'badges_management',
    labelKey: 'menuBadgesManagement',
    icon: icons.badges,
    rolesAllowed: [ROLE.ADMIN],
    order: { [ROLE.ADMIN]: 9 },
    component: BadgesManagement,
  },

  // ──────────── Candidaturas (Admin, SLL, TM) ────────────
  {
    key: 'allapps',
    labelKey: 'menuAllApplications',
    icon: icons.applications,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL, ROLE.TM],
    order: { [ROLE.ADMIN]: 10, [ROLE.SLL]: 8, [ROLE.TM]: 5 },
    component: AllApplicationsManagement,
  },

  // ──────────── Renovações ────────────
  {
    key: 'renewals',
    labelKey: 'menuRenewals',
    icon: icons.renewals,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL, ROLE.TM, ROLE.CON],
    order: { [ROLE.ADMIN]: 12, [ROLE.SLL]: 10, [ROLE.TM]: 8, [ROLE.CON]: 6 },
    componentByRole: {
      [ROLE.ADMIN]: RenewManagementAdmin,
      [ROLE.SLL]: RenewManagementAdmin,
      [ROLE.TM]: RenewList,
      [ROLE.CON]: RenewManagementConsult,
    },
  },

  // ──────────── Objetivos Pessoais (Consultor) ────────────
  {
    key: 'goals',
    labelKey: 'menuGoals',
    icon: icons.goals,
    rolesAllowed: [ROLE.CON],
    order: { [ROLE.CON]: 7 },
    component: ObjetivosConsult,
  },

  // ──────────── Ranking Geral ────────────
  {
    key: 'ranking',
    labelKey: 'menuRankingGeral',
    icon: icons.ranking,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL, ROLE.TM, ROLE.CON],
    order: { [ROLE.ADMIN]: 11, [ROLE.SLL]: 9, [ROLE.TM]: 7, [ROLE.CON]: 8 },
    component: RankingGeral,
  },

  // ──────────── SLA ────────────
  {
    key: 'sla',
    labelKey: 'menuSla',
    icon: icons.sla,
    rolesAllowed: [ROLE.ADMIN],
    order: { [ROLE.ADMIN]: 13 },
    component: SlaManagement,
  },

  // ──────────── Relatórios ────────────
  {
    key: 'reports',
    labelKey: 'menuReports',
    icon: icons.reports,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL, ROLE.TM],
    order: { [ROLE.ADMIN]: 14, [ROLE.SLL]: 11, [ROLE.TM]: 6 },
    componentByRole: {
      [ROLE.ADMIN]: ReportsManagement,
      [ROLE.SLL]: ReportsManagement,
      [ROLE.TM]: ReportsManagement,
    },
  },

  // ──────────── MiniFórum ────────────
  {
    key: 'miniforum',
    labelKey: 'menuMiniForum',
    icon: icons.miniforum,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL, ROLE.TM, ROLE.CON],
    order: { [ROLE.ADMIN]: 15, [ROLE.SLL]: 12, [ROLE.TM]: 9, [ROLE.CON]: 9 },
    component: MiniForumManagement,
  },

  // ──────────── Avisos & Notificações ────────────
  {
    key: 'notices',
    labelKey: 'menuNotices',
    icon: icons.notices,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL, ROLE.TM, ROLE.CON],
    order: { [ROLE.ADMIN]: 16, [ROLE.SLL]: 13, [ROLE.TM]: 10, [ROLE.CON]: 10 },
    component: NotificationsManagement,
  },

  // ──────────── RGPD & Privacidade ────────────
  {
    key: 'rgpd',
    labelKey: 'menuRgpd',
    icon: icons.rgpd,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL, ROLE.TM, ROLE.CON],
    order: { [ROLE.ADMIN]: 17, [ROLE.SLL]: 14, [ROLE.TM]: 11, [ROLE.CON]: 11 },
    component: RgpdManagement,
  },

  // ──────────── Definições ────────────
  {
    key: 'settings',
    labelKey: 'menuSettings',
    icon: icons.settings,
    rolesAllowed: [ROLE.ADMIN, ROLE.SLL, ROLE.TM, ROLE.CON],
    order: { [ROLE.ADMIN]: 18, [ROLE.SLL]: 15, [ROLE.TM]: 12, [ROLE.CON]: 12 },
    componentByRole: {
      [ROLE.ADMIN]: SettingsAdmin,
      [ROLE.SLL]: SettingsSLL,
      [ROLE.TM]: SettingsTM,
      [ROLE.CON]: SettingsConsult,
    },
  },

  // ──────────── Seed (Ação especial, sem conteúdo) ────────────
  {
    key: 'seed',
    labelKey: 'menuSeed',
    icon: icons.seed,
    rolesAllowed: [ROLE.ADMIN],
    order: { [ROLE.ADMIN]: 19 },
    isAction: true,
  },

  // ──────────── Consultores (SLL) ────────────
  {
    key: 'consultants',
    labelKey: 'menuConsultants',
    icon: icons.consultants,
    rolesAllowed: [ROLE.SLL],
    order: { [ROLE.SLL]: 3 },
    component: ConsultSLL,
  },

  // ──────────── Aprovação Final (SLL) ────────────
  {
    key: 'final',
    labelKey: 'menuFinalApproval',
    icon: icons.finalApproval,
    rolesAllowed: [ROLE.SLL],
    order: { [ROLE.SLL]: 7 },
    component: FinalApprovalSll,
  },

  // ──────────── Pré-Aprovação (TM) ────────────
  {
    key: 'pre',
    labelKey: 'menuPreApproval',
    icon: icons.preApproval,
    rolesAllowed: [ROLE.TM],
    order: { [ROLE.TM]: 4 },
    component: PreApprovalTm,
  },

  // ──────────── Candidaturas (Consultor) ────────────
  {
    key: 'apps',
    labelKey: 'menuApplications',
    icon: icons.applications,
    rolesAllowed: [ROLE.CON],
    order: { [ROLE.CON]: 5 },
    component: ApplicationsConsult,
  },

  // ──────────── Marcos Alcançados (Consultor) ────────────
  {
    key: 'marcos_consult',
    labelKey: 'menuMarcosConsult',
    icon: icons.marcos,
    rolesAllowed: [ROLE.CON],
    order: { [ROLE.CON]: 4 },
    component: MarcoConsult,
  }
];
