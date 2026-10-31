const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do DiskStorage dinâmico por utilizador
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Extrai o ID do utilizador autenticado
    const userId = req.auth?.sub || req.auth?.id_utilizador || 'geral';
    const userDir = path.join(__dirname, '../uploads/certificados', userId);

    // Cria a pasta do utilizador recursivamente se não existir
    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
    const ext = path.extname(file.originalname).toLowerCase();
    const randomHash = Math.round(Math.random() * 1e9);
    const nomeFicheiro = `cert_${timestamp}_${randomHash}${ext}`;
    cb(null, nomeFicheiro);
  }
});

const uploadCertificadoEspecial = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite máximo de 5MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const tiposPermitidos = ['.pdf'];

    if (tiposPermitidos.includes(ext) && file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Apenas ficheiros em formato PDF (.pdf) são permitidos como comprovativo.'));
    }
  }
});

module.exports = uploadCertificadoEspecial;
