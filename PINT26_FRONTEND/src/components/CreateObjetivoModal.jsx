import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../services/api';
import Swal from 'sweetalert2';

const TIPO_ICONS = {
  BADGES_NORMAL_TEMPO: '🎯',
  BADGES_NORMAL_DIVERSIDADE: '🌐',
  PONTOS_NORMAL_TEMPO: '⚡',
  BADGES_ESPECIAL_TEMPO: '🏆',
  PONTOS_ESPECIAL_TEMPO: '🌟'
};

/**
 * Componente Stepper Numérico com botões ▲ e ▼
 */
function NumericStepper({ value, onChange, min, max, step = 1, disabled = false, label }) {
  const handleIncrement = () => {
    if (disabled) return;
    const next = Math.min(Number(value) + step, max);
    onChange(next);
  };

  const handleDecrement = () => {
    if (disabled) return;
    const next = Math.max(Number(value) - step, min);
    onChange(next);
  };

  const handleManualChange = (e) => {
    const v = parseInt(e.target.value, 10);
    if (isNaN(v)) {
      onChange(min);
    } else {
      const clamped = Math.min(Math.max(v, min), max);
      onChange(clamped);
    }
  };

  return (
    <div className="d-flex flex-column gap-1">
      {label && <label className="form-label small fw-semibold mb-1" style={{ color: 'var(--text)' }}>{label}</label>}
      <div className="input-group" style={{ maxWidth: '180px' }}>
        <button
          type="button"
          className="btn btn-outline-secondary px-2.5 py-1.5"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          style={{ borderColor: 'var(--sidebar-border)', color: 'var(--text)' }}
          title="Diminuir"
        >
          ▼
        </button>
        <input
          type="number"
          className="form-control text-center fw-bold px-2 py-1.5"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={handleManualChange}
          disabled={disabled}
          style={{ 
            backgroundColor: 'var(--panel)', 
            borderColor: 'var(--sidebar-border)', 
            color: 'var(--text)',
            fontSize: '0.95rem' 
          }}
        />
        <button
          type="button"
          className="btn btn-outline-secondary px-2.5 py-1.5"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          style={{ borderColor: 'var(--sidebar-border)', color: 'var(--text)' }}
          title="Aumentar"
        >
          ▲
        </button>
      </div>
      <div className="text-muted" style={{ fontSize: '0.75rem' }}>
        Min: {min} · Max: {max}
      </div>
    </div>
  );
}

