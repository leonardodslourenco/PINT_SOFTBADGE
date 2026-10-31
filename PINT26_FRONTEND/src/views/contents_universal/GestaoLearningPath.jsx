import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next'; // Hook para tradução estática do ecrã
import { api } from '../../services/api';     // Instância do Axios pré-configurada com os intercetores multilíngues
import Swal from 'sweetalert2';                   // Biblioteca para caixas de diálogo e alertas estilizados
import { useAppContext } from '../../context/AppContext'; // Contexto global para escutar mutações de idioma e tema
import { ROLE } from '../../constants/roles';
import SearchBar from '../../components/SearchBar';
import ManualTranslationSwitch from '../../components/ManualTranslationSwitch';

/**
 * VISTA COMPONENTE: GestaoLearningPath
 * Painel administrativo focado no desenho, listagem e criação das matrizes estruturais da plataforma.
 */
export default function GestaoLearningPath() {
  const { t, i18n } = useTranslation();
  const { language, socket, activeRole } = useAppContext(); // Extrai o idioma ativo e o perfil ativo para controlo de acesso
  
  // =========================================================================
  // ESTADOS GLOBAIS DA MÁQUINA VISUAL (STATE MANAGEMENT)
  // =========================================================================
  const [learningPaths, setLearningPaths] = useState([]); // Coleção mestre de Trilhos de Aprendizagem
  const [serviceLines, setServiceLines] = useState([]);   // Coleção de Departamentos / Linhas de Serviço
  const [areas, setAreas] = useState([]);                 // Coleção de Áreas de Competência (Nó folha)
  const [loading, setLoading] = useState(true);           // Flag de controlo do esqueleto de carregamento (Spinner)
  const [searchQuery, setSearchQuery] = useState('');     // Query string para filtragem em tempo real
  
  // Estados de controlo do Modal flutuante de criação de novos Trilhos
  const [showModalLP, setShowModalLP] = useState(false);
  const [formDataLP, setFormDataLP] = useState({ titulo: '', descricao: '', cor: '--color1-LP' });
  const [submitting, setSubmitting] = useState(false); // Flag de submissão para evitar cliques duplos (Debounce visual)

  // States for manual translation mode - Create LP
  const [isManualTranslationLP, setIsManualTranslationLP] = useState(false);
  const [manualTitleLP, setManualTitleLP] = useState({ pt: '', en: '', es: '' });
  const [manualDescLP, setManualDescLP] = useState({ pt: '', en: '', es: '' });

  // States for manual translation mode - Edit LP
  const [isManualTranslationEditLP, setIsManualTranslationEditLP] = useState(false);
  const [manualTitleEditLP, setManualTitleEditLP] = useState({ pt: '', en: '', es: '' });
  const [manualDescEditLP, setManualDescEditLP] = useState({ pt: '', en: '', es: '' });

  // Estados de controlo do Modal flutuante de criação de Service Lines
  const [showModalSL, setShowModalSL] = useState(false);
  const [formDataSL, setFormDataSL] = useState({ titulo: '', id_learning_path: '', id_sl_lider: '' });
  const [isEditModeSL, setIsEditModeSL] = useState(false);
  const [editingSLId, setEditingSLId] = useState(null);
  const [isManualTranslationSL, setIsManualTranslationSL] = useState(false);
  const [manualTitleSL, setManualTitleSL] = useState({ pt: '', en: '', es: '' });
  const [sllList, setSllList] = useState([]);

  // Estados de controlo do Modal flutuante de criação de Áreas
  const [showModalArea, setShowModalArea] = useState(false);
  const [formDataArea, setFormDataArea] = useState({ titulo: '', id_learning_path: '', id_service_line: '', liderName: '' });

  // Estados e funções do acordeão dinâmico
  const [openLPs, setOpenLPs] = useState({});
  const [openSLs, setOpenSLs] = useState({});

  const toggleLP = (id) => {
    setOpenLPs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSL = (id) => {
    setOpenSLs(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Estados para Edição (Modal Popup de Alta Fidelidade)
  const [showModalEditLP, setShowModalEditLP] = useState(false);
  const [editingLP, setEditingLP] = useState(null);
  const [editFormData, setEditFormData] = useState({ titulo: '', descricao: '', cor: '--color1-LP', visibilidade: true, suspenso: false });
  const [associatedSLs, setAssociatedSLs] = useState([]);
  const [slSearchQuery, setSlSearchQuery] = useState('');

  // Estados para Edição de Área
  const [showModalEditArea, setShowModalEditArea] = useState(false);
  const [editingArea, setEditingArea] = useState(null);
  const [editFormDataArea, setEditFormDataArea] = useState({ titulo: '', id_service_line: '', areaAtiva: true });

  // States for manual translation mode - Create Area
  const [isManualTranslationArea, setIsManualTranslationArea] = useState(false);
  const [manualTitleArea, setManualTitleArea] = useState({ pt: '', en: '', es: '' });

  // States for manual translation mode - Edit Area
  const [isManualTranslationEditArea, setIsManualTranslationEditArea] = useState(false);
  const [manualTitleEditArea, setManualTitleEditArea] = useState({ pt: '', en: '', es: '' });

  // Estados para Gestão de Níveis da Área
  const [showModalLevels, setShowModalLevels] = useState(false);
  const [selectedAreaForLevels, setSelectedAreaForLevels] = useState(null);
  const [areaLevels, setAreaLevels] = useState([]);
  const [loadingLevels, setLoadingLevels] = useState(false);
  const [editingLevel, setEditingLevel] = useState(null);
  const [formDataLevel, setFormDataLevel] = useState({ titulo: '', candidatura_com_prazo: false, tempo_concluir_candidatura: 30 });
  const [submittingLevel, setSubmittingLevel] = useState(false);

  const handleToggleManualTranslationLP = (enable) => {
    if (enable) {
      setIsManualTranslationLP(true);
      const activeLang = (i18n.language || 'pt').slice(0, 2);
      setManualTitleLP(prev => ({
        pt: prev?.pt || formDataLP.titulo || '',
        en: prev?.en || formDataLP.titulo || '',
        es: prev?.es || formDataLP.titulo || '',
        [activeLang]: formDataLP.titulo || ''
      }));
      setManualDescLP(prev => ({
        pt: prev?.pt || formDataLP.descricao || '',
        en: prev?.en || formDataLP.descricao || '',
        es: prev?.es || formDataLP.descricao || '',
        [activeLang]: formDataLP.descricao || ''
      }));
    } else {
      setIsManualTranslationLP(false);
    }
  };

  const handleToggleManualTranslationEditLP = (enable) => {
    if (enable) {
      setIsManualTranslationEditLP(true);
      const activeLang = (i18n.language || 'pt').slice(0, 2);
      setManualTitleEditLP(prev => ({
        pt: prev?.pt || editFormData.titulo || '',
        en: prev?.en || editFormData.titulo || '',
        es: prev?.es || editFormData.titulo || '',
        [activeLang]: editFormData.titulo || ''
      }));
      setManualDescEditLP(prev => ({
        pt: prev?.pt || editFormData.descricao || '',
        en: prev?.en || editFormData.descricao || '',
        es: prev?.es || editFormData.descricao || '',
        [activeLang]: editFormData.descricao || ''
      }));
    } else {
      setIsManualTranslationEditLP(false);
    }
  };

  const handleToggleManualTranslationSL = (enable) => {
    if (enable) {
      setIsManualTranslationSL(true);
      const activeLang = (i18n.language || 'pt').slice(0, 2);
      setManualTitleSL(prev => ({
        pt: prev?.pt || formDataSL.titulo || '',
        en: prev?.en || formDataSL.titulo || '',
        es: prev?.es || formDataSL.titulo || '',
        [activeLang]: formDataSL.titulo || ''
      }));
    } else {
      setIsManualTranslationSL(false);
    }
  };

  const handleToggleManualTranslationArea = (enable) => {
    if (enable) {
      setIsManualTranslationArea(true);
      const activeLang = (i18n.language || 'pt').slice(0, 2);
      setManualTitleArea(prev => ({
        pt: prev?.pt || formDataArea.titulo || '',
        en: prev?.en || formDataArea.titulo || '',
        es: prev?.es || formDataArea.titulo || '',
        [activeLang]: formDataArea.titulo || ''
      }));
    } else {
      setIsManualTranslationArea(false);
    }
  };

  const handleToggleManualTranslationEditArea = (enable) => {
    if (enable) {
      setIsManualTranslationEditArea(true);
      const activeLang = (i18n.language || 'pt').slice(0, 2);
      setManualTitleEditArea(prev => ({
        pt: prev?.pt || editFormDataArea.titulo || '',
        en: prev?.en || editFormDataArea.titulo || '',
        es: prev?.es || editFormDataArea.titulo || '',
        [activeLang]: editFormDataArea.titulo || ''
      }));
    } else {
      setIsManualTranslationEditArea(false);
    }
  };

  const handleOpenCreateArea = () => {
    setIsManualTranslationArea(false);
    setManualTitleArea({ pt: '', en: '', es: '' });
    setFormDataArea({ titulo: '', id_learning_path: '', id_service_line: '', liderName: '' });
    setShowModalArea(true);
  };

  // Handlers para Edição de Área
  const handleOpenEditArea = async (area) => {
    setEditingArea(area);
    const initialTitle = area.area || '';
    setEditFormDataArea({
      titulo: initialTitle,
      id_service_line: area.id_service_line || '',
      areaAtiva: area.areaAtiva !== undefined ? area.areaAtiva : true
    });
    setIsManualTranslationEditArea(false);
    setManualTitleEditArea({ pt: initialTitle, en: initialTitle, es: initialTitle });
    setShowModalEditArea(true);

    try {
      const [aPt, aEn, aEs] = await Promise.all([
        api.get(`/area/${area.id_area}?lang=pt`).catch(() => null),
        api.get(`/area/${area.id_area}?lang=en`).catch(() => null),
        api.get(`/area/${area.id_area}?lang=es`).catch(() => null)
      ]);

      const tPt = aPt?.data?.data?.area || initialTitle;
      const tEn = aEn?.data?.data?.area || initialTitle;
      const tEs = aEs?.data?.data?.area || initialTitle;

      setManualTitleEditArea({ pt: tPt, en: tEn, es: tEs });
    } catch (err) {
      console.error('Erro ao buscar traduções da área:', err);
    }
  };

  const handleSaveEditArea = async (e) => {
    e.preventDefault();
    if (!editingArea) return;

    const activeTitle = isManualTranslationEditArea ? (manualTitleEditArea.pt || manualTitleEditArea.en || manualTitleEditArea.es) : editFormDataArea.titulo;
    if (!activeTitle?.trim()) {
      return Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Preencha o título da área.' });
    }

    try {
      setSubmitting(true);
      const payload = {
        titulo: isManualTranslationEditArea ? manualTitleEditArea : editFormDataArea.titulo.trim(),
        id_service_line: Number(editFormDataArea.id_service_line),
        areaAtiva: editFormDataArea.areaAtiva
      };
      await api.put(`/area/${editingArea.id_area}`, payload);
      Swal.fire({
        icon: 'success',
        title: t('successTitle', 'Sucesso'),
        text: t('areaUpdatedSuccess', 'Área atualizada com sucesso.'),
        timer: 1500,
        showConfirmButton: false
      });
      setShowModalEditArea(false);
      fetchData();
    } catch (err) {
      console.error('Erro ao atualizar área:', err);
      Swal.fire({ icon: 'error', title: 'Erro', text: err.response?.data?.message || 'Erro ao atualizar área.' });
    } finally {
      setSubmitting(false);
    }
  };

  // Handlers para Gestão de Níveis
  const fetchAreaLevels = useCallback(async (id_area) => {
    try {
      setLoadingLevels(true);
      const res = await api.get(`/nivel_area/area/${id_area}`);
      if (res.data?.data) {
        setAreaLevels(res.data.data);
      } else {
        setAreaLevels([]);
      }
    } catch (err) {
      console.error('Erro ao listar níveis da área:', err);
      setAreaLevels([]);
    } finally {
      setLoadingLevels(false);
    }
  }, []);

  const handleOpenLevelsModal = (area) => {
    setSelectedAreaForLevels(area);
    setEditingLevel(null);
    setFormDataLevel({ titulo: '', candidatura_com_prazo: false, tempo_concluir_candidatura: 30 });
    setShowModalLevels(true);
    fetchAreaLevels(area.id_area);
  };

  const handleStartEditLevel = (lvl) => {
    setEditingLevel(lvl);
    setFormDataLevel({
      titulo: lvl.nivel_area || '',
      candidatura_com_prazo: Boolean(lvl.candidatura_com_prazo),
      tempo_concluir_candidatura: lvl.tempo_concluir_candidatura || 30
    });
  };

  const handleCancelEditLevel = () => {
    setEditingLevel(null);
    setFormDataLevel({ titulo: '', candidatura_com_prazo: false, tempo_concluir_candidatura: 30 });
  };

  const handleSaveLevel = async (e) => {
    e.preventDefault();
    if (!selectedAreaForLevels || !formDataLevel.titulo.trim()) return;

    try {
      setSubmittingLevel(true);
      const payload = {
        id_area_sl: selectedAreaForLevels.id_area,
        titulo: formDataLevel.titulo.trim(),
        candidatura_com_prazo: formDataLevel.candidatura_com_prazo,
        tempo_concluir_candidatura: formDataLevel.candidatura_com_prazo ? Number(formDataLevel.tempo_concluir_candidatura) : null
      };

      if (editingLevel) {
        await api.put(`/nivel_area/${editingLevel.id_nivel_area}`, payload);
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso'),
          text: t('levelUpdatedSuccess', 'Nível atualizado com sucesso.'),
          timer: 1500,
          showConfirmButton: false
        });
      } else {
        await api.post('/nivel_area', payload);
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso'),
          text: t('levelCreatedSuccess', 'Nível criado com sucesso.'),
          timer: 1500,
          showConfirmButton: false
        });
      }

      setEditingLevel(null);
      setFormDataLevel({ titulo: '', candidatura_com_prazo: false, tempo_concluir_candidatura: 30 });
      fetchAreaLevels(selectedAreaForLevels.id_area);
    } catch (err) {
      console.error('Erro ao guardar nível:', err);
      Swal.fire({ icon: 'error', title: 'Erro', text: err.response?.data?.message || 'Erro ao guardar nível.' });
    } finally {
      setSubmittingLevel(false);
    }
  };

  const handleDeleteLevel = async (id_nivel_area) => {
    const result = await Swal.fire({
      title: t('confirmDeleteTitle', 'Tem a certeza?'),
      text: t('confirmDeleteLevel', 'Tem a certeza de que deseja eliminar este nível?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('deleteBtn', 'Eliminar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/nivel_area/${id_nivel_area}`);
      Swal.fire({
        icon: 'success',
        title: t('successTitle', 'Sucesso'),
        text: t('levelDeletedSuccess', 'Nível eliminado com sucesso.'),
        timer: 1500,
        showConfirmButton: false
      });
      if (selectedAreaForLevels) {
        fetchAreaLevels(selectedAreaForLevels.id_area);
      }
    } catch (err) {
      console.error('Erro ao eliminar nível:', err);
      Swal.fire({ icon: 'error', title: 'Erro', text: err.response?.data?.message || 'Erro ao eliminar nível.' });
    }
  };

  const handleDeleteSL = async (id_service_line) => {
    const result = await Swal.fire({
      title: t('confirmDeleteTitle', 'Tem a certeza?'),
      text: t('confirmDeleteSL', 'Tem a certeza de que deseja eliminar esta Service Line?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('deleteBtn', 'Eliminar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/service_line/${id_service_line}`);
      Swal.fire({
        icon: 'success',
        title: t('successTitle', 'Sucesso'),
        text: t('slDeletedSuccess', 'Service Line eliminada com sucesso.'),
        timer: 1500,
        showConfirmButton: false
      });
      fetchData();
    } catch (err) {
      console.error('Erro ao eliminar Service Line:', err);
      Swal.fire({ icon: 'error', title: 'Erro', text: err.response?.data?.message || 'Erro ao eliminar Service Line.' });
    }
  };

  const handleDeleteArea = async (id_area) => {
    const result = await Swal.fire({
      title: t('confirmDeleteTitle', 'Tem a certeza?'),
      text: t('confirmDeleteArea', 'Tem a certeza de que deseja eliminar esta área?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('deleteBtn', 'Eliminar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/area/${id_area}`);
      Swal.fire({
        icon: 'success',
        title: t('successTitle', 'Sucesso'),
        text: t('areaDeletedSuccess', 'Área eliminada com sucesso.'),
        timer: 1500,
        showConfirmButton: false
      });
      fetchData();
    } catch (err) {
      console.error('Erro ao eliminar área:', err);
      Swal.fire({ icon: 'error', title: 'Erro', text: err.response?.data?.message || 'Erro ao eliminar área.' });
    }
  };

  // Variáveis de cor do theme.css
  const colorOptions = Array.from({ length: 15 }, (_, i) => `--color${i + 1}-LP`);
  // Estado de filtragem por responsável SLL
  const [selectedSllFilter, setSelectedSllFilter] = useState('');

  // =========================================================================
  // PROCESSAMENTO ASSÍNCRONO DE REDE (HTTP AGGREGATION)
  // =========================================================================
  /**
   * PERFORMANCE: MEMORIZAÇÃO DO FETCH DATA
   * Enclausura a função com 'useCallback' para evitar que ela seja recriada na memória RAM a cada render.
   * Utiliza o método Promise.all() para disparar os três pedidos HTTP em paralelo na rede.
   */
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      
      const [resLP, resSL, resArea, resSLL] = await Promise.all([
        api.get('/learning_path'),
        api.get('/service_line'),
        api.get('/area'),
        api.get('/utilizador/perfil/2?ativo=true').catch(err => {
          console.error('Erro ao buscar utilizadores com perfil SLL:', err);
          return { data: { success: false, data: [] } };
        })
      ]);

      const lps = resLP.data?.success ? (resLP.data.data || []) : [];
      setLearningPaths(lps);
      if (resSL.data?.success) setServiceLines(resSL.data.data || []);
      if (resArea.data?.success) setAreas(resArea.data.data || []);
      if (resSLL.data?.success) setSllList(resSLL.data.data || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível carregar os dados.' });
    } finally {
      setLoading(false);
    }
  }, []);

  // CICLO DE VIDA: Dispara a carga de dados no arranque, quando a língua muda ou o perfil ativo é alterado
  useEffect(() => {
    fetchData();
  }, [fetchData, language, activeRole]);

  // Escuta ativa em tempo real via WebSocket para atualizações de áreas e notificações de gestão
  useEffect(() => {
    if (!socket) return;
    const handleRealtimeUpdate = () => {
      fetchData();
    };

    socket.on('notification', handleRealtimeUpdate);
    socket.on('gestao_area', handleRealtimeUpdate);
    socket.on('learning_path_updated', handleRealtimeUpdate);
    socket.on('service_line_updated', handleRealtimeUpdate);
    socket.on('area_updated', handleRealtimeUpdate);
    socket.on('nivel_updated', handleRealtimeUpdate);
    socket.on('badge_updated', handleRealtimeUpdate);
    socket.on('requisito_updated', handleRealtimeUpdate);

    return () => {
      socket.off('notification', handleRealtimeUpdate);
      socket.off('gestao_area', handleRealtimeUpdate);
      socket.off('learning_path_updated', handleRealtimeUpdate);
      socket.off('service_line_updated', handleRealtimeUpdate);
      socket.off('area_updated', handleRealtimeUpdate);
      socket.off('nivel_updated', handleRealtimeUpdate);
      socket.off('badge_updated', handleRealtimeUpdate);
      socket.off('requisito_updated', handleRealtimeUpdate);
    };
  }, [socket, fetchData]);

  // =========================================================================
  // ALGORITMO ANALÍTICO DE FILTRAGEM FILIADA (USEMEMO COESIVO)
  // =========================================================================
  /**
   * ARQUITETURA AVANÇADA: COMPUTED FILTERED DATA
   * Memoriza o resultado da pesquisa. O algoritmo realiza uma busca em cascata cruzada reversa:
   * Filtra Áreas -> Filtra Linhas de Serviço donas das áreas -> Filtra Trilhos donos das Linhas de Serviço.
   */
  const filteredData = useMemo(() => {
    let q = searchQuery.toLowerCase().trim();
    
    // Filtrar apenas LPs ativos (soft delete = true)
    const activeLPs = learningPaths.filter(lp => lp.lpAtivo);

    let fSLs = serviceLines;
    if (selectedSllFilter) {
      fSLs = serviceLines.filter(sl => 
        String(sl.id_sl_lider) === String(selectedSllFilter) ||
        sl.nome_sll === selectedSllFilter
      );
    }

    let fAreas = areas;
    if (selectedSllFilter) {
      const allowedSlIds = new Set(fSLs.map(sl => sl.id_service_line));
      fAreas = areas.filter(a => allowedSlIds.has(a.id_service_line));
    }

    let fLPs = activeLPs;
    if (selectedSllFilter) {
      const allowedLpIds = new Set(fSLs.map(sl => sl.id_learning_path));
      fLPs = activeLPs.filter(lp => allowedLpIds.has(lp.id_learning_path));
    }

    if (q) {
      const fAreasFiltered = fAreas.filter(a => a.area?.toLowerCase().includes(q));
      const fSLsFiltered = fSLs.filter(sl => 
        sl.service_line?.toLowerCase().includes(q) || 
        fAreasFiltered.some(a => a.id_service_line === sl.id_service_line)
      );
      fLPs = fLPs.filter(lp => 
        lp.learning_path?.toLowerCase().includes(q) || 
        fSLsFiltered.some(sl => sl.id_learning_path === lp.id_learning_path)
      );
    }

    return { learningPaths: fLPs, serviceLines: fSLs, areas: fAreas };
  }, [learningPaths, serviceLines, areas, searchQuery, selectedSllFilter]);

  const filteredServiceLinesInModal = useMemo(() => {
    if (!formDataArea.id_learning_path || formDataArea.id_learning_path === '') {
      return serviceLines.filter(s => s.slAtivo);
    }
    return serviceLines.filter(s => s.slAtivo && String(s.id_learning_path) === String(formDataArea.id_learning_path));
  }, [serviceLines, formDataArea.id_learning_path]);

  // =========================================================================
  // PROCESSAMENTO DE SUBMISSÃO DE DADOS (MUTATION CONTROLLER)
  // =========================================================================
  /**
   * EVENT HANDLER: handleCreateLP
   * Valida as propriedades textuais do formulário local e submete o novo Trilho ao Backend.
   */
  const handleCreateLP = async (e) => {
    e.preventDefault();
    const activeTitle = isManualTranslationLP ? (manualTitleLP.pt || manualTitleLP.en || manualTitleLP.es) : formDataLP.titulo;
    const activeDesc = isManualTranslationLP ? (manualDescLP.pt || manualDescLP.en || manualDescLP.es) : formDataLP.descricao;

    if (!activeTitle?.trim()) {
      return Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Preencha o título do Learning Path.' });
    }

    setSubmitting(true);
    try {
      const payload = {
        titulo: isManualTranslationLP ? manualTitleLP : formDataLP.titulo.trim(),
        descricao: isManualTranslationLP ? manualDescLP : formDataLP.descricao.trim(),
        cor: formDataLP.cor
      };

      const res = await api.post('/learning_path', payload);
      if (res.data?.success) {
        Swal.fire({ icon: 'success', title: 'Sucesso', text: 'Learning Path criado com sucesso.', timer: 1500, showConfirmButton: false });
        setShowModalLP(false);
        setFormDataLP({ titulo: '', descricao: '', cor: '--color1-LP' });
        setIsManualTranslationLP(false);
        setManualTitleLP({ pt: '', en: '', es: '' });
        setManualDescLP({ pt: '', en: '', es: '' });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Erro', text: err.response?.data?.message || 'Erro ao criar Learning Path.' });
    } finally {
      setSubmitting(false);
    }
  };
  const handleOpenCreateSL = (lpId = '') => {
    setIsEditModeSL(false);
    setEditingSLId(null);
    setIsManualTranslationSL(false);
    setFormDataSL({ titulo: '', id_learning_path: lpId || '', id_sl_lider: '' });
    setManualTitleSL({ pt: '', en: '', es: '' });
    setShowModalSL(true);
  };

  const handleOpenEditSL = async (sl) => {
    setIsEditModeSL(true);
    setEditingSLId(sl.id_service_line);
    setIsManualTranslationSL(false);
    
    const initialTitle = sl.service_line || '';
    setFormDataSL({
      titulo: initialTitle,
      id_learning_path: sl.id_learning_path || '',
      id_sl_lider: sl.id_sl_lider || ''
    });
    setManualTitleSL({ pt: initialTitle, en: initialTitle, es: initialTitle });
    
    setShowModalSL(true);

    try {
      const [slPt, slEn, slEs] = await Promise.all([
        api.get(`/service_line/${sl.id_service_line}?lang=pt`).catch(() => null),
        api.get(`/service_line/${sl.id_service_line}?lang=en`).catch(() => null),
        api.get(`/service_line/${sl.id_service_line}?lang=es`).catch(() => null)
      ]);

      const tPt = slPt?.data?.data?.service_line || initialTitle;
      const tEn = slEn?.data?.data?.service_line || initialTitle;
      const tEs = slEs?.data?.data?.service_line || initialTitle;

      setManualTitleSL({ pt: tPt, en: tEn, es: tEs });
    } catch (err) {
      console.error('Erro ao buscar traduções da Service Line:', err);
    }
  };

  const handleSaveSL = async (e) => {
    e.preventDefault();
    const activeTitle = isManualTranslationSL ? (manualTitleSL.pt || manualTitleSL.en || manualTitleSL.es) : formDataSL.titulo;

    if (!activeTitle?.trim() || !formDataSL.id_learning_path) {
      return Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Preencha o título e selecione o Learning Path.' });
    }

    setSubmitting(true);
    try {
      const payload = {
        titulo: isManualTranslationSL ? manualTitleSL : formDataSL.titulo.trim(),
        id_learning_path: Number(formDataSL.id_learning_path),
        id_sl_lider: formDataSL.id_sl_lider ? formDataSL.id_sl_lider : null
      };

      let res;
      if (isEditModeSL) {
        res = await api.put(`/service_line/${editingSLId}`, payload);
      } else {
        res = await api.post('/service_line', payload);
      }

      if (res.data?.success) {
        Swal.fire({ 
          icon: 'success', 
          title: 'Sucesso', 
          text: isEditModeSL ? 'Service Line atualizada com sucesso.' : 'Service Line criada com sucesso.', 
          timer: 1500, 
          showConfirmButton: false 
        });
        setShowModalSL(false);
        setFormDataSL({ titulo: '', id_learning_path: '', id_sl_lider: '' });
        setIsManualTranslationSL(false);
        setManualTitleSL({ pt: '', en: '', es: '' });
        await fetchData();

        // Refresh associated list if editing within LP modal
        if (editingLP) {
          const assocRes = await api.get(`/service_line/lp/${editingLP.id_learning_path}`);
          if (assocRes.data?.success) {
            const mapped = (assocRes.data.data || []).map(item => ({
              ...item,
              visibilidade: true,
              suspenso: false
            }));
            setAssociatedSLs(mapped);
          }
        }
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Erro', text: err.response?.data?.message || 'Erro ao guardar Service Line.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateArea = async (e) => {
    e.preventDefault();
    const activeTitle = isManualTranslationArea ? (manualTitleArea.pt || manualTitleArea.en || manualTitleArea.es) : formDataArea.titulo;

    if (!activeTitle?.trim() || !formDataArea.id_service_line) {
      return Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Preencha o título e selecione a Service Line.' });
    }

    setSubmitting(true);
    try {
      const res = await api.post('/area', {
        titulo: isManualTranslationArea ? manualTitleArea : formDataArea.titulo.trim(),
        id_service_line: Number(formDataArea.id_service_line)
      });
      if (res.data?.success) {
        Swal.fire({ icon: 'success', title: 'Sucesso', text: 'Área criada com sucesso.', timer: 1500, showConfirmButton: false });
        setShowModalArea(false);
        setFormDataArea({ titulo: '', id_learning_path: '', id_service_line: '', liderName: '' });
        setIsManualTranslationArea(false);
        setManualTitleArea({ pt: '', en: '', es: '' });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Erro', text: err.response?.data?.message || 'Erro ao criar Área.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLpChangeInAreaModal = (lpId) => {
    setFormDataArea(prev => ({
      ...prev,
      id_learning_path: lpId,
      id_service_line: '',
      liderName: ''
    }));
  };

  const handleSlChangeInAreaModal = (slId) => {
    if (!slId || slId === '') {
      setFormDataArea(prev => ({
        ...prev,
        id_service_line: '',
        liderName: ''
      }));
      return;
    }
    const slObj = serviceLines.find(s => String(s.id_service_line) === String(slId));
    setFormDataArea(prev => ({
      ...prev,
      id_service_line: slId,
      liderName: slObj?.nome_sll || t('noLeaderOption')
    }));
  };

  const handleUpdateLP = async (e) => {
    e.preventDefault();
    const activeTitle = isManualTranslationEditLP ? (manualTitleEditLP.pt || manualTitleEditLP.en || manualTitleEditLP.es) : editFormData.titulo;

    if (!activeTitle?.trim()) {
      return Swal.fire({ icon: 'warning', title: 'Atenção', text: 'Preencha o título do Learning Path.' });
    }

    setSubmitting(true);
    try {
      const payload = {
        titulo: isManualTranslationEditLP ? manualTitleEditLP : editFormData.titulo.trim(),
        descricao: isManualTranslationEditLP ? manualDescEditLP : editFormData.descricao.trim(),
        cor: editFormData.cor,
        visibilidade: editFormData.visibilidade,
        suspenso: editFormData.suspenso
      };

      const res = await api.put(`/learning_path/${editingLP.id_learning_path}`, payload);
      if (res.data?.success) {
        Swal.fire({ icon: 'success', title: 'Sucesso', text: 'Learning Path atualizado com sucesso.', timer: 1500, showConfirmButton: false });
        setShowModalEditLP(false);
        setEditingLP(null);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Erro', text: err.response?.data?.message || 'Erro ao atualizar Learning Path.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleVisibility = async (lp) => {
    try {
      const newVis = !lp.visibilidade;
      const res = await api.put(`/learning_path/${lp.id_learning_path}`, {
        visibilidade: newVis
      });
      if (res.data?.success) {
        await fetchData();
        setEditingLP(prev => prev ? { ...prev, visibilidade: newVis } : null);
        setEditFormData(prev => ({ ...prev, visibilidade: newVis }));
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível alterar a visibilidade.' });
    }
  };

  const handleToggleSuspension = async (lp) => {
    const actionText = lp.suspenso ? t('confirmReactivateLP') : t('confirmSuspendLP');
    const result = await Swal.fire({
      title: 'Confirmação',
      text: actionText,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Sim',
      cancelButtonText: t('cancelBtn')
    });
    if (!result.isConfirmed) return;

    try {
      const newSusp = !lp.suspenso;
      const res = await api.put(`/learning_path/${lp.id_learning_path}`, {
        suspenso: newSusp
      });
      if (res.data?.success) {
        await fetchData();
        setEditingLP(prev => prev ? { ...prev, suspenso: newSusp } : null);
        setEditFormData(prev => ({ ...prev, suspenso: newSusp }));
        Swal.fire({ icon: 'success', title: 'Sucesso', text: 'Estado de suspensão atualizado.', timer: 1000, showConfirmButton: false });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível alterar o estado de suspensão.' });
    }
  };

  const handleDeleteLP = async (lp) => {
    const result = await Swal.fire({
      title: t('confirmDeleteTitle', 'Tem a certeza?'),
      text: t('confirmDeleteLP'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: t('deleteBtn'),
      cancelButtonText: t('cancelBtn')
    });
    if (!result.isConfirmed) return;

    try {
      const res = await api.delete(`/learning_path/${lp.id_learning_path}`);
      if (res.data?.success) {
        setShowModalEditLP(false);
        setEditingLP(null);
        await fetchData();
        Swal.fire({ icon: 'success', title: t('successTitle', 'Sucesso'), text: t('lpDeletedSuccess', 'Learning Path eliminado com sucesso.'), timer: 1500, showConfirmButton: false });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({ icon: 'error', title: 'Erro', text: 'Não foi possível eliminar o Learning Path.' });
    }
  };

  const startEditing = async (lp) => {
    setSlSearchQuery('');
    setEditingLP(lp);
    setIsManualTranslationEditLP(false);

    const initialTitle = lp.learning_path || '';
    const initialDesc = lp.descricao_lp || '';

    setEditFormData({
      titulo: initialTitle,
      descricao: initialDesc,
      cor: lp.cor || '--color1-LP',
      visibilidade: lp.visibilidade !== undefined ? lp.visibilidade : true,
      suspenso: lp.suspenso !== undefined ? lp.suspenso : false
    });

    setManualTitleEditLP({ pt: initialTitle, en: initialTitle, es: initialTitle });
    setManualDescEditLP({ pt: initialDesc, en: initialDesc, es: initialDesc });
    
    // Obter as Service Lines associadas ao LP
    try {
      const res = await api.get(`/service_line/lp/${lp.id_learning_path}`);
      if (res.data?.success) {
        // Inicializar estados de visibilidade/suspensão mockados localmente já que não existem na BD do SL
        const mapped = (res.data.data || []).map(sl => ({
          ...sl,
          visibilidade: true,
          suspenso: false
        }));
        setAssociatedSLs(mapped);
      }
    } catch (err) {
      console.error('Erro ao buscar Service Lines associadas:', err);
      setAssociatedSLs([]);
    }

    setShowModalEditLP(true);

    // Buscar as traduções reais nas 3 línguas
    try {
      const [lpPt, lpEn, lpEs] = await Promise.all([
        api.get(`/learning_path/${lp.id_learning_path}?lang=pt`).catch(() => null),
        api.get(`/learning_path/${lp.id_learning_path}?lang=en`).catch(() => null),
        api.get(`/learning_path/${lp.id_learning_path}?lang=es`).catch(() => null)
      ]);

      const tPt = lpPt?.data?.data?.learning_path || initialTitle;
      const tEn = lpEn?.data?.data?.learning_path || initialTitle;
      const tEs = lpEs?.data?.data?.learning_path || initialTitle;

      const dPt = lpPt?.data?.data?.descricao || initialDesc;
      const dEn = lpEn?.data?.data?.descricao || initialDesc;
      const dEs = lpEs?.data?.data?.descricao || initialDesc;

      setManualTitleEditLP({ pt: tPt, en: tEn, es: tEs });
      setManualDescEditLP({ pt: dPt, en: dEn, es: dEs });
    } catch (err) {
      console.error('Erro ao buscar traduções multi-idioma:', err);
    }
  };
  return (
    <div className="d-flex flex-column gap-4">
      {/* Header & Toolbar */}
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-3">
        <h3 className="mb-0 fw-bold">{t('titleGestaoLP')}</h3>
        
        <div className="d-flex gap-2 align-items-center flex-wrap">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder={t('searchPlaceholderLP')}
            style={{ minWidth: '250px' }}
          />
          {Number(activeRole) === ROLE.ADMIN && (
            <>
              <button className="btn btn-primary rounded-pill d-flex align-items-center gap-2 shadow-sm" onClick={() => setShowModalLP(true)}>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                Learning Path
              </button>
              <button className="btn btn-dark rounded-pill d-flex align-items-center gap-2 shadow-sm" onClick={() => handleOpenCreateSL()}>
                <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                {t('serviceLine')}
              </button>
            </>
          )}
          <button className="btn btn-success rounded-pill d-flex align-items-center gap-2 shadow-sm" onClick={handleOpenCreateArea}>
            <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            {t('areaLabel')}
          </button>
          <select
            className="form-select form-select-sm rounded-pill px-3 shadow-sm fw-semibold cursor-pointer"
            style={{ 
              minWidth: '170px', 
              backgroundColor: 'var(--panel)', 
              color: 'var(--text)', 
              borderColor: 'var(--sidebar-border)' 
            }}
            value={selectedSllFilter}
            onChange={(e) => setSelectedSllFilter(e.target.value)}
          >
            <option value="">{t('filterBySll', 'Filtrar por SLL')}</option>
            {sllList.map(sll => (
              <option key={sll.id_utilizador} value={sll.id_utilizador}>
                {sll.nome} {sll.apelido}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status"><span className="visually-hidden">A carregar...</span></div>
        </div>
      ) : (
        <div className="d-flex flex-column gap-5">
          {filteredData.learningPaths.map(lp => {
            const slsForLp = filteredData.serviceLines.filter(sl => sl.id_learning_path === lp.id_learning_path);
            const lpColor = lp.cor || '--color1-LP';
            const isLpOpen = !!openLPs[lp.id_learning_path];

            return (
              <div key={lp.id_learning_path} className="learning-path-section card p-3 rounded-4 shadow-sm border-0" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                
                {/* LP Header - Clicável para abrir o acordeão */}
                <div 
                  className="d-flex align-items-center cursor-pointer rounded px-2 py-1 hover-bg-opacity" 
                  onClick={() => toggleLP(lp.id_learning_path)}
                  style={{ transition: 'background-color 0.2s ease' }}
                  title={isLpOpen ? "Clique para recolher" : "Clique para expandir"}
                >
                  <div 
                    className="rounded shadow-sm me-3 d-flex align-items-center justify-content-center" 
                    style={{ width: '40px', height: '40px', backgroundColor: `var(${lpColor}, #1E293B)`, flexShrink: 0 }}
                  ></div>
                  
                  <div className="d-flex flex-column">
                    <div className="d-flex align-items-center flex-wrap gap-2">
                      <h4 className="mb-0 fw-bold" style={{ color: `var(${lpColor}, #1E293B)`, fontSize: '1.2rem' }}>
                        {lp.learning_path}
                      </h4>
                      {lp.suspenso && (
                        <span className="badge bg-danger rounded-pill px-2 py-1 text-uppercase font-monospace" style={{ fontSize: '0.65rem' }}>
                          {t('statusSuspended')}
                        </span>
                      )}
                      {!lp.visibilidade && (
                        <span className="badge bg-secondary rounded-pill px-2 py-1 text-uppercase font-monospace text-white" style={{ fontSize: '0.65rem' }}>
                          {t('visibilityHidden')}
                        </span>
                      )}
                    </div>
                    {lp.descricao_lp && (
                      <p className="mb-0 small mt-1 max-lines-2" style={{ color: 'var(--text-muted)' }}>{lp.descricao_lp}</p>
                    )}
                  </div>

                  <div className="ms-auto d-flex align-items-center gap-3">
                    {Number(activeRole) === ROLE.ADMIN && (
                      <>
                        <button 
                          className="btn btn-sm btn-outline-secondary rounded-pill px-3" 
                          onClick={(e) => { e.stopPropagation(); startEditing(lp); }}
                        >
                          {t('editBtn', 'Editar')}
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger rounded-pill px-3 text-danger" 
                          onClick={(e) => { e.stopPropagation(); handleDeleteLP(lp); }}
                        >
                          {t('deleteBtn', 'Eliminar')}
                        </button>
                      </>
                    )}
                    <svg 
                      viewBox="0 0 24 24" 
                      width="20" 
                      height="20" 
                      stroke="currentColor" 
                      strokeWidth="2.5" 
                      fill="none" 
                      style={{ 
                        transform: isLpOpen ? 'rotate(180deg)' : 'none', 
                        transition: 'transform 0.2s ease', 
                        color: 'var(--text-muted)' 
                      }}
                    >
                      <polyline points="6 9 12 15 18 9"></polyline>
                    </svg>
                  </div>
                </div>

                {/* Service Lines (Acordeão Filho) */}
                {isLpOpen && (
                  <div className="mt-3 pt-3 border-top">
                    {slsForLp.length === 0 ? (
                      <p className="text-muted fst-italic ms-3 mb-0">{t('noServiceLines')}</p>
                    ) : (
                      <div className="d-flex flex-column gap-3 ms-2 ps-3" style={{ borderLeft: `3.5px solid var(${lpColor}, var(--sidebar-border))` }}>
                        {slsForLp.map(sl => {
                          const areasForSl = filteredData.areas.filter(a => a.id_service_line === sl.id_service_line);
                          const isSlOpen = !!openSLs[sl.id_service_line];
                          
                          return (
                            <div key={sl.id_service_line} className="service-line-group">
                              
                              {/* Sub-acordeão Header (Service Line Trigger) */}
                              <div 
                                className="d-flex align-items-center justify-content-between cursor-pointer p-2 rounded hover-bg-opacity"
                                onClick={() => toggleSL(sl.id_service_line)}
                                style={{ transition: 'background-color 0.2s ease', backgroundColor: 'var(--panel-2)', border: '1px solid var(--sidebar-border)' }}
                                title={isSlOpen ? "Clique para fechar áreas" : "Clique para ver áreas"}
                              >
                                <h6 className="fw-normal mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                  {t('serviceLine')}: <strong className="fw-bold" style={{ color: 'var(--text)' }}>{sl.service_line}</strong>
                                </h6>
                                <div className="d-flex align-items-center gap-2">
                                  {Number(activeRole) === ROLE.ADMIN && (
                                    <>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary rounded-pill px-2 py-0 border-0 me-1"
                                        style={{ fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'rgba(100, 116, 139, 0.1)' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenEditSL(sl);
                                        }}
                                        title={t('editBtn', 'Editar')}
                                      >
                                        ✏️ {t('editBtn', 'Editar')}
                                      </button>
                                      <button
                                        type="button"
                                        className="btn btn-sm btn-outline-danger rounded-pill px-2 py-0 border-0 me-1 text-danger"
                                        style={{ fontSize: '0.72rem', fontWeight: 600, backgroundColor: 'rgba(220, 38, 38, 0.1)' }}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleDeleteSL(sl.id_service_line);
                                        }}
                                        title={t('deleteBtn', 'Eliminar')}
                                      >
                                        🗑️ {t('deleteBtn', 'Eliminar')}
                                      </button>
                                    </>
                                  )}
                                  <span className="badge bg-primary bg-opacity-10 text-primary small rounded-pill px-2 py-1" style={{ fontSize: '0.7rem' }}>
                                    {areasForSl.length} {t('areaLabel')}
                                  </span>
                                  <svg 
                                    viewBox="0 0 24 24" 
                                    width="16" 
                                    height="16" 
                                    stroke="currentColor" 
                                    strokeWidth="2.5" 
                                    fill="none"
                                    style={{ 
                                      transform: isSlOpen ? 'rotate(180deg)' : 'none', 
                                      transition: 'transform 0.2s ease', 
                                      color: 'var(--text-muted)' 
                                    }}
                                  >
                                    <polyline points="6 9 12 15 18 9"></polyline>
                                  </svg>
                                </div>
                              </div>
                              
                              {/* Áreas (Cards) - Mostrados de forma identada ao expandir */}
                              {isSlOpen && (
                                <div className="mt-3 ms-4">
                                  {areasForSl.length === 0 ? (
                                    <p className="text-muted fst-italic small mb-0">{t('noAreas')}</p>
                                  ) : (
                                    <div className="row g-3">
                                      {areasForSl.map(area => (
                                        <div className="col-12 col-md-6 col-lg-4 col-xl-3" key={area.id_area}>
                                          <div className="card h-100 shadow-sm rounded-4" style={{ overflow: 'hidden', backgroundColor: 'var(--area-card-bg)', border: '1px solid var(--sidebar-border)' }}>
                                            <div className="card-body p-3 position-relative">
                                              <h6 className="fw-bold mb-2 pe-4" style={{ color: 'var(--text)', fontSize: '0.85rem' }}>{area.area}</h6>
                                              <p className="small mb-0" style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                                                {t('responsible')}: <strong className="fw-bold" style={{ color: 'var(--text)' }}>{area.nome_sll || sl.nome_sll || 'N/A'}</strong>
                                              </p>
                                            </div>
                                            <div className="card-footer border-0 px-3 py-2 d-flex justify-content-between align-items-center gap-1" style={{ backgroundColor: 'var(--area-card-footer-bg)', borderTop: '1px solid var(--sidebar-border)' }}>
                                              <span className={`badge rounded-pill px-2 py-1 ${area.areaAtiva ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`} style={{ fontSize: '0.65rem' }}>
                                                {area.areaAtiva ? t('statusActive') : t('statusInactive')}
                                              </span>
                                              <div className="d-flex align-items-center gap-1">
                                                <button
                                                  type="button"
                                                  className="btn btn-sm btn-outline-primary rounded-3 px-2 py-0"
                                                  style={{ fontSize: '0.72rem', fontWeight: 600 }}
                                                  onClick={() => handleOpenLevelsModal(area)}
                                                  title={t('levelsBtn', 'Níveis')}
                                                >
                                                  🎯 {t('levelsBtn', 'Níveis')}
                                                </button>
                                                <button
                                                  type="button"
                                                  className="btn btn-sm rounded-3 px-2 py-0 border-0"
                                                  style={{ 
                                                    fontSize: '0.72rem', 
                                                    fontWeight: 600,
                                                    backgroundColor: 'var(--panel-secondary, rgba(100, 116, 139, 0.15))',
                                                    color: 'var(--text)'
                                                  }}
                                                  onClick={() => handleOpenEditArea(area)}
                                                  title={t('editBtn', 'Editar')}
                                                >
                                                  ✏️ {t('editBtn', 'Editar')}
                                                </button>
                                                {Number(activeRole) === ROLE.ADMIN && (
                                                  <button
                                                    type="button"
                                                    className="btn btn-sm rounded-3 px-2 py-0 border-0 text-danger"
                                                    style={{ 
                                                      fontSize: '0.72rem', 
                                                      fontWeight: 600,
                                                      backgroundColor: 'rgba(220, 38, 38, 0.15)'
                                                    }}
                                                    onClick={() => handleDeleteArea(area.id_area)}
                                                    title={t('deleteBtn', 'Eliminar')}
                                                  >
                                                    🗑️ {t('deleteBtn', 'Eliminar')}
                                                  </button>
                                                )}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          {filteredData.learningPaths.length === 0 && (
            <div className="text-center py-5 text-muted">Nenhum Learning Path encontrado.</div>
          )}
        </div>
      )}

      {showModalLP && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }} onClick={() => setShowModalLP(false)}></div>
          <div className="position-fixed top-50 start-50 translate-middle bg-panel rounded-4 shadow-lg" style={{ zIndex: 1050, width: '100%', maxWidth: '500px', backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
            <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)' }}>{t('createLP')}</h5>
                <ManualTranslationSwitch
                  checked={isManualTranslationLP}
                  onChange={(val) => handleToggleManualTranslationLP(val)}
                  disabled={submitting}
                  id="manualTranslateLPCreateSwitch"
                />
            </div>
            <div className="p-4">
              <form onSubmit={handleCreateLP}>
                <div className="mb-3">
                  <label className="form-label fw-bold small" style={{ color: 'var(--text)' }}>{t('titleForm')} *</label>
                  {!isManualTranslationLP ? (
                    <input type="text" className="form-control" required value={formDataLP.titulo} onChange={e => setFormDataLP({...formDataLP, titulo: e.target.value})} />
                  ) : (
                    <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇵🇹 PT</span>
                        <input type="text" className="form-control" placeholder="Título em Português" value={manualTitleLP.pt} onChange={(e) => setManualTitleLP(prev => ({ ...prev, pt: e.target.value }))} disabled={submitting} />
                      </div>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇬🇧 EN</span>
                        <input type="text" className="form-control" placeholder="Title in English" value={manualTitleLP.en} onChange={(e) => setManualTitleLP(prev => ({ ...prev, en: e.target.value }))} disabled={submitting} />
                      </div>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇪🇸 ES</span>
                        <input type="text" className="form-control" placeholder="Título en Español" value={manualTitleLP.es} onChange={(e) => setManualTitleLP(prev => ({ ...prev, es: e.target.value }))} disabled={submitting} />
                      </div>
                    </div>
                  )}
                </div>
                <div className="mb-3">
                  <label className="form-label fw-bold small" style={{ color: 'var(--text)' }}>{t('descForm')} *</label>
                  {!isManualTranslationLP ? (
                    <textarea className="form-control" rows="3" required value={formDataLP.descricao} onChange={e => setFormDataLP({...formDataLP, descricao: e.target.value})}></textarea>
                  ) : (
                    <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇵🇹 PT</span>
                        <textarea className="form-control" rows="2" placeholder="Descrição em Português" value={manualDescLP.pt} onChange={(e) => setManualDescLP(prev => ({ ...prev, pt: e.target.value }))} disabled={submitting}></textarea>
                      </div>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇬🇧 EN</span>
                        <textarea className="form-control" rows="2" placeholder="Description in English" value={manualDescLP.en} onChange={(e) => setManualDescLP(prev => ({ ...prev, en: e.target.value }))} disabled={submitting}></textarea>
                      </div>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇪🇸 ES</span>
                        <textarea className="form-control" rows="2" placeholder="Descripción en Español" value={manualDescLP.es} onChange={(e) => setManualDescLP(prev => ({ ...prev, es: e.target.value }))} disabled={submitting}></textarea>
                      </div>
                    </div>
                  )}
                </div>
                <div className="mb-4">
                  <label className="form-label fw-bold small" style={{ color: 'var(--text)' }}>{t('colorForm')} *</label>
                  <div className="d-flex align-items-center gap-3 mb-2">
                    {/* Selected color preview block */}
                    <div 
                      className="rounded-3 px-3 py-2 fw-bold text-center border shadow-sm d-flex align-items-center justify-content-center"
                      style={{ 
                        backgroundColor: `var(${formDataLP.cor})`,
                        color: (formDataLP.cor === '--color1-LP' || formDataLP.cor === '--color15-LP') ? '#000000' : '#ffffff',
                        minWidth: '90px',
                        height: '38px',
                        fontSize: '0.85rem',
                        transition: 'background-color 0.25s ease',
                        borderColor: 'rgba(0,0,0,0.1)'
                      }}
                    >
                      {t('colorLabel', 'COR')}
                    </div>
                    {/* Color selection dots */}
                    <div className="d-flex flex-wrap gap-2 flex-grow-1">
                      {colorOptions.map(cor => (
                        <div 
                          key={cor}
                          onClick={() => setFormDataLP({...formDataLP, cor})}
                          className={`rounded-circle cursor-pointer ${formDataLP.cor === cor ? 'border border-2 border-primary shadow' : 'border border-light'}`}
                          style={{ 
                            width: '26px', height: '26px', 
                            backgroundColor: `var(${cor}, #ccc)`,
                            transition: 'all 0.2s ease',
                            transform: formDataLP.cor === cor ? 'scale(1.15)' : 'scale(1)'
                          }}
                          title={cor}
                        ></div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light" onClick={() => setShowModalLP(false)}>{t('cancelBtn')}</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? t('saving') : t('createLP')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}
      {showModalSL && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }} onClick={() => setShowModalSL(false)}></div>
          <div className="position-fixed top-50 start-50 translate-middle bg-panel rounded-4 shadow-lg" style={{ zIndex: 1070, width: '100%', maxWidth: '500px', backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
            <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)' }}>
                {isEditModeSL ? t('editSLTitle', 'Editar Service Line') : t('createSLTitle')}
              </h5>
              <div className="d-flex align-items-center gap-3">
                <ManualTranslationSwitch
                  checked={isManualTranslationSL}
                  onChange={(val) => handleToggleManualTranslationSL(val)}
                  disabled={submitting}
                  id="manualTranslateSLSwitch"
                />
                <button className="btn-close" style={{ filter: 'var(--close-button-filter)' }} onClick={() => setShowModalSL(false)}></button>
              </div>
            </div>
            <div className="p-4">
              <form onSubmit={handleSaveSL}>
                {/* Title */}
                <div className="mb-3">
                  <label className="form-label fw-bold small" style={{ color: 'var(--text)' }}>{t('serviceLineTitleLabel')}</label>
                  {!isManualTranslationSL ? (
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={formDataSL.titulo} 
                      onChange={e => setFormDataSL({...formDataSL, titulo: e.target.value})} 
                    />
                  ) : (
                    <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇵🇹 PT</span>
                        <input type="text" className="form-control" placeholder="Título em Português" value={manualTitleSL.pt} onChange={(e) => setManualTitleSL(prev => ({ ...prev, pt: e.target.value }))} disabled={submitting} />
                      </div>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇬🇧 EN</span>
                        <input type="text" className="form-control" placeholder="Title in English" value={manualTitleSL.en} onChange={(e) => setManualTitleSL(prev => ({ ...prev, en: e.target.value }))} disabled={submitting} />
                      </div>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇪🇸 ES</span>
                        <input type="text" className="form-control" placeholder="Título en Español" value={manualTitleSL.es} onChange={(e) => setManualTitleSL(prev => ({ ...prev, es: e.target.value }))} disabled={submitting} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Learning Path selection */}
                <div className="mb-3">
                  <label className="form-label fw-bold small" style={{ color: 'var(--text)' }}>{t('associatedLearningPathLabel')}</label>
                  <select 
                    className="form-select" 
                    required 
                    value={formDataSL.id_learning_path} 
                    onChange={e => setFormDataSL({...formDataSL, id_learning_path: e.target.value})}
                  >
                    <option value="" disabled>{t('selectLearningPathOption')}</option>
                    {learningPaths.filter(lp => lp.lpAtivo).map(lp => (
                      <option key={lp.id_learning_path} value={lp.id_learning_path}>{lp.learning_path}</option>
                    ))}
                  </select>
                </div>

                {/* SLL Leader selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold small" style={{ color: 'var(--text)' }}>{t('responsibleLeaderLabel')}</label>
                  <select 
                    className="form-select" 
                    value={formDataSL.id_sl_lider} 
                    onChange={e => setFormDataSL({...formDataSL, id_sl_lider: e.target.value})}
                  >
                    <option value="">{t('noLeaderOption')}</option>
                    {sllList.map(user => (
                      <option key={user.id_utilizador} value={user.id_utilizador}>
                        {user.nome} {user.apelido}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light" onClick={() => setShowModalSL(false)}>{t('cancelBtn')}</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? t('saving') : (isEditModeSL ? t('saveBtn', 'Guardar') : t('createSLBtn'))}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {showModalArea && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }} onClick={() => setShowModalArea(false)}></div>
          <div className="position-fixed top-50 start-50 translate-middle bg-panel rounded-4 shadow-lg" style={{ zIndex: 1050, width: '100%', maxWidth: '500px', backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)' }}>{t('createAreaTitle')}</h5>
              <div className="d-flex align-items-center gap-3">
                <ManualTranslationSwitch
                  checked={isManualTranslationArea}
                  onChange={(val) => handleToggleManualTranslationArea(val)}
                  disabled={submitting}
                  id="manualTranslateAreaSwitch"
                />
                <button className="btn-close" style={{ filter: 'var(--close-button-filter)' }} onClick={() => setShowModalArea(false)}></button>
              </div>
            </div>
            <div className="p-4">
              <form onSubmit={handleCreateArea}>
                {/* Title */}
                <div className="mb-3">
                  <label className="form-label fw-bold small" style={{ color: 'var(--text)' }}>{t('areaTitleLabel')}</label>
                  {!isManualTranslationArea ? (
                    <input 
                      type="text" 
                      className="form-control" 
                      required 
                      value={formDataArea.titulo} 
                      onChange={e => setFormDataArea({...formDataArea, titulo: e.target.value})} 
                    />
                  ) : (
                    <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇵🇹 PT</span>
                        <input type="text" className="form-control" placeholder="Título em Português" value={manualTitleArea.pt} onChange={(e) => setManualTitleArea(prev => ({ ...prev, pt: e.target.value }))} disabled={submitting} />
                      </div>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇬🇧 EN</span>
                        <input type="text" className="form-control" placeholder="Title in English" value={manualTitleArea.en} onChange={(e) => setManualTitleArea(prev => ({ ...prev, en: e.target.value }))} disabled={submitting} />
                      </div>
                      <div className="input-group input-group-sm">
                        <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇪🇸 ES</span>
                        <input type="text" className="form-control" placeholder="Título en Español" value={manualTitleArea.es} onChange={(e) => setManualTitleArea(prev => ({ ...prev, es: e.target.value }))} disabled={submitting} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Dropdown 1: Learning Path filter */}
                <div className="mb-3">
                  <label className="form-label fw-bold small" style={{ color: 'var(--text)' }}>{t('filterByLPLabel')}</label>
                  <select 
                    className="form-select" 
                    value={formDataArea.id_learning_path} 
                    onChange={e => handleLpChangeInAreaModal(e.target.value)}
                  >
                    <option value="">{t('allLearningPathsOption')}</option>
                    {learningPaths.filter(lp => lp.lpAtivo).map(lp => (
                      <option key={lp.id_learning_path} value={lp.id_learning_path}>{lp.learning_path}</option>
                    ))}
                  </select>
                </div>

                {/* Dropdown 2: Service Line selection */}
                <div className="mb-3">
                  <label className="form-label fw-bold small" style={{ color: 'var(--text)' }}>{t('serviceLine')} *</label>
                  <select 
                    className="form-select" 
                    required 
                    value={formDataArea.id_service_line} 
                    onChange={e => handleSlChangeInAreaModal(e.target.value)}
                  >
                    <option value="" disabled>{t('selectServiceLineOption')}</option>
                    {filteredServiceLinesInModal.map(sl => (
                      <option key={sl.id_service_line} value={sl.id_service_line}>{sl.service_line}</option>
                    ))}
                  </select>
                </div>

                {/* Textbox leader (Read-only) */}
                <div className="mb-4">
                  <label className="form-label fw-bold small" style={{ color: 'var(--text)' }}>{t('responsibleLeaderLabel')}</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    readOnly 
                    value={formDataArea.liderName} 
                    style={{ backgroundColor: 'var(--panel-2)', color: 'var(--text-muted)' }} 
                    placeholder="Selecione uma Service Line para ver o responsável"
                  />
                </div>

                {/* Actions */}
                <div className="d-flex justify-content-end gap-2">
                  <button type="button" className="btn btn-light" onClick={() => setShowModalArea(false)}>{t('cancelBtn')}</button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? t('saving') : t('createAreaBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </>
      )}

      {/* Modal Editar Learning Path (Popup Focado de Alta Fidelidade) */}
      {showModalEditLP && editingLP && (
        <>
          <div className="position-fixed top-0 start-0 w-100 h-100" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1040 }} onClick={() => setShowModalEditLP(false)}></div>
          <div className="position-fixed top-50 start-50 translate-middle bg-panel rounded-4 shadow-lg d-flex flex-column" 
               style={{ 
                 zIndex: 1050, 
                 width: '95%', 
                 maxWidth: '900px', 
                 backgroundColor: 'var(--panel)', 
                 maxHeight: '90vh', 
                 overflow: 'hidden',
                 border: '1px solid var(--sidebar-border)'
               }}>
            
            {/* Header */}
            <div className="p-4 border-bottom d-flex justify-content-between align-items-center flex-shrink-0">
              <h5 className="mb-0 fw-bold d-flex align-items-center gap-2" style={{ color: 'var(--text)' }}>
                <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                {t('editLPTitle')}
              </h5>
              <button className="btn-close" style={{ filter: 'var(--close-button-filter)' }} onClick={() => setShowModalEditLP(false)}></button>
            </div>
            
            {/* Body (Scrollable) */}
            <div className="p-4 overflow-auto flex-grow-1" style={{ backgroundColor: 'var(--panel-2)' }}>
              
              {/* Card 1: Definições da Learning Path */}
              <div className="card shadow-sm rounded-4 border-0 p-4 mb-4" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                  <div className="d-flex align-items-center gap-3">
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>{t('settingsLP')}</h6>
                    <ManualTranslationSwitch
                      checked={isManualTranslationEditLP}
                      onChange={(val) => handleToggleManualTranslationEditLP(val)}
                      disabled={submitting}
                      id="manualTranslateLPEditSwitch"
                    />
                  </div>
                  <button 
                    type="button"
                    className="btn btn-danger btn-sm rounded-pill px-3 d-flex align-items-center gap-2 shadow-sm"
                    onClick={() => handleDeleteLP(editingLP)}
                    style={{ backgroundColor: '#d33', borderColor: '#d33' }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    {t('deleteBtn')}
                  </button>
                </div>
                
                <form onSubmit={handleUpdateLP}>
                  <div className="row g-3">
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small mb-1" style={{ color: 'var(--text)' }}>{t('nameLP')} *</label>
                      {!isManualTranslationEditLP ? (
                        <input 
                          type="text" 
                          className="form-control rounded-pill" 
                          required 
                          value={editFormData.titulo} 
                          onChange={e => setEditFormData({...editFormData, titulo: e.target.value})} 
                        />
                      ) : (
                        <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇵🇹 PT</span>
                            <input type="text" className="form-control" placeholder="Título em Português" value={manualTitleEditLP.pt} onChange={(e) => setManualTitleEditLP(prev => ({ ...prev, pt: e.target.value }))} disabled={submitting} />
                          </div>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇬🇧 EN</span>
                            <input type="text" className="form-control" placeholder="Title in English" value={manualTitleEditLP.en} onChange={(e) => setManualTitleEditLP(prev => ({ ...prev, en: e.target.value }))} disabled={submitting} />
                          </div>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇪🇸 ES</span>
                            <input type="text" className="form-control" placeholder="Título en Español" value={manualTitleEditLP.es} onChange={(e) => setManualTitleEditLP(prev => ({ ...prev, es: e.target.value }))} disabled={submitting} />
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="col-12 col-md-6">
                      <label className="form-label fw-bold small mb-1" style={{ color: 'var(--text)' }}>{t('highlightColor')} *</label>
                      <div className="d-flex align-items-center gap-3 mt-1">
                        {/* Selected color preview block */}
                        <div 
                          className="rounded-3 px-3 py-1 fw-bold text-center border shadow-sm d-flex align-items-center justify-content-center"
                          style={{ 
                            backgroundColor: `var(${editFormData.cor})`,
                            color: (editFormData.cor === '--color1-LP' || editFormData.cor === '--color15-LP') ? '#000000' : '#ffffff',
                            minWidth: '80px',
                            height: '32px',
                            fontSize: '0.8rem',
                            transition: 'background-color 0.25s ease',
                            borderColor: 'rgba(0,0,0,0.1)'
                          }}
                        >
                          {t('colorLabel', 'COR')}
                        </div>
                        {/* Color selection dots */}
                        <div className="d-flex flex-wrap gap-1 align-items-center flex-grow-1">
                          {colorOptions.map(cor => (
                            <div 
                              key={cor}
                              onClick={() => setEditFormData({...editFormData, cor})}
                              className={`rounded-circle cursor-pointer ${editFormData.cor === cor ? 'border border-2 border-primary shadow' : 'border border-light'}`}
                              style={{ 
                                width: '22px', height: '22px', 
                                backgroundColor: `var(${cor}, #ccc)`,
                                transition: 'all 0.2s ease',
                                transform: editFormData.cor === cor ? 'scale(1.15)' : 'scale(1)'
                              }}
                              title={cor}
                            ></div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="col-12">
                      <label className="form-label fw-bold small mb-1" style={{ color: 'var(--text)' }}>{t('descForm')} *</label>
                      {!isManualTranslationEditLP ? (
                        <textarea 
                          className="form-control rounded-4" 
                          rows="2" 
                          required 
                          value={editFormData.descricao} 
                          onChange={e => setEditFormData({...editFormData, descricao: e.target.value})} 
                        />
                      ) : (
                        <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇵🇹 PT</span>
                            <textarea className="form-control" rows="2" placeholder="Descrição em Português" value={manualDescEditLP.pt} onChange={(e) => setManualDescEditLP(prev => ({ ...prev, pt: e.target.value }))} disabled={submitting}></textarea>
                          </div>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇬🇧 EN</span>
                            <textarea className="form-control" rows="2" placeholder="Description in English" value={manualDescEditLP.en} onChange={(e) => setManualDescEditLP(prev => ({ ...prev, en: e.target.value }))} disabled={submitting}></textarea>
                          </div>
                          <div className="input-group input-group-sm">
                            <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇪🇸 ES</span>
                            <textarea className="form-control" rows="2" placeholder="Descripción en Español" value={manualDescEditLP.es} onChange={(e) => setManualDescEditLP(prev => ({ ...prev, es: e.target.value }))} disabled={submitting}></textarea>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </form>
              </div>

              {/* Card 2: Service Lines Associadas */}
              <div className="card shadow-sm rounded-4 border-0 p-4" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
                  <div>
                    <h6 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>{t('associatedServiceLines')}</h6>
                    <span className="small" style={{ color: 'var(--text-muted)' }}>{t('manageAssociatedSLs')}</span>
                  </div>
                  <div className="d-flex gap-2 align-items-center">
                    <input 
                      type="text" 
                      className="form-control form-control-sm rounded-pill" 
                      placeholder={t('searchShort')} 
                      value={slSearchQuery}
                      onChange={e => setSlSearchQuery(e.target.value)}
                      style={{ maxWidth: '150px' }}
                    />
                    <button className="btn btn-outline-primary btn-sm rounded-pill px-3 d-flex align-items-center gap-1" onClick={() => handleOpenCreateSL(editingLP.id_learning_path)}>
                      {t('addSL')}
                    </button>
                  </div>
                </div>

                <div className="table-responsive rounded-3 border overflow-hidden" style={{ borderColor: 'var(--sidebar-border)', backgroundColor: 'var(--panel-2)' }}>
                  <table className="table table-borderless align-middle mb-0" style={{ color: 'var(--text)', backgroundColor: 'transparent', '--bs-table-bg': 'transparent' }}>
                    <thead>
                      <tr className="border-bottom small text-uppercase" style={{ fontSize: '0.725rem', borderColor: 'var(--sidebar-border)' }}>
                        <th className="pb-2 border-0 ps-3" style={{ color: 'var(--text-muted)' }}>{t('serviceLine')}</th>
                        <th className="pb-2 border-0" style={{ color: 'var(--text-muted)' }}>{t('visibility')}</th>
                        <th className="pb-2 border-0" style={{ color: 'var(--text-muted)' }}>{t('colStatus')}</th>
                        <th className="pb-2 border-0 text-end pe-3" style={{ color: 'var(--text-muted)' }}>{t('colActions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const filteredSLs = associatedSLs.filter(sl => 
                          sl.service_line?.toLowerCase().includes(slSearchQuery.toLowerCase())
                        );
                        if (filteredSLs.length === 0) {
                          return (
                            <tr>
                              <td colSpan="4" className="text-center py-4 fst-italic border-0" style={{ color: 'var(--text-muted)' }}>
                                {t('noServiceLines')}
                              </td>
                            </tr>
                          );
                        }
                        return filteredSLs.map(sl => {
                          const initials = sl.service_line ? sl.service_line.substring(0, 2).toUpperCase() : 'SL';
                          return (
                            <tr key={sl.id_service_line} style={{ borderColor: 'var(--sidebar-border)' }}>
                              <td className="py-3 border-0 ps-3">
                                <div className="d-flex align-items-center gap-3">
                                  <div className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-primary shadow-sm" 
                                       style={{ 
                                         width: '38px', 
                                         height: '38px', 
                                         backgroundColor: 'var(--primary-light)', 
                                         fontSize: '0.825rem',
                                         border: '1px solid var(--sidebar-border)'
                                       }}>
                                    {initials}
                                  </div>
                                  <div>
                                    <span className="fw-bold d-block" style={{ color: 'var(--text)' }}>{sl.service_line}</span>
                                    <span className="small" style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>{`4 ${t('associatedProfiles')}`}</span>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 border-0">
                                <div className="d-flex align-items-center gap-2">
                                  <span className={`small fw-semibold ${sl.visibilidade ? 'text-success' : ''}`} style={{ color: sl.visibilidade ? '' : 'var(--text-muted)' }}>
                                    {sl.visibilidade ? t('statusVisible') : t('statusHidden')}
                                  </span>
                                  <div className="form-check form-switch mb-0">
                                    <input 
                                      className="form-check-input cursor-pointer" 
                                      type="checkbox" 
                                      checked={sl.visibilidade}
                                      onChange={() => {
                                        setAssociatedSLs(prev => prev.map(item => 
                                          item.id_service_line === sl.id_service_line ? { ...item, visibilidade: !item.visibilidade } : item
                                        ));
                                      }}
                                    />
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 border-0">
                                <button 
                                  type="button"
                                  className={`btn btn-sm rounded-pill px-3 py-1 fw-bold ${sl.suspenso ? 'btn-danger' : 'btn-outline-danger'}`}
                                  style={{ fontSize: '0.725rem', minWidth: '85px' }}
                                  onClick={() => {
                                    setAssociatedSLs(prev => prev.map(item => 
                                      item.id_service_line === sl.id_service_line ? { ...item, suspenso: !item.suspenso } : item
                                    ));
                                  }}
                                >
                                  {sl.suspenso ? t('statusReactivate') : t('statusSuspend')}
                                </button>
                              </td>
                                <div className="d-flex align-items-center justify-content-end gap-2">
                                  <button
                                    type="button"
                                    className="btn btn-link text-primary p-0"
                                    onClick={() => handleOpenEditSL(sl)}
                                    title={t('editBtn', 'Editar')}
                                  >
                                    ✏️
                                  </button>
                                  <button 
                                    type="button"
                                    className="btn btn-link text-danger p-0"
                                    onClick={() => {
                                      Swal.fire({
                                        title: 'Confirmação',
                                        text: 'Tem a certeza de que deseja desassociar esta Service Line?',
                                        icon: 'warning',
                                        showCancelButton: true,
                                        confirmButtonColor: '#d33',
                                        confirmButtonText: 'Eliminar',
                                        cancelButtonText: 'Cancelar'
                                      }).then(result => {
                                        if (result.isConfirmed) {
                                          setAssociatedSLs(prev => prev.filter(item => item.id_service_line !== sl.id_service_line));
                                          Swal.fire('Sucesso', 'Service Line desassociada.', 'success');
                                        }
                                      });
                                    }}
                                  >
                                    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                  </button>
                                </div>
                            </tr>
                          );
                        });
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-top d-flex justify-content-end align-items-center gap-3 flex-shrink-0" style={{ backgroundColor: 'var(--panel)' }}>
              <button type="button" className="btn btn-link text-decoration-none" style={{ color: 'var(--text-muted)' }} onClick={() => setShowModalEditLP(false)}>
                {t('cancelBtn')}
              </button>
              <button 
                type="button" 
                className="btn btn-success rounded-pill px-4 py-2 fw-bold shadow-sm text-white" 
                style={{ backgroundColor: '#00C853', borderColor: '#00C853' }}
                onClick={handleUpdateLP}
                disabled={submitting}
              >
                {submitting ? t('saving') : t('saveBtn')}
              </button>
            </div>
            
          </div>
        </>
      )}

      {/* Modal: Editar Área */}
      {showModalEditArea && editingArea && (
        <>
          <div className="users-modal-overlay" onClick={() => setShowModalEditArea(false)} />
          <div className="users-modal" style={{ maxWidth: '520px', width: '90%' }}>
            <div className="users-modal-header d-flex justify-content-between align-items-center">
              <h5>{t('editAreaTitle', 'Editar Área')}</h5>
              <div className="d-flex align-items-center gap-3">
                <ManualTranslationSwitch
                  checked={isManualTranslationEditArea}
                  onChange={(val) => handleToggleManualTranslationEditArea(val)}
                  disabled={submitting}
                  id="manualTranslateEditAreaSwitch"
                />
                <button className="users-modal-close" onClick={() => setShowModalEditArea(false)}>
                  <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSaveEditArea} style={{ padding: '24px' }}>
              <div className="mb-3">
                <label className="form-label small fw-semibold">{t('areaTitleLabel', 'Título da Área *')}</label>
                {!isManualTranslationEditArea ? (
                  <input
                    type="text"
                    className="form-control rounded-3"
                    value={editFormDataArea.titulo}
                    onChange={(e) => setEditFormDataArea({ ...editFormDataArea, titulo: e.target.value })}
                    required
                  />
                ) : (
                  <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇵🇹 PT</span>
                      <input type="text" className="form-control" placeholder="Título em Português" value={manualTitleEditArea.pt} onChange={(e) => setManualTitleEditArea(prev => ({ ...prev, pt: e.target.value }))} disabled={submitting} />
                    </div>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇬🇧 EN</span>
                      <input type="text" className="form-control" placeholder="Title in English" value={manualTitleEditArea.en} onChange={(e) => setManualTitleEditArea(prev => ({ ...prev, en: e.target.value }))} disabled={submitting} />
                    </div>
                    <div className="input-group input-group-sm">
                      <span className="input-group-text fw-bold" style={{ width: '65px' }}>🇪🇸 ES</span>
                      <input type="text" className="form-control" placeholder="Título en Español" value={manualTitleEditArea.es} onChange={(e) => setManualTitleEditArea(prev => ({ ...prev, es: e.target.value }))} disabled={submitting} />
                    </div>
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label small fw-semibold">{t('serviceLine', 'Service Line *')}</label>
                <select
                  className="form-select rounded-3"
                  value={editFormDataArea.id_service_line}
                  onChange={(e) => setEditFormDataArea({ ...editFormDataArea, id_service_line: e.target.value })}
                  required
                >
                  <option value="">{t('selectServiceLineOption', 'Selecione uma Service Line')}</option>
                  {serviceLines.map(sl => (
                    <option key={sl.id_service_line} value={sl.id_service_line}>
                      {sl.service_line}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 d-flex align-items-center justify-content-between p-3 rounded-3 border" style={{ backgroundColor: 'var(--panel-2, rgba(0,0,0,0.03))', borderColor: 'var(--sidebar-border)' }}>
                <div>
                  <strong className="d-block small mb-1" style={{ color: 'var(--text)' }}>{t('colStatus', 'Estado')}</strong>
                  {editFormDataArea.areaAtiva ? (
                    <span className="users-status-badge active">
                      {t('statusActive', 'Ativo')}
                    </span>
                  ) : (
                    <span className="users-status-badge inactive">
                      {t('statusInactive', 'Inativo')}
                    </span>
                  )}
                </div>
                <div className="form-check form-switch m-0">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    checked={editFormDataArea.areaAtiva}
                    onChange={(e) => setEditFormDataArea({ ...editFormDataArea, areaAtiva: e.target.checked })}
                    style={{ 
                      width: '2.8em', 
                      height: '1.4em', 
                      cursor: 'pointer',
                      backgroundColor: editFormDataArea.areaAtiva ? '#0d6efd' : '#64748b',
                      borderColor: editFormDataArea.areaAtiva ? '#0d6efd' : '#475569'
                    }}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-end gap-2 pt-2 border-top">
                <button type="button" className="btn btn-outline-secondary rounded-3 px-3" onClick={() => setShowModalEditArea(false)}>
                  {t('cancelBtn', 'Cancelar')}
                </button>
                <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold" disabled={submitting}>
                  {submitting ? t('saving', 'A salvar...') : t('saveChanges', 'Guardar Alterações')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Modal: Gestão de Níveis por Área */}
      {showModalLevels && selectedAreaForLevels && (
        <>
          <div className="users-modal-overlay" onClick={() => setShowModalLevels(false)} />
          <div className="users-modal" style={{ maxWidth: '680px', width: '92%' }}>
            <div className="users-modal-header border-bottom pb-3">
              <div>
                <h5 className="fw-bold mb-1">
                  {t('manageLevelsTitle', 'Gestão de Níveis — {{area}}', { area: selectedAreaForLevels.area })}
                </h5>
                <span className="text-muted small">
                  {t('serviceLine', 'Service Line')}: <strong>{selectedAreaForLevels.service_line || 'N/A'}</strong>
                </span>
              </div>
              <button className="users-modal-close" onClick={() => setShowModalLevels(false)}>
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Formulário de Criação / Edição de Nível */}
              <form onSubmit={handleSaveLevel} className="p-3 mb-4 rounded-3 border" style={{ backgroundColor: 'var(--panel-secondary, rgba(0,0,0,0.03))', borderColor: 'var(--sidebar-border)' }}>
                <h6 className="fw-bold mb-3 text-primary d-flex align-items-center gap-2" style={{ fontSize: '0.9rem' }}>
                  <span>{editingLevel ? '✏️' : '➕'}</span> {editingLevel ? t('editLevelTitle', 'Editar Nível') : t('addLevelBtn', 'Novo Nível')}
                </h6>
                <div className="row g-3 align-items-end">
                  <div className="col-12 col-md-5">
                    <label className="form-label small fw-semibold mb-1" style={{ color: 'var(--text)' }}>{t('levelTitleLabel', 'Título do Nível *')}</label>
                    <input
                      type="text"
                      className="form-control form-control-sm rounded-3"
                      placeholder="Ex: Júnior, Intermédio, Sénior"
                      value={formDataLevel.titulo}
                      onChange={(e) => setFormDataLevel({ ...formDataLevel, titulo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="col-12 col-md-4">
                    <div className="form-check form-switch mb-1">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="candidaturaPrazoSwitch"
                        checked={formDataLevel.candidatura_com_prazo}
                        onChange={(e) => setFormDataLevel({ ...formDataLevel, candidatura_com_prazo: e.target.checked })}
                      />
                      <label className="form-check-label small fw-semibold" htmlFor="candidaturaPrazoSwitch" style={{ color: 'var(--text)' }}>
                        {t('hasDeadlineLabel', 'Com prazo?')}
                      </label>
                    </div>
                    {formDataLevel.candidatura_com_prazo && (
                      <div className="d-flex align-items-center gap-1 mt-1">
                        <input
                          type="number"
                          min="1"
                          className="form-control form-control-sm rounded-3"
                          placeholder={t('daysLabel', 'Prazo')}
                          value={formDataLevel.tempo_concluir_candidatura}
                          onChange={(e) => setFormDataLevel({ ...formDataLevel, tempo_concluir_candidatura: e.target.value })}
                          style={{ width: '85px' }}
                        />
                        <span className="small text-muted" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {t('dayLabel', 'dias')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="col-12 col-md-3 text-end d-flex gap-1 justify-content-end">
                    {editingLevel && (
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary rounded-3 px-2 py-1"
                        style={{ fontSize: '0.78rem' }}
                        onClick={handleCancelEditLevel}
                      >
                        {t('cancelBtn', 'Cancelar')}
                      </button>
                    )}
                    <button
                      type="submit"
                      className={`btn btn-sm rounded-3 px-3 py-1 fw-bold ${editingLevel ? 'btn-primary' : 'btn-success'}`}
                      style={{ fontSize: '0.78rem' }}
                      disabled={submittingLevel}
                    >
                      {submittingLevel ? '...' : editingLevel ? t('saveBtn', 'Guardar') : t('addBtn', '+ Adicionar')}
                    </button>
                  </div>
                </div>
              </form>

              {/* Listagem de Níveis da Área */}
              <h6 className="fw-bold mb-2" style={{ color: 'var(--text)', fontSize: '0.85rem' }}>
                📋 {t('levelsBtn', 'Níveis')} ({areaLevels.length})
              </h6>

              {loadingLevels ? (
                <div className="text-center py-4 text-muted small" style={{ color: 'var(--text-muted)' }}>
                  <div className="spinner-border spinner-border-sm me-2" role="status" />
                  {t('loadingLevels', 'A carregar níveis da área...')}
                </div>
              ) : areaLevels.length === 0 ? (
                <div className="alert alert-secondary text-center small mb-0 rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)', color: 'var(--text-muted)' }}>
                  {t('noLevelsFound', 'Nenhum nível registado para esta Área.')}
                </div>
              ) : (
                <div className="table-responsive rounded-3 border" style={{ borderColor: 'var(--sidebar-border)', backgroundColor: 'var(--panel-2)' }}>
                  <table className="table align-middle mb-0" style={{ color: 'var(--text)', backgroundColor: 'transparent', '--bs-table-bg': 'transparent', fontSize: '0.85rem' }}>
                    <thead style={{ backgroundColor: 'var(--panel-secondary, rgba(0,0,0,0.05))', color: 'var(--text-muted)', borderBottom: '1px solid var(--sidebar-border)' }}>
                      <tr>
                        <th style={{ color: 'var(--text-muted)' }}>{t('titleForm', 'Título')}</th>
                        <th style={{ color: 'var(--text-muted)' }}>{t('hasDeadlineLabel', 'Prazo de Conclusão')}</th>
                        <th style={{ color: 'var(--text-muted)' }}>{t('colStatus', 'Estado')}</th>
                        <th className="text-end" style={{ color: 'var(--text-muted)' }}>{t('colActions', 'Ações')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {areaLevels.map((lvl) => (
                        <tr key={lvl.id_nivel_area} style={{ borderBottom: '1px solid var(--sidebar-border)' }}>
                          <td className="fw-semibold" style={{ color: 'var(--text)' }}>{lvl.nivel_area}</td>
                          <td>
                            {lvl.candidatura_com_prazo ? (
                              <span className="badge bg-info bg-opacity-10 text-info border border-info border-opacity-25 px-2 py-1">
                                ⏱ {lvl.tempo_concluir_candidatura} {t('dayLabel', 'dias')}
                              </span>
                            ) : (
                              <span className="text-muted small" style={{ color: 'var(--text-muted)' }}>Sem prazo</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge rounded-pill px-2 py-1 ${lvl.nivelAtivo !== false ? 'bg-success bg-opacity-10 text-success' : 'bg-danger bg-opacity-10 text-danger'}`} style={{ fontSize: '0.65rem' }}>
                              {lvl.nivelAtivo !== false ? t('statusActive', 'Ativo') : t('statusInactive', 'Inativo')}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                type="button"
                                className="btn btn-sm rounded-3 px-2 py-0 border-0"
                                style={{ 
                                  fontSize: '0.75rem',
                                  fontWeight: 600,
                                  backgroundColor: 'var(--panel-secondary, rgba(100, 116, 139, 0.15))',
                                  color: 'var(--text)'
                                }}
                                onClick={() => handleStartEditLevel(lvl)}
                                title={t('editBtn', 'Editar')}
                              >
                                ✏️ {t('editBtn', 'Editar')}
                              </button>
                              <button
                                type="button"
                                className="btn btn-sm btn-outline-danger rounded-3 px-2 py-0"
                                style={{ fontSize: '0.75rem' }}
                                onClick={() => handleDeleteLevel(lvl.id_nivel_area)}
                                title={t('deleteBtn', 'Eliminar')}
                              >
                                🗑️ {t('deleteBtn', 'Eliminar')}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="d-flex justify-content-end p-3 border-top rounded-bottom-4" style={{ backgroundColor: 'var(--panel)', borderTop: '1px solid var(--sidebar-border)' }}>
              <button type="button" className="btn btn-secondary rounded-3 px-4" onClick={() => setShowModalLevels(false)}>
                {t('closeBtn', 'Fechar')}
              </button>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
