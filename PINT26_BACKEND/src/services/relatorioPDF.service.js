// =========================================================================
// SERVIÇO DE GERAÇÃO DE RELATÓRIOS EM PDF VIA PDFKIT
// =========================================================================
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PALETTE = {
  primary: '#1E3A8A',       // Azul Marinho Corporativo
  primaryLight: '#3B82F6',  // Azul Real
  dark: '#0F172A',          // Slate Escuro
  gray: '#64748B',          // Cinza Médio
  lightBg: '#F8FAFC',       // Fundo Claro
  zebraBg: '#F1F5F9',       // Fundo Zebrado
  border: '#E2E8F0',        // Borda Suave
  specialPurple: '#7C3AED', // Roxo Conquistas Especiais
  specialBg: '#F5F3FF',     // Fundo Roxo Claro
  white: '#FFFFFF',
  green: '#059669',
  greenBg: '#ECFDF5'
};

const DEFAULT_AVATAR_PATH = path.join(__dirname, '..', 'seeds', 'avatar', 'default_avatar.webp');
const UPLOADS_AVATAR_DIR = path.join(__dirname, '..', 'uploads', 'avatars');
const UPLOADS_BADGE_DIR = path.join(__dirname, '..', 'uploads', 'logo_badges');
const UPLOADS_ESPECIAL_DIR = path.join(__dirname, '..', 'uploads', 'logo_especial');

/**
 * Desenha o cabeçalho corporativo institucional SoftBadge no topo da página.
 */
function desenharCabecalho(doc, titulo, subtitulo = '') {
  const startX = 40;
  const startY = 30;
  const contentWidth = 515;

  // Barra de destaque topo
  doc.rect(startX, startY, contentWidth, 4).fill(PALETTE.primary);

  // Logo / Nome SoftBadge
  doc.fillColor(PALETTE.primary)
     .font('Helvetica-Bold')
     .fontSize(16)
     .text('SOFTBADGE', startX, startY + 12);

  doc.fillColor(PALETTE.gray)
     .font('Helvetica')
     .fontSize(8)
     .text('SISTEMA DE GESTÃO DE COMPETÊNCIAS E BADGES', startX + 115, startY + 18);

  // Data de Emissão à Direita
  const dataHoje = new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  doc.fillColor(PALETTE.gray)
     .font('Helvetica')
     .fontSize(7.5)
     .text(`Emitido em: ${dataHoje}`, startX, startY + 18, { align: 'right', width: contentWidth });

  // Linha divisória suave
  doc.strokeColor(PALETTE.border).lineWidth(0.8).moveTo(startX, startY + 34).lineTo(startX + contentWidth, startY + 34).stroke();

  // Título do Relatório
  doc.fillColor(PALETTE.dark)
     .font('Helvetica-Bold')
     .fontSize(12)
     .text(titulo, startX, startY + 42);

  // Subtítulo / Metadados de Filtro
  if (subtitulo) {
    doc.fillColor(PALETTE.gray)
       .font('Helvetica')
       .fontSize(7.5)
       .text(subtitulo, startX, startY + 58, { width: contentWidth });
    doc.strokeColor(PALETTE.border).lineWidth(0.8).moveTo(startX, startY + 70).lineTo(startX + contentWidth, startY + 70).stroke();
    return startY + 80;
  } else {
    doc.strokeColor(PALETTE.border).lineWidth(0.8).moveTo(startX, startY + 60).lineTo(startX + contentWidth, startY + 60).stroke();
    return startY + 70;
  }
}

/**
 * Aplica a numeração final de páginas "Página X de Y" e rodapé institucional em todo o documento sem criar páginas extra.
 */
