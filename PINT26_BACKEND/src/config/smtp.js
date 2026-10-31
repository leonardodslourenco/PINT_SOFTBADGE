const nodemailer = require('nodemailer'); //Vai ser utilizado para enviar o código de confirmação de email e outras notificações.
const { SMTP } = require('./parameters');

// Configurações de transporte SMTP
const transporter = nodemailer.createTransport({
  host: SMTP.HOST,
  port: SMTP.PORT,
  secure: SMTP.SECURE, // true para 465, false para outras portas
  auth: {
    user: SMTP.USER,
    pass: SMTP.PASS
  },
  tls: {
    rejectUnauthorized: SMTP.TLS_REJECT_UNAUTHORIZED // false Permitir certificados auto-assinados | true apenas com CA
  }
});

// Função genérica para enviar email
const enviarEmail = (to, subject, text, html = null) => {
  const mailOptions = {
    from: SMTP.FROM, //Pega o remetente da variável de ambiente ou define manualmente | noreply@softskills.pt
    to, // Destinatário
    subject, // Assunto do email
    text, // Texto do corpo
    ...(html && { html }) // só adiciona html se ele for diferente de null
  };

  return transporter.sendMail(mailOptions)
    .then(info => {
      console.log('Email enviado:', info.response);
      return info;
    })
    .catch(err => {
      console.error('Erro ao enviar email:', err);
      throw err;
    });
};

module.exports = enviarEmail;