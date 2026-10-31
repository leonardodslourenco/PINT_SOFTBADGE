/**
 * HELPER DE TEMPLATES DE EMAIL EM HTML E TEXTO PLANO
 * Gera templates elegantes, responsivos e profissionais para as notificações SMTP da SoftBadge.
 */

const LANDING_PAGE_URL = process.env.LANDING_PAGE_URL || 'https://www.softbadge.pt';

/**
 * Constrói o layout HTML base partilhado por todos os e-mails.
 * Garantia de contraste 100% visível em todos os clientes de e-mail (Gmail, Outlook, Dark Mode).
 */
function buildBaseLayout({ titulo, conteudoHeader, corpoHtml, ctaText = 'Aceder à Plataforma SoftBadge', ctaUrl = LANDING_PAGE_URL }) {
  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #1e293b;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 620px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05); border: 1px solid #cbd5e1;">
          
          <!-- HEADER COM COR SÓLIDA DE ALTO CONTRASTE (Compatível com Gmail/Outlook/Dark Mode) -->
          <tr>
            <td bgcolor="#0f172a" style="background-color: #0f172a; padding: 36px 28px; text-align: center;">
              <h1 style="color: #ffffff !important; margin: 0; font-size: 32px; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2;">
                <span style="color: #ffffff !important;">SoftBadge</span><span style="color: #38bdf8 !important;">.PT</span>
              </h1>
              <p style="color: #cbd5e1 !important; margin: 8px 0 0 0; font-size: 16px; font-weight: 500;">
                ${conteudoHeader || 'Plataforma de Gamificação & Competências'}
              </p>
            </td>
          </tr>

          <!-- CORPO PRINCIPAL COM FONTES DE TAMANHO AUMENTADO -->
          <tr>
            <td style="padding: 36px 32px; background-color: #ffffff;">
              ${corpoHtml}

              <!-- BOTÃO DE AÇÃO PROMINENTE -->
              ${ctaUrl ? `
              <div style="text-align: center; margin-top: 36px; margin-bottom: 28px;">
                <a href="${ctaUrl}" target="_blank" style="display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 18px 40px; border-radius: 10px; font-size: 18px; font-weight: 700; box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35); letter-spacing: 0.3px;">
                  ${ctaText}
                </a>
              </div>
              ` : ''}
            </td>
          </tr>

          <!-- RODAPÉ -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 28px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 15px; color: #64748b; line-height: 1.6;">
              <p style="margin: 0; font-size: 15px;">Para aceder à sua conta, visite <a href="${LANDING_PAGE_URL}" target="_blank" style="color: #0284c7; text-decoration: none; font-weight: 700;">www.softbadge.pt</a> e clique em <strong>"Entrar"</strong>.</p>
              <p style="margin: 10px 0 0 0; font-size: 13px; color: #94a3b8;">© SoftBadge.PT. Todos os direitos reservados.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

/**
 * 1. TEMPLATE DE BOAS-VINDAS / REGISTO DE NOVO UTILIZADOR
 */
function templateBoasVindas({ nome, email, tempPassword, verificationCode, tempoRestanteTexto, perfisTexto }) {
  const text = [
    `Olá ${nome},`,
    '',
    'Seja bem-vindo à SoftBadge.PT!',
    'A sua conta foi criada com sucesso. Aqui estão as suas credenciais de acesso iniciais:',
    '',
    `Email: ${email}`,
    `Password Temporária: ${tempPassword}`,
    `Código de Confirmação de Email: ${verificationCode}`,
    '',
    'Por favor utilize estas credenciais temporárias para realizar o primeiro login em https://www.softbadge.pt e alterar a sua password.',
    `Validade do código: ${tempoRestanteTexto}.`,
    ...(perfisTexto ? ['', `Você tem o seguinte acesso: ${perfisTexto}`] : [])
  ].join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">Boas-vindas, ${nome}! 👋</h2>
    
    <p style="font-size: 20px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      A sua conta na plataforma <strong>SoftBadge.PT</strong> foi criada com sucesso. Abaixo encontra os seus dados de acesso iniciais:
    </p>

    <!-- CARD DE CREDENCIAIS DE ALTO IMPACTO -->
    <div style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 10px; padding: 24px; margin: 28px 0;">
      <div style="margin-bottom: 16px;">
        <span style="font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px; letter-spacing: 0.5px;">Email de Acesso</span>
        <span style="font-size: 20px; color: #0f172a; font-weight: 700;">${email}</span>
      </div>
      
      <div style="margin-bottom: 16px; padding-top: 14px; border-top: 1px dashed #cbd5e1;">
        <span style="font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 6px; letter-spacing: 0.5px;">Password Temporária</span>
        <span style="font-size: 20px; font-family: monospace; color: #0284c7; font-weight: 800; background: #e0f2fe; padding: 6px 14px; border-radius: 6px; display: inline-block;">${tempPassword}</span>
      </div>
      
      <div style="padding-top: 14px; border-top: 1px dashed #cbd5e1;">
        <span style="font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 6px; letter-spacing: 0.5px;">Código de Confirmação de Email</span>
        <span style="font-size: 26px; font-family: monospace; color: #16a34a; font-weight: 800; letter-spacing: 3px; background: #dcfce7; padding: 6px 16px; border-radius: 6px; display: inline-block;">${verificationCode}</span>
      </div>
    </div>

    <p style="font-size: 17px; color: #475569; line-height: 1.6;">
      💡 <em>Por favor utilize a password temporária para fazer o primeiro login e definir uma nova palavra-passe. O código de confirmação tem uma validade de <strong>${tempoRestanteTexto}</strong>.</em>
    </p>

    <!-- SECCÃO DE ACESSOS / PERFIS -->
    ${perfisTexto ? `
    <div style="margin-top: 24px; padding-top: 18px; border-top: 1px solid #e2e8f0;">
      <span style="font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 8px; letter-spacing: 0.5px;">Acessos Atribuídos</span>
      <p style="font-size: 16px; color: #0f172a; margin: 0; font-weight: 600;">
        Você tem o seguinte acesso: <span style="color: #0284c7;">${perfisTexto}</span>
      </p>
    </div>
    ` : ''}
  `;

  const html = buildBaseLayout({
    titulo: `Boas-vindas à SoftBadge, ${nome}!`,
    conteudoHeader: 'Confirmação de Registo & Credenciais',
    corpoHtml,
    ctaText: 'Aceder à Plataforma SoftBadge',
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html };
}

/**
 * 2. TEMPLATE DE RECUPERAÇÃO DE PASSWORD
 */
function templateRecuperacaoPassword({ nome, tempPassword }) {
  const text = [
    `Olá ${nome || ''},`,
    '',
    'Recebemos um pedido de recuperação de password para a sua conta.',
    `A sua nova password temporária é: ${tempPassword}`,
    'Validade: 1 hora.',
    '',
    'Aceda a https://www.softbadge.pt para iniciar sessão e alterar a sua password.'
  ].join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">Recuperação de Password 🔐</h2>
    
    <p style="font-size: 20px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      Olá <strong>${nome || ''}</strong>, recebemos um pedido para redefinir a palavra-passe da sua conta.
    </p>

    <!-- CARD PASSWORD TEMPORÁRIA -->
    <div style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 10px; padding: 24px; text-align: center; margin: 28px 0;">
      <span style="font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 8px; letter-spacing: 0.5px;">A sua Password Temporária</span>
      <span style="font-size: 24px; font-family: monospace; color: #0284c7; font-weight: 800; background: #e0f2fe; padding: 8px 20px; border-radius: 8px; display: inline-block;">${tempPassword}</span>
      <span style="font-size: 15px; color: #dc2626; font-weight: 700; display: block; margin-top: 12px;">⏰ Válida durante 1 hora</span>
    </div>

    <p style="font-size: 17px; color: #475569; line-height: 1.6;">
      Se não solicitou esta alteração, por favor ignore este mensagem. A sua password atual permanecerá segura.
    </p>
  `;

  const html = buildBaseLayout({
    titulo: 'Recuperação de Password - SoftBadge',
    conteudoHeader: 'Segurança & Recuperação de Conta',
    corpoHtml,
    ctaText: 'Ir para www.softbadge.pt',
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html };
}

/**
 * 3. TEMPLATE DE REENVIO DE CÓDIGO DE VERIFICAÇÃO
 */
function templateReenvioCodigo({ nome, codigo, validadeMinutos }) {
  const text = [
    `Olá ${nome || ''},`,
    '',
    'Recebemos um pedido para reenviar o seu código de confirmação de email.',
    `Novo Código: ${codigo}`,
    `Validade: ${validadeMinutos} minutos.`,
    '',
    'Aceda a https://www.softbadge.pt para confirmar a sua conta.'
  ].join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">Código de Verificação ✉️</h2>
    
    <p style="font-size: 20px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      Olá <strong>${nome || ''}</strong>, aqui está o seu novo código de confirmação de email para ativar a conta:
    </p>

    <!-- CARD CÓDIGO -->
    <div style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 10px; padding: 24px; text-align: center; margin: 28px 0;">
      <span style="font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 8px; letter-spacing: 0.5px;">Código de Confirmação</span>
      <span style="font-size: 28px; font-family: monospace; color: #16a34a; font-weight: 800; letter-spacing: 4px; background: #dcfce7; padding: 8px 24px; border-radius: 8px; display: inline-block;">${codigo}</span>
      <span style="font-size: 15px; color: #64748b; display: block; margin-top: 12px;">Válido durante <strong>${validadeMinutos} minutos</strong></span>
    </div>
  `;

  const html = buildBaseLayout({
    titulo: 'Novo Código de Verificação - SoftBadge',
    conteudoHeader: 'Ativação de Conta de Utilizador',
    corpoHtml,
    ctaText: 'Aceder a www.softbadge.pt',
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html };
}

/**
 * 4. TEMPLATE DE RENOVAÇÃO DE CREDENCIAIS
 */
function templateRenovacaoCredenciais({ nome, tempPassword, verificationCode, tempoRestanteTexto }) {
  const text = [
    `Olá ${nome},`,
    '',
    'Foi solicitado um reenvio das suas credenciais de acesso iniciais.',
    `Nova Password Temporária: ${tempPassword}`,
    `Novo Código de Confirmação de Email: ${verificationCode}`,
    `Validade: ${tempoRestanteTexto}`,
    '',
    'Aceda a https://www.softbadge.pt para efetuar o primeiro login.'
  ].join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">Renovação de Credenciais Iniciais 🔄</h2>
    
    <p style="font-size: 20px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      Olá <strong>${nome}</strong>, foram geradas novas credenciais temporárias para a sua conta:
    </p>

    <!-- CARD CREDENCIAIS -->
    <div style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 10px; padding: 24px; margin: 28px 0;">
      <div style="margin-bottom: 16px;">
        <span style="font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px; letter-spacing: 0.5px;">Nova Password Temporária</span>
        <span style="font-size: 20px; font-family: monospace; color: #0284c7; font-weight: 800; background: #e0f2fe; padding: 6px 14px; border-radius: 6px; display: inline-block;">${tempPassword}</span>
      </div>
      <div style="padding-top: 14px; border-top: 1px dashed #cbd5e1;">
        <span style="font-size: 14px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 4px; letter-spacing: 0.5px;">Novo Código de Verificação</span>
        <span style="font-size: 26px; font-family: monospace; color: #16a34a; font-weight: 800; letter-spacing: 3px; background: #dcfce7; padding: 6px 16px; border-radius: 6px; display: inline-block;">${verificationCode}</span>
      </div>
    </div>

    <p style="font-size: 17px; color: #475569; line-height: 1.6;">
      Estas credenciais têm uma validade de <strong>${tempoRestanteTexto}</strong>.
    </p>
  `;

  const html = buildBaseLayout({
    titulo: 'Renovação de Credenciais - SoftBadge',
    conteudoHeader: 'Novas Credenciais Temporárias',
    corpoHtml,
    ctaText: 'Aceder à Plataforma SoftBadge',
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html };
}

/**
 * 5. TEMPLATE DE SLA EXPIRADO / ULTRAPASSADO
 */
function templateSlaExpirado({ nomeDestinatario, cargoDestinatario, nomeConsultor, emailConsultor, tituloBadge, dataSubmissao, dataVencimentoSla, historicoAcoes = [] }) {
  const listHistorico = historicoAcoes.map(a => `- [${a.data}] ${a.autor}: ${a.descricao}`).join('\n');
  const text = [
    `Olá ${nomeDestinatario},`,
    '',
    `Alerta de SLA Expirado - Candidatura de Badge`,
    `Atenção: O prazo limite de resposta (SLA) para a candidatura foi ultrapassado.`,
    '',
    `Detalhes da Candidatura:`,
    `- Consultor: ${nomeConsultor} (${emailConsultor})`,
    `- Badge: ${tituloBadge}`,
    `- Data de Submissão: ${dataSubmissao}`,
    `- Data Limite de Resposta (SLA): ${dataVencimentoSla}`,
    '',
    `Histórico de Ações da Candidatura:`,
    listHistorico,
    '',
    'Aceda à plataforma para analisar e validar esta candidatura com urgência.'
  ].join('\n');

  const acoesHtml = historicoAcoes.map(a => `
    <tr style="border-bottom: 1px solid #e2e8f0;">
      <td style="padding: 10px 0; font-size: 14px; color: #475569;">${a.data}</td>
      <td style="padding: 10px 0; font-size: 14px; color: #475569; font-weight: 600;">${a.autor}</td>
      <td style="padding: 10px 0; font-size: 14px; color: #64748b;">${a.descricao}</td>
    </tr>
  `).join('');

  const corpoHtml = `
    <h2 style="color: #dc2626; margin-top: 0; margin-bottom: 16px; font-size: 24px; font-weight: 800;">⚠️ Alerta de SLA Expirado</h2>
    
    <p style="font-size: 18px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      Olá <strong>${nomeDestinatario}</strong> (${cargoDestinatario}), o prazo limite de análise e resposta estipulado para a candidatura de badge abaixo foi excedido.
    </p>

    <!-- CARD DETALHES SLA -->
    <div style="background-color: #fff5f5; border: 2px solid #feb2b2; border-radius: 10px; padding: 24px; margin: 28px 0;">
      <div style="margin-bottom: 12px;">
        <span style="font-size: 13px; text-transform: uppercase; color: #c53030; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">Consultor</span>
        <span style="font-size: 18px; color: #1a202c; font-weight: 700;">${nomeConsultor}</span> <span style="font-size: 14px; color: #4a5568;">(${emailConsultor})</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #feb2b2;">
        <span style="font-size: 13px; text-transform: uppercase; color: #c53030; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">Badge Candidatado</span>
        <span style="font-size: 18px; color: #1a202c; font-weight: 700;">${tituloBadge}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #feb2b2;">
        <span style="font-size: 13px; text-transform: uppercase; color: #c53030; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">Início da Pendência (Submissão)</span>
        <span style="font-size: 16px; color: #1a202c; font-weight: 600;">${dataSubmissao}</span>
      </div>
      <div style="padding-top: 10px; border-top: 1px dashed #feb2b2;">
        <span style="font-size: 13px; text-transform: uppercase; color: #c53030; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">Prazo Limite do SLA</span>
        <span style="font-size: 16px; color: #e53e3e; font-weight: 800;">${dataVencimentoSla} (Expirado)</span>
      </div>
    </div>

    <!-- HISTÓRICO DE AÇÕES -->
    <h3 style="color: #0f172a; margin-top: 28px; margin-bottom: 14px; font-size: 18px; font-weight: 700;">Histórico de Ações da Candidatura</h3>
    <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
      <thead>
        <tr style="border-bottom: 2px solid #cbd5e1; text-align: left;">
          <th style="padding: 8px 0; font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700;">Data</th>
          <th style="padding: 8px 0; font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700;">Autor</th>
          <th style="padding: 8px 0; font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700;">Ação</th>
        </tr>
      </thead>
      <tbody>
        ${acoesHtml}
      </tbody>
    </table>

    <p style="font-size: 16px; color: #475569; line-height: 1.6; margin-top: 24px;">
      💡 <em>Por favor, aceda à plataforma com urgência para analisar a candidatura e garantir o cumprimento dos prazos corporativos.</em>
    </p>
  `;

  const html = buildBaseLayout({
    titulo: 'Alerta de Prazo de SLA Expirado - SoftBadge',
    conteudoHeader: 'Notificação de SLA Excedido',
    corpoHtml,
    ctaText: 'Aceder à Candidatura',
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html };
}

/**
 * 6. TEMPLATE DE CANDIDATURA CRIADA / INSCRIÇÃO DE BADGE
 */
function templateCandidaturaCriada({ nome, lang, badgeNome, pontos, lpNome, slNome, areaNome, nivelNome, requisitos = [] }) {
  const idioma = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';
  const dict = {
    pt: {
      assunto: 'Confirmação de Candidatura ao Badge - SoftBadge.PT',
      header: 'Candidatura Registada',
      boasVindas: `Olá <strong>${nome}</strong>!`,
      introducao: `A sua candidatura ao badge <strong>${badgeNome}</strong> foi registada com sucesso no sistema.`,
      detalhesTitle: 'Detalhes da Candidatura',
      labelPontos: 'Pontos do Badge',
      labelLP: 'Learning Path',
      labelSL: 'Service Line',
      labelArea: 'Área',
      labelNivel: 'Nível',
      labelRequisitos: 'Requisitos Associados',
      rodapeInstrucao: 'Pode acompanhar o estado da sua candidatura acedendo ao seu dashboard na plataforma.',
      botaoAcao: 'Ver Candidatura'
    },
    en: {
      assunto: 'Badge Application Confirmation - SoftBadge.PT',
      header: 'Application Registered',
      boasVindas: `Hello <strong>${nome}</strong>!`,
      introducao: `Your application for the badge <strong>${badgeNome}</strong> has been successfully registered in the system.`,
      detalhesTitle: 'Application Details',
      labelPontos: 'Badge Points',
      labelLP: 'Learning Path',
      labelSL: 'Service Line',
      labelArea: 'Area',
      labelNivel: 'Level',
      labelRequisitos: 'Associated Requirements',
      rodapeInstrucao: 'You can track the status of your application by accessing your dashboard on the platform.',
      botaoAcao: 'View Application'
    },
    es: {
      assunto: 'Confirmación de Solicitud de Badge - SoftBadge.PT',
      header: 'Solicitud Registrada',
      boasVindas: `¡Hola <strong>${nome}</strong>!`,
      introducao: `¡Su solicitud para el badge <strong>${badgeNome}</strong> ha sido registrada con éxito en el sistema!`,
      detalhesTitle: 'Detalles de la Solicitud',
      labelPontos: 'Puntos del Badge',
      labelLP: 'Learning Path',
      labelSL: 'Service Line',
      labelArea: 'Área',
      labelNivel: 'Nivel',
      labelRequisitos: 'Requisitos Asociados',
      rodapeInstrucao: 'Puede realizar el seguimiento del estado de su solicitud accediendo a su panel en la plataforma.',
      botaoAcao: 'Ver Solicitud'
    }
  };

  const tr = dict[idioma];

  const reqHtml = requisitos.map(r => `
    <li style="margin-bottom: 8px; font-size: 16px; color: #475569; line-height: 1.5;">
      <strong>${r}</strong>
    </li>
  `).join('');

  const reqText = requisitos.map(r => `- ${r}`).join('\n');

  const text = [
    `Olá ${nome},`,
    '',
    tr.introducao.replace(/<[^>]*>/g, ''),
    '',
    `${tr.detalhesTitle}:`,
    `- ${tr.labelLP}: ${lpNome}`,
    `- ${tr.labelSL}: ${slNome}`,
    `- ${tr.labelArea}: ${areaNome}`,
    `- ${tr.labelNivel}: ${nivelNome}`,
    `- ${tr.labelPontos}: ${pontos} pts`,
    '',
    requisitos.length > 0 ? `${tr.labelRequisitos}:\n${reqText}` : '',
    '',
    tr.rodapeInstrucao.replace(/<[^>]*>/g, '')
  ].filter(Boolean).join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">${tr.header} 🎓</h2>
    
    <p style="font-size: 20px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      ${tr.boasVindas} 👋<br/>
      ${tr.introducao}
    </p>

    <!-- CARD DETALHES -->
    <div style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 10px; padding: 24px; margin: 28px 0;">
      <h3 style="color: #0f172a; margin-top: 0; margin-bottom: 18px; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${tr.detalhesTitle}</h3>
      
      <div style="margin-bottom: 12px;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelLP}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${lpNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelSL}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${slNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelArea}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${areaNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelNivel}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${nivelNome}</span>
      </div>
      <div style="padding-top: 10px; border-top: 1px dashed #e2e8f0;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelPontos}</span>
        <span style="font-size: 18px; color: #0284c7; font-weight: 800;">+${pontos} pts</span>
      </div>
    </div>

    <!-- REQUISITOS SE DISPONÍVEIS -->
    ${requisitos.length > 0 ? `
    <div style="margin-top: 24px;">
      <h3 style="color: #0f172a; margin-bottom: 14px; font-size: 18px; font-weight: 700;">${tr.labelRequisitos}</h3>
      <ul style="padding-left: 20px; margin: 0;">
        ${reqHtml}
      </ul>
    </div>
    ` : ''}

    <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin-top: 28px;">
      ${tr.rodapeInstrucao}
    </p>
  `;

  const html = buildBaseLayout({
    titulo: tr.assunto,
    conteudoHeader: tr.header,
    corpoHtml,
    ctaText: tr.botaoAcao,
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html, assunto: tr.assunto };
}

/**
 * 7. TEMPLATE DE ALERTA DE EXPIRAÇÃO DE BADGE (i18n: PT, EN, ES)
 */
function templateBadgeExpirando({ nome, badgeNome, dataConquista, dataExpiracao, diasRestantes, lang = 'pt' }) {
  const idioma = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';

  const dict = {
    pt: {
      assunto: `Alerta: O seu Badge "${badgeNome}" expira em ${diasRestantes} dias`,
      header: 'Alerta de Expiração de Badge',
      boasVindas: `Olá <strong>${nome}</strong>,`,
      introducao: `Gostaríamos de o informar que o badge <strong>"${badgeNome}"</strong> que conquistou está próximo da data de expiração.`,
      detalhesTitle: 'Detalhes da Expiração',
      labelBadge: 'Badge',
      labelDataConquista: 'Data de Conquista',
      labelDataExpiracao: 'Data de Expiração',
      labelDiasRestantes: 'Dias Restantes',
      rodape: 'Aceda à plataforma para renovar o seu badge antes do prazo de validade expirar.',
      botaoAcao: 'Aceder à Plataforma'
    },
    en: {
      assunto: `Alert: Your Badge "${badgeNome}" expires in ${diasRestantes} days`,
      header: 'Badge Expiration Alert',
      boasVindas: `Hello <strong>${nome}</strong>,`,
      introducao: `We would like to inform you that the badge <strong>"${badgeNome}"</strong> you earned is approaching its expiration date.`,
      detalhesTitle: 'Expiration Details',
      labelBadge: 'Badge',
      labelDataConquista: 'Date Earned',
      labelDataExpiracao: 'Expiration Date',
      labelDiasRestantes: 'Days Remaining',
      rodape: 'Access the platform to renew your badge before it expires.',
      botaoAcao: 'Access Platform'
    },
    es: {
      assunto: `Alerta: Su Badge "${badgeNome}" expira en ${diasRestantes} días`,
      header: 'Alerta de Expiración de Badge',
      boasVindas: `Hola <strong>${nome}</strong>,`,
      introducao: `Nos gustaría informarle que el badge <strong>"${badgeNome}"</strong> que obtuvo está próximo a su fecha de expiración.`,
      detalhesTitle: 'Detalles de la Expiración',
      labelBadge: 'Badge',
      labelDataConquista: 'Fecha de Conquista',
      labelDataExpiracao: 'Fecha de Expiración',
      labelDiasRestantes: 'Días Restantes',
      rodape: 'Acceda a la plataforma para renovar su badge antes de que expire.',
      botaoAcao: 'Acceder a la Plataforma'
    }
  };

  const tr = dict[idioma];

  const text = [
    tr.boasVindas.replace(/<[^>]*>/g, ''),
    '',
    tr.introducao.replace(/<[^>]*>/g, ''),
    '',
    `${tr.detalhesTitle}:`,
    `- ${tr.labelBadge}: ${badgeNome}`,
    `- ${tr.labelDataConquista}: ${dataConquista}`,
    `- ${tr.labelDataExpiracao}: ${dataExpiracao}`,
    `- ${tr.labelDiasRestantes}: ${diasRestantes}`,
    '',
    tr.rodape
  ].join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">${tr.header} ⏰</h2>
    
    <p style="font-size: 20px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      ${tr.boasVindas}<br/>
      ${tr.introducao}
    </p>

    <!-- CARD DETALHES -->
    <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 10px; padding: 24px; margin: 28px 0;">
      <h3 style="color: #92400e; margin-top: 0; margin-bottom: 18px; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${tr.detalhesTitle}</h3>
      
      <div style="margin-bottom: 12px;">
        <span style="font-size: 13px; text-transform: uppercase; color: #92400e; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelBadge}</span>
        <span style="font-size: 18px; color: #0f172a; font-weight: 700;">${badgeNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #fbbf24;">
        <span style="font-size: 13px; text-transform: uppercase; color: #92400e; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelDataConquista}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${dataConquista}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #fbbf24;">
        <span style="font-size: 13px; text-transform: uppercase; color: #92400e; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelDataExpiracao}</span>
        <span style="font-size: 16px; color: #dc2626; font-weight: 800;">${dataExpiracao}</span>
      </div>
      <div style="padding-top: 10px; border-top: 1px dashed #fbbf24;">
        <span style="font-size: 13px; text-transform: uppercase; color: #92400e; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelDiasRestantes}</span>
        <span style="font-size: 22px; color: #dc2626; font-weight: 800;">${diasRestantes}</span>
      </div>
    </div>

    <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin-top: 28px;">
      ${tr.rodape}
    </p>
  `;

  const html = buildBaseLayout({
    titulo: tr.assunto,
    conteudoHeader: tr.header,
    corpoHtml,
    ctaText: tr.botaoAcao,
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html, assunto: tr.assunto };
}

/**
 * 8. TEMPLATE DE CANDIDATURA PARA ANÁLISE DO TALENT MANAGER (i18n: PT, EN, ES)
 * Enviado a todos os TMs (excepto o dono da candidatura) quando uma candidatura atinge o Estado 2 (SUBMITTED).
 */
function templateCandidaturaParaAnaliseTM({ nomeTM, nomeConsultor, lang, badgeNome, pontos, lpNome, slNome, areaNome, nivelNome, slaHoras = 48 }) {
  const idioma = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';
  const dict = {
    pt: {
      assunto: `Nova Candidatura para Análise – Badge "${badgeNome}"`,
      header: 'Nova Candidatura para Análise',
      boasVindas: `Olá <strong>${nomeTM}</strong>,`,
      introducao: `O consultor <strong>${nomeConsultor}</strong> submeteu uma candidatura ao badge <strong>"${badgeNome}"</strong> que aguarda a sua análise e pré-aprovação.`,
      detalhesTitle: 'Detalhes da Candidatura',
      labelConsultor: 'Consultor',
      labelPontos: 'Pontos do Badge',
      labelLP: 'Learning Path',
      labelSL: 'Service Line',
      labelArea: 'Área',
      labelNivel: 'Nível',
      labelPrazo: 'Prazo de Análise (SLA)',
      prazoTexto: `${slaHoras} horas a partir da submissão`,
      rodape: 'Por favor, aceda à plataforma para analisar as evidências e emitir o seu parecer dentro do prazo estipulado.',
      botaoAcao: 'Analisar Candidatura'
    },
    en: {
      assunto: `New Application for Review – Badge "${badgeNome}"`,
      header: 'New Application for Review',
      boasVindas: `Hello <strong>${nomeTM}</strong>,`,
      introducao: `The consultant <strong>${nomeConsultor}</strong> has submitted an application for the badge <strong>"${badgeNome}"</strong> that awaits your review and pre-approval.`,
      detalhesTitle: 'Application Details',
      labelConsultor: 'Consultant',
      labelPontos: 'Badge Points',
      labelLP: 'Learning Path',
      labelSL: 'Service Line',
      labelArea: 'Area',
      labelNivel: 'Level',
      labelPrazo: 'Review Deadline (SLA)',
      prazoTexto: `${slaHoras} hours from submission`,
      rodape: 'Please access the platform to review the evidence and provide your assessment within the stipulated deadline.',
      botaoAcao: 'Review Application'
    },
    es: {
      assunto: `Nueva Solicitud para Análisis – Badge "${badgeNome}"`,
      header: 'Nueva Solicitud para Análisis',
      boasVindas: `Hola <strong>${nomeTM}</strong>,`,
      introducao: `El consultor <strong>${nomeConsultor}</strong> ha enviado una solicitud para el badge <strong>"${badgeNome}"</strong> que espera su análisis y preaprobación.`,
      detalhesTitle: 'Detalles de la Solicitud',
      labelConsultor: 'Consultor',
      labelPontos: 'Puntos del Badge',
      labelLP: 'Learning Path',
      labelSL: 'Service Line',
      labelArea: 'Área',
      labelNivel: 'Nivel',
      labelPrazo: 'Plazo de Análisis (SLA)',
      prazoTexto: `${slaHoras} horas desde el envío`,
      rodape: 'Por favor, acceda a la plataforma para revisar las evidencias y emitir su valoración dentro del plazo establecido.',
      botaoAcao: 'Analizar Solicitud'
    }
  };

  const tr = dict[idioma];

  const text = [
    tr.boasVindas.replace(/<[^>]*>/g, ''),
    '',
    tr.introducao.replace(/<[^>]*>/g, ''),
    '',
    `${tr.detalhesTitle}:`,
    `- ${tr.labelConsultor}: ${nomeConsultor}`,
    `- ${tr.labelLP}: ${lpNome}`,
    `- ${tr.labelSL}: ${slNome}`,
    `- ${tr.labelArea}: ${areaNome}`,
    `- ${tr.labelNivel}: ${nivelNome}`,
    `- ${tr.labelPontos}: ${pontos} pts`,
    `- ${tr.labelPrazo}: ${tr.prazoTexto}`,
    '',
    tr.rodape
  ].join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">${tr.header} 📋</h2>
    
    <p style="font-size: 20px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      ${tr.boasVindas}<br/>
      ${tr.introducao}
    </p>

    <!-- CARD DETALHES -->
    <div style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 10px; padding: 24px; margin: 28px 0;">
      <h3 style="color: #0f172a; margin-top: 0; margin-bottom: 18px; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${tr.detalhesTitle}</h3>
      
      <div style="margin-bottom: 12px;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelConsultor}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${nomeConsultor}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelLP}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${lpNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelSL}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${slNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelArea}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${areaNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelNivel}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${nivelNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #e2e8f0;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelPontos}</span>
        <span style="font-size: 18px; color: #0284c7; font-weight: 800;">+${pontos} pts</span>
      </div>
      <div style="padding-top: 10px; border-top: 1px dashed #e2e8f0;">
        <span style="font-size: 13px; text-transform: uppercase; color: #dc2626; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">⏰ ${tr.labelPrazo}</span>
        <span style="font-size: 16px; color: #dc2626; font-weight: 800;">${tr.prazoTexto}</span>
      </div>
    </div>

    <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin-top: 28px;">
      ${tr.rodape}
    </p>
  `;

  const html = buildBaseLayout({
    titulo: tr.assunto,
    conteudoHeader: tr.header,
    corpoHtml,
    ctaText: tr.botaoAcao,
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html, assunto: tr.assunto };
}

/**
 * 9. TEMPLATE DE CANDIDATURA PARA VALIDAÇÃO FINAL DO SLL (i18n: PT, EN, ES)
 * Enviado ao líder da Service Line quando uma candidatura atinge o Estado 3 (EM_VALIDACAO) após pré-aprovação do TM.
 */
function templateCandidaturaParaValidacaoSLL({ nomeSLL, nomeConsultor, nomeTmQuePreAprovou, lang, badgeNome, pontos, lpNome, slNome, areaNome, nivelNome, slaHoras = 48 }) {
  const idioma = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';
  const dict = {
    pt: {
      assunto: `Candidatura Pré-Aprovada para Validação Final – Badge "${badgeNome}"`,
      header: 'Candidatura Aguarda Validação Final',
      boasVindas: `Olá <strong>${nomeSLL}</strong>,`,
      introducao: `A candidatura do consultor <strong>${nomeConsultor}</strong> ao badge <strong>"${badgeNome}"</strong> foi pré-aprovada pelo Talent Manager <strong>${nomeTmQuePreAprovou}</strong> e aguarda a sua validação final.`,
      detalhesTitle: 'Detalhes da Candidatura',
      labelConsultor: 'Consultor',
      labelTM: 'Pré-Aprovado por (TM)',
      labelPontos: 'Pontos do Badge',
      labelLP: 'Learning Path',
      labelSL: 'Service Line',
      labelArea: 'Área',
      labelNivel: 'Nível',
      labelPrazo: 'Prazo de Validação (SLA)',
      prazoTexto: `${slaHoras} horas a partir da pré-aprovação`,
      rodape: 'Por favor, aceda à plataforma para validar as evidências e emitir a decisão final dentro do prazo estipulado.',
      botaoAcao: 'Validar Candidatura'
    },
    en: {
      assunto: `Pre-Approved Application Awaiting Final Validation – Badge "${badgeNome}"`,
      header: 'Application Awaiting Final Validation',
      boasVindas: `Hello <strong>${nomeSLL}</strong>,`,
      introducao: `The application by consultant <strong>${nomeConsultor}</strong> for the badge <strong>"${badgeNome}"</strong> has been pre-approved by Talent Manager <strong>${nomeTmQuePreAprovou}</strong> and awaits your final validation.`,
      detalhesTitle: 'Application Details',
      labelConsultor: 'Consultant',
      labelTM: 'Pre-Approved by (TM)',
      labelPontos: 'Badge Points',
      labelLP: 'Learning Path',
      labelSL: 'Service Line',
      labelArea: 'Area',
      labelNivel: 'Level',
      labelPrazo: 'Validation Deadline (SLA)',
      prazoTexto: `${slaHoras} hours from pre-approval`,
      rodape: 'Please access the platform to validate the evidence and issue the final decision within the stipulated deadline.',
      botaoAcao: 'Validate Application'
    },
    es: {
      assunto: `Solicitud Preaprobada para Validación Final – Badge "${badgeNome}"`,
      header: 'Solicitud Aguarda Validación Final',
      boasVindas: `Hola <strong>${nomeSLL}</strong>,`,
      introducao: `La solicitud del consultor <strong>${nomeConsultor}</strong> para el badge <strong>"${badgeNome}"</strong> fue preaprobada por el Talent Manager <strong>${nomeTmQuePreAprovou}</strong> y aguarda su validación final.`,
      detalhesTitle: 'Detalles de la Solicitud',
      labelConsultor: 'Consultor',
      labelTM: 'Preaprobado por (TM)',
      labelPontos: 'Puntos del Badge',
      labelLP: 'Learning Path',
      labelSL: 'Service Line',
      labelArea: 'Área',
      labelNivel: 'Nivel',
      labelPrazo: 'Plazo de Validación (SLA)',
      prazoTexto: `${slaHoras} horas desde la preaprobación`,
      rodape: 'Por favor, acceda a la plataforma para validar las evidencias y emitir la decisión final dentro del plazo establecido.',
      botaoAcao: 'Validar Solicitud'
    }
  };

  const tr = dict[idioma];

  const text = [
    tr.boasVindas.replace(/<[^>]*>/g, ''),
    '',
    tr.introducao.replace(/<[^>]*>/g, ''),
    '',
    `${tr.detalhesTitle}:`,
    `- ${tr.labelConsultor}: ${nomeConsultor}`,
    `- ${tr.labelTM}: ${nomeTmQuePreAprovou}`,
    `- ${tr.labelLP}: ${lpNome}`,
    `- ${tr.labelSL}: ${slNome}`,
    `- ${tr.labelArea}: ${areaNome}`,
    `- ${tr.labelNivel}: ${nivelNome}`,
    `- ${tr.labelPontos}: ${pontos} pts`,
    `- ${tr.labelPrazo}: ${tr.prazoTexto}`,
    '',
    tr.rodape
  ].join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">${tr.header} ✅</h2>
    
    <p style="font-size: 20px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      ${tr.boasVindas}<br/>
      ${tr.introducao}
    </p>

    <!-- CARD DETALHES -->
    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 24px; margin: 28px 0;">
      <h3 style="color: #14532d; margin-top: 0; margin-bottom: 18px; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${tr.detalhesTitle}</h3>
      
      <div style="margin-bottom: 12px;">
        <span style="font-size: 13px; text-transform: uppercase; color: #166534; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelConsultor}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${nomeConsultor}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #86efac;">
        <span style="font-size: 13px; text-transform: uppercase; color: #166534; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelTM}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${nomeTmQuePreAprovou}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #86efac;">
        <span style="font-size: 13px; text-transform: uppercase; color: #166534; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelLP}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${lpNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #86efac;">
        <span style="font-size: 13px; text-transform: uppercase; color: #166534; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelSL}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${slNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #86efac;">
        <span style="font-size: 13px; text-transform: uppercase; color: #166534; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelArea}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${areaNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #86efac;">
        <span style="font-size: 13px; text-transform: uppercase; color: #166534; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelNivel}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${nivelNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #86efac;">
        <span style="font-size: 13px; text-transform: uppercase; color: #166534; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelPontos}</span>
        <span style="font-size: 18px; color: #0284c7; font-weight: 800;">+${pontos} pts</span>
      </div>
      <div style="padding-top: 10px; border-top: 1px dashed #86efac;">
        <span style="font-size: 13px; text-transform: uppercase; color: #dc2626; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">⏰ ${tr.labelPrazo}</span>
        <span style="font-size: 16px; color: #dc2626; font-weight: 800;">${tr.prazoTexto}</span>
      </div>
    </div>

    <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin-top: 28px;">
      ${tr.rodape}
    </p>
  `;

  const html = buildBaseLayout({
    titulo: tr.assunto,
    conteudoHeader: tr.header,
    corpoHtml,
    ctaText: tr.botaoAcao,
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html, assunto: tr.assunto };
}


/**
 * 10. TEMPLATE DE OBJETIVO CUMPRIDO (i18n: PT, EN, ES)
 * Enviado ao Consultor quando um objetivo pessoal é atingido com sucesso.
 */
function templateObjetivoCumprido({ nome, tipoNome, descricaoObjetivo, lang = 'pt' }) {
  const idioma = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';

  const dict = {
    pt: {
      assunto: `🎉 Parabéns! Objetivo Pessoal Concluído: "${tipoNome}"`,
      header: 'Objetivo Alcançado com Sucesso!',
      boasVindas: `Olá <strong>${nome}</strong>,`,
      introducao: `Parabéns pela sua dedicação! O seu objetivo pessoal <strong>"${tipoNome}"</strong> foi concluído com sucesso.`,
      detalhesTitle: 'Detalhes do Objetivo',
      labelTipo: 'Tipo de Objetivo',
      labelMeta: 'Meta Cumprida',
      rodape: 'Continue a definir metas ambiciosas para evoluir as suas competências na SoftBadge!',
      botaoAcao: 'Ver Meus Objetivos'
    },
    en: {
      assunto: `🎉 Congratulations! Personal Goal Achieved: "${tipoNome}"`,
      header: 'Goal Successfully Achieved!',
      boasVindas: `Hello <strong>${nome}</strong>,`,
      introducao: `Congratulations on your dedication! Your personal goal <strong>"${tipoNome}"</strong> has been successfully achieved.`,
      detalhesTitle: 'Goal Details',
      labelTipo: 'Goal Type',
      labelMeta: 'Target Achieved',
      rodape: 'Keep setting ambitious targets to develop your skills on SoftBadge!',
      botaoAcao: 'View My Goals'
    },
    es: {
      assunto: `🎉 ¡Felicidades! Objetivo Personal Cumplido: "${tipoNome}"`,
      header: '¡Objetivo Alcanzado con Éxito!',
      boasVindas: `Hola <strong>${nome}</strong>,`,
      introducao: `¡Felicidades por su dedicación! Su objetivo personal <strong>"${tipoNome}"</strong> ha sido cumplido con éxito.`,
      detalhesTitle: 'Detalles del Objetivo',
      labelTipo: 'Tipo de Objetivo',
      labelMeta: 'Meta Cumplida',
      rodape: '¡Continúe estableciendo metas ambiciosas para desarrollar sus competencias en SoftBadge!',
      botaoAcao: 'Ver Mis Objetivos'
    }
  };

  const tr = dict[idioma];

  const text = [
    tr.boasVindas.replace(/<[^>]*>/g, ''),
    '',
    tr.introducao.replace(/<[^>]*>/g, ''),
    '',
    `${tr.detalhesTitle}:`,
    `- ${tr.labelTipo}: ${tipoNome}`,
    `- ${tr.labelMeta}: ${descricaoObjetivo}`,
    '',
    tr.rodape
  ].join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">${tr.header} 🏆</h2>
    
    <p style="font-size: 18px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      ${tr.boasVindas}<br/>
      ${tr.introducao}
    </p>

    <!-- CARD DETALHES -->
    <div style="background-color: #f0fdf4; border: 2px solid #86efac; border-radius: 10px; padding: 24px; margin: 28px 0;">
      <h3 style="color: #166534; margin-top: 0; margin-bottom: 18px; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${tr.detalhesTitle}</h3>
      
      <div style="margin-bottom: 12px;">
        <span style="font-size: 13px; text-transform: uppercase; color: #166534; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelTipo}</span>
        <span style="font-size: 18px; color: #0f172a; font-weight: 700;">${tipoNome}</span>
      </div>
      <div style="padding-top: 10px; border-top: 1px dashed #86efac;">
        <span style="font-size: 13px; text-transform: uppercase; color: #166534; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelMeta}</span>
        <span style="font-size: 16px; color: #15803d; font-weight: 700;">${descricaoObjetivo}</span>
      </div>
    </div>

    <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin-top: 28px;">
      ${tr.rodape}
    </p>
  `;

  const html = buildBaseLayout({
    titulo: tr.assunto,
    conteudoHeader: tr.header,
    corpoHtml,
    ctaText: tr.botaoAcao,
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html, assunto: tr.assunto };
}

/**
 * 11. TEMPLATE DE AVISO DE PRAZO DE OBJETIVO (i18n: PT, EN, ES)
 * Enviado antes do prazo expirar (ex: 2 dias, 1 semana, 15 dias).
 */
function templateObjetivoAvisoPrazo({ nome, tipoNome, descricaoObjetivo, tempoRestanteTexto, dataLimite, lang = 'pt' }) {
  const idioma = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';

  const dict = {
    pt: {
      assunto: `⏰ Lembrete: O seu objetivo "${tipoNome}" expira em breve`,
      header: 'Prazo do Objetivo Pessoal a Terminar',
      boasVindas: `Olá <strong>${nome}</strong>,`,
      introducao: `Gostaríamos de o lembrar que o prazo para concluir o seu objetivo pessoal <strong>"${tipoNome}"</strong> está a aproximar-se do fim.`,
      detalhesTitle: 'Estado do Prazo',
      labelTipo: 'Objetivo',
      labelMeta: 'Meta',
      labelTempoRestante: 'Tempo Restante',
      labelDataLimite: 'Data Limite',
      rodape: 'Aceda à plataforma e submeta as suas candidaturas a tempo de alcançar o seu objetivo!',
      botaoAcao: 'Consultar Objetivo'
    },
    en: {
      assunto: `⏰ Reminder: Your goal "${tipoNome}" expires soon`,
      header: 'Personal Goal Deadline Approaching',
      boasVindas: `Hello <strong>${nome}</strong>,`,
      introducao: `This is a reminder that the deadline to achieve your personal goal <strong>"${tipoNome}"</strong> is drawing close.`,
      detalhesTitle: 'Deadline Status',
      labelTipo: 'Goal',
      labelMeta: 'Target',
      labelTempoRestante: 'Time Remaining',
      labelDataLimite: 'Deadline',
      rodape: 'Access the platform and submit your applications in time to achieve your goal!',
      botaoAcao: 'View Goal'
    },
    es: {
      assunto: `⏰ Recordatorio: Su objetivo "${tipoNome}" vence pronto`,
      header: 'Plazo de Objetivo Personal por Terminar',
      boasVindas: `Hola <strong>${nome}</strong>,`,
      introducao: `Le recordamos que el plazo para completar su objetivo personal <strong>"${tipoNome}"</strong> está próximo a vencer.`,
      detalhesTitle: 'Estado del Plazo',
      labelTipo: 'Objetivo',
      labelMeta: 'Meta',
      labelTempoRestante: 'Tiempo Restante',
      labelDataLimite: 'Fecha Límite',
      rodape: '¡Acceda a la plataforma y envíe sus solicitudes a tiempo para alcanzar su meta!',
      botaoAcao: 'Ver Objetivo'
    }
  };

  const tr = dict[idioma];

  const text = [
    tr.boasVindas.replace(/<[^>]*>/g, ''),
    '',
    tr.introducao.replace(/<[^>]*>/g, ''),
    '',
    `${tr.detalhesTitle}:`,
    `- ${tr.labelTipo}: ${tipoNome}`,
    `- ${tr.labelMeta}: ${descricaoObjetivo}`,
    `- ${tr.labelTempoRestante}: ${tempoRestanteTexto}`,
    `- ${tr.labelDataLimite}: ${dataLimite}`,
    '',
    tr.rodape
  ].join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">${tr.header} ⏳</h2>
    
    <p style="font-size: 18px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      ${tr.boasVindas}<br/>
      ${tr.introducao}
    </p>

    <!-- CARD DETALHES -->
    <div style="background-color: #fffbeb; border: 2px solid #fbbf24; border-radius: 10px; padding: 24px; margin: 28px 0;">
      <h3 style="color: #92400e; margin-top: 0; margin-bottom: 18px; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${tr.detalhesTitle}</h3>
      
      <div style="margin-bottom: 12px;">
        <span style="font-size: 13px; text-transform: uppercase; color: #92400e; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelTipo}</span>
        <span style="font-size: 18px; color: #0f172a; font-weight: 700;">${tipoNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #fbbf24;">
        <span style="font-size: 13px; text-transform: uppercase; color: #92400e; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelMeta}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${descricaoObjetivo}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #fbbf24;">
        <span style="font-size: 13px; text-transform: uppercase; color: #92400e; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelTempoRestante}</span>
        <span style="font-size: 18px; color: #d97706; font-weight: 800;">${tempoRestanteTexto}</span>
      </div>
      <div style="padding-top: 10px; border-top: 1px dashed #fbbf24;">
        <span style="font-size: 13px; text-transform: uppercase; color: #92400e; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelDataLimite}</span>
        <span style="font-size: 16px; color: #dc2626; font-weight: 700;">${dataLimite}</span>
      </div>
    </div>

    <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin-top: 28px;">
      ${tr.rodape}
    </p>
  `;

  const html = buildBaseLayout({
    titulo: tr.assunto,
    conteudoHeader: tr.header,
    corpoHtml,
    ctaText: tr.botaoAcao,
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html, assunto: tr.assunto };
}

/**
 * 12. TEMPLATE DE OBJETIVO EXPIRADO (i18n: PT, EN, ES)
 * Enviado quando o prazo de um objetivo com prazo chega ao fim sem cumprimento.
 */
function templateObjetivoExpirado({ nome, tipoNome, descricaoObjetivo, dataLimite, lang = 'pt' }) {
  const idioma = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';

  const dict = {
    pt: {
      assunto: `⚠️ O prazo do seu objetivo "${tipoNome}" expirou`,
      header: 'Prazo de Objetivo Expirado',
      boasVindas: `Olá <strong>${nome}</strong>,`,
      introducao: `Informamos que o prazo estipulado para o seu objetivo pessoal <strong>"${tipoNome}"</strong> terminou em <strong>${dataLimite}</strong>.`,
      detalhesTitle: 'Informações do Objetivo',
      labelTipo: 'Objetivo',
      labelMeta: 'Meta Não Concluída',
      labelDataExpiracao: 'Expirou a',
      rodape: 'Não desanime! Pode definir um novo objetivo a qualquer momento e tentar novamente.',
      botaoAcao: 'Criar Novo Objetivo'
    },
    en: {
      assunto: `⚠️ Your goal "${tipoNome}" deadline has expired`,
      header: 'Goal Deadline Expired',
      boasVindas: `Hello <strong>${nome}</strong>,`,
      introducao: `We inform you that the target deadline for your personal goal <strong>"${tipoNome}"</strong> ended on <strong>${dataLimite}</strong>.`,
      detalhesTitle: 'Goal Information',
      labelTipo: 'Goal',
      labelMeta: 'Unfinished Target',
      labelDataExpiracao: 'Expired on',
      rodape: 'Don\'t be discouraged! You can create a new goal at any time and try again.',
      botaoAcao: 'Create New Goal'
    },
    es: {
      assunto: `⚠️ El plazo de su objetivo "${tipoNome}" ha expirado`,
      header: 'Plazo de Objetivo Expirado',
      boasVindas: `Hola <strong>${nome}</strong>,`,
      introducao: `Le informamos que el plazo estipulado para su objetivo personal <strong>"${tipoNome}"</strong> finalizó el <strong>${dataLimite}</strong>.`,
      detalhesTitle: 'Información del Objetivo',
      labelTipo: 'Objetivo',
      labelMeta: 'Meta No Completada',
      labelDataExpiracao: 'Expiró el',
      rodape: '¡No se desanime! Puede establecer un nuevo objetivo en cualquier momento y volver a intentarlo.',
      botaoAcao: 'Crear Nuevo Objetivo'
    }
  };

  const tr = dict[idioma];

  const text = [
    tr.boasVindas.replace(/<[^>]*>/g, ''),
    '',
    tr.introducao.replace(/<[^>]*>/g, ''),
    '',
    `${tr.detalhesTitle}:`,
    `- ${tr.labelTipo}: ${tipoNome}`,
    `- ${tr.labelMeta}: ${descricaoObjetivo}`,
    `- ${tr.labelDataExpiracao}: ${dataLimite}`,
    '',
    tr.rodape
  ].join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">${tr.header} 📋</h2>
    
    <p style="font-size: 18px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      ${tr.boasVindas}<br/>
      ${tr.introducao}
    </p>

    <!-- CARD DETALHES -->
    <div style="background-color: #fef2f2; border: 2px solid #fca5a5; border-radius: 10px; padding: 24px; margin: 28px 0;">
      <h3 style="color: #991b1b; margin-top: 0; margin-bottom: 18px; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${tr.detalhesTitle}</h3>
      
      <div style="margin-bottom: 12px;">
        <span style="font-size: 13px; text-transform: uppercase; color: #991b1b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelTipo}</span>
        <span style="font-size: 18px; color: #0f172a; font-weight: 700;">${tipoNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #fca5a5;">
        <span style="font-size: 13px; text-transform: uppercase; color: #991b1b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelMeta}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${descricaoObjetivo}</span>
      </div>
      <div style="padding-top: 10px; border-top: 1px dashed #fca5a5;">
        <span style="font-size: 13px; text-transform: uppercase; color: #991b1b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelDataExpiracao}</span>
        <span style="font-size: 16px; color: #dc2626; font-weight: 700;">${dataLimite}</span>
      </div>
    </div>

    <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin-top: 28px;">
      ${tr.rodape}
    </p>
  `;

  const html = buildBaseLayout({
    titulo: tr.assunto,
    conteudoHeader: tr.header,
    corpoHtml,
    ctaText: tr.botaoAcao,
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html, assunto: tr.assunto };
}

/**
 * 13. TEMPLATE DE ACOMPANHAMENTO PERIÓDICO DE OBJETIVO (TIPO 2 - DIVERSIDADE) (i18n: PT, EN, ES)
 * Enviado a cada 7 dias desde o início do objetivo.
 */
function templateObjetivoProgressoSemanal({ nome, tipoNome, descricaoObjetivo, diasDecorridos, progressoAtual, metaTotal, lang = 'pt' }) {
  const idioma = ['pt', 'en', 'es'].includes(lang) ? lang : 'pt';

  const dict = {
    pt: {
      assunto: `📊 Acompanhamento: Como vai o seu objetivo "${tipoNome}"?`,
      header: 'Acompanhamento Semanal do Objetivo',
      boasVindas: `Olá <strong>${nome}</strong>,`,
      introducao: `Já passaram <strong>${diasDecorridos} dias</strong> desde que iniciou o seu objetivo pessoal <strong>"${tipoNome}"</strong>.`,
      detalhesTitle: 'Progresso Atual',
      labelTipo: 'Objetivo',
      labelMeta: 'Meta',
      labelProgresso: 'Progresso',
      rodape: 'Continue focado na diversificação das suas áreas e competências na SoftBadge!',
      botaoAcao: 'Ver Meu Progresso'
    },
    en: {
      assunto: `📊 Follow-up: How is your goal "${tipoNome}" going?`,
      header: 'Weekly Goal Progress Check',
      boasVindas: `Hello <strong>${nome}</strong>,`,
      introducao: `It has been <strong>${diasDecorridos} days</strong> since you started your personal goal <strong>"${tipoNome}"</strong>.`,
      detalhesTitle: 'Current Progress',
      labelTipo: 'Goal',
      labelMeta: 'Target',
      labelProgresso: 'Progress',
      rodape: 'Stay focused on expanding your areas and skills on SoftBadge!',
      botaoAcao: 'View My Progress'
    },
    es: {
      assunto: `📊 Seguimiento: ¿Cómo va su objetivo "${tipoNome}"?`,
      header: 'Seguimiento Semanal del Objetivo',
      boasVindas: `Hola <strong>${nome}</strong>,`,
      introducao: `Han transcurrido <strong>${diasDecorridos} días</strong> desde que inició su objetivo personal <strong>"${tipoNome}"</strong>.`,
      detalhesTitle: 'Progreso Actual',
      labelTipo: 'Objetivo',
      labelMeta: 'Meta',
      labelProgresso: 'Progreso',
      rodape: '¡Mantenga el enfoque en la diversificación de sus áreas y competencias en SoftBadge!',
      botaoAcao: 'Ver Mi Progreso'
    }
  };

  const tr = dict[idioma];

  const text = [
    tr.boasVindas.replace(/<[^>]*>/g, ''),
    '',
    tr.introducao.replace(/<[^>]*>/g, ''),
    '',
    `${tr.detalhesTitle}:`,
    `- ${tr.labelTipo}: ${tipoNome}`,
    `- ${tr.labelMeta}: ${descricaoObjetivo}`,
    `- ${tr.labelProgresso}: ${progressoAtual} / ${metaTotal}`,
    '',
    tr.rodape
  ].join('\n');

  const corpoHtml = `
    <h2 style="color: #0f172a; margin-top: 0; margin-bottom: 16px; font-size: 26px; font-weight: 800;">${tr.header} 📈</h2>
    
    <p style="font-size: 18px; color: #334155; line-height: 1.6; margin-bottom: 24px;">
      ${tr.boasVindas}<br/>
      ${tr.introducao}
    </p>

    <!-- CARD DETALHES -->
    <div style="background-color: #f8fafc; border: 2px solid #cbd5e1; border-radius: 10px; padding: 24px; margin: 28px 0;">
      <h3 style="color: #334155; margin-top: 0; margin-bottom: 18px; font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">${tr.detalhesTitle}</h3>
      
      <div style="margin-bottom: 12px;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelTipo}</span>
        <span style="font-size: 18px; color: #0f172a; font-weight: 700;">${tipoNome}</span>
      </div>
      <div style="margin-bottom: 12px; padding-top: 10px; border-top: 1px dashed #cbd5e1;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelMeta}</span>
        <span style="font-size: 16px; color: #0f172a; font-weight: 600;">${descricaoObjetivo}</span>
      </div>
      <div style="padding-top: 10px; border-top: 1px dashed #cbd5e1;">
        <span style="font-size: 13px; text-transform: uppercase; color: #64748b; font-weight: 700; display: block; margin-bottom: 2px; letter-spacing: 0.5px;">${tr.labelProgresso}</span>
        <span style="font-size: 18px; color: #0284c7; font-weight: 800;">${progressoAtual} / ${metaTotal}</span>
      </div>
    </div>

    <p style="font-size: 16px; color: #64748b; line-height: 1.6; margin-top: 28px;">
      ${tr.rodape}
    </p>
  `;

  const html = buildBaseLayout({
    titulo: tr.assunto,
    conteudoHeader: tr.header,
    corpoHtml,
    ctaText: tr.botaoAcao,
    ctaUrl: LANDING_PAGE_URL
  });

  return { text, html, assunto: tr.assunto };
}

module.exports = {
  templateBoasVindas,
  templateRecuperacaoPassword,
  templateReenvioCodigo,
  templateRenovacaoCredenciais,
  templateSlaExpirado,
  templateCandidaturaCriada,
  templateBadgeExpirando,
  templateCandidaturaParaAnaliseTM,
  templateCandidaturaParaValidacaoSLL,
  templateObjetivoCumprido,
  templateObjetivoAvisoPrazo,
  templateObjetivoExpirado,
  templateObjetivoProgressoSemanal
};
