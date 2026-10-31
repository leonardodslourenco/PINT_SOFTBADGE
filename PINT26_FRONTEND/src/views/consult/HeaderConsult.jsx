import { useTranslation } from 'react-i18next';

export default function HeaderCon({ controls }) {
    const { t } = useTranslation();
    return <div className="top-header"><strong>{t('con')}</strong>{controls}</div>; }
