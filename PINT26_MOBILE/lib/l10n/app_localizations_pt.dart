// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Portuguese (`pt`).
class AppLocalizationsPt extends AppLocalizations {
  AppLocalizationsPt([String locale = 'pt']) : super(locale);

  @override
  String get myProfile => 'O Meu Perfil';

  @override
  String get manageAccount => 'Gere a tua conta e preferências';

  @override
  String get points => 'Pontos';

  @override
  String get badges => 'Badges';

  @override
  String get viewPublicProfile => 'Ver Perfil Público';

  @override
  String get account => 'Conta';

  @override
  String get profileSettings => 'Definições de Perfil';

  @override
  String get profileSettingsDesc => 'Editar informações pessoais';

  @override
  String get notifications => 'Notificações';

  @override
  String get notificationsDesc => 'Gerir preferências de notificações';

  @override
  String get privacySecurity => 'Privacidade e Segurança';

  @override
  String get privacySecurityDesc => 'Controlar dados e permissões RGPD';

  @override
  String get preferences => 'Preferências';

  @override
  String get language => 'Idioma';

  @override
  String get languageDesc => 'Alterar idioma da aplicação';

  @override
  String get support => 'Suporte';

  @override
  String get aboutApp => 'Sobre a Aplicação';

  @override
  String get aboutAppDesc => 'Versão, termos e condições';

  @override
  String get helpFaq => 'Ajuda e FAQ';

  @override
  String get helpFaqDesc => 'Perguntas frequentes e suporte';

  @override
  String get logout => 'Terminar Sessão';

  @override
  String get myEvolution => 'Minha Evolução';

  @override
  String get loginWelcome =>
      'Bem-vindo de volta! Por favor, faça login na sua conta.';

  @override
  String actionRequired(String action) {
    return 'Ação necessária: $action';
  }

  @override
  String get emailAddress => 'Email Address';

  @override
  String get enterEmail => 'Digite o seu email';

  @override
  String get passwordLabel => 'Password';

  @override
  String get enterPassword => 'Digite a sua senha';

  @override
  String get loginButtonLog => 'Log';

  @override
  String get loginButtonIn => ' In';

  @override
  String get rememberMe => 'Lembrar-me';

  @override
  String get forgotPassword => 'Esqueceu a senha?';

  @override
  String get requiredField => 'Campo obrigatório';

  @override
  String get learningPath => 'Learning Path';

  @override
  String get serviceLine => 'Service Line';

  @override
  String get area => 'Área';

  @override
  String get configureProfileTitle => 'Configure o seu Perfil';

  @override
  String get configureProfileSubtitle =>
      'Para podermos sugerir badges e desafios alinhados com a sua carreira, siga os passos.';

  @override
  String get selectLearningPath => 'Selecione uma Learning Path';

  @override
  String get selectServiceLine => 'Selecione uma Service Line';

  @override
  String get selectArea => 'Selecione uma Área';

  @override
  String get confirmArea => 'Confirmar Área';

  @override
  String get passwordChangedLoginAgain =>
      'Password alterada com sucesso! Faça login novamente.';

  @override
  String get passwordChangedSuccess => 'Palavra-passe alterada com sucesso!';

  @override
  String get passwordChangeError =>
      'Erro ao alterar a password. Verifique os dados.';

  @override
  String get newPasswordTitle => 'Nova Palavra-passe';

  @override
  String get newPasswordSubtitle =>
      'Por motivos de segurança, é obrigatório alterar a palavra-passe gerada pelo sistema no primeiro acesso.';

  @override
  String get newPasswordLabel => 'Nova Password';

  @override
  String get min8Chars => 'Mínimo 15 caracteres';

  @override
  String get passwordMinError => 'A senha deve ter pelo menos 15 caracteres';

  @override
  String get confirmNewPasswordLabel => 'Confirmar Nova Senha';

  @override
  String get repeatNewPassword => 'Repita a sua nova senha';

  @override
  String get passwordsDontMatch => 'As senhas não coincidem';

  @override
  String get confirmChange => 'Confirmar Alteração';

  @override
  String get insertVerificationCode => 'Insira o código de verificação.';

  @override
  String get emailVerifiedLoginAgain =>
      'Email verificado com sucesso! Faça login novamente.';

  @override
  String get invalidCode => 'Código inválido. Tente novamente.';

  @override
  String get newCodeSent => 'Novo código enviado para o seu email!';