function aplicarRodapeFinal(doc) {
  const range = doc.bufferedPageRange();
  const totalPages = range.count;

  for (let i = range.start; i < range.start + totalPages; i++) {
    doc.switchToPage(i);
    
    // Desativar temporariamente a margem inferior para impedir auto page break pelo PDFKit
    const oldMarginBottom = doc.page.margins.bottom;
    doc.page.margins.bottom = 0;

    doc.strokeColor(PALETTE.border).lineWidth(0.6).moveTo(40, 804).lineTo(555, 804).stroke();

    doc.fillColor(PALETTE.gray)
       .font('Helvetica')
       .fontSize(7.5)
       .text('SoftBadge Enterprise — Documento Confidencial para Gestão Interna', 40, 810, { width: 350, lineBreak: false });

    const pageNum = i + 1;
    doc.fillColor(PALETTE.gray)
       .font('Helvetica')
       .fontSize(7.5)
       .text(`Página ${pageNum} de ${totalPages}`, 40, 810, { align: 'right', width: 515, lineBreak: false });

    doc.page.margins.bottom = oldMarginBottom;
  }
}

/**
 * Tenta carregar e desenhar uma imagem no PDF de forma segura (PNG/JPEG).
 */
function desenharImagemSegura(doc, filePath, x, y, width, height) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      const ext = path.extname(filePath).toLowerCase();
      if (ext === '.png' || ext === '.jpg' || ext === '.jpeg') {
        doc.image(filePath, x, y, { width, height, fit: [width, height], align: 'center', valign: 'center' });
        return true;
      }
    }
  } catch (err) {
    // Silently fall back to vector placeholder
  }
  return false;
}

/**
 * Extrai até 2 iniciais de um nome.
 */
