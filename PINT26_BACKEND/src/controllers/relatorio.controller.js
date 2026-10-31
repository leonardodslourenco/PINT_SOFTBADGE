// =========================================================================
// CONTROLADOR DE EMISSÃO E EXPORTAÇÃO DE RELATÓRIOS (PDF / EXCEL)
// =========================================================================
const { Op } = require('sequelize');
const Candidatura = require('../models/candidatura_badge.model');
const Badge = require('../models/badge.model');
const NivelArea = require('../models/nivel.model');
const Area = require('../models/area.model');
const ServiceLine = require('../models/service_line.model');
const LearningPath = require('../models/learning_path.model');
const Utilizador = require('../models/utilizador.model');
const Perfil = require('../models/perfil.model');
const PerfilUtilizador = require('../models/perfil_utilizador.model');
const AcaoCandidatura = require('../models/acao_candidatura.model');
const ConquistaAtribuida = require('../models/conquista_atribuida.model');
const ConquistaEspecial = require('../models/conquista_especial.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');

const {
  gerarPDFBadgesAtribuidos,
  gerarPDFCandidaturas,
  gerarPDFBadges,
  gerarPDFConsultores
} = require('../services/relatorioPDF.service');

const {
  gerarXLSBadgesAtribuidos,
  gerarXLSCandidaturas,
  gerarXLSBadges,
  gerarXLSConsultores
} = require('../services/relatorioXLS.service');

const controllersRelatorio = {};

// Dicionário de Idiomas por Extenso
const MAPA_IDIOMAS = {
  pt: 'Português',
  en: 'Inglês',
  es: 'Espanhol'
};

// Dicionário de Estados de Candidatura por Extenso
const MAPA_ESTADOS = {
  pt: { 1: 'Rascunho', 2: 'Submetido', 3: 'Em Validação', 4: 'Aprovado', 5: 'Rejeitado' },
  en: { 1: 'Draft', 2: 'Submitted', 3: 'In Validation', 4: 'Approved', 5: 'Rejected' },
  es: { 1: 'Borrador', 2: 'Enviado', 3: 'En Validación', 4: 'Aprobado', 5: 'Rechazado' }
};

// Dicionário de Textos de Expiração
const MAPA_EXPIRACAO = {
  pt: { nao_expira: 'Não expira', dias: (d) => `${d} dia${d === 1 ? '' : 's'}` },
  en: { nao_expira: 'Does not expire', dias: (d) => `${d} day${d === 1 ? '' : 's'}` },
  es: { nao_expira: 'No expira', dias: (d) => `${d} día${d === 1 ? '' : 's'}` }
};

/**
 * Helper para extrair parâmetros unificados de req.body ou req.query.
 */
function extrairParams(req) {
  const body = req.body || {};
  const query = req.query || {};
  return {
    formato: (body.formato || query.formato || 'pdf').toLowerCase().trim(),
    logo: body.logo === true || body.logo === 'true' || query.logo === 'true' || query.logo === true,
    avatar: body.avatar === true || body.avatar === 'true' || query.avatar === 'true' || query.avatar === true,
    tipo_filtro: (body.tipo_filtro || body.tipoFiltro || query.tipo_filtro || query.tipoFiltro || '').toLowerCase().trim(),
    id_area: body.id_area !== undefined ? body.id_area : query.id_area,
    id_sl: body.id_sl !== undefined ? body.id_sl : (query.id_sl !== undefined ? query.id_sl : (body.id_service_line !== undefined ? body.id_service_line : query.id_service_line)),
    id_lp: body.id_lp !== undefined ? body.id_lp : (query.id_lp !== undefined ? query.id_lp : (body.id_learning_path !== undefined ? body.id_learning_path : query.id_learning_path)),
    id_filtro: body.id_filtro !== undefined ? body.id_filtro : query.id_filtro,
    data_inicio: body.data_inicio || query.data_inicio,
    data_fim: body.data_fim || query.data_fim,
    estado: body.estado !== undefined ? body.estado : (query.estado !== undefined ? query.estado : query.id_estado_candidatura),
    lang: req.lang || body.lang || query.lang || 'pt'
  };
}

