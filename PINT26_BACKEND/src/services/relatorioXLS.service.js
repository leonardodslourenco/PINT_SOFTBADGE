// =========================================================================
// SERVIÇO DE GERAÇÃO DE RELATÓRIOS EM EXCEL (XLSX) VIA EXCELJS
// =========================================================================
const ExcelJS = require('exceljs');

const PALETTE = {
  headerBg: '1E3A8A',       // Azul Marinho Corporativo
  headerText: 'FFFFFF',     // Branco
  zebraBg: 'F8FAFC',        // Cinza Claro Suave
  titleBg: '0F172A',        // Slate Escuro
  borderColor: 'E2E8F0',    // Borda Suave
  accentBg: '3B82F6',       // Azul Real
  specialBadgeBg: '7C3AED'  // Roxo para Badges Especiais
};

/**
 * Aplica estilos padrão corporativos SoftBadge ao cabeçalho e grelha de uma folha Excel.
 */
function formatarFolhaPadrao(worksheet, tituloRelatorio, filtrosText = '') {
  worksheet.views = [{ showGridLines: true }];

  // Linha 1: Título do Sistema
  worksheet.mergeCells('A1:H1');
  const cellTitulo = worksheet.getCell('A1');
  cellTitulo.value = `SOFTBADGE — ${tituloRelatorio.toUpperCase()}`;
  cellTitulo.font = { name: 'Segoe UI', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  cellTitulo.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PALETTE.headerBg } };
  cellTitulo.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(1).height = 32;

  // Linha 2: Metadados / Data de Emissão / Filtros
  worksheet.mergeCells('A2:H2');
  const cellMeta = worksheet.getCell('A2');
  const nowStr = new Date().toLocaleString('pt-PT');
  cellMeta.value = `Data de Emissão: ${nowStr} ${filtrosText ? `| Filtros: ${filtrosText}` : ''}`;
  cellMeta.font = { name: 'Segoe UI', size: 9, italic: true, color: { argb: 'FF64748B' } };
  cellMeta.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
  cellMeta.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 };
  worksheet.getRow(2).height = 20;

  // Linha 3 em branco
  worksheet.getRow(3).height = 10;
}

/**
 * Ajusta a largura automática de todas as colunas com base no conteúdo.
 */
function autoAjustarColunas(worksheet) {
  worksheet.columns.forEach(column => {
    let maxLength = 12;
    column.eachCell({ includeEmpty: true }, (cell, rowNumber) => {
      if (rowNumber <= 3) return; // Ignora título e metadados
      const cellValue = cell.value ? String(cell.value) : '';
      if (cellValue.length > maxLength) {
        maxLength = Math.min(cellValue.length + 4, 60);
      }
    });
    column.width = maxLength;
  });
}

/**
 * 1. Relatório de Badges Atribuídos por Área e Período
 */
async function gerarXLSBadgesAtribuidos(dados, filtros) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SoftBadge Platform';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Badges Atribuídos');
  const tipoNome = filtros.tipoFiltroNome || 'Âmbito';
  const entNome = filtros.entidadeNome || filtros.areaNome || filtros.id_area;
  const filtrosInfo = `${tipoNome}: ${entNome} | Período: ${filtros.data_inicio} a ${filtros.data_fim}`;
  formatarFolhaPadrao(worksheet, `Relatório de Badges Atribuídos por ${tipoNome} e Período`, filtrosInfo);

  // Cabeçalhos da Tabela na Linha 4
  const headerRow = worksheet.getRow(4);
  headerRow.values = [
    '#',
    'Consultor',
    'Email Consultor',
    'Badge Conquistado',
    'Nível',
    'Área',
    'Service Line',
    'Learning Path',
    'Data Candidatura',
    'Data Conclusão',
    'SLL Aprovador'
  ];
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PALETTE.headerBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF' + PALETTE.borderColor } },
      bottom: { style: 'medium', color: { argb: 'FF' + PALETTE.headerBg } }
    };
  });

  // Linhas de Dados
  dados.forEach((item, index) => {
    const row = worksheet.addRow([
      index + 1,
      item.consultorNome,
      item.consultorEmail,
      item.badgeNome,
      item.nivel,
      item.area,
      item.serviceLine,
      item.learningPath,
      item.dataInicio,
      item.dataConclusao,
      item.sllAprovador
    ]);
    row.height = 20;

    const isZebra = index % 2 === 1;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 ? 'center' : (colNumber >= 9 ? 'center' : 'left')
      };
      if (isZebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PALETTE.zebraBg } };
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF' + PALETTE.borderColor } }
      };
    });
  });

  autoAjustarColunas(worksheet);
  return await workbook.xlsx.writeBuffer();
}

/**
 * 2. Relatório de Candidaturas / Pedidos por Estado
 */