function obterIniciais(nome) {
  if (!nome) return 'C';
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/**
 * Desenha um avatar estilizado (com fallback vetorial se for WebP/SVG/inexistente).
 */
function desenharAvatarSeguro(doc, avatarFileName, nome, x, y, size) {
  const filePath = avatarFileName ? path.join(UPLOADS_AVATAR_DIR, avatarFileName) : null;
  const desenhou = desenharImagemSegura(doc, filePath, x, y, size, size);
  if (!desenhou) {
    const iniciais = obterIniciais(nome);
    doc.save();
    doc.circle(x + size / 2, y + size / 2, size / 2).fill('#E2E8F0');
    doc.circle(x + size / 2, y + size / 2, size / 2).strokeColor('#CBD5E1').lineWidth(0.5).stroke();
    doc.fillColor('#334155')
       .font('Helvetica-Bold')
       .fontSize(size * 0.42)
       .text(iniciais, x, y + size * 0.28, { width: size, align: 'center', lineBreak: false });
    doc.restore();
  }
}

/**
 * Desenha um logótipo de badge (com fallback vetorial de insígnia se for WebP/SVG/inexistente).
 */
function desenharLogoSeguro(doc, logoFileName, badgeNome, x, y, size) {
  let filePath = null;
  if (logoFileName) {
    const pathNormal = path.join(UPLOADS_BADGE_DIR, logoFileName);
    const pathEspecial = path.join(UPLOADS_ESPECIAL_DIR, logoFileName);
    if (fs.existsSync(pathNormal)) {
      filePath = pathNormal;
    } else if (fs.existsSync(pathEspecial)) {
      filePath = pathEspecial;
    }
  }

  const desenhou = desenharImagemSegura(doc, filePath, x, y, size, size);
  if (!desenhou) {
    const iniciais = obterIniciais(badgeNome);
    doc.save();
    doc.roundedRect(x, y, size, size, 3).fill('#EEF2F6');
    doc.roundedRect(x, y, size, size, 3).strokeColor('#93C5FD').lineWidth(0.8).stroke();
    doc.fillColor('#1E3A8A')
       .font('Helvetica-Bold')
       .fontSize(size * 0.44)
       .text(iniciais, x, y + size * 0.26, { width: size, align: 'center', lineBreak: false });
    doc.restore();
  }
}

// =========================================================================
// 1. Gerar PDF: Badges Atribuídos por Área e Período
// =========================================================================
function gerarPDFBadgesAtribuidos(dados, filtros, opcoes = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const tipoNome = filtros.tipoFiltroNome || 'Âmbito';
      const entNome = filtros.entidadeNome || filtros.areaNome || filtros.id_area;
      const subtitulo = `${tipoNome}: ${entNome}  |  Período: ${filtros.data_inicio} a ${filtros.data_fim}  |  Total Atribuídos: ${dados.length}`;
      let curY = desenharCabecalho(doc, `Relatório de Badges Atribuídos por ${tipoNome} e Período`, subtitulo);

      if (dados.length === 0) {
        doc.fillColor(PALETTE.gray).font('Helvetica-Oblique').fontSize(10).text('Nenhum badge atribuído encontrado para os critérios selecionados.', 40, curY + 20, { align: 'center', width: 515 });
        aplicarRodapeFinal(doc);
        doc.end();
        return;
      }

      // Larguras de Colunas (Total = 515)
      const cols = [
        { label: '#', width: 18, align: 'center' },
        { label: 'Consultor', width: 96, align: 'left' },
        { label: 'Badge Conquistado', width: 102, align: 'left' },
        { label: 'Nível', width: 48, align: 'center' },
        { label: 'Learning Path / SL', width: 110, align: 'left' },
        { label: 'Concluído em', width: 63, align: 'center' },
        { label: 'SLL Aprovador', width: 78, align: 'left' }
      ];

      const drawTableHeader = (y) => {
        doc.rect(40, y, 515, 20).fill(PALETTE.primary);
        let xPos = 40;
        cols.forEach(col => {
          doc.fillColor(PALETTE.white).font('Helvetica-Bold').fontSize(7.5).text(col.label, xPos + 2, y + 6, { width: col.width - 4, align: col.align, lineBreak: false });
          xPos += col.width;
        });
        return y + 20;
      };

      curY = drawTableHeader(curY);

      dados.forEach((item, index) => {
        const rowHeight = 36;
        if (curY + rowHeight > 730) {
          doc.addPage();
          curY = desenharCabecalho(doc, 'Relatório de Badges Atribuídos (Continuação)', subtitulo);
          curY = drawTableHeader(curY);
        }

        const isZebra = index % 2 === 1;
        if (isZebra) {
          doc.rect(40, curY, 515, rowHeight).fill(PALETTE.zebraBg);
        }

        let xPos = 40;
        // #
        doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(7.5).text(String(index + 1), xPos, curY + (rowHeight - 8) / 2, { width: cols[0].width, align: 'center', lineBreak: false });
        xPos += cols[0].width;

        // Consultor
        if (opcoes.avatar) {
          desenharAvatarSeguro(doc, item.consultorAvatar, item.consultorNome, xPos + 2, curY + (rowHeight - 22) / 2, 22);
          doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text(item.consultorNome, xPos + 26, curY + 8, { width: cols[1].width - 28, lineBreak: false });
          doc.fillColor(PALETTE.gray).font('Helvetica').fontSize(6.5).text(item.consultorEmail, xPos + 26, curY + 19, { width: cols[1].width - 28, lineBreak: false });
        } else {
          doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text(item.consultorNome, xPos + 2, curY + 8, { width: cols[1].width - 4, lineBreak: false });
          doc.fillColor(PALETTE.gray).font('Helvetica').fontSize(6.5).text(item.consultorEmail, xPos + 2, curY + 19, { width: cols[1].width - 4, lineBreak: false });
        }
        xPos += cols[1].width;

        // Badge
        if (opcoes.logo) {
          desenharLogoSeguro(doc, item.badgeLogo, item.badgeNome, xPos + 2, curY + (rowHeight - 22) / 2, 22);
          doc.fillColor(PALETTE.primary).font('Helvetica-Bold').fontSize(7.5).text(item.badgeNome, xPos + 26, curY + (rowHeight - 16) / 2, { width: cols[2].width - 28 });
        } else {
          doc.fillColor(PALETTE.primary).font('Helvetica-Bold').fontSize(7.5).text(item.badgeNome, xPos + 2, curY + (rowHeight - 16) / 2, { width: cols[2].width - 4 });
        }
        xPos += cols[2].width;

        // Nível
        doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(7.5).text(item.nivel || '-', xPos, curY + (rowHeight - 8) / 2, { width: cols[3].width, align: 'center', lineBreak: false });
        xPos += cols[3].width;

        // LP / SL (com quebra dinâmica para até 4 linhas sem sobreposição)
        const lpColX = xPos + 2;
        const lpColWidth = cols[4].width - 4;
        doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(6.8).text(item.learningPath || '-', lpColX, curY + 4, { width: lpColWidth });
        const slStartY = Math.max(doc.y + 1, curY + 14);
        doc.fillColor(PALETTE.gray).font('Helvetica').fontSize(6.3).text(item.serviceLine || '-', lpColX, slStartY, { width: lpColWidth });
        xPos += cols[4].width;

        // Concluído em
        doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(7.5).text(item.dataConclusao || '-', xPos, curY + (rowHeight - 8) / 2, { width: cols[5].width, align: 'center', lineBreak: false });
        xPos += cols[5].width;

        // SLL Aprovador
        doc.fillColor(PALETTE.green).font('Helvetica-Bold').fontSize(7.5).text(item.sllAprovador || '-', xPos + 2, curY + (rowHeight - 8) / 2, { width: cols[6].width - 4, lineBreak: false });

        doc.strokeColor(PALETTE.border).lineWidth(0.5).moveTo(40, curY + rowHeight).lineTo(555, curY + rowHeight).stroke();
        curY += rowHeight;
      });

      aplicarRodapeFinal(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// =========================================================================
// 2. Gerar PDF: Candidaturas / Pedidos por Estado
// =========================================================================
function gerarPDFCandidaturas(dados, filtros, opcoes = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const subtitulo = `Estado Filtrado: ${filtros.estadoNome || 'Todos os Estados'}  |  Total de Registos: ${dados.length}`;
      let curY = desenharCabecalho(doc, 'Relatório Geral de Candidaturas', subtitulo);

      if (dados.length === 0) {
        doc.fillColor(PALETTE.gray).font('Helvetica-Oblique').fontSize(10).text('Nenhuma candidatura encontrada para os critérios selecionados.', 40, curY + 20, { align: 'center', width: 515 });
        aplicarRodapeFinal(doc);
        doc.end();
        return;
      }

      const cols = [
        { label: '#', width: 20, align: 'center' },
        { label: 'Data Início', width: 55, align: 'center' },
        { label: 'Estado Atual', width: 65, align: 'center' },
        { label: 'Conclusão', width: 55, align: 'center' },
        { label: 'Consultor', width: 110, align: 'left' },
        { label: 'Badge Requerido', width: 110, align: 'left' },
        { label: 'Área / Nível', width: 100, align: 'left' }
      ];

      const drawTableHeader = (y) => {
        doc.rect(40, y, 515, 20).fill(PALETTE.primary);
        let xPos = 40;
        cols.forEach(col => {
          doc.fillColor(PALETTE.white).font('Helvetica-Bold').fontSize(7.5).text(col.label, xPos + 2, y + 6, { width: col.width - 4, align: col.align, lineBreak: false });
          xPos += col.width;
        });
        return y + 20;
      };

      curY = drawTableHeader(curY);

      dados.forEach((item, index) => {
        const rowHeight = 35;
        if (curY + rowHeight > 730) {
          doc.addPage();
          curY = desenharCabecalho(doc, 'Relatório Geral de Candidaturas (Continuação)', subtitulo);
          curY = drawTableHeader(curY);
        }

        const isZebra = index % 2 === 1;
        if (isZebra) {
          doc.rect(40, curY, 515, rowHeight).fill(PALETTE.zebraBg);
        }

        let xPos = 40;
        // #
        doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(7.5).text(String(index + 1), xPos, curY + (rowHeight - 8) / 2, { width: cols[0].width, align: 'center', lineBreak: false });
        xPos += cols[0].width;

        // Data Início
        doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(7.5).text(item.dataInicio, xPos, curY + (rowHeight - 8) / 2, { width: cols[1].width, align: 'center', lineBreak: false });
        xPos += cols[1].width;

        // Estado
        let corEstado = PALETTE.primary;
        if (item.estado === 'Aprovado') corEstado = PALETTE.green;
        else if (item.estado === 'Rejeitado') corEstado = '#DC2626';
        else if (item.estado === 'Em Validação') corEstado = '#D97706';
        doc.fillColor(corEstado).font('Helvetica-Bold').fontSize(7.5).text(item.estado, xPos + 2, curY + (rowHeight - 8) / 2, { width: cols[2].width - 4, align: 'center', lineBreak: false });
        xPos += cols[2].width;

        // Conclusão
        doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(7.5).text(item.dataConclusao || '-', xPos, curY + (rowHeight - 8) / 2, { width: cols[3].width, align: 'center', lineBreak: false });
        xPos += cols[3].width;

        // Consultor
        if (opcoes.avatar) {
          desenharAvatarSeguro(doc, item.consultorAvatar, item.consultorNome, xPos + 2, curY + 6, 22);
          doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text(item.consultorNome, xPos + 26, curY + 6, { width: cols[4].width - 28, lineBreak: false });
          doc.fillColor(PALETTE.gray).font('Helvetica').fontSize(6.5).text(item.consultorEmail, xPos + 26, curY + 17, { width: cols[4].width - 28, lineBreak: false });
        } else {
          doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text(item.consultorNome, xPos + 2, curY + 6, { width: cols[4].width - 4, lineBreak: false });
          doc.fillColor(PALETTE.gray).font('Helvetica').fontSize(6.5).text(item.consultorEmail, xPos + 2, curY + 17, { width: cols[4].width - 4, lineBreak: false });
        }
        xPos += cols[4].width;

        // Badge
        if (opcoes.logo) {
          desenharLogoSeguro(doc, item.badgeLogo, item.badgeNome, xPos + 2, curY + 6, 22);
          doc.fillColor(PALETTE.primary).font('Helvetica-Bold').fontSize(7.5).text(item.badgeNome, xPos + 26, curY + (rowHeight - 8) / 2, { width: cols[5].width - 28, lineBreak: false });
        } else {
          doc.fillColor(PALETTE.primary).font('Helvetica-Bold').fontSize(7.5).text(item.badgeNome, xPos + 2, curY + (rowHeight - 8) / 2, { width: cols[5].width - 4, lineBreak: false });
        }
        xPos += cols[5].width;

        // Área / Nível (com quebra dinâmica)
        const areaColX = xPos + 2;
        const areaColWidth = cols[6].width - 4;
        doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(6.8).text(item.area || '-', areaColX, curY + 6, { width: areaColWidth });
        const nivelStartY = Math.max(doc.y + 1, curY + 18);
        doc.fillColor(PALETTE.gray).font('Helvetica').fontSize(6.3).text(item.nivel || '-', areaColX, nivelStartY, { width: areaColWidth });

        doc.strokeColor(PALETTE.border).lineWidth(0.5).moveTo(40, curY + rowHeight).lineTo(555, curY + rowHeight).stroke();
        curY += rowHeight;
      });

      aplicarRodapeFinal(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// =========================================================================
// 3. Gerar PDF: Catálogo Geral de Badges
// =========================================================================
function gerarPDFBadges(dados, opcoes = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const subtitulo = `Catálogo Geral de Badges Ativos  |  Total de Badges Registados: ${dados.length}`;
      let curY = desenharCabecalho(doc, 'Catálogo Geral de Badges', subtitulo);

      const cols = [
        { label: '#', width: 20, align: 'center' },
        { label: 'Badge', width: 120, align: 'left' },
        { label: 'Descrição', width: 135, align: 'left' },
        { label: 'Pts', width: 35, align: 'center' },
        { label: 'Expiração', width: 55, align: 'center' },
        { label: 'Nível', width: 50, align: 'center' },
        { label: 'Área / Service Line', width: 100, align: 'left' }
      ];

      const drawTableHeader = (y) => {
        doc.rect(40, y, 515, 20).fill(PALETTE.primary);
        let xPos = 40;
        cols.forEach(col => {
          doc.fillColor(PALETTE.white).font('Helvetica-Bold').fontSize(7.5).text(col.label, xPos + 2, y + 6, { width: col.width - 4, align: col.align, lineBreak: false });
          xPos += col.width;
        });
        return y + 20;
      };

      curY = drawTableHeader(curY);

      dados.forEach((item, index) => {
        const rowHeight = 45;
        if (curY + rowHeight > 730) {
          doc.addPage();
          curY = desenharCabecalho(doc, 'Catálogo Geral de Badges (Continuação)', subtitulo);
          curY = drawTableHeader(curY);
        }

        const isZebra = index % 2 === 1;
        if (isZebra) {
          doc.rect(40, curY, 515, rowHeight).fill(PALETTE.zebraBg);
        }

        let xPos = 40;
        // #
        doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(7.5).text(String(index + 1), xPos, curY + (rowHeight - 8) / 2, { width: cols[0].width, align: 'center', lineBreak: false });
        xPos += cols[0].width;

        // Badge (com ou sem logo)
        if (opcoes.logo) {
          desenharLogoSeguro(doc, item.logo, item.nome, xPos + 2, curY + 8, 26);
          doc.fillColor(PALETTE.primary).font('Helvetica-Bold').fontSize(7.5).text(item.nome, xPos + 32, curY + 6, { width: cols[1].width - 34 });
          if (item.emissor) {
            doc.fillColor(PALETTE.gray).font('Helvetica').fontSize(6.5).text(`Emissor: ${item.emissor}`, xPos + 32, curY + 28, { width: cols[1].width - 34, lineBreak: false });
          }
        } else {
          doc.fillColor(PALETTE.primary).font('Helvetica-Bold').fontSize(7.5).text(item.nome, xPos + 2, curY + 6, { width: cols[1].width - 4 });
          if (item.emissor) {
            doc.fillColor(PALETTE.gray).font('Helvetica').fontSize(6.5).text(`Emissor: ${item.emissor}`, xPos + 2, curY + 28, { width: cols[1].width - 4, lineBreak: false });
          }
        }
        xPos += cols[1].width;

        // Descrição
        doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(6.8).text(item.descricao || '-', xPos + 2, curY + 5, { width: cols[2].width - 4, height: rowHeight - 8 });
        xPos += cols[2].width;

        // Pontos
        doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text(String(item.pontos || 0), xPos, curY + (rowHeight - 8) / 2, { width: cols[3].width, align: 'center', lineBreak: false });
        xPos += cols[3].width;

        // Expiração
        doc.fillColor(PALETTE.gray).font('Helvetica').fontSize(7).text(item.expiracao || 'Não expira', xPos, curY + (rowHeight - 8) / 2, { width: cols[4].width, align: 'center', lineBreak: false });
        xPos += cols[4].width;

        // Nível
        doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(7).text(item.nivel || '-', xPos, curY + (rowHeight - 8) / 2, { width: cols[5].width, align: 'center', lineBreak: false });
        xPos += cols[5].width;

        // Área / Service Line (com quebra dinâmica)
        const areaSlColX = xPos + 2;
        const areaSlColWidth = cols[6].width - 4;
        doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(6.8).text(item.area || '-', areaSlColX, curY + 6, { width: areaSlColWidth });
        const slColStartY = Math.max(doc.y + 1, curY + 22);
        doc.fillColor(PALETTE.gray).font('Helvetica').fontSize(6.3).text(item.serviceLine || '-', areaSlColX, slColStartY, { width: areaSlColWidth });

        doc.strokeColor(PALETTE.border).lineWidth(0.5).moveTo(40, curY + rowHeight).lineTo(555, curY + rowHeight).stroke();
        curY += rowHeight;
      });

      aplicarRodapeFinal(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

// =========================================================================
// 4. Gerar PDF: Relatório Geral sobre os Consultores (Com Agrupamento Estruturado)
// =========================================================================
function gerarPDFConsultores(dados, opcoes = {}) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 40, bufferPages: true });
      const buffers = [];
      doc.on('data', chunk => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));

      const subtitulo = `Visão Detalhada de Consultores, Pontuações e Conquistas  |  Total de Consultores: ${dados.length}`;
      let curY = desenharCabecalho(doc, 'Relatório Geral de Consultores', subtitulo);

      dados.forEach((c, index) => {
        // Estima altura do bloco do consultor
        const temAvatar = Boolean(opcoes.avatar);
        const cardHeight = temAvatar ? 104 : 88;
        const alturaEstimada = cardHeight + 8;

        if (curY + alturaEstimada > 730) {
          doc.addPage();
          curY = desenharCabecalho(doc, 'Relatório Geral de Consultores (Continuação)', subtitulo);
        }

        // Cartão do Consultor
        const cardX = 40;
        const cardWidth = 515;
        const cardY = curY;

        // Fundo do Cartão
        doc.roundedRect(cardX, cardY, cardWidth, cardHeight, 4).fillAndStroke(PALETTE.lightBg, PALETTE.border);

        // Barra superior do cartão
        doc.roundedRect(cardX, cardY, cardWidth, 20, 4).fill(PALETTE.primary);
        doc.rect(cardX, cardY + 16, cardWidth, 4).fill(PALETTE.primary); // fecha cantos inferiores da barra

        // Cabeçalho do Cartão: Nome + Pontos
        doc.fillColor(PALETTE.white).font('Helvetica-Bold').fontSize(9)
           .text(`${index + 1}. ${c.nomeCompleto}`, cardX + 8, cardY + 5, { lineBreak: false });

        doc.fillColor(PALETTE.white).font('Helvetica-Bold').fontSize(8.5)
           .text(`Total: ${c.totalPontos} pts`, cardX + cardWidth - 100, cardY + 5, { align: 'right', width: 90, lineBreak: false });

        // Linha de Metadados do Consultor (com ou sem avatar)
        if (temAvatar) {
          desenharAvatarSeguro(doc, c.consultorAvatar, c.nomeCompleto, cardX + 8, cardY + 25, 30);

          const metaY1 = cardY + 25;
          doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text('Email: ', cardX + 44, metaY1, { lineBreak: false });
          doc.font('Helvetica').fillColor(PALETTE.gray).text(c.email, cardX + 72, metaY1, { lineBreak: false });

          doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text('Área de Preferência: ', cardX + 220, metaY1, { lineBreak: false });
          doc.font('Helvetica').fillColor(PALETTE.primaryLight).text(c.areaPreferencia || 'Geral', cardX + 310, metaY1, { lineBreak: false });

          const metaY2 = cardY + 38;
          doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text('Registado em: ', cardX + 44, metaY2, { lineBreak: false });
          doc.font('Helvetica').fillColor(PALETTE.gray).text(c.dataRegisto || '-', cardX + 104, metaY2, { lineBreak: false });

          doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text('Idioma: ', cardX + 220, metaY2, { lineBreak: false });
          doc.font('Helvetica').fillColor(PALETTE.gray).text(c.idiomaExtenso, cardX + 255, metaY2, { lineBreak: false });

          // -------------------------------------------------------------
          // GRUPO 1: Badges Normais Conquistados
          // -------------------------------------------------------------
          const normaisY = cardY + 58;
          doc.rect(cardX + 8, normaisY, cardWidth - 16, 18).fill(PALETTE.greenBg);
          doc.strokeColor('#A7F3D0').lineWidth(0.5).rect(cardX + 8, normaisY, cardWidth - 16, 18).stroke();

          doc.fillColor(PALETTE.green).font('Helvetica-Bold').fontSize(7)
             .text(`Badges Normais (${c.badgesNormais.length}):`, cardX + 12, normaisY + 5, { lineBreak: false });

          const textoNormais = c.badgesNormais.length > 0 ? c.badgesNormais.join(', ') : 'Nenhum badge normal conquistado até ao momento.';
          doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(6.8)
             .text(textoNormais, cardX + 115, normaisY + 5, { width: cardWidth - 135, height: 12, ellipsis: true });

          // -------------------------------------------------------------
          // GRUPO 2: Badges Especiais Conquistados
          // -------------------------------------------------------------
          const especiaisY = cardY + 80;
          doc.rect(cardX + 8, especiaisY, cardWidth - 16, 18).fill(PALETTE.specialBg);
          doc.strokeColor('#DDD6FE').lineWidth(0.5).rect(cardX + 8, especiaisY, cardWidth - 16, 18).stroke();

          doc.fillColor(PALETTE.specialPurple).font('Helvetica-Bold').fontSize(7)
             .text(`Badges Especiais (${c.badgesEspeciais.length}):`, cardX + 12, especiaisY + 5, { lineBreak: false });

          const textoEspeciais = c.badgesEspeciais.length > 0 ? c.badgesEspeciais.join(', ') : 'Nenhum badge especial conquistado até ao momento.';
          doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(6.8)
             .text(textoEspeciais, cardX + 115, especiaisY + 5, { width: cardWidth - 135, height: 12, ellipsis: true });
        } else {
          const metaY = cardY + 26;
          doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text('Email: ', cardX + 8, metaY, { lineBreak: false });
          doc.font('Helvetica').fillColor(PALETTE.gray).text(c.email, cardX + 38, metaY, { lineBreak: false });

          doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text('Área de Preferência: ', cardX + 175, metaY, { lineBreak: false });
          doc.font('Helvetica').fillColor(PALETTE.primaryLight).text(c.areaPreferencia || 'Geral', cardX + 265, metaY, { lineBreak: false });

          doc.fillColor(PALETTE.dark).font('Helvetica-Bold').fontSize(7.5).text('Idioma: ', cardX + 375, metaY, { lineBreak: false });
          doc.font('Helvetica').fillColor(PALETTE.gray).text(c.idiomaExtenso, cardX + 412, metaY, { lineBreak: false });

          // -------------------------------------------------------------
          // GRUPO 1: Badges Normais Conquistados
          // -------------------------------------------------------------
          const normaisY = cardY + 44;
          doc.rect(cardX + 8, normaisY, cardWidth - 16, 18).fill(PALETTE.greenBg);
          doc.strokeColor('#A7F3D0').lineWidth(0.5).rect(cardX + 8, normaisY, cardWidth - 16, 18).stroke();

          doc.fillColor(PALETTE.green).font('Helvetica-Bold').fontSize(7)
             .text(`Badges Normais (${c.badgesNormais.length}):`, cardX + 12, normaisY + 5, { lineBreak: false });

          const textoNormais = c.badgesNormais.length > 0 ? c.badgesNormais.join(', ') : 'Nenhum badge normal conquistado até ao momento.';
          doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(6.8)
             .text(textoNormais, cardX + 115, normaisY + 5, { width: cardWidth - 135, height: 12, ellipsis: true });

          // -------------------------------------------------------------
          // GRUPO 2: Badges Especiais Conquistados
          // -------------------------------------------------------------
          const especiaisY = cardY + 65;
          doc.rect(cardX + 8, especiaisY, cardWidth - 16, 18).fill(PALETTE.specialBg);
          doc.strokeColor('#DDD6FE').lineWidth(0.5).rect(cardX + 8, especiaisY, cardWidth - 16, 18).stroke();

          doc.fillColor(PALETTE.specialPurple).font('Helvetica-Bold').fontSize(7)
             .text(`Badges Especiais (${c.badgesEspeciais.length}):`, cardX + 12, especiaisY + 5, { lineBreak: false });

          const textoEspeciais = c.badgesEspeciais.length > 0 ? c.badgesEspeciais.join(', ') : 'Nenhum badge especial conquistado até ao momento.';
          doc.fillColor(PALETTE.dark).font('Helvetica').fontSize(6.8)
             .text(textoEspeciais, cardX + 115, especiaisY + 5, { width: cardWidth - 135, height: 12, ellipsis: true });
        }

        curY += alturaEstimada;
      });

      aplicarRodapeFinal(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  gerarPDFBadgesAtribuidos,
  gerarPDFCandidaturas,
  gerarPDFBadges,
  gerarPDFConsultores
};
