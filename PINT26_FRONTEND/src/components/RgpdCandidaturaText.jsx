import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

export default function RgpdCandidaturaText({ customPolitica = null, showMeta = true }) {
  const { t, i18n } = useTranslation();
  const [politica, setPolitica] = useState(customPolitica);
  const [loading, setLoading] = useState(!customPolitica);

  useEffect(() => {
    if (customPolitica) {
      setPolitica(customPolitica);
      return;
    }

    let isMounted = true;
    const fetchPolitica = async () => {
      try {
        setLoading(true);
        const res = await api.get('/politica_rgpd');
        if (res.data?.success && isMounted) {
          setPolitica(res.data.data);
        }
      } catch (err) {
        console.error('Erro ao carregar política RGPD de Candidatura:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPolitica();
    return () => { isMounted = false; };
  }, [customPolitica, i18n.language]);

  const currentLang = (i18n.language || 'pt').slice(0, 2).toLowerCase();

  const getTextoCandidatura = () => {
    if (!politica) return '';
    if (currentLang === 'en') return politica.candidatura_en || politica.candidatura_localizado || politica.candidatura_pt;
    if (currentLang === 'es') return politica.candidatura_es || politica.candidatura_localizado || politica.candidatura_pt;
    return politica.candidatura_pt || politica.candidatura_localizado || '';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="users-spinner small mx-auto mb-2" />
        <span className="text-muted small">{t('loadingRgpd', 'A carregar termos de privacidade...')}</span>
      </div>
    );
  }

  const texto = getTextoCandidatura();

  return (
    <div className="d-flex flex-column gap-3">
      {showMeta && (
        <div 
          className="p-3 rounded-4 border d-flex align-items-center gap-3"
          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
        >
          <div 
            className="rounded-3 d-flex align-items-center justify-content-center bg-info bg-opacity-10 text-info flex-shrink-0"
            style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}
          >
            🌐
          </div>
          <div>
            <h6 className="fw-bold mb-1" style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
              {t('rgpdCandidaturaScopeTitle', 'Âmbito de Divulgação — Candidaturas & Microsite Público')}
            </h6>
            <p className="text-muted small mb-0" style={{ fontSize: '0.82rem' }}>
              {t('rgpdCandidaturaScopeSubtitle', 'Aplicável à publicação externa e verificação de badges conquistados através do Microsite público, redes sociais e assinaturas de email.')}
            </p>
          </div>
        </div>
      )}

      {/* Main Body Policy Text */}
      <div 
        className="p-4 rounded-4 border shadow-xs"
        style={{ 
          backgroundColor: 'var(--panel)', 
          borderColor: 'var(--sidebar-border)',
          lineHeight: '1.7',
          color: 'var(--text)',
          fontSize: '0.90rem',
          textAlign: 'justify'
        }}
      >
        {texto ? (
          <div style={{ whiteSpace: 'pre-line' }}>{texto}</div>
        ) : (
          <p className="text-muted small mb-0">
            {t('noRgpdTextAvailable', 'Texto de termos de privacidade de candidatura temporariamente indisponível.')}
          </p>
        )}
      </div>

      {/* Explanatory Cards */}
      <div className="row g-2 pt-1">
        <div className="col-12 col-md-4">
          <div className="p-2.5 rounded-3 border h-100 d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
            <span style={{ fontSize: '1.1rem' }}>🌍</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text)' }}>
              <strong>{t('rgpdPublicAccess', 'Acesso Público')}</strong>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{t('rgpdPublicAccessSub', 'Acessível sem login no Microsite')}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-2.5 rounded-3 border h-100 d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
            <span style={{ fontSize: '1.1rem' }}>🏆</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text)' }}>
              <strong>{t('rgpdCredentialProof', 'Validação de Conquista')}</strong>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{t('rgpdCredentialProofSub', 'Exibição de badge e competência')}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-2.5 rounded-3 border h-100 d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
            <span style={{ fontSize: '1.1rem' }}>🔄</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text)' }}>
              <strong>{t('rgpdGranularControl', 'Controlo por Badge')}</strong>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{t('rgpdGranularControlSub', 'Ative ou oculte individualmente')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
