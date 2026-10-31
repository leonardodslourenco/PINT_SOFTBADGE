import { useTranslation } from 'react-i18next';
import { ROLE } from '../constants/roles';

export default function BaseContentGlobal({ user, activeRole }) {
  const { t } = useTranslation();
  const roleId = Number(activeRole);

  // Get color schemes per activeRole
  // 1 (Admin) -> dark blue/slate, 2 (SLL) -> teal/green, 3 (TM) -> purple, 4 (Consultor) -> blue
  const colorScheme = {
    [ROLE.ADMIN]: {
      bg: 'linear-gradient(135deg, #374151, #111827)',
      border: 'rgba(148, 163, 184, 0.35)',
      titleKey: 'adminTitle',
      subKey: 'adminSubtitle',
      fallbackTitle: 'Painel de Administração',
      fallbackSub: 'Gestão centralizada de utilizadores, configurações e métricas da plataforma.'
    },
    [ROLE.SLL]: {
      bg: 'linear-gradient(135deg, #0d9488, #0f766e)',
      border: 'rgba(13, 148, 136, 0.4)',
      titleKey: 'sllTitle',
      subKey: 'sllSubtitle',
      fallbackTitle: 'Painel Service Line Leader (SLL)',
      fallbackSub: 'Gestão de qualificações e atribuição final de badges para a linha de serviço.'
    },
    [ROLE.TM]: {
      bg: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
      border: 'rgba(124, 58, 237, 0.4)',
      titleKey: 'tmTitle',
      subKey: 'tmDashboardSubtitle',
      fallbackTitle: 'Painel Talent Manager',
      fallbackSub: 'Visão geral de progresso, candidaturas pendentes e engajamento dos consultores.'
    },
    [ROLE.CON]: {
      bg: 'linear-gradient(135deg, #0284c7, #0369a1)',
      border: 'rgba(2, 132, 199, 0.4)',
      titleKey: 'consultantTitle',
      subKey: 'consultantSub',
      fallbackTitle: 'Painel do Consultor',
      fallbackSub: 'Acompanhe os seus badges, conclua requisitos e submeta evidências para progredir.'
    }
  }[roleId] || {
    bg: 'linear-gradient(135deg, #64748b, #475569)',
    border: 'rgba(100, 116, 139, 0.4)',
    titleKey: 'dashboard',
    subKey: '',
    fallbackTitle: 'Dashboard',
    fallbackSub: ''
  };

  const titleText = t(colorScheme.titleKey, colorScheme.fallbackTitle);

  return (
    <div 
      className="mb-4 text-white p-3 p-md-4 rounded-4 shadow-sm position-relative overflow-hidden" 
      style={{ backgroundImage: colorScheme.bg, border: `1px solid ${colorScheme.border}` }}
    >
      <h4 className="fw-bold mb-1">{titleText}</h4>
      {colorScheme.subKey ? (
        <p className="mb-0 text-white-50 small">{t(colorScheme.subKey, colorScheme.fallbackSub)}</p>
      ) : colorScheme.fallbackSub ? (
        <p className="mb-0 text-white-50 small">{colorScheme.fallbackSub}</p>
      ) : null}
    </div>
  );
}
