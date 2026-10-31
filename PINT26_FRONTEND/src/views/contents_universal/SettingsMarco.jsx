import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import Swal from 'sweetalert2';
import { api } from '../../services/api';
import { useAppContext } from '../../context/AppContext';
import ManualTranslationSwitch from '../../components/ManualTranslationSwitch';
import FlagIcon from '../../components/FlagIcon';
import ToolTipsMarco from '../../components/ToolTipsMarco';
import SearchBar from '../../components/SearchBar';

const ITEMS_PER_PAGE = 5;

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

export default function SettingsMarco() {
  const { t, i18n } = useTranslation();
  const { triggerCountsUpdate, socket } = useAppContext();
  const [marcos, setMarcos] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive
  const [currentPage, setCurrentPage] = useState(1);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Translation Switch State
  const [isManualTranslation, setIsManualTranslation] = useState(false);

  // Form Fields
  const [formData, setFormData] = useState({
    id_tipo_marco: '',
    nome: '',
    descricao: '',
    quantidade_objetivo: 1,
    ativo: true
  });

  const selectedTipoObj = useMemo(() => {
    if (!formData.id_tipo_marco) return null;
    return tipos.find((tp) => String(tp.id_tipo_marco) === String(formData.id_tipo_marco)) || null;
  }, [formData.id_tipo_marco, tipos]);

  const [manualNome, setManualNome] = useState({ pt: '', en: '', es: '' });
  const [manualDesc, setManualDesc] = useState({ pt: '', en: '', es: '' });

  // Toggle manual translation mode
  const handleToggleManualTranslation = (enable) => {
    if (enable) {
      setIsManualTranslation(true);
      const currentLang = (i18n.language || 'pt').slice(0, 2);
      setManualNome((prev) => ({
        pt: prev?.pt || formData.nome || '',
        en: prev?.en || formData.nome || '',
        es: prev?.es || formData.nome || '',
        [currentLang]: formData.nome || ''
      }));
      setManualDesc((prev) => ({
        pt: prev?.pt || formData.descricao || '',
        en: prev?.en || formData.descricao || '',
        es: prev?.es || formData.descricao || '',
        [currentLang]: formData.descricao || ''
      }));
    } else {
      setIsManualTranslation(false);
    }
  };

  // 1. Fetch data from backend
  const fetchData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [resMarcos, resTipos] = await Promise.all([
        api.get(`/utilizador-marco/configuracoes?lang=${i18n.language}`),
        api.get(`/utilizador-marco/tipos?lang=${i18n.language}`)
      ]);

      if (resMarcos.data?.success) {
        setMarcos(resMarcos.data.data || []);
      }
      if (resTipos.data?.success) {
        setTipos(resTipos.data.data || []);
      }
    } catch (err) {
      console.error('Erro ao carregar configurações de marcos:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [i18n.language]);

  useEffect(() => {
    fetchData(false);
  }, [fetchData]);

  // Real-time WebSocket updates (atualização silenciosa)
  useEffect(() => {
    if (!socket) return;

    const handleRealtimeUpdate = () => {
      fetchData(true);
    };

    socket.on('novo_marco', handleRealtimeUpdate);
    socket.on('marco_updated', handleRealtimeUpdate);
    socket.on('marco_criado', handleRealtimeUpdate);
    socket.on('marco_removido', handleRealtimeUpdate);
    socket.on('notification', handleRealtimeUpdate);

    return () => {
      socket.off('novo_marco', handleRealtimeUpdate);
      socket.off('marco_updated', handleRealtimeUpdate);
      socket.off('marco_criado', handleRealtimeUpdate);
      socket.off('marco_removido', handleRealtimeUpdate);
      socket.off('notification', handleRealtimeUpdate);
    };
  }, [socket, fetchData]);

  // Reset pagination on filter change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Filtered dataset
  const filteredMarcos = useMemo(() => {
    return marcos.filter((m) => {
      const matchesSearch =
        (m.nome || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.descricao || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.tipo_nome || '').toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;

      if (statusFilter === 'active' && !m.ativo) return false;
      if (statusFilter === 'inactive' && m.ativo) return false;

      return true;
    });
  }, [marcos, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMarcos.length / ITEMS_PER_PAGE));
  const paginatedMarcos = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredMarcos.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredMarcos, currentPage]);

  // Open Create Modal
  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingId(null);
    setIsManualTranslation(false);
    setFormData({
      id_tipo_marco: tipos.length > 0 ? tipos[0].id_tipo_marco : '',
      nome: '',
      descricao: '',
      quantidade_objetivo: 1,
      ativo: true
    });
    setManualNome({ pt: '', en: '', es: '' });
    setManualDesc({ pt: '', en: '', es: '' });
    setShowModal(true);
  };

  // Open Edit Modal
  const handleOpenEdit = async (marco) => {
    setIsEditMode(true);
    setEditingId(marco.id_marco);
    setIsManualTranslation(false);

    const initialNome = marco.nome || '';
    const initialDesc = marco.descricao || '';

    setFormData({
      id_tipo_marco: marco.id_tipo_marco || '',
      nome: initialNome,
      descricao: initialDesc,
      quantidade_objetivo: marco.quantidade_objetivo || 1,
      ativo: marco.ativo !== undefined ? marco.ativo : true
    });

    setManualNome({ pt: initialNome, en: initialNome, es: initialNome });
    setManualDesc({ pt: initialDesc, en: initialDesc, es: initialDesc });
    setShowModal(true);

    // Buscar as traduções reais nas 3 línguas (PT, EN, ES) a partir da base de dados
    try {
      const [resPt, resEn, resEs] = await Promise.all([
        api.get('/utilizador-marco/configuracoes?lang=pt').catch(() => null),
        api.get('/utilizador-marco/configuracoes?lang=en').catch(() => null),
        api.get('/utilizador-marco/configuracoes?lang=es').catch(() => null)
      ]);

      const itemPt = resPt?.data?.data?.find(m => m.id_marco === marco.id_marco);
      const itemEn = resEn?.data?.data?.find(m => m.id_marco === marco.id_marco);
      const itemEs = resEs?.data?.data?.find(m => m.id_marco === marco.id_marco);

      if (itemPt || itemEn || itemEs) {
        setManualNome({
          pt: itemPt?.nome || initialNome,
          en: itemEn?.nome || initialNome,
          es: itemEs?.nome || initialNome
        });
        setManualDesc({
          pt: itemPt?.descricao || initialDesc,
          en: itemEn?.descricao || initialDesc,
          es: itemEs?.descricao || initialDesc
        });
      }
    } catch (err) {
      console.error('Erro ao carregar traduções multi-idioma do marco:', err);
    }
  };

  // Save Marco (Create or Edit)
  const handleSave = async (e) => {
    e.preventDefault();

    // Validation
    const objNum = parseInt(formData.quantidade_objetivo, 10);
    if (isNaN(objNum) || objNum < 1 || objNum > 100) {
      Swal.fire({
        icon: 'warning',
        title: t('validationErrorTitle', 'Atenção'),
        text: t('marcoObjectiveHelp', 'A quantidade objetivo deve ser um número inteiro de 1 a 100.')
      });
      return;
    }

    if (!isEditMode && !formData.id_tipo_marco) {
      Swal.fire({
        icon: 'warning',
        title: t('validationErrorTitle', 'Atenção'),
        text: t('selectMarcoTypeOption', 'Selecione o tipo de marco.')
      });
      return;
    }

    if (!isManualTranslation && !formData.nome.trim()) {
      Swal.fire({
        icon: 'warning',
        title: t('validationErrorTitle', 'Atenção'),
        text: t('validationRequiredFields', 'Por favor preencha os campos obrigatórios.')
      });
      return;
    }

    if (isManualTranslation && (!manualNome.pt.trim() || !manualNome.en.trim() || !manualNome.es.trim())) {
      Swal.fire({
        icon: 'warning',
        title: t('validationErrorTitle', 'Atenção'),
        text: t('manualTranslationFillAll', 'Por favor preencha o nome do marco em todos os 3 idiomas.')
      });
      return;
    }

    setSubmitting(true);
    try {
      // Texto simples para tradução automática; objeto { pt, en, es } para tradução manual
      const payloadNome = isManualTranslation
        ? { pt: manualNome.pt.trim(), en: manualNome.en.trim(), es: manualNome.es.trim() }
        : formData.nome.trim();

      const payloadDesc = isManualTranslation
        ? { pt: manualDesc.pt.trim(), en: manualDesc.en.trim(), es: manualDesc.es.trim() }
        : (formData.descricao ? formData.descricao.trim() : '');

      if (isEditMode) {
        await api.put(`/utilizador-marco/configuracoes/${editingId}`, {
          nome: payloadNome,
          descricao: payloadDesc,
          quantidade_objetivo: objNum,
          ativo: formData.ativo
        });
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('marcoUpdatedSuccess', 'Marco atualizado com sucesso!'),
          timer: 1800,
          showConfirmButton: false
        });
      } else {
        await api.post('/utilizador-marco/configuracoes', {
          id_tipo_marco: formData.id_tipo_marco,
          nome: payloadNome,
          descricao: payloadDesc,
          quantidade_objetivo: objNum
        });
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('marcoCreatedSuccess', 'Marco criado com sucesso!'),
          timer: 1800,
          showConfirmButton: false
        });
      }

      setShowModal(false);
      fetchData();
      if (triggerCountsUpdate) triggerCountsUpdate();
    } catch (err) {
      console.error('Erro ao guardar marco:', err);
      Swal.fire({
        icon: 'error',
        title: t('errorTitle', 'Erro'),
        text: err.response?.data?.message || t('errorGeneric', 'Ocorreu um erro ao guardar o marco.')
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Soft Delete Marco
  const handleDelete = async (marco) => {
    const result = await Swal.fire({
      icon: 'warning',
      title: t('deleteMarcoConfirmTitle', 'Inativar Marco?'),
      text: `${t('deleteMarcoConfirmText', 'Tem a certeza de que deseja inativar esta configuração de marco?')} "${marco.nome}"`,
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('yesInactivate', 'Sim, inativar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/utilizador-marco/configuracoes/${marco.id_marco}`);
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('marcoDeletedSuccess', 'Marco inativado com sucesso!'),
          timer: 1600,
          showConfirmButton: false
        });
        fetchData();
        if (triggerCountsUpdate) triggerCountsUpdate();
      } catch (err) {
        console.error('Erro ao inativar marco:', err);
        Swal.fire({
          icon: 'error',
          title: t('errorTitle', 'Erro'),
          text: err.response?.data?.message || t('errorGeneric', 'Erro ao inativar marco.')
        });
      }
    }
  };

  return (
    <div className="users-admin-container">
      {/* Top Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            {t('marcosMgmtTitle', 'Configuração de Marcos')}
          </h3>
          <p className="text-muted small mb-0">
            {t('marcosMgmtSubtitle', 'Gerir regras e metas para celebração de conquistas dos consultores')}
          </p>
        </div>
        <button
          className="btn btn-primary fw-semibold px-3 d-flex align-items-center gap-2"
          style={{ borderRadius: '8px' }}
          onClick={handleOpenCreate}
        >
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('createMarcoBtn', 'Criar Marco')}
        </button>
      </div>

      {/* Search & Filters */}
      <div className="card border-0 shadow-sm p-3 mb-4 rounded-3" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
        <div className="row g-3 align-items-center">
          <div className="col-12 col-md-8">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('searchMarcosPlaceholder', 'Pesquisar Marco...')}
            />
          </div>
          <div className="col-12 col-md-4">
            <select
              className="form-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ backgroundColor: 'var(--panel)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
            >
              <option value="all">{t('allStatus', 'Todos os Estados')}</option>
              <option value="active">{t('statusActive', 'Ativos')}</option>
              <option value="inactive">{t('statusInactive', 'Inativos')}</option>
            </select>
          </div>
        </div>
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
                    <th>{t('colMarcoType', 'Tipo de Marco')}</th>
                    <th>{t('colMarcoName', 'Nome do Marco')}</th>
                    <th>{t('colMarcoDesc', 'Descrição')}</th>
                    <th>{t('colMarcoObjective', 'Meta / Objetivo')}</th>
                    <th>{t('colMarcoStatus', 'Estado')}</th>
                    <th className="text-end">{t('colActions', 'Ações')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMarcos.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-4 text-muted">
                        {t('noResults', 'Nenhum marco encontrado.')}
                      </td>
                    </tr>
                  ) : (
                    paginatedMarcos.map((marco) => {
                      const tipoObj = tipos.find((tp) => String(tp.id_tipo_marco) === String(marco.id_tipo_marco)) || {
                        codigo_tipo: marco.codigo_tipo,
                        titulo: marco.tipo_nome,
                        descricao: marco.tipo_descricao
                      };

                      return (
                        <tr key={marco.id_marco}>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span style={{ fontSize: '1.25rem' }}>{TIPO_ICONS[marco.codigo_tipo] || '🎖️'}</span>
                              <span className="fw-semibold small">{marco.tipo_nome}</span>
                              <ToolTipsMarco
                                tipo={tipoObj}
                                title={marco.tipo_nome}
                                description={tipoObj?.descricao || marco.tipo_descricao}
                                placement="top"
                              />
                            </div>
                          </td>
                          <td>
                            <strong style={{ color: 'var(--text)' }}>{marco.nome}</strong>
                          </td>
                          <td style={{ maxWidth: '300px' }} className="text-truncate" title={marco.descricao}>
                            <span className="text-muted small">{marco.descricao}</span>
                          </td>
                          <td>
                            <span className="badge bg-primary bg-opacity-10 text-primary px-3 py-1 rounded-pill fw-bold" style={{ fontSize: '0.82rem' }}>
                              🎯 {marco.quantidade_objetivo}
                            </span>
                          </td>
                          <td>
                            <span className={`users-status-badge ${marco.ativo ? 'active' : 'inactive'}`}>
                              {marco.ativo ? t('statusActive', 'Ativo') : t('statusInactive', 'Inativo')}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-2">
                              <button
                                className="btn btn-sm btn-outline-primary py-1 px-2.5 rounded-2 d-flex align-items-center gap-1"
                                onClick={() => handleOpenEdit(marco)}
                                title={t('editBtn', 'Editar')}
                              >
                                ✏️ {t('editBtn', 'Editar')}
                              </button>
                              <button
                                className="btn btn-sm btn-outline-danger py-1 px-2.5 rounded-2 d-flex align-items-center gap-1"
                                onClick={() => handleDelete(marco)}
                                title={t('deleteBtn', 'Inativar')}
                              >
                                🗑️ {t('deleteBtn', 'Inativar')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            {filteredMarcos.length > 0 && (
              <div className="users-table-footer mt-3 d-flex justify-content-between align-items-center">
                <span className="users-count-text">
                  {t('showingMarcos', { shown: paginatedMarcos.length, total: filteredMarcos.length })}
                </span>
                <div className="chart-pagination">
                  <button
                    className="chart-pag-btn"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <span className="chart-pag-info">{currentPage} / {totalPages}</span>
                  <button
                    className="chart-pag-btn"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Criar / Editar Marco */}
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
              borderRadius: '16px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              overflow: 'hidden'
            }}
          >
            {/* Modal Header with ManualTranslationSwitch */}
            <div className="users-modal-header border-bottom p-3 d-flex justify-content-between align-items-center" style={{ borderColor: 'var(--sidebar-border)' }}>
              <h5 className="fw-bold mb-0" style={{ color: 'var(--text)', fontSize: '1.15rem' }}>
                {isEditMode ? `✏️ ${t('editMarcoBtn', 'Editar Marco')}` : `✨ ${t('createMarcoBtn', 'Criar Marco')}`}
              </h5>
              <div className="d-flex align-items-center gap-3">
                <ManualTranslationSwitch
                  checked={isManualTranslation}
                  onChange={handleToggleManualTranslation}
                  disabled={submitting}
                  id="manualTranslateMarcoSwitch"
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

            {/* Modal Body */}
            <form onSubmit={handleSave}>
              <div style={{ maxHeight: 'calc(80vh - 130px)', overflowY: 'auto', padding: '24px' }}>
                <div className="d-flex flex-column gap-3">

                  {/* Tipo de Marco Selector */}
                  <div className="users-form-group">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <label className="text-muted small fw-bold mb-0">
                        {t('marcoTypeLabel', 'Tipo de Marco *')}
                      </label>

                    </div>
                    <select
                      className="form-select"
                      value={formData.id_tipo_marco}
                      onChange={(e) => setFormData((prev) => ({ ...prev, id_tipo_marco: e.target.value }))}
                      disabled={submitting || isEditMode}
                      style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                      required
                    >
                      <option value="">{t('selectMarcoTypeOption', 'Selecione o tipo de marco...')}</option>
                      {tipos.map((tp) => (
                        <option key={tp.id_tipo_marco} value={tp.id_tipo_marco} title={tp.descricao}>
                          {TIPO_ICONS[tp.codigo_tipo] || '🎖️'} {tp.titulo}
                        </option>
                      ))}
                    </select>
                    {selectedTipoObj?.descricao && (
                      <div className="mt-2 p-2 px-3 rounded-3 border d-flex align-items-center gap-2" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)', fontSize: '0.8rem' }}>
                        <span style={{ fontSize: '1rem', lineHeight: 1 }}>{TIPO_ICONS[selectedTipoObj.codigo_tipo] || '💡'}</span>
                        <span className="text-muted" style={{ lineHeight: 1.4 }}>{selectedTipoObj.descricao}</span>
                      </div>
                    )}
                  </div>

                  {/* Nome do Marco */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('marcoNameLabel', 'Nome do Marco *')}
                    </label>
                    {!isManualTranslation ? (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Primeiro Passo"
                        value={formData.nome}
                        onChange={(e) => setFormData((prev) => ({ ...prev, nome: e.target.value }))}
                        disabled={submitting}
                        style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                        required
                      />
                    ) : (
                      <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="pt" />
                            <span>PT</span>
                          </span>
                          <input type="text" className="form-control" placeholder="Nome em Português" value={manualNome.pt} onChange={(e) => setManualNome((prev) => ({ ...prev, pt: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="en" />
                            <span>EN</span>
                          </span>
                          <input type="text" className="form-control" placeholder="Name in English" value={manualNome.en} onChange={(e) => setManualNome((prev) => ({ ...prev, en: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="es" />
                            <span>ES</span>
                          </span>
                          <input type="text" className="form-control" placeholder="Nombre en Español" value={manualNome.es} onChange={(e) => setManualNome((prev) => ({ ...prev, es: e.target.value }))} disabled={submitting} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Descrição do Marco */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('marcoDescLabel', 'Descrição do Marco *')}
                    </label>
                    {!isManualTranslation ? (
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Ex: Marco atribuído ao iniciar a primeira candidatura a um badge..."
                        value={formData.descricao}
                        onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
                        disabled={submitting}
                        style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                      />
                    ) : (
                      <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="pt" />
                            <span>PT</span>
                          </span>
                          <textarea className="form-control" rows="2" placeholder="Descrição em Português" value={manualDesc.pt} onChange={(e) => setManualDesc((prev) => ({ ...prev, pt: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="en" />
                            <span>EN</span>
                          </span>
                          <textarea className="form-control" rows="2" placeholder="Description in English" value={manualDesc.en} onChange={(e) => setManualDesc((prev) => ({ ...prev, en: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="es" />
                            <span>ES</span>
                          </span>
                          <textarea className="form-control" rows="2" placeholder="Descripción en Español" value={manualDesc.es} onChange={(e) => setManualDesc((prev) => ({ ...prev, es: e.target.value }))} disabled={submitting} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Quantidade Objetivo (1 a 100) */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">
                      {t('marcoObjectiveLabel', 'Quantidade Objetivo (1 a 100) *')}
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      step="1"
                      className="form-control"
                      value={formData.quantidade_objetivo}
                      onChange={(e) => setFormData((prev) => ({ ...prev, quantidade_objetivo: e.target.value }))}
                      disabled={submitting}
                      style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                      required
                    />
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {t('marcoObjectiveHelp', 'Número de ocorrências necessárias para conquistar o marco.')}
                    </small>
                  </div>

                  {/* Ativo toggle (Only in Edit mode) */}
                  {isEditMode && (
                    <div className="form-check form-switch mt-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="marcoAtivoSwitch"
                        checked={formData.ativo}
                        onChange={(e) => setFormData((prev) => ({ ...prev, ativo: e.target.checked }))}
                        style={{ cursor: 'pointer' }}
                      />
                      <label className="form-check-label small ms-2" htmlFor="marcoAtivoSwitch" style={{ cursor: 'pointer' }}>
                        {t('statusActive', 'Ativo')}
                      </label>
                    </div>
                  )}

                </div>
              </div>

              {/* Modal Footer */}
              <div className="d-flex justify-content-end gap-2 p-3 border-top" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                <button
                  type="button"
                  className="btn btn-secondary rounded-3 px-4 fw-semibold"
                  onClick={() => setShowModal(false)}
                  disabled={submitting}
                >
                  {t('cancelBtn', 'Cancelar')}
                </button>
                <button
                  type="submit"
                  className="btn btn-primary rounded-3 px-4 fw-semibold shadow-sm"
                  disabled={submitting}
                >
                  {submitting ? t('saving', 'A guardar...') : t('saveBtn', 'Guardar')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
