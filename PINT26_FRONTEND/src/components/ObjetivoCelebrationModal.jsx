import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';

const TIPO_ICONS = {
  BADGES_NORMAL_TEMPO: '🎯',
  BADGES_NORMAL_DIVERSIDADE: '🌐',
  PONTOS_NORMAL_TEMPO: '⚡',
  BADGES_ESPECIAL_TEMPO: '🏆',
  PONTOS_ESPECIAL_TEMPO: '🌟'
};

export default function ObjetivoCelebrationModal({ objetivo, onClose }) {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    if (!objetivo) return;

    // Dispara confetes comemorativos
    const count = 220;
    const defaults = {
      origin: { y: 0.65 },
      zIndex: 99999
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, [objetivo]);

  if (!objetivo) return null;

  const currentLang = i18n.language || 'pt';
  const icon = TIPO_ICONS[objetivo.codigo_tipo || objetivo.tipo_objetivo?.codigo_tipo] || '🎯';

  // Obter título formatado do objetivo
  let titulo = objetivo.tipo_nome || objetivo.titulo;
  if (!titulo && objetivo.tipo_objetivo) {
    const tObj = objetivo.tipo_objetivo.traducao_titulo;
    titulo = typeof tObj === 'object' ? (tObj[currentLang] || tObj.pt) : tObj;
  }
  if (!titulo) titulo = t('personalGoal', 'Objetivo Pessoal');

  // Obter descrição da meta cumprida
  let descricao = objetivo.descricao || objetivo.progresso?.descricao_meta;
  if (!descricao && objetivo.tipo_objetivo) {
    const dObj = objetivo.tipo_objetivo.traducao_descricao;
    descricao = typeof dObj === 'object' ? (dObj[currentLang] || dObj.pt) : dObj;
  }

  const dataCumprimento = objetivo.data_cumprimento 
    ? new Date(objetivo.data_cumprimento).toLocaleDateString(currentLang === 'pt' ? 'pt-PT' : currentLang === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'long', year: 'numeric' })
    : null;

  return (
    <>
      <div 
        className="users-modal-overlay" 
        style={{ zIndex: 1080, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(15, 23, 42, 0.75)' }} 
        onClick={onClose}
      />
      <div 
        className="users-modal rounded-4 shadow-lg border bg-panel" 
        style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '520px', 
          width: '90%',
          zIndex: 1090, 
          textAlign: 'center', 
          backgroundColor: 'var(--panel)',
          border: '2px solid rgba(16, 185, 129, 0.4)',
          boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.25)',
          overflow: 'hidden'
        }}
      >
        <div className="users-modal-body p-4 p-md-5">
          {/* Animação comemorativa do ícone */}
          <div className="mb-4 d-inline-block position-relative">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center shadow-lg"
              style={{
                width: '100px',
                height: '100px',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                fontSize: '3.2rem',
                margin: '0 auto',
                animation: 'bounce 1s infinite alternate'
              }}
            >
              {icon}
            </div>
            <span 
              className="position-absolute bottom-0 end-0 bg-warning rounded-circle p-1 shadow"
              style={{ fontSize: '1.2rem', transform: 'translate(15%, 15%)' }}
            >
              🎉
            </span>
          </div>

          <h3 className="fw-bold mb-2" style={{ color: 'var(--text)' }}>
            {t('goalCelebrationTitle', 'Objetivo Cumprido!')}
          </h3>
          <p className="text-muted small mb-4">
            {t('goalCelebrationSubtitle', 'Parabéns! Concluiu com sucesso a sua meta pessoal.')}
          </p>

          {/* Card da Meta Atingida */}
          <div 
            className="p-3.5 rounded-4 mb-4 text-start border shadow-sm"
            style={{ 
              backgroundColor: 'var(--panel-2, #f8fafc)', 
              borderColor: 'rgba(16, 185, 129, 0.3)' 
            }}
          >
            <div className="d-flex align-items-center gap-2 mb-2">
              <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-2.5 py-1 rounded-pill small fw-semibold">
                ✓ {t('goalStatusAchieved', 'Cumprido')}
              </span>
              <span className="fw-bold text-truncate" style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
                {titulo}
              </span>
            </div>

            {descricao && (
              <p className="mb-2 text-muted small" style={{ fontSize: '0.88rem', lineHeight: '1.4' }}>
                {descricao}
              </p>
            )}

            {dataCumprimento && (
              <div className="d-flex align-items-center gap-1.5 text-muted small mt-2 pt-2 border-top border-light" style={{ fontSize: '0.78rem' }}>
                <span>📅</span>
                <span>{t('completedDateLabel', 'Concluído em')}: <strong>{dataCumprimento}</strong></span>
              </div>
            )}
          </div>

          {/* Botão de Fechar e Continuar */}
          <button
            type="button"
            className="btn btn-success btn-lg w-100 rounded-3 py-2.5 fw-bold shadow-sm d-flex align-items-center justify-content-center gap-2"
            onClick={onClose}
          >
            <span>🎯</span>
            <span>{t('continueConqueringBtn', 'Continuar a Conquistar')}</span>
          </button>
        </div>
      </div>
    </>
  );
}
