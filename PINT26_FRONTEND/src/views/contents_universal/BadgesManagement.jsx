import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../../services/api';
import Swal from 'sweetalert2';
import { useAppContext } from '../../context/AppContext';
import { ROLE } from '../../constants/roles';
import SearchBadges from '../../components/SearchBadges';
import SearchBar from '../../components/SearchBar';
import ManualTranslationSwitch from '../../components/ManualTranslationSwitch';
import FlagIcon from '../../components/FlagIcon';
import ViewBadgeModal from '../../components/ViewBadgeModal';

const ITEMS_PER_PAGE = 3;

export default function BadgesManagement() {
  const { t, i18n } = useTranslation();
  const { socket, activeRole } = useAppContext();
  const [badges, setBadges] = useState([]);
  const [selectedViewBadgeId, setSelectedViewBadgeId] = useState(null);
  const [learningPaths, setLearningPaths] = useState([]);
  const [failedLogos, setFailedLogos] = useState({});
  const [niveis, setNiveis] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);
  const [allAreas, setAllAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSl, setSelectedSl] = useState('all');
  const [selectedArea, setSelectedArea] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [logoFile, setLogoFile] = useState(null);
  const [allCompetencias, setAllCompetencias] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [skillsSearchQuery, setSkillsSearchQuery] = useState('');

  // States for cascading dropdowns & requirements in modal
  const [modalSelectedLP, setModalSelectedLP] = useState('');
  const [modalSelectedSL, setModalSelectedSL] = useState('');
  const [modalSelectedArea, setModalSelectedArea] = useState('');
  const [modalRequirements, setModalRequirements] = useState([]);

  // States for manual translation mode
  const [isManualTranslation, setIsManualTranslation] = useState(false);
  const [manualTitle, setManualTitle] = useState({ pt: '', en: '', es: '' });
  const [manualDesc, setManualDesc] = useState({ pt: '', en: '', es: '' });

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
    emissor: 'SoftBadge System',
    logo: 'default_badge.webp'
  });

  // Filtered dropdown options for modal cascading selection
  const modalFilteredSLs = useMemo(() => {
    if (!modalSelectedLP) return [];
    return serviceLines.filter(sl => String(sl.id_learning_path) === String(modalSelectedLP));
  }, [serviceLines, modalSelectedLP]);

  const modalFilteredAreas = useMemo(() => {
    if (!modalSelectedSL) return [];
    return allAreas.filter(a => String(a.id_service_line) === String(modalSelectedSL));
  }, [allAreas, modalSelectedSL]);

  const modalFilteredNiveis = useMemo(() => {
    if (!modalSelectedArea) return [];
    return niveis.filter(n => String(n.id_area_sl) === String(modalSelectedArea));
  }, [niveis, modalSelectedArea]);

  // Fetch all badges and level-areas (Apenas Admin)
  const fetchData = useCallback(async () => {
    if (Number(activeRole) !== ROLE.ADMIN) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const [resBadges, resNiveis, resSl, resAreas, resLp, resCompetencias] = await Promise.all([
        api.get('/badge'),
        api.get('/nivel_area'),
        api.get('/service_line?ativo=true'),
        api.get('/area?ativo=true'),
        api.get('/learning_path?ativo=true').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/competencia?ativo=true').catch(() => ({ data: { success: false, data: [] } }))
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
      if (resLp.data?.success) {
        setLearningPaths(resLp.data.data || []);
      }
      if (resCompetencias.data?.success) {
        setAllCompetencias(resCompetencias.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching admin badges data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, i18n.language, activeRole]);

  useEffect(() => {
    if (!socket) return;
    const handleRealtimeUpdate = () => {
      fetchData();
    };

    socket.on('notification', handleRealtimeUpdate);
    socket.on('gestao_area', handleRealtimeUpdate);
    socket.on('badge_updated', handleRealtimeUpdate);
    socket.on('requisito_updated', handleRealtimeUpdate);

    return () => {
      socket.off('notification', handleRealtimeUpdate);
      socket.off('gestao_area', handleRealtimeUpdate);
      socket.off('badge_updated', handleRealtimeUpdate);
      socket.off('requisito_updated', handleRealtimeUpdate);
    };
  }, [socket, fetchData]);

  const handleSlChange = (val) => {
    setSelectedSl(val);
    setSelectedArea('all');
    setSelectedLevel('all');
  };

  const handleAreaChange = (val) => {
    setSelectedArea(val);
    setSelectedLevel('all');
  };

  const currentLevels = useMemo(() => {
    if (selectedArea === 'all') return [];
    return niveis.filter(n => String(n.id_area_sl) === String(selectedArea));
  }, [niveis, selectedArea]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedSl, selectedArea, selectedLevel]);



  const handleAddModalRequirement = () => {
    setModalRequirements(prev => [
      ...prev,
      {
        id_requisito: null,
        titulo: '',
        subtitulo: '',
        descricao: '',
        manualTitulo: { pt: '', en: '', es: '' },
        manualSubtitulo: { pt: '', en: '', es: '' },
        manualDescricao: { pt: '', en: '', es: '' },
        obrigatoriedade_req: true
      }
    ]);
  };

  const handleRemoveModalRequirement = async (index) => {
    const target = modalRequirements[index];
    if (target && target.id_requisito) {
      try {
        await api.delete(`/requisito_badge/${target.id_requisito}`);
      } catch (err) {
        console.error('Erro ao eliminar requisito:', err);
      }
    }
    setModalRequirements(prev => prev.filter((_, i) => i !== index));
  };

  const handleModalRequirementChange = (index, field, value, subLang = null) => {
    setModalRequirements(prev => prev.map((item, i) => {
      if (i !== index) return item;
      if (subLang) {
        const currentSubObj = item[field] || { pt: '', en: '', es: '' };
        return {
          ...item,
          [field]: {
            ...currentSubObj,
            [subLang]: value
          }
        };
      }
      return { ...item, [field]: value };
    }));
  };

  // Open modal for creation
  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingId(null);
    setLogoFile(null);
    setModalSelectedLP('');
    setModalSelectedSL('');
    setModalSelectedArea('');
    setModalRequirements([]);
    setSelectedSkills([]);
    setSkillsSearchQuery('');
    setIsManualTranslation(false);
    setManualTitle({ pt: '', en: '', es: '' });
    setManualDesc({ pt: '', en: '', es: '' });
    setFormData({
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
    setShowModal(true);
  };

  // Open modal for editing
  const handleOpenEdit = async (badge) => {
    setIsEditMode(true);
    setEditingId(badge.id_badge);
    setLogoFile(null);
    setSelectedSkills((badge.competencias || []).map(c => c.id_competencia));
    setSkillsSearchQuery('');
    setIsManualTranslation(false);

    const initialTitle = badge.titulo || '';
    const initialDesc = badge.descricao || '';

    setFormData({
      id_nivel_area: badge.id_nivel_area || '',
      titulo: initialTitle,
      descricao: initialDesc,
      pontos: badge.pontos || 0,
      dias_submeter: badge.dias_submeter !== undefined && badge.dias_submeter !== null ? badge.dias_submeter : 7,
      badge_expiravel: badge.badge_expiravel || false,
      tempo_expiracao: badge.tempo_expiracao || '',
      tempo_aviso: badge.tempo_aviso !== null && badge.tempo_aviso !== undefined ? badge.tempo_aviso : 30,
      pontos_renovacao: badge.pontos_renovacao !== null && badge.pontos_renovacao !== undefined ? badge.pontos_renovacao : 0,
      emissor: badge.emissor || 'Softbadge System',
      logo: badge.logo || 'default_badge.webp'
    });

    setManualTitle({ pt: initialTitle, en: initialTitle, es: initialTitle });
    setManualDesc({ pt: initialDesc, en: initialDesc, es: initialDesc });

    // Populate cascading dropdowns for edit mode
    const targetNivel = niveis.find(n => String(n.id_nivel_area) === String(badge.id_nivel_area));
    if (targetNivel) {
      const targetArea = allAreas.find(a => String(a.id_area) === String(targetNivel.id_area_sl));
      if (targetArea) {
        const targetSL = serviceLines.find(s => String(s.id_service_line) === String(targetArea.id_service_line));
        if (targetSL) {
          setModalSelectedLP(targetSL.id_learning_path || '');
          setModalSelectedSL(targetSL.id_service_line || '');
        } else {
          setModalSelectedSL('');
          setModalSelectedLP('');
        }
        setModalSelectedArea(targetArea.id_area || '');
      } else {
        setModalSelectedArea('');
        setModalSelectedSL('');
        setModalSelectedLP('');
      }
    } else {
      setModalSelectedArea('');
      setModalSelectedSL('');
      setModalSelectedLP('');
    }

    // Open modal immediately
    setShowModal(true);

    // Fetch existing badge and requirements in all 3 supported languages (PT, EN, ES) in parallel
    try {
      const [bPt, bEn, bEs, rPt, rEn, rEs] = await Promise.all([
        api.get(`/badge/${badge.id_badge}?lang=pt`).catch(() => null),
        api.get(`/badge/${badge.id_badge}?lang=en`).catch(() => null),
        api.get(`/badge/${badge.id_badge}?lang=es`).catch(() => null),
        api.get(`/requisito_badge/badge/${badge.id_badge}?lang=pt`).catch(() => null),
        api.get(`/requisito_badge/badge/${badge.id_badge}?lang=en`).catch(() => null),
        api.get(`/requisito_badge/badge/${badge.id_badge}?lang=es`).catch(() => null)
      ]);

      const titlePt = bPt?.data?.data?.titulo || initialTitle;
      const titleEn = bEn?.data?.data?.titulo || initialTitle;
      const titleEs = bEs?.data?.data?.titulo || initialTitle;

      const descPt = bPt?.data?.data?.descricao || initialDesc;
      const descEn = bEn?.data?.data?.descricao || initialDesc;
      const descEs = bEs?.data?.data?.descricao || initialDesc;

      setManualTitle({ pt: titlePt, en: titleEn, es: titleEs });
      setManualDesc({ pt: descPt, en: descEn, es: descEs });

      if (bPt?.data?.data?.dias_submeter !== undefined && bPt?.data?.data?.dias_submeter !== null) {
        setFormData(prev => ({ ...prev, dias_submeter: bPt.data.data.dias_submeter }));
      }

      const reqsPt = rPt?.data?.data || [];
      const reqsEn = rEn?.data?.data || [];
      const reqsEs = rEs?.data?.data || [];

      if (reqsPt.length > 0) {
        setModalRequirements(reqsPt.map((r, idx) => {
          const matchingEn = reqsEn.find(item => item.id_requisito === r.id_requisito) || reqsEn[idx];
          const matchingEs = reqsEs.find(item => item.id_requisito === r.id_requisito) || reqsEs[idx];
          return {
            id_requisito: r.id_requisito,
            titulo: r.titulo || '',
            subtitulo: r.subtitulo || '',
            descricao: r.descricao || '',
            manualTitulo: {
              pt: r.titulo || '',
              en: matchingEn?.titulo || r.titulo || '',
              es: matchingEs?.titulo || r.titulo || ''
            },
            manualSubtitulo: {
              pt: r.subtitulo || '',
              en: matchingEn?.subtitulo || r.subtitulo || '',
              es: matchingEs?.subtitulo || r.subtitulo || ''
            },
            manualDescricao: {
              pt: r.descricao || '',
              en: matchingEn?.descricao || r.descricao || '',
              es: matchingEs?.descricao || r.descricao || ''
            },
            obrigatoriedade_req: r.obrigatoriedade_req !== undefined ? r.obrigatoriedade_req : true
          };
        }));
      } else {
        setModalRequirements([]);
      }
    } catch (err) {
      console.error('Error fetching multi-lang badge details:', err);
    }
  };

  // Save Badge (Create or Update) + Save requirements
  const handleSave = async (e) => {
    e.preventDefault();

    const activeTitle = isManualTranslation ? (manualTitle.pt || manualTitle.en || manualTitle.es) : formData.titulo;
    const activeDesc = isManualTranslation ? (manualDesc.pt || manualDesc.en || manualDesc.es) : formData.descricao;

    if (!activeTitle?.trim() || !activeDesc?.trim() || !formData.id_nivel_area) {
      Swal.fire({
        icon: 'warning',
        title: t('attention', 'Atenção'),
        text: 'Preencha os campos obrigatórios (Título, Descrição, Nível/Área).'
      });
      return;
    }

    if (formData.badge_expiravel) {
      if (!formData.tempo_expiracao || Number(formData.tempo_expiracao) < 1) {
        Swal.fire({
          icon: 'warning',
          title: t('attention', 'Atenção'),
          text: t('badgeExpirationValidation', 'O tempo de expiração deve ser de pelo menos 1 dia.')
        });
        return;
      }
      if (formData.tempo_aviso === '' || Number(formData.tempo_aviso) < 1 || Number(formData.tempo_aviso) > 90) {
        Swal.fire({
          icon: 'warning',
          title: t('attention', 'Atenção'),
          text: t('badgeWarningDaysValidation', 'Os dias de aviso prévio devem estar entre 1 e 90 dias.')
        });
        return;
      }
      if (formData.pontos_renovacao !== '' && Number(formData.pontos_renovacao) < 0) {
        Swal.fire({
          icon: 'warning',
          title: t('attention', 'Atenção'),
          text: 'Os pontos de renovação não podem ser negativos.'
        });
        return;
      }
    }

    if (formData.dias_submeter === '' || isNaN(Number(formData.dias_submeter)) || Number(formData.dias_submeter) < 1 || Number(formData.dias_submeter) > 30) {
      Swal.fire({
        icon: 'warning',
        title: t('attention', 'Atenção'),
        text: t('badgeSubmitDaysValidation', 'O prazo para submeter a candidatura deve ser entre 1 e 30 dias.')
      });
      return;
    }

    setSubmitting(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append('id_nivel_area', formData.id_nivel_area);

      if (isManualTranslation) {
        formDataToSend.append('titulo', JSON.stringify(manualTitle));
        formDataToSend.append('descricao', JSON.stringify(manualDesc));
      } else {
        formDataToSend.append('titulo', formData.titulo);
        formDataToSend.append('descricao', formData.descricao);
      }

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
      formDataToSend.append('competencias', JSON.stringify(selectedSkills));

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
        const savedBadgeId = isEditMode ? editingId : (res.data.data?.id_badge || res.data.id_badge);

        // Save / update requirements for this badge
        if (savedBadgeId && modalRequirements.length > 0) {
          for (const reqItem of modalRequirements) {
            if (!reqItem.titulo.trim() && !reqItem.manualTitulo?.pt && !reqItem.manualTitulo?.en) continue;

            let reqPayload;
            if (isManualTranslation) {
              reqPayload = {
                id_badge: savedBadgeId,
                titulo: reqItem.manualTitulo,
                subtitulo: reqItem.manualSubtitulo,
                descricao: reqItem.manualDescricao,
                obrigatoriedade_req: reqItem.obrigatoriedade_req
              };
            } else {
              reqPayload = {
                id_badge: savedBadgeId,
                titulo: reqItem.titulo,
                subtitulo: reqItem.subtitulo || reqItem.titulo,
                descricao: reqItem.descricao || reqItem.titulo,
                obrigatoriedade_req: reqItem.obrigatoriedade_req
              };
            }

            if (reqItem.id_requisito) {
              await api.put(`/requisito_badge/${reqItem.id_requisito}`, reqPayload);
            } else {
              await api.post('/requisito_badge', reqPayload);
            }
          }
        }

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

      if (err.response?.status === 422 || err.response?.data?.code === 'TRANSLATION_API_FAILED') {
        const result = await Swal.fire({
          icon: 'warning',
          title: t('translationFailedTitle', 'Tradução Automática Indisponível'),
          text: t('translationFailedText', 'O serviço de tradução automática está temporariamente indisponível. Deseja guardar no idioma original ou preencher as traduções manualmente?'),
          showCancelButton: true,
          confirmButtonText: t('manualTranslateBtn', 'Traduzir Manualmente'),
          cancelButtonText: t('saveOriginalLangBtn', 'Guardar no Idioma Original'),
          confirmButtonColor: '#0d6efd',
          cancelButtonColor: '#6c757d'
        });

        if (result.isConfirmed) {
          setIsManualTranslation(true);
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: err.response?.data?.message || 'Ocorreu um erro ao guardar o Badge.'
        });
      }
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

      // Filtro de Nível
      if (selectedArea !== 'all' && selectedLevel !== 'all') {
        if (String(b.id_nivel_area) !== String(selectedLevel)) {
          return false;
        }
      }

      return true;
    });
  }, [badges, searchQuery, selectedSl, selectedArea, selectedLevel, allAreas]);

  // Total pages computation
  const totalPages = Math.max(1, Math.ceil(filteredBadges.length / ITEMS_PER_PAGE));

  // Paginated items
  const paginatedBadges = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBadges.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredBadges, currentPage]);

  if (Number(activeRole) !== ROLE.ADMIN) {
    return (
      <div className="users-admin-container p-4">
        <div className="alert alert-warning d-flex align-items-center gap-3 rounded-4 p-4 shadow-sm" style={{ border: '1px solid #f59e0b' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <div>
            <h6 className="fw-bold mb-1" style={{ color: '#b45309' }}>{t('accessDeniedTitle', 'Acesso Restrito')}</h6>
            <p className="mb-0 small text-muted">{t('accessDeniedAdminOnly', 'Este módulo de gestão e criação de badges está disponível exclusivamente para Administradores.')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="users-admin-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold mb-1">{t('badgesMgmtTitle')}</h3>
          <p className="text-muted small mb-0">{t('badgesMgmtSubtitle')}</p>
        </div>
        <button className="btn btn-primary fw-semibold px-3 d-flex align-items-center gap-2" style={{ borderRadius: '8px' }} onClick={handleOpenCreate}>
          <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          {t('createBadgeBtn')}
        </button>
      </div>

      {/* Search and filter bar */}
      <SearchBadges
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedSl={selectedSl}
        setSelectedSl={handleSlChange}
        selectedArea={selectedArea}
        setSelectedArea={handleAreaChange}
        selectedLevel={selectedLevel}
        setSelectedLevel={setSelectedLevel}
        levels={currentLevels}
        serviceLines={serviceLines}
        allAreas={allAreas}
        placeholder={t('searchBadgePlaceholder')}
      />

      {/* Badges Table Grid */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="users-spinner" />
            <span>{t('loadingBadgesCatalog')}</span>
          </div>
        ) : (
          <>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{t('menuBadges')}</th>
                    <th>{t('colHierarchy')}</th>
                    <th>{t('colLevel')}</th>
                    <th>{t('pointsCol')}</th>
                    <th>{t('colIssuer')}</th>
                    <th>{t('colExpires')}</th>
                    <th>{t('colStatus')}</th>
                    <th className="text-end">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedBadges.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="users-empty-row">{t('noBadgesSystem')}</td>
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
                              {badge.nivel_area || t('levelGeneral')}
                            </span>
                          </td>
                          <td className="fw-bold">{badge.pontos} pts</td>
                          <td>{badge.emissor}</td>
                          <td>
                            <div className="d-flex flex-wrap align-items-center gap-1.5">
                              {badge.badge_expiravel ? (
                                <>
                                  <span className="users-status-badge inactive">
                                    {t('statusActiveYes', 'Sim')}
                                  </span>
                                  <span className="users-status-badge" style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text-muted)', border: '1px solid var(--sidebar-border)' }}>
                                    {badge.tempo_expiracao} {t('daysLabel', 'dias')}
                                  </span>
                                </>
                              ) : (
                                <span className="users-status-badge active">
                                  {t('statusActiveNo', 'Não')}
                                </span>
                               )}
                            </div>
                            <div className="d-block mt-1">
                              <span 
                                className="users-status-badge" 
                                style={{ backgroundColor: 'rgba(99, 102, 241, 0.08)', color: '#4f46e5', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '0.7rem' }}
                                title={t('badgeSubmitDaysHelp', 'Tempo para passar de Rascunho a Submetido')}
                              >
                                ⏱️ {badge.dias_submeter ?? 7}d submissão
                              </span>
                            </div>
                          </td>
                          <td>
                            <span
                              onClick={() => handleToggleStatus(badge.id_badge)}
                              className={`users-status-badge ${badge.badgeAtivo ? 'active' : 'suspended'}`}
                              style={{ cursor: 'pointer' }}
                              title={t('toggleStatusTitle')}
                            >
                              {badge.badgeAtivo ? t('statusActive') : t('statusInactive')}
                            </span>
                          </td>
                          <td>
                            <div className="users-actions-cell">
                              <button className="users-action-btn edit" style={{ backgroundColor: 'rgba(2, 132, 199, 0.1)', color: '#0284c7' }} onClick={() => setSelectedViewBadgeId(badge.id_badge)}>
                                {t('viewBtn', 'Ver')}
                              </button>
                              <button className="users-action-btn edit" onClick={() => handleOpenEdit(badge)}>
                                {t('editBtn')}
                              </button>
                              <button className="users-action-btn block" onClick={() => handleDelete(badge.id_badge)}>
                                {t('deleteBtn')}
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
                  {t('showingBadges', { shown: paginatedBadges.length, total: filteredBadges.length })}
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
          <div className="users-modal" style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div className="users-modal-header d-flex align-items-center justify-content-between p-3 border-bottom">
              <h5 className="mb-0 fw-bold">{isEditMode ? 'Editar Badge' : 'Criar Novo Badge'}</h5>
              <div className="d-flex align-items-center gap-3">
                <ManualTranslationSwitch
                  checked={isManualTranslation}
                  onChange={(val) => setIsManualTranslation(val)}
                  disabled={submitting}
                  id="manualTranslateSwitch"
                />
                <button className="users-modal-close" onClick={() => setShowModal(false)}>
                  <svg viewBox="0 0 24 24">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              <div style={{ overflowY: 'auto', flex: 1, padding: '24px' }}>
                <div className="d-flex flex-column gap-3">

                  {/* 4 Cascading Dependent Dropdowns */}
                  <div className="row g-3">
                    {/* Dropdown 1: Learning Path */}
                    <div className="col-12 col-md-6">
                      <div className="users-form-group">
                        <label className="text-muted small fw-bold mb-1">1. Learning Path *</label>
                        <select
                          className="form-select"
                          value={modalSelectedLP}
                          onChange={(e) => {
                            setModalSelectedLP(e.target.value);
                            setModalSelectedSL('');
                            setModalSelectedArea('');
                            setFormData(prev => ({ ...prev, id_nivel_area: '' }));
                          }}
                          disabled={submitting || isEditMode}
                          style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                        >
                          <option value="">{t('selectLPOption', 'Selecione o Learning Path')}</option>
                          {learningPaths.map(lp => (
                            <option key={lp.id_learning_path} value={lp.id_learning_path}>
                              {typeof lp.learning_path === 'string' ? lp.learning_path : (lp.learning_path?.pt || lp.learning_path?.en || 'Learning Path')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dropdown 2: Service Line */}
                    <div className="col-12 col-md-6">
                      <div className="users-form-group">
                        <label className="text-muted small fw-bold mb-1">2. Service Line *</label>
                        <select
                          className="form-select"
                          value={modalSelectedSL}
                          onChange={(e) => {
                            setModalSelectedSL(e.target.value);
                            setModalSelectedArea('');
                            setFormData(prev => ({ ...prev, id_nivel_area: '' }));
                          }}
                          disabled={submitting || isEditMode || !modalSelectedLP}
                          style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                        >
                          <option value="">{t('selectSLOption', 'Selecione a Service Line')}</option>
                          {modalFilteredSLs.map(sl => (
                            <option key={sl.id_service_line} value={sl.id_service_line}>
                              {typeof sl.service_line === 'string' ? sl.service_line : (sl.service_line?.pt || sl.service_line?.en || 'Service Line')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dropdown 3: Área */}
                    <div className="col-12 col-md-6">
                      <div className="users-form-group">
                        <label className="text-muted small fw-bold mb-1">3. Área *</label>
                        <select
                          className="form-select"
                          value={modalSelectedArea}
                          onChange={(e) => {
                            setModalSelectedArea(e.target.value);
                            setFormData(prev => ({ ...prev, id_nivel_area: '' }));
                          }}
                          disabled={submitting || isEditMode || !modalSelectedSL}
                          style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                        >
                          <option value="">{t('selectAreaOption', 'Selecione a Área')}</option>
                          {modalFilteredAreas.map(a => (
                            <option key={a.id_area} value={a.id_area}>
                              {typeof a.area === 'string' ? a.area : (a.area?.pt || a.area?.en || 'Área')}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Dropdown 4: Nível */}
                    <div className="col-12 col-md-6">
                      <div className="users-form-group">
                        <label className="text-muted small fw-bold mb-1">4. Nível *</label>
                        <select
                          className="form-select"
                          value={formData.id_nivel_area}
                          onChange={(e) => setFormData(prev => ({ ...prev, id_nivel_area: e.target.value }))}
                          disabled={submitting || isEditMode || !modalSelectedArea}
                          style={{ borderRadius: '8px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                        >
                          <option value="">{t('selectLevelOption', 'Selecione o Nível')}</option>
                          {modalFilteredNiveis.map(n => (
                            <option key={n.id_nivel_area} value={n.id_nivel_area}>
                              {typeof n.nivel_area === 'string' ? n.nivel_area : (n.nivel_area?.pt || n.nivel || `Nível #${n.id_nivel_area}`)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Title */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">Título do Badge *</label>
                    {!isManualTranslation ? (
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Ex: Programador Outsystems Sénior"
                        value={formData.titulo}
                        onChange={(e) => setFormData(prev => ({ ...prev, titulo: e.target.value }))}
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
                          <input type="text" className="form-control" placeholder="Título em Português" value={manualTitle.pt} onChange={(e) => setManualTitle(prev => ({ ...prev, pt: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="en" />
                            <span>EN</span>
                          </span>
                          <input type="text" className="form-control" placeholder="Title in English" value={manualTitle.en} onChange={(e) => setManualTitle(prev => ({ ...prev, en: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="es" />
                            <span>ES</span>
                          </span>
                          <input type="text" className="form-control" placeholder="Título en Español" value={manualTitle.es} onChange={(e) => setManualTitle(prev => ({ ...prev, es: e.target.value }))} disabled={submitting} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  <div className="users-form-group">
                    <label className="text-muted small fw-bold mb-1">{t('badgeDescriptionLabel', 'Descrição do Badge *')}</label>
                    {!isManualTranslation ? (
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Escreva a descrição geral do badge..."
                        value={formData.descricao}
                        onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
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
                          <textarea className="form-control" rows="2" placeholder="Descrição em Português" value={manualDesc.pt} onChange={(e) => setManualDesc(prev => ({ ...prev, pt: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="en" />
                            <span>EN</span>
                          </span>
                          <textarea className="form-control" rows="2" placeholder="Description in English" value={manualDesc.en} onChange={(e) => setManualDesc(prev => ({ ...prev, en: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="es" />
                            <span>ES</span>
                          </span>
                          <textarea className="form-control" rows="2" placeholder="Descripción en Español" value={manualDesc.es} onChange={(e) => setManualDesc(prev => ({ ...prev, es: e.target.value }))} disabled={submitting} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Competencies Section Card */}
                  <div className="p-3 rounded-3 border mb-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                    <div className="mb-3">
                      <h6 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>
                        🎓 {t('skillBadgeTitle', 'Competências Associadas')}
                      </h6>
                      <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                        {t('skillBadgeSubtitle', 'Selecione e pesquise as competências que este badge valida.')}
                      </small>
                    </div>

                    {/* Selected Competencies */}
                    <div className="mb-3">
                      <label className="text-muted small fw-bold mb-2 d-block">
                        {t('skillsSelected', 'Competências Selecionadas')} ({selectedSkills.length})
                      </label>
                      <div className="d-flex flex-wrap gap-2 p-2 border rounded-3 min-vh-10" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)', minHeight: '50px' }}>
                        {selectedSkills.length === 0 ? (
                          <span className="text-muted small italic my-auto ps-1">Nenhuma competência selecionada. Clique nas tags abaixo para adicionar.</span>
                        ) : (
                          allCompetencias
                            .filter(c => selectedSkills.includes(c.id_competencia))
                            .map(c => (
                              <span
                                key={c.id_competencia}
                                className="badge bg-primary text-white d-flex align-items-center gap-2 rounded-pill px-3 py-2"
                                style={{ cursor: 'pointer', fontSize: '0.82rem' }}
                                onClick={() => setSelectedSkills(prev => prev.filter(id => id !== c.id_competencia))}
                                title="Clique para remover"
                              >
                                {c.titulo} <span className="fw-bold" style={{ fontSize: '0.75rem' }}>✕</span>
                              </span>
                            ))
                        )}
                      </div>
                    </div>

                    {/* Available Competencies */}
                    <div>
                      <label className="text-muted small fw-bold mb-2 d-block">
                        {t('skillsAvailable', 'Competências Disponíveis')}
                      </label>
                      <div className="mb-2">
                        <SearchBar
                          value={skillsSearchQuery}
                          onChange={setSkillsSearchQuery}
                          placeholder={t('searchSkillsPlaceholder', 'Pesquisar competências...')}
                        />
                      </div>
                      <div className="d-flex flex-wrap gap-2 p-2 border rounded-3 overflow-auto" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)', maxHeight: '180px' }}>
                        {allCompetencias
                          .filter(c => !selectedSkills.includes(c.id_competencia))
                          .filter(c => (c.titulo || '').toLowerCase().includes(skillsSearchQuery.toLowerCase()))
                          .length === 0 ? (
                          <span className="text-muted small italic my-auto ps-1">Nenhuma competência disponível ou encontrada.</span>
                        ) : (
                          allCompetencias
                            .filter(c => !selectedSkills.includes(c.id_competencia))
                            .filter(c => (c.titulo || '').toLowerCase().includes(skillsSearchQuery.toLowerCase()))
                            .map(c => (
                              <span
                                key={c.id_competencia}
                                className="badge bg-light text-dark border d-flex align-items-center gap-1 rounded-pill px-3 py-2"
                                style={{ cursor: 'pointer', fontSize: '0.82rem' }}
                                onClick={() => setSelectedSkills(prev => [...prev, c.id_competencia])}
                                title="Clique para adicionar"
                              >
                                ＋ {c.titulo}
                              </span>
                            ))
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Requirements Section Card */}
                  <div className="p-3 rounded-3 border mb-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                      <div>
                        <h6 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>
                          📋 {t('badgeRequirementsLabel', 'Requisitos do Badge')}
                        </h6>
                        <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                          Adicione os critérios específicos que o consultor deve comprovar para obter este badge.
                        </small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-primary rounded-3 fw-semibold px-3 d-flex align-items-center gap-1 shadow-sm text-white"
                        style={{ backgroundColor: '#0d6efd', borderColor: '#0d6efd' }}
                        onClick={handleAddModalRequirement}
                        disabled={submitting}
                      >
                        {t('addRequirementBtn', '+ Adicionar novo requisito')}
                      </button>
                    </div>

                    {modalRequirements.length === 0 ? (
                      <div className="text-center py-3 text-muted small border rounded-3 border-dashed" style={{ borderColor: 'var(--sidebar-border)' }}>
                        Nenhum requisito adicionado a este badge ainda. Clique em "+ Adicionar novo requisito".
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {modalRequirements.map((reqItem, idx) => (
                          <div key={idx} className="p-3 rounded-3 border shadow-sm position-relative" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                            <div className="d-flex align-items-center justify-content-between border-bottom pb-2 mb-3" style={{ borderColor: 'var(--sidebar-border)' }}>
                              <span className="fw-bold small text-primary">
                                Requisito #{idx + 1}
                              </span>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger py-0 px-2 rounded-2 small"
                                onClick={() => handleRemoveModalRequirement(idx)}
                                disabled={submitting}
                                title={t('removeReqBtn', 'Remover')}
                              >
                                🗑️ {t('removeReqBtn', 'Remover')}
                              </button>
                            </div>

                            <div className="row g-3">
                              <div className="col-12 col-md-6">
                                <label className="text-muted small fw-semibold mb-1">{t('reqTitleLabel', 'Título do Requisito *')}</label>
                                {!isManualTranslation ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm rounded-2"
                                    placeholder="Ex: Certificação Oficial OutSystems"
                                    value={reqItem.titulo}
                                    onChange={(e) => handleModalRequirementChange(idx, 'titulo', e.target.value)}
                                    disabled={submitting}
                                    style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                                  />
                                ) : (
                                  <div className="d-flex flex-column gap-1">
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text fw-bold py-0" style={{ fontSize: '0.75rem', width: '65px' }}>🇵🇹 PT</span>
                                      <input type="text" className="form-control" value={reqItem.manualTitulo?.pt || ''} onChange={(e) => handleModalRequirementChange(idx, 'manualTitulo', e.target.value, 'pt')} disabled={submitting} />
                                    </div>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text fw-bold py-0" style={{ fontSize: '0.75rem', width: '65px' }}>🇬🇧 EN</span>
                                      <input type="text" className="form-control" value={reqItem.manualTitulo?.en || ''} onChange={(e) => handleModalRequirementChange(idx, 'manualTitulo', e.target.value, 'en')} disabled={submitting} />
                                    </div>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text fw-bold py-0" style={{ fontSize: '0.75rem', width: '65px' }}>🇪🇸 ES</span>
                                      <input type="text" className="form-control" value={reqItem.manualTitulo?.es || ''} onChange={(e) => handleModalRequirementChange(idx, 'manualTitulo', e.target.value, 'es')} disabled={submitting} />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="col-12 col-md-6">
                                <label className="text-muted small fw-semibold mb-1">{t('reqSubtitleLabel', 'Subtítulo do Requisito')}</label>
                                {!isManualTranslation ? (
                                  <input
                                    type="text"
                                    className="form-control form-control-sm rounded-2"
                                    placeholder="Ex: Anexar o certificado em formato PDF"
                                    value={reqItem.subtitulo}
                                    onChange={(e) => handleModalRequirementChange(idx, 'subtitulo', e.target.value)}
                                    disabled={submitting}
                                    style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                                  />
                                ) : (
                                  <div className="d-flex flex-column gap-1">
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text fw-bold py-0" style={{ fontSize: '0.75rem', width: '65px' }}>🇵🇹 PT</span>
                                      <input type="text" className="form-control" value={reqItem.manualSubtitulo?.pt || ''} onChange={(e) => handleModalRequirementChange(idx, 'manualSubtitulo', e.target.value, 'pt')} disabled={submitting} />
                                    </div>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text fw-bold py-0" style={{ fontSize: '0.75rem', width: '65px' }}>🇬🇧 EN</span>
                                      <input type="text" className="form-control" value={reqItem.manualSubtitulo?.en || ''} onChange={(e) => handleModalRequirementChange(idx, 'manualSubtitulo', e.target.value, 'en')} disabled={submitting} />
                                    </div>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text fw-bold py-0" style={{ fontSize: '0.75rem', width: '65px' }}>🇪🇸 ES</span>
                                      <input type="text" className="form-control" value={reqItem.manualSubtitulo?.es || ''} onChange={(e) => handleModalRequirementChange(idx, 'manualSubtitulo', e.target.value, 'es')} disabled={submitting} />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="col-12">
                                <label className="text-muted small fw-semibold mb-1">{t('reqDescriptionLabel', 'Descrição do Requisito *')}</label>
                                {!isManualTranslation ? (
                                  <textarea
                                    className="form-control form-control-sm rounded-2"
                                    rows="2"
                                    placeholder="Descreva o que é necessário demonstrar..."
                                    value={reqItem.descricao}
                                    onChange={(e) => handleModalRequirementChange(idx, 'descricao', e.target.value)}
                                    disabled={submitting}
                                    style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
                                  />
                                ) : (
                                  <div className="d-flex flex-column gap-1">
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text fw-bold py-0" style={{ fontSize: '0.75rem', width: '65px' }}>🇵🇹 PT</span>
                                      <textarea className="form-control" rows="1" value={reqItem.manualDescricao?.pt || ''} onChange={(e) => handleModalRequirementChange(idx, 'manualDescricao', e.target.value, 'pt')} disabled={submitting} />
                                    </div>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text fw-bold py-0" style={{ fontSize: '0.75rem', width: '65px' }}>🇬🇧 EN</span>
                                      <textarea className="form-control" rows="1" value={reqItem.manualDescricao?.en || ''} onChange={(e) => handleModalRequirementChange(idx, 'manualDescricao', e.target.value, 'en')} disabled={submitting} />
                                    </div>
                                    <div className="input-group input-group-sm">
                                      <span className="input-group-text fw-bold py-0" style={{ fontSize: '0.75rem', width: '65px' }}>🇪🇸 ES</span>
                                      <textarea className="form-control" rows="1" value={reqItem.manualDescricao?.es || ''} onChange={(e) => handleModalRequirementChange(idx, 'manualDescricao', e.target.value, 'es')} disabled={submitting} />
                                    </div>
                                  </div>
                                )}
                              </div>

                              <div className="col-12 d-flex align-items-center justify-content-between pt-1">
                                <span className="small text-muted fw-semibold">{t('reqObligatoryLabel', 'Obrigatório')}?</span>
                                <div className="form-check form-switch m-0">
                                  <input
                                    className="form-check-input"
                                    type="checkbox"
                                    role="switch"
                                    checked={reqItem.obrigatoriedade_req}
                                    onChange={(e) => handleModalRequirementChange(idx, 'obrigatoriedade_req', e.target.checked)}
                                    disabled={submitting}
                                    style={{
                                      width: '2.5em',
                                      height: '1.25em',
                                      cursor: 'pointer',
                                      backgroundColor: reqItem.obrigatoriedade_req ? '#0d6efd' : '#64748b',
                                      borderColor: reqItem.obrigatoriedade_req ? '#0d6efd' : '#475569'
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
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
                        <label className="text-muted small fw-bold mb-1">
                          {t('badgeLogoLabel', 'Logótipo do Badge')}
                        </label>
                        <input
                          type="file"
                          className="form-control"
                          accept="image/png, image/jpeg, image/jpg, .png, .jpg, .jpeg"
                          onChange={(e) => {
                            const file = e.target.files[0] || null;
                            if (file && !['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                              Swal.fire({
                                icon: 'error',
                                title: t('invalidFormat', 'Formato Inválido'),
                                text: t('photoFormatNotice', 'Apenas ficheiros PNG ou JPEG (JPG) são permitidos.')
                              });
                              e.target.value = '';
                              setLogoFile(null);
                              return;
                            }
                            setLogoFile(file);
                          }}
                          disabled={submitting}
                          style={{ borderRadius: '8px' }}
                        />
                        <small className="text-muted small d-block mt-1">
                          {t('selectBadgeLogoHelp', 'Selecione uma imagem para o logótipo em formato PNG ou JPEG (deixe vazio para manter o padrão ou a atual).')}
                        </small>
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

              </div>

              {/* Sticky Form Actions Footer */}
              <div className="d-flex justify-content-end gap-2 p-3 border-top bg-light" style={{ backgroundColor: 'var(--panel-2)' }}>
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
      {selectedViewBadgeId && (
        <ViewBadgeModal
          badgeId={selectedViewBadgeId}
          onClose={() => setSelectedViewBadgeId(null)}
        />
      )}
    </div>
  );
}
