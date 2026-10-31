import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { useAppContext } from '../context/AppContext';

/**
 * MAPA DE ÍCONES / EMOJIS POR TIPO DE MARCO
 */
const TIPO_ICONS = {
  INICIO_CANDIDATURA: '🚀',
  CONQUISTA_BADGE: '🏆',
  AREAS_DISTINTAS: '🌐',
  SL_DISTINTAS: '🏢',
  MENSAL: '📅',
  BIMESTRAL: '🗓️',
  TRIMESTRAL: '🥉',
  QUADRIMESTRAL: '🥈',
  SEMESTRAL: '🥇'
};

const TIPO_LABELS = {
  INICIO_CANDIDATURA: 'marcoTipoInicioCandidatura',
  CONQUISTA_BADGE: 'marcoTipoConquistaBadge',
  AREAS_DISTINTAS: 'marcoTipoAreasDistintas',
  SL_DISTINTAS: 'marcoTipoSlDistintas',
  MENSAL: 'marcoTipoMensal',
  BIMESTRAL: 'marcoTipoBimestral',
  TRIMESTRAL: 'marcoTipoTrimestral',
  QUADRIMESTRAL: 'marcoTipoQuadrimestral',
  SEMESTRAL: 'marcoTipoSemestral'
};

export default function MarcoCelebrationModal({ marco, onClose, onCelebrated }) {
  const { t, i18n } = useTranslation();
  const { token, triggerCountsUpdate } = useAppContext();

  useEffect(() => {
    if (!marco) return;

    // Dispara confetes comemorativos com múltiplos disparos dinâmicos
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 99999
    };

    function fire(particleRatio, opts) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      });
    }

    fire(0.25, {
      spread: 26,
      startVelocity: 55
    });
    fire(0.2, {
      spread: 60
    });
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2
    });
    fire(0.1, {
      spread: 120,
      startVelocity: 45
    });
  }, [marco]);

  if (!marco) return null;

  const currentLang = i18n.language || 'pt';
  const nome = typeof marco.nome === 'object' ? (marco.nome[currentLang] || marco.nome.pt || '') : marco.nome;
  const descricao = typeof marco.descricao === 'object' ? (marco.descricao[currentLang] || marco.descricao.pt || '') : marco.descricao;
  
  // Obter o nome amigável do tipo de marco (nunca exibir o código técnico interno como "INICIO_CANDIDATURA")
  let tipoNome = '';
  if (marco.tipo_nome) {
    const rawTipoNome = typeof marco.tipo_nome === 'object'
      ? (marco.tipo_nome[currentLang] || marco.tipo_nome.pt || '')
      : marco.tipo_nome;
    if (rawTipoNome && rawTipoNome !== marco.codigo_tipo) {
      tipoNome = rawTipoNome;
    }
  }

  if (!tipoNome && marco.codigo_tipo && TIPO_LABELS[marco.codigo_tipo]) {
    tipoNome = t(TIPO_LABELS[marco.codigo_tipo]);
  }

  const icon = TIPO_ICONS[marco.codigo_tipo] || '🎖️';

  const handleConfirmCelebration = async () => {
    if (token && marco.id_marco && !marco.celebrado) {
      try {
        await api.put(`/utilizador-marco/${marco.id_marco}/celebrar`);
        if (triggerCountsUpdate) triggerCountsUpdate();
        if (onCelebrated) onCelebrated(marco.id_marco);
      } catch (err) {
        console.error('Erro ao marcar marco como celebrado:', err);
      }
    }
    if (onClose) onClose();
  };

  return (
    <>
      <div 
        className="users-modal-overlay" 
        style={{ zIndex: 1080, backdropFilter: 'blur(4px)', backgroundColor: 'rgba(0, 0, 0, 0.65)' }} 
        onClick={handleConfirmCelebration} 
      />

      <div
        className="users-modal text-center p-4"
        style={{
          maxWidth: '520px',
          width: '92%',
          zIndex: 1090,
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'var(--panel)',
          borderRadius: '24px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          overflow: 'hidden',
          border: '2px solid rgba(255, 215, 0, 0.35)'
        }}
      >
        {/* Glow Background Header */}
        <div 
          className="d-flex flex-column align-items-center justify-content-center pt-3 pb-2"
          style={{
            background: 'radial-gradient(circle, rgba(255,215,0,0.15) 0%, rgba(255,255,255,0) 70%)'
          }}
        >
          {/* Animated Icon Bubble */}
          <div
            className="rounded-circle shadow-lg d-flex align-items-center justify-content-center mb-3"
            style={{
              width: '96px',
              height: '96px',
              backgroundColor: '#fffbeb',
              border: '4px solid #fef08a',
              fontSize: '3rem'
            }}
          >
            {icon}
          </div>

          <span 
            className="badge bg-warning text-dark px-3 py-1.5 rounded-pill fw-bold mb-2 shadow-sm"
            style={{ fontSize: '0.8rem', letterSpacing: '0.5px' }}
          >
            ⭐ {t('celebrationModalTitle', 'Marco Conquistado!')}
          </span>

          <h4 className="fw-bold mb-1 px-2" style={{ color: 'var(--text)', fontSize: '1.45rem' }}>
            {nome}
          </h4>

          {tipoNome && (
            <span className="text-muted small fw-semibold">
              {tipoNome} • {t('objectiveLabel', 'Objetivo')}: {marco.quantidade_objetivo}
            </span>
          )}
        </div>

        {/* Modal Description */}
        <div className="p-3 my-2 rounded-3" style={{ backgroundColor: 'var(--panel-2)', border: '1px solid var(--sidebar-border)' }}>
          <p className="mb-0 text-muted small" style={{ lineHeight: '1.6', fontSize: '0.9rem' }}>
            {descricao || t('celebrationModalCongrats', 'Parabéns pela sua conquista!')}
          </p>
        </div>

        {/* Footer Action */}
        <div className="mt-3 d-flex justify-content-center">
          <button
            type="button"
            className="btn btn-primary px-5 py-2.5 rounded-pill fw-bold shadow d-flex align-items-center gap-2"
            style={{
              backgroundColor: '#0d6efd',
              borderColor: '#0d6efd',
              fontSize: '1rem'
            }}
            onClick={handleConfirmCelebration}
          >
            {t('celebrateAcknowledgeBtn', 'Comemorar! 🚀')}
          </button>
        </div>
      </div>
    </>
  );
}
