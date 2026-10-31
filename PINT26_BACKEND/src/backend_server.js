// Backend Server - SoftBadge
const express = require('express');
const app = express();
const http = require('http');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
app.use(express.static('public'));
require('dotenv').config();
const sequelize = require('./config/database');
const langMiddleware = require('./middlewares/lang.middleware');

//Load dos modelos para criar as tabelas
require('./models/loadModels');
const Utilizador = require('./models/utilizador.model');
const TraducaoConteudo = require('./models/traducao_conteudo.model');
const Perfil = require('./models/perfil.model');
// Seeds já não são importados aqui diretamente, são geridos no startup_verification

// Configuração Dinâmica e Segura de CORS
const rawCorsOrigin = process.env.CORS_ORIGIN;
const allowedOrigins = rawCorsOrigin
    ? rawCorsOrigin.split(',').map(o => o.trim()).filter(Boolean)
    : ['https://webapp.softbadge.pt', 'http://localhost:3001', 'https://pint26-frontend.onrender.com'];

const corsOptions = {
    origin: (origin, callback) => {
        // Permite requisições sem header 'origin' (ex: ferramentas de teste como Postman, cURL ou requisições do próprio servidor)
        if (!origin) return callback(null, true);

        // Se estiver configurado '*' na variável de ambiente, permite todas as origens
        if (allowedOrigins.includes('*')) return callback(null, true);

        // Verifica se a origem da requisição está explicitamente na lista de permitidas
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        // Permite subdomínios do domínio principal (softbadge.pt) e ambientes de alojamento como Render (.onrender.com)
        if (/^https:\/\/(.*\.)?softbadge\.pt$/.test(origin) || /^https:\/\/.*\.onrender\.com$/.test(origin) || /^https:\/\/.*\.render\.com$/.test(origin)) {
            return callback(null, true);
        }

        // Permite origens de Apps Móveis Híbridas (Capacitor, Ionic, Cordova, WebViews iOS/Android)
        if (/^(capacitor|ionic|file|app):\/\//.test(origin) || origin === 'null') {
            return callback(null, true);
        }

        return callback(new Error(`Bloqueado por CORS: Origem (${origin}) não autorizada.`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'x-lang', 'x-active-role', 'X-Client-Platform', 'x-client-platform', 'x-platform'],
    exposedHeaders: ['Content-Disposition', 'Content-Type', 'Content-Length', 'X-Client-Platform']
};

app.use(cors(corsOptions));

//Load das associações entre os modelos
const applyAssociations = require('./models/index');
applyAssociations()


// Serviço de Inicialização
const { verifyAndInitialize } = require('./services/startup_verification');
const { initWebSocket } = require('./services/websocket.service');

//Load das rotas automatizadas
const loadRoutes = require('./routes/loadRoutes');
console.log("🚀 MENSAGEM DE TESTE: ESTOU A LER O FICHEIRO CERTO! 🚀");

//Configurações do servidor Backend Express
app.set('port', process.env.PORT || 3000); //Configura a porta 3000, caso altere, é preciso alterar também no DNS
app.set('trust proxy', true); //Permite o Express confiar no proxi flare
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    etag: true,
    lastModified: true,
    setHeaders: (res, path) => {
        res.setHeader('Cache-Control', 'no-cache');
    }
}));

/*const cookieParser = require('cookie-parser'); //Vai permitir trabalhar com httpOnly
app.use(cookieParser());*/

//Middleware para force HTTPS via servico flared de protecao anti-DDoS
app.use((req, res, next) => {
    //console.log(JSON.stringify(req.headers)); //Debug para verificar Header
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] === "https") {
        req.secure = true;
    }
    //console.log('req.secure: ', req.secure);
    next();
});
//Middleware para processar json
app.use(express.json());

app.use(langMiddleware); // Middleware para processar o idioma a partir da query string, ex: ?lang=en

app.use('/api/badges', require('./routes/badge.route'));
app.use('/utilizador-marco', require('./routes/utilizador_marco.route'));
app.use('/conquista-especial', require('./routes/conquista_especial.route'));
app.use('/candidatura_especial', require('./routes/candidatura_especial.route'));
app.use('/configuracao-badge-especial', require('./routes/configuracao_badge_especial.route'));
app.use('/objetivo-consultor', require('./routes/objetivo_consultor.route'));

//Rotas ficheiro e URL com nome igual ao ficheiro de rota
loadRoutes(app);

app.use('/', (req, res) => {
    if (req.secure) {
        res.send('<h1 style = "text-align: center;">SoftBadge Backend HTTPS</h1><img src="/img/https.svg" alt="HTTP Image" style="display: block; margin-left: auto; margin-right: auto;"><h2 style = "text-align: center;">Por favor, utilize o frontend <a href="https://webapp.softbadge.pt" target="_blank">WebAPP da SOFTBADGE.PT</a> para aceder aos dados</h2>');
    } else {
        res.send('<h1 style = "text-align: center;">SoftBadge Backend</h1><img src="/img/https.svg" alt="HTTP Image" style="display: block; margin-left: auto; margin-right: auto;"><h2 style = "text-align: center;">Por favor, utilize o frontend <a href="https://webapp.softbadge.pt" target="_blank">WebAPP da SOFTBADGE.PT</a> para aceder aos dados</h2>');
    }
});

//Inicializar o servidor Backend, fazer a sincronização da base de dados e mostrar a porta na consola
async function startServer() {


    try {

        await sequelize.sync({ alter: true });


        console.log('Base de dados sincronizada com sucesso!');

        // Lógica de preparação de ambiente (Limpeza, Copia Default e Seeds Obrigatórios)
        await verifyAndInitialize();

        const server = http.createServer(app);
        initWebSocket(server);

        server.listen(app.get('port'), () => {
            console.log("\n\tServidor BACKEND roda na porta: " + app.get('port'));

            // Iniciar daemon de verificação de expiração de badges após o servidor estar pronto
            const { iniciarDaemonExpiracao } = require('./services/expiracao.service');
            iniciarDaemonExpiracao().catch(err => {
              console.error('[Expiração] Erro ao iniciar daemon:', err.message);
            });

            // Iniciar daemon de verificação de prazos de candidatura (lembretes e cancelamentos)
            const { iniciarDaemonLembretes } = require('./services/lembrete.service');
            iniciarDaemonLembretes().catch(err => {
              console.error('[Lembretes] Erro ao iniciar daemon:', err.message);
            });
        });

    } catch (error) {

        console.error('\n\tErro ao iniciar o servidor: ', error.message);

    }

}

startServer();