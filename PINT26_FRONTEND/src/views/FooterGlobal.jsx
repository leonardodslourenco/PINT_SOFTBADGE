import { useTranslation } from 'react-i18next';

export default function FooterGlobal() {
  const { t } = useTranslation();
  return <footer className="main-footer px-3 py-2">{t('appName')} - 2026</footer>;
}
