import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../context/AppContext';
import { api } from '../../services/api';
import { ROLE } from '../../constants/roles';
import Swal from 'sweetalert2';
import ManualTranslationSwitch from '../../components/ManualTranslationSwitch';
import FlagIcon from '../../components/FlagIcon';

export default function MiniForumManagement() {
  const { t } = useTranslation();
  const { user, activeRole, socket, triggerCountsUpdate, language } = useAppContext();

  const [posts, setPosts] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [perfis, setPerfis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategoria, setSelectedCategoria] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [showReadModal, setShowReadModal] = useState(false);
  const [selectedReadPost, setSelectedReadPost] = useState(null);

  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const canPublish = [ROLE.ADMIN, ROLE.SLL, ROLE.TM].includes(Number(activeRole));

  // State to toggle manual translation
  const [manualTranslation, setManualTranslation] = useState(false);

  const [formData, setFormData] = useState({
    id_categoria_miniforum: '',
    id_perfil_alvo: '',
    titulo: '',
    conteudo: '',
    // Additional fields for multi-language manual translation
    titulo_pt: '',
    titulo_en: '',
    titulo_es: '',
    conteudo_pt: '',
    conteudo_en: '',
    conteudo_es: ''
  });

  // Open Read Modal & Register Read API
  const handleOpenRead = async (post) => {
    setSelectedReadPost(post);
    setShowReadModal(true);

    const postId = post.id_postagem_miniforum || post.id;
    if (!post.lida) {
      try {
        await api.post(`/postagem_miniforum/${postId}/lida`);
        setPosts(prev => prev.map(p => ((p.id_postagem_miniforum || p.id) === postId ? { ...p, lida: true } : p)));
        if (triggerCountsUpdate) triggerCountsUpdate();
      } catch (err) {
        console.error('Erro ao registar leitura no MiniFórum:', err);
      }
    }
  };

  // Fetch Categories and Target Profiles
  const fetchAuxiliaryData = useCallback(async () => {
    try {
      const [resCat, resPerf] = await Promise.all([
        api.get('/postagem_miniforum/categorias'),
        api.get('/perfil')
      ]);

      if (resCat.data?.data) {
        setCategorias(resCat.data.data);
      }
      if (resPerf.data?.data) {
        setPerfis(resPerf.data.data);
      }
    } catch (err) {
      console.error('Erro ao carregar dados auxiliares do MiniFórum:', err);
    }
  }, []);

  // Fetch Forum Posts based on current language and selected category filter
  const fetchPosts = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      let url = '/postagem_miniforum';
      if (selectedCategoria !== 'all') {
        url += `?id_categoria_miniforum=${selectedCategoria}`;
      }

      const res = await api.get(url);
      if (res.data?.data) {
        setPosts(res.data.data);
      } else if (Array.isArray(res.data)) {
        setPosts(res.data);
      }
    } catch (err) {
      console.error('Erro ao carregar postagens do MiniFórum:', err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [selectedCategoria]);

  // CICLO DE VIDA: Re-fetch ao arrancar e sempre que o idioma do sistema mudar
  useEffect(() => {
    fetchAuxiliaryData();
  }, [fetchAuxiliaryData, language]);

  useEffect(() => {
    fetchPosts(false);
  }, [fetchPosts, language]);

  // WebSocket real-time triggers (atualização silenciosa)
  useEffect(() => {
    if (!socket) return;
    const handleNewPost = () => {
      fetchPosts(true);
      if (triggerCountsUpdate) triggerCountsUpdate();
    };
    socket.on('nova_postagem_miniforum', handleNewPost);
    socket.on('postagem_miniforum_criada', handleNewPost);
    socket.on('miniforum_updated', handleNewPost);

    return () => {
      socket.off('nova_postagem_miniforum', handleNewPost);
      socket.off('postagem_miniforum_criada', handleNewPost);
      socket.off('miniforum_updated', handleNewPost);
    };
  }, [socket, fetchPosts, triggerCountsUpdate]);

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setEditingId(null);
    setManualTranslation(false);
    setFormData({
      id_categoria_miniforum: categorias[0]?.id_categoria_miniforum || 1,
      id_perfil_alvo: '',
      titulo: '',
      conteudo: '',
      titulo_pt: '',
      titulo_en: '',
      titulo_es: '',
      conteudo_pt: '',
      conteudo_en: '',
      conteudo_es: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = async (post) => {
    setIsEditMode(true);
    const postId = post.id_postagem_miniforum || post.id;
    setEditingId(postId);

    const initialTitle = post.titulo || '';
    const initialContent = post.conteudo || post.mensagem || '';

    setFormData({
      id_categoria_miniforum: post.id_categoria_miniforum || 1,
      id_perfil_alvo: post.id_perfil_alvo || '',
      titulo: initialTitle,
      conteudo: initialContent,
      titulo_pt: initialTitle,
      titulo_en: initialTitle,
      titulo_es: initialTitle,
      conteudo_pt: initialContent,
      conteudo_en: initialContent,
      conteudo_es: initialContent
    });

    setManualTranslation(false);
    setShowModal(true);

    try {
      const [pPt, pEn, pEs] = await Promise.all([
        api.get(`/postagem_miniforum/${postId}?lang=pt`).catch(() => null),
        api.get(`/postagem_miniforum/${postId}?lang=en`).catch(() => null),
        api.get(`/postagem_miniforum/${postId}?lang=es`).catch(() => null)
      ]);

      const titlePt = pPt?.data?.data?.titulo || initialTitle;
      const titleEn = pEn?.data?.data?.titulo || initialTitle;
      const titleEs = pEs?.data?.data?.titulo || initialTitle;

      const contPt = pPt?.data?.data?.conteudo || pPt?.data?.data?.mensagem || initialContent;
      const contEn = pEn?.data?.data?.conteudo || pEn?.data?.data?.mensagem || initialContent;
      const contEs = pEs?.data?.data?.conteudo || pEs?.data?.data?.mensagem || initialContent;

      const hasDiff = titlePt !== titleEn || contPt !== contEn;

      setFormData(prev => ({
        ...prev,
        titulo_pt: titlePt,
        titulo_en: titleEn,
        titulo_es: titleEs,
        conteudo_pt: contPt,
        conteudo_en: contEn,
        conteudo_es: contEs
      }));
      setManualTranslation(false);
    } catch (err) {
      console.error('Error fetching multi-lang post details:', err);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();

    // Validations based on mode
    if (manualTranslation) {
      if (!formData.titulo_pt.trim() && !formData.titulo_en.trim() && !formData.titulo_es.trim()) {
        Swal.fire({
          icon: 'warning',
          title: t('warningTitle', 'Atenção'),
          text: t('fillRequiredFields', 'Preencha pelo menos um campo de título no idioma correspondente.')
        });
        return;
      }
    } else {
      if (!formData.titulo.trim() || !formData.conteudo.trim()) {
        Swal.fire({
          icon: 'warning',
          title: t('warningTitle', 'Atenção'),
          text: t('fillRequiredFields', 'Preencha todos os campos obrigatórios.')
        });
        return;
      }
    }

    const savePostPayload = (forceOriginal = false, forceManual = false) => {
      const isManual = forceManual || manualTranslation;
      return {
        id_categoria_miniforum: Number(formData.id_categoria_miniforum),
        id_perfil_alvo: formData.id_perfil_alvo ? Number(formData.id_perfil_alvo) : null,
        titulo: isManual ? {
          pt: String(formData.titulo_pt).trim(),
          en: String(formData.titulo_en).trim(),
          es: String(formData.titulo_es).trim()
        } : String(formData.titulo).trim(),
        conteudo: isManual ? {
          pt: String(formData.conteudo_pt).trim(),
          en: String(formData.conteudo_en).trim(),
          es: String(formData.conteudo_es).trim()
        } : String(formData.conteudo).trim(),
        lang: language,
        manualTranslation: isManual,
        forceOriginalLanguage: forceOriginal
      };
    };

    const submitPost = async (payload) => {
      if (isEditMode) {
        await api.put(`/postagem_miniforum/${editingId}`, payload);
      } else {
        await api.post('/postagem_miniforum', payload);
      }
    };

    try {
      setSubmitting(true);
      const payload = savePostPayload();
      await submitPost(payload);

      Swal.fire({
        icon: 'success',
        title: t('successTitle', 'Sucesso'),
        text: isEditMode ? t('postUpdatedSuccess', 'Publicação atualizada com sucesso.') : t('postCreatedSuccess', 'Publicação criada com sucesso.'),
        timer: 1500,
        showConfirmButton: false
      });

      setShowModal(false);
      fetchPosts();
      if (triggerCountsUpdate) triggerCountsUpdate();
    } catch (err) {
      console.error('Erro ao guardar postagem:', err);

      // Check if translation service failed (e.g. status 400 or code 'TRANSLATION_FAILED')
      if (err.response?.status === 400 && err.response?.data?.translationError) {
        setSubmitting(false);
        const choice = await Swal.fire({
          icon: 'question',
          title: t('translationFailedTitle', 'Tradução Automática Indisponível'),
          text: t('translationFailedText', 'O serviço de tradução automática está temporariamente indisponível. Deseja guardar no idioma original ou preencher as traduções manualmente?'),
          showDenyButton: true,
          showCancelButton: true,
          confirmButtonText: t('saveOriginalLangBtn', 'Guardar no Idioma Original'),
          denyButtonText: t('manualTranslateBtn', 'Traduzir Manualmente'),
          cancelButtonText: t('cancelBtn', 'Cancelar')
        });

        if (choice.isConfirmed) {
          // Force saving in original language
          try {
            setSubmitting(true);
            const retryPayload = savePostPayload(true, false);
            await submitPost(retryPayload);
            setShowModal(false);
            fetchPosts();
            if (triggerCountsUpdate) triggerCountsUpdate();
            Swal.fire({ icon: 'success', title: t('successTitle'), timer: 1500 });
          } catch (retryErr) {
            Swal.fire({ icon: 'error', title: t('errorTitle'), text: retryErr.response?.data?.message || 'Erro ao guardar.' });
          } finally {
            setSubmitting(false);
          }
        } else if (choice.isDenied) {
          // Open manual translation inputs
          setManualTranslation(true);
          // Prefill values from single fields into PT/EN/ES if blank
          setFormData(prev => ({
            ...prev,
            titulo_pt: prev.titulo_pt || prev.titulo,
            titulo_en: prev.titulo_en || prev.titulo,
            titulo_es: prev.titulo_es || prev.titulo,
            conteudo_pt: prev.conteudo_pt || prev.conteudo,
            conteudo_en: prev.conteudo_en || prev.conteudo,
            conteudo_es: prev.conteudo_es || prev.conteudo
          }));
        }
      } else {
        Swal.fire({
          icon: 'error',
          title: t('errorTitle', 'Erro'),
          text: err.response?.data?.message || t('postSaveError', 'Não foi possível guardar a publicação.')
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: t('confirmDeleteTitle', 'Tem a certeza?'),
      text: t('confirmDeletePostText', 'Esta publicação será removida do MiniFórum.'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: t('deleteBtn', 'Eliminar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (!confirm.isConfirmed) return;

    try {
      await api.delete(`/postagem_miniforum/${id}`);
      Swal.fire({
        icon: 'success',
        title: t('successTitle', 'Sucesso'),
        text: t('postDeletedSuccess', 'Publicação eliminada com sucesso.'),
        timer: 1500,
        showConfirmButton: false
      });
      fetchPosts();
      if (triggerCountsUpdate) triggerCountsUpdate();
    } catch (err) {
      console.error('Erro ao eliminar postagem:', err);
      Swal.fire({
        icon: 'error',
        title: t('errorTitle', 'Erro'),
        text: err.response?.data?.message || t('postDeleteError', 'Não foi possível eliminar a publicação.')
      });
    }
  };

  const formatDate = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="users-admin-container">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
        <div>
          <h3 className="fw-bold mb-1">{t('miniForumTitle', 'MiniFórum — Anúncios & Comunicados')}</h3>
          <p className="text-muted small mb-0">{t('miniForumSubtitle', 'Espaço de partilha de avisos institucionais e notícias da equipa.')}</p>
        </div>

        {canPublish && (
          <button
            className="btn btn-primary fw-semibold px-3 d-flex align-items-center gap-2"
            style={{ borderRadius: '8px' }}
            onClick={handleOpenCreate}
          >
            <svg viewBox="0 0 24 24" style={{ width: 18, height: 18, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            {t('publishPostBtn', 'Nova Publicação')}
          </button>
        )}
      </div>

      {/* Category Filter Toolbar */}
      <div className="users-toolbar shadow-sm rounded-4 p-3 mb-4 d-flex flex-wrap gap-3 align-items-center justify-content-between border" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
        <div className="d-flex align-items-center gap-2">
          <label className="fw-semibold small text-muted mb-0">{t('filterByCategory', 'Categoria:')}</label>
          <select
            className="form-select form-select-sm rounded-3 fw-medium cursor-pointer"
            style={{ minWidth: '200px', backgroundColor: 'var(--panel-2)', color: 'var(--text)', borderColor: 'var(--sidebar-border)' }}
            value={selectedCategoria}
            onChange={(e) => setSelectedCategoria(e.target.value)}
          >
            <option value="all">{t('allCategories', 'Todas as Categorias')}</option>
            {categorias.map(cat => (
              <option key={cat.id_categoria_miniforum} value={cat.id_categoria_miniforum}>
                {cat.nome_categoria || cat.categoria || cat.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Posts Table */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="users-spinner" />
            <span>{t('loadingPosts', 'A carregar publicações do MiniFórum...')}</span>
          </div>
        ) : (
          <div className="users-table-wrapper">
            <table className="users-table align-middle">
              <thead>
                <tr>
                  <th>{t('colPostTitle', 'Publicação')}</th>
                  <th>{t('colCategory', 'Categoria')}</th>
                  <th>{t('colTarget', 'Destinatários')}</th>
                  <th>{t('colAuthor', 'Autor')}</th>
                  <th>{t('colDate', 'Data')}</th>
                  <th className="text-end">{t('colActions', 'Ações')}</th>
                </tr>
              </thead>
              <tbody>
                {posts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="users-empty-row py-4 text-center text-muted">
                      {t('noPostsFound', 'Nenhuma publicação encontrada no MiniFórum.')}
                    </td>
                  </tr>
                ) : (
                  posts.map((post) => {
                    const postId = post.id_postagem_miniforum || post.id;
                    const titleText = post.titulo || '';
                    const authorName = post.autor ? `${post.autor.nome} ${post.autor.apelido}` : (post.autor_nome || 'Sistema');
                    const authorId = post.id_utilizador_autor || post.id_autor || post.autor?.id_utilizador;
                    const isAuthor = user?.id_utilizador && String(user.id_utilizador) === String(authorId);
                    const targetName = post.perfil_alvo || (post.id_perfil_alvo ? perfis.find(p => String(p.id_perfil) === String(post.id_perfil_alvo))?.perfil : t('targetAll', 'Todos'));

                    return (
                      <tr key={postId} style={{ opacity: post.lida ? 0.85 : 1 }}>
                        <td style={{ maxWidth: '340px' }}>
                          <div className="d-flex align-items-center gap-2">
                            {!post.lida && (
                              <span className="badge bg-danger rounded-circle" style={{ width: 9, height: 9, padding: 0 }} title={t('unreadTooltip', 'Não lida')} />
                            )}
                            <strong className={`text-dark mb-0 ${!post.lida ? 'fw-bold' : 'fw-normal'}`}>
                              {titleText}
                            </strong>
                          </div>
                        </td>
                        <td>
                          <span className="badge bg-light text-primary border" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                            {post.categoria || post.categoria_nome || 'Geral'}
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-secondary-subtle text-secondary" style={{ fontSize: '0.75rem' }}>
                            {targetName}
                          </span>
                        </td>
                        <td>
                          <span className="small text-dark fw-semibold">{authorName}</span>
                        </td>
                        <td className="small text-muted">{formatDate(post.data_postagem || post.data)}</td>
                        <td>
                          <div className="users-actions-cell justify-content-end gap-1">
                            {/* Botão Ler (Ativo para todos os utilizadores relacionados) */}
                            <button
                              className="btn btn-sm btn-primary rounded-3 px-3 py-1 fw-semibold me-1"
                              style={{ fontSize: '0.8rem' }}
                              onClick={() => handleOpenRead(post)}
                            >
                              {t('readBtn', 'Ler')}
                            </button>

                            {/* Botões Editar & Eliminar (Ativos apenas para o Autor) */}
                            {canPublish && (
                              <>
                                <button
                                  className="users-action-btn edit"
                                  disabled={!isAuthor}
                                  title={!isAuthor ? t('onlyAuthorCanEdit', 'Apenas o autor pode editar') : ''}
                                  onClick={() => handleOpenEdit(post)}
                                >
                                  {t('editBtn')}
                                </button>
                                <button
                                  className="users-action-btn block"
                                  disabled={!isAuthor}
                                  title={!isAuthor ? t('onlyAuthorCanEdit', 'Apenas o autor pode eliminar') : ''}
                                  onClick={() => handleDelete(postId)}
                                >
                                  {t('deleteBtn')}
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Read Post Content */}
      {showReadModal && selectedReadPost && (
        <>
          <div className="users-modal-overlay" onClick={() => setShowReadModal(false)} />
          <div className="users-modal" style={{ maxWidth: '640px', width: '90%' }}>
            <div className="users-modal-header border-bottom pb-3">
              <div>
                <span className="badge bg-primary-subtle text-primary border mb-2" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                  {selectedReadPost.categoria || selectedReadPost.categoria_nome || 'Geral'}
                </span>
                <h4 className="fw-bold mb-1 text-dark">
                  {selectedReadPost.titulo || ''}
                </h4>
                <div className="text-muted small">
                  {t('by', 'Por')} <strong>{selectedReadPost.autor ? `${selectedReadPost.autor.nome} ${selectedReadPost.autor.apelido}` : (selectedReadPost.autor_nome || 'Sistema')}</strong> • {formatDate(selectedReadPost.data_postagem || selectedReadPost.data)}
                </div>
              </div>
              <button className="users-modal-close" onClick={() => setShowReadModal(false)}>
                <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            <div style={{ padding: '24px', fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text)', whiteSpace: 'pre-wrap' }}>
              {selectedReadPost.conteudo || selectedReadPost.mensagem || ''}
            </div>

            <div className="d-flex justify-content-end p-3 border-top bg-light rounded-bottom-4">
              <button type="button" className="btn btn-secondary rounded-3 px-4" onClick={() => setShowReadModal(false)}>
                {t('closeBtn', 'Fechar')}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Modal: Create / Edit Post */}
      {showModal && (
        <>
          <div className="users-modal-overlay" onClick={() => setShowModal(false)} />
          <div className="users-modal" style={{ maxWidth: '640px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            {/* Sticky Header with ManualTranslationSwitch aligned right */}
            <div className="users-modal-header border-bottom d-flex align-items-center justify-content-between p-3">
              <h5 className="mb-0 fw-bold" style={{ color: 'var(--text)' }}>
                {isEditMode ? t('editPostTitle', 'Editar Publicação') : t('newPostTitle', 'Criar Nova Publicação')}
              </h5>
              <div className="d-flex align-items-center gap-3">
                <ManualTranslationSwitch
                  checked={manualTranslation}
                  onChange={(val) => setManualTranslation(val)}
                />
                <button className="users-modal-close p-1 border-0 bg-transparent" onClick={() => setShowModal(false)} style={{ color: 'var(--text-secondary)' }}>
                  <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px', fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
                </button>
              </div>
            </div>

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {/* Scrollable Form Body */}
              <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>

                <div className="row g-3 mb-3">
                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold" style={{ color: 'var(--text)' }}>{t('postCategoryLabel', 'Categoria *')}</label>
                    <select
                      className="form-select rounded-3"
                      value={formData.id_categoria_miniforum}
                      onChange={(e) => setFormData({ ...formData, id_categoria_miniforum: e.target.value })}
                      required
                    >
                      {categorias.map(cat => (
                        <option key={cat.id_categoria_miniforum} value={cat.id_categoria_miniforum}>
                          {cat.nome_categoria || cat.categoria || cat.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-12 col-md-6">
                    <label className="form-label small fw-semibold" style={{ color: 'var(--text)' }}>{t('postTargetLabel', 'Público Alvo')}</label>
                    <select
                      className="form-select rounded-3"
                      value={formData.id_perfil_alvo}
                      onChange={(e) => setFormData({ ...formData, id_perfil_alvo: e.target.value })}
                    >
                      <option value="">{t('targetAllGlobal', 'Todos os Utilizadores (Público Global)')}</option>
                      {perfis.map(p => (
                        <option key={p.id_perfil} value={p.id_perfil}>
                          {p.perfil}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!manualTranslation ? (
                  <>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold" style={{ color: 'var(--text)' }}>{t('postTitleLabel', 'Título da Publicação *')}</label>
                      <input
                        type="text"
                        className="form-control rounded-3"
                        value={formData.titulo}
                        onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                        placeholder={t('postTitlePlaceholder', 'Ex: Lançamento do novo ciclo de badges')}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold" style={{ color: 'var(--text)' }}>{t('postContentLabel', 'Conteúdo / Mensagem *')}</label>
                      <textarea
                        className="form-control rounded-3"
                        rows="5"
                        value={formData.conteudo}
                        onChange={(e) => setFormData({ ...formData, conteudo: e.target.value })}
                        placeholder={t('postContentPlaceholder', 'Escreva a mensagem ou detalhes a comunicar à equipa...')}
                        required
                      />
                    </div>
                  </>
                ) : (
                  <div className="d-flex flex-column gap-3">
                    {/* Titles */}
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1">{t('postTitleLabel', 'Título da Publicação *')}</label>
                      <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="pt" />
                            <span>PT</span>
                          </span>
                          <input type="text" className="form-control" placeholder="Título em Português" value={formData.titulo_pt} onChange={(e) => setFormData(prev => ({ ...prev, titulo_pt: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="en" />
                            <span>EN</span>
                          </span>
                          <input type="text" className="form-control" placeholder="Title in English" value={formData.titulo_en} onChange={(e) => setFormData(prev => ({ ...prev, titulo_en: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="es" />
                            <span>ES</span>
                          </span>
                          <input type="text" className="form-control" placeholder="Título en Español" value={formData.titulo_es} onChange={(e) => setFormData(prev => ({ ...prev, titulo_es: e.target.value }))} disabled={submitting} />
                        </div>
                      </div>
                    </div>

                    {/* Contents */}
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1">{t('postContentLabel', 'Conteúdo / Mensagem *')}</label>
                      <div className="d-flex flex-column gap-2 p-2 border rounded-3" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="pt" />
                            <span>PT</span>
                          </span>
                          <textarea className="form-control" rows="3" placeholder="Mensagem em Português" value={formData.conteudo_pt} onChange={(e) => setFormData(prev => ({ ...prev, conteudo_pt: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="en" />
                            <span>EN</span>
                          </span>
                          <textarea className="form-control" rows="3" placeholder="Message in English" value={formData.conteudo_en} onChange={(e) => setFormData(prev => ({ ...prev, conteudo_en: e.target.value }))} disabled={submitting} />
                        </div>
                        <div className="input-group input-group-sm">
                          <span className="input-group-text fw-bold d-flex align-items-center gap-2" style={{ width: '80px' }}>
                            <FlagIcon lang="es" />
                            <span>ES</span>
                          </span>
                          <textarea className="form-control" rows="3" placeholder="Mensaje en Español" value={formData.conteudo_es} onChange={(e) => setFormData(prev => ({ ...prev, conteudo_es: e.target.value }))} disabled={submitting} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Sticky Footer for Actions */}
              <div className="d-flex justify-content-end gap-2 p-3 border-top bg-light" style={{ backgroundColor: 'var(--panel-2)' }}>
                <button type="button" className="btn btn-outline-secondary rounded-3 px-3" onClick={() => setShowModal(false)}>
                  {t('cancelBtn')}
                </button>
                <button type="submit" className="btn btn-primary rounded-3 px-4 fw-semibold" disabled={submitting}>
                  {submitting ? t('saving') : t('saveChanges')}
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
