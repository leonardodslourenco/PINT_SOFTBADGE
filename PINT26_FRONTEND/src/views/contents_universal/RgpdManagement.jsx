import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import { authStorage } from '../../services/authStorage';
import Swal from 'sweetalert2';
import RgpdGeralText from '../../components/RgpdGeralText';
import RgpdCandidaturaText from '../../components/RgpdCandidaturaText';

export default function RgpdManagement() {
  const { t } = useTranslation();
  const { user, setUser, setToken } = useAppContext();
  const [activeTab, setActiveTab] = useState('geral'); // 'geral' | 'candidatura'
  const [updatingConsent, setUpdatingConsent] = useState(false);

  const isConsentAccepted = Boolean(user?.aceitou_rgpd);

  const handleToggleConsent = async (e) => {
    const newVal = e.target.checked;

    if (!newVal) {
      const confirmRevoke = await Swal.fire({
        title: t('confirmRevokeRgpdTitle', 'Revogar Consentimento Geral?'),
        text: t('confirmRevokeRgpdText', 'Ao revogar o consentimento geral de RGPD, o seu percurso na plataforma e submissão de candidaturas a badges poderão ficar bloqueados ou exigir nova aceitação no próximo login.'),
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#64748b',
        confirmButtonText: t('yesRevokeBtn', 'Sim, Revogar'),
        cancelButtonText: t('cancelBtn', 'Cancelar')
      });

      if (!confirmRevoke.isConfirmed) {
        return;
      }
    }

    try {
      setUpdatingConsent(true);
      const res = await api.put('/utilizador/rgpd', { aceitou_rgpd: newVal });

      if (res.data?.success) {
        const novoToken = res.data.data?.token;
        const storedUser = authStorage.getUser() || user;
        const updatedUser = { ...storedUser, aceitou_rgpd: newVal };

        if (novoToken) {
          authStorage.setToken(novoToken);
          setToken(novoToken);
        }
        authStorage.setUser(updatedUser);
        if (setUser) setUser(updatedUser);

        Swal.fire({
          icon: 'success',
          title: t('rgpdUpdatedTitle', 'Consentimento Atualizado'),
          text: newVal
            ? t('rgpdConsentGrantedText', 'Termos gerais aceites com sucesso.')
            : t('rgpdConsentRevokedText', 'Consentimento geral revogado.'),
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar consentimento RGPD:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('errorUpdatingRgpd', 'Erro ao atualizar o estado de consentimento.')
      });
    } finally {
      setUpdatingConsent(false);
    }
  };

  return (
    <div className="users-admin-container">
      {/* Header */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
          🛡️ {t('menuRgpd', 'Políticas de RGPD & Privacidade')}
        </h3>
        <p className="text-muted small mb-0">
          {t('rgpdMgmtSubtitle', 'Consulte os termos de privacidade da plataforma e gira as suas opções de tratamento de dados pessoais e divulgação.')}
        </p>
      </div>

      {/* Tabs Switcher */}
      <div 
        className="d-flex gap-2 p-1.5 rounded-4 border mb-4 shadow-xs"
        style={{ 
          backgroundColor: 'var(--panel)', 
          borderColor: 'var(--sidebar-border)',
          width: 'fit-content'
        }}
      >
        <button
          type="button"
          className={`btn btn-sm px-3.5 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 border-0 transition-all ${
            activeTab === 'geral' ? 'btn-primary shadow-xs' : 'btn-ghost text-muted'
          }`}
          onClick={() => setActiveTab('geral')}
          style={{
            backgroundColor: activeTab === 'geral' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'geral' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          <span>🛡️</span>
          {t('tabRgpdGeral', 'RGPD Geral da Plataforma')}
        </button>

        <button
          type="button"
          className={`btn btn-sm px-3.5 py-2 rounded-3 fw-bold d-flex align-items-center gap-2 border-0 transition-all ${
            activeTab === 'candidatura' ? 'btn-primary shadow-xs' : 'btn-ghost text-muted'
          }`}
          onClick={() => setActiveTab('candidatura')}
          style={{
            backgroundColor: activeTab === 'candidatura' ? 'var(--primary)' : 'transparent',
            color: activeTab === 'candidatura' ? '#ffffff' : 'var(--text-muted)'
          }}
        >
          <span>🌐</span>
          {t('tabRgpdCandidatura', 'RGPD de Candidatura & Microsite')}
        </button>
      </div>

      {/* Tab 1: RGPD Geral */}
      {activeTab === 'geral' && (
        <div className="d-flex flex-column gap-4">
          {/* Card: Consent Toggle Switch */}
          <div 
            className="p-4 rounded-4 border shadow-sm d-flex align-items-center justify-content-between flex-wrap gap-3"
            style={{ 
              backgroundColor: 'var(--panel)', 
              borderColor: isConsentAccepted ? 'rgba(34, 197, 94, 0.35)' : 'rgba(239, 68, 68, 0.35)' 
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div 
                className={`rounded-circle d-flex align-items-center justify-content-center flex-shrink-0 ${
                  isConsentAccepted ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'
                }`}
                style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}
              >
                {isConsentAccepted ? '✅' : '⚠️'}
              </div>
              <div>
                <h6 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
                  {t('rgpdConsentStateTitle', 'Consentimento Geral de Tratamento de Dados')}
                </h6>
                <span 
                  className={`badge rounded-pill fw-bold px-2.5 py-1 ${
                    isConsentAccepted ? 'bg-success bg-opacity-15 text-success' : 'bg-danger bg-opacity-15 text-danger'
                  }`}
                  style={{ fontSize: '0.75rem' }}
                >
                  {isConsentAccepted 
                    ? t('rgpdStateAccepted', 'Consentimento Ativo — Aceite') 
                    : t('rgpdStateRefused', 'Consentimento Inativo — Recusado')}
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="form-check form-switch m-0 d-flex align-items-center gap-2">
                <input
                  className="form-check-input my-0 cursor-pointer"
                  type="checkbox"
                  role="switch"
                  id="rgpdGeneralSwitch"
                  checked={isConsentAccepted}
                  disabled={updatingConsent}
                  onChange={handleToggleConsent}
                  style={{ width: '2.6em', height: '1.3em' }}
                />
                <label 
                  className="form-check-label fw-semibold small cursor-pointer" 
                  htmlFor="rgpdGeneralSwitch"
                  style={{ color: 'var(--text)', fontSize: '0.85rem' }}
                >
                  {isConsentAccepted ? t('rgpdActionAccepted', 'Aceite') : t('rgpdActionRefused', 'Recusado')}
                </label>
              </div>
            </div>
          </div>

          {/* Reusable General Policy Content */}
          <RgpdGeralText showMeta={true} />
        </div>
      )}

      {/* Tab 2: RGPD Candidatura */}
      {activeTab === 'candidatura' && (
        <div className="d-flex flex-column gap-4">
          {/* Informative Card */}
          <div 
            className="p-4 rounded-4 border shadow-sm d-flex align-items-start gap-3"
            style={{ 
              backgroundColor: 'var(--panel)', 
              borderColor: 'var(--sidebar-border)' 
            }}
          >
            <div 
              className="rounded-3 d-flex align-items-center justify-content-center bg-info bg-opacity-10 text-info flex-shrink-0"
              style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}
            >
              📖
            </div>
            <div>
              <h6 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
                {t('rgpdCandidaturaExplanationTitle', 'Partilha Pública e Divulgação no Microsite')}
              </h6>
              <p className="text-muted small mb-0" style={{ fontSize: '0.85rem' }}>
                {t('rgpdCandidaturaExplanationText', 'Ao conquistar badges, cada consultor pode decidir individualmente se deseja tornar pública a respetiva conquista. As candidaturas com partilha ativa são apresentadas no Microsite público (sem necessidade de login) e no link de verificação para redes sociais como o LinkedIn.')}
              </p>
            </div>
          </div>

          {/* Reusable Candidacy Policy Content */}
          <RgpdCandidaturaText showMeta={true} />
        </div>
      )}
    </div>
  );
}
