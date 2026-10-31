import { useState, useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../context/AppContext';
import { api } from '../services/api';
import { ROLE } from '../constants/roles';
import Swal from 'sweetalert2';

import CopiarAssinaturaVisual from './CopiarAssinaturaVisual';
import { copyVisualAction, copyHtmlAction } from '../utils/signatureHelper';

export default function ConfigAssinaturaMail() {
  const { t, i18n } = useTranslation();
  const { user } = useAppContext();
  const previewRef = useRef(null);

  // Estados dos dados editáveis da assinatura
  const [nome, setNome] = useState(`${user?.nome || ''} ${user?.apelido || ''}`.trim());
  const [cargo, setCargo] = useState('');
  const [serviceLines, setServiceLines] = useState([]);
  const [selectedSl, setSelectedSl] = useState('');
  const [email, setEmail] = useState('');
  const [telemovel, setTelemovel] = useState('');
  const [telefoneFixo, setTelefoneFixo] = useState('');

  const handleTelemovelChange = (val) => {
    setTelemovel(val.replace(/\D/g, ''));
  };

  const handleTelefoneFixoChange = (val) => {
    setTelefoneFixo(val.replace(/\D/g, ''));
  };

  // Listagem de candidaturas aprovadas e públicas
  const [candidaturas, setCandidaturas] = useState([]);
  const [selectedBadges, setSelectedBadges] = useState([]); // IDs das candidaturas cujos badges devem ir para a assinatura
  const [loading, setLoading] = useState(true);
  const [carouselIndex, setCarouselIndex] = useState(0);

  // Exibe 2 candidaturas de cada vez no carrossel de forma rotativa
  const visibleCandidaturas = useMemo(() => {
    if (candidaturas.length === 0) return [];
    if (candidaturas.length <= 2) return candidaturas;
    const items = [];
    items.push(candidaturas[carouselIndex]);
    const nextIdx = (carouselIndex + 1) % candidaturas.length;
    items.push(candidaturas[nextIdx]);
    return items;
  }, [candidaturas, carouselIndex]);

  const nextCarouselSlide = () => {
    setCarouselIndex((prev) => (prev + 1 >= candidaturas.length ? 0 : prev + 1));
  };
  const prevCarouselSlide = () => {
    setCarouselIndex((prev) => (prev - 1 < 0 ? candidaturas.length - 1 : prev - 1));
  };

  // Determinar URL base do microsite em tempo de execução
  const isDev = window.location.hostname === 'localhost';
  const micrositeBaseUrl = isDev ? 'http://localhost:3002' : 'https://www.softbadge.pt';

  // Obter a função máxima pelas roles ativas do token
  const getMaximumRoleName = () => {
    const roles = (user?.perfis || []).map(p => typeof p === 'object' ? Number(p.id_perfil) : Number(p));
    if (roles.includes(ROLE.ADMIN)) return t('roleAdmin', 'Administrador');
    if (roles.includes(ROLE.SLL)) return t('roleSll', 'Service Line Leader');
    if (roles.includes(ROLE.TM)) return t('roleTm', 'Talent Manager');
    return t('roleConsultant', 'Consultor');
  };

  // Carregar Service Lines, Badges traduzidos e Candidaturas Aprovadas/Públicas
  useEffect(() => {
    const loadData = async () => {
      try {
        const [resSl, resCand, resBadges, resEsp] = await Promise.all([
          api.get('/service_line'),
          api.get('/candidatura_badge'),
          api.get('/badge?ativo=true'),
          api.get('/candidatura_especial/assinatura').catch(err => {
            console.warn('Endpoint /candidatura_especial/assinatura indisponível ou erro:', err);
            return { data: { success: false, data: [] } };
          })
        ]);

        if (resSl.data?.success) {
          setServiceLines(resSl.data.data || []);
        }

        const badgesMap = {};
        if (resBadges.data?.success && resBadges.data.data) {
          resBadges.data.data.forEach(b => {
            badgesMap[b.id_badge] = b;
          });
        }

        let normalList = [];
        if (resCand.data?.success) {
          // Filtrar apenas candidaturas Aprovadas (id_estado_candidatura = 4) E com switch RGPD ativado (partilhar_conclusao = true)
          normalList = (resCand.data.data || []).filter(
            c => (Number(c.id_estado_candidatura) === 4 || Number(c.estado?.id_estado_candidatura) === 4 || Number(c.estado) === 4) && 
                 (c.partilhar_conclusao === true || c.partilhar_conclusao === 1)
          ).map(c => {
            const badgeInfo = badgesMap[c.id_badge];
            return {
              ...c,
              tipo: 'normal',
              badge: {
                ...c.badge,
                titulo: badgeInfo?.titulo || c.badge?.titulo || '—',
                nivel_area: badgeInfo?.nivel_area || c.badge?.nivel_area || '—',
                area: badgeInfo?.area || c.badge?.area || '—',
                pontos: badgeInfo?.pontos ?? c.badge?.pontos ?? 0,
                logo: badgeInfo?.logo || c.badge?.logo
              }
            };
          });
        }

        let especialList = [];
        if (resEsp.data?.success && Array.isArray(resEsp.data.data)) {
          especialList = resEsp.data.data.map(esp => ({
            ...esp,
            id_candidatura: `esp_${esp.id_candidatura_especial}`,
            id_candidatura_especial: esp.id_candidatura_especial,
            tipo: 'especial',
            badge_logo: esp.badge_logo,
            badge_nome: esp.badge_titulo,
            badge: {
              titulo: esp.badge_titulo || '—',
              nivel_area: t('badgeEspecialTag', 'Especial'),
              area: t('specialBadgeArea', 'Badge Especial'),
              pontos: esp.pontos_bonus || 0,
              logo: esp.badge_logo
            },
            public_url: esp.public_url
          }));
        }

        setCandidaturas([...normalList, ...especialList]);

        // Definir cargo padrão com base na função máxima
        setCargo(getMaximumRoleName());
      } catch (err) {
        console.error('Erro ao carregar dados da assinatura:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, i18n.language]);

  // Pre-selecionar a Service Line correspondente à área do utilizador
  useEffect(() => {
    const userAreaId = user?.area_id || user?.id_area;
    if (userAreaId && serviceLines.length > 0) {
      // Tentar encontrar uma SL que contenha a área do utilizador
      const foundSl = serviceLines.find(sl =>
        sl.areas?.some(a => Number(a.id_area) === Number(userAreaId))
      );
      if (foundSl) {
        setSelectedSl(foundSl.service_line || foundSl.titulo || foundSl.nome || '');
      }
    }
  }, [user, serviceLines]);

  const handleToggleBadge = (idCandidatura) => {
    setSelectedBadges(prev =>
      prev.includes(idCandidatura)
        ? prev.filter(id => id !== idCandidatura)
        : [...prev, idCandidatura]
    );
  };

  // Obter os dados das candidaturas selecionadas para renderizar
  const getSelectedBadgesData = () => {
    return candidaturas.filter(c => selectedBadges.includes(c.id_candidatura));
  };

  // Montar o código HTML inline estruturado em tabelas (altamente compatível com Outlook)
  const generateSignatureHtml = () => {
    const backendUrl = api.defaults.baseURL.replace('/api', '');
    const activeBadges = getSelectedBadgesData();

    // HTML estruturado em tabelas
    let badgesHtml = '';
    if (activeBadges.length > 0) {
      badgesHtml = `
        <tr>
          <td style="padding-top: 12px;">
            <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif;">
              <tr>
                ${activeBadges.map(b => {
        const isEspecial = b.tipo === 'especial';
        const logoFile = b.badge_logo || b.badge?.logo;
        const logoFolder = isEspecial ? 'logo_especial' : 'logo_badges';
        const badgeImgUrl = logoFile 
          ? `https://back.softbadge.pt/uploads/${logoFolder}/${logoFile}` 
          : `https://back.softbadge.pt/uploads/logo_badges/badge-default.png`;
        
        const publicBadgeUrl = isEspecial
          ? (b.public_url || `https://www.softbadge.pt/shares/${user.id_utilizador}/${b.id_candidatura_especial || String(b.id_candidatura).replace('esp_', '')}?tipo=especial`)
          : `https://www.softbadge.pt/shares/${user.id_utilizador}/${b.id_candidatura}`;
        const badgeNomeAlt = isEspecial ? (b.badge_titulo || b.badge?.titulo || 'Badge Especial') : (b.badge?.titulo || b.badge_nome || 'Badge');
        return `
                    <td style="padding-right: 12px; text-align: center;">
                      <a href="${publicBadgeUrl}" target="_blank" style="text-decoration: none;">
                        <img src="${badgeImgUrl}" alt="${badgeNomeAlt}" width="50" height="50" style="border: none; display: block; width: 50px; height: 50px;" />
                      </a>
                    </td>
                  `;
      }).join('')}
              </tr>
            </table>
          </td>
        </tr>
      `;
    }

    // Contactos (Telefones em cima, E-mail em baixo)
    const telefonesArray = [];
    if (telemovel) telefonesArray.push(`📱 ${telemovel}`);
    if (telefoneFixo) telefonesArray.push(`📞 ${telefoneFixo}`);
    const telefonesHtml = telefonesArray.length > 0
      ? `<div style="color: #64748b; font-size: 13px; margin-top: 2px;">${telefonesArray.join(' | ')}</div>`
      : '';
    const emailHtml = email
      ? `<div style="color: #64748b; font-size: 13px; margin-top: 2px;">✉️ ${email}</div>`
      : '';

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.4;">
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <!-- Linha Vertical Azul Softinsa -->
          <td style="border-left: 3px solid #155dfc; padding-left: 12px;">
            <div style="font-weight: bold; font-size: 16px; color: #0f172a;">${nome}</div>
            <div style="color: #64748b; font-size: 13px; margin-top: 2px;">${cargo}</div>
            ${selectedSl ? `<div style="color: #64748b; font-size: 13px;">${selectedSl}</div>` : ''}
            ${telefonesHtml}
            ${emailHtml}
            <div style="color: #1e293b; font-weight: 600; font-size: 13px; margin-top: 4px;">SoftBadge - Grupo IBM</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ${badgesHtml}
</table>`;
  };

  // Montar o código HTML inline estruturado em tabelas com as imagens embutidas em Base64
  const generateSignatureHtmlWithBase64 = (badgesWithBase64) => {
    let badgesHtml = '';
    if (badgesWithBase64.length > 0) {
      badgesHtml = `
        <tr>
          <td style="padding-top: 12px;">
            <table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif;">
              <tr>
                ${badgesWithBase64.map(b => {
                  const isEspecial = b.tipo === 'especial';
                  const badgeImgUrl = b.base64Image;
                  const publicBadgeUrl = isEspecial
                    ? (b.public_url || `https://www.softbadge.pt/shares/${user.id_utilizador}/${b.id_candidatura_especial || String(b.id_candidatura).replace('esp_', '')}?tipo=especial`)
                    : `https://www.softbadge.pt/shares/${user.id_utilizador}/${b.id_candidatura}`;
                  const badgeNomeAlt = isEspecial ? (b.badge_titulo || b.badge?.titulo || 'Badge Especial') : (b.badge?.titulo || b.badge_nome || 'Badge');
                  return `
                    <td style="padding-right: 12px; text-align: center;">
                      <a href="${publicBadgeUrl}" target="_blank" style="text-decoration: none;">
                        <img src="${badgeImgUrl}" alt="${badgeNomeAlt}" width="50" height="50" style="border: none; display: block; width: 50px; height: 50px;" />
                      </a>
                    </td>
                  `;
                }).join('')}
              </tr>
            </table>
          </td>
        </tr>
      `;
    }

    const telefonesArray = [];
    if (telemovel) telefonesArray.push(`📱 ${telemovel}`);
    if (telefoneFixo) telefonesArray.push(`📞 ${telefoneFixo}`);
    const telefonesHtml = telefonesArray.length > 0
      ? `<div style="color: #64748b; font-size: 13px; margin-top: 2px;">${telefonesArray.join(' | ')}</div>`
      : '';
    const emailHtml = email
      ? `<div style="color: #64748b; font-size: 13px; margin-top: 2px;">✉️ ${email}</div>`
      : '';

    return `<table cellpadding="0" cellspacing="0" border="0" style="font-family: Arial, sans-serif; font-size: 14px; color: #333333; line-height: 1.4;">
  <tr>
    <td>
      <table cellpadding="0" cellspacing="0" border="0">
        <tr>
          <!-- Linha Vertical Azul Softinsa -->
          <td style="border-left: 3px solid #155dfc; padding-left: 12px;">
            <div style="font-weight: bold; font-size: 16px; color: #0f172a;">${nome}</div>
            <div style="color: #64748b; font-size: 13px; margin-top: 2px;">${cargo}</div>
            ${selectedSl ? `<div style="color: #64748b; font-size: 13px;">${selectedSl}</div>` : ''}
            ${telefonesHtml}
            ${emailHtml}
            <div style="color: #1e293b; font-weight: 600; font-size: 13px; margin-top: 4px;">SoftBadge - Grupo IBM</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>
  ${badgesHtml}
</table>`;
  };

  // Método 1: Copiar HTML bruto com aviso e suporte a redirecionamento para cópia visual
  const handleCopyHtml = async () => {
    const activeBadges = getSelectedBadgesData();
    const payload = {
      nome,
      cargo,
      selectedSl,
      email,
      telemovel,
      telefoneFixo,
      activeBadges,
      userId: user.id_utilizador
    };

    Swal.fire({
      title: t('htmlWarningTitle', 'Atenção: Copiar Código HTML'),
      text: t('htmlWarningText', 'Esta funcionalidade copia o código HTML bruto da assinatura. É recomendada apenas para utilizadores avançados que pretendem importar o código diretamente. Se usa o Outlook ou Gmail, a Cópia Simplificada (Visual) é a ideal.'),
      icon: 'warning',
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: t('btnProfessionalCopy', 'Sou Profissional - Copiar'),
      denyButtonText: t('btnBeginnerCopy', 'Sou iniciante - Copia simplificada'),
      cancelButtonText: t('btnCancel', 'Cancelar'),
      confirmButtonColor: '#10b981', // Verde
      denyButtonColor: '#3b82f6', // Azul
      cancelButtonColor: '#6b7280' // Cinzento
    }).then(async (result) => {
      if (result.isConfirmed) {
        // Cópia profissional (HTML)
        try {
          await copyHtmlAction(payload);
          Swal.fire({
            icon: 'success',
            title: t('copied', 'Copiado!'),
            text: t('signatureHtmlCopied', 'O código HTML da assinatura foi copiado para a área de transferência.'),
            timer: 2000,
            showConfirmButton: false
          });
        } catch (err) {
          console.error('Erro ao copiar HTML:', err);
          Swal.fire({
            icon: 'error',
            title: t('error', 'Erro'),
            text: t('copyError', 'Não foi possível copiar o HTML.')
          });
        }
      } else if (result.isDenied) {
        // Cópia iniciante (Visual Base64/PNG)
        try {
          Swal.fire({
            title: t('loading', 'A processar imagens...'),
            allowOutsideClick: false,
            didOpen: () => {
              Swal.showLoading();
            }
          });

          await copyVisualAction(payload);

          Swal.fire({
            icon: 'success',
            title: t('copied', 'Copiado!'),
            text: t('signatureVisualCopied', 'Assinatura copiada! Pode colá-la diretamente nas definições do Outlook.'),
            timer: 2000,
            showConfirmButton: false
          });
        } catch (err) {
          console.error('Erro ao copiar visualmente:', err);
          Swal.fire({
            icon: 'error',
            title: t('error', 'Erro'),
            text: t('copyVisualError', 'Por favor, selecione e copie a assinatura manualmente a partir da caixa de pré-visualização.')
          });
        }
      }
    });
  };

  if (loading) {
    return (
      <div className="d-flex align-items-center justify-content-center p-4">
        <div className="users-spinner me-2" />
        <span className="text-muted small">{t('loadingSignature', 'A carregar dados da assinatura...')}</span>
      </div>
    );
  }

  return (
    <div className="card-body p-0 mt-3">
      <div className="row g-4">

        {/* Lado Esquerdo: Inputs de Configuração */}
        <div className="col-12 col-lg-6 d-flex flex-column gap-3">
          <h6 className="fw-bold mb-1">{t('signatureSettingsTitle', 'Configuração da Assinatura')}</h6>

          <div className="users-form-group">
            <label className="form-label fw-bold small text-muted mb-1">{t('colName', 'Nome')}</label>
            <input
              type="text"
              className="form-control"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="users-form-group">
            <label className="form-label fw-bold small text-muted mb-1">{t('fieldJobTitle', 'Cargo')}</label>
            <input
              type="text"
              className="form-control"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="users-form-group">
            <label className="form-label fw-bold small text-muted mb-1">{t('selectSLLabel', 'Service Line')}</label>
            <select
              className="form-select"
              value={selectedSl}
              onChange={(e) => setSelectedSl(e.target.value)}
              style={{ borderRadius: '8px' }}
            >
              <option value="">{t('selectServiceLineNone', 'Nenhuma')}</option>
              {serviceLines.map(sl => {
                const slValue = sl.service_line || sl.titulo || sl.nome || '';
                return (
                  <option key={sl.id_service_line} value={slValue}>
                    {slValue}
                  </option>
                );
              })}
            </select>
          </div>

          <div className="users-form-group">
            <label className="form-label fw-bold small text-muted mb-1">
              ✉️ {t('emailLabel', 'E-mail')}
            </label>
            <input
              type="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('emailPlaceholder', 'Ex: nome@softbadge.pt')}
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="users-form-group">
            <label className="form-label fw-bold small text-muted mb-1">
              📱 {t('mobileLabel', 'Telemóvel')}
            </label>
            <input
              type="text"
              className="form-control"
              value={telemovel}
              onChange={(e) => handleTelemovelChange(e.target.value)}
              placeholder={t('mobilePlaceholder', 'Ex: 912345678')}
              style={{ borderRadius: '8px' }}
            />
          </div>

          <div className="users-form-group">
            <label className="form-label fw-bold small text-muted mb-1">
              📞 {t('phoneLabel', 'Telefone Fixo')}
            </label>
            <input
              type="text"
              className="form-control"
              value={telefoneFixo}
              onChange={(e) => handleTelefoneFixoChange(e.target.value)}
              placeholder={t('phonePlaceholder', 'Ex: 212345678')}
              style={{ borderRadius: '8px' }}
            />
          </div>

          <hr className="my-1" style={{ borderColor: '#e2e8f0' }} />

          {/* Badges para Assinatura (Carrossel Interativo) */}
          <div className="mt-2">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <label className="form-label fw-bold small text-muted mb-0">
                {t('badgesForSignature', 'Badges na Assinatura (Conquistados e Públicos)')}
              </label>
              
              {candidaturas.length > 2 && (
                <div className="d-flex gap-1">
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-secondary rounded-circle" 
                    onClick={prevCarouselSlide} 
                    style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-sm btn-outline-secondary rounded-circle" 
                    onClick={nextCarouselSlide} 
                    style={{ width: '28px', height: '28px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6" /></svg>
                  </button>
                </div>
              )}
            </div>

            {candidaturas.length === 0 ? (
              <p className="text-muted small italic mb-0">
                {t('noPublicBadgesNotice', 'Para adicionar badges à sua assinatura, certifique-se de que tem badges conquistados (normais ou especiais) e que o consentimento de partilha pública (RGPD) está ativado.')}
              </p>
            ) : (
              <div className="row g-2">
                {visibleCandidaturas.map(c => {
                  const isEspecial = c.tipo === 'especial';
                  const badgeNome = c.badge?.titulo || '—';
                  const badgeLogo = c.badge?.logo;
                  const badgePontos = c.badge?.pontos || 0;
                  const badgeNivel = c.badge?.nivel_area || '—';
                  const badgeArea = c.badge?.area || '—';
                  const isSelected = selectedBadges.includes(c.id_candidatura);
                  const logoFolder = isEspecial ? 'logo_especial' : 'logo_badges';
                  const logoUrl = badgeLogo
                    ? `${api.defaults.baseURL.replace('/api', '')}/uploads/${logoFolder}/${badgeLogo}`
                    : '/img/system/badge-default.png';

                  return (
                    <div key={c.id_candidatura} className="col-6">
                      <div 
                        className={`card p-2 h-100 border position-relative d-flex flex-column justify-content-between rounded-3 ${isSelected ? 'border-primary bg-primary bg-opacity-10' : 'bg-white'}`}
                        style={{ cursor: 'pointer', transition: 'all 0.2s ease-in-out' }}
                        onClick={() => handleToggleBadge(c.id_candidatura)}
                      >
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <div 
                            className="d-flex align-items-center justify-content-center bg-light rounded-2 overflow-hidden"
                            style={{ width: '36px', height: '36px', minWidth: '36px' }}
                          >
                            {badgeLogo ? (
                              <img 
                                src={logoUrl}
                                alt={badgeNome}
                                style={{ width: '90%', height: '90%', objectFit: 'contain' }}
                                onError={(e) => { e.target.src = '/img/system/badge-default.png'; }}
                              />
                            ) : (
                              <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2" fill="none">
                                <circle cx="12" cy="8" r="7" />
                                <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                              </svg>
                            )}
                          </div>
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div className="d-flex align-items-center gap-1">
                              <div className="fw-bold text-truncate" style={{ color: 'var(--text)', fontSize: '0.78rem' }} title={badgeNome}>
                                {badgeNome}
                              </div>
                              {isEspecial && (
                                <span className="badge bg-warning-subtle text-warning-emphasis" style={{ fontSize: '0.58rem', padding: '1px 4px' }} title={t('badgeEspecialTag', 'Especial')}>
                                  ★
                                </span>
                              )}
                            </div>
                            <span className="text-muted text-truncate d-block" style={{ fontSize: '0.65rem' }}>
                              {badgeArea}
                            </span>
                          </div>
                        </div>

                        <div className="d-flex align-items-center justify-content-between mt-1 pt-1 border-top" style={{ borderColor: 'rgba(0,0,0,0.06)', fontSize: '0.68rem' }}>
                          <span className={isEspecial ? 'badge bg-warning-subtle text-warning-emphasis fw-semibold' : 'text-primary fw-semibold'}>
                            {badgeNivel}
                          </span>
                          <span className="text-muted fw-bold">🪙 {badgePontos} pts</span>
                        </div>

                        {/* Indicador visual de Selecionado */}
                        {isSelected && (
                          <div 
                            className="position-absolute d-flex align-items-center justify-content-center bg-primary text-white rounded-circle"
                            style={{ top: '4px', right: '4px', width: '16px', height: '16px' }}
                          >
                            <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Lado Direito: Preview da Assinatura */}
        <div className="col-12 col-lg-6 d-flex flex-column gap-3">
          <h6 className="fw-bold mb-1">{t('signaturePreviewTitle', 'Pré-visualização da Assinatura')}</h6>

          {/* Caixa de Pré-visualização — apenas divs (sem tabelas) para evitar bordas pretas no Outlook ao copiar manualmente */}
          <div
            className="p-3 d-flex align-items-start justify-content-start rounded-3"
            style={{ minHeight: '160px', backgroundColor: 'var(--panel-2, #f8fafc)' }}
          >
            <div ref={previewRef} style={{ display: 'inline-block', fontFamily: 'Arial, sans-serif', fontSize: '14px', color: '#333333', lineHeight: 1.4 }}>
              {/* Conteúdo da assinatura com linha azul lateral */}
              <div style={{ borderLeft: '3px solid #155dfc', paddingLeft: '12px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>{nome}</div>
                <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>{cargo}</div>
                {selectedSl ? <div style={{ color: '#64748b', fontSize: '13px' }}>{selectedSl}</div> : null}
                {(telemovel || telefoneFixo) && (
                  <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
                    {[
                      telemovel && `📱 ${telemovel}`,
                      telefoneFixo && `📞 ${telefoneFixo}`
                    ].filter(Boolean).join(' | ')}
                  </div>
                )}
                {email && (
                  <div style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>
                    ✉️ {email}
                  </div>
                )}
                <div style={{ color: '#1e293b', fontWeight: '600', fontSize: '13px', marginTop: '4px' }}>SoftBadge - Grupo IBM</div>
              </div>

              {/* Badges selecionados */}
              {getSelectedBadgesData().length > 0 && (
                <div style={{ paddingTop: '12px', display: 'flex', gap: '12px' }}>
                  {getSelectedBadgesData().map(b => {
                    const isEspecial = b.tipo === 'especial';
                    const logoFile = b.badge_logo || b.badge?.logo;
                    const logoFolder = isEspecial ? 'logo_especial' : 'logo_badges';
                    const badgeImgUrl = logoFile 
                      ? `${api.defaults.baseURL.replace('/api', '')}/uploads/${logoFolder}/${logoFile}` 
                      : '/img/system/badge-default.png';
                    
                    const publicBadgeUrl = isEspecial
                      ? (b.public_url || `https://www.softbadge.pt/shares/${user.id_utilizador}/${b.id_candidatura_especial || String(b.id_candidatura).replace('esp_', '')}?tipo=especial`)
                      : `https://www.softbadge.pt/shares/${user.id_utilizador}/${b.id_candidatura}`;
                    const badgeNome = isEspecial ? (b.badge_titulo || b.badge?.titulo || 'Badge Especial') : (b.badge?.titulo || b.badge_nome || 'Badge');
                    return (
                      <a key={b.id_candidatura} href={publicBadgeUrl} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                        <img
                          src={badgeImgUrl}
                          alt={badgeNome}
                          width="50"
                          height="50"
                          style={{ border: 'none', display: 'block', width: '50px', height: '50px' }}
                          onError={(e) => { e.target.src = '/img/system/badge-default.png'; }}
                        />
                      </a>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <p className="text-muted small mb-0 italic">
            {t('copyInstructionsNotice', 'Dica: Pode selecionar com o rato a assinatura na caixa acima e copiá-la, ou usar um dos botões abaixo.')}
          </p>

          {/* Botões de Ação para Cópia */}
          <div className="d-flex flex-wrap gap-2">
            <CopiarAssinaturaVisual
              nome={nome}
              cargo={cargo}
              selectedSl={selectedSl}
              email={email}
              telemovel={telemovel}
              telefoneFixo={telefoneFixo}
              activeBadges={getSelectedBadgesData()}
              userId={user.id_utilizador}
              className="btn btn-outline-primary fw-bold btn-sm flex-fill py-2"
              style={{ borderRadius: '8px' }}
            />
            <button
              type="button"
              onClick={handleCopyHtml}
              className="btn btn-secondary fw-bold btn-sm flex-fill py-2"
              style={{ borderRadius: '8px' }}
            >
              {t('copyHtmlBtn', '💻 Copiar código HTML')}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
