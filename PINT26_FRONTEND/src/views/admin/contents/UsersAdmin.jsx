import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../../services/api';
import Swal from 'sweetalert2';

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

export default function UsersAdmin() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [profiles, setProfiles] = useState([]);
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
    idioma_preferencial: 'pt',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

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
  }, [fetchUsers, fetchProfiles]);

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
        u.perfis?.some(p => p.id_perfil === profileId)
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
    const sorted = [...user.perfis].sort((a, b) => a.id_perfil - b.id_perfil);
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

  // Open create modal
  function handleCreate() {
    setEditingUser(null);
    setFormData({ nome: '', apelido: '', email: '', idioma_preferencial: 'pt' });
    setFormErrors({});
    setShowModal(true);
  }

  // Open edit modal
  function handleEdit(user) {
    setEditingUser(user);
    setFormData({
      nome: user.nome || '',
      apelido: user.apelido || '',
      email: user.email || '',
      idioma_preferencial: user.idioma_preferencial || 'pt',
    });
    setFormErrors({});
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
    try {
      if (editingUser) {
        // Update
        await api.put(`/utilizador/${editingUser.id_utilizador}`, formData);
        setUsers(prev => prev.map(u =>
          u.id_utilizador === editingUser.id_utilizador
            ? { ...u, nome: formData.nome, apelido: formData.apelido, email: formData.email, idioma_preferencial: formData.idioma_preferencial }
            : u
        ));
      } else {
        // Create
        const res = await api.post('/utilizador', formData);
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
            ? { ...u, ...formData }
            : u
        ));
      } else {
        const newUser = {
          id_utilizador: `temp-${Date.now()}`,
          ...formData,
          conta_ativa: true,
          perfis: [{ id_perfil: 4, perfil: 'Consultor' }],
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
        <div className="users-search-wrapper">
          <svg className="users-search-icon" viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="users-search-input"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

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
                    <th className="text-end">{t('colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="users-empty-row">
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
                                title={user.conta_ativa ? t('blockUser') : t('activateUser')}
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
                {t('showingUsers')
                  .replace('{shown}', paginatedUsers.length)
                  .replace('{total}', filteredUsers.length)}
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
          <div className="users-modal">
            <div className="users-modal-header">
              <h5>{editingUser ? t('editUser') : t('createUser')}</h5>
              <button className="users-modal-close" onClick={() => setShowModal(false)}>
                <svg viewBox="0 0 24 24">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="users-modal-form">
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
                  disabled={!!editingUser}
                />
                {formErrors.email && <span className="users-form-error">{formErrors.email}</span>}
              </div>

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

              <div className="users-modal-actions">
                <button
                  type="button"
                  className="users-modal-cancel"
                  onClick={() => setShowModal(false)}
                >
                  {t('cancelBtn')}
                </button>
                <button
                  type="submit"
                  className="users-modal-submit"
                  disabled={submitting}
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
            </form>
          </div>
        </>
      )}
    </div>
  );
}