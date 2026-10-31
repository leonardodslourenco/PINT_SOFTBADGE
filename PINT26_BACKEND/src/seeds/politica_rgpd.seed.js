const PoliticaRGPD = require('../models/politica_rgpd.model');

async function seedPoliticaRGPD(transaction) {
  const defaultPolicy = {
    id_politica: 1,
    geral_pt: "Ao aceitar os Termos Gerais de RGPD, autorizo a SoftBadge.pt a proceder ao tratamento dos meus dados pessoais (nome, email, fotografia de perfil, percurso formativo e progresso na obtenção de badges) no âmbito da utilização da plataforma privada interna Web e Mobile. Os dados destinam-se exclusivamente à gestão de competências, acompanhamento pelo Talent Manager e liderança de Service Line, garantindo os direitos de acesso, retificação, oposição e esquecimento nos termos da legislação RGPD em vigor.",
    geral_en: "By accepting the General GDPR Terms, I authorize SoftBadge.pt to process my personal data (name, email, profile picture, learning path, and badge progress) within the private internal Web and Mobile platform. Data is strictly used for skills management, tracking by the Talent Manager and Service Line leadership, ensuring rights of access, rectification, opposition, and erasure under applicable GDPR legislation.",
    geral_es: "Al aceptar los Términos Generales de RGPD, autorizo a SoftBadge.pt a procesar mis datos personales (nombre, correo electrónico, foto de perfil, itinerario formativo y progreso de insignias) en el ámbito del uso de la plataforma privada interna Web y Móvil. Los datos se destinan exclusivamente a la gestión de competencias y seguimiento por parte del Talent Manager y liderazgo de Service Line, garantizando los derechos de acceso, rectificación, oposición y supresión según la legislación RGPD vigente.",
    candidatura_pt: "Ao ativar a partilha pública de uma candidatura/badge conquistado, autorizo que os dados do meu perfil profissional (nome, apelido, avatar, títulos de badges e conquistas validadas) sejam apresentados publicamente no micro-site de verificação e no diretório público da SoftBadge.pt, acessível a qualquer visitante sem necessidade de autenticação. Posso revogar esta partilha individualmente a qualquer momento através do comutador de privacidade em cada candidatura.",
    candidatura_en: "By enabling public sharing of an awarded application/badge, I authorize my professional profile data (first name, last name, avatar, badge titles, and validated achievements) to be publicly displayed on the SoftBadge.pt verification micro-site and public directory, accessible to any visitor without authentication. I can revoke this individual sharing at any time via the privacy toggle on each application.",
    candidatura_es: "Al activar la compartición pública de una solicitud/insignia obtenida, autorizo que los datos de mi perfil profesional (nombre, apellido, avatar, títulos de insignias y logros validados) se muestren públicamente en el micro-sitio de verificación y directorio público de SoftBadge.pt, accesible a cualquier visitante sin autenticación. Puedo revocar esta compartición individualmente en cualquier momento a través del interruptor de privacidad en cada solicitud."
  };

  const [instance, created] = await PoliticaRGPD.findOrCreate({
    where: { id_politica: defaultPolicy.id_politica },
    defaults: defaultPolicy,
    transaction
  });

  if (!created) {
    await instance.update({
      geral_pt: defaultPolicy.geral_pt,
      geral_en: defaultPolicy.geral_en,
      geral_es: defaultPolicy.geral_es,
      candidatura_pt: defaultPolicy.candidatura_pt,
      candidatura_en: defaultPolicy.candidatura_en,
      candidatura_es: defaultPolicy.candidatura_es
    }, { transaction });
  }

  console.log("Seed Política RGPD executado");
}

module.exports = seedPoliticaRGPD;