async function gerarXLSCandidaturas(dados, filtros) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SoftBadge Platform';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Candidaturas');
  const filtrosInfo = `Estado: ${filtros.estadoNome || 'Todos os Estados'}`;
  formatarFolhaPadrao(worksheet, 'Relatório Geral de Candidaturas', filtrosInfo);

  // Cabeçalhos na Linha 4
  const headerRow = worksheet.getRow(4);
  headerRow.values = [
    '#',
    'Data Candidatura',
    'Estado Atual',
    'Data Conclusão',
    'Consultor',
    'Email Consultor',
    'Badge',
    'Nível',
    'Área',
    'Service Line',
    'Learning Path'
  ];
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PALETTE.headerBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF' + PALETTE.borderColor } },
      bottom: { style: 'medium', color: { argb: 'FF' + PALETTE.headerBg } }
    };
  });

  dados.forEach((item, index) => {
    const row = worksheet.addRow([
      index + 1,
      item.dataInicio,
      item.estado,
      item.dataConclusao || 'Em Andamento',
      item.consultorNome,
      item.consultorEmail,
      item.badgeNome,
      item.nivel,
      item.area,
      item.serviceLine,
      item.learningPath
    ]);
    row.height = 20;

    const isZebra = index % 2 === 1;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: [1, 2, 3, 4].includes(colNumber) ? 'center' : 'left'
      };
      if (isZebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PALETTE.zebraBg } };
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF' + PALETTE.borderColor } }
      };
    });
  });

  autoAjustarColunas(worksheet);
  return await workbook.xlsx.writeBuffer();
}

/**
 * 3. Relatório do Catálogo Geral de Badges
 */
async function gerarXLSBadges(dados) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SoftBadge Platform';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Catálogo de Badges');
  formatarFolhaPadrao(worksheet, 'Catálogo Geral de Badges');

  const headerRow = worksheet.getRow(4);
  headerRow.values = [
    '#',
    'Nome do Badge',
    'Descrição',
    'Pontos',
    'Expiração',
    'Emissor',
    'Nível',
    'Área',
    'Service Line',
    'Learning Path'
  ];
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PALETTE.headerBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF' + PALETTE.borderColor } },
      bottom: { style: 'medium', color: { argb: 'FF' + PALETTE.headerBg } }
    };
  });

  dados.forEach((item, index) => {
    const row = worksheet.addRow([
      index + 1,
      item.nome,
      item.descricao,
      item.pontos,
      item.expiracao,
      item.emissor,
      item.nivel,
      item.area,
      item.serviceLine,
      item.learningPath
    ]);
    row.height = 20;

    const isZebra = index % 2 === 1;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNumber === 1 || colNumber === 4 || colNumber === 5 ? 'center' : 'left'
      };
      if (isZebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PALETTE.zebraBg } };
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF' + PALETTE.borderColor } }
      };
    });
  });

  autoAjustarColunas(worksheet);
  return await workbook.xlsx.writeBuffer();
}

/**
 * 4. Relatório Geral sobre os Consultores
 */
async function gerarXLSConsultores(dados) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SoftBadge Platform';
  workbook.created = new Date();

  // Folha 1: Visão Consolidada dos Consultores
  const wsConsultores = workbook.addWorksheet('Consultores');
  formatarFolhaPadrao(wsConsultores, 'Relatório Geral de Consultores e Pontuações');

  const headerRow = wsConsultores.getRow(4);
  headerRow.values = [
    '#',
    'Consultor',
    'Email',
    'Idioma Preferencial',
    'Data de Registo',
    'Área de Preferência',
    'Total de Pontos',
    'Badges Normais (Qtd)',
    'Badges Especiais (Qtd)',
    'Lista de Badges Normais Conquistados',
    'Lista de Badges Especiais Conquistados'
  ];
  headerRow.height = 26;
  headerRow.eachCell((cell) => {
    cell.font = { name: 'Segoe UI', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PALETTE.headerBg } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF' + PALETTE.borderColor } },
      bottom: { style: 'medium', color: { argb: 'FF' + PALETTE.headerBg } }
    };
  });

  dados.forEach((c, index) => {
    const row = wsConsultores.addRow([
      index + 1,
      c.nomeCompleto,
      c.email,
      c.idiomaExtenso,
      c.dataRegisto,
      c.areaPreferencia,
      c.totalPontos,
      c.badgesNormais.length,
      c.badgesEspeciais.length,
      c.badgesNormais.join('; ') || 'Nenhum',
      c.badgesEspeciais.join('; ') || 'Nenhum'
    ]);
    row.height = 22;

    const isZebra = index % 2 === 1;
    row.eachCell((cell, colNumber) => {
      cell.font = { name: 'Segoe UI', size: 9 };
      cell.alignment = {
        vertical: 'middle',
        horizontal: [1, 4, 5, 7, 8, 9].includes(colNumber) ? 'center' : 'left'
      };
      if (isZebra) {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + PALETTE.zebraBg } };
      }
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FF' + PALETTE.borderColor } }
      };
    });
  });

  autoAjustarColunas(wsConsultores);
  return await workbook.xlsx.writeBuffer();
}

module.exports = {
  gerarXLSBadgesAtribuidos,
  gerarXLSCandidaturas,
  gerarXLSBadges,
  gerarXLSConsultores
};
