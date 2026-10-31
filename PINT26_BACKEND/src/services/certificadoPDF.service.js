const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Candidatura = require('../models/candidatura_badge.model');
const Badge = require('../models/badge.model');
const Utilizador = require('../models/utilizador.model');
const Certificado = require('../models/certificado.model');
const { gerarUUIDv7 } = require('./geradores');

/**
 * Gera um código de validação único de 12 caracteres alfanuméricos em maiúsculas.
 */
function gerarCodigoValidacao() {
  return crypto.randomBytes(6).toString('hex').toUpperCase();
}

/**
 * Gera o ficheiro PDF do certificado e regista-o na base de dados.
 * Se já existir um certificado para a candidatura, substitui o PDF físico mas mantém o registo.
 * @param {string} id_candidatura UUID da candidatura aprovada (estado 4)
 */
async function gerarCertificado(id_candidatura) {
  // 1. Procurar candidatura com relacionamentos profundos para obter metadados
  const candidatura = await Candidatura.findOne({
    where: { id_candidatura },
    include: [
      {
        association: 'consultor',
        attributes: ['id_utilizador', 'nome', 'apelido']
      },
      {
        association: 'badge',
        include: [
          { association: 'traducao_titulo', attributes: ['pt', 'en', 'es'] },
          {
            association: 'nivel_area',
            include: [
              { association: 'traducao_nivel_area', attributes: ['pt', 'en', 'es'] },
              {
                association: 'area',
                include: [
                  { association: 'traducao_area', attributes: ['pt', 'en', 'es'] },
                  {
                    association: 'service_line',
                    include: [
                      { association: 'traducao_service_line', attributes: ['pt', 'en', 'es'] },
                      {
                        association: 'learning_path',
                        include: [{ association: 'traducao_learning_path', attributes: ['pt', 'en', 'es'] }]
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

  if (!candidatura) {
    throw new Error('Candidatura não encontrada.');
  }

  const consultor = candidatura.consultor;
  const badge = candidatura.badge;

  if (!consultor || !badge) {
    throw new Error('Consultor ou Badge não associados à candidatura.');
  }

  // Obter idioma padrão do consultor ou PT como fallback
  const lang = 'pt'; 

  // Traduzir campos necessários
  const badgeNome = badge.traducao_titulo?.[lang] || badge.traducao_titulo?.pt || 'N/A';
  const nivelNome = badge.nivel_area?.traducao_nivel_area?.[lang] || badge.nivel_area?.traducao_nivel_area?.pt || 'N/A';
  const areaNome = badge.nivel_area?.area?.traducao_area?.[lang] || badge.nivel_area?.area?.traducao_area?.pt || 'N/A';
  const slNome = badge.nivel_area?.area?.service_line?.traducao_service_line?.[lang] || badge.nivel_area?.area?.service_line?.traducao_service_line?.pt || 'N/A';
  const lpNome = badge.nivel_area?.area?.service_line?.learning_path?.traducao_learning_path?.[lang] || badge.nivel_area?.area?.service_line?.learning_path?.traducao_learning_path?.pt || 'N/A';
  
  // 2. Verificar ou criar registo de Certificado na Base de Dados
  let certificado = await Certificado.findOne({ where: { id_candidatura } });
  let codigoValidacao = certificado ? certificado.codigo_validacao : gerarCodigoValidacao();
  
  // Nome seguro para o ficheiro PDF
  const id_certificado = certificado ? certificado.id_certificado : gerarUUIDv7();
  const relativeFolder = path.join('docs', 'certificados', consultor.id_utilizador);
  const physicalFolder = path.join(__dirname, '..', 'uploads', relativeFolder);
  
  if (!fs.existsSync(physicalFolder)) {
    fs.mkdirSync(physicalFolder, { recursive: true });
  }

  const relativePath = path.join(relativeFolder, `${id_certificado}.pdf`).replace(/\\/g, '/');
  const physicalPath = path.join(physicalFolder, `${id_certificado}.pdf`);

  if (!certificado) {
    certificado = await Certificado.create({
      id_certificado,
      id_candidatura,
      id_consultor: consultor.id_utilizador,
      id_badge: badge.id_badge,
      codigo_validacao: codigoValidacao,
      ficheiro_path: relativePath
    });
  }

  // 3. Gerar PDF com PDFKit
  const doc = new PDFDocument({
    size: 'A4',
    layout: 'landscape',
    margins: { top: 0, bottom: 0, left: 0, right: 0 }
  });

  const writeStream = fs.createWriteStream(physicalPath);
  doc.pipe(writeStream);

  // Caminho das fontes
  const fontRegular = path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Regular.ttf');
  const fontBold = path.join(__dirname, '..', 'assets', 'fonts', 'Roboto-Bold.ttf');

  // Background e Bordas Estilizadas
  doc.rect(0, 0, 841.89, 595.28).fill('#ffffff');

  // Borda decorativa exterior (Azul Escuro / Slate)
  doc.rect(20, 20, 801.89, 555.28).lineWidth(4).stroke('#0f172a');
  
  // Borda decorativa interior (Linha dourada fina)
  doc.rect(26, 26, 789.89, 543.28).lineWidth(1.5).stroke('#d97706');

  // Cantos Decorativos
  const drawCorner = (x, y, rotation) => {
    doc.save();
    doc.translate(x, y);
    doc.rotate(rotation);
    doc.rect(0, 0, 15, 15).fill('#d97706');
    doc.restore();
  };
  drawCorner(26, 26, 0);
  drawCorner(815.89, 26, 90);
  drawCorner(815.89, 569.28, 180);
  drawCorner(26, 569.28, 270);

  // Logo da Instituição / Título no Topo
  doc.fillColor('#0f172a');
  if (fs.existsSync(fontBold)) doc.font(fontBold);
  doc.fontSize(28).text('SoftBadge.PT', 0, 60, { align: 'center' });
  
  doc.fillColor('#64748b');
  if (fs.existsSync(fontRegular)) doc.font(fontRegular);
  doc.fontSize(10).text('PLATAFORMA INTEGRADA DE RECONHECIMENTO E GAMIFICAÇÃO', 0, 95, { align: 'center', characterSpacing: 1.5 });

  // Título do Certificado
  doc.fillColor('#d97706');
  if (fs.existsSync(fontBold)) doc.font(fontBold);
  doc.fontSize(34).text('CERTIFICADO DE CONQUISTA', 0, 140, { align: 'center' });

  // Linha Separadora Elegante
  doc.moveTo(320, 190).lineTo(520, 190).lineWidth(1.5).stroke('#e2e8f0');

  // Texto do Certificado
  doc.fillColor('#1e293b');
  if (fs.existsSync(fontRegular)) doc.font(fontRegular);
  doc.fontSize(14).text('Certificamos com distinção que', 0, 215, { align: 'center' });

  // Nome do Utilizador (Destaque Principal)
  doc.fillColor('#0f172a');
  if (fs.existsSync(fontBold)) doc.font(fontBold);
  doc.fontSize(26).text(`${consultor.nome} ${consultor.apelido}`, 0, 240, { align: 'center' });

  // Descrição da conquista
  doc.fillColor('#475569');
  if (fs.existsSync(fontRegular)) doc.font(fontRegular);
  doc.fontSize(13).text('concluiu com sucesso todos os requisitos exigidos e conquistou a insígnia digital:', 0, 285, { align: 'center' });

  // Nome do Badge
  doc.fillColor('#0284c7');
  if (fs.existsSync(fontBold)) doc.font(fontBold);
  doc.fontSize(22).text(`"${badgeNome}"`, 0, 310, { align: 'center' });

  // Renderização do Badge (Se for PNG/JPG carregar imagem, senão desenhar brasão dourado vetorial)
  const logoExt = badge.logo ? path.extname(badge.logo).toLowerCase() : '';
  const logoPath = badge.logo ? path.join(__dirname, '..', 'uploads', 'logo_badges', badge.logo) : '';
  const drawX = 370.94; // Centralizado no A4 landscape (841.89 - 100) / 2
  const drawY = 350;

  if (fs.existsSync(logoPath) && (logoExt === '.png' || logoExt === '.jpg' || logoExt === '.jpeg')) {
    try {
      doc.image(logoPath, drawX, drawY, { width: 100, height: 100 });
    } catch (imgError) {
      console.error("Erro ao desenhar imagem no PDF, usando placeholder:", imgError.message);
      desenharBrasaoPlaceholder(doc, drawX, drawY);
    }
  } else {
    // Para SVGs ou ficheiros em falta, desenha um brasão premium vetorial
    desenharBrasaoPlaceholder(doc, drawX, drawY);
  }

  // Metadados do Certificado (Grelha de Informação no fundo)
  doc.fillColor('#475569');
  if (fs.existsSync(fontBold)) doc.font(fontBold);
  doc.fontSize(9);

  // Coluna 1
  doc.text('LEARNING PATH:', 80, 480);
  doc.text('SERVICE LINE:', 80, 500);
  doc.text('ÁREA / NÍVEL:', 80, 520);

  if (fs.existsSync(fontRegular)) doc.font(fontRegular);
  doc.text(lpNome, 190, 480);
  doc.text(slNome, 190, 500);
  doc.text(`${areaNome} / ${nivelNome}`, 190, 520);

  // Coluna 2
  if (fs.existsSync(fontBold)) doc.font(fontBold);
  doc.text('PONTOS ATRIBUÍDOS:', 480, 480);
  doc.text('DATA DE EMISSÃO:', 480, 500);
  doc.text('CÓDIGO VALIDAÇÃO:', 480, 520);

  if (fs.existsSync(fontRegular)) doc.font(fontRegular);
  doc.text(`${badge.pontos} Pts`, 610, 480);
  doc.text(new Date(certificado.data_emissao).toLocaleDateString('pt-PT'), 610, 500);
  
  doc.fillColor('#d97706');
  if (fs.existsSync(fontBold)) doc.font(fontBold);
  doc.text(codigoValidacao, 610, 520);

  // Rodapé com link de verificação
  doc.fillColor('#94a3b8');
  if (fs.existsSync(fontRegular)) doc.font(fontRegular);
  doc.fontSize(8).text('Verifique a autenticidade deste certificado em softbadge.pt/validar', 0, 555, { align: 'center' });

  doc.end();

  // Retorna uma Promise resolvida quando a escrita em disco estiver concluída
  return new Promise((resolve, reject) => {
    writeStream.on('finish', () => resolve(certificado));
    writeStream.on('error', (err) => reject(err));
  });
}

/**
 * Desenha um brasão digital decorativo dourado nativamente em PDFKit para fallbacks de SVG.
 */
function desenharBrasaoPlaceholder(doc, x, y) {
  doc.save();
  doc.translate(x + 50, y + 45); // Centro do brasão (50, 45) relativo ao topo esquerdo
  
  // Fitas decorativas vermelhas/douradas no fundo do brasão
  doc.moveTo(-20, 20).lineTo(-35, 60).lineTo(-15, 50).lineTo(0, 60).lineTo(-10, 20).fill('#b91c1c');
  doc.moveTo(20, 20).lineTo(35, 60).lineTo(15, 50).lineTo(0, 60).lineTo(10, 20).fill('#b91c1c');

  // Círculo dourado principal com sombras
  doc.circle(0, 0, 35).fill('#d97706');
  doc.circle(0, 0, 31).fill('#f59e0b');
  doc.circle(0, 0, 28).fill('#0f172a');

  // Desenhar uma Estrela de 5 Pontos Central no meio do brasão
  doc.save();
  doc.translate(0, 0);
  doc.fillColor('#f59e0b');
  
  // Desenho matemático de estrela no canvas do PDFKit
  doc.moveTo(0, -15)
     .lineTo(4, -4)
     .lineTo(15, -4)
     .lineTo(6, 3)
     .lineTo(10, 14)
     .lineTo(0, 7)
     .lineTo(-10, 14)
     .lineTo(-6, 3)
     .lineTo(-15, -4)
     .lineTo(-4, -4)
     .closePath()
     .fill();
     
  doc.restore();
  doc.restore();
}

module.exports = {
  gerarCertificado
};
