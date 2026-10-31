import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import Swal from 'sweetalert2';
import { useAppContext } from '../../context/AppContext';
import SearchBar from '../../components/SearchBar';
import ManualTranslationSwitch from '../../components/ManualTranslationSwitch';
import FlagIcon from '../../components/FlagIcon';

export default function SkillsManagement() {
  const { t, i18n } = useTranslation();
  const { language } = useAppContext();
  
  const [competencias, setCompetencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, inactive

  // Modal Control
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: ''
  });

  // Manual Translation Mode
  const [isManualTranslation, setIsManualTranslation] = useState(false);
  const [manualTitle, setManualTitle] = useState({ pt: '', en: '', es: '' });
  const [manualDesc, setManualDesc] = useState({ pt: '', en: '', es: '' });

  // Fetch competencies list
  const fetchCompetencias = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/competencia');
      if (res.data?.success) {
        setCompetencias(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching competencies:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompetencias();
  }, [fetchCompetencias, language, i18n.language]);

  // Open modal for Create
  const handleOpenCreateModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ titulo: '', descricao: '' });
    setIsManualTranslation(false);
    setManualTitle({ pt: '', en: '', es: '' });
    setManualDesc({ pt: '', en: '', es: '' });
    setShowModal(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (comp) => {
    setIsEditMode(true);
    setEditingId(comp.id_competencia);
    setFormData({
      titulo: comp.titulo || '',
      descricao: comp.descricao || ''
    });

    // Initialize with manual translation OFF, but pre-populate translations for when toggled ON
    setIsManualTranslation(false);
    setManualTitle({
      pt: comp.traducoes_titulo?.pt || comp.titulo || '',
      en: comp.traducoes_titulo?.en || comp.titulo || '',
      es: comp.traducoes_titulo?.es || comp.titulo || ''
    });
    setManualDesc({
      pt: comp.traducoes_descricao?.pt || comp.descricao || '',
      en: comp.traducoes_descricao?.en || comp.descricao || '',
      es: comp.traducoes_descricao?.es || comp.descricao || ''
    });

    setShowModal(true);
  };

  // Switch Manual Translation Mode
  const handleToggleManualTranslation = (enable) => {
    if (enable) {
      setIsManualTranslation(true);
      const currentLang = (i18n.language || 'pt').slice(0, 2);
      setManualTitle(prev => ({
        pt: prev?.pt || formData.titulo || '',
        en: prev?.en || formData.titulo || '',
        es: prev?.es || formData.titulo || '',
        [currentLang]: formData.titulo || ''
      }));
      setManualDesc(prev => ({
        pt: prev?.pt || formData.descricao || '',
        en: prev?.en || formData.descricao || '',
        es: prev?.es || formData.descricao || '',
        [currentLang]: formData.descricao || ''
      }));
    } else {
      setIsManualTranslation(false);
    }
  };

  // Save Competency
  const handleSaveCompetencia = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        titulo: isManualTranslation ? manualTitle : formData.titulo,
        descricao: isManualTranslation ? manualDesc : formData.descricao
      };

      let res;
      if (isEditMode) {
        res = await api.put(`/competencia/${editingId}`, payload);
      } else {
        res = await api.post('/competencia', payload);
      }

      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso!'),
          text: t('skillSavedMsg', 'Competência guardada com sucesso.'),
          timer: 1500,
          showConfirmButton: false
        });
        setShowModal(false);
        fetchCompetencias();
      }
    } catch (err) {
      console.error('Error saving competency:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('errorSavingSkill', 'Erro ao guardar competência.')
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Delete/Soft Delete Competency
  const handleDeleteCompetencia = async (comp) => {
    const result = await Swal.fire({
      title: t('skillDeleteConfirm', 'Tem a certeza que deseja eliminar esta competência?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('deleteBtn', 'Eliminar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (result.isConfirmed) {
      try {
        const res = await api.delete(`/competencia/${comp.id_competencia}`);
        if (res.data?.success) {
          Swal.fire({
            icon: 'success',
            title: t('successTitle', 'Sucesso!'),
            text: t('skillDeletedMsg', 'Competência eliminada com sucesso.'),
            timer: 1500,
            showConfirmButton: false
          });
          fetchCompetencias();
        }
      } catch (err) {
        console.error('Error deleting competency:', err);
        Swal.fire({
          icon: 'error',
          title: t('error', 'Erro'),
          text: err.response?.data?.message || t('errorDeletingSkill', 'Erro ao eliminar competência.')
        });
      }
    }
  };

  // Filter competencies based on query and status filter
  const filteredCompetencias = useMemo(() => {
    return competencias.filter(c => {
      const matchSearch = (c.titulo || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (c.descricao || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchStatus = statusFilter === 'all' ? true :
                          statusFilter === 'active' ? c.competenciaAtiva : !c.competenciaAtiva;

      return matchSearch && matchStatus;
    });
  }, [competencias, searchQuery, statusFilter]);

  return (
    <div className="users-admin-container">
      {/* Header Panel */}
      <div className="d-flex align-items-center justify-content-between mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
            {t('skillsMgmtTitle', 'Gestão de Competências')}
          </h3>
          <p className="text-muted small mb-0">
            {t('skillsMgmtSubtitle', 'Criação, edição e eliminação de competências (Skills) associadas aos Badges.')}
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="btn btn-primary rounded-3 px-4 py-2 fw-semibold d-flex align-items-center gap-2 shadow-sm text-white"
          style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
        >
          ➕ {t('createSkillBtn', 'Nova Competência')}
        </button>
      </div>

      {/* Filter and Search Section */}
      <div className="card border-0 shadow-sm mb-4 rounded-4" style={{ backgroundColor: 'var(--panel-2, #f8fafc)' }}>
        <div className="card-body p-3 d-flex flex-wrap align-items-center gap-3">
          <div style={{ flex: 1, minWidth: '250px' }}>
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder={t('searchSkillsPlaceholder', 'Pesquisar competências...')}
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            <label className="small fw-semibold text-muted mb-0">{t('filterStatus', 'Estado')}:</label>
            <select
              className="form-select form-select-sm rounded-3"
              style={{ width: '150px' }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">{t('all', 'Todos')}</option>
              <option value="active">{t('statusActive', 'Ativo')}</option>
              <option value="inactive">{t('statusInactive', 'Inativo')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Competencies Table Grid */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading py-5">
            <div className="users-spinner" />
            <span>{t('loading', 'A carregar...')}</span>
          </div>
        ) : filteredCompetencias.length === 0 ? (
          <div className="text-center py-5 text-muted border rounded-4 bg-light-subtle">
            {t('noResults', 'Nenhum registo encontrado.')}
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>{t('colSkillTitle', 'Título')}</th>
                  <th>{t('colSkillDesc', 'Descrição')}</th>
                  <th>{t('colStatus', 'Estado')}</th>
                  <th style={{ width: '120px' }}>{t('colActions', 'Ações')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredCompetencias.map((comp) => (
                  <tr key={comp.id_competencia}>
                    <td className="fw-bold">{comp.titulo}</td>
                    <td>{comp.descricao || '-'}</td>
                    <td>
                      <span className={`badge rounded-pill ${comp.competenciaAtiva ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                        {comp.competenciaAtiva ? t('statusActive', 'Ativo') : t('statusInactive', 'Inativo')}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary border-0 p-1"
                          onClick={() => handleOpenEditModal(comp)}
                          title={t('editBtn', 'Editar')}
                        >
                          ✏️
                        </button>
                        {comp.competenciaAtiva && (
                          <button
                            className="btn btn-sm btn-outline-danger border-0 p-1"
                            onClick={() => handleDeleteCompetencia(comp)}
                            title={t('deleteBtn', 'Eliminar')}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Competency Form Modal */}
      {showModal && (
        <>
          <div className="users-modal-overlay" onClick={() => setShowModal(false)} />
          <div className="users-modal" style={{ maxWidth: '580px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="users-modal-header d-flex align-items-center justify-content-between p-3 border-bottom">
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)' }}>
                {isEditMode ? t('editSkillBtn', 'Editar Competência') : t('createSkillBtn', 'Nova Competência')}
              </h5>
              <div className="d-flex align-items-center gap-3">
                <ManualTranslationSwitch
                  checked={isManualTranslation}
                  onChange={handleToggleManualTranslation}
                  disabled={submitting}
                  id="manualTranslateSkillSwitch"
                />
                <button className="users-modal-close" onClick={() => setShowModal(false)}>
                  <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
                    <line x1="18" y1="6" x2="6" y2="18" stroke="currentColor" strokeWidth="2" />
                    <line x1="6" y1="6" x2="18" y2="18" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveCompetencia} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
                <div className="d-flex flex-column gap-3">
                  
                  {/* Fields rendering conditional on Translation mode */}
                  {!isManualTranslation ? (
                    <>
                      {/* Normal Mode - Single Text Fields */}
                      <div className="users-form-group">
                        <label className="text-muted small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                          {t('skillTitleLabel', 'Título da Competência')} *
                        </label>
                        <input
                          type="text"
                          className="form-control rounded-3"
                          required
                          placeholder="Ex: Docker Containers"
                          value={formData.titulo}
                          onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        />
                      </div>

                      <div className="users-form-group">
                        <label className="text-muted small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                          {t('skillDescLabel', 'Descrição da Competência')} *
                        </label>
                        <textarea
                          className="form-control rounded-3"
                          rows="3"
                          required
                          placeholder="Ex: Gestão de contentores e imagens Docker..."
                          value={formData.descricao}
                          onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Manual Translation Mode - Title Fields */}
                      <div className="users-form-group">
                        <label className="text-muted small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                          {t('skillTitleLabel', 'Título da Competência')} *
                        </label>
                        <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                              <FlagIcon lang="pt" />
                              <span>PT</span>
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Título em Português"
                              value={manualTitle.pt}
                              onChange={(e) => setManualTitle(prev => ({ ...prev, pt: e.target.value }))}
                              disabled={submitting}
                              required
                            />
                          </div>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                              <FlagIcon lang="en" />
                              <span>EN</span>
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Title in English"
                              value={manualTitle.en}
                              onChange={(e) => setManualTitle(prev => ({ ...prev, en: e.target.value }))}
                              disabled={submitting}
                              required
                            />
                          </div>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                              <FlagIcon lang="es" />
                              <span>ES</span>
                            </span>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Título en Español"
                              value={manualTitle.es}
                              onChange={(e) => setManualTitle(prev => ({ ...prev, es: e.target.value }))}
                              disabled={submitting}
                              required
                            />
                          </div>
                        </div>
                      </div>

                      {/* Manual Translation Mode - Description Fields */}
                      <div className="users-form-group">
                        <label className="text-muted small fw-bold mb-1" style={{ color: 'var(--text)' }}>
                          {t('skillDescLabel', 'Descrição da Competência')} *
                        </label>
                        <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                              <FlagIcon lang="pt" />
                              <span>PT</span>
                            </span>
                            <textarea
                              className="form-control"
                              rows="2"
                              placeholder="Descrição em Português"
                              value={manualDesc.pt}
                              onChange={(e) => setManualDesc(prev => ({ ...prev, pt: e.target.value }))}
                              disabled={submitting}
                              required
                            />
                          </div>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                              <FlagIcon lang="en" />
                              <span>EN</span>
                            </span>
                            <textarea
                              className="form-control"
                              rows="2"
                              placeholder="Description in English"
                              value={manualDesc.en}
                              onChange={(e) => setManualDesc(prev => ({ ...prev, en: e.target.value }))}
                              disabled={submitting}
                              required
                            />
                          </div>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                              <FlagIcon lang="es" />
                              <span>ES</span>
                            </span>
                            <textarea
                              className="form-control"
                              rows="2"
                              placeholder="Descripción en Español"
                              value={manualDesc.es}
                              onChange={(e) => setManualDesc(prev => ({ ...prev, es: e.target.value }))}
                              disabled={submitting}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="d-flex justify-content-end gap-2 p-3 border-top bg-light" style={{ backgroundColor: 'var(--panel-2)' }}>
                <button type="button" className="btn btn-outline-secondary rounded-3 px-3" onClick={() => setShowModal(false)}>
                  {t('cancelBtn', 'Cancelar')}
                </button>
                <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold" disabled={submitting}>
                  {submitting ? t('saving', 'A guardar...') : t('saveChanges', 'Guardar Alterações')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