  @override
  String get errorResendingCode => 'Erro ao reenviar código.';

  @override
  String get emailVerificationTitle => 'Verificação de Email';

  @override
  String emailVerificationSubtitleEmail(String email) {
    return 'Enviámos um código de verificação para\n$email';
  }

  @override
  String get emailVerificationSubtitle =>
      'Enviámos um código de verificação para o seu email.';

  @override
  String get verifyCode => 'Verificar Código';

  @override
  String get didntReceiveCode => 'Não recebeu o código? ';

  @override
  String resendCooldown(int seconds) {
    return 'Reenviar (${seconds}s)';
  }

  @override
  String get resend => 'Reenviar';

  @override
  String get backToLogin => 'Voltar ao Login';

  @override
  String get errorLoadingTerms =>
      'Ocorreu um erro ao carregar os termos. Por favor, contacte o administrador.';

  @override
  String get errorAcceptingTerms =>
      'Ocorreu um erro ao aceitar os termos. Tente novamente.';

  @override
  String get termsAndConditions => 'Termos e Condições';

  @override
  String get rgpdSubtitle =>
      'Para continuar a usar a aplicação, por favor leia e aceite a nossa política de privacidade e proteção de dados (RGPD).';

  @override
  String get acceptTerms => 'Aceitar Termos';

  @override
  String get newMilestoneReached => 'NOVO MARCO ALCANÇADO!';

  @override
  String get congratulations => 'Parabéns!';

  @override
  String get fantastic => 'Fantástico!';

  @override
  String get navHome => 'Início';

  @override
  String get navCatalog => 'Catálogo';

  @override
  String get navBadges => 'Badges';

  @override
  String get navRequests => 'Pedidos';

  @override
  String get navProfile => 'Perfil';

  @override
  String get greetingMorning => 'Bom dia! 👋';

  @override
  String get greetingAfternoon => 'Boa tarde! 👋';

  @override
  String get greetingEvening => 'Boa noite! 👋';

  @override
  String get logoutTitle => 'Terminar Sessão';

  @override
  String get logoutConfirmation => 'Pretende terminar a sua sessão?';

  @override
  String get cancel => 'Cancelar';

  @override
  String get yes => 'Sim';

  @override
  String get welcomeBack => 'Bem-vindo novamente';

  @override
  String get premiumBadgesTitle => 'Conquistas Premium';

  @override
  String get premiumBadgesSubtitle =>
      'Badges especiais que refletem marcos\nimportantes da sua jornada';

  @override
  String get noPremiumBadges =>
      'Ainda não desbloqueaste badges Premium.\nContinua o bom trabalho!';

  @override
  String get pointsHistoryTitle => 'Histórico de Pontos';

  @override
  String get pointsHistorySubtitle => 'Evolução mensal da sua jornada';

  @override
  String get noPointsHistory =>
      'Ainda não tens histórico de pontos.\nComeça a ganhar badges!';

  @override
  String get recommendedForYou => 'Recomendados para Si';

  @override
  String get preferenceArea => '🎯 Área de Preferência';

  @override
  String get exploredArea => '🌐 Área Explorada';

  @override
  String levelNumber(String level) {
    return 'Nível $level';
  }

  @override
  String get viewAction => 'Ver';

  @override
  String get applyAction => 'Candidatar-se';

  @override
  String get professionalEvolutionTitle => 'Evolução Profissional';

  @override
  String get detailsAction => 'Detalhes';

  @override
  String get noProfessionalEvolution =>
      'A tua evolução profissional começa aqui. Ganha o teu primeiro badge para veres a timeline!';

  @override
  String get objectiveDeletedSuccess => 'Objetivo eliminado com sucesso!';

  @override
  String get myObjectives => 'Meus Objetivos';

  @override
  String get noActiveObjectives => 'Sem objetivos ativos!';

  @override
  String get defineNewObjective =>
      'Define um novo objetivo e acompanha o teu progresso.';

  @override
  String get createObjectiveAction => 'Criar Objetivo';

  @override
  String progressCurrentTarget(String current, String target) {
    return 'Progresso: $current / $target';
  }

  @override
  String get expired => 'Expirado';

  @override
  String daysRemaining(int days) {
    return 'Restam $days dias';
  }

  @override
  String get silverMedal => 'PRATA';

  @override
  String get goldMedal => 'OURO';

