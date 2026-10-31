import { useTranslation } from 'react-i18next';
export default function HeaderTm({ controls }) { const { t } = useTranslation(); return <div className="top-header"><strong>{t('tm')}</strong>{controls}</div>; }
