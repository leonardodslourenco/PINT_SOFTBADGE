import { useTranslation } from 'react-i18next';
export default function SidebarTm({ onSelect }) { const { t } = useTranslation(); return <div className="sidebar p-3"><button className="btn btn-outline-light w-100 mb-2" onClick={() => onSelect('home')}>{t('menuHome')}</button><button className="btn btn-outline-light w-100" onClick={() => onSelect('pre')}>{t('menuPreApproval')}</button></div>; }
