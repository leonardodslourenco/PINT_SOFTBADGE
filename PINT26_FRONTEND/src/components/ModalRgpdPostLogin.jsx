import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import { useAppContext } from '../context/AppContext';
import { authStorage } from '../services/authStorage';
import Swal from 'sweetalert2';
import RgpdGeralText from './RgpdGeralText';

export default function ModalRgpdPostLogin({ onAcceptSuccess }) {
  const { t } = useTranslation();
  const { user, setUser, setToken, logout } = useAppContext();
  const [submitting, setSubmitting] = useState(false);

  const handleAcceptAndProceed = async () => {
    try {
      setSubmitting(true);
      const res = await api.put('/utilizador/rgpd', { aceitou_rgpd: true });

      if (res.data?.success) {
        const novoToken = res.data.data?.token;
        const storedUser = authStorage.getUser() || user;
        const updatedUser = { ...storedUser, aceitou_rgpd: true };

        if (novoToken) {
          authStorage.setToken(novoToken);
          setToken(novoToken);
        }
        authStorage.setUser(updatedUser);
        if (setUser) setUser(updatedUser);

        Swal.fire({
          icon: 'success',
          title: t('rgpdConsentGrantedTitle', 'Consentimento Registado'),
          text: t('rgpdConsentGrantedText', 'Os Termos Gerais de RGPD foram aceites. Bem-vindo à plataforma!'),
          timer: 2000,
          showConfirmButton: false
        });

        if (onAcceptSuccess) {
          onAcceptSuccess();
        }
      }
    } catch (err) {
      console.error('Erro ao aceitar RGPD pós-login:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('errorAcceptingRgpd', 'Erro ao registar o seu consentimento RGPD.'),
        didOpen: () => {
          const container = Swal.getContainer();
          if (container) container.style.zIndex = '999999';
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefuseAndLogout = async () => {
    const result = await Swal.fire({
      title: t('confirmRefuseRgpdTitle', 'Recusar Termos de Privacidade?'),
      text: t('confirmRefuseRgpdText', 'Para utilizar a plataforma interna e candidatar-se a badges, é obrigatório aceitar o tratamento dos seus dados. Ao recusar, a sua sessão será terminada.'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('refuseAndExitConfirmBtn', 'Sim, Recusar e Sair'),
      cancelButtonText: t('cancelBtn', 'Voltar'),
      didOpen: () => {
        const container = Swal.getContainer();
        if (container) container.style.zIndex = '999999';
      }
    });

    if (result.isConfirmed) {
      logout();
    }
  };

  return (
    <>
      <div 
        className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
        style={{ 
          backgroundColor: 'rgba(15, 23, 42, 0.85)', 
          backdropFilter: 'blur(8px)', 
          zIndex: 1040 
        }} 
      >
        <div 
          className="rounded-4 shadow-2xl border d-flex flex-column overflow-hidden" 
          style={{ 
            maxWidth: '740px', 
            width: '92%', 
            maxHeight: '92vh',
            backgroundColor: 'var(--panel)',
            borderColor: 'var(--sidebar-border)',
            zIndex: 1045
          }} 
        >
          {/* Header */}
          <div 
            className="p-4 border-bottom d-flex align-items-center gap-3"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
          >
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary flex-shrink-0"
              style={{ width: '44px', height: '44px', fontSize: '1.3rem' }}
            >
              📋
            </div>
            <div>
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)', fontSize: '1.1rem' }}>
                {t('rgpdPostLoginTitle', 'Atualização dos Termos Gerais de Privacidade (RGPD)')}
              </h5>
              <p className="text-muted small mb-0" style={{ fontSize: '0.8rem' }}>
                {t('rgpdPostLoginSubtitle', 'Por favor, leia atentamente e valide o seu consentimento para aceder à plataforma.')}
              </p>
            </div>
          </div>

          {/* Scrollable Policy Content */}
          <div 
            style={{ 
              overflowY: 'auto', 
              padding: '24px', 
              backgroundColor: 'var(--panel-2)',
              flex: 1 
            }}
          >
            <RgpdGeralText showMeta={false} />
          </div>

          {/* Action Footer */}
          <div 
            className="p-3.5 px-4 border-top d-flex justify-content-between align-items-center flex-wrap gap-2"
            style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
          >
            <button 
              type="button" 
              className="btn btn-outline-danger rounded-3 px-3 py-2 fw-semibold d-flex align-items-center gap-2"
              disabled={submitting}
              onClick={handleRefuseAndLogout}
              style={{ fontSize: '0.85rem' }}
            >
              <span>❌</span> {t('refuseAndExitBtn', 'Recusar e Sair')}
            </button>

            <button 
              type="button" 
              className="btn btn-primary rounded-3 px-4 py-2 fw-bold d-flex align-items-center gap-2 shadow-sm"
              disabled={submitting}
              onClick={handleAcceptAndProceed}
              style={{ fontSize: '0.85rem' }}
            >
              {submitting ? (
                <div className="users-spinner small me-1" />
              ) : (
                <span>✅</span>
              )}
              {t('acceptAndProceedBtn', 'Aceitar e Avançar')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
