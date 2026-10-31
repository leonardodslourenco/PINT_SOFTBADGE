const express = require('express');
const routerAuth = express.Router();
const controllerAuth = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

routerAuth.post('/login', controllerAuth.login); //Para fazer login normal
routerAuth.post('/verify-email-code', controllerAuth.verifyEmailCode); //Para validar o código de verificação de email que foi enviado
routerAuth.post('/resend-email-verification-code', controllerAuth.resendEmailVerificationCode); //Para reenviar o código de verificação de email
routerAuth.post('/change-default-password', controllerAuth.changeDefaultPassword); //Para alterar a password padrão enviada para o email
routerAuth.post('/request-password-recovery', controllerAuth.requestPasswordRecovery); //Para solicitar a recuperação de password
routerAuth.post('/cancel-recovery', controllerAuth.cancelRecovery); //Para cancelar a recuperação de password
routerAuth.post('/resend-recovery-password', controllerAuth.resendRecoveryPassword); //Para reenviar a password de recuperação
routerAuth.post('/resend-new-user-credentials', controllerAuth.resendNewUserCredentials); //Para reenviar email de boas-vindas completo a novo utilizador
routerAuth.post('/logout', authMiddleware, controllerAuth.logout); //Para fazer logout
routerAuth.post('/refresh-token', authMiddleware, controllerAuth.refreshToken); //Para renovar o token de autenticação

module.exports = routerAuth;