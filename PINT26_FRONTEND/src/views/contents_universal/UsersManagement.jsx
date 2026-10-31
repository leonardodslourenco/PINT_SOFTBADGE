import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api, API_BASE_URL } from '../../services/api';
import Swal from 'sweetalert2';
import SearchBar from '../../components/SearchBar';
import AreaAtuacao from '../../components/AreaAtuacao';
import ServiceLinePertencente from '../../components/ServiceLinePertencente';

const ITEMS_PER_PAGE = 8;

// Profile badge color map (id_perfil -> color scheme)
const PROFILE_COLORS = {
  1: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }, // Admin - blue
  2: { bg: '#ede9fe', text: '#6d28d9', border: '#c4b5fd' }, // SLL - purple
  3: { bg: '#fce7f3', text: '#be185d', border: '#f9a8d4' }, // TM - pink
  4: { bg: '#e0f2fe', text: '#0369a1', border: '#7dd3fc' }, // Consultor - sky
};

// Profile name map fallback
const PROFILE_NAMES = {
  1: 'Administrador',
  2: 'Service Line',
  3: 'Talent Manager',
  4: 'Consultor',
};

export default function UsersManagement() {
  const { t, i18n } = useTranslation();
  const [users, setUsers] = useState([]);
  const [failedAvatars, setFailedAvatars] = useState({});

  const handleAvatarError = (userId) => {
    setFailedAvatars(prev => ({ ...prev, [userId]: true }));
  };

  const [previewAvatar, setPreviewAvatar] = useState(null);

  const handleAvatarMouseMove = (e, avatarUrl, userName) => {
    const boxWidth = 400;
    const boxHeight = 400;
    const padding = 20;

    let x = e.clientX + padding;
    let y = e.clientY - (boxHeight / 2);

    if (x + boxWidth > window.innerWidth - padding) {
      x = e.clientX - boxWidth - padding;
    }
    if (y + boxHeight > window.innerHeight - padding) {
      y = window.innerHeight - boxHeight - padding;
    }
    if (y < padding) {
      y = padding;
    }

    setPreviewAvatar({
      url: avatarUrl,
      name: userName,
      x,
      y
    });
  };

  const handleAvatarMouseLeave = () => {
    setPreviewAvatar(null);
  };

  const [profiles, setProfiles] = useState([]);
  const [serviceLines, setServiceLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterProfile, setFilterProfile] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    nome: '',
    apelido: '',
    email: '',
    id_sl: '',
    idioma_preferencial: 'pt',
    hasSll: false,
    hasTm: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // States for SL and Area selection (handled by reusable components)
  const [modalSelectedSl, setModalSelectedSl] = useState('');
  const [modalSelectedArea, setModalSelectedArea] = useState('');

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/utilizador');
      if (res.data?.success) {
        setUsers(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      // Fallback to mock data when backend is offline
      setUsers(getMockUsers());
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch service lines from API
  const fetchServiceLines = useCallback(async () => {
    try {
      const res = await api.get('/service_line?ativo=true');
      if (res.data?.success) {
        setServiceLines(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching service lines:', err);
    }
  }, []);

  // Fetch profiles from API
  const fetchProfiles = useCallback(async () => {
    try {
      const res = await api.get('/perfil');
      if (res.data?.success) {
        setProfiles(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching profiles:', err);
      // Fallback
      setProfiles([
        { id_perfil: 1, nome: 'Administrador' },
        { id_perfil: 2, nome: 'Service Line' },
        { id_perfil: 3, nome: 'Talent Manager' },
        { id_perfil: 4, nome: 'Consultor' },
      ]);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchProfiles();
    fetchServiceLines();
  }, [fetchUsers, fetchProfiles, fetchServiceLines]);

  // Mock data fallback
  function getMockUsers() {
    return [
      { id_utilizador: '1', nome: 'Ana', apelido: 'Silva', email: 'ana.silva@empresa.pt', conta_ativa: true, perfis: [{ id_perfil: 4, perfil: 'Consultor' }] },
      { id_utilizador: '2', nome: 'João', apelido: 'Santos', email: 'joao.santos@empresa.pt', conta_ativa: true, perfis: [{ id_perfil: 3, perfil: 'Talent Manager' }] },
      { id_utilizador: '3', nome: 'Maria', apelido: 'Costa', email: 'maria.costa@empresa.pt', conta_ativa: true, perfis: [{ id_perfil: 2, perfil: 'Service Line' }] },
      { id_utilizador: '4', nome: 'Pedro', apelido: 'Oliveira', email: 'pedro.oliveira@empresa.pt', conta_ativa: false, perfis: [{ id_perfil: 4, perfil: 'Consultor' }] },
      { id_utilizador: '5', nome: 'Rita', apelido: 'Ferreira', email: 'rita.ferreira@empresa.pt', conta_ativa: true, perfis: [{ id_perfil: 3, perfil: 'Talent Manager' }] },
      { id_utilizador: '6', nome: 'Carlos', apelido: 'Mendes', email: 'carlos.mendes@empresa.pt', conta_ativa: true, perfis: [{ id_perfil: 2, perfil: 'Service Line' }] },
      { id_utilizador: '7', nome: 'Sofia', apelido: 'Rodrigues', email: 'sofia.rodrigues@empresa.pt', conta_ativa: true, perfis: [{ id_perfil: 4, perfil: 'Consultor' }] },
      { id_utilizador: '8', nome: 'Luís', apelido: 'Pereira', email: 'luis.pereira@empresa.pt', conta_ativa: false, perfis: [{ id_perfil: 3, perfil: 'Talent Manager' }] },
    ];
  }

  // Filter & search
  const filteredUsers = useMemo(() => {
    let result = users;

    // Search by name or email
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(u =>
        `${u.nome} ${u.apelido}`.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }

    // Filter by profile
    if (filterProfile !== 'all') {
      const profileId = Number(filterProfile);
      result = result.filter(u =>
        u.perfis?.some(p => Number(p.id_perfil) === profileId)
      );
    }

    return result;
  }, [users, searchQuery, filterProfile]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // Reset page when filters change
  useEffect(() => { setCurrentPage(1); }, [searchQuery, filterProfile]);

  // Get the primary (strongest) profile for display
  function getPrimaryProfile(user) {
    if (!user.perfis?.length) return null;
    // Priority: 1 (Admin) > 2 (SLL) > 3 (TM) > 4 (Con)
    const sorted = [...user.perfis].sort((a, b) => Number(a.id_perfil) - Number(b.id_perfil));
    return sorted[0];
  }

  function getProfileLabel(profile) {
    if (!profile) return '—';
    return profile.perfil || PROFILE_NAMES[profile.id_perfil] || `Perfil ${profile.id_perfil}`;
  }

  function getProfileStyle(profile) {
    if (!profile) return {};
    const colors = PROFILE_COLORS[profile.id_perfil] || PROFILE_COLORS[4];
    return {
      backgroundColor: colors.bg,
      color: colors.text,
      border: `1px solid ${colors.border}`,
    };
  }

  // Toggle block/activate user
  async function handleToggleStatus(user) {
    const newStatus = !user.conta_ativa;
    const actionLabel = newStatus ? t('activateUser') : t('blockUser');

    const result = await Swal.fire({
      title: actionLabel,
      text: `${t('confirmToggleStatus')} ${user.nome} ${user.apelido}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: newStatus ? '#16a34a' : '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: actionLabel,
      cancelButtonText: t('cancelBtn'),
    });

    if (!result.isConfirmed) return;

    try {
      await api.patch(`/utilizador/${user.id_utilizador}/status`, { conta_ativa: newStatus });
      setUsers(prev => prev.map(u =>
        u.id_utilizador === user.id_utilizador ? { ...u, conta_ativa: newStatus } : u
      ));
      Swal.fire({
        icon: 'success',
        title: t('successTitle'),
        text: newStatus ? t('userActivated') : t('userBlocked'),
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      // Offline fallback - update locally
      setUsers(prev => prev.map(u =>
        u.id_utilizador === user.id_utilizador ? { ...u, conta_ativa: newStatus } : u
      ));
      Swal.fire({
        icon: 'info',
        title: t('offlineMode'),
        text: t('changesSavedLocally'),
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }

  // Unlock user account
  async function handleUnlockStatus(user) {
    const result = await Swal.fire({
      title: t('unlockUserTitle'),
      text: t('unlockUserConfirm').replace('{name}', `${user.nome} ${user.apelido}`),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#eab308',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('unlockUser'),
      cancelButtonText: t('cancelBtn'),
    });

    if (!result.isConfirmed) return;

    try {
      await api.patch(`/utilizador/${user.id_utilizador}/unlock`);
      setUsers(prev => prev.map(u =>
        u.id_utilizador === user.id_utilizador ? { ...u, conta_bloqueada: false } : u
      ));
      Swal.fire({
        icon: 'success',
        title: t('successTitle'),
        text: t('unlockUserSuccess'),
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.response?.data?.message || t('unlockUserError')
      });
    }
  }

  // Open create modal
  function handleCreate() {
    setEditingUser(null);
    setModalSelectedSl('');
    setModalSelectedArea('');
    setFormData({
      nome: '',
      apelido: '',
      email: '',
      id_sl: '',
      idioma_preferencial: 'pt',
      hasSll: false,
      hasTm: false
    });
    setFormErrors({});
    setShowModal(true);
  }

  // Open edit modal
  async function handleEdit(user) {
    setEditingUser(user);
    const userPerfisIds = (user.perfis || []).map(p => Number(p.id_perfil));
    setFormData({
      nome: user.nome || '',
      apelido: user.apelido || '',
      email: user.email || '',
      id_sl: user.id_sl ? String(user.id_sl) : '',
      idioma_preferencial: user.idioma_preferencial || 'pt',
      hasSll: userPerfisIds.includes(2),
      hasTm: userPerfisIds.includes(3),
    });
    setFormErrors({});

    // Fetch full user details to get real id_area and id_sl (since listUtilizador maps public data)
    let finalIdArea = user.id_area || null;
    let finalIdSl = user.id_sl || null;
    try {
      const res = await api.get(`/utilizador/${user.id_utilizador}`);
      if (res.data?.success && res.data.data) {
        if (res.data.data.id_area) finalIdArea = res.data.data.id_area;
        if (res.data.data.id_sl) finalIdSl = res.data.data.id_sl;
      }
    } catch (err) {
      console.error('Error fetching detailed user info:', err);
    }

    setModalSelectedArea(finalIdArea ? String(finalIdArea) : '');
    setModalSelectedSl(finalIdSl ? String(finalIdSl) : '');

    setShowModal(true);
  }

  // Form validation
  function validateForm() {
    const errors = {};
    if (!formData.nome.trim()) errors.nome = t('fieldRequired');
    if (!formData.apelido.trim()) errors.apelido = t('fieldRequired');
    if (!formData.email.trim()) errors.email = t('fieldRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.email = t('invalidEmail');
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }

  // Submit create/edit
  async function handleSubmit(e) {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);

    // Calculate perfis array
    const currentPerfis = editingUser ? (editingUser.perfis || []).map(p => Number(p.id_perfil)) : [];
    const isAdmin = currentPerfis.includes(1);

    const newPerfisIds = [4]; // Consultor mandatory
    if (isAdmin) newPerfisIds.push(1); // Admin preserved if user was Admin
    if (formData.hasSll) newPerfisIds.push(2);
    if (formData.hasTm) newPerfisIds.push(3);

    const updatedPerfisObjects = newPerfisIds.map(id => ({
      id_perfil: id,
      perfil: PROFILE_NAMES[id] || `Perfil ${id}`
    }));

    const effectiveIdSl = editingUser
      ? (modalSelectedSl ? Number(modalSelectedSl) : null)
      : (formData.id_sl ? Number(formData.id_sl) : null);

    const payload = {
      nome: formData.nome,
      apelido: formData.apelido,
      email: formData.email,
      idioma_preferencial: formData.idioma_preferencial,
      perfis: newPerfisIds,
      id_sl: effectiveIdSl,
      id_area: modalSelectedArea ? Number(modalSelectedArea) : null
    };

    try {
      if (editingUser) {
        // Update
        await api.put(`/utilizador/${editingUser.id_utilizador}`, payload);
        setUsers(prev => prev.map(u =>
          u.id_utilizador === editingUser.id_utilizador
            ? {
                ...u,
                nome: formData.nome,
                apelido: formData.apelido,
                email: formData.email,
                idioma_preferencial: formData.idioma_preferencial,
                perfis: updatedPerfisObjects,
                id_sl: effectiveIdSl,
                id_area: modalSelectedArea ? Number(modalSelectedArea) : null
              }
            : u
        ));
      } else {
        // Create
        const res = await api.post('/utilizador', payload);
        if (res.data?.success) {
          await fetchUsers(); // Reload full list
        }
      }

      setShowModal(false);
      Swal.fire({
        icon: 'success',
        title: t('successTitle'),
        text: editingUser ? t('userUpdated') : t('userCreated'),
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      // Offline fallback
      if (editingUser) {
        setUsers(prev => prev.map(u =>
          u.id_utilizador === editingUser.id_utilizador
            ? {
                ...u,
                nome: formData.nome,
                apelido: formData.apelido,
                email: formData.email,
                idioma_preferencial: formData.idioma_preferencial,
                perfis: updatedPerfisObjects
              }
            : u
        ));
      } else {
        const newUser = {
          id_utilizador: `temp-${Date.now()}`,
          nome: formData.nome,
          apelido: formData.apelido,
          email: formData.email,
          idioma_preferencial: formData.idioma_preferencial,
          conta_ativa: true,
          perfis: updatedPerfisObjects,
        };
        setUsers(prev => [...prev, newUser]);
      }
      setShowModal(false);
      Swal.fire({
        icon: 'info',
        title: t('offlineMode'),
        text: t('changesSavedLocally'),
        timer: 1500,
        showConfirmButton: false,
      });
    } finally {
      setSubmitting(false);
    }
  }

  // Delete user
  async function handleDelete(user) {
    const result = await Swal.fire({
      title: t('deleteUser'),
      text: `${t('confirmDelete')} ${user.nome} ${user.apelido}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('deleteUser'),
      cancelButtonText: t('cancelBtn'),
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/utilizador/${user.id_utilizador}`);
      setUsers(prev => prev.map(u =>
        u.id_utilizador === user.id_utilizador ? { ...u, conta_ativa: false } : u
      ));
      Swal.fire({
        icon: 'success',
        title: t('successTitle'),
        text: t('userDeleted'),
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      setUsers(prev => prev.map(u =>
        u.id_utilizador === user.id_utilizador ? { ...u, conta_ativa: false } : u
      ));
      Swal.fire({
        icon: 'info',
        title: t('offlineMode'),
        text: t('changesSavedLocally'),
        timer: 1500,
        showConfirmButton: false,
      });
    }
  }

  return (
    <div className="users-admin-container">
      {/* Top toolbar: search + filter + create button */}
      <div className="users-toolbar">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t('searchPlaceholder')}
        />

        <div className="users-filter-wrapper">
          <select
            className="users-filter-select"
            value={filterProfile}
            onChange={(e) => setFilterProfile(e.target.value)}
          >
            <option value="all">{t('allProfiles')}</option>
            <option value="1">{PROFILE_NAMES[1]}</option>
            <option value="2">{PROFILE_NAMES[2]}</option>
            <option value="3">{PROFILE_NAMES[3]}</option>
            <option value="4">{PROFILE_NAMES[4]}</option>
          </select>
          <svg className="users-filter-chevron" viewBox="0 0 24 24">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>

        <button className="users-create-btn" onClick={handleCreate}>
          <svg viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>{t('createUser')}</span>
        </button>
      </div>

      {/* Users table */}
      <div className="users-table-card">
        {loading ? (
          <div className="users-loading">
            <div className="users-spinner" />
            <span>{t('loadingUsers')}</span>
          </div>
        ) : (
          <>
            <div className="users-table-wrapper">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>{t('colName')}</th>
                    <th>{t('colEmail')}</th>
                    <th>{t('colProfile')}</th>
                    <th>{t('colStatus')}</th>
                    <th>{t('colAvatar')}</th>
                    <th className="text-end">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="users-empty-row">
                        {t('noUsersFound')}
                      </td>
                    </tr>
                  ) : (
                    paginatedUsers.map((user) => {
                      const primaryProfile = getPrimaryProfile(user);
                      return (
                        <tr key={user.id_utilizador}>
                          <td className="users-name-cell">
                            {user.nome} {user.apelido}
                          </td>
                          <td className="users-email-cell">{user.email}</td>
                          <td>
                            <span
                              className="users-profile-badge"
                              style={getProfileStyle(primaryProfile)}
                            >
                              {getProfileLabel(primaryProfile)}
                            </span>
                          </td>
                          <td>
                            {user.conta_ativa ? (
                              <span className="users-status-badge active">
                                {t('statusActive')}
                              </span>
                            ) : (
                              <span className="users-status-badge inactive">
                                {t('statusInactive')}
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '2px 24px' }}>
                            <div className="d-flex align-items-center" style={{ width: '66px', height: '66px' }}>
                              {user.avatar && !failedAvatars[user.id_utilizador] ? (
                                <img 
                                  src={`${API_BASE_URL}/uploads/avatars/${user.avatar}`} 
                                  alt={user.nome} 
                                  className="rounded-circle cursor-pointer"
                                  style={{ width: '66px', height: '66px', objectFit: 'cover', border: '1px solid var(--sidebar-border)' }}
                                  onError={() => handleAvatarError(user.id_utilizador)}
                                  onMouseEnter={(e) => handleAvatarMouseMove(e, `${API_BASE_URL}/uploads/avatars/${user.avatar}`, `${user.nome} ${user.apelido}`)}
                                  onMouseMove={(e) => handleAvatarMouseMove(e, `${API_BASE_URL}/uploads/avatars/${user.avatar}`, `${user.nome} ${user.apelido}`)}
                                  onMouseLeave={handleAvatarMouseLeave}
                                />
                              ) : (
                                <div 
                                  className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center fw-bold"
                                  style={{ 
                                    width: '66px', 
                                    height: '66px', 
                                    fontSize: '1.3rem'
                                  }}
                                >
                                  {`${user.nome?.[0] || 'U'}${user.apelido?.[0] || 'S'}`.toUpperCase()}
                                </div>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="users-actions-cell">
                              <button
                                className="users-action-btn edit"
                                onClick={() => handleEdit(user)}
                                title={t('editBtn')}
                              >
                                <svg viewBox="0 0 24 24">
                                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                </svg>
                                <span>{t('editBtn')}</span>
                              </button>

                              <button
                                className={`users-action-btn ${user.conta_ativa ? 'block' : 'activate'}`}
                                onClick={() => handleToggleStatus(user)}
                                title={user.id_utilizador === '019d6cd2-baad-721b-8e8d-9761f013ceb6' ? 'Este utilizador administrador principal não pode ser desativado.' : (user.conta_ativa ? t('blockUser') : t('activateUser'))}
                                disabled={user.id_utilizador === '019d6cd2-baad-721b-8e8d-9761f013ceb6'}
                                style={user.id_utilizador === '019d6cd2-baad-721b-8e8d-9761f013ceb6' ? { opacity: 0.4, cursor: 'not-allowed' } : {}}
                              >
                                {user.conta_ativa ? (
                                  <>
                                    <svg viewBox="0 0 24 24">
                                      <circle cx="12" cy="12" r="10" />
                                      <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                                    </svg>
                                    <span>{t('blockUser')}</span>
                                  </>
                                ) : (
                                  <>
                                    <svg viewBox="0 0 24 24">
                                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                      <polyline points="22 4 12 14.01 9 11.01" />
                                    </svg>
                                    <span>{t('activateUser')}</span>
                                  </>
                                )}
                              </button>

                              <button
                                className="users-action-btn"
                                style={{
                                  opacity: (user.conta_bloqueada && user.id_utilizador !== '019d6cd2-baad-721b-8e8d-9761f013ceb6') ? 1 : 0.4,
                                  cursor: (user.conta_bloqueada && user.id_utilizador !== '019d6cd2-baad-721b-8e8d-9761f013ceb6') ? 'pointer' : 'not-allowed',
                                  borderColor: (user.conta_bloqueada && user.id_utilizador !== '019d6cd2-baad-721b-8e8d-9761f013ceb6') ? 'var(--primary)' : 'var(--sidebar-border)',
                                  color: (user.conta_bloqueada && user.id_utilizador !== '019d6cd2-baad-721b-8e8d-9761f013ceb6') ? 'var(--primary)' : 'var(--text-muted)',
                                  padding: '4px 8px',
                                  fontSize: '0.75rem'
                                }}
                                disabled={!user.conta_bloqueada || user.id_utilizador === '019d6cd2-baad-721b-8e8d-9761f013ceb6'}
                                onClick={() => handleUnlockStatus(user)}
                                title={user.id_utilizador === '019d6cd2-baad-721b-8e8d-9761f013ceb6' ? 'Este administrador principal não pode ser bloqueado ou desbloqueado.' : (user.conta_bloqueada ? t('unlockUser') : t('accountNotLocked'))}
                              >
                                <svg viewBox="0 0 24 24" style={{ width: 14, height: 14, fill: 'none', stroke: 'currentColor', strokeWidth: 2 }}>
                                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                  <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                                </svg>
                                <span className="ms-1">{t('unlockUser')}</span>
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
            <div className="users-table-footer">
              <span className="users-count-text">
                {t('showingUsers', { shown: paginatedUsers.length, total: filteredUsers.length })}
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
          </>
        )}
      </div>

      {/* Modal: Create / Edit User */}
      {showModal && (
        <>
          <div className="users-modal-overlay" onClick={() => setShowModal(false)} />
          <div className="users-modal" style={{ maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div className="users-modal-header" style={{ flexShrink: 0 }}>
              <h5>{editingUser ? t('editUser') : t('createUser')}</h5>
              <button className="users-modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="users-modal-form" style={{ flexGrow: 1, overflowY: 'auto', padding: '24px' }}>
              <div className="users-form-group">
                <label>{t('colName')} *</label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className={formErrors.nome ? 'error' : ''}
                  placeholder={t('firstNamePlaceholder')}
                />
                {formErrors.nome && <span className="users-form-error">{formErrors.nome}</span>}
              </div>

              <div className="users-form-group">
                <label>{t('lastNameLabel')} *</label>
                <input
                  type="text"
                  value={formData.apelido}
                  onChange={(e) => setFormData(prev => ({ ...prev, apelido: e.target.value }))}
                  className={formErrors.apelido ? 'error' : ''}
                  placeholder={t('lastNamePlaceholder')}
                />
                {formErrors.apelido && <span className="users-form-error">{formErrors.apelido}</span>}
              </div>

              <div className="users-form-group">
                <label>{t('email')} *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={formErrors.email ? 'error' : ''}
                  placeholder={t('emailPlaceholder')}
                />
                {formErrors.email && <span className="users-form-error">{formErrors.email}</span>}
              </div>

              {/* Roles & Access Permissions */}
              <div className="users-form-group my-3 p-3 rounded-3" style={{ backgroundColor: 'var(--panel-2)', border: '1px solid var(--sidebar-border)' }}>
                <label className="fw-bold small mb-2 d-block" style={{ color: 'var(--text)' }}>
                  {t('userRolesTitle')}
                </label>

                <div className="d-flex flex-column gap-2">
                  {/* Consultor (Mandatory Base Profile) */}
                  <div className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                    <div>
                      <strong className="small d-block" style={{ color: 'var(--text)' }}>{PROFILE_NAMES[4]}</strong>
                      <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{t('consultantRoleNote')}</span>
                    </div>
                    <span className="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                      ✓ {t('activeRoleLabel')}
                    </span>
                  </div>

                  {/* Admin Badge if editing an Admin */}
                  {editingUser && (editingUser.perfis || []).some(p => Number(p.id_perfil) === 1) && (
                    <div className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                      <div>
                        <strong className="small d-block" style={{ color: 'var(--text)' }}>{PROFILE_NAMES[1]}</strong>
                        <span className="text-muted small" style={{ fontSize: '0.75rem' }}>{t('adminRoleNote')}</span>
                      </div>
                      <span className="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1 rounded-pill" style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                        {t('activeRoleLabel')}
                      </span>
                    </div>
                  )}

                  {/* Service Line (SLL) Switch */}
                  <div className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                    <div>
                      <strong className="small d-block" style={{ color: 'var(--text)' }}>{t('sllRoleLabel')}</strong>
                    </div>
                    <div className="form-check form-switch m-0 p-0 d-flex align-items-center gap-2">
                      <span className="small fw-semibold" style={{ fontSize: '0.75rem', color: formData.hasSll ? '#16a34a' : '#dc2626' }}>
                        {formData.hasSll ? t('activeRoleLabel') : t('inactiveRoleLabel')}
                      </span>
                      <input
                        className="form-check-input ms-0 cursor-pointer"
                        type="checkbox"
                        role="switch"
                        checked={formData.hasSll}
                        onChange={(e) => setFormData(prev => ({ ...prev, hasSll: e.target.checked }))}
                        style={{
                          width: '2.5em',
                          height: '1.25em',
                          backgroundColor: formData.hasSll ? '#16a34a' : '#dc2626',
                          borderColor: formData.hasSll ? '#15803d' : '#b91c1c',
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e")`,
                          transition: 'all 0.2s ease-in-out'
                        }}
                      />
                    </div>
                  </div>

                  {/* Talent Manager (TM) Switch */}
                  <div className="d-flex align-items-center justify-content-between p-2 rounded-2" style={{ backgroundColor: 'var(--panel)', border: '1px solid var(--sidebar-border)' }}>
                    <div>
                      <strong className="small d-block" style={{ color: 'var(--text)' }}>{t('tmRoleLabel')}</strong>
                    </div>
                    <div className="form-check form-switch m-0 p-0 d-flex align-items-center gap-2">
                      <span className="small fw-semibold" style={{ fontSize: '0.75rem', color: formData.hasTm ? '#16a34a' : '#dc2626' }}>
                        {formData.hasTm ? t('activeRoleLabel') : t('inactiveRoleLabel')}
                      </span>
                      <input
                        className="form-check-input ms-0 cursor-pointer"
                        type="checkbox"
                        role="switch"
                        checked={formData.hasTm}
                        onChange={(e) => setFormData(prev => ({ ...prev, hasTm: e.target.checked }))}
                        style={{
                          width: '2.5em',
                          height: '1.25em',
                          backgroundColor: formData.hasTm ? '#16a34a' : '#dc2626',
                          borderColor: formData.hasTm ? '#15803d' : '#b91c1c',
                          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='-4 -4 8 8'%3e%3ccircle r='3' fill='%23fff'/%3e%3c/svg%3e")`,
                          transition: 'all 0.2s ease-in-out'
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Service Line Pertencente Card (Only in edit mode) */}
              {editingUser && (
                <div className="users-form-group my-3 p-3 rounded-3" style={{ backgroundColor: 'var(--panel-2)', border: '1px solid var(--sidebar-border)' }}>
                  <label className="fw-bold small mb-2 d-block" style={{ color: 'var(--text)' }}>
                    {t('userBelongingSLTitle', 'Service Line Pertencente')}
                  </label>
                  <ServiceLinePertencente selectedSlId={modalSelectedSl} onChange={(val) => setModalSelectedSl(val)} layout="stack" />
                </div>
              )}

              {/* Learning Path -> Service Line -> Area Selection Card (Only in edit mode) */}
              {editingUser && (
                <div className="users-form-group my-3 p-3 rounded-3" style={{ backgroundColor: 'var(--panel-2)', border: '1px solid var(--sidebar-border)' }}>
                  <label className="fw-bold small mb-2 d-block" style={{ color: 'var(--text)' }}>
                    {t('userPreferredAreaTitle', 'Área de Preferência')}
                  </label>
                  <AreaAtuacao selectedAreaId={modalSelectedArea} onChange={(val) => setModalSelectedArea(val)} layout="stack" />
                </div>
              )}

              {/* Service Line Selection Dropdown (Only in create mode, before language) */}
              {!editingUser && (
                <div className="users-form-group">
                  <label>{t('userBelongingSLTitle', 'Service Line Pertencente')}</label>
                  <select
                    value={formData.id_sl || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, id_sl: e.target.value }))}
                  >
                    <option value="">{t('selectSLOption', 'Selecione a Service Line')}</option>
                    {serviceLines.map(sl => (
                      <option key={sl.id_service_line} value={sl.id_service_line}>
                        {sl.service_line || sl.titulo || `Service Line #${sl.id_service_line}`}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="users-form-group">
                <label>{t('language')}</label>
                <select
                  value={formData.idioma_preferencial}
                  onChange={(e) => setFormData(prev => ({ ...prev, idioma_preferencial: e.target.value }))}
                >
                  <option value="pt">Português</option>
                  <option value="en">English</option>
                  <option value="es">Español</option>
                </select>
              </div>
            </form>

            <div className="users-modal-actions" style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid var(--sidebar-border)', backgroundColor: 'var(--panel)', display: 'flex', justifyItems: 'center', justifyContent: 'end', gap: '12px', marginTop: 0 }}>
              <button
                type="button"
                className="users-modal-cancel"
                onClick={() => setShowModal(false)}
              >
                {t('cancelBtn')}
              </button>
              <button
                type="button"
                className="users-modal-submit"
                disabled={submitting}
                onClick={handleSubmit}
              >
                {submitting ? (
                  <div className="users-spinner small" />
                ) : editingUser ? (
                  t('saveChanges')
                ) : (
                  t('createUser')
                )}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Floating 400x400 Avatar Preview Overlay */}
      {previewAvatar && (
        <div
          style={{
            position: 'fixed',
            left: `${previewAvatar.x}px`,
            top: `${previewAvatar.y}px`,
            width: '400px',
            height: '400px',
            zIndex: 9999,
            pointerEvents: 'none',
            borderRadius: '20px',
            overflow: 'hidden',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(255, 255, 255, 0.2)',
            backgroundColor: 'var(--panel, #1e293b)',
            transition: 'transform 0.05s ease-out',
            animation: 'fadeIn 0.15s ease-out'
          }}
        >
          <img
            src={previewAvatar.url}
            alt={previewAvatar.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block'
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              padding: '12px 16px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 70%, transparent 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <span style={{ fontWeight: 600, fontSize: '0.9rem', textShadow: '0 1px 2px rgba(0,0,0,0.6)' }}>
              {previewAvatar.name}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