/**
 * Helper para validar e processar estritamente o intervalo de datas do Relatório 1.
 * Regras:
 * - Ano: máximo ano atual, mínimo 10 anos atrás.
 * - Mês: 1 a 12.
 * - Dias: 1 a 31 (validado contra o mês/ano exato).
 * - Sem letras ou caracteres inválidos.
 * - Em caso de omissão: data_inicio = 01 de janeiro de 10 anos atrás; data_fim = hoje (fim do dia).
 */
function validarEProcessarDatasRelatorio1(data_inicio_raw, data_fim_raw) {
  const agora = new Date();
  const anoAtual = agora.getFullYear();
  const anoMinimo = anoAtual - 10;
  const hojeFim = new Date(anoAtual, agora.getMonth(), agora.getDate(), 23, 59, 59, 999);
  const dataMinimaGeral = new Date(anoMinimo, 0, 1, 0, 0, 0, 0);

  function parseEValidarData(val, campoNome, isFim = false) {
    if (val === undefined || val === null || (typeof val === 'string' && val.trim() === '')) {
      return isFim ? hojeFim : dataMinimaGeral;
    }

    if (typeof val !== 'string') {
      throw new Error(`O campo ${campoNome} deve ser uma data válida em formato de texto.`);
    }

    const str = val.trim();
    let ano, mes, dia;

    // Formato YYYY-MM-DD
    const isoMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    // Formato DD/MM/YYYY
    const brMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);

    if (isoMatch) {
      ano = parseInt(isoMatch[1], 10);
      mes = parseInt(isoMatch[2], 10);
      dia = parseInt(isoMatch[3], 10);
    } else if (brMatch) {
      dia = parseInt(brMatch[1], 10);
      mes = parseInt(brMatch[2], 10);
      ano = parseInt(brMatch[3], 10);
    } else {
      throw new Error(`O campo ${campoNome} contém um formato inválido ('${str}'). Utilize o formato AAAA-MM-DD ou DD/MM/AAAA, sem letras ou caracteres alfabéticos.`);
    }

    // Validação do ano (mínimo 10 anos atrás, máximo ano atual)
    if (ano < anoMinimo || ano > anoAtual) {
      throw new Error(`O ano no campo ${campoNome} (${ano}) é inválido. Deve estar compreendido entre ${anoMinimo} e ${anoAtual}.`);
    }

    // Validação do mês (1 a 12)
    if (mes < 1 || mes > 12) {
      throw new Error(`O mês no campo ${campoNome} (${mes}) deve ser um valor entre 1 e 12.`);
    }

    // Validação do dia conforme o mês e ano (respeitando anos bissextos)
    const diasNoMes = new Date(ano, mes, 0).getDate();
    if (dia < 1 || dia > diasNoMes) {
      throw new Error(`O dia no campo ${campoNome} (${dia}) é inválido para o mês ${mes}/${ano}. Deve ser entre 1 e ${diasNoMes}.`);
    }

    const dataObj = isFim
      ? new Date(ano, mes - 1, dia, 23, 59, 59, 999)
      : new Date(ano, mes - 1, dia, 0, 0, 0, 0);

    if (dataObj.getTime() > hojeFim.getTime()) {
      throw new Error(`O campo ${campoNome} não pode conter uma data futura posterior ao dia de hoje.`);
    }

    if (dataObj.getTime() < dataMinimaGeral.getTime()) {
      throw new Error(`O campo ${campoNome} não pode ser anterior a ${formatarDataBR(dataMinimaGeral)}.`);
    }

    return dataObj;
  }

  const dataInicioDate = parseEValidarData(data_inicio_raw, 'data_inicio', false);
  const dataFimDate = parseEValidarData(data_fim_raw, 'data_fim', true);

  if (dataInicioDate.getTime() > dataFimDate.getTime()) {
    throw new Error('A data de início não pode ser posterior à data de fim.');
  }

  return { dataInicioDate, dataFimDate };
}

/**
 * Helper para normalizar data DD/MM/YYYY ou YYYY-MM-DD para Date do JavaScript (genérico).
 */
function parseDataFiltro(dataStr, isFim = false) {
  if (!dataStr) return isFim ? new Date(2099, 11, 31, 23, 59, 59) : new Date(1970, 0, 1);
  if (dataStr.includes('/')) {
    const parts = dataStr.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      return isFim ? new Date(y, m, d, 23, 59, 59) : new Date(y, m, d, 0, 0, 0);
    }
  }
  const parsed = new Date(dataStr);
  if (!isNaN(parsed.getTime())) {
    if (isFim) parsed.setHours(23, 59, 59, 999);
    else parsed.setHours(0, 0, 0, 0);
    return parsed;
  }
  return isFim ? new Date(2099, 11, 31, 23, 59, 59) : new Date(1970, 0, 1);
}

