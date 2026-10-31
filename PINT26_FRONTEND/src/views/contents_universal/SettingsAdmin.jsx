import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../../services/api';
import Swal from 'sweetalert2';
import ManualTranslationSwitch from '../../components/ManualTranslationSwitch';
import ConfigPersonalInfo from '../../components/ConfigPersonalInfo';
import ConfigAssinaturaMail from '../../components/ConfigAssinaturaMail';

export default function SettingsAdmin() {
  const { t, i18n } = useTranslation();
  
  // Tab State
  const [activeTab, setActiveTab] = useState('system'); // 'system', 'profile', 'signature'
  const [rgpdTab, setRgpdTab] = useState('geral'); // 'geral' | 'candidatura'

  // RGPD Geral States
  const [geralPt, setGeralPt] = useState('');
  const [geralEn, setGeralEn] = useState('');
  const [geralEs, setGeralEs] = useState('');
  const [originalGeral, setOriginalGeral] = useState({ pt: '', en: '', es: '' });
  const [isEditingGeral, setIsEditingGeral] = useState(false);
  const [isManualGeral, setIsManualGeral] = useState(false);
  const [savingGeral, setSavingGeral] = useState(false);

  // RGPD Candidatura States
  const [candPt, setCandPt] = useState('');
  const [candEn, setCandEn] = useState('');
  const [candEs, setCandEs] = useState('');
  const [originalCand, setOriginalCand] = useState({ pt: '', en: '', es: '' });
  const [isEditingCand, setIsEditingCand] = useState(false);
  const [isManualCand, setIsManualCand] = useState(false);
  const [savingCand, setSavingCand] = useState(false);

  const [loading, setLoading] = useState(true);

  // Other Placeholders
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [forceChangePass, setForceChangePass] = useState(true);

  // Determinar se o perfil atual é Admin e está ativo
  const activeRole = Number(localStorage.getItem('softbadge_active_role'));
  const isAdminActive = activeRole === 1;

  // Carregar dados de RGPD
  const fetchRgpdPolicy = async () => {
    try {
      setLoading(true);
      const res = await api.get('/politica_rgpd');
      if (res.data?.success && res.data?.data) {
        const d = res.data.data;
        const gPt = d.geral_pt || d.txt_pt || '';
        const gEn = d.geral_en || d.txt_en || '';
        const gEs = d.geral_es || d.txt_es || '';
        const cPt = d.candidatura_pt || '';
        const cEn = d.candidatura_en || '';
        const cEs = d.candidatura_es || '';

        setGeralPt(gPt);
        setGeralEn(gEn);
        setGeralEs(gEs);
        setOriginalGeral({ pt: gPt, en: gEn, es: gEs });

        setCandPt(cPt);
        setCandEn(cEn);
        setCandEs(cEs);
        setOriginalCand({ pt: cPt, en: cEn, es: cEs });
      }
    } catch (err) {
      console.error('Erro ao carregar política RGPD:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRgpdPolicy();
  }, []);

  const currentLang = (i18n.language || 'pt').split('-')[0].toLowerCase();

  // Helpers para obter e definir texto do idioma atual
  const getCurrentGeralText = () => {
    if (currentLang === 'en') return geralEn;
    if (currentLang === 'es') return geralEs;
    return geralPt;
  };

  const handleCurrentGeralTextChange = (value) => {
    if (currentLang === 'en') setGeralEn(value);
    else if (currentLang === 'es') setGeralEs(value);
    else setGeralPt(value);
  };

  const getCurrentCandText = () => {
    if (currentLang === 'en') return candEn;
    if (currentLang === 'es') return candEs;
    return candPt;
  };

  const handleCurrentCandTextChange = (value) => {
    if (currentLang === 'en') setCandEn(value);
    else if (currentLang === 'es') setCandEs(value);
    else setCandPt(value);
  };

  const handleCancelGeral = () => {
    setGeralPt(originalGeral.pt);
    setGeralEn(originalGeral.en);
    setGeralEs(originalGeral.es);
    setIsEditingGeral(false);
  };

  const handleCancelCand = () => {
    setCandPt(originalCand.pt);
    setCandEn(originalCand.en);
    setCandEs(originalCand.es);
    setIsEditingCand(false);
  };

  // Guardar Política Geral
  const handleSaveGeral = async () => {
    if (!isAdminActive) return;

    const result = await Swal.fire({
      title: t('confirmUpdateRgpdGeralTitle', 'Atualizar Termos Gerais de RGPD?'),
      text: t('confirmUpdateRgpdGeralText', 'Atenção: Ao alterar a Política Geral de RGPD, o consentimento de todos os utilizadores será revogado no sistema (aceitou_rgpd = false) e será emitida uma notificação em tempo real via WebSocket para todos os clientes conectados. Deseja prosseguir?'),
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b',
      confirmButtonText: t('yesSaveAndNotifyBtn', 'Sim, Guardar e Notificar'),
      cancelButtonText: t('cancelBtn', 'Cancelar')
    });

    if (!result.isConfirmed) return;

    try {
      setSavingGeral(true);

      const payload = {
        tipo: 'geral',
        texto: isManualGeral ? { pt: geralPt, en: geralEn, es: geralEs } : getCurrentGeralText()
      };

      const res = await api.put('/politica_rgpd', payload);

      if (res.data?.success) {
        const d = res.data.data;
        if (d) {
          setGeralPt(d.geral_pt || geralPt);
          setGeralEn(d.geral_en || geralEn);
          setGeralEs(d.geral_es || geralEs);
          setOriginalGeral({ pt: d.geral_pt || geralPt, en: d.geral_en || geralEn, es: d.geral_es || geralEs });
        }
        setIsEditingGeral(false);

        Swal.fire({
          icon: 'success',
          title: t('rgpdUpdatedTitle', 'Política Geral Atualizada'),
          text: t('rgpdGeralSavedSuccess', 'Termos gerais guardados com sucesso. O consentimento foi reposto para todos os utilizadores e o aviso em tempo real foi transmitido via WebSocket.'),
          timer: 2500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Erro ao salvar política RGPD Geral:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('errorSavingRgpd', 'Erro ao guardar a política de RGPD Geral.')
      });
    } finally {
      setSavingGeral(false);
    }
  };

  // Guardar Política de Candidatura
  const handleSaveCand = async () => {
    if (!isAdminActive) return;

    try {
      setSavingCand(true);

      const payload = {
        tipo: 'candidatura',
        texto: isManualCand ? { pt: candPt, en: candEn, es: candEs } : getCurrentCandText()
      };

      const res = await api.put('/politica_rgpd', payload);

      if (res.data?.success) {
        const d = res.data.data;
        if (d) {
          setCandPt(d.candidatura_pt || candPt);
          setCandEn(d.candidatura_en || candEn);
          setCandEs(d.candidatura_es || candEs);
          setOriginalCand({ pt: d.candidatura_pt || candPt, en: d.candidatura_en || candEn, es: d.candidatura_es || candEs });
        }
        setIsEditingCand(false);

        Swal.fire({
          icon: 'success',
          title: t('rgpdUpdatedTitle', 'Política de Candidatura Atualizada'),
          text: t('rgpdCandSavedSuccess', 'Termos de candidatura guardados com sucesso e notificação emitida via WebSocket.'),
          timer: 2500,
          showConfirmButton: false
        });
      }
    } catch (err) {
      console.error('Erro ao salvar política RGPD Candidatura:', err);
      Swal.fire({
        icon: 'error',
        title: t('error', 'Erro'),
        text: err.response?.data?.message || t('errorSavingRgpd', 'Erro ao guardar a política de RGPD de Candidatura.')
      });
    } finally {
      setSavingCand(false);
    }
  };

  if (loading) {
    return (
      <div className="users-admin-container d-flex flex-column align-items-center justify-content-center p-5">
        <div className="users-spinner mb-3" />
        <span className="text-muted">{t('loading', 'A carregar definições do sistema...')}</span>
      </div>
    );
  }

  return (
    <div className="users-admin-container">
      {/* Title */}
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
          {t('menuSettings', 'Configurações')}
        </h3>
        <p className="text-muted small mb-0">
          {t('settingsSubtitleAdmin', 'Gerencie as definições globais do sistema, políticas de RGPD, informações pessoais e assinatura de e-mail')}
        </p>
      </div>

      {/* Main Tabs List */}
      <div className="card border-0 shadow-sm rounded-4 p-4" style={{ backgroundColor: 'var(--panel)' }}>
        <ul className="nav nav-pills mb-3 border-bottom pb-2" id="settingsTabs" role="tablist" style={{ borderColor: 'var(--sidebar-border)' }}>
          <li className="nav-item" role="presentation">
            <button
              className={`nav-link fw-bold px-4 py-2 ${activeTab === 'system' ? 'active btn-primary' : 'text-secondary'}`}
              type="button"
              onClick={() => setActiveTab('system')}
              style={{ borderRadius: '8px', fontSize: '0.9rem' }}
            >
              ⚙️ {t('systemSettingsTab', 'Definições do Sistema')}
            </button>
          </li>
          <li className="nav-item ms-2" role="presentation">
            <button
              className={`nav-link fw-bold px-4 py-2 ${activeTab === 'profile' ? 'active btn-primary' : 'text-secondary'}`}
              type="button"
              onClick={() => setActiveTab('profile')}
              style={{ borderRadius: '8px', fontSize: '0.9rem' }}
            >
              👤 {t('myProfileTab', 'O Meu Perfil')}
            </button>
          </li>
          <li className="nav-item ms-2" role="presentation">
            <button
              className={`nav-link fw-bold px-4 py-2 ${activeTab === 'signature' ? 'active btn-primary' : 'text-secondary'}`}
              type="button"
              onClick={() => setActiveTab('signature')}
              style={{ borderRadius: '8px', fontSize: '0.9rem' }}
            >
              ✉️ {t('emailSignatureTab', 'Assinatura Digital')}
            </button>
          </li>
        </ul>

        {/* Tabs Content */}
        <div className="tab-content">
          {activeTab === 'system' && (
            <div className="d-flex flex-column gap-4 mt-3">
              {/* RGPD Policy Multi-Tab Card */}
              <div 
                className="card border-0 shadow-sm p-4 rounded-4" 
                style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}
              >
                <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                  <div>
                    <h5 className="fw-bold mb-1" style={{ color: 'var(--text)' }}>
                      🛡️ {t('rgpdPoliciesCardTitle', 'Gestão de Políticas de Privacidade (RGPD)')}
                    </h5>
                    <p className="text-muted small mb-0">
                      {t('rgpdPoliciesCardSubtitle', 'Configure os textos oficiais das políticas de RGPD Geral da plataforma e de divulgação de Candidaturas.')}
                    </p>
                  </div>
                  
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-primary bg-opacity-10 text-primary border-0 px-2.5 py-1.5 rounded-pill small fw-bold">
                      📡 WebSocket Live Sync
                    </span>
                  </div>
                </div>

                {/* Sub-Tabs for Geral vs Candidatura */}
                <div 
                  className="d-flex gap-2 p-1.5 rounded-3 border mb-3"
                  style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)', width: 'fit-content' }}
                >
                  <button
                    type="button"
                    className={`btn btn-sm px-3.5 py-1.5 rounded-2 fw-bold d-flex align-items-center gap-1.5 border-0 transition-all ${
                      rgpdTab === 'geral' ? 'btn-primary shadow-xs' : 'btn-ghost text-muted'
                    }`}
                    onClick={() => setRgpdTab('geral')}
                    style={{
                      backgroundColor: rgpdTab === 'geral' ? 'var(--primary)' : 'transparent',
                      color: rgpdTab === 'geral' ? '#ffffff' : 'var(--text-muted)'
                    }}
                  >
                    <span>🛡️</span>
                    {t('tabRgpdGeral', 'Política RGPD Geral')}
                  </button>

                  <button
                    type="button"
                    className={`btn btn-sm px-3.5 py-1.5 rounded-2 fw-bold d-flex align-items-center gap-1.5 border-0 transition-all ${
                      rgpdTab === 'candidatura' ? 'btn-primary shadow-xs' : 'btn-ghost text-muted'
                    }`}
                    onClick={() => setRgpdTab('candidatura')}
                    style={{
                      backgroundColor: rgpdTab === 'candidatura' ? 'var(--primary)' : 'transparent',
                      color: rgpdTab === 'candidatura' ? '#ffffff' : 'var(--text-muted)'
                    }}
                  >
                    <span>🌐</span>
                    {t('tabRgpdCandidatura', 'Política RGPD de Candidatura')}
                  </button>
                </div>

                {/* --- Sub-Tab 1: RGPD Geral --- */}
                {rgpdTab === 'geral' && (
                  <div className="p-3.5 rounded-4 border bg-white shadow-2xs" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                      <div>
                        <h6 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>
                          {t('rgpdGeralScopeTitle', 'Âmbito de Tratamento de Dados — Plataforma Interna')}
                        </h6>
                        <span className="text-muted small">
                          {t('rgpdGeralScopeSubtitle', 'Apresentado aos colaboradores no pós-login e no menu RGPD.')}
                        </span>
                      </div>

                      {isEditingGeral && (
                        <ManualTranslationSwitch
                          checked={isManualGeral}
                          onChange={(val) => setIsManualGeral(val)}
                          disabled={!isAdminActive}
                          id="manualTranslateGeralSwitch"
                        />
                      )}
                    </div>

                    {/* Text Inputs */}
                    <div className="users-form-group mb-3">
                      {!isEditingGeral ? (
                        <div 
                          className="p-3.5 rounded-3 border"
                          style={{ 
                            backgroundColor: 'var(--panel-2)', 
                            borderColor: 'var(--sidebar-border)',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            color: 'var(--text)',
                            whiteSpace: 'pre-line',
                            minHeight: '110px'
                          }}
                        >
                          {getCurrentGeralText() || <span className="text-muted fst-italic">{t('noRgpdTextAvailable', 'Sem texto configurado.')}</span>}
                        </div>
                      ) : !isManualGeral ? (
                        <textarea
                          className="form-control"
                          rows="5"
                          value={getCurrentGeralText()}
                          onChange={(e) => handleCurrentGeralTextChange(e.target.value)}
                          disabled={!isAdminActive || savingGeral}
                          placeholder={t('rgpdPlaceholder', { lng: i18n.language })}
                          style={{ fontSize: '0.9rem', borderRadius: '8px' }}
                        />
                      ) : (
                        <div className="d-flex flex-column gap-2 p-2 border rounded-3 bg-white" style={{ borderColor: 'var(--sidebar-border)' }}>
                          <div className="input-group input-group-sm align-items-start">
                            <span className="input-group-text fw-bold pt-2" style={{ width: '65px', minHeight: '94px', justifyContent: 'center' }}>🇵🇹 PT</span>
                            <textarea
                              className="form-control"
                              rows="4"
                              value={geralPt}
                              onChange={(e) => setGeralPt(e.target.value)}
                              disabled={!isAdminActive || savingGeral}
                              placeholder={t('rgpdPlaceholder', { lng: 'pt' })}
                              style={{ fontSize: '0.9rem' }}
                            />
                          </div>

                          <div className="input-group input-group-sm align-items-start">
                            <span className="input-group-text fw-bold pt-2" style={{ width: '65px', minHeight: '94px', justifyContent: 'center' }}>🇬🇧 EN</span>
                            <textarea
                              className="form-control"
                              rows="4"
                              value={geralEn}
                              onChange={(e) => setGeralEn(e.target.value)}
                              disabled={!isAdminActive || savingGeral}
                              placeholder={t('rgpdPlaceholder', { lng: 'en' })}
                              style={{ fontSize: '0.9rem' }}
                            />
                          </div>

                          <div className="input-group input-group-sm align-items-start">
                            <span className="input-group-text fw-bold pt-2" style={{ width: '65px', minHeight: '94px', justifyContent: 'center' }}>🇪🇸 ES</span>
                            <textarea
                              className="form-control"
                              rows="4"
                              value={geralEs}
                              onChange={(e) => setGeralEs(e.target.value)}
                              disabled={!isAdminActive || savingGeral}
                              placeholder={t('rgpdPlaceholder', { lng: 'es' })}
                              style={{ fontSize: '0.9rem' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for Geral */}
                    {isAdminActive && (
                      <div className="d-flex justify-content-end gap-2">
                        {!isEditingGeral ? (
                          <button
                            type="button"
                            className="btn btn-outline-primary fw-semibold px-3 py-1.5 rounded-3 d-inline-flex align-items-center gap-1.5"
                            onClick={() => setIsEditingGeral(true)}
                            style={{ fontSize: '0.85rem' }}
                          >
                            <span>✏️</span> {t('editRgpdBtn', 'Editar Política Geral')}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary fw-semibold px-3 py-1.5 rounded-3"
                              disabled={savingGeral}
                              onClick={handleCancelGeral}
                              style={{ fontSize: '0.85rem' }}
                            >
                              {t('cancelBtn', 'Cancelar')}
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary fw-bold px-3.5 py-1.5 rounded-3 d-inline-flex align-items-center gap-1.5"
                              disabled={savingGeral}
                              onClick={handleSaveGeral}
                              style={{ fontSize: '0.85rem' }}
                            >
                              {savingGeral ? (
                                <div className="users-spinner small me-1" />
                              ) : (
                                <span>💾</span>
                              )}
                              {t('saveRgpdBtn', 'Guardar Política Geral')}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* --- Sub-Tab 2: RGPD Candidatura --- */}
                {rgpdTab === 'candidatura' && (
                  <div className="p-3.5 rounded-4 border bg-white shadow-2xs" style={{ backgroundColor: 'var(--panel)', borderColor: 'var(--sidebar-border)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
                      <div>
                        <h6 className="fw-bold mb-0" style={{ color: 'var(--text)' }}>
                          {t('rgpdCandidaturaScopeTitle', 'Âmbito de Divulgação — Candidaturas & Microsite Público')}
                        </h6>
                        <span className="text-muted small">
                          {t('rgpdCandidaturaScopeSubtitle', 'Apresentado no modal explicativo de partilha pública de badges.')}
                        </span>
                      </div>

                      {isEditingCand && (
                        <ManualTranslationSwitch
                          checked={isManualCand}
                          onChange={(val) => setIsManualCand(val)}
                          disabled={!isAdminActive}
                          id="manualTranslateCandSwitch"
                        />
                      )}
                    </div>

                    {/* Text Inputs */}
                    <div className="users-form-group mb-3">
                      {!isEditingCand ? (
                        <div 
                          className="p-3.5 rounded-3 border"
                          style={{ 
                            backgroundColor: 'var(--panel-2)', 
                            borderColor: 'var(--sidebar-border)',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            color: 'var(--text)',
                            whiteSpace: 'pre-line',
                            minHeight: '110px'
                          }}
                        >
                          {getCurrentCandText() || <span className="text-muted fst-italic">{t('noRgpdTextAvailable', 'Sem texto configurado.')}</span>}
                        </div>
                      ) : !isManualCand ? (
                        <textarea
                          className="form-control"
                          rows="5"
                          value={getCurrentCandText()}
                          onChange={(e) => handleCurrentCandTextChange(e.target.value)}
                          disabled={!isAdminActive || savingCand}
                          placeholder={t('rgpdPlaceholder', { lng: i18n.language })}
                          style={{ fontSize: '0.9rem', borderRadius: '8px' }}
                        />
                      ) : (
                        <div className="d-flex flex-column gap-2 p-2 border rounded-3 bg-white" style={{ borderColor: 'var(--sidebar-border)' }}>
                          <div className="input-group input-group-sm align-items-start">
                            <span className="input-group-text fw-bold pt-2" style={{ width: '65px', minHeight: '94px', justifyContent: 'center' }}>🇵🇹 PT</span>
                            <textarea
                              className="form-control"
                              rows="4"
                              value={candPt}
                              onChange={(e) => setCandPt(e.target.value)}
                              disabled={!isAdminActive || savingCand}
                              placeholder={t('rgpdPlaceholder', { lng: 'pt' })}
                              style={{ fontSize: '0.9rem' }}
                            />
                          </div>

                          <div className="input-group input-group-sm align-items-start">
                            <span className="input-group-text fw-bold pt-2" style={{ width: '65px', minHeight: '94px', justifyContent: 'center' }}>🇬🇧 EN</span>
                            <textarea
                              className="form-control"
                              rows="4"
                              value={candEn}
                              onChange={(e) => setCandEn(e.target.value)}
                              disabled={!isAdminActive || savingCand}
                              placeholder={t('rgpdPlaceholder', { lng: 'en' })}
                              style={{ fontSize: '0.9rem' }}
                            />
                          </div>

                          <div className="input-group input-group-sm align-items-start">
                            <span className="input-group-text fw-bold pt-2" style={{ width: '65px', minHeight: '94px', justifyContent: 'center' }}>🇪🇸 ES</span>
                            <textarea
                              className="form-control"
                              rows="4"
                              value={candEs}
                              onChange={(e) => setCandEs(e.target.value)}
                              disabled={!isAdminActive || savingCand}
                              placeholder={t('rgpdPlaceholder', { lng: 'es' })}
                              style={{ fontSize: '0.9rem' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons for Candidatura */}
                    {isAdminActive && (
                      <div className="d-flex justify-content-end gap-2">
                        {!isEditingCand ? (
                          <button
                            type="button"
                            className="btn btn-outline-primary fw-semibold px-3 py-1.5 rounded-3 d-inline-flex align-items-center gap-1.5"
                            onClick={() => setIsEditingCand(true)}
                            style={{ fontSize: '0.85rem' }}
                          >
                            <span>✏️</span> {t('editRgpdBtn', 'Editar Política de Candidatura')}
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn-secondary fw-semibold px-3 py-1.5 rounded-3"
                              disabled={savingCand}
                              onClick={handleCancelCand}
                              style={{ fontSize: '0.85rem' }}
                            >
                              {t('cancelBtn', 'Cancelar')}
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary fw-bold px-3.5 py-1.5 rounded-3 d-inline-flex align-items-center gap-1.5"
                              disabled={savingCand}
                              onClick={handleSaveCand}
                              style={{ fontSize: '0.85rem' }}
                            >
                              {savingCand ? (
                                <div className="users-spinner small me-1" />
                              ) : (
                                <span>💾</span>
                              )}
                              {t('saveRgpdBtn', 'Guardar Política de Candidatura')}
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Security / Sessions Card */}
              <div className="card border-0 shadow-sm p-4 rounded-4" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                <h5 className="fw-bold mb-3" style={{ color: 'var(--text)' }}>
                  {t('securityAccessPolicies', 'Políticas de Acesso e Segurança')}
                </h5>
                <div className="row g-3">
                  <div className="col-12 col-md-6">
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1">
                        {t('sessionTimeoutLabel', 'Tempo limite de sessão ativa (minutos)')}
                      </label>
                      <input
                        type="number"
                        className="form-control"
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(e.target.value)}
                        style={{ borderRadius: '8px' }}
                        disabled
                      />
                    </div>
                  </div>
                  
                  <div className="col-12 col-md-6 d-flex align-items-end pb-2">
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="forcePassSwitch"
                        checked={forceChangePass}
                        onChange={(e) => setForceChangePass(e.target.checked)}
                        style={{ cursor: 'pointer' }}
                        disabled
                      />
                      <label className="form-check-label small ms-2" htmlFor="forcePassSwitch" style={{ cursor: 'pointer', color: 'var(--text)' }}>
                        {t('forcePasswordChangeLabel', 'Forçar alteração de password no primeiro acesso')}
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* SMTP Mail Server Configuration */}
              <div className="card border-0 shadow-sm p-4 rounded-4" style={{ backgroundColor: 'var(--panel-2)', borderColor: 'var(--sidebar-border)' }}>
                <h5 className="fw-bold mb-3" style={{ color: 'var(--text)' }}>
                  {t('smtpServerTitle', 'Servidor de E-mail (SMTP)')}
                </h5>
                <div className="row g-3">
                  <div className="col-12 col-md-6 col-lg-4">
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1">{t('smtpHost', 'Servidor SMTP Host')}</label>
                      <input type="text" className="form-control" placeholder="smtp.softinsa.pt" defaultValue="smtp.softinsa.pt" disabled style={{ borderRadius: '8px' }} />
                    </div>
                  </div>
                  <div className="col-12 col-md-6 col-lg-2">
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1">{t('smtpPort', 'Porta SMTP')}</label>
                      <input type="number" className="form-control" placeholder="587" defaultValue="587" disabled style={{ borderRadius: '8px' }} />
                    </div>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1">{t('smtpUser', 'Utilizador Autenticação')}</label>
                      <input type="text" className="form-control" placeholder="noreply@softinsa.pt" defaultValue="noreply@softinsa.pt" disabled style={{ borderRadius: '8px' }} />
                    </div>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="users-form-group">
                      <label className="text-muted small fw-bold mb-1">{t('smtpSecurity', 'Segurança de Ligação')}</label>
                      <input type="text" className="form-control" defaultValue="STARTTLS" disabled style={{ borderRadius: '8px' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && <ConfigPersonalInfo />}
          {activeTab === 'signature' && <ConfigAssinaturaMail />}
        </div>
      </div>
    </div>
  );
}
