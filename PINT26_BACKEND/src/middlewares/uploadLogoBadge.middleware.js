// =========================================================================
// IMPORTAÇÃO DE BIBLIOTECAS E MÓDULOS NATIVOS DO NODE.JS
// =========================================================================
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define o caminho físico absoluto onde as imagens dos badges ficarão guardadas
const dir = path.join(__dirname, '../uploads/logo_badges');

// VERIFICAÇÃO AUTOMÁTICA DE DIRETÓRIA:
// Avalia se a pasta existe. Se não existir, o método 'mkdirSync' cria-a de forma automática.
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// =========================================================================
// CONFIGURAÇÃO DO MOTOR DE ARMAZENAMENTO (DISK STORAGE)
// =========================================================================
const storage = multer.diskStorage({
  // Define a diretoria de destino do ficheiro
  destination: (req, file, cb) => cb(null, dir),
  
  // ALGORITMO DE NOMENCLATURA SEGURA:
  filename: (req, file, cb) => {
    // Timestamp ISO limpo e multiplicador aleatório para garantir nome único
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
    const ext = path.extname(file.originalname);
    
    const nomeTemporario = `logo_tmp_${timestamp}_${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, nomeTemporario);
  }
});

// =========================================================================
// INSTANCIAÇÃO DO MIDDLEWARE COM FILTROS DE CIBERSEGURANÇA
// =========================================================================
const uploadLogoBadge = multer({
  storage,
  
  // RESTRIÇÃO DE RECURSOS (DOS MITIGATION):
  // Limita o tamanho do ficheiro a 5 MB
  limits: { fileSize: 5 * 1024 * 1024 }, 

  // VALIDAÇÃO DE TIPOS MIME / WHITE LIST:
  fileFilter: (req, file, cb) => {
    // Extensões estritas suportadas para badges (PNG / JPEG)
    const tiposPermitidos = ['.jpg', '.jpeg', '.png'];
    
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (tiposPermitidos.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Formato de imagem de badge inválido. Apenas são aceites ficheiros .png, .jpg ou .jpeg.'));
    }
  }
});

// Exporta o middleware configurado para ser injetado nas rotas de badges
module.exports = uploadLogoBadge;