/**
 * Helper para formatar data Date -> DD/MM/YYYY.
 */
function formatarDataBR(d) {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  const dia = String(date.getDate()).padStart(2, '0');
  const mes = String(date.getMonth() + 1).padStart(2, '0');
  const ano = date.getFullYear();
  return `${dia}/${mes}/${ano}`;
}

/**
 * Envia o ficheiro gerado na resposta HTTP com os cabeçalhos apropriados.
 */
function enviarRespostaDocumento(res, buffer, formato, nomeFicheiroBase) {
  const isExcel = formato === 'xls' || formato === 'xlsx' || formato === 'excel';
  const ext = isExcel ? 'xlsx' : 'pdf';
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const fileName = `${nomeFicheiroBase}_${timestamp}.${ext}`;

  if (isExcel) {
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
  } else {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${fileName}"`);
  }

  res.setHeader('Content-Length', buffer.length);
  return res.status(200).send(buffer);
}

// =========================================================================
// 1. RELATÓRIO: Badges Atribuídos por Âmbito (LP | SL | Área) e Período
// =========================================================================
controllersRelatorio.relatorioBadgesAtribuidos = async (req, res) => {
  try {
    const { formato, logo, avatar, tipo_filtro, id_area, id_sl, id_lp, id_filtro, data_inicio, data_fim, lang } = extrairParams(req);

    // Determina o tipo de filtro (retrocompatibilidade: se não informado, deduz por id_lp / id_sl / id_area)
    let tipoFiltro = tipo_filtro;
    if (!tipoFiltro) {
      if (id_lp !== undefined) tipoFiltro = 'lp';
      else if (id_sl !== undefined) tipoFiltro = 'sl';
      else tipoFiltro = 'area';
    }

    let idEntidade;
    let tipoFiltroNome;
    let entidadeNome;
    let nivelAreaWhere = undefined;
    let areaWhere = undefined;
    let serviceLineWhere = undefined;
    let learningPathWhere = undefined;

    // Normalização do tipo de filtro
    if (tipoFiltro === 'lp' || tipoFiltro === 'learning_path' || tipoFiltro === 'learningpath') {
      tipoFiltro = 'lp';
      tipoFiltroNome = 'Learning Path';
      idEntidade = id_lp !== undefined ? id_lp : id_filtro;

      if (!idEntidade || isNaN(Number(idEntidade)) || !Number.isInteger(Number(idEntidade)) || Number(idEntidade) <= 0) {
        return res.status(400).json({ success: false, message: 'O parâmetro id_lp (ou id_learning_path) é obrigatório e deve ser um número inteiro positivo.' });
      }

      const lp = await LearningPath.findByPk(Number(idEntidade), {
        include: [{ model: TraducaoConteudo, as: 'traducao_learning_path' }]
      });
      if (!lp) {
        return res.status(404).json({ success: false, message: `Learning Path com ID ${idEntidade} não foi encontrado.` });
      }
      entidadeNome = lp?.traducao_learning_path?.[lang] || lp?.traducao_learning_path?.pt || `Learning Path ${idEntidade}`;
      serviceLineWhere = { id_learning_path: Number(idEntidade) };

    } else if (tipoFiltro === 'sl' || tipoFiltro === 'service_line' || tipoFiltro === 'serviceline') {
      tipoFiltro = 'sl';
      tipoFiltroNome = 'Service Line';
      idEntidade = id_sl !== undefined ? id_sl : id_filtro;

      if (!idEntidade || isNaN(Number(idEntidade)) || !Number.isInteger(Number(idEntidade)) || Number(idEntidade) <= 0) {
        return res.status(400).json({ success: false, message: 'O parâmetro id_sl (ou id_service_line) é obrigatório e deve ser um número inteiro positivo.' });
      }

      const sl = await ServiceLine.findByPk(Number(idEntidade), {
        include: [{ model: TraducaoConteudo, as: 'traducao_service_line' }]
      });
      if (!sl) {
        return res.status(404).json({ success: false, message: `Service Line com ID ${idEntidade} não foi encontrada.` });
      }
      entidadeNome = sl?.traducao_service_line?.[lang] || sl?.traducao_service_line?.pt || `Service Line ${idEntidade}`;
      areaWhere = { id_service_line: Number(idEntidade) };

    } else if (tipoFiltro === 'area' || tipoFiltro === 'área') {
      tipoFiltro = 'area';
      tipoFiltroNome = 'Área';
      idEntidade = id_area !== undefined ? id_area : id_filtro;

      if (!idEntidade || isNaN(Number(idEntidade)) || !Number.isInteger(Number(idEntidade)) || Number(idEntidade) <= 0) {
        return res.status(400).json({ success: false, message: 'O parâmetro id_area é obrigatório e deve ser um número inteiro positivo.' });
      }

      const area = await Area.findByPk(Number(idEntidade), {
        include: [{ model: TraducaoConteudo, as: 'traducao_area' }]
      });
      if (!area) {
        return res.status(404).json({ success: false, message: `Área com ID ${idEntidade} não foi encontrada.` });
      }
      entidadeNome = area?.traducao_area?.[lang] || area?.traducao_area?.pt || `Área ${idEntidade}`;
      nivelAreaWhere = { id_area_sl: Number(idEntidade) };

    } else {
      return res.status(400).json({ success: false, message: `Tipo de filtro inválido ('${tipoFiltro}'). Use 'lp', 'sl' ou 'area'.` });
    }

    let dataInicioDate, dataFimDate;
    try {
      const datas = validarEProcessarDatasRelatorio1(data_inicio, data_fim);
      dataInicioDate = datas.dataInicioDate;
      dataFimDate = datas.dataFimDate;
    } catch (errData) {
      return res.status(400).json({ success: false, message: errData.message });
    }

    // Buscar candidaturas concluídas com sucesso (estado 4)
    const candidaturas = await Candidatura.findAll({
      where: {
        id_estado_candidatura: 4,
        candidaturaAtiva: true,
        data_encerramento_candidatura: {
          [Op.between]: [dataInicioDate, dataFimDate]
        }
      },
      include: [
        {
          model: Utilizador,
          as: 'consultor',
          attributes: ['id_utilizador', 'nome', 'apelido', 'email', 'avatar']
        },
        {
          model: Badge,
          as: 'badge',
          required: true,
          include: [
            { model: TraducaoConteudo, as: 'traducao_titulo' },
            {
              model: NivelArea,
              as: 'nivel_area',
              where: nivelAreaWhere,
              required: true,
              include: [
                { model: TraducaoConteudo, as: 'traducao_nivel_area' },
                {
                  model: Area,
                  as: 'area',
                  where: areaWhere,
                  required: true,
                  include: [
                    { model: TraducaoConteudo, as: 'traducao_area' },
                    {
                      model: ServiceLine,
                      as: 'service_line',
                      where: serviceLineWhere,
                      required: true,
                      include: [
                        { model: TraducaoConteudo, as: 'traducao_service_line' },
                        { model: Utilizador, as: 'lider_service_line', attributes: ['nome', 'apelido'] },
                        {
                          model: LearningPath,
                          as: 'learning_path',
                          where: learningPathWhere,
                          required: true,
                          include: [{ model: TraducaoConteudo, as: 'traducao_learning_path' }]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          model: AcaoCandidatura,
          as: 'acoes',
          where: { tipo_acao_candidatura: 6 }, // 6: Aprovada SLL
          required: false,
          include: [{ model: Utilizador, as: 'autor_acao', attributes: ['nome', 'apelido'] }]
        }
      ],
      order: [['data_encerramento_candidatura', 'DESC']]
    });

    const dadosFormatados = candidaturas.map(c => {
      const b = c.badge;
      const na = b?.nivel_area;
      const a = na?.area;
      const sl = a?.service_line;
      const lp = sl?.learning_path;

      // Obter SLL que aprovou da ação (ou fallback para líder da Service Line)
      let sllNome = sl?.lider_service_line ? `${sl.lider_service_line.nome} ${sl.lider_service_line.apelido}`.trim() : 'SLL Responsável';
      if (c.acoes && c.acoes.length > 0) {
        const acoesOrdenadas = [...c.acoes].sort((x, y) => new Date(y.data_acao_candidatura) - new Date(x.data_acao_candidatura));
        const acaoSLL = acoesOrdenadas.find(act => act.autor_acao);
        if (acaoSLL?.autor_acao) {
          sllNome = `${acaoSLL.autor_acao.nome} ${acaoSLL.autor_acao.apelido}`.trim();
        }
      }

      return {
        consultorNome: c.consultor ? `${c.consultor.nome} ${c.consultor.apelido}`.trim() : 'N/D',
        consultorEmail: c.consultor?.email || '',
        consultorAvatar: c.consultor?.avatar || '',
        badgeNome: b?.traducao_titulo?.[lang] || b?.traducao_titulo?.pt || 'Badge',
        badgeLogo: b?.logo || '',
        nivel: na?.traducao_nivel_area?.[lang] || na?.traducao_nivel_area?.pt || '-',
        area: a?.traducao_area?.[lang] || a?.traducao_area?.pt || '-',
        serviceLine: sl?.traducao_service_line?.[lang] || sl?.traducao_service_line?.pt || '-',
        learningPath: lp?.traducao_learning_path?.[lang] || lp?.traducao_learning_path?.pt || '-',
        dataInicio: formatarDataBR(c.data_candidatura),
        dataConclusao: formatarDataBR(c.data_encerramento_candidatura),
        sllAprovador: sllNome
      };
    });

    const filtros = {
      tipo_filtro: tipoFiltro,
      tipoFiltroNome,
      entidadeNome,
      id_entidade: idEntidade,
      id_area: idEntidade,
      areaNome: entidadeNome,
      data_inicio: formatarDataBR(dataInicioDate),
      data_fim: formatarDataBR(dataFimDate)
    };

    const nomeBase = `relatorio_badges_atribuidos_${tipoFiltro}_${idEntidade}`;

    if (formato === 'xls' || formato === 'xlsx' || formato === 'excel') {
      const buffer = await gerarXLSBadgesAtribuidos(dadosFormatados, filtros);
      return enviarRespostaDocumento(res, buffer, 'xlsx', nomeBase);
    } else {
      const buffer = await gerarPDFBadgesAtribuidos(dadosFormatados, filtros, { logo, avatar });
      return enviarRespostaDocumento(res, buffer, 'pdf', nomeBase);
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao gerar relatório de badges atribuídos.', error: error.message });
  }
};

// =========================================================================
// 2. RELATÓRIO: Candidaturas / Pedidos por Estado
// =========================================================================
controllersRelatorio.relatorioCandidaturas = async (req, res) => {
  try {
    const { formato, logo, avatar, estado, lang } = extrairParams(req);

    const where = { candidaturaAtiva: true };
    let estadoNome = 'Todos os Estados';

    if (estado !== undefined && String(estado) !== '6' && String(estado).toLowerCase() !== 'todos') {
      const numEstado = Number(estado);
      if ([1, 2, 3, 4, 5].includes(numEstado)) {
        where.id_estado_candidatura = numEstado;
        estadoNome = MAPA_ESTADOS[lang]?.[numEstado] || MAPA_ESTADOS.pt[numEstado];
      }
    }

    const candidaturas = await Candidatura.findAll({
      where,
      include: [
        {
          model: Utilizador,
          as: 'consultor',
          attributes: ['id_utilizador', 'nome', 'apelido', 'email', 'avatar']
        },
        {
          model: Badge,
          as: 'badge',
          include: [
            { model: TraducaoConteudo, as: 'traducao_titulo' },
            {
              model: NivelArea,
              as: 'nivel_area',
              include: [
                { model: TraducaoConteudo, as: 'traducao_nivel_area' },
                {
                  model: Area,
                  as: 'area',
                  include: [
                    { model: TraducaoConteudo, as: 'traducao_area' },
                    {
                      model: ServiceLine,
                      as: 'service_line',
                      include: [
                        { model: TraducaoConteudo, as: 'traducao_service_line' },
                        {
                          model: LearningPath,
                          as: 'learning_path',
                          include: [{ model: TraducaoConteudo, as: 'traducao_learning_path' }]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      order: [['data_candidatura', 'DESC']]
    });

    const dadosFormatados = candidaturas.map(c => {
      const b = c.badge;
      const na = b?.nivel_area;
      const a = na?.area;
      const sl = a?.service_line;
      const lp = sl?.learning_path;
      const estNum = c.id_estado_candidatura;
      const estNome = MAPA_ESTADOS[lang]?.[estNum] || MAPA_ESTADOS.pt[estNum] || `Estado ${estNum}`;

      return {
        dataInicio: formatarDataBR(c.data_candidatura),
        estado: estNome,
        dataConclusao: [4, 5].includes(estNum) ? formatarDataBR(c.data_encerramento_candidatura) : null,
        consultorNome: c.consultor ? `${c.consultor.nome} ${c.consultor.apelido}`.trim() : 'N/D',
        consultorEmail: c.consultor?.email || '',
        consultorAvatar: c.consultor?.avatar || '',
        badgeNome: b?.traducao_titulo?.[lang] || b?.traducao_titulo?.pt || 'Badge',
        badgeLogo: b?.logo || '',
        nivel: na?.traducao_nivel_area?.[lang] || na?.traducao_nivel_area?.pt || '-',
        area: a?.traducao_area?.[lang] || a?.traducao_area?.pt || '-',
        serviceLine: sl?.traducao_service_line?.[lang] || sl?.traducao_service_line?.pt || '-',
        learningPath: lp?.traducao_learning_path?.[lang] || lp?.traducao_learning_path?.pt || '-'
      };
    });

    const filtros = { estadoNome };

    if (formato === 'xls' || formato === 'xlsx' || formato === 'excel') {
      const buffer = await gerarXLSCandidaturas(dadosFormatados, filtros);
      return enviarRespostaDocumento(res, buffer, 'xlsx', 'relatorio_candidaturas');
    } else {
      const buffer = await gerarPDFCandidaturas(dadosFormatados, filtros, { logo, avatar });
      return enviarRespostaDocumento(res, buffer, 'pdf', 'relatorio_candidaturas');
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao gerar relatório de candidaturas.', error: error.message });
  }
};

// =========================================================================
// 3. RELATÓRIO: Catálogo Geral de Badges
// =========================================================================
controllersRelatorio.relatorioBadges = async (req, res) => {
  try {
    const { formato, logo, lang } = extrairParams(req);

    const badges = await Badge.findAll({
      where: { badgeAtivo: true },
      include: [
        { model: TraducaoConteudo, as: 'traducao_titulo' },
        { model: TraducaoConteudo, as: 'traducao_descricao' },
        {
          model: NivelArea,
          as: 'nivel_area',
          include: [
            { model: TraducaoConteudo, as: 'traducao_nivel_area' },
            {
              model: Area,
              as: 'area',
              include: [
                { model: TraducaoConteudo, as: 'traducao_area' },
                {
                  model: ServiceLine,
                  as: 'service_line',
                  include: [
                    { model: TraducaoConteudo, as: 'traducao_service_line' },
                    {
                      model: LearningPath,
                      as: 'learning_path',
                      include: [{ model: TraducaoConteudo, as: 'traducao_learning_path' }]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ],
      order: [['createdAt', 'ASC']]
    });

    const dadosFormatados = badges.map(b => {
      const na = b.nivel_area;
      const a = na?.area;
      const sl = a?.service_line;
      const lp = sl?.learning_path;

      let expiracaoTexto = MAPA_EXPIRACAO[lang]?.nao_expira || MAPA_EXPIRACAO.pt.nao_expira;
      if (b.badge_expiravel && b.tempo_expiracao) {
        const diasFunc = MAPA_EXPIRACAO[lang]?.dias || MAPA_EXPIRACAO.pt.dias;
        expiracaoTexto = diasFunc(b.tempo_expiracao);
      }

      return {
        nome: b.traducao_titulo?.[lang] || b.traducao_titulo?.pt || 'Sem título',
        descricao: b.traducao_descricao?.[lang] || b.traducao_descricao?.pt || '',
        logo: b.logo || '',
        pontos: b.pontos || 0,
        expiracao: expiracaoTexto,
        emissor: b.emissor || 'Softinsa',
        nivel: na?.traducao_nivel_area?.[lang] || na?.traducao_nivel_area?.pt || '-',
        area: a?.traducao_area?.[lang] || a?.traducao_area?.pt || '-',
        serviceLine: sl?.traducao_service_line?.[lang] || sl?.traducao_service_line?.pt || '-',
        learningPath: lp?.traducao_learning_path?.[lang] || lp?.traducao_learning_path?.pt || '-'
      };
    });

    if (formato === 'xls' || formato === 'xlsx' || formato === 'excel') {
      const buffer = await gerarXLSBadges(dadosFormatados);
      return enviarRespostaDocumento(res, buffer, 'xlsx', 'relatorio_catalogo_badges');
    } else {
      const buffer = await gerarPDFBadges(dadosFormatados, { logo });
      return enviarRespostaDocumento(res, buffer, 'pdf', 'relatorio_catalogo_badges');
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao gerar catálogo de badges.', error: error.message });
  }
};

// =========================================================================
// 4. RELATÓRIO: Relatório Geral sobre os Consultores
// =========================================================================
controllersRelatorio.relatorioConsultores = async (req, res) => {
  try {
    const { formato, avatar, lang } = extrairParams(req);

    // Buscar utilizadores que possuem o perfil de Consultor (4)
    const consultores = await Utilizador.findAll({
      where: { conta_ativa: true },
      include: [
        {
          model: Perfil,
          as: 'perfis',
          where: { id_perfil: 4 },
          through: { where: { relacionamentoAtivo: true } }
        },
        {
          model: Candidatura,
          as: 'candidaturas',
          where: { id_estado_candidatura: 4, candidaturaAtiva: true },
          required: false,
          include: [
            {
              model: Badge,
              as: 'badge',
              include: [{ model: TraducaoConteudo, as: 'traducao_titulo' }]
            }
          ]
        },
        {
          model: ConquistaAtribuida,
          as: 'conquistas_especiais_atribuidas',
          where: { atribuicaoAtiva: true },
          required: false,
          include: [
            {
              model: ConquistaEspecial,
              as: 'conquista_especial',
              include: [{ model: TraducaoConteudo, as: 'traducao_titulo' }]
            }
          ]
        }
      ],
      order: [['nome', 'ASC'], ['apelido', 'ASC']]
    });

    // Mapear áreas para resolver id_area -> Nome da Área
    const todasAreas = await Area.findAll({
      include: [{ model: TraducaoConteudo, as: 'traducao_area' }]
    });
    const mapaAreas = new Map();
    todasAreas.forEach(a => {
      mapaAreas.set(a.id_area, a.traducao_area?.[lang] || a.traducao_area?.pt || `Área ${a.id_area}`);
    });

    const dadosFormatados = consultores.map(c => {
      // 1. Badges Normais Conquistados
      const badgesNormais = (c.candidaturas || []).map(cand => {
        return cand.badge?.traducao_titulo?.[lang] || cand.badge?.traducao_titulo?.pt || 'Badge';
      });

      const pontosNormais = (c.candidaturas || []).reduce((sum, cand) => sum + (cand.badge?.pontos || 0), 0);

      // 2. Badges Especiais Conquistados
      const badgesEspeciais = (c.conquistas_especiais_atribuidas || []).map(ca => {
        const ce = ca.conquista_especial;
        return ce?.traducao_titulo?.[lang] || ce?.traducao_titulo?.pt || 'Badge Especial';
      });

      const pontosEspeciais = (c.conquistas_especiais_atribuidas || []).reduce((sum, ca) => sum + (ca.pontos_conquistados || 0), 0);

      const totalPontos = pontosNormais + pontosEspeciais;
      const areaPref = c.id_area ? (mapaAreas.get(c.id_area) || `Área ${c.id_area}`) : 'Não definida';
      const idiomaExtenso = MAPA_IDIOMAS[c.idioma_preferencial] || c.idioma_preferencial || 'Português';

      return {
        id_utilizador: c.id_utilizador,
        nomeCompleto: `${c.nome} ${c.apelido}`.trim(),
        email: c.email,
        consultorAvatar: c.avatar || '',
        idiomaExtenso,
        dataRegisto: formatarDataBR(c.data_registo),
        areaPreferencia: areaPref,
        totalPontos,
        badgesNormais,
        badgesEspeciais
      };
    });

    if (formato === 'xls' || formato === 'xlsx' || formato === 'excel') {
      const buffer = await gerarXLSConsultores(dadosFormatados);
      return enviarRespostaDocumento(res, buffer, 'xlsx', 'relatorio_consultores');
    } else {
      const buffer = await gerarPDFConsultores(dadosFormatados, { avatar });
      return enviarRespostaDocumento(res, buffer, 'pdf', 'relatorio_consultores');
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao gerar relatório de consultores.', error: error.message });
  }
};

module.exports = controllersRelatorio;
