import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { api, API_BASE_URL } from '../services/api';
import ManualTranslationSwitch from './ManualTranslationSwitch';
import FlagIcon from './FlagIcon';
import SearchBar from './SearchBar';

const ITEMS_PER_PAGE = 5;

export default function GestorBadgeEspecial() {
  const { t, i18n } = useTranslation();
  const [conquistas, setConquistas] = useState([]);
  const [configuracoes, setConfiguracoes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [isManualTranslation, setIsManualTranslation] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [pontosBonus, setPontosBonus] = useState(100);
  const [idConfiguracao, setIdConfiguracao] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  // Manual translations state
  const [manualTitulo, setManualTitulo] = useState({ pt: '', en: '', es: '' });
  const [manualDescricao, setManualDescricao] = useState({ pt: '', en: '', es: '' });

  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [resConquistas, resConfigs] = await Promise.all([
        api.get('/conquista-especial'),
        api.get('/conquista-especial/configuracoes')
      ]);

      if (resConquistas.data?.success) {
        setConquistas(resConquistas.data.data || []);
      }
      if (resConfigs.data?.success) {
        setConfiguracoes(resConfigs.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao obter Badges Especiais:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(false);
  }, [fetchData, i18n.language]);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingId(null);
    setTitulo('');
    setDescricao('');
    setPontosBonus(100);
    setIdConfiguracao('');
    setLogoFile(null);
    setLogoPreview(null);
    setIsManualTranslation(false);
    setManualTitulo({ pt: '', en: '', es: '' });
    setManualDescricao({ pt: '', en: '', es: '' });
    setShowModal(true);
  };

  const handleOpenEdit = async (conquista) => {
    setIsEditMode(true);
    setEditingId(conquista.id_conquista_especial);
    setTitulo(conquista.titulo || '');
    setDescricao(conquista.descricao || '');
    setPontosBonus(conquista.pontos_bonus || 100);
    setIdConfiguracao(conquista.configuracao?.id_configuracao_badge_especial || '');
    setLogoFile(null);
    setLogoPreview(conquista.logo_conquista ? `${API_BASE_URL}/uploads/logo_especial/${conquista.logo_conquista}` : null);
    setIsManualTranslation(false);

    try {
      const [resPT, resEN, resES] = await Promise.all([
        api.get(`/conquista-especial/${conquista.id_conquista_especial}?lang=pt`),
        api.get(`/conquista-especial/${conquista.id_conquista_especial}?lang=en`),
        api.get(`/conquista-especial/${conquista.id_conquista_especial}?lang=es`)
      ]);

      setManualTitulo({
        pt: resPT.data?.data?.titulo || conquista.titulo || '',
        en: resEN.data?.data?.titulo || conquista.titulo || '',
        es: resES.data?.data?.titulo || conquista.titulo || ''
      });

      setManualDescricao({
        pt: resPT.data?.data?.descricao || conquista.descricao || '',
        en: resEN.data?.data?.descricao || conquista.descricao || '',
        es: resES.data?.data?.descricao || conquista.descricao || ''
      });
    } catch {
      setManualTitulo({ pt: conquista.titulo || '', en: conquista.titulo || '', es: conquista.titulo || '' });
      setManualDescricao({ pt: conquista.descricao || '', en: conquista.descricao || '', es: conquista.descricao || '' });
    }

    setShowModal(true);
  };

  const handleToggleManualTranslation = (enabled) => {
    setIsManualTranslation(enabled);
    if (enabled && !manualTitulo.pt && titulo) {
      setManualTitulo({ pt: titulo, en: titulo, es: titulo });
      setManualDescricao({ pt: descricao, en: descricao, es: descricao });
    }
  };

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: t('invalidFormat', 'Formato Inválido'),
        text: t('photoFormatNotice', 'Apenas ficheiros PNG ou JPEG (JPG) são permitidos.')
      });
      e.target.value = '';
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (pontosBonus < 1 || pontosBonus > 1000) {
      Swal.fire({
        icon: 'warning',
        title: t('warningTitle', 'Atenção'),
        text: t('bonusPointsRangeError', 'Os pontos bónus devem estar entre 1 e 1000.')
      });
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();

      if (isManualTranslation) {
        formData.append('titulo', JSON.stringify(manualTitulo));
        formData.append('descricao', JSON.stringify(manualDescricao));
      } else {
        formData.append('titulo', titulo);
        formData.append('descricao', descricao);
      }

      formData.append('pontos_bonus', pontosBonus);
      if (idConfiguracao) {
        formData.append('id_configuracao_badge_especial', idConfiguracao);
      }
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      if (isEditMode) {
        await api.put(`/conquista-especial/${editingId}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('badgeUpdatedSuccess', 'Badge Especial atualizado com sucesso!'),
          timer: 1600,
          showConfirmButton: false
        });
      } else {
        await api.post('/conquista-especial', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('badgeCreatedSuccess', 'Badge Especial criado com sucesso!'),
          timer: 1600,
          showConfirmButton: false
        });
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      console.error('Erro ao guardar Badge Especial:', err);
      Swal.fire({
        icon: 'error',
        title: t('errorTitle', 'Erro'),
        text: err.response?.data?.message || t('errorGeneric', 'Erro ao guardar Badge Especial.')
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (conquista) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: t('deleteConfirmTitle', 'Inativar Badge Especial?'),
      text: `${t('deleteConfirmText', 'Tem a certeza de que deseja inativar:')} "${conquista.titulo}"?`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('yesInactivate', 'Sim, inativar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/conquista-especial/${conquista.id_conquista_especial}`);
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('badgeDeletedSuccess', 'Badge Especial inativado com sucesso!'),
          timer: 1600,
          showConfirmButton: false
        });
        fetchData();
      } catch (err) {
        console.error('Erro ao inativar Badge Especial:', err);
        Swal.fire({
          icon: 'error',
          title: t('errorTitle', 'Erro'),
          text: err.response?.data?.message || t('errorGeneric', 'Erro ao inativar Badge Especial.')
        });
      }
    }
  };

  // Filtering & Pagination
  const filteredConquistas = useMemo(() => {
    if (!searchQuery.trim()) return conquistas;
    const q = searchQuery.toLowerCase();
    return conquistas.filter(
      (c) =>
        c.titulo?.toLowerCase().includes(q) ||
        c.descricao?.toLowerCase().includes(q) ||
        c.tipo_badge_especial?.nome?.toLowerCase().includes(q)
    );
  }, [conquistas, searchQuery]);

  const totalPages = Math.ceil(filteredConquistas.length / ITEMS_PER_PAGE) || 1;
  const paginatedConquistas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredConquistas.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredConquistas, currentPage]);

  return (
    <div>
      {/* Header Row */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h4 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            ✨ {t('tabEspeciaisCatalog', 'Catálogo de Badges Especiais')}
          </h4>
          <p className="text-muted small mb-0">
            {t('especialBadgesSubtitle', 'Gestão e atribuição de certificações e comprovativos externos')}
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
          {t('createEspecialBadgeBtn', 'Criar Badge Especial')}
        </button>
      </div>

      {/* Search Input */}
      <div className="card border-0 shadow-sm p-3 mb-4 rounded-3" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('searchEspeciaisPlaceholder', 'Pesquisar Badges Especiais...')}
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
                    <th>Logo</th>
                    <th>{t('colBadgeName', 'Título')}</th>
                    <th>{t('colDescription', 'Descrição')}</th>
                    <th>{t('colBonusPoints', 'Pontos Bónus')}</th>
                    <th>{t('colRequirementType', 'Tipo de Comprovação')}</th>
                    <th className="text-end">{t('colActions', 'Ações')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedConquistas.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        {t('noSpecialBadgesFound', 'Nenhum Badge Especial encontrado.')}
                      </td>
                    </tr>
                  ) : (
                    paginatedConquistas.map((c) => (
                      <tr key={c.id_conquista_especial}>
                        <td>
                          <div
                            className="rounded-3 d-flex align-items-center justify-content-center p-1 border"
                            style={{ width: '42px', height: '42px', backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}
                          >
                            {c.logo_conquista ? (
                              <img
                                src={`${API_BASE_URL}/uploads/logo_especial/${c.logo_conquista}`}
                                alt={c.titulo}
                                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                              />
                            ) : (
                              <span>🌟</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <strong style={{ color: 'var(--text)' }}>{c.titulo}</strong>
                        </td>
                        <td style={{ maxWidth: '280px' }} className="text-truncate" title={c.descricao}>
                          <span className="text-muted small">{c.descricao}</span>
                        </td>
                        <td>
                          <span className="badge bg-warning text-dark fw-bold px-2.5 py-1 rounded-pill" style={{ fontSize: '0.82rem' }}>
                            ⚡ +{c.pontos_bonus} pts
                          </span>
                        </td>
                        <td>
                          {c.tipo_badge_especial ? (
                            <span className="badge bg-light-subtle text-dark border px-2.5 py-1 rounded-pill small" style={{ borderColor: 'var(--sidebar-border)' }}>
                              {c.tipo_badge_especial.requer_link ? '🌐 ' : '📜 '}
                              {c.tipo_badge_especial.nome}
                            </span>
                          ) : (
                            <span className="text-muted small">—</span>
                          )}
                        </td>
                        <td className="text-end">
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              className="btn btn-sm btn-outline-primary py-1 px-2.5 rounded-2 d-flex align-items-center gap-1"
                              onClick={() => handleOpenEdit(c)}
                              title={t('editBtn', 'Editar')}
                            >
                              ✏️ {t('editBtn', 'Editar')}
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger py-1 px-2.5 rounded-2 d-flex align-items-center gap-1"
                              onClick={() => handleDelete(c)}
                              title={t('deleteBtn', 'Inativar')}
                            >
                              🗑️ {t('deleteBtn', 'Inativar')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredConquistas.length > 0 && (
              <div className="users-table-footer mt-3 d-flex justify-content-between align-items-center p-3">
                <span className="users-count-text text-muted small">
                  {t('showingEspeciais', { shown: paginatedConquistas.length, total: filteredConquistas.length })}
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

      {/* Modal Criar / Editar Badge Especial */}
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
                {isEditMode ? `✏️ ${t('editEspecialBadgeBtn', 'Editar Badge Especial')}` : `✨ ${t('createEspecialBadgeBtn', 'Criar Badge Especial')}`}
              </h5>
              <div className="d-flex align-items-center gap-3">
                <ManualTranslationSwitch
                  checked={isManualTranslation}
                  onChange={handleToggleManualTranslation}
                  disabled={submitting}
                  id="manualTranslateEspecialSwitch"
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
                  {/* Titulo */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('colBadgeName', 'Título do Badge Especial *')}
                    </label>
                    {!isManualTranslation ? (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Certificação AWS Cloud Practitioner"
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
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
                            placeholder="Título em Português"
                            value={manualTitulo.pt}
                            onChange={(e) => setManualTitulo((prev) => ({ ...prev, pt: e.target.value }))}
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
                            placeholder="Title in English"
                            value={manualTitulo.en}
                            onChange={(e) => setManualTitulo((prev) => ({ ...prev, en: e.target.value }))}
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
                            placeholder="Título en Español"
                            value={manualTitulo.es}
                            onChange={(e) => setManualTitulo((prev) => ({ ...prev, es: e.target.value }))}
                            disabled={submitting}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Descricao */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('colDescription', 'Descrição *')}
                    </label>
                    {!isManualTranslation ? (
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Descreva o badge especial e as competências validadas..."
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
                            value={manualDescricao.pt}
                            onChange={(e) => setManualDescricao((prev) => ({ ...prev, pt: e.target.value }))}
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
                            value={manualDescricao.en}
                            onChange={(e) => setManualDescricao((prev) => ({ ...prev, en: e.target.value }))}
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
                            value={manualDescricao.es}
                            onChange={(e) => setManualDescricao((prev) => ({ ...prev, es: e.target.value }))}
                            disabled={submitting}
                            style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pontos Bonus */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('bonusPointsLabel', 'Pontos Bónus (1 a 1000) *')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      className="form-control"
                      value={pontosBonus}
                      onChange={(e) => setPontosBonus(parseInt(e.target.value) || 0)}
                      disabled={submitting}
                      required
                      style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                    />
                  </div>

                  {/* Associar a Regra / Configuração */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('settingsEspecialTitle', 'Regra de Conquista Associada (Opcional)')}
                    </label>
                    <select
                      className="form-select"
                      value={idConfiguracao}
                      onChange={(e) => setIdConfiguracao(e.target.value)}
                      disabled={submitting}
                      style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                    >
                      <option value="">{t('selectRuleOption', 'Nenhuma / Associar mais tarde')}</option>
                      {configuracoes.map((cfg) => (
                        <option key={cfg.id_configuracao_badge_especial} value={cfg.id_configuracao_badge_especial}>
                          {cfg.tipo_badge_especial?.requer_link ? '🌐 ' : '📜 '}
                          {cfg.nome} ({cfg.tipo_badge_especial?.titulo || 'Tipo'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Upload Logo */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('especialLogoLabel', 'Logo / Imagem do Badge Especial')}
                    </label>
                    <div className="d-flex align-items-center gap-3">
                      {logoPreview && (
                        <div
                          className="rounded-3 d-flex align-items-center justify-content-center p-1 border flex-shrink-0"
                          style={{ width: '56px', height: '56px', backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}
                        >
                          <img src={logoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/png, image/jpeg, image/jpg, .png, .jpg, .jpeg"
                        className="form-control"
                        onChange={handleLogoChange}
                        disabled={submitting}
                        style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                      />
                    </div>
                    <small className="text-muted small d-block mt-1">
                      {t('selectBadgeLogoHelp', 'Selecione uma imagem para o logótipo em formato PNG ou JPEG (deixe vazio para manter o padrão ou a atual).')}
                    </small>
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
                    <span>{isEditMode ? t('saveChangesBtn', 'Guardar Alterações') : t('createBtn', 'Criar')}</span>
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
