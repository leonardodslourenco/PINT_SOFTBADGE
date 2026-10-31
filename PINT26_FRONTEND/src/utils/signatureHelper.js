import { api } from '../services/api';

// Converter imagens (inclusive SVG) para PNG Base64 rasterizado de forma a embuti-las na assinatura copiada (Outlook só aceita PNG/JPG e não renderiza SVG)
export const convertImageToPngBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 100;
        canvas.height = 100;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, 100, 100);
        ctx.drawImage(img, 0, 0, 100, 100);
        const pngDataUrl = canvas.toDataURL('image/png');
        resolve(pngDataUrl);
      } catch (err) {
        console.error('Erro ao renderizar imagem para canvas PNG:', err);
        resolve(null);
      }
    };
    img.onerror = () => {
      // Fallback via fetch blob se o crossOrigin direto falhar
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          const blobUrl = URL.createObjectURL(blob);
          const fallbackImg = new Image();
          fallbackImg.onload = () => {
            try {
              const canvas = document.createElement('canvas');
              canvas.width = 100;
              canvas.height = 100;
              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, 100, 100);
              ctx.drawImage(fallbackImg, 0, 0, 100, 100);
              URL.revokeObjectURL(blobUrl);
              resolve(canvas.toDataURL('image/png'));
            } catch (e) {
              URL.revokeObjectURL(blobUrl);
              resolve(null);
            }
          };
          fallbackImg.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            resolve(null);
          };
          fallbackImg.src = blobUrl;
        })
        .catch(() => resolve(null));
    };
    img.src = url;
  });
};

// Gerar HTML de Assinatura padrão
export const generateSignatureHtml = ({ nome, cargo, selectedSl, email, telemovel, telefoneFixo, activeBadges, userId }) => {
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
                  ? (b.public_url || `https://www.softbadge.pt/shares/${userId}/${b.id_candidatura_especial || String(b.id_candidatura).replace('esp_', '')}?tipo=especial`)
                  : `https://www.softbadge.pt/shares/${userId}/${b.id_candidatura}`;
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

// Gerar HTML de Assinatura com Base64
export const generateSignatureHtmlWithBase64 = ({ nome, cargo, selectedSl, email, telemovel, telefoneFixo, badgesWithBase64, userId }) => {
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
                  ? (b.public_url || `https://www.softbadge.pt/shares/${userId}/${b.id_candidatura_especial || String(b.id_candidatura).replace('esp_', '')}?tipo=especial`)
                  : `https://www.softbadge.pt/shares/${userId}/${b.id_candidatura}`;
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

// Ação de cópia visual reutilizável
export const copyVisualAction = async ({ nome, cargo, selectedSl, email, telemovel, telefoneFixo, activeBadges, userId }) => {
  const backendBase = api.defaults.baseURL.replace('/api', '');
  
  const badgesWithBase64 = await Promise.all(
    activeBadges.map(async (b) => {
      const isEspecial = b.tipo === 'especial';
      const logoFile = b.badge_logo || b.badge?.logo;
      const logoFolder = isEspecial ? 'logo_especial' : 'logo_badges';
      const localUrl = logoFile 
        ? `${backendBase}/uploads/${logoFolder}/${logoFile}` 
        : '/img/system/badge-default.png';
      const prodUrl = logoFile
        ? `https://back.softbadge.pt/uploads/${logoFolder}/${logoFile}`
        : 'https://back.softbadge.pt/uploads/logo_badges/badge-default.png';
        
      let pngBase64 = await convertImageToPngBase64(localUrl);
      if (!pngBase64) {
        pngBase64 = await convertImageToPngBase64(prodUrl);
      }
      
      return {
        ...b,
        base64Image: pngBase64 || prodUrl
      };
    })
  );

  const htmlCode = generateSignatureHtmlWithBase64({
    nome,
    cargo,
    selectedSl,
    email,
    telemovel,
    telefoneFixo,
    badgesWithBase64,
    userId
  });

  const blob = new Blob([htmlCode], { type: 'text/html' });
  await navigator.clipboard.write([
    new ClipboardItem({ 'text/html': blob })
  ]);
};

// Ação de cópia HTML reutilizável
export const copyHtmlAction = async ({ nome, cargo, selectedSl, email, telemovel, telefoneFixo, activeBadges, userId }) => {
  const htmlCode = generateSignatureHtml({
    nome,
    cargo,
    selectedSl,
    email,
    telemovel,
    telefoneFixo,
    activeBadges,
    userId
  });
  await navigator.clipboard.writeText(htmlCode);
};
