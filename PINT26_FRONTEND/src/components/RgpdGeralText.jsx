import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';

export default function RgpdGeralText({ customPolitica = null, showMeta = true }) {
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
        console.error('Erro ao carregar política RGPD Geral:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPolitica();
    return () => { isMounted = false; };
  }, [customPolitica, i18n.language]);

  const currentLang = (i18n.language || 'pt').slice(0, 2).toLowerCase();

  const getTextoGeral = () => {
    if (!politica) return '';
    if (currentLang === 'en') return politica.geral_en || politica.geral_localizado || politica.geral_pt;
    if (currentLang === 'es') return politica.geral_es || politica.geral_localizado || politica.geral_pt;
    return politica.geral_pt || politica.geral_localizado || '';
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="users-spinner small mx-auto mb-2" />
        <span className="text-muted small">{t('loadingRgpd', 'A carregar termos de privacidade...')}</span>
      </div>
    );
  }

  const texto = getTextoGeral();

  return (
    <div className="d-flex flex-column gap-3">
      {showMeta && (
        <div 
          className="p-3 rounded-4 border d-flex align-items-center gap-3"
          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
        >
          <div 
            className="rounded-3 d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary flex-shrink-0"
            style={{ width: '48px', height: '48px', fontSize: '1.4rem' }}
          >
            🛡️
          </div>
          <div>
            <h6 className="fw-bold mb-1" style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
              {t('rgpdGeralScopeTitle', 'Âmbito de Tratamento de Dados — Plataforma Interna')}
            </h6>
            <p className="text-muted small mb-0" style={{ fontSize: '0.82rem' }}>
              {t('rgpdGeralScopeSubtitle', 'Aplicável à utilização da aplicação Web e Mobile (autenticada) para atribuição de competências, submissão de badges e gamificação.')}
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
            {t('noRgpdTextAvailable', 'Texto de termos gerais de privacidade temporariamente indisponível.')}
          </p>
        )}
      </div>

      {/* Highlights List */}
      <div className="row g-2 pt-1">
        <div className="col-12 col-md-4">
          <div className="p-2.5 rounded-3 border h-100 d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
            <span style={{ fontSize: '1.1rem' }}>🔒</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text)' }}>
              <strong>{t('rgpdConfidentiality', 'Confidencialidade')}</strong>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{t('rgpdConfidentialitySub', 'Uso estrito na organização')}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-2.5 rounded-3 border h-100 d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
            <span style={{ fontSize: '1.1rem' }}>🎯</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text)' }}>
              <strong>{t('rgpdPurpose', 'Finalidade')}</strong>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{t('rgpdPurposeSub', 'Gestão de competências')}</div>
            </div>
          </div>
        </div>
        <div className="col-12 col-md-4">
          <div className="p-2.5 rounded-3 border h-100 d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
            <span style={{ fontSize: '1.1rem' }}>👤</span>
            <div style={{ fontSize: '0.78rem', color: 'var(--text)' }}>
              <strong>{t('rgpdRights', 'Direitos do Titular')}</strong>
              <div className="text-muted" style={{ fontSize: '0.72rem' }}>{t('rgpdRightsSub', 'Acesso, retificação e esquecimento')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
