import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../../../services/api';
import Swal from 'sweetalert2';
import SearchBadges from '../../../components/SearchBadges';

const ITEMS_PER_PAGE = 3;

export default function BadgesAdmin() {
  const { t, i18n } = useTranslation();
  const [badges, setBadges] = useState([]);
  const [failedLogos, setFailedLogos] = useState({});
  const [niveis, setNiveis] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);
  const [allAreas, setAllAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSl, setSelectedSl] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [logoFile, setLogoFile] = useState(null);

  // Helper resolver for hierarchy
  const getBadgeHierarchy = useCallback((badge) => {
    if (!badge) return { learningPath: 'N/A', serviceLine: 'N/A', area: 'N/A' };
    const badgeAreaStr = typeof badge.area === 'string' ? badge.area.toLowerCase() : '';
    const areaObj = allAreas.find(a =>
      (badge.id_area && String(a.id_area) === String(badge.id_area)) ||
      (typeof a.area === 'string' && badgeAreaStr && a.area.toLowerCase() === badgeAreaStr)
    );
    const slObj = serviceLines.find(s =>
      String(s.id_service_line) === String(areaObj?.id_service_line)
    );
    return {
      learningPath: typeof slObj?.learning_path === 'string' ? slObj.learning_path : (slObj?.learning_path?.[i18n.language] || 'N/A'),
      serviceLine: typeof areaObj?.service_line === 'string' ? areaObj.service_line : (areaObj?.service_line?.[i18n.language] || 'N/A'),
      area: typeof badge.area === 'string' ? badge.area : (typeof areaObj?.area === 'string' ? areaObj.area : 'N/A')
    };
  }, [allAreas, serviceLines, i18n.language]);

  // Create / Edit modal states
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    id_nivel_area: '',
    titulo: '',
    descricao: '',
    pontos: 100,
    dias_submeter: 7,
    badge_expiravel: false,
    tempo_expiracao: '',
    tempo_aviso: 30,
    pontos_renovacao: 0,
    emissor: 'Softbadge System',
    logo: 'default_badge.webp'
  });

  // Fetch all badges and level-areas
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [resBadges, resNiveis, resSl, resAreas] = await Promise.all([
        api.get('/badge'),
        api.get('/nivel_area'),
        api.get('/service_line?ativo=true'),
        api.get('/area?ativo=true')
      ]);

      if (resBadges.data?.success) {
        setBadges(resBadges.data.data || []);
      }
      if (resNiveis.data?.success) {
        setNiveis(resNiveis.data.data || []);
      }
      if (resSl.data?.success) {
        setServiceLines(resSl.data.data || []);
      }
      if (resAreas.data?.success) {
        setAllAreas(resAreas.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin badges data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, i18n.language]);

  const handleSlChange = (val) => {
    setSelectedSl(val);
    setSelectedArea('all');
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSl, selectedArea]);

  // Open modal for creation
  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingId(null);
    setLogoFile(null);
    setFormData({
      id_nivel_area: niveis[0]?.id_nivel_area || '',
      titulo: '',
      descricao: '',
      pontos: 100,
      dias_submeter: 7,
      badge_expiravel: false,
      tempo_expiracao: '',
      tempo_aviso: 30,
      pontos_renovacao: 0,
      emissor: 'Softbadge System',
      logo: 'default_badge.webp'
    });
    setShowModal(true);
  };

  // Open modal for editing
  const handleOpenEdit = (badge) => {
    setIsEditMode(true);
    setEditingId(badge.id_badge);
    setLogoFile(null);
    setFormData({
      id_nivel_area: badge.id_nivel_area || '',
      titulo: badge.titulo || '',
      descricao: badge.descricao || '',
      pontos: badge.pontos || 0,
      dias_submeter: badge.dias_submeter !== undefined && badge.dias_submeter !== null ? badge.dias_submeter : 7,
      badge_expiravel: badge.badge_expiravel || false,
      tempo_expiracao: badge.tempo_expiracao || '',
      tempo_aviso: badge.tempo_aviso !== null && badge.tempo_aviso !== undefined ? badge.tempo_aviso : 30,
      pontos_renovacao: badge.pontos_renovacao !== null && badge.pontos_renovacao !== undefined ? badge.pontos_renovacao : 0,
      emissor: badge.emissor || 'Softbadge System',
      logo: badge.logo || 'default_badge.webp'
    });
    setShowModal(true);
  };

  // Save Badge (Create or Update)
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.titulo.trim() || !formData.descricao.trim() || !formData.id_nivel_area) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: 'Preencha os campos obrigatórios (Título, Descrição, Nível/Área).'
      });
      return;
    }

    if (formData.badge_expiravel) {
      if (!formData.tempo_expiracao || Number(formData.tempo_expiracao) < 1) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'O tempo de expiração deve ser de pelo menos 1 dia.'
        });
        return;
      }
      if (formData.tempo_aviso === '' || Number(formData.tempo_aviso) < 1 || Number(formData.tempo_aviso) > 90) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Os dias de aviso prévio devem estar entre 1 e 90 dias.'
        });
        return;
      }
      if (formData.pontos_renovacao !== '' && Number(formData.pontos_renovacao) < 0) {
        Swal.fire({
          icon: 'warning',
          title: 'Atenção',
          text: 'Os pontos de renovação não podem ser negativos.'
        });
        return;
      }
    }

    if (formData.dias_submeter === '' || isNaN(Number(formData.dias_submeter)) || Number(formData.dias_submeter) < 1 || Number(formData.dias_submeter) > 30) {
      Swal.fire({
        icon: 'warning',
        title: 'Atenção',
        text: t('badgeSubmitDaysValidation', 'O prazo para submeter a candidatura deve ser entre 1 e 30 dias.')
      });
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('id_nivel_area', formData.id_nivel_area);
      formDataToSend.append('titulo', formData.titulo);
      formDataToSend.append('descricao', formData.descricao);
      formDataToSend.append('pontos', Number(formData.pontos));
      formDataToSend.append('dias_submeter', Number(formData.dias_submeter) || 7);
      formDataToSend.append('badge_expiravel', formData.badge_expiravel);
      if (formData.badge_expiravel) {
        formDataToSend.append('tempo_expiracao', Number(formData.tempo_expiracao));
        formDataToSend.append('tempo_aviso', Number(formData.tempo_aviso) || 30);
        formDataToSend.append('pontos_renovacao', Number(formData.pontos_renovacao) || 0);
      } else {
        formDataToSend.append('tempo_expiracao', '');
        formDataToSend.append('tempo_aviso', 30);
        formDataToSend.append('pontos_renovacao', 0);
      }
      formDataToSend.append('emissor', formData.emissor);
      if (logoFile) {
        formDataToSend.append('logo', logoFile);
      }

      let res;
      if (isEditMode) {
        res = await api.put(`/badge/${editingId}`, formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post('/badge', formDataToSend, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Sucesso',
          text: isEditMode ? 'Badge atualizado com sucesso.' : 'Badge criado com sucesso.',
          timer: 1500,
          showConfirmButton: false
        });
        setShowModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error saving badge:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.response?.data?.message || 'Ocorreu um erro ao guardar o Badge.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Toggle badge status (Active / Inactive)
  const handleToggleStatus = async (badgeId) => {
    try {
      const res = await api.patch(`/badge/${badgeId}/status`);
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Estado Alterado',
          text: 'O estado de ativação do badge foi alterado.',
          timer: 1500,
          showConfirmButton: false
        });
        fetchData();
      }
    } catch (err) {
      console.error('Error toggling badge status:', err);
    }
  };

  // Delete/Remove Badge
  const handleDelete = async (badgeId) => {
    const confirm = await Swal.fire({
      title: 'Tem a certeza?',
      text: 'Esta ação desativará permanentemente o Badge da plataforma.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sim, eliminar!',
      cancelButtonText: 'Cancelar'
    });

    if (!confirm.isConfirmed) return;

    try {
      const res = await api.delete(`/badge/${badgeId}`);
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: 'Eliminado',
          text: 'Badge eliminado com sucesso.',
          timer: 1500,
          showConfirmButton: false
        });
        fetchData();
      }
    } catch (err) {
      console.error('Error deleting badge:', err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.response?.data?.message || 'Não foi possível eliminar o badge.'
      });
    }
  };

  // Filter logic
  const filteredBadges = useMemo(() => {
    const q = (searchQuery || '').toLowerCase().trim();
    return badges.filter(b => {
      if (!b) return false;
      const bTitle = typeof b.titulo === 'string' ? b.titulo : (b.titulo?.pt || b.titulo?.en || '');
      const bDesc = typeof b.descricao === 'string' ? b.descricao : (b.descricao?.pt || b.descricao?.en || '');

      const matchesSearch = !q || bTitle.toLowerCase().includes(q) || bDesc.toLowerCase().includes(q);
      if (!matchesSearch) return false;

      // Localiza o objeto área do badge por ID ou nome
      const badgeAreaStr = typeof b.area === 'string' ? b.area.toLowerCase() : '';
      const badgeArea = allAreas.find(a =>
        (b.id_area && String(a.id_area) === String(b.id_area)) ||
        (typeof a.area === 'string' && badgeAreaStr && a.area.toLowerCase() === badgeAreaStr)
      );

      // Filtro de Service Line
      if (selectedSl !== 'all') {
        const badgeSlId = b.id_service_line || badgeArea?.id_service_line;
        if (String(badgeSlId) !== String(selectedSl)) {
          return false;
        }
      }

      // Filtro de Área
      if (selectedArea !== 'all') {
        const badgeAreaId = b.id_area || badgeArea?.id_area;
        if (String(badgeAreaId) !== String(selectedArea)) {
          return false;
        }
      }

      return true;
    });
  }, [badges, searchQuery, selectedSl, selectedArea, allAreas]);

  // Total pages computation
  const totalPages = Math.max(1, Math.ceil(filteredBadges.length / ITEMS_PER_PAGE));

  // Paginated items
  const paginatedBadges = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBadges.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBadges, currentPage]);

  return (
    <div className="users-admin-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">Gestão de Badges</h3>
          <p className="text-muted small mb-0">Crie, edite e faça a gestão dos badges/crachás atribuídos aos colaboradores</p>
        </div>
        <button className="btn btn-primary fw-semibold px-3 d-flex align-items-center gap-2" style={{ borderRadius: '8px' }} onClick={handleOpenCreate}>
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Criar Badge
        </button>
      </div>

      {/* Search and filter bar */}
      <SearchBadges
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSl={selectedSl}
        setSelectedSl={handleSlChange}
        selectedArea={selectedArea}
        setSelectedArea={setSelectedArea}
        serviceLines={serviceLines}
        allAreas={allAreas}
        placeholder="Pesquisar por título ou descrição..."
      />

      {/* Badges Table Grid */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="users-spinner" />
            <span>A carregar catálogo de badges...</span>
          </div>
        ) : (
          <>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Badge</th>
                    <th>Learning Path / Service Line / Área</th>
                    <th>Nível</th>
                    <th>Pontos</th>
                    <th>Emissor</th>
                    <th>Expira?</th>
                    <th>Estado</th>
                    <th className="text-end">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBadges.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="users-empty-row">Nenhum badge registado no sistema.</td>
                    </tr>
                  ) : (
                    paginatedBadges.map((badge) => {
                      const hierarchy = getBadgeHierarchy(badge);
                      return (
                        <tr key={badge.id_badge}>
                          <td className="users-name-cell">
                            <div className="d-flex align-items-center gap-2">
                              <div className="kpi-icon-wrapper rounded-circle" style={{ width: 36, height: 36, minWidth: 36, backgroundColor: '#eff6ff', color: 'var(--primary)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {badge.logo && !failedLogos[badge.id_badge] ? (
                                  <img
                                    src={`${API_BASE_URL}/uploads/logo_badges/${badge.logo}`}
                                    alt={badge.titulo}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onError={() => setFailedLogos(prev => ({ ...prev, [badge.id_badge]: true }))}
                                  />
                                ) : (
                                  <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, stroke: 'currentColor', strokeWidth: 2, fill: 'none' }}>
                                    <circle cx="12" cy="8" r="7" />
                                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                                  </svg>
                                )}
                              </div>
                              <div>
                                <strong className="text-dark d-block">{badge.titulo}</strong>
                                <span className="text-muted small d-block" style={{ fontSize: '0.75rem' }}>{badge.descricao?.slice(0, 50)}...</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1 small">
                              <span className="fw-semibold text-primary">{hierarchy.learningPath}</span>
                              <span className="text-muted">{hierarchy.serviceLine}</span>
                              <span className="text-secondary">{hierarchy.area}</span>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark border">
                              {badge.nivel_area || 'Nível Geral'}
                            </span>
                          </td>
                          <td className="fw-bold">{badge.pontos} pts</td>
                          <td>{badge.emissor}</td>
                          <td>
                            {badge.badge_expiravel ? (
                              <span style={{ backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#d97706', padding: '4px 10px', borderRadius: '50px', fontSize: '0.75rem', fontWeight: 700 }}>
                                Sim ({badge.tempo_expiracao} dias)
                              </span>
                            ) : (
                              <span className="text-muted small">Não</span>
                            )}
                          </td>
                          <td>
                            <span
                              onClick={() => handleToggleStatus(badge.id_badge)}
                              className={`users-status-badge ${badge.badgeAtivo ? 'active' : 'suspended'}`}
                              style={{ cursor: 'pointer' }}
                              title="Clique para alternar estado"
                            >
                              {badge.badgeAtivo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td>
                            <div className="users-actions-cell">
                              <button className="users-action-btn edit" onClick={() => handleOpenEdit(badge)}>
                                Editar
                              </button>
                              <button className="users-action-btn block" onClick={() => handleDelete(badge.id_badge)}>
                                Eliminar
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

            {/* Footer: count + pagination */}
            {filteredBadges.length > 0 && (
              <div className="users-table-footer mt-3">
                <span className="users-count-text">
                  {t('showingBadges', 'A mostrar {shown} de {total} badges')
                    .replace('{shown}', paginatedBadges.length)
                    .replace('{total}', filteredBadges.length)}
                </span>

                <div className="chart-pagination">
                  <button
                    className="chart-pag-btn"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <span className="chart-pag-info">{currentPage} / {totalPages}</span>
                  <button
                    className="chart-pag-btn"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    <svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Creation / Edit Modal */}
      {showModal && (
        <>
          <div className="users-modal-overlay" onClick={() => setShowModal(false)} />
          <div className="users-modal" style={{ maxWidth: '640px', width: '90%' }}>
            <div className="users-modal-header">
              <h5>{isEditMode ? 'Editar Badge' : 'Criar Novo Badge'}</h5>
              <button className="users-modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSave} style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', padding: '24px' }}>
              <div className="d-flex flex-column gap-3">

                {/* Nivel Area Select */}
                <div className="users-form-group">
                  <label className="text-muted small fw-bold mb-1">Nível & Área Associada *</label>
                  <select
                    className="form-select"
                    value={formData.id_nivel_area}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_nivel_area: e.target.value }))}
                    disabled={submitting || isEditMode}
                    style={{ borderRadius: '8px' }}
                  >
                    <option value="" disabled>Selecione um nível/área</option>
                    {niveis.map(n => (
                      <option key={n.id_nivel_area} value={n.id_nivel_area}>
                        Nível #{n.id_nivel_area} (Área: {n.id_area_sl})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Title */}
                <div className="users-form-group">
                  <label className="text-muted small fw-bold mb-1">Título do Badge *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Ex: Programador Outsystems Sénior"
                    value={formData.titulo}
                    onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
                    disabled={submitting}
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                {/* Description */}
                <div className="users-form-group">
                  <label className="text-muted small fw-bold mb-1">Descrição e Requisitos *</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Escreva a descrição do badge e o que é necessário demonstrar..."
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    disabled={submitting}
                    style={{ borderRadius: '8px' }}
                  />
                </div>

                <div className="row g-3">
                  {/* Points */}
                  <div className="col-12 col-md-6">
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1">Pontuação (pts) *</label>
                      <input
                        type="number"
                        className="form-control"
                        value={formData.pontos}
                        onChange={(e) => setFormData(prev => ({ ...prev, pontos: e.target.value }))}
                        disabled={submitting}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                  </div>
                  {/* Emissor */}
                  <div className="col-12 col-md-6">
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1">Emissor *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={formData.emissor}
                        onChange={(e) => setFormData(prev => ({ ...prev, emissor: e.target.value }))}
                        disabled={submitting}
                        style={{ borderRadius: '8px' }}
                      />
                    </div>
                  </div>
                </div>

                {/* Logo Image Upload & Submission Deadline */}
                <div className="row g-3">
                  <div className="col-12 col-md-7 col-lg-8">
                    <div className="users-form-group mb-0">
                      <label className="text-muted small fw-bold mb-1">Logótipo do Badge</label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        onChange={(e) => setLogoFile(e.target.files[0] || null)}
                        disabled={submitting}
                        style={{ borderRadius: '8px' }}
                      />
                      <small className="text-muted small d-block mt-1">Selecione uma imagem para o logótipo (deixe vazio para manter o padrão ou a atual).</small>
                    </div>
                  </div>

                  <div className="col-12 col-md-5 col-lg-4">
                    <div className="users-form-group mb-0">
                      <label className="text-muted small fw-bold mb-1">
                        {t('badgeSubmitDaysLabel', 'Prazo para Submeter (dias)')} *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        min="1"
                        max="30"
                        value={formData.dias_submeter}
                        onChange={(e) => setFormData(prev => ({ ...prev, dias_submeter: e.target.value }))}
                        disabled={submitting}
                        style={{ borderRadius: '8px' }}
                      />
                      <small className="text-muted small d-block mt-1">
                        {t('badgeSubmitDaysHelp', 'Tempo que o consultor tem para passar de Rascunho a Submetido (1 a 30 dias).')}
                      </small>
                    </div>
                  </div>
                </div>

                {/* Expirable toggle */}
                <div className="form-check form-switch mt-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="badgeExpirableSwitch"
                    checked={formData.badge_expiravel}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      badge_expiravel: e.target.checked,
                      tempo_aviso: prev.tempo_aviso || 30,
                      pontos_renovacao: prev.pontos_renovacao !== undefined ? prev.pontos_renovacao : 0
                    }))}
                    style={{ cursor: 'pointer' }}
                  />
                  <label className="form-check-label small ms-2" htmlFor="badgeExpirableSwitch" style={{ cursor: 'pointer' }}>
                    {t('badgeExpiresSwitchLabel', 'Este badge expira após um determinado período?')}
                  </label>
                </div>

                {/* Expiration & Renewal Settings */}
                {formData.badge_expiravel && (
                  <div className="d-flex flex-column gap-3 mt-3 p-3 rounded-3 border" style={{ backgroundColor: 'var(--panel-2, rgba(0,0,0,0.02))', borderColor: 'var(--sidebar-border)' }}>
                    <div className="row g-3">
                      <div className="col-12 col-md-6">
                        <div className="users-form-group mb-0">
                          <label className="text-muted small fw-bold mb-1">
                            {t('badgeExpirationTimeLabel', 'Tempo de Expiração (em dias)')} *
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder={t('badgeExpirationTimePlaceholder', 'Ex: 365')}
                            min="1"
                            value={formData.tempo_expiracao}
                            onChange={(e) => setFormData(prev => ({ ...prev, tempo_expiracao: e.target.value }))}
                            disabled={submitting}
                            style={{ borderRadius: '8px' }}
                          />
                          <small className="text-muted small d-block mt-1">
                            {t('badgeExpirationHelp', 'Validade ativa do badge após a sua emissão.')}
                          </small>
                        </div>
                      </div>

                      <div className="col-12 col-md-6">
                        <div className="users-form-group mb-0">
                          <label className="text-muted small fw-bold mb-1">
                            {t('badgeWarningDaysLabel', 'Aviso Prévio (1 a 90 dias)')} *
                          </label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder={t('badgeWarningDaysPlaceholder', 'Ex: 30')}
                            min="1"
                            max="90"
                            value={formData.tempo_aviso}
                            onChange={(e) => setFormData(prev => ({ ...prev, tempo_aviso: e.target.value }))}
                            disabled={submitting}
                            style={{ borderRadius: '8px' }}
                          />
                          <small className="text-muted small d-block mt-1">
                            {t('badgeWarningDaysHelp', 'Dias antes de expirar para notificar o consultor (padrão: 30 dias).')}
                          </small>
                        </div>
                      </div>
                    </div>

                    <div className="users-form-group mb-0">
                      <label className="text-muted small fw-bold mb-1">
                        {t('badgeRenewalPointsLabel', 'Pontos de Renovação')} *
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        placeholder={t('badgeRenewalPointsPlaceholder', 'Ex: 50')}
                        min="0"
                        value={formData.pontos_renovacao}
                        onChange={(e) => setFormData(prev => ({ ...prev, pontos_renovacao: e.target.value }))}
                        disabled={submitting}
                        style={{ borderRadius: '8px' }}
                      />
                      <small className="text-muted small d-block mt-1">
                        {t('badgeRenewalPointsHelp', 'Pontos extras atribuídos ao consultor ao concluir a renovação do badge.')}
                      </small>
                    </div>
                  </div>
                )}

              </div>

              {/* Form Actions */}
              <div className="d-flex justify-content-end gap-2 mt-4 border-top pt-3">
                <button type="button" className="users-modal-cancel py-2" onClick={() => setShowModal(false)} disabled={submitting}>
                  Cancelar
                </button>
                <button type="submit" className="users-modal-submit py-2" disabled={submitting}>
                  {submitting ? 'A guardar...' : 'Guardar Badge'}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
