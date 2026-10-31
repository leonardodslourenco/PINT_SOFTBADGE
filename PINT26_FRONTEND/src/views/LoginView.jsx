import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { authController } from '../controllers/authController';
import { useAppContext } from '../context/AppContext';
import { authStorage } from '../services/authStorage';
import Swal from 'sweetalert2';
import { api, getLandingPageURL } from '../services/api';

export default function LoginView() {
  const { t } = useTranslation();
  const { applySession, theme, setTheme, language, setLanguage } = useAppContext();
  const navigate = useNavigate();

  // Estados principais de credenciais e controlo de passos
  const [step, setStep] = useState('login'); // 'login' | 'verify-code' | 'change-password' | 'credentials-expired'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados específicos para Passo 2 (Confirmação de Código de E-mail)
  const [emailVerificationToken, setEmailVerificationToken] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Estados específicos para Passo 3 (Alteração Obrigatória de Password)
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Estado específico para Desafios Expirados (Token Expirado)
  const [recoveryChallengeToken, setRecoveryChallengeToken] = useState('');

  const bgStyle = useMemo(() => ({ minHeight: '100vh' }), []);

  useEffect(() => {
    // Se o utilizador fechou ou recarregou na fase de mudança de password
    const forcePasswordChange = localStorage.getItem('softbadge_force_password_change') === 'true';
    if (forcePasswordChange) {
      setStep('change-password');
      const savedEmail = localStorage.getItem('softbadge_temp_email') || '';
      setEmail(savedEmail);
    } else {
      const savedEmail = localStorage.getItem('remembered_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setRememberMe(true);
      }
    }
  }, []);

  const handlePasswordRecovery = async (e) => {
    e.preventDefault();
    const { value: emailInput } = await Swal.fire({
      title: t('recoveryTitle'),
      input: 'email',
      inputLabel: t('recoveryEmailLabel'),
      inputPlaceholder: 'exemplo@empresa.com',
      showCancelButton: true,
      confirmButtonText: t('yesBtn', 'Confirmar'),
      cancelButtonText: t('cancelBtn', 'Cancelar'),
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
      inputValidator: (value) => {
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return t('invalidEmail');
        }
      }
    });

    if (emailInput) {
      Swal.fire({
        title: t('saving'),
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      try {
        const res = await api.post('/auth/request-password-recovery', { email: emailInput });
        if (res.data?.success) {
          // Sinaliza localmente que o utilizador iniciou um fluxo de recuperação (e não de primeiro acesso)
          localStorage.setItem('softbadge_is_recovery', 'true');
          Swal.fire({
            icon: 'success',
            title: t('successTitle', 'Sucesso'),
            text: res.data?.message || t('recoverySuccess')
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Erro',
            text: res.data?.message || t('recoveryError')
          });
        }
      } catch (err) {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Erro',
          text: err.response?.data?.message || t('recoveryError')
        });
      }
    }
  };

  const cancelOnboarding = () => {
    // Limpeza absoluta de dados temporários do browser conforme requerido
    localStorage.removeItem('softbadge_force_password_change');
    localStorage.removeItem('softbadge_temp_password');
    localStorage.removeItem('softbadge_temp_email');
    localStorage.removeItem('softbadge_is_recovery');
    localStorage.removeItem('softbadge_token');
    localStorage.removeItem('softbadge_user');
    localStorage.removeItem('softbadge_active_role');
    sessionStorage.clear();
    
    // Reset de estado local
    setStep('login');
    setEmail('');
    setPassword('');
    setError('');
    setVerificationCode('');
    setNewPassword('');
    setConfirmNewPassword('');
    setRecoveryChallengeToken('');
    setShowPassword(false);
    setShowNewPassword(false);
    setShowConfirmNewPassword(false);
  };

  const onLoginSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (rememberMe) {
        localStorage.setItem('remembered_email', email);
      } else {
        localStorage.removeItem('remembered_email');
      }

      const result = await authController.login({ email, password });
      
      if (result.blockedAction === 'EMAIL_VERIFICATION_REQUIRED') {
        setEmailVerificationToken(result.raw?.data?.email_verification_token);
        setStep('verify-code');
        return;
      }

      if (result.blockedAction === 'RECOVERY_TEMP_EXPIRED') {
        setRecoveryChallengeToken(result.raw?.data?.recovery_challenge_token);
        setStep('credentials-expired');
        return;
      }

      if (result.blockedAction === 'RECOVERY_CANCEL_CONFIRMATION_REQUIRED') {
        const challengeToken = result.raw?.data?.recovery_challenge_token;
        Swal.fire({
          icon: 'question',
          title: t('cancelRecoveryPromptTitle'),
          text: t('cancelRecoveryPromptText'),
          showCancelButton: true,
          confirmButtonText: t('cancelRecoveryConfirmBtn'),
          cancelButtonText: t('cancelRecoveryCancelBtn'),
          confirmButtonColor: '#0284c7',
          cancelButtonColor: '#64748b',
          allowOutsideClick: false
        }).then(async (swalResult) => {
          if (swalResult.isConfirmed) {
            setLoading(true);
            try {
              const cancelRes = await api.post('/auth/cancel-recovery', {
                recovery_challenge_token: challengeToken
              });
              if (cancelRes.data?.success) {
                Swal.fire({
                  icon: 'success',
                  title: t('successTitle', 'Sucesso'),
                  text: t('cancelRecoverySuccess'),
                  timer: 2000,
                  showConfirmButton: false
                });

                const sessionData = cancelRes.data.data;
                const sessionResult = {
                  token: sessionData.token,
                  user: sessionData.utilizador,
                  strongestRole: authController.getStrongestRole(sessionData.utilizador?.perfis || [])
                };
                
                await applySession(sessionResult);
                navigate('/app', { replace: true });
              }
            } catch (cancelErr) {
              console.error(cancelErr);
              const backendMsg = cancelErr.response?.data?.message;
              setError(backendMsg || t('cancelRecoveryError'));
            } finally {
              setLoading(false);
            }
          }
        });
        return;
      }

      if (result.blockedAction) {
        setError(t('blockedFlow'));
        return;
      }

      // Se a conta já estiver verificada mas exigir alteração de password (Primeiro Login padrão)
      if (result.raw?.data?.force_password_change) {
        localStorage.setItem('softbadge_force_password_change', 'true');
        localStorage.setItem('softbadge_temp_email', email);
        localStorage.setItem('softbadge_temp_password', password);
        await applySession(result);
        setStep('change-password');
      } else {
        await applySession(result);
        navigate('/app', { replace: true });
      }
    } catch (err) {
      const backendMessage = err?.response?.data?.message;
      if (!err?.response) {
        setError('Falha de ligação ao backend (CORS/servidor). Verifique se frontend e/ou backend está/ão operacionais neste momento ou se as portas estão bem configuradas.');
      } else {
        setError(backendMessage || t('invalidCredentials'));
      }
    } finally {
      setLoading(false);
    }
  };

  const onVerifyEmail = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-email-code', {
        email_verification_token: emailVerificationToken,
        email_code: verificationCode
      });
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso'),
          text: t('verificationSuccess'),
          timer: 2000,
          showConfirmButton: false
        });
        
        // Efetua login automático em background
        const loginResult = await authController.login({ email, password });
        
        if (loginResult.raw?.data?.force_password_change) {
          localStorage.setItem('softbadge_force_password_change', 'true');
          localStorage.setItem('softbadge_temp_email', email);
          localStorage.setItem('softbadge_temp_password', password);
          await applySession(loginResult);
          setStep('change-password');
        } else {
          await applySession(loginResult);
          navigate('/app', { replace: true });
        }
      }
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.message;
      setError(backendMsg || 'Erro ao verificar código de e-mail.');
    } finally {
      setLoading(false);
    }
  };

  const onResendCode = async () => {
    setError('');
    Swal.fire({
      title: t('saving', 'A processar...'),
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      }
    });
    try {
      const res = await api.post('/auth/resend-email-verification-code', {
        email_verification_token: emailVerificationToken
      });
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Enviado'),
          text: res.data?.message || 'Novo código de verificação enviado com sucesso para o seu e-mail.'
        });
      }
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Erro',
        text: err.response?.data?.message || 'Erro ao reenviar código.'
      });
    }
  };

  // Reenvio de credenciais para novos utilizadores (Passo 2 ou Passo Expirado de Onboarding)
  const onResendNewUserCredentials = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/resend-new-user-credentials', {
        email
      });
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso'),
          text: res.data?.message || 'Novas credenciais de primeiro acesso enviadas para o seu e-mail.',
          timer: 3000,
          showConfirmButton: false
        });
        cancelOnboarding(); // Limpa estados e volta a login para aguardar novas credenciais
      }
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.message;
      setError(backendMsg || 'Erro ao reenviar novas credenciais.');
    } finally {
      setLoading(false);
    }
  };

  // Reenvio de password temporária para fluxo de recuperação de password expirada
  const onResendRecoveryPassword = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/resend-recovery-password', {
        recovery_challenge_token: recoveryChallengeToken
      });
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso'),
          text: res.data?.message || 'Nova password temporária de recuperação enviada para o seu e-mail.',
          timer: 3000,
          showConfirmButton: false
        });
        cancelOnboarding();
      }
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.message;
      setError(backendMsg || 'Erro ao reenviar password temporária.');
    } finally {
      setLoading(false);
    }
  };

  const onChangePasswordSubmit = async (event) => {
    event.preventDefault();
    setError('');
    
    if (newPassword.length < 15) {
      setError(t('passwordMinLengthError'));
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError(t('passwordsDoNotMatch'));
      return;
    }
    
    setLoading(true);
    try {
      const currentPassword = password || localStorage.getItem('softbadge_temp_password');
      const res = await api.post('/auth/change-default-password', {
        email,
        current_password: currentPassword,
        new_password: newPassword,
        confirm_new_password: confirmNewPassword
      });
      
      if (res.data?.success) {
        Swal.fire({
          icon: 'success',
          title: t('successTitle', 'Sucesso'),
          text: t('passwordChangeSuccess'),
          timer: 2000,
          showConfirmButton: false
        });
        
        // Remove as chaves temporárias de controlo
        localStorage.removeItem('softbadge_force_password_change');
        localStorage.removeItem('softbadge_temp_password');
        localStorage.removeItem('softbadge_temp_email');
        localStorage.removeItem('softbadge_is_recovery');
        
        const { token: finalToken } = res.data.data;
        const loggedUser = authStorage.getUser() || { email };
        
        const sessionPayload = {
          token: finalToken,
          user: loggedUser,
          strongestRole: authStorage.getActiveRole()
        };
        await applySession(sessionPayload);
        
        navigate('/app', { replace: true });
      }
    } catch (err) {
      console.error(err);
      const backendMsg = err.response?.data?.message;
      setError(backendMsg || 'Erro ao alterar a password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center app-bg" style={bgStyle}>
      <div className="card shadow-lg p-4 login-card">
        {/* Seletor de Idioma e Tema */}
        <div className="d-flex gap-2 justify-content-end mb-3">
          <select className="form-select form-select-sm login-select" value={language} onChange={(e) => setLanguage(e.target.value)}>
            <option value="pt">PT</option><option value="en">EN</option><option value="es">ES</option>
          </select>
          <button className="btn btn-sm btn-outline-secondary" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} type="button">
            {theme === 'dark' ? t('light') : t('dark')}
          </button>
        </div>

        {/* PASSO 1: LOGIN NORMAL */}
        {step === 'login' && (
          <>
            <h3 className="mb-3 text-center">{t('loginTitle')}</h3>
            <form onSubmit={onLoginSubmit}>
              <div className="mb-3">
                <label className="form-label">{t('email')}</label>
                <input className="form-control" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="mb-3">
                <label className="form-label">{t('password')}</label>
                <div className="input-group">
                  <input 
                    className="form-control" 
                    type={showPassword ? "text" : "password"} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    required 
                    style={{ borderRight: 'none' }}
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ borderLeft: 'none', backgroundColor: 'var(--panel)', color: 'var(--text-muted)' }}
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a8.8 8.8 0 0 0-2.79.444l.746.893C6.702 3.618 7.33 3.5 8 3.5c4.12 0 7.37 3.328 8.01 4.5-.472.868-1.572 2.333-3.084 3.682l.747.893zM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0m-4 8 12.802-12.802c.23-.23.6-.23.83 0 .23.23.23.6 0 .83l-1.34 1.34C14.398 6.544 15 8 15 8s-3 5.5-8 5.5c-1.536 0-2.883-.342-3.957-.91l-1.2 1.2a.584.584 0 0 1-.83 0 .584.584 0 0 1 0-.83l1.34-1.34C1.602 11.456 1 10 1 8s3-5.5 8-5.5c1.536 0 2.883.342 3.957.91l1.2-1.2c.23-.23.6-.23.83 0M4.17 10.63a7.7 7.7 0 0 0 3.83.87 7.7 7.7 0 0 0 3.83-.87l-.92-.92A1.498 1.498 0 0 1 8 9.5a1.498 1.498 0 0 1-2.08-.21l-.92.92z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3 small">
                <div className="form-check">
                  <input 
                    type="checkbox" 
                    className="form-check-input cursor-pointer" 
                    id="rememberMe" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)} 
                  />
                  <label className="form-check-label cursor-pointer" htmlFor="rememberMe">
                    {t('rememberMe')}
                  </label>
                </div>
                <a 
                  href="#" 
                  onClick={handlePasswordRecovery} 
                  className="text-decoration-none"
                  style={{ color: 'var(--primary)' }}
                >
                  {t('forgotPassword')}
                </a>
              </div>
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              <button className="btn btn-primary w-100 mb-2" disabled={loading} type="submit">{loading ? '...' : t('signIn')}</button>
              <button 
                type="button" 
                className="btn btn-outline-secondary w-100" 
                onClick={() => window.location.href = getLandingPageURL()}
              >
                {t('backToLandingPage')}
              </button>
            </form>
          </>
        )}

        {/* PASSO 2: CONFIRMAÇÃO DE CÓDIGO DE E-MAIL */}
        {step === 'verify-code' && (
          <>
            <h3 className="mb-2 text-center">{t('verificationTitle')}</h3>
            <p className="text-muted text-center small mb-3">{t('verificationSubtitle')}</p>
            <form onSubmit={onVerifyEmail}>
              <div className="mb-3">
                <label className="form-label">{t('verificationCodeLabel')}</label>
                <input 
                  className="form-control text-center fw-bold fs-5 letter-spacing-lg" 
                  type="text" 
                  maxLength={10} 
                  placeholder="XXXXXXXXXX" 
                  value={verificationCode} 
                  onChange={(e) => setVerificationCode(e.target.value)} 
                  required 
                />
              </div>
              
              {error ? <div className="alert alert-danger py-2">{error}</div> : null}
              
              <button className="btn btn-primary w-100 mb-2" disabled={loading} type="submit">
                {loading ? '...' : t('verifyBtn')}
              </button>
              
              <div className="d-flex justify-content-between gap-2 mt-3">
                <button 
                  type="button" 
                  className="btn btn-link text-decoration-none text-muted p-0 small" 
                  onClick={onResendCode}
                >
                  {t('resendCodeBtn')}
                </button>
                <button 
                  type="button" 
                  className="btn btn-link text-decoration-none text-danger p-0 small" 
                  onClick={cancelOnboarding}
                >
                  {t('cancelActivationBtn')}
                </button>
              </div>
            </form>
          </>
        )}

        {/* PASSO 3: ALTERAÇÃO OBRIGATÓRIA DE PASSWORD */}
        {step === 'change-password' && (
          <>
            <h3 className="mb-2 text-center">{t('changePasswordTitle')}</h3>
            <p className="text-muted text-center small mb-3">{t('changePasswordSubtitle')}</p>
            <form onSubmit={onChangePasswordSubmit}>
              <div className="mb-3">
                <label className="form-label">{t('newPasswordLabel')}</label>
                <div className="input-group">
                  <input 
                    className="form-control" 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    required 
                    style={{ borderRight: 'none' }}
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ borderLeft: 'none', backgroundColor: 'var(--panel)', color: 'var(--text-muted)' }}
                  >
                    {showNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a8.8 8.8 0 0 0-2.79.444l.746.893C6.702 3.618 7.33 3.5 8 3.5c4.12 0 7.37 3.328 8.01 4.5-.472.868-1.572 2.333-3.084 3.682l.747.893zM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0m-4 8 12.802-12.802c.23-.23.6-.23.83 0 .23.23.23.6 0 .83l-1.34 1.34C14.398 6.544 15 8 15 8s-3 5.5-8 5.5c-1.536 0-2.883-.342-3.957-.91l-1.2 1.2a.584.584 0 0 1-.83 0 .584.584 0 0 1 0-.83l1.34-1.34C1.602 11.456 1 10 1 8s3-5.5 8-5.5c1.536 0 2.883.342 3.957.91l1.2-1.2c.23-.23.6-.23.83 0M4.17 10.63a7.7 7.7 0 0 0 3.83.87 7.7 7.7 0 0 0 3.83-.87l-.92-.92A1.498 1.498 0 0 1 8 9.5a1.498 1.498 0 0 1-2.08-.21l-.92.92z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                      </svg>
                    )}
                  </button>
                </div>
                <div className="form-text small">
                  {newPassword.length > 0 && newPassword.length < 15 ? (
                    <span className="text-danger">{t('passwordMinLengthError')} ({newPassword.length}/15)</span>
                  ) : newPassword.length >= 15 ? (
                    <span className="text-success">✔ password segura</span>
                  ) : null}
                </div>
              </div>
              
              <div className="mb-3">
                <label className="form-label">{t('confirmPasswordLabel')}</label>
                <div className="input-group">
                  <input 
                    className="form-control" 
                    type={showConfirmNewPassword ? "text" : "password"} 
                    value={confirmNewPassword} 
                    onChange={(e) => setConfirmNewPassword(e.target.value)} 
                    required 
                    style={{ borderRight: 'none' }}
                  />
                  <button 
                    className="btn btn-outline-secondary" 
                    type="button" 
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    style={{ borderLeft: 'none', backgroundColor: 'var(--panel)', color: 'var(--text-muted)' }}
                  >
                    {showConfirmNewPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye-slash" viewBox="0 0 16 16">
                        <path d="M13.359 11.238C15.06 9.72 16 8 16 8s-3-5.5-8-5.5a8.8 8.8 0 0 0-2.79.444l.746.893C6.702 3.618 7.33 3.5 8 3.5c4.12 0 7.37 3.328 8.01 4.5-.472.868-1.572 2.333-3.084 3.682l.747.893zM8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0m-4 8 12.802-12.802c.23-.23.6-.23.83 0 .23.23.23.6 0 .83l-1.34 1.34C14.398 6.544 15 8 15 8s-3 5.5-8 5.5c-1.536 0-2.883-.342-3.957-.91l-1.2 1.2a.584.584 0 0 1-.83 0 .584.584 0 0 1 0-.83l1.34-1.34C1.602 11.456 1 10 1 8s3-5.5 8-5.5c1.536 0 2.883.342 3.957.91l1.2-1.2c.23-.23.6-.23.83 0M4.17 10.63a7.7 7.7 0 0 0 3.83.87 7.7 7.7 0 0 0 3.83-.87l-.92-.92A1.498 1.498 0 0 1 8 9.5a1.498 1.498 0 0 1-2.08-.21l-.92.92z"/>
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-eye" viewBox="0 0 16 16">
                        <path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8M1.173 8a13 13 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5s3.879 1.168 5.168 2.457A13 13 0 0 1 14.828 8q-.086.13-.195.288c-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5s-3.879-1.168-5.168-2.457A13 13 0 0 1 1.172 8z"/>
                        <path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5M4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0"/>
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {error ? <div className="alert alert-danger py-2">{error}</div> : null}

              <button className="btn btn-primary w-100 mb-2" disabled={loading || newPassword.length < 15} type="submit">
                {loading ? '...' : t('changePasswordBtn')}
              </button>

              <div className="text-center mt-3">
                <button 
                  type="button" 
                  className="btn btn-link text-decoration-none text-danger p-0 small" 
                  onClick={cancelOnboarding}
                >
                  {t('cancelActivationBtn')}
                </button>
              </div>
            </form>
          </>
        )}

        {/* PASSO 4: CREDENCIAIS EXPIRADAS (NOVO UTILIZADOR OU RECUPERAÇÃO EXPIRADA) */}
        {step === 'credentials-expired' && (
          <>
            <h3 className="mb-2 text-center text-danger">
              {localStorage.getItem('softbadge_is_recovery') === 'true'
                ? t('recoveryExpiredTitle')
                : t('credentialsExpiredTitle')}
            </h3>
            <p className="text-muted text-center small mb-4">
              {localStorage.getItem('softbadge_is_recovery') === 'true'
                ? t('recoveryExpiredSubtitle')
                : t('credentialsExpiredSubtitle')}
            </p>
            
            {error ? <div className="alert alert-danger py-2">{error}</div> : null}

            <button 
              className="btn btn-primary w-100 mb-2" 
              disabled={loading} 
              onClick={
                localStorage.getItem('softbadge_is_recovery') === 'true'
                  ? onResendRecoveryPassword
                  : onResendNewUserCredentials
              }
            >
              {loading ? '...' : t('resendBtn')}
            </button>

            <div className="text-center mt-3">
              <button 
                type="button" 
                className="btn btn-link text-decoration-none text-danger p-0 small" 
                onClick={cancelOnboarding}
              >
                {t('cancelActivationBtn')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
