// =========================================================================
// MIDDLEWARE DE UPLOAD PARA LOGOS DE BADGES ESPECIAIS
// =========================================================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Caminho para uploads/logo_especial
const dir = path.join(__dirname, '../uploads/logo_especial');

if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, dir),
  filename: (req, file, cb) => {
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
    const ext = path.extname(file.originalname);
    const nomeFicheiro = `special_logo_${timestamp}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, nomeFicheiro);
  }
});

const uploadLogoEspecial = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limite de 5 MB
  fileFilter: (req, file, cb) => {
    const extensoesPermitidas = /jpeg|jpg|png/;
    const mimeTypesPermitidos = /image\/(jpeg|jpg|png)/;

    const extname = extensoesPermitidas.test(path.extname(file.originalname).toLowerCase());
    const mimetype = mimeTypesPermitidos.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Apenas imagens nos formatos PNG, JPG ou JPEG são permitidas.'));
  }
});

module.exports = uploadLogoEspecial;
