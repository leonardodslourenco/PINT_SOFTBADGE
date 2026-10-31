const fs = require('fs');
const path = require('path');
const Certificado = require('../models/certificado.model');
const Candidatura = require('../models/candidatura_badge.model');
const Utilizador = require('../models/utilizador.model');
const Badge = require('../models/badge.model');
const validaUUID = require('../services/valida_UUID');

const controllersCertificado = {};

// Helper para obter o ID do utilizador autenticado a partir do token
function getUtilizadorAutenticado(req) {
  return req.auth?.sub || req.auth?.id_utilizador || null;
}

// Helper para verificar se o utilizador tem perfil administrativo (Admin, SLL, TM)
function eGestor(activeRole) {
  return [1, 2, 3].includes(activeRole);
}

/**
 * GET /certificado/candidatura/:id_candidatura
 * Devolve o registo e metadados do certificado associado a uma candidatura.
 */
controllersCertificado.detailCertificadoByCandidatura = async (req, res) => {
  try {
    const { id_candidatura } = req.params;

    if (!validaUUID(id_candidatura, 7)) {
      return res.status(400).json({ success: false, message: 'ID de candidatura inválido.' });
    }

    const certificado = await Certificado.findOne({
      where: { id_candidatura },
      include: [
        { association: 'consultor', attributes: ['nome', 'apelido', 'email'] },
        { association: 'badge', attributes: ['id_badge', 'logo'] }
      ]
    });

    if (!certificado) {
      return res.status(404).json({ success: false, message: 'Certificado não encontrado para esta candidatura.' });
    }

    // Regra de Acesso: Apenas gestores ou o próprio consultor dono do certificado podem consultar
    const activeRole = req.activeRole;
    const userId = getUtilizadorAutenticado(req);

    if (!eGestor(activeRole) && certificado.id_consultor !== userId) {
      return res.status(403).json({ success: false, message: 'Acesso negado: Não tem permissão para aceder a este certificado.' });
    }

    return res.status(200).json({
      success: true,
      message: 'Certificado recuperado com sucesso.',
      data: certificado
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao obter metadados do certificado.', error: error.message });
  }
};

/**
 * GET /certificado/:id_certificado/download
 * Faz o download do ficheiro PDF do certificado.
 */
controllersCertificado.downloadCertificado = async (req, res) => {
  try {
    const { id_certificado } = req.params;

    if (!validaUUID(id_certificado, 7)) {
      return res.status(400).json({ success: false, message: 'ID de certificado inválido.' });
    }

    const certificado = await Certificado.findByPk(id_certificado);

    if (!certificado) {
      return res.status(404).json({ success: false, message: 'Certificado não encontrado.' });
    }

    // Regra de Acesso: Apenas gestores ou o próprio consultor
    const activeRole = req.activeRole;
    const userId = getUtilizadorAutenticado(req);

    if (!eGestor(activeRole) && certificado.id_consultor !== userId) {
      return res.status(403).json({ success: false, message: 'Acesso negado: Sem permissões para fazer download deste certificado.' });
    }

    const filePhysicalPath = path.join(__dirname, '..', 'uploads', certificado.ficheiro_path);

    if (!fs.existsSync(filePhysicalPath)) {
      return res.status(404).json({ success: false, message: 'Ficheiro PDF físico do certificado não foi encontrado no servidor.' });
    }

    return res.download(filePhysicalPath, `certificado_${certificado.codigo_validacao}.pdf`);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao descarregar certificado.', error: error.message });
  }
};

/**
 * GET /certificado/:id_certificado/view
 * Visualização inline do PDF (abre diretamente no browser).
 */
controllersCertificado.viewCertificado = async (req, res) => {
  try {
    const { id_certificado } = req.params;

    if (!validaUUID(id_certificado, 7)) {
      return res.status(400).json({ success: false, message: 'ID de certificado inválido.' });
    }

    const certificado = await Certificado.findByPk(id_certificado);

    if (!certificado) {
      return res.status(404).json({ success: false, message: 'Certificado não encontrado.' });
    }

    // Regra de Acesso: Apenas gestores ou o próprio consultor
    const activeRole = req.activeRole;
    const userId = getUtilizadorAutenticado(req);

    if (!eGestor(activeRole) && certificado.id_consultor !== userId) {
      return res.status(403).json({ success: false, message: 'Acesso negado: Sem permissões para visualizar este certificado.' });
    }

    const filePhysicalPath = path.join(__dirname, '..', 'uploads', certificado.ficheiro_path);

    if (!fs.existsSync(filePhysicalPath)) {
      return res.status(404).json({ success: false, message: 'Ficheiro PDF físico não encontrado.' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'inline; filename="certificado.pdf"');
    return fs.createReadStream(filePhysicalPath).pipe(res);
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro ao carregar visualização do certificado.', error: error.message });
  }
};

/**
 * GET /certificado/public/validar
 * Endpoint público (sem token) para verificação externa no microsite.
 * Query params: ?codigo=XXXXXX&nome_completo=Joao Silva (ou ?codigo_validacao=...&nome_completo=...)
 */
controllersCertificado.validarCertificadoPublic = async (req, res) => {
  try {
    const { codigo, codigo_validacao, cod_validacao, nome_completo, nomeCompleto, nome, apelido } = req.query;

    const codigoFinal = (codigo || codigo_validacao || cod_validacao || '').trim().toUpperCase();
    
    // Obter o nome completo fornecido ou concatenar os campos se vierem em separado
    let inputNomeCompleto = (nome_completo || nomeCompleto || '').trim();
    if (!inputNomeCompleto && (nome || apelido)) {
      inputNomeCompleto = `${nome || ''} ${apelido || ''}`.trim();
    }

    if (!codigoFinal || !inputNomeCompleto) {
      return res.status(200).json({ valido: false, message: 'Parâmetros em falta para a validação (código e nome completo obrigatórios).' });
    }

    const certificado = await Certificado.findOne({
      where: { codigo_validacao: codigoFinal },
      include: [
        {
          association: 'consultor',
          attributes: ['nome', 'apelido']
        },
        {
          association: 'badge',
          attributes: ['id_badge', 'pontos'],
          include: [
            { association: 'traducao_titulo' },
            {
              association: 'nivel_area',
              include: [
                { association: 'traducao_nivel_area' },
                {
                  association: 'area',
                  include: [
                    { association: 'traducao_area' },
                    {
                      association: 'service_line',
                      include: [
                        { association: 'traducao_service_line' },
                        {
                          association: 'learning_path',
                          include: [
                            { association: 'traducao_learning_path' }
                          ]
                        }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    });

    if (!certificado || !certificado.consultor) {
      return res.status(200).json({ valido: false });
    }

    const consultor = certificado.consultor;

    // Normalização para comparação segura e robusta (remove acentos, pontuação, múltiplos espaços e caixa alta/baixa)
    const normalizar = (str) => (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    const inputNorm = normalizar(inputNomeCompleto);
    const dbNorm = normalizar(`${consultor.nome || ''} ${consultor.apelido || ''}`);

    if (inputNorm === dbNorm) {
      const lang = req.lang || 'pt';
      const badge = certificado.badge;
      const nivelArea = badge?.nivel_area;
      const area = nivelArea?.area;
      const serviceLine = area?.service_line;
      const learningPath = serviceLine?.learning_path;

      const nomeBadge = badge?.traducao_titulo?.[lang] || badge?.traducao_titulo?.pt || '';
      const nomeNivel = nivelArea?.traducao_nivel_area?.[lang] || nivelArea?.traducao_nivel_area?.pt || '';
      const nomeArea = area?.traducao_area?.[lang] || area?.traducao_area?.pt || '';
      const nomeSL = serviceLine?.traducao_service_line?.[lang] || serviceLine?.traducao_service_line?.pt || '';
      const nomeLP = learningPath?.traducao_learning_path?.[lang] || learningPath?.traducao_learning_path?.pt || '';

      return res.status(200).json({
        valido: true,
        data: {
          codigo_validacao: certificado.codigo_validacao,
          consultor: `${consultor.nome || ''} ${consultor.apelido || ''}`.trim(),
          badge: nomeBadge,
          pontos: badge?.pontos || 0,
          nivel: nomeNivel,
          area: nomeArea,
          service_line: nomeSL,
          learning_path: nomeLP,
          data_emissao: certificado.data_emissao
        }
      });
    }

    return res.status(200).json({ valido: false });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Erro na validação do certificado.', error: error.message });
  }
};

module.exports = controllersCertificado;