  @override
  String get bronzeMedal => 'BRONZE';

  @override
  String get noMoreConsultants => 'Não existem mais consultores.';

  @override
  String get generalRankingTitle => 'Ranking Geral';

  @override
  String get tryAgainAction => 'Tentar Novamente';

  @override
  String get noRankingData => 'Ainda não há dados de ranking.';

  @override
  String get newObjective => 'Novo Objetivo';

  @override
  String get noTimelineEvents =>
      'Ainda não tem marcos na sua jornada.\nExplore o catálogo!';

  @override
  String get badgesCatalogTitle => 'Catálogo de Badges';

  @override
  String get searchBadgesHint => 'Pesquisar badges...';

  @override
  String get filters => 'Filtros';

  @override
  String get lessPoints => 'Menos Pontos';

  @override
  String get morePoints => 'Mais Pontos';

  @override
  String serviceLinesCount(int count) {
    return '$count Service Lines';
  }

  @override
  String areasCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Áreas',
      one: '1 Área',
      zero: '0 Áreas',
    );
    return '$_temp0';
  }

  @override
  String levelsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Níveis',
      one: '1 Nível',
      zero: '0 Níveis',
    );
    return '$_temp0';
  }

  @override
  String get levelsGrid => 'Níveis';

  @override
  String get badgesGrid => 'Badges';

  @override
  String get earnedGrid => 'Ganhos';

  @override
  String badgesCount(int count) {
    return '$count badges';
  }

  @override
  String get noBadgesMatchFilters => 'Nenhum badge corresponde aos filtros';

  @override
  String get statusCompleted => 'Concluído';

  @override
  String get statusInProgress => 'Em Progresso';

  @override
  String get statusAvailable => 'Disponível';

  @override
  String get goBack => 'Voltar';

  @override
  String get tabInformation => 'Informação';

  @override
  String get tabCompetences => 'Competências';

  @override
  String get loadingRequirements => 'A carregar requisitos...';

  @override
  String requirementsCount(int count) {
    return 'Requisitos ($count)';
  }

  @override
  String get statusApproved => 'Aprovado';

  @override
  String get statusInValidation => 'Em Validação';

  @override
  String get statusSubmitted => 'Submetida';

  @override
  String get statusPending => 'Pendente';

  @override
  String get certifiedCompetences => 'Competências Certificadas';

  @override
  String get actionsTitle => 'Ações';

  @override
  String get backToCatalog => 'Voltar ao Catálogo';

  @override
  String get submitApplication => 'Submeter Candidatura';

  @override
  String get continueDraft => 'Continuar Rascunho';

  @override
  String get viewApplication => 'Ver Candidatura';

  @override
  String get project => 'Projeto';

  @override
  String onDate(String date) {
    return 'em $date';
  }

  @override
  String get badgeApplicationTitle => 'Candidatura ao Badge';

  @override
  String get singleLevel => 'Nível Único';

  @override
  String get achievementsTitle => 'Conquistas';

  @override
  String get tabBadges => 'Badges';

  @override
  String get tabMilestones => 'Marcos';

  @override
  String get tabSpecials => 'Especiais';

  @override
  String get noBadgesEarned => 'Ainda não tens badges conquistados.';

  @override
  String get exploreCatalogPrompt =>
      'Começa a explorar o catálogo e candidata-te aos teus primeiros Badges!';

  @override
  String get goToCatalog => 'Ir para o Catálogo';

  @override
  String get achievementSharing => 'Partilha de Conquista';

  @override
  String get publicStatus => 'Público';

  @override
  String get privateStatus => 'Privado';

  @override
  String get viewBadge => 'Ver Badge';

  @override
  String get viewCertificate => 'Ver Certificado';

  @override
  String get shareAction => 'Partilhar';

  @override
  String get linkedIn => 'LinkedIn';

  @override
  String get applicationIdNotAvailable => 'ID de candidatura não disponível.';

  @override
  String shareMessage(String title, String link) {
    return 'Vê a minha nova certificação da Softinsa: $title!\n$link';
  }

  @override
  String shareSubject(String title) {
    return 'Certificação $title';
  }

  @override
  String get shareTermsTitle => 'Termos de Partilha do Badge';

  @override
  String get shareTermsContent =>
      'Ao aceitar estes termos, autoriza a plataforma a tornar os dados desta certificação públicos. Confirma que leu e aceita os Termos RGPD?';

  @override
  String get decline => 'Recusar';

  @override
  String get accept => 'Aceitar';

  @override
  String get publicShareError =>
      'Erro ao ativar partilha pública. Tente novamente.';

  @override
  String get achieved => 'Alcançados';

  @override
  String get available => 'Disponíveis';

  @override
  String get searchAvailableMilestones => 'Pesquisar marcos disponíveis...';

  @override
  String get noMilestoneFound => 'Nenhum marco encontrado.';

  @override
  String get tryAgain => 'Tentar Novamente';

  @override
  String get noSpecialBadgeApplications =>
      'Ainda não tens candidaturas a badges especiais.';

  @override
  String get exploreSpecialBadgesPrompt =>
      'Explora os Badges Especiais no separador \'Disponíveis\' para submeteres as tuas certificações.';

  @override
  String get statusConquered => 'Conquistado';

  @override
  String get statusUnderAnalysis => 'Em Análise';

  @override
  String get statusRejected => 'Recusada';

  @override
  String get reasonPrefix => 'Motivo: ';

  @override
  String get viewProof => 'Ver Comprovativo';

  @override
  String get publicProfileSharing => 'Partilha Pública no Perfil';

  @override
  String get statusActive => 'Ativo';

  @override
  String get statusInactive => 'Inativo';

  @override
  String get noSpecialBadgeAvailable =>
      'Nenhum badge especial disponível no momento.';

  @override
  String get viewDetails => 'Ver Detalhes';

  @override
  String get applyButton => 'Candidatar-se';

  @override
  String get bonusPointsSuffix => 'pontos bónus';

  @override
  String get descriptionLabel => 'Descrição';

  @override
  String get noAdditionalDescription =>
      'Sem descrição adicional para este badge especial.';

  @override
  String get applicationRequirementsTitle => 'Requisitos para Candidatura';

  @override
  String get requirementLinkPublic =>
      'É necessário submeter um link URL comprovativo público válido.';

  @override
  String get requirementFilePdf =>
      'É necessário anexar um documento comprovativo em formato PDF.';

  @override
  String get applyForThisBadge => 'Candidatar-se a este Badge';

  @override
  String get specialBadgeApplicationTitle => 'Candidatura ao Badge Especial';

  @override
  String get publicLinkMandatory => 'Link Público (Obrigatório) *';

  @override
  String get publicLinkOptional => 'Link Público (Opcional)';

  @override
  String get exampleLink => 'https://exemplo.com/certificado';

  @override
  String get errorInsertUrl => 'Por favor insira o URL do link comprovativo.';

  @override
  String get errorLinkFormat => 'O link deve começar por http:// ou https://';

  @override
  String get pdfFileMandatory => 'Ficheiro Comprovativo PDF (Obrigatório) *';

  @override
  String get pdfFileOptional => 'Ficheiro Comprovativo PDF (Opcional)';

  @override
  String get errorFileSize => 'O ficheiro não pode exceder 5MB.';

  @override
  String get errorFileSelection => 'Erro ao selecionar ficheiro: ';

  @override
  String get selectPdfFile => 'Selecionar Ficheiro PDF (máx. 5MB)';

  @override
  String get errorPdfMandatory => 'É obrigatório anexar um comprovativo PDF.';

  @override
  String get applicationSubmittedSuccess =>
      'Candidatura submetida com sucesso para análise do Team Manager!';

  @override
  String get returnedApplicationsTitle => 'Candidaturas Retornadas';

  @override
  String get noReturnedApplications =>
      'Não há candidaturas devolvidas para alteração.';

  @override
  String get applicationRequiresCorrection => 'Candidatura Requer Correção';

  @override
  String tapToCorrectAndResubmit(Object id) {
    return 'ID: $id\nToque para corrigir e reenviar evidências.';
  }

  @override
  String get approvedValidatedEvidenceTitle =>
      'Evidências Aprovadas / Validadas';

  @override
  String get noValidatedEvidence =>
      'Não tens evidências validadas neste momento.';

  @override
  String requirementIdAndDate(Object date, Object id) {
    return 'Requisito ID: $id - Data: $date';
  }

  @override
  String get incompleteSubmissionsTitle => 'Submissões Incompletas';

  @override
  String get noIncompleteSubmissions => 'Não tens submissões incompletas.';

  @override
  String applicationId(Object id) {
    return 'Candidatura: $id';
  }

  @override
  String get tapToUploadAndSubmit =>
      'Toque para carregar ficheiros e submeter evidências.';

  @override
  String get unknownBadge => 'Insígnia Desconhecida';

  @override
  String get noArea => 'Sem Área';

  @override
  String get noDescriptionAvailable => 'Nenhuma descrição disponível.';

  @override
  String get statusDraft => 'Rascunho';

  @override
  String get statusRejectedCancelled => 'Rejeitado / Cancelado';

  @override
  String get applicationDetailsTitle => 'Detalhes da Candidatura';

  @override
  String get submissionRequirementsTitle => 'Requisitos de Submissão';

  @override
  String get noEvidenceSubmitted => 'Nenhuma evidência submetida.';

  @override
  String get evidences => 'Evidências';

  @override
  String mainRequirement(Object title) {
    return 'Requisito Principal - $title';
  }

  @override
  String get mandatory => 'Obrigatório';

  @override
  String practicalCompetenceDemo(Object title) {
    return 'Demonstração de competência prática em $title';
  }

  @override
  String get evidencePresentedForProof =>
      'Evidência apresentada para comprovação deste requisito.';

  @override
  String get changeButton => 'Alterar';

  @override
  String currentState(Object status) {
    return '* Estado Atual: $status';
  }

  @override
  String get closeButton => 'Fechar';

  @override
  String get accountTitle => 'Conta';

  @override
  String get profileSettingsTitle => 'Definições de Perfil';

  @override
  String get profileSettingsSubtitle => 'Editar informações pessoais';

  @override
  String get notificationsTitle => 'Notificações';

  @override
  String get notificationsSubtitle => 'Gerir preferências de notificações';

  @override
  String get privacySecurityTitle => 'Privacidade e Segurança';

  @override
  String get privacySecuritySubtitle => 'Controlar dados e permissões RGPD';

  @override
  String get preferencesTitle => 'Preferências';

  @override
  String get languageTitle => 'Idioma';

  @override
  String get languageSubtitle => 'Alterar idioma da aplicação';

  @override
  String get supportTitle => 'Suporte';

  @override
  String get helpFaqTitle => 'Ajuda e FAQ';

  @override
  String get helpFaqSubtitle => 'Perguntas frequentes';

  @override
  String get aboutTitle => 'Sobre';

  @override
  String get aboutSubtitle => 'Versão 1.0.0';

  @override
  String get logoutButton => 'Terminar Sessão';

  @override
  String get platformVersion => 'Softinsa Badge Platform v1.0.0';

  @override
  String get pointsLabel => 'Pontos';

  @override
  String get badgesLabel => 'Badges';

  @override
  String get personalInformationTitle => 'Informação Pessoal';

  @override
  String get nameField => 'Nome';

  @override
  String get surnameField => 'Sobrenome';

  @override
  String get emailField => 'Email';

  @override
  String get profileUpdatedSuccess =>
      'Perfil sincronizado e guardado com sucesso!';

  @override
  String get profileUpdateError => 'Erro ao atualizar o perfil.';

  @override
  String get saveChangesButton => 'Guardar Alterações';

  @override
  String get notificationChannelsTitle => 'Canais de Notificação';

  @override
  String get pushNotificationsTitle => 'Notificações Push';

  @override
  String get pushNotificationsSubtitle =>
      'Receber alertas em tempo real no dispositivo';

  @override
  String get emailAlertsTitle => 'Alertas por Email';

  @override
  String get emailAlertsSubtitle => 'Receber resumos periódicos de atividade';

  @override
  String get syncAlertsTitle => 'Avisos de Sincronização';

  @override
  String get syncAlertsSubtitle =>
      'Notificar quando houver atualizações na base de dados';

  @override
  String get accountSecurityTitle => 'Segurança da Conta';

  @override
  String get changePasswordTitle => 'Alterar Palavra-passe';

  @override
  String get changePasswordSubtitle =>
      'Atualizar credenciais de acesso ao sistema';

  @override
  String get gdprComplianceTitle => 'Conformidade RGPD e Dados';

  @override
  String get downloadMyDataTitle => 'Descarregar os meus dados';

  @override
  String get downloadMyDataSubtitle =>
      'Obter uma cópia de segurança local e em nuvem';

  @override
  String get deleteAccountTitle => 'Eliminar Conta';

  @override
  String get deleteAccountSubtitle =>
      'Apagar permanentemente os dados da aplicação';

  @override
  String get currentPasswordLabel => 'Password Atual';

  @override
  String get cancelButton => 'Cancelar';

  @override
  String get confirmButton => 'Confirmar';

  @override
  String passwordChangeErrorWithArg(Object error) {
    return 'Erro ao alterar palavra-passe: $error';
  }

  @override
  String get faqHeaderTitle => 'Perguntas Frequentes';

  @override
  String get faqHeaderSubtitle =>
      'Encontra respostas rápidas às dúvidas mais comuns.';

  @override
  String get frequentQuestionsTitle => 'Dúvidas Frequentes';

  @override
  String get stillHaveQuestionsTitle => 'Ainda com dúvidas?';

  @override
  String get contactSupportTitle => 'Contactar Suporte';

  @override
  String get aboutAppTitle => 'Sobre a Aplicação';

  @override
  String get aboutAppDescription =>
      'A Softinsa Badges Platform é uma aplicação móvel desenvolvida para reconhecer e valorizar as competências dos colaboradores da Softinsa.\n\nAtravés de um sistema de badges e pontos, os colaboradores podem acompanhar o seu crescimento profissional e celebrar as suas conquistas.';

  @override
  String get technicalInfoTitle => 'Informações Técnicas';

  @override
  String get versionLabel => 'Versão';

  @override
  String get buildLabel => 'Build';

  @override
  String get platformLabel => 'Plataforma';

  @override
  String get frameworkLabel => 'Framework';

  @override
  String get developedByTitle => 'Desenvolvido por';

  @override
  String get developmentTeam => 'Equipa de Desenvolvimento';

  @override
  String get legalTitle => 'Legal';

  @override
  String get termsOfService => 'Termos de Serviço';

  @override
  String get privacyPolicy => 'Política de Privacidade';

  @override
  String get softwareLicenses => 'Licenças de Software';

  @override
  String get copyrightNotice =>
      '© 2026 Softinsa · Todos os direitos reservados';

  @override
  String get errorLoading => 'Erro ao carregar';

  @override
  String totalProducts(Object count) {
    return 'Total de produtos: $count';
  }

  @override
  String get myPath => 'O Meu Percurso';

  @override
  String get completedLabel => 'Completas';

  @override
  String get inProgressLabel => 'Em Progresso';

  @override
  String get notStartedLabel => 'Não Iniciadas';

  @override
  String get completedSubtext => 'concluído';

  @override
  String get loadingLearningPaths => 'A carregar Learning Paths...';

  @override
  String get searchFilters => 'Filtros de Pesquisa';

  @override
  String get allGender => 'Todas';

  @override
  String get allPlural => 'Todos';

  @override
  String get areaLabel => 'Área';

  @override
  String get levelLabel => 'Nível';

  @override
  String get statusLabel => 'Estados';

  @override
  String get tryAgainButton => 'Tentar Novamente';

  @override
  String get submissionRequirements => 'Requisitos de Submissão';

  @override
  String get noRequirementsConfigured =>
      'Nenhum requisito configurado para este badge.';

  @override
  String get applicationInstructions => 'Instruções de Candidatura';

  @override
  String get applicationInstructionsDesc =>
      'Anexe os comprovativos necessários em cada requisito. Ficheiros permitidos: PDF (máx. 5MB), ZIP, RAR ou 7Z (máx. 15MB).';

  @override
  String get requirementFallback => 'Requisito';

  @override
  String get mandatoryLabel => 'Obrigatório';

  @override
  String get optionalLabel => 'Opcional';

  @override
  String get attachedFileFallback => 'Ficheiro anexado';

  @override
  String get attachFileLabel => 'Anexar Ficheiro (PDF, ZIP, RAR, 7Z)';

  @override
  String get submittingLabel => 'A submeter...';

  @override
  String get submitApplicationButton => 'Submeter Candidatura';

  @override
  String get savingLabel => 'A gravar...';

  @override
  String get saveDraftButton => 'Guardar Rascunho';

  @override
  String errorLoadRequirements(Object error) {
    return 'Erro ao carregar os requisitos do badge: $error';
  }

  @override
  String fileSizeExceeded(Object extension, Object mb) {
    return 'Ficheiro excede o limite de ${mb}MB para .$extension';
  }

  @override
  String get mustAttachMandatory =>
      'Deve anexar ficheiros de evidência em todos os requisitos obrigatórios.';

  @override
  String get attachAtLeastOne =>
      'Anexe pelo menos um ficheiro para gravar o rascunho.';

  @override
  String get errorCreateApplication =>
      'Não foi possível criar o registo da candidatura.';

  @override
  String get draftSavedSuccess => 'Rascunho gravado com sucesso!';

  @override
  String get applicationStatusTitle => 'Estado das Candidaturas';

  @override
  String get refreshRequests => 'Atualizar Pedidos';

  @override
  String get renewalsManagement => 'Gestão de Renovações';

  @override
  String get noApplicationsPullToRefresh =>
      'Não existem candidaturas registadas.\nPuxe para baixo para atualizar.';

  @override
  String get noTitle => 'Sem título';

  @override
  String get noObjectiveTypesAvailable =>
      'Não há tipos de objetivos disponíveis de momento.';

  @override
  String get objectiveType => 'Tipo de Objetivo *';

  @override
  String get select => 'Selecione...';

  @override
  String get qtyBadges => 'Qtd de Badges (3 a 5)';

  @override
  String get qtyPoints => 'Qtd de Pontos (100 a 2000)';

  @override
  String get diversityType => 'Tipo de Diversidade';

  @override
  String get qtyDiversity => 'Qtd de Diversidade';

  @override
  String get deadline => 'Prazo';

  @override
  String get unit => 'Unidade';

  @override
  String get days => 'Dias';

  @override
  String get weeks => 'Semanas';

  @override
  String get months => 'Meses';

  @override
  String get objectiveCreatedSuccess => 'Objetivo criado com sucesso!';

  @override
  String get errorCreatingObjective =>
      'Erro ao criar objetivo. Verifique os valores.';

  @override
  String get alertsTitle => 'Avisos';

  @override
  String get markAllAsReadTooltip => 'Marcar todas como lidas';

  @override
  String get refresh => 'Atualizar';

  @override
  String get filterAll => 'Todas';

  @override
  String get filterUnread => 'Não Lidas';

  @override
  String get filterRead => 'Lidas';

  @override
  String get errorLoadingAlerts => 'Não foi possível carregar os avisos.';

  @override
  String get noAlertsFound => 'Nenhum aviso encontrado.';

  @override
  String get pullToRefresh => 'Puxe para baixo para atualizar';

  @override
  String get systemAlert => 'Aviso do Sistema';

  @override
  String get general => 'Geral';

  @override
  String get readAction => 'Ler';

  @override
  String get fromPrefix => 'De: ';

  @override
  String get noAdditionalContent => 'Sem conteúdo adicional.';

  @override
  String get markAllAsReadTitle => 'Marcar todas como lidas?';

  @override
  String get markAllAsReadMessage =>
      'Deseja marcar todas as notificações como lidas?';

  @override
  String get allMarkedAsReadSuccess =>
      'Todas as notificações foram marcadas como lidas.';

  @override
  String get yesConfirm => 'Sim, confirmar';

  @override
  String get now => 'Agora';

  @override
  String get minsAgo => 'min atrás';

  @override
  String get hoursAgo => 'h atrás';

  @override
  String get yesterdayAt => 'Ontem às ';

  @override
  String get renewalRequestSubmittedSuccess =>
      'Pedido de renovação submetido com sucesso.';

  @override
  String get eligible => 'Elegíveis';

  @override
  String get myApplicationsTab => 'Minhas Candidaturas';

  @override
  String get noBadgesToRenew =>
      'Nenhum badge a expirar ou elegível para renovação.';

  @override
  String get renewalPointsPrefix => 'Pontos Renovação: +';

  @override
  String expiresInDays(Object days) {
    return 'Expira em $days dias';
  }

  @override
  String get pendingModeration => 'Pendente de Moderação';

  @override
  String get requestRenewalTitle => 'Solicitar Renovação?';

  @override
  String get requestRenewalMessage =>
      'Tem a certeza que deseja submeter este pedido de renovação?';

  @override
  String get confirm => 'Confirmar';

  @override
  String get renew => 'Renovar';

  @override
  String get noRenewalRequestsSubmitted =>
      'Nenhum pedido de renovação submetido.';

  @override
  String get previewShare => 'Pré-visualizar Partilha';

  @override
  String get howYourPostWillLook => 'Como ficará o teu post:';

  @override
  String get yourName => 'O Teu Nome';

  @override
  String get softinsaTalent => 'Talento Softinsa';

  @override
  String get shareOnLinkedIn => 'Partilhar no LinkedIn';

  @override
  String get shareNow => 'Partilhar Agora';

  @override
  String documentRotatedDegrees(Object degrees) {
    return 'Documento rodado $degrees°';
  }

  @override
  String errorSharingCertificate(Object error) {
    return 'Erro ao partilhar o certificado: $error';
  }

  @override
  String get certificateSavedSuccess => 'Certificado guardado com sucesso!';

  @override
  String errorDownloadingCertificate(Object error) {
    return 'Erro ao descarregar certificado: $error';
  }

  @override
  String get certificateTitle => 'Certificado';

  @override
  String get errorLoadingCertificate =>
      'Ocorreu um erro ao gerar o certificado.';

  @override
  String get loadingCertificate => 'A carregar o teu certificado...';

  @override
  String get noSubmissionsYet => 'Ainda não fez nenhuma submissão.';

  @override
  String achievedBadge(Object badgeName) {
    return 'Alcançaste o badge $badgeName';
  }

  @override
  String plusPoints(Object points) {
    return '+$points Pontos';
  }

  @override
  String get continueEvolving => 'Continuar a Evoluir';

  @override
  String get goodMorning => 'Bom dia!';

  @override
  String get technicalJourney => 'Jornada Técnica';

  @override
  String get weekProgress => 'Progresso da Semana';

  @override
  String errorGeneral(Object error) {
    return 'Erro: $error';
  }

  @override
  String get dashboardBadges => 'Badges';

  @override
  String get dashboardAccumulatedPoints => 'Pontos\nAcumulados';

  @override
  String get dashboardPointsUnit => 'pts';

  @override
  String get dashboardApplications => 'Candidaturas';

  @override
  String get dashboardRanking => 'Ranking';

  @override
  String get dashboardVsPreviousMonth => 'vs. mês anterior';

  @override
  String get sliderNewBadge => 'Novo Badge!';

  @override
  String get sliderBadgeExpiring => 'Badge a Expirar';

  @override
  String get timelineBadgeConquered => 'Badge Conquistado';

  @override
  String get timelineSpecialConquest => 'Conquista Especial';

  @override
  String get timelineActionApprovedSll => 'Candidatura Aprovada';

  @override
  String get timelineActionApproved => 'Candidatura Aprovada';

  @override
  String get statusNotStarted => 'Não Iniciada';

  @override
  String get statusNotStartedPlural => 'Não Iniciadas';

  @override
  String get statusNotStartedPluralM => 'Não Iniciados';

  @override
  String timelineEarnedPoints(int points) {
    return 'Ganhaste $points pontos';
  }

  @override
  String progressAreas(int current, int total) {
    return '$current/$total áreas';
  }

  @override
  String progressLevels(int current, int total) {
    return '$current/$total níveis';
  }

  @override
  String progressBadges(int current, int total) {
    return '$current/$total badges completos';
  }

  @override
  String get sliderMilestoneTitle => 'Marco Alcançado!';

  @override
  String sliderMilestoneDesc(String title) {
    return 'Parabéns! Alcançaste o marco \"$title\".';
  }

  @override
  String get sliderMilestoneAction => 'Ver Conquista 🎉';

  @override
  String sliderNewBadgeDesc(String title) {
    return 'Conquistaste o badge \"$title\". Continua o excelente trabalho!';
  }

  @override
  String get sliderNewBadgeAction => 'Ver Detalhes ->';

  @override
  String get sliderObjectiveTitle => 'Lembrete de Objetivo';

  @override
  String sliderObjectiveDesc(int qtd, String tipo) {
    return 'Tens um objetivo ativo: alcançar $qtd $tipo.';
  }

  @override
  String get sliderObjectiveAction => 'Ver Objetivo ->';

  @override
  String get sliderSlaUrgent => 'SLA Ultrapassado / Urgente';

  @override
  String sliderBadgeExpiringDesc(String title, int days) {
    return 'O badge \"$title\" expira em $days dias.';
  }

  @override
  String get sliderBadgeExpiringAction => 'Renovar Certificação ->';

  @override
  String get sliderFallbackTitle => 'A tua jornada começa aqui!';

  @override
  String get sliderFallbackDesc =>
      'Explora o catálogo, candidata-te a Badges e conquista os teus primeiros marcos!';
}
