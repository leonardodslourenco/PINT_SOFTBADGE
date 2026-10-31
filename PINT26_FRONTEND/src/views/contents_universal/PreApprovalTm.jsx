import { useTranslation } from 'react-i18next';
import ListagemPreApproval from '../../components/ListagemPreApproval';
import ContagemEstadoCandidaturas from '../../components/ContagemEstadoCandidaturas';

export default function PreApprovalTm() {
  const { t } = useTranslation();
  return (
    <div className="users-admin-container">
      {/* Title block */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1">{t('preApprovalTitle', 'Pré-Aprovação de Candidaturas')}</h3>
        <p className="text-muted small mb-0">{t('preApprovalSubtitle', 'Validação inicial de evidências e submissões efetuadas pelos consultores.')}</p>
      </div>

      {/* Status Count Mini Cards Component */}
      <ContagemEstadoCandidaturas />

      {/* Listagem de Pré-Aprovação wrapped inside card style */}
      <div className="users-table-card">
        <ListagemPreApproval />
      </div>
    </div>
  );
}

