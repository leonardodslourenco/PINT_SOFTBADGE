import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { api } from '../../services/api';
import ManualTranslationSwitch from '../../components/ManualTranslationSwitch';
import FlagIcon from '../../components/FlagIcon';
import SearchBar from '../../components/SearchBar';

const ITEMS_PER_PAGE = 5;

export default function SettingsEspecial() {
  const { t, i18n } = useTranslation();
  const [configuracoes, setConfiguracoes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [conquistas, setConquistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isManualTranslation, setIsManualTranslation] = useState(false);

  // Form State
  const [idTipo, setIdTipo] = useState('');
  const [idConquista, setIdConquista] = useState('');
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [manualNome, setManualNome] = useState({ pt: '', en: '', es: '' });
  const [manualDesc, setManualDesc] = useState({ pt: '', en: '', es: '' });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resConfigs, resTipos, resConquistas] = await Promise.all([
        api.get('/configuracao-badge-especial'),
        api.get('/conquista-especial/tipos'),
        api.get('/conquista-especial')
      ]);

      if (resConfigs.data?.success) {
        setConfiguracoes(resConfigs.data.data || []);
      }
      if (resTipos.data?.success) {
        setTipos(resTipos.data.data || []);
      }
      if (resConquistas.data?.success) {
        setConquistas(resConquistas.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao obter configurações de badges especiais:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, i18n.language]);

  const selectedTipoObj = useMemo(() => {
    if (!idTipo) return null;
    return tipos.find((tp) => String(tp.id_tipo_badge_especial) === String(idTipo)) || null;
  }, [idTipo, tipos]);

  const handleOpenCreate = () => {
    setIdTipo('');
    setIdConquista('');
    setNome('');
    setDescricao('');
    setIsManualTranslation(false);
    setManualNome({ pt: '', en: '', es: '' });
    setManualDesc({ pt: '', en: '', es: '' });
    setShowModal(true);
  };

  const handleToggleManualTranslation = (enabled) => {
    setIsManualTranslation(enabled);
    if (enabled && !manualNome.pt && nome) {
      setManualNome({ pt: nome, en: nome, es: nome });
      setManualDesc({ pt: descricao, en: descricao, es: descricao });
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!idTipo || !idConquista) {
      Swal.fire({
        icon: 'warning',
        title: t('warningTitle', 'Atenção'),
        text: t('selectRequiredFieldsError', 'Deve selecionar o Tipo de Badge Especial e a Conquista Especial.')
      });
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        id_tipo_badge_especial: idTipo,
        id_conquista_especial: idConquista,
        nome: isManualTranslation ? manualNome : nome,
        descricao: isManualTranslation ? manualDesc : descricao
      };

      await api.post('/configuracao-badge-especial', payload);

      Swal.fire({
        icon: 'success',
        title: t('successTitle', 'Sucesso!'),
        text: t('ruleCreatedSuccess', 'Regra de Badge Especial criada com sucesso!'),
        timer: 1600,
        showConfirmButton: false
      });

      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Erro ao guardar regra:', err);
      Swal.fire({
        icon: 'error',
        title: t('errorTitle', 'Erro'),
        text: err.response?.data?.message || t('errorGeneric', 'Erro ao guardar regra.')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (config) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: t('deleteRuleConfirmTitle', 'Desativar Regra?'),
      text: `${t('deleteRuleConfirmText', 'Tem a certeza de que deseja desativar esta regra:')} "${config.nome}"?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('yesInactivate', 'Sim, desativar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/configuracao-badge-especial/${config.id_configuracao_badge_especial}`);
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('ruleDeletedSuccess', 'Regra desativada com sucesso!'),
          timer: 1600,
          showConfirmButton: false
        });
        fetchData();
      } catch (err) {
        console.error('Erro ao desativar regra:', err);
        Swal.fire({
          icon: 'error',
          title: t('errorTitle', 'Erro'),
          text: err.response?.data?.message || t('errorGeneric', 'Erro ao desativar regra.')
        });
      }
    }
  };

  // Filtering & Pagination
  const filteredConfigs = useMemo(() => {
    if (!searchQuery.trim()) return configuracoes;
    const q = searchQuery.toLowerCase();
    return configuracoes.filter(
      (c) =>
        c.nome?.toLowerCase().includes(q) ||
        c.descricao?.toLowerCase().includes(q) ||
        c.tipo_badge_especial?.titulo?.toLowerCase().includes(q) ||
        c.conquista_especial?.titulo?.toLowerCase().includes(q)
    );
  }, [configuracoes, searchQuery]);

  const totalPages = Math.ceil(filteredConfigs.length / ITEMS_PER_PAGE) || 1;
  const paginatedConfigs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredConfigs.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredConfigs, currentPage]);

  return (
    <div className="users-admin-container">
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            ⚙️ {t('settingsEspecialTitle', 'Configuração de Regras de Badges Especiais')}
          </h3>
          <p className="text-muted small mb-0">
            {t('settingsEspecialSubtitle', 'Gerir associações entre tipos de comprovação e badges especiais')}
          </p>
        </div>
        <button
          className="btn btn-primary fw-semibold px-3 d-flex align-items-center gap-2"
          style={{ borderRadius: '8px' }}
          onClick={handleOpenCreate}
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('createRuleBtn', 'Criar Regra')}
        </button>
      </div>

      {/* Search Bar */}
      <div className="card border-0 shadow-sm p-3 mb-4 rounded-3" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('searchRulesPlaceholder', 'Pesquisar Regras...')}
        />
      </div>

      {/* Table Card */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading py-5">
            <div className="users-spinner" />
            <span>{t('loading', 'A carregar...')}</span>
          </div>
        ) : (
          <>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{t('colRequirementType', 'Tipo de Comprovação')}</th>
                    <th>{t('colBadgeName', 'Badge Especial')}</th>
                    <th>{t('ruleNameLabel', 'Nome da Regra')}</th>
                    <th>{t('ruleDescLabel', 'Descrição')}</th>
                    <th className="text-end">{t('colActions', 'Ações')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedConfigs.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-4 text-muted">
                        {t('noSpecialRulesFound', 'Nenhuma regra configurada de momento.')}
                      </td>
                    </tr>
                  ) : (
                    paginatedConfigs.map((cfg) => (
                      <tr key={cfg.id_configuracao_badge_especial}>
                        <td>
                          <span className="badge bg-light-subtle text-dark border px-2.5 py-1.5 rounded-3 d-inline-flex align-items-center gap-1.5" style={{ borderColor: 'var(--sidebar-border)' }}>
                            <span>{cfg.tipo_badge_especial?.requer_link ? '🌐' : '📜'}</span>
                            <span className="fw-semibold small">{cfg.tipo_badge_especial?.titulo}</span>
                          </span>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <span>🌟</span>
                            <strong style={{ color: 'var(--text)' }}>
                              {cfg.conquista_especial?.titulo || '—'}
                            </strong>
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text)' }}>{cfg.nome}</strong>
                        </td>
                        <td style={{ maxWidth: '300px' }} className="text-truncate" title={cfg.descricao}>
                          <span className="text-muted small">{cfg.descricao}</span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-outline-danger py-1 px-2.5 rounded-2 d-inline-flex align-items-center gap-1"
                            onClick={() => handleDelete(cfg)}
                            title={t('deleteBtn', 'Desativar')}
                          >
                            🗑️ {t('deleteBtn', 'Desativar')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredConfigs.length > 0 && (
              <div className="users-table-footer mt-3 d-flex justify-content-between align-items-center p-3">
                <span className="users-count-text text-muted small">
                  {t('showingRules', { shown: paginatedConfigs.length, total: filteredConfigs.length })}
                </span>
                <div className="users-pagination d-flex gap-1 align-items-center">
                  <button
                    className="users-pag-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    &laquo;
                  </button>
                  <span className="small px-2 text-muted">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    className="users-pag-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    &raquo;
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Criar Regra */}
      {showModal && (
        <>
          <div className="users-modal-overlay" style={{ zIndex: 1060 }} onClick={() => setShowModal(false)} />
          <div
            className="users-modal"
            style={{
              maxWidth: '620px',
              width: '92%',
              zIndex: 1070,
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: 'var(--panel)',
              color: 'var(--text)',
              borderRadius: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              border: '1px solid var(--sidebar-border)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header */}
            <div className="users-modal-header border-bottom p-3 d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--sidebar-border)' }}>
              <h5 className="fw-bold mb-0" style={{ color: 'var(--text)', fontSize: '1.15rem' }}>
                ✨ {t('createRuleBtn', 'Criar Regra de Badge Especial')}
              </h5>
              <div className="d-flex align-items-center gap-3">
                <ManualTranslationSwitch
                  checked={isManualTranslation}
                  onChange={handleToggleManualTranslation}
                  disabled={submitting}
                  id="manualTranslateRuleSwitch"
                />
                <button
                  type="button"
                  className="users-modal-close"
                  onClick={() => setShowModal(false)}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                >
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSave}>
              <div style={{ maxHeight: 'calc(80vh - 130px)', overflowY: 'auto', padding: '24px' }}>
                <div className="d-flex flex-column gap-3">
                  {/* Seletor Tipo de Badge Especial */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('colRequirementType', 'Tipo de Badge Especial *')}
                    </label>
                    <select
                      className="form-select"
                      value={idTipo}
                      onChange={(e) => setIdTipo(e.target.value)}
                      disabled={submitting}
                      required
                      style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                    >
                      <option value="">{t('selectEspecialTypeOption', 'Selecione o Tipo de Badge Especial...')}</option>
                      {tipos.map((tp) => (
                        <option key={tp.id_tipo_badge_especial} value={tp.id_tipo_badge_especial} title={tp.descricao}>
                          {tp.requer_link ? '🌐 ' : '📜 '}
                          {tp.titulo} ({tp.requer_link ? 'Link Público' : 'PDF até 5MB'})
                        </option>
                      ))}
                    </select>
                    {selectedTipoObj?.descricao && (
                      <div className="mt-2 p-2 px-3 rounded-3 border d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)', fontSize: '0.8rem' }}>
                        <span>{selectedTipoObj.requer_link ? '🌐' : '💡'}</span>
                        <span className="text-muted" style={{ lineHeight: 1.4 }}>{selectedTipoObj.descricao}</span>
                      </div>
                    )}
                  </div>

                  {/* Seletor Badge Especial */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('colBadgeName', 'Badge Especial Associado *')}
                    </label>
                    <select
                      className="form-select"
                      value={idConquista}
                      onChange={(e) => setIdConquista(e.target.value)}
                      disabled={submitting}
                      required
                      style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                    >
                      <option value="">{t('selectEspecialBadgeOption', 'Selecione o Badge Especial...')}</option>
                      {conquistas.map((c) => (
                        <option key={c.id_conquista_especial} value={c.id_conquista_especial}>
                          🌟 {c.titulo} (+{c.pontos_bonus} pts)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Nome da Regra */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('ruleNameLabel', 'Nome da Regra *')}
                    </label>
                    {!isManualTranslation ? (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Validação de Certificado AWS Cloud"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        disabled={submitting}
                        required
                        style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                      />
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        <div className="input-group">
                          <span className="input-group-text d-flex align-items-center gap-1.5" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)', color: 'var(--text)' }}>
                            <FlagIcon lang="pt" /> <small className="fw-bold">PT</small>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Nome em Português"
                            value={manualNome.pt}
                            onChange={(e) => setManualNome((prev) => ({ ...prev, pt: e.target.value }))}
                            disabled={submitting}
                            required
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          />
                        </div>
                        <div className="input-group">
                          <span className="input-group-text d-flex align-items-center gap-1.5" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)', color: 'var(--text)' }}>
                            <FlagIcon lang="en" /> <small className="fw-bold">EN</small>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Name in English"
                            value={manualNome.en}
                            onChange={(e) => setManualNome((prev) => ({ ...prev, en: e.target.value }))}
                            disabled={submitting}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          />
                        </div>
                        <div className="input-group">
                          <span className="input-group-text d-flex align-items-center gap-1.5" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)', color: 'var(--text)' }}>
                            <FlagIcon lang="es" /> <small className="fw-bold">ES</small>
                          </span>
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Nombre en Español"
                            value={manualNome.es}
                            onChange={(e) => setManualNome((prev) => ({ ...prev, es: e.target.value }))}
                            disabled={submitting}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Descricao da Regra */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('ruleDescLabel', 'Descrição da Regra *')}
                    </label>
                    {!isManualTranslation ? (
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Descreva as condições para validação desta regra..."
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        disabled={submitting}
                        required
                        style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                      />
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        <div className="input-group">
                          <span className="input-group-text d-flex align-items-center gap-1.5" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)', color: 'var(--text)' }}>
                            <FlagIcon lang="pt" /> <small className="fw-bold">PT</small>
                          </span>
                          <textarea
                            className="form-control"
                            rows="2"
                            placeholder="Descrição em Português"
                            value={manualDesc.pt}
                            onChange={(e) => setManualDesc((prev) => ({ ...prev, pt: e.target.value }))}
                            disabled={submitting}
                            required
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          />
                        </div>
                        <div className="input-group">
                          <span className="input-group-text d-flex align-items-center gap-1.5" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)', color: 'var(--text)' }}>
                            <FlagIcon lang="en" /> <small className="fw-bold">EN</small>
                          </span>
                          <textarea
                            className="form-control"
                            rows="2"
                            placeholder="Description in English"
                            value={manualDesc.en}
                            onChange={(e) => setManualDesc((prev) => ({ ...prev, en: e.target.value }))}
                            disabled={submitting}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          />
                        </div>
                        <div className="input-group">
                          <span className="input-group-text d-flex align-items-center gap-1.5" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)', color: 'var(--text)' }}>
                            <FlagIcon lang="es" /> <small className="fw-bold">ES</small>
                          </span>
                          <textarea
                            className="form-control"
                            rows="2"
                            placeholder="Descripción en Español"
                            value={manualDesc.es}
                            onChange={(e) => setManualDesc((prev) => ({ ...prev, es: e.target.value }))}
                            disabled={submitting}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="users-modal-footer border-top p-3 d-flex justify-content-end gap-2 bg-panel" style={{ borderColor: 'var(--sidebar-border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary rounded-3 px-3 fw-semibold"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  {t('cancelBtn', 'Cancelar')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-3 px-4 fw-semibold d-flex align-items-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="users-spinner" style={{ width: '16px', height: '16px' }} />
                      <span>{t('saving', 'A guardar...')}</span>
                    </>
                  ) : (
                    <span>{t('createRuleBtn', 'Criar Regra')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
