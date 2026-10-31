import { useTranslation } from 'react-i18next';
export default function HeaderSll({ controls }) { const { t } = useTranslation(); return <div className="top-header"><strong>{t('sll')}</strong>{controls}</div>; }
