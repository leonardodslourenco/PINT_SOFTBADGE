// =========================================================================
// IMPORTAÇÃO DE BIBLIOTECAS E MÓDULOS NATIVOS DO NODE.JS
// =========================================================================
const multer = require('multer'); // Biblioteca especialista em processar dados do tipo "multipart/form-data" (uploads)
const path = require('path');   // Módulo nativo para manipulação, limpeza e resolução de caminhos de ficheiros
const fs = require('fs');       // Módulo File System nativo para ler, criar e interagir com o disco rígido

// Define o caminho físico absoluto onde as imagens de perfil ficarão guardadas
const dir = path.join(__dirname, '../uploads/avatars');

// VERIFICAÇÃO AUTOMÁTICA DE DIRETÓRIA:
// Avalia se a pasta existe. Se não existir (ex: primeira vez a correr o projeto), 
// o método 'mkdirSync' cria a estrutura de pastas em disco de forma automática.
// A flag '{ recursive: true }' garante que o Node cria subpastas aninhadas se for necessário.
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

// =========================================================================
// CONFIGURAÇÃO DO MOTOR DE ARMAZENAMENTO (DISK STORAGE)
// =========================================================================
const storage = multer.diskStorage({
  // Define a diretoria de destino do ficheiro (usa a pasta 'dir' validada acima)
  destination: (req, file, cb) => cb(null, dir),
  
  // ALGORITMO DE NOMENCLATURA SEGURA:
  // Define o nome sob o qual o ficheiro será temporariamente escrito no disco
  filename: (req, file, cb) => {
    // Captura a data/hora atual no formato ISO e limpa os caracteres especiais via Expressão Regular (Regex).
    // Transforma algo como "2026-06-25T20:00:00.000Z" em "20260625200000000"
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
    
    // Extrai a extensão original da imagem (ex: '.png' ou '.webp')
    const ext = path.extname(file.originalname);
    
    // Constrói um nome temporário único em formato de string.
    // O uso de um multiplicador aleatório 'Math.random() * 1e9' (1 milhão) garante a unicidade,
    // eliminando a chance de colisões de ficheiros se dois utilizadores fizerem upload no mesmo milissegundo.
    const nomeTemporario = `avatar_tmp_${timestamp}_${Math.round(Math.random() * 1e9)}${ext}`;
    
    // Executa a função callback (cb) enviando o nome final gerado para o Multer processar
    cb(null, nomeTemporario);
  }
});

// =========================================================================
// INSTANCIAÇÃO DO MIDDLEWARE COM FILTROS DE CIBERSEGURANÇA
// =========================================================================
const uploadAvatar = multer({
  storage, // Vincula o motor de armazenamento em disco configurado acima
  
  // RESTRIÇÃO DE RECURSOS (DOS MITIGATION):
  // Limita o tamanho do ficheiro recebido na rede. 5 * 1024 * 1024 bytes equivale a exatamente 5 Megabytes.
  // Ficheiros maiores do que isto são rejeitados de imediato para evitar estouros de memória.
  limits: { fileSize: 5 * 1024 * 1024 }, 

  // VALIDAÇÃO DE TIPOS MIME / WHITE LIST:
  // Função que atua como um firewall de ficheiros, inspecionando a extensão real.
  fileFilter: (req, file, cb) => {
    // Define a lista branca de extensões estritas e seguras permitidas na plataforma (PNG / JPEG)
    const tiposPermitidos = ['.jpg', '.jpeg', '.png'];
    
    // Extrai a extensão do ficheiro convertido para letras minúsculas (toLowerCase)
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Se a extensão constar na lista de permitidos, aceita o ficheiro com 'true'
    if (tiposPermitidos.includes(ext)) {
      cb(null, true);
    } else {
      // Se o utilizador tentar enviar formato não suportado (ex: .webp, .svg, .exe), rejeita
      cb(new Error('Formato de imagem inválido. Apenas são aceites ficheiros .png, .jpg ou .jpeg.'));
    }
  }
});

// Exporta o middleware configurado para ser injetado nas rotas de utilizadores (ex: no POST ou PUT)
module.exports = uploadAvatar;