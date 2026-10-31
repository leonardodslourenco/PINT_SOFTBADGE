import { useTranslation } from 'react-i18next';

export default function DashboardGeral() {
  const { t } = useTranslation();
  return (
    <div className="card shadow-sm border-0">
      <div className="card-body">
        <h4>{t('globalDashboard')}</h4>
        <p className="mb-0">{t('notImplemented')}</p>
      </div>
    </div>
  );
}
