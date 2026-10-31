// =========================================================================
// IMPORTAÇÃO DE DEPENDÊNCIAS DE SEGURANÇA E PARÂMETROS CRIPTOGRÁFICOS
// =========================================================================
const jwt = require('jsonwebtoken');                     // Biblioteca utilizada para verificar a assinatura e decodificar tokens
const { isTokenRevoked } = require('../services/tokenBlacklist'); // Serviço que interroga a Blacklist para validar se o token foi revogado no Logout
const { AUTH } = require('../config/parameters');         // Central de configurações para extração da chave secreta global

// Inicializa a assinatura criptográfica chave para validação (A mesma usada para assinar no Login)
const JWT_SECRET = AUTH.JWT_SECRET;

/**
 * MIDDLEWARE: authMiddleware
 * Interpõe-se entre a rota do Express e o Controlador para validar a sessão Bearer JWT.
 */
module.exports = async function authMiddleware(req, res, next) {
  try {
    // 1. EXTRAÇÃO DO CABEÇALHO (HEADER):
    // Procura pela propriedade 'authorization' nos cabeçalhos da requisição.
    // Se o frontend esquecer de enviá-la, assume uma string vazia '' por segurança, evitando quebras.
    const authHeader = req.headers.authorization || '';
    
    // 2. PARSING DO PADRÃO BEARER:
    // O cabeçalho padrão viaja no formato: "Bearer eyJhbGciOiJIUzI1Ni...".
    // O método .split(' ') divide o texto pelo espaço, criando um array de duas posições: [scheme, token].
    const [scheme, token] = authHeader.split(' ');

    // CIBERSEGURANÇA RÍGIDA: 
    // Valida se o formato obedece estritamente ao esquema 'Bearer' e se a string do token existe fisicamente.
    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ success: false, message: 'Token ausente ou inválido.' }); // Status 401 Unauthorized
    }

    // 3. DEFESA CONTRA ATAQUES REPLAY (VERIFICAÇÃO DE BLACKLIST):
    // Comunica com o serviço de revogação. Se este token específico já foi descartado (via Logout),
    // bloqueia o acesso imediatamente, impedindo que tokens antigos capturados por atacantes ganhem acesso.
    if (await isTokenRevoked(token)) {
      return res.status(401).json({ success: false, message: 'Token revogado. Faça login novamente.' });
    }

    // 4. VALIDAÇÃO CRIPTOGRÁFICA E INTEGRIDADE:
    // O método jwt.verify() realiza uma dupla validação:
    // a) Confirma se o token foi gerado pelo nosso servidor usando o JWT_SECRET (Verifica a assinatura).
    // b) Confirma se o token ainda está dentro da janela de validade de tempo (Não expirou).
    // Se falhar nalgum dos pontos, o jsonwebtoken atira uma exceção direto para o bloco catch.
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 5. INJEÇÃO DE CONTEXTO SEGURO (PAYLOAD ENCAPSULADO):
    // Injeta os dados desencriptados do utilizador (ID, e-mail, avatar, perfis) dentro do objeto do pedido 'req'.
    // Desta forma, qualquer controlador à frente consegue saber quem está logado lendo apenas 'req.auth'.
    req.auth = decoded;
    if (decoded?.sub && !req.auth.id_utilizador) {
      req.auth.id_utilizador = decoded.sub;
    }
    req.token = token; // Guarda o token bruto para auditorias posteriores (como passá-lo para a Blacklist no Logout)

    // Extrai o perfil/papel ativo (enviado pelo frontend) ou resolve para o de maior privilégio
    let activeRole = req.headers['x-active-role'];
    const validRoles = [1, 2, 3, 4]; // 1: Admin, 2: SLL, 3: TM, 4: Consultor
    const parsedRole = Number(activeRole);
    if (activeRole && validRoles.includes(parsedRole)) {
      req.activeRole = parsedRole;
    } else {
      const perfis = decoded.perfis || [];
      const rolesOrder = [1, 2, 3, 4]; // 1: Admin, 2: SLL, 3: TM, 4: Consultor
      req.activeRole = rolesOrder.find(r => perfis.includes(r)) || 4;
    }

    // 6. AUTORIZAÇÃO DE PASSAGEM:
    // Invocando a função next(), o Express entende que o utilizador é fidedigno e deixa o pedido avançar 
    // para a execução da rota/controlador de negócio.
    return next();
  } catch (error) {
    // CAPTURA DE FALHAS DE EXPIRAÇÃO OU ADULTERAÇÃO:
    // Se o token foi alterado caractere a caractere por um hacker ou se já expirou o tempo de sessão (ex: após 1h),
    // o catch intercepta a falha e responde defensivamente protegendo as rotas.
    return res.status(401).json({ success: false, message: 'Token inválido ou expirado.' });
  }
};