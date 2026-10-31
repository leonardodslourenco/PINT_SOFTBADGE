import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import ConfigPersonalInfo from '../../components/ConfigPersonalInfo';
import ConfigAssinaturaMail from '../../components/ConfigAssinaturaMail';

export default function SettingsTM() {
  const { t } = useTranslation();
  const { activeRole } = useAppContext();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile' ou 'signature'

  // Segurança: Verificar se o perfil ativo é Talent Manager (role 3)
  const isTmActive = Number(activeRole) === 3;

  if (!isTmActive) {
    return (
      <div className="users-admin-container p-4">
        <div className="alert alert-danger" role="alert">
          {t('accessDenied', 'Acesso Negado. O seu perfil ativo deve ser Talent Manager para ver esta página.')}
        </div>
      </div>
    );
  }

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1">{t('menuSettings', 'Configurações')}</h3>
        <p className="text-muted small mb-0">{t('settingsSubtitleTm', 'Gerencie as suas informações pessoais e configure a sua assinatura de e-mail institucional')}</p>
      </div>

      {/* Tabs List */}
      <div className="card border-0 shadow-sm rounded-4 bg-white p-4">
        <ul className="nav nav-pills mb-3 border-bottom pb-2" id="settingsTabs" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link fw-bold px-4 py-2 ${activeTab === 'profile' ? 'active btn-primary' : 'text-secondary'}`}
              type="button"
              onClick={() => setActiveTab('profile')}
              style={{ borderRadius: '8px', fontSize: '0.9rem' }}
            >
              👤 {t('myProfileTab', 'O Meu Perfil')}
            </button>
          </li>
          <li className="nav-item ms-2" role="presentation">
            <button
              className={`nav-link fw-bold px-4 py-2 ${activeTab === 'signature' ? 'active btn-primary' : 'text-secondary'}`}
              type="button"
              onClick={() => setActiveTab('signature')}
              style={{ borderRadius: '8px', fontSize: '0.9rem' }}
            >
              ✉️ {t('emailSignatureTab', 'Assinatura Digital')}
            </button>
          </li>
        </ul>

        {/* Tabs Content */}
        <div className="tab-content">
          {activeTab === 'profile' && <ConfigPersonalInfo />}
          {activeTab === 'signature' && <ConfigAssinaturaMail />}
        </div>
      </div>
    </div>
  );
}