export default function CreateObjetivoModal({ activeObjetivos = [], onClose, onSuccess }) {
  const { t, i18n } = useTranslation();
  const currentLang = (i18n.language || 'pt').slice(0, 2);

  const [loadingTipos, setLoadingTipos] = useState(true);
  const [tipos, setTipos] = useState([]);
  const [totalLPs, setTotalLPs] = useState(2);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [selectedTipoId, setSelectedTipoId] = useState('');
  const [quantidadeBadges, setQuantidadeBadges] = useState(3);
  const [quantidadePontos, setQuantidadePontos] = useState(200);
  const [tipoDiversidade, setTipoDiversidade] = useState('area'); // 'area', 'service_line', 'learning_path'
  const [quantidadeDiversidade, setQuantidadeDiversidade] = useState(2);
  const [unidadePrazo, setUnidadePrazo] = useState('dias'); // 'dias', 'semanas', 'meses'
  const [prazoValor, setPrazoValor] = useState(30);

  // Carregar os 5 tipos fixos a partir do backend
  useEffect(() => {
    let isMounted = true;
    const fetchTipos = async () => {
      try {
        setLoadingTipos(true);
        const res = await api.get('/objetivo-consultor/tipos');
        if (isMounted && res.data?.success) {
          setTipos(res.data.data || []);
          if (res.data.meta?.total_learning_paths) {
            setTotalLPs(res.data.meta.total_learning_paths);
          }
          // Pré-selecionar o primeiro tipo que não esteja ativo
          const tiposDisponiveis = (res.data.data || []).filter(tp => {
            return !activeObjetivos.some(act => act.id_tipo_objetivo === tp.id_tipo_objetivo);
          });
          if (tiposDisponiveis.length > 0) {
            setSelectedTipoId(tiposDisponiveis[0].id_tipo_objetivo);
          } else if (res.data.data?.length > 0) {
            setSelectedTipoId(res.data.data[0].id_tipo_objetivo);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar tipos de objetivo:', err);
      } finally {
        if (isMounted) setLoadingTipos(false);
      }
    };

    fetchTipos();
    return () => { isMounted = false; };
  }, [activeObjetivos]);

  // Tipo de objetivo atualmente selecionado
  const selectedTipo = useMemo(() => {
    return tipos.find(tp => tp.id_tipo_objetivo === selectedTipoId);
  }, [tipos, selectedTipoId]);

  const codigoTipo = selectedTipo?.codigo_tipo || '';

  // Verificar se o tipo selecionado já está ativo no consultor
  const isSelectedTipoAlreadyActive = useMemo(() => {
    return activeObjetivos.some(act => act.id_tipo_objetivo === selectedTipoId);
  }, [activeObjetivos, selectedTipoId]);

  // Calcular limites dinâmicos de Prazo conforme tipo e unidade
  const prazoLimits = useMemo(() => {
    const isPontos = codigoTipo === 'PONTOS_NORMAL_TEMPO' || codigoTipo === 'PONTOS_ESPECIAL_TEMPO';
    if (unidadePrazo === 'dias') {
      return { min: 7, max: 90, step: 1 };
    }
    if (unidadePrazo === 'semanas') {
      return { min: isPontos ? 2 : 1, max: 12, step: 1 };
    }
    if (unidadePrazo === 'meses') {
      return { min: isPontos ? 2 : 1, max: 12, step: 1 };
    }
    return { min: 7, max: 90, step: 1 };
  }, [codigoTipo, unidadePrazo]);

  // Ajustar valor do prazo automaticamente quando a unidade muda
  useEffect(() => {
    if (prazoValor < prazoLimits.min) {
      setPrazoValor(prazoLimits.min);
    } else if (prazoValor > prazoLimits.max) {
      setPrazoValor(prazoLimits.max);
    }
  }, [unidadePrazo, prazoLimits]);

  // Calcular limites de Diversidade para o Tipo 2
  const diversidadeLimits = useMemo(() => {
    if (tipoDiversidade === 'area') {
      return { min: 2, max: 5 };
    }
    if (tipoDiversidade === 'service_line') {
      return { min: 2, max: 5 };
    }
    if (tipoDiversidade === 'learning_path') {
      return { min: 1, max: Math.max(totalLPs, 1) };
    }
    return { min: 2, max: 5 };
  }, [tipoDiversidade, totalLPs]);

  // Ajustar quantidade de diversidade se o tipo de diversidade mudar
  useEffect(() => {
    if (quantidadeDiversidade < diversidadeLimits.min) {
      setQuantidadeDiversidade(diversidadeLimits.min);
    } else if (quantidadeDiversidade > diversidadeLimits.max) {
      setQuantidadeDiversidade(diversidadeLimits.max);
    }
  }, [tipoDiversidade, diversidadeLimits]);

  // Frase dinâmica de visualização da meta (Live Preview)
  const metaPreviewText = useMemo(() => {
    if (!codigoTipo) return '...';

    const unLabel = {
      dias: currentLang === 'en' ? 'days' : currentLang === 'es' ? 'días' : 'dias',
      semanas: currentLang === 'en' ? 'weeks' : currentLang === 'es' ? 'semanas' : 'semanas',
      meses: currentLang === 'en' ? 'months' : currentLang === 'es' ? 'meses' : 'meses'
    }[unidadePrazo] || unidadePrazo;

    const divLabel = {
      area: currentLang === 'en' ? 'distinct areas' : currentLang === 'es' ? 'áreas distintas' : 'áreas distintas',
      service_line: currentLang === 'en' ? 'distinct service lines' : currentLang === 'es' ? 'service lines distintas' : 'service lines distintas',
      learning_path: currentLang === 'en' ? 'distinct learning paths' : currentLang === 'es' ? 'learning paths distintos' : 'learning paths distintos'
    }[tipoDiversidade] || 'entidades distintas';

    switch (codigoTipo) {
      case 'BADGES_NORMAL_TEMPO':
        return currentLang === 'en'
          ? `Earn ${quantidadeBadges} normal badges within ${prazoValor} ${unLabel}.`
          : currentLang === 'es'
          ? `Obtener ${quantidadeBadges} badges normales en ${prazoValor} ${unLabel}.`
          : `Obter ${quantidadeBadges} badges normais no prazo de ${prazoValor} ${unLabel}.`;

      case 'BADGES_NORMAL_DIVERSIDADE':
        return currentLang === 'en'
          ? `Earn ${quantidadeBadges} normal badges distributed across ${quantidadeDiversidade} ${divLabel}.`
          : currentLang === 'es'
          ? `Obtener ${quantidadeBadges} badges normales distribuidos en ${quantidadeDiversidade} ${divLabel}.`
          : `Obter ${quantidadeBadges} badges normais distribuídos por ${quantidadeDiversidade} ${divLabel}.`;

      case 'PONTOS_NORMAL_TEMPO':
        return currentLang === 'en'
          ? `Accumulate ${quantidadePontos} normal badge points within ${prazoValor} ${unLabel}.`
          : currentLang === 'es'
          ? `Acumular ${quantidadePontos} puntos de badges normales en ${prazoValor} ${unLabel}.`
          : `Acumular ${quantidadePontos} pontos de badges normais no prazo de ${prazoValor} ${unLabel}.`;

      case 'BADGES_ESPECIAL_TEMPO':
        return currentLang === 'en'
          ? `Earn ${quantidadeBadges} special badges within ${prazoValor} ${unLabel}.`
          : currentLang === 'es'
          ? `Obtener ${quantidadeBadges} badges especiales en ${prazoValor} ${unLabel}.`
          : `Obter ${quantidadeBadges} badges especiais no prazo de ${prazoValor} ${unLabel}.`;

      case 'PONTOS_ESPECIAL_TEMPO':
        return currentLang === 'en'
          ? `Accumulate ${quantidadePontos} special badge points within ${prazoValor} ${unLabel}.`
          : currentLang === 'es'
          ? `Acumular ${quantidadePontos} puntos de badges especiales en ${prazoValor} ${unLabel}.`
          : `Acumular ${quantidadePontos} pontos de badges especiais no prazo de ${prazoValor} ${unLabel}.`;

      default:
        return '...';
    }
  }, [codigoTipo, quantidadeBadges, quantidadePontos, tipoDiversidade, quantidadeDiversidade, unidadePrazo, prazoValor, currentLang]);

  // Submissão do novo objetivo
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTipoId) return;

    if (isSelectedTipoAlreadyActive) {
      Swal.fire({
        icon: 'warning',
        title: t('warning', 'Atenção'),
        text: t('typeAlreadyActive', 'Já possui um objetivo ativo deste tipo.')
      });
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        id_tipo_objetivo: selectedTipoId
      };

      if (codigoTipo === 'BADGES_NORMAL_TEMPO' || codigoTipo === 'BADGES_ESPECIAL_TEMPO') {
        payload.quantidade_badges = Number(quantidadeBadges);
        payload.prazo_valor = Number(prazoValor);
        payload.unidade_prazo = unidadePrazo;
      } else if (codigoTipo === 'BADGES_NORMAL_DIVERSIDADE') {
        payload.quantidade_badges = Number(quantidadeBadges);
        payload.tipo_diversidade = tipoDiversidade;
        payload.quantidade_diversidade = Number(quantidadeDiversidade);
      } else if (codigoTipo === 'PONTOS_NORMAL_TEMPO' || codigoTipo === 'PONTOS_ESPECIAL_TEMPO') {
        payload.quantidade_pontos = Number(quantidadePontos);
        payload.prazo_valor = Number(prazoValor);
        payload.unidade_prazo = unidadePrazo;
      }

      const res = await api.post('/objetivo-consultor', payload);

      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('goalCreatedSuccess', 'Objetivo pessoal criado com sucesso!'),
          timer: 2000,
          showConfirmButton: false
        });

        if (onSuccess) {
          onSuccess(res.data.data);
        }
        onClose();
      }
    } catch (err) {
      console.error('Erro ao criar objetivo:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('errorCreatingGoal', 'Erro ao criar o objetivo pessoal.')
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div 
        className="users-modal-overlay" 
        style={{ zIndex: 1060, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(15, 23, 42, 0.75)' }} 
        onClick={onClose}
      />
      <div 
        className="users-modal rounded-4 shadow-lg border bg-panel" 
        style={{ 
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          maxWidth: '780px', 
          width: '92%',
          zIndex: 1070, 
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--panel)',
          borderColor: 'var(--sidebar-border)',
          overflow: 'hidden'
        }}
      >
        {/* Header */}
        <div 
          className="users-modal-header border-bottom p-4 d-flex align-items-center justify-content-between"
          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
        >
          <div className="d-flex align-items-center gap-3">
            <div 
              className="rounded-circle d-flex align-items-center justify-content-center bg-primary bg-opacity-10 text-primary"
              style={{ width: '46px', height: '46px', fontSize: '1.4rem' }}
            >
              🎯
            </div>
            <div>
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)' }}>
                {t('createGoalModalTitle', 'Definir Novo Objetivo Pessoal')}
              </h5>
              <p className="text-muted small mb-0">
                {t('createGoalModalSubtitle', 'Escolha o tipo de desafio e estabeleça as suas metas.')}
              </p>
            </div>
          </div>
          <button 
            type="button" 
            className="btn-close" 
            onClick={onClose} 
            disabled={submitting}
            aria-label="Close"
            style={{ filter: document.documentElement.getAttribute('data-theme') === 'dark' ? 'invert(1) grayscale(100%)' : 'none' }}
          />
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="d-flex flex-column flex-grow-1 overflow-hidden">
          <div className="p-4 overflow-y-auto flex-grow-1" style={{ backgroundColor: 'var(--panel-2, #f8fafc)' }}>
            
            {/* 1. SELEÇÃO DO TIPO DE OBJETIVO */}
            <div className="mb-4">
              <label className="fw-bold small mb-2 d-flex align-items-center justify-content-between" style={{ color: 'var(--text)' }}>
                <span>{t('stepSelectType', '1. Selecione o Tipo de Objetivo')}</span>
                <span className="text-muted fw-normal" style={{ fontSize: '0.78rem' }}>
                  {activeObjetivos.length} / 5 {t('activeGoals', 'Ativos')}
                </span>
              </label>

              {loadingTipos ? (
                <div className="text-center py-4">
                  <div className="users-spinner small me-2" />
                  <span className="text-muted small">{t('loading', 'A carregar opções...')}</span>
                </div>
              ) : (
                <div className="d-flex flex-column gap-2.5">
                  {tipos.map((tp) => {
                    const isAlreadyActive = activeObjetivos.some(act => act.id_tipo_objetivo === tp.id_tipo_objetivo);
                    const isSelected = selectedTipoId === tp.id_tipo_objetivo;
                    const icon = TIPO_ICONS[tp.codigo_tipo] || '🎯';
                    const titulo = typeof tp.traducao_titulo === 'object' 
                      ? (tp.traducao_titulo[currentLang] || tp.traducao_titulo.pt) 
                      : tp.codigo_tipo;
                    const descricao = typeof tp.traducao_descricao === 'object' 
                      ? (tp.traducao_descricao[currentLang] || tp.traducao_descricao.pt) 
                      : '';

                    return (
                      <div
                        key={tp.id_tipo_objetivo}
                        onClick={() => {
                          if (!isAlreadyActive && !submitting) {
                            setSelectedTipoId(tp.id_tipo_objetivo);
                          }
                        }}
                        className={`p-3 rounded-3 border d-flex align-items-start gap-3 transition-all ${
                          isAlreadyActive 
                            ? 'opacity-50 cursor-not-allowed bg-light' 
                            : isSelected 
                            ? 'border-primary shadow-sm' 
                            : 'hover-shadow-sm cursor-pointer'
                        }`}
                        style={{
                          backgroundColor: isSelected ? 'var(--panel)' : 'var(--panel)',
                          borderColor: isSelected ? '#3b82f6' : 'var(--sidebar-border)',
                          borderWidth: isSelected ? '2px' : '1px'
                        }}
                      >
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                          style={{ 
                            width: '42px', 
                            height: '42px', 
                            fontSize: '1.3rem',
                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'var(--panel-2)'
                          }}
                        >
                          {icon}
                        </div>

                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-1">
                            <span className="fw-bold" style={{ color: 'var(--text)', fontSize: '0.95rem' }}>
                              {titulo}
                            </span>
                            {isAlreadyActive && (
                              <span className="badge bg-warning bg-opacity-20 text-dark border border-warning px-2 py-0.5 rounded-pill small" style={{ fontSize: '0.72rem' }}>
                                ⚠️ {t('typeAlreadyActive', 'Já possui um objetivo ativo deste tipo')}
                              </span>
                            )}
                          </div>
                          <p className="text-muted small mb-0" style={{ fontSize: '0.82rem', lineHeight: '1.35' }}>
                            {descricao}
                          </p>
                        </div>

                        <div className="form-check mt-1 flex-shrink-0">
                          <input
                            type="radio"
                            className="form-check-input"
                            checked={isSelected}
                            disabled={isAlreadyActive || submitting}
                            onChange={() => setSelectedTipoId(tp.id_tipo_objetivo)}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 2. PARÂMETROS DA META DINÂMICOS */}
            {selectedTipo && !isSelectedTipoAlreadyActive && (
              <div 
                className="p-3.5 rounded-4 border mb-4 shadow-sm"
                style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}
              >
                <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: 'var(--text)' }}>
                  <span>⚙️</span>
                  <span>{t('stepConfigureParams', '2. Configure os Parâmetros da Meta')}</span>
                </h6>

                <div className="row g-3">
                  {/* Para Tipos 1, 2, 4: Quantidade de Badges (3 a 5) */}
                  {(codigoTipo === 'BADGES_NORMAL_TEMPO' || codigoTipo === 'BADGES_NORMAL_DIVERSIDADE' || codigoTipo === 'BADGES_ESPECIAL_TEMPO') && (
                    <div className="col-12 col-sm-6">
                      <NumericStepper
                        label={codigoTipo === 'BADGES_ESPECIAL_TEMPO' ? t('specialBadgesQuantity', 'Badges Especiais a Obter') : t('normalBadgesQuantity', 'Badges Normais a Obter')}
                        value={quantidadeBadges}
                        onChange={setQuantidadeBadges}
                        min={3}
                        max={5}
                        step={1}
                        disabled={submitting}
                      />
                    </div>
                  )}

                  {/* Para Tipos 3 e 5: Quantidade de Pontos (100 a 2000) */}
                  {(codigoTipo === 'PONTOS_NORMAL_TEMPO' || codigoTipo === 'PONTOS_ESPECIAL_TEMPO') && (
                    <div className="col-12 col-sm-6">
                      <NumericStepper
                        label={codigoTipo === 'PONTOS_ESPECIAL_TEMPO' ? t('specialPointsQuantity', 'Pontos Especiais a Acumular') : t('normalPointsQuantity', 'Pontos Normais a Acumular')}
                        value={quantidadePontos}
                        onChange={setQuantidadePontos}
                        min={100}
                        max={2000}
                        step={50}
                        disabled={submitting}
                      />
                    </div>
                  )}

                  {/* Para Tipo 2: Tipo de Diversidade e Quantidade de Entidades */}
                  {codigoTipo === 'BADGES_NORMAL_DIVERSIDADE' && (
                    <>
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-semibold mb-1" style={{ color: 'var(--text)' }}>
                          {t('diversityTypeLabel', 'Dimensão de Diversidade')}
                        </label>
                        <select
                          className="form-select"
                          value={tipoDiversidade}
                          onChange={(e) => setTipoDiversidade(e.target.value)}
                          disabled={submitting}
                          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)', color: 'var(--text)' }}
                        >
                          <option value="area">{t('divArea', 'Áreas Distintas')}</option>
                          <option value="service_line">{t('divServiceLine', 'Linhas de Serviço Distintas')}</option>
                          <option value="learning_path">{t('divLearningPath', 'Learning Paths Distintos')}</option>
                        </select>
                      </div>

                      <div className="col-12 col-sm-6">
                        <NumericStepper
                          label={t('diversityQuantityLabel', 'Nº de Entidades Distintas')}
                          value={quantidadeDiversidade}
                          onChange={setQuantidadeDiversidade}
                          min={diversidadeLimits.min}
                          max={diversidadeLimits.max}
                          step={1}
                          disabled={submitting}
                        />
                      </div>

                      <div className="col-12">
                        <div className="alert alert-info py-2 px-3 mb-0 d-flex align-items-center gap-2 small rounded-3">
                          <span>ℹ️</span>
                          <span>{t('noDeadlineNotice', 'Este tipo não tem prazo e envia uma notificação a cada 7 dias.')}</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Para Tipos com Prazo (1, 3, 4, 5): Unidade e Valor de Prazo */}
                  {codigoTipo !== 'BADGES_NORMAL_DIVERSIDADE' && (
                    <>
                      <div className="col-12 col-sm-6">
                        <label className="form-label small fw-semibold mb-1" style={{ color: 'var(--text)' }}>
                          {t('deadlineUnitLabel', 'Unidade de Prazo')}
                        </label>
                        <select
                          className="form-select"
                          value={unidadePrazo}
                          onChange={(e) => setUnidadePrazo(e.target.value)}
                          disabled={submitting}
                          style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)', color: 'var(--text)' }}
                        >
                          <option value="dias">{t('unitDays', 'Dias')}</option>
                          <option value="semanas">{t('unitWeeks', 'Semanas')}</option>
                          <option value="meses">{t('unitMonths', 'Meses')}</option>
                        </select>
                      </div>

                      <div className="col-12 col-sm-6">
                        <NumericStepper
                          label={t('deadlineValueLabel', 'Duração do Prazo')}
                          value={prazoValor}
                          onChange={setPrazoValor}
                          min={prazoLimits.min}
                          max={prazoLimits.max}
                          step={prazoLimits.step}
                          disabled={submitting}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* 3. RESUMO DINÂMICO DA META (LIVE PREVIEW) */}
            {selectedTipo && !isSelectedTipoAlreadyActive && (
              <div 
                className="p-3.5 rounded-4 border border-primary border-opacity-30 shadow-sm"
                style={{ 
                  background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.08) 0%, rgba(37, 99, 235, 0.04) 100%)',
                  borderColor: 'rgba(59, 130, 246, 0.3)' 
                }}
              >
                <div className="d-flex align-items-center gap-2 mb-1.5">
                  <span className="badge bg-primary bg-opacity-15 text-primary border border-primary border-opacity-25 px-2 py-0.5 rounded-pill small fw-semibold">
                    📋 {t('stepPreview', 'Resumo da Sua Meta')}
                  </span>
                </div>
                <h6 className="fw-bold mb-0 text-primary" style={{ fontSize: '1.05rem', lineHeight: '1.4' }}>
                  "{metaPreviewText}"
                </h6>
              </div>
            )}

          </div>

          {/* Footer */}
          <div className="p-3.5 px-4 border-top d-flex justify-content-between align-items-center gap-2" style={{ backgroundColor: 'var(--panel)' }}>
            <button
              type="button"
              className="btn btn-outline-secondary rounded-3 px-4 py-2 fw-semibold"
              onClick={onClose}
              disabled={submitting}
            >
              {t('cancelBtn', 'Cancelar')}
            </button>

            <button
              type="submit"
              className="btn btn-primary rounded-3 px-4 py-2 fw-bold d-flex align-items-center gap-2 shadow-sm"
              disabled={submitting || !selectedTipoId || isSelectedTipoAlreadyActive}
            >
              {submitting ? (
                <div className="users-spinner small me-1" />
              ) : (
                <span>🎯</span>
              )}
              {t('createGoalBtn', 'Criar Objetivo')}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
