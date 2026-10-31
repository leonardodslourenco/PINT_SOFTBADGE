// =========================================================================
// IMPORTAÇÃO DE BIBLIOTECAS E MÓDULOS NATIVOS DO NODE.JS
// =========================================================================
const multer = require('multer'); // Biblioteca especialista em processar dados do tipo "multipart/form-data" (uploads)
const path = require('path');   // Módulo nativo para manipulação e resolução segura de caminhos de ficheiros
const fs = require('fs');       // Módulo File System nativo para ler, criar e interagir com o disco rígido

// Define a diretoria raiz absoluta onde todas as evidências serão armazenadas
const baseDir = path.join(__dirname, '../uploads/evidences');

// Garante a existência da infraestrutura de pastas base no arranque do servidor
if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

/**
 * CIBERSEGURANÇA: sanitizeFolderName
 * Remove qualquer caractere especial que não seja letra, número, hífen ou underscore.
 * Blinda a aplicação contra ataques de Path Traversal (onde um atacante tenta usar '../' para salvar ficheiros fora do local permitido).
 */
function sanitizeFolderName(value) {
  return String(value || '').replace(/[^a-zA-Z0-9-_]/g, '');
}

// =========================================================================
// CONFIGURAÇÃO DO MOTOR DE ARMAZENAMENTO DISK STORAGE (MULTER)
// =========================================================================
const storage = multer.diskStorage({
  // 1. DEFINIÇÃO DINÂMICA DO DESTINO
  destination: (req, file, cb) => {
    // Captura e sanitiza o ID da candidatura vindo do corpo do formulário HTTP
    const idCandidatura = sanitizeFolderName(req.body.id_candidatura);
    
    // Validação Precoce: Se o ID não foi enviado ou ficou vazio após a limpeza, quebra o upload
    if (!idCandidatura) {
      return cb(new Error('id_candidatura é obrigatório para upload de evidências.'));
    }

    // Estratégia de Isolamento: Define a pasta final específica desta candidatura (baseDir/idCandidatura)
    const targetDir = path.join(baseDir, idCandidatura);
    
    // Se a pasta específica desta candidatura ainda não existir em disco, cria-a dinamicamente
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    
    cb(null, targetDir); // Passa o caminho final para o Multer prosseguir com a escrita
  },
  
  // 2. ALGORITMO DE NOMENCLATURA SEGURA COESIVA
  filename: (req, file, cb) => {
    // Transforma o timestamp ISO atual numa string numérica limpa (ex: "20260625200000")
    const timestamp = new Date().toISOString().replace(/[-T:.Z]/g, '');
    // Gera um número randómico massivo (até 1 milhão) para eliminar o risco de nomes colidirem
    const random = Math.round(Math.random() * 1e9);
    // Captura a extensão original sempre em letras minúsculas
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Define o nome sob o qual o ficheiro tocará o disco (ex: "evid_20260625_573921.pdf")
    cb(null, `evid_${timestamp}_${random}${ext}`);
  }
});

// =========================================================================
// VALIDAÇÕES ESPECÍFICAS DA LISTA BRANCA (WHITE LIST)
// =========================================================================
const allowedExtensions = ['.pdf', '.zip', '.rar', '.7z']; // Extensões estritas permitidas
const MAX_PDF_BYTES = 5 * 1024 * 1024;                    // Limite estrito para PDFs = 5 Megabytes
const MAX_COMPRESSED_BYTES = 15 * 1024 * 1024;            // Limite estrito para Compactados = 15 Megabytes

/**
 * POLIMORFISMO DE RECURSOS: getMaxSizeByExtension
 * Retorna o teto máximo de bytes permitido dependendo da extensão do ficheiro analisado.
 */
function getMaxSizeByExtension(ext) {
  if (ext === '.pdf') return MAX_PDF_BYTES;
  return MAX_COMPRESSED_BYTES;
}

// Instanciação privada do Multer aplicando filtros básicos de extensão e contagem de ficheiros
const uploadEvidencia = multer({
  storage,
  limits: {
    files: 1 // Proteção (DoS): Garante que nesta propriedade da requisição só viaja 1 único ficheiro
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    
    // Firewall de Extensões: Se o ficheiro não estiver na lista branca, bloqueia imediatamente
    if (!allowedExtensions.includes(ext)) {
      return cb(new Error('Formato de identidade inválido. Permitido: PDF, ZIP, RAR, 7Z.'));
    }
    cb(null, true); // Autoriza a progressão do processamento
  }
});

// =========================================================================
// MIDDLEWARE PROTETIVO FINAL DE INTERCEÇÃO (EMPACOTADOR / WRAPPER)
// =========================================================================
/**
 * Injeta o controlo de tamanho polimórfico após o Multer fazer o parsing inicial da requisição.
 */
function uploadEvidenciaComLimite(req, res, next) {
  // Invoca a execução do Multer escutando especificamente pelo campo com nome 'evidencia'
  uploadEvidencia.single('evidencia')(req, res, (error) => {
    // Se o Multer disparar um erro interno (ex: formato inválido do fileFilter), repassa-o ao Express
    if (error) return next(error);

    // Se a requisição correu bem mas não trazia nenhum ficheiro, avança pacificamente para o controlador
    if (!req.file) return next();

    // POLÍTICA DINÂMICA DE TAMANHO:
    const ext = path.extname(req.file.originalname).toLowerCase();
    const maxBytes = getMaxSizeByExtension(ext); // Captura o teto correspondente (5MB ou 15MB)

    // Validação Pós-Upload: Se o tamanho real escrito em disco exceder o teto dinâmico determinado
    if (req.file.size > maxBytes) {
      // Deleta o ficheiro que acabou de ser escrito temporariamente em disco para não desperdiçar armazenamento
      if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      
      // Lança um erro descritivo de interrupção para o Express responder de forma amigável ao utilizador
      return next(new Error(`Ficheiro ${req.file.originalname} excede o limite permitido para ${ext} (${maxBytes / (1024 * 1024)}MB).`));
    }

    // Se passou em todas as auditorias físicas, criptográficas e de dimensão, concede passagem para o controlador
    return next();
  });
}

// Exporta o middleware completo para ser acoplado diretamente nas rotas de Evidências do Express
module.exports = uploadEvidenciaComLimite;