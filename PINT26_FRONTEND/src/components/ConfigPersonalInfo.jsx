import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';
import { authStorage } from '../services/authStorage';
import AreaAtuacao from './AreaAtuacao';
import Swal from 'sweetalert2';

// Obter a URL base da API a partir do serviço ou default
const API_BASE_URL = api.defaults.baseURL;

export default function ConfigPersonalInfo() {
  const { t } = useTranslation();
  const { user, setUser, applySession, activeRole } = useAppContext();

  // Estados dos inputs de dados pessoais
  const [nome, setNome] = useState(user?.nome || '');
  const [apelido, setApelido] = useState(user?.apelido || '');
  const [email, setEmail] = useState(user?.email || '');
  
  // Estado da área selecionada (vinculado ao AreaAtuacao)
  const [selectedArea, setSelectedArea] = useState('');

  // Estados para password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de visibilidade de password
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Lógica de Avatar para evitar piscar (onError handling)
  const [avatarError, setAvatarError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const avatarUrl = user?.avatar 
    ? `${API_BASE_URL.replace('/api', '')}/uploads/avatars/${user.avatar}`
    : null;

  useEffect(() => {
    setAvatarError(false);
  }, [user?.avatar]);

  // Buscar o id_area atualizado do utilizador diretamente da BD
  // (mesmo padrão usado em UsersManagement.jsx ao abrir o modal de edição)
  useEffect(() => {
    const fetchUserArea = async () => {
      if (!user?.id_utilizador) return;
      try {
        const res = await api.get(`/utilizador/${user.id_utilizador}`);
        if (res.data?.success && res.data.data?.id_area) {
          setSelectedArea(String(res.data.data.id_area));
        }
      } catch (err) {
        console.error('Erro ao buscar id_area do utilizador:', err);
        // Fallback para os dados locais do token
        const fallbackAreaId = user.id_area || user.area_id;
        if (fallbackAreaId) {
          setSelectedArea(String(fallbackAreaId));
        }
      }
    };

    fetchUserArea();
  }, [user?.id_utilizador]);

  // Função para renovar o token e atualizar a sessão de forma silenciosa
  const refreshSessionSilently = async () => {
    try {
      const res = await api.post('/auth/refresh-token');
      if (res.data?.success) {
        const { token: newToken, utilizador: newUser } = res.data.data;
        authStorage.setToken(newToken);
        authStorage.setUser(newUser);
        
        await applySession({
          token: newToken,
          user: newUser,
          strongestRole: activeRole
        });
      }
    } catch (err) {
      console.error('Erro ao atualizar sessão silenciosamente:', err);
    }
  };

  // Carregamento de nova foto (Real Upload via API)
  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      Swal.fire({
        icon: 'error',
        title: t('invalidFormat', 'Formato Inválido'),
        text: t('photoFormatNotice', 'Apenas ficheiros JPG ou PNG são permitidos.')
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      Swal.fire({
        icon: 'error',
        title: t('fileTooLarge', 'Ficheiro muito grande'),
        text: t('photoSizeNotice', 'O tamanho máximo permitido é de 2MB.')
      });
      return;
    }

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = await api.put(`/utilizador/${user.id_utilizador}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.success) {
        // Renovar a sessão em tempo real para sincronizar o avatar codificado no token
        await refreshSessionSilently();

        Swal.fire({
          icon: 'success',
          title: t('photoUpdatedTitle', 'Foto Atualizada'),
          text: t('photoUpdatedSuccess', 'A sua foto de perfil foi atualizada com sucesso.'),
          timer: 2000,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Erro ao carregar avatar:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('photoUploadError', 'Erro ao carregar a nova foto de perfil.')
      });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleSaveChanges = async (e) => {
    e.preventDefault();

    setSaving(true);

    try {
      const profilePayload = {
        nome,
        apelido,
        email,
        id_area: selectedArea ? Number(selectedArea) : null
      };

      const profileRes = await api.put(`/utilizador/${user.id_utilizador}`, profilePayload);

      // 2. Se houver alteração de password
      if (newPassword) {
        if (!currentPassword) {
          Swal.fire({
            icon: 'warning',
            title: t('missingCurrentPassword', 'Password Atual em falta'),
            text: t('missingCurrentPasswordText', 'Para alterar a sua password, deve introduzir a password atual.')
          });
          setSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          Swal.fire({
            icon: 'error',
            title: t('passwordsDoNotMatch', 'As passwords não coincidem'),
            text: t('passwordsDoNotMatchText', 'A nova password e a confirmação de password devem ser exatamente iguais.')
          });
          setSaving(false);
          return;
        }
        if (newPassword.length < 15) {
          Swal.fire({
            icon: 'warning',
            title: t('passwordTooShort', 'Password muito curta'),
            text: t('passwordLengthNotice', 'A nova password deve conter pelo menos 15 caracteres.')
          });
          setSaving(false);
          return;
        }

        // Chamar rota correta de alteração de password
        await api.post('/auth/change-default-password', {
          email: user.email,
          current_password: currentPassword,
          new_password: newPassword,
          confirm_new_password: confirmPassword
        });
      }

      if (profileRes.data?.success) {
        // Renovar a sessão em tempo real para sincronizar os dados codificados no token
        await refreshSessionSilently();

        Swal.fire({
          icon: 'success',
          title: t('profileUpdatedTitle', 'Perfil Atualizado'),
          text: t('profileUpdatedSuccess', 'Os seus dados foram guardados com sucesso.'),
          timer: 2000,
          showConfirmButton: false
        });

        // Limpar campos de password
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('profileUpdateError', 'Erro ao atualizar os dados do perfil.')
      });
    } finally {
      setSaving(false);
    }
  };

  const initials = `${user?.nome?.[0] || 'U'}${user?.apelido?.[0] || 'S'}`.toUpperCase();

  return (
    <div className="card-body p-0 mt-3">
      <form onSubmit={handleSaveChanges} className="d-flex flex-column gap-4">
        
        {/* Foto de Perfil */}
        <div className="d-flex align-items-center gap-4 flex-wrap">
          <div className="position-relative">
            {avatarUrl && !avatarError ? (
              <img
                src={avatarUrl}
                alt="Profile avatar"
                className="rounded-circle border"
                style={{ width: '96px', height: '96px', objectFit: 'cover' }}
                onError={() => setAvatarError(true)}
              />
            ) : (
              <div 
                className="rounded-circle border d-flex align-items-center justify-content-center bg-primary text-white fw-bold"
                style={{ width: '96px', height: '96px', fontSize: '2rem' }}
              >
                {initials}
              </div>
            )}
          </div>
          <div>
            <label className="btn btn-outline-secondary btn-sm fw-semibold mb-2" style={{ borderRadius: '8px', cursor: 'pointer' }}>
              {uploadingPhoto ? t('uploading', 'A carregar...') : t('changePhotoBtn', 'Alterar Foto')}
              <input type="file" onChange={handlePhotoChange} className="d-none" accept="image/jpeg,image/png" disabled={uploadingPhoto} />
            </label>
            <p className="text-muted small mb-0">JPG, PNG. {t('maxPhotoSize', 'Máximo 2MB')}</p>
          </div>
        </div>

        <hr className="my-1" style={{ borderColor: '#e2e8f0' }} />

        {/* Inputs de Dados Pessoais com i18n */}
        <div className="row g-3">
          <div className="col-12 col-md-6">
            <div className="users-form-group">
              <label className="form-label fw-bold small text-muted mb-1">{t('colName', 'Nome')}</label>
              <input
                type="text"
                className="form-control"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
                style={{ borderRadius: '8px' }}
              />
            </div>
          </div>

          <div className="col-12 col-md-6">
            <div className="users-form-group">
              <label className="form-label fw-bold small text-muted mb-1">{t('lastNameLabel', 'Apelido')}</label>
              <input
                type="text"
                className="form-control"
                value={apelido}
                onChange={(e) => setApelido(e.target.value)}
                required
                style={{ borderRadius: '8px' }}
              />
            </div>
          </div>

          <div className="col-12 col-md-12">
            <div className="users-form-group">
              <label className="form-label fw-bold small text-muted mb-1">{t('colEmail', 'Email')}</label>
              <input
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ borderRadius: '8px' }}
              />
            </div>
          </div>
        </div>

        <hr className="my-1" style={{ borderColor: '#e2e8f0' }} />

        {/* Seleção em Cadeia de Área de Preferência usando o componente reutilizável */}
        <div>
          <h6 className="fw-bold mb-3">{t('preferredAreaTitle', 'Área de Preferência')}</h6>
          <AreaAtuacao selectedAreaId={selectedArea} onChange={(val) => setSelectedArea(val)} />
        </div>

        <hr className="my-1" style={{ borderColor: '#e2e8f0' }} />

        {/* Alterar Password */}
        <div>
          <h6 className="fw-bold mb-3">{t('changePasswordTitle', 'Alterar Password')}</h6>
          <div className="row g-3">
            
            {/* Password Atual */}
            <div className="col-12">
              <div className="users-form-group">
                <label className="form-label fw-bold small text-muted mb-1">{t('fieldCurrentPassword', 'Password Atual')}</label>
                <div className="position-relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    className="form-control pe-5"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    style={{ borderRadius: '8px' }}
                    placeholder={t('currentPassPlaceholder', 'Introduza a password atual para efetuar alterações')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent pe-3"
                    style={{ zIndex: 5 }}
                  >
                    {showCurrentPass ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Nova Password */}
            <div className="col-12 col-md-6">
              <div className="users-form-group">
                <label className="form-label fw-bold small text-muted mb-1">{t('fieldNewPassword', 'Nova Password')}</label>
                <div className="position-relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    className="form-control pe-5"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{ borderRadius: '8px' }}
                    placeholder={t('passwordMinLengthNotice', 'Mínimo de 15 caracteres')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent pe-3"
                    style={{ zIndex: 5 }}
                  >
                    {showNewPass ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Confirmar Password */}
            <div className="col-12 col-md-6">
              <div className="users-form-group">
                <label className="form-label fw-bold small text-muted mb-1">{t('fieldConfirmPassword', 'Confirmar Password')}</label>
                <div className="position-relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    className="form-control pe-5"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{ borderRadius: '8px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="btn position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent pe-3"
                    style={{ zIndex: 5 }}
                  >
                    {showConfirmPass ? (
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Ações */}
        <div className="d-flex justify-content-end gap-3 mt-2">
          <button
            type="submit"
            className="btn btn-primary fw-bold px-4 py-2"
            disabled={saving}
            style={{ borderRadius: '8px' }}
          >
            {saving ? t('saving', 'A guardar...') : t('saveChangesBtn', 'Guardar Alterações')}
          </button>
        </div>

      </form>
    </div>
  );
}
