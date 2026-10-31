import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:intl/intl.dart' as intl;

import 'app_localizations_en.dart';
import 'app_localizations_es.dart';
import 'app_localizations_pt.dart';

// ignore_for_file: type=lint

/// Callers can lookup localized strings with an instance of AppLocalizations
/// returned by `AppLocalizations.of(context)`.
///
/// Applications need to include `AppLocalizations.delegate()` in their app's
/// `localizationDelegates` list, and the locales they support in the app's
/// `supportedLocales` list. For example:
///
/// ```dart
/// import 'l10n/app_localizations.dart';
///
/// return MaterialApp(
///   localizationsDelegates: AppLocalizations.localizationsDelegates,
///   supportedLocales: AppLocalizations.supportedLocales,
///   home: MyApplicationHome(),
/// );
/// ```
///
/// ## Update pubspec.yaml
///
/// Please make sure to update your pubspec.yaml to include the following
/// packages:
///
/// ```yaml
/// dependencies:
///   # Internationalization support.
///   flutter_localizations:
///     sdk: flutter
///   intl: any # Use the pinned version from flutter_localizations
///
///   # Rest of dependencies
/// ```
///
/// ## iOS Applications
///
/// iOS applications define key application metadata, including supported
/// locales, in an Info.plist file that is built into the application bundle.
/// To configure the locales supported by your app, you’ll need to edit this
/// file.
///
/// First, open your project’s ios/Runner.xcworkspace Xcode workspace file.
/// Then, in the Project Navigator, open the Info.plist file under the Runner
/// project’s Runner folder.
///
/// Next, select the Information Property List item, select Add Item from the
/// Editor menu, then select Localizations from the pop-up menu.
///
/// Select and expand the newly-created Localizations item then, for each
/// locale your application supports, add a new item and select the locale
/// you wish to add from the pop-up menu in the Value field. This list should
/// be consistent with the languages listed in the AppLocalizations.supportedLocales
/// property.
abstract class AppLocalizations {
  AppLocalizations(String locale)
      : localeName = intl.Intl.canonicalizedLocale(locale.toString());

  final String localeName;

  static AppLocalizations? of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations);
  }

  static const LocalizationsDelegate<AppLocalizations> delegate =
      _AppLocalizationsDelegate();

  /// A list of this localizations delegate along with the default localizations
  /// delegates.
  ///
  /// Returns a list of localizations delegates containing this delegate along with
  /// GlobalMaterialLocalizations.delegate, GlobalCupertinoLocalizations.delegate,
  /// and GlobalWidgetsLocalizations.delegate.
  ///
  /// Additional delegates can be added by appending to this list in
  /// MaterialApp. This list does not have to be used at all if a custom list
  /// of delegates is preferred or required.
  static const List<LocalizationsDelegate<dynamic>> localizationsDelegates =
      <LocalizationsDelegate<dynamic>>[
    delegate,
    GlobalMaterialLocalizations.delegate,
    GlobalCupertinoLocalizations.delegate,
    GlobalWidgetsLocalizations.delegate,
  ];

  /// A list of this localizations delegate's supported locales.
  static const List<Locale> supportedLocales = <Locale>[
    Locale('en'),
    Locale('es'),
    Locale('pt')
  ];

  /// Título da página de perfil
  ///
  /// In pt, this message translates to:
  /// **'O Meu Perfil'**
  String get myProfile;

  /// No description provided for @manageAccount.
  ///
  /// In pt, this message translates to:
  /// **'Gere a tua conta e preferências'**
  String get manageAccount;

  /// No description provided for @points.
  ///
  /// In pt, this message translates to:
  /// **'Pontos'**
  String get points;

  /// No description provided for @badges.
  ///
  /// In pt, this message translates to:
  /// **'Badges'**
  String get badges;

  /// No description provided for @viewPublicProfile.
  ///
  /// In pt, this message translates to:
  /// **'Ver Perfil Público'**
  String get viewPublicProfile;

  /// No description provided for @account.
  ///
  /// In pt, this message translates to:
  /// **'Conta'**
  String get account;

  /// No description provided for @profileSettings.
  ///
  /// In pt, this message translates to:
  /// **'Definições de Perfil'**
  String get profileSettings;

  /// No description provided for @profileSettingsDesc.
  ///
  /// In pt, this message translates to:
  /// **'Editar informações pessoais'**
  String get profileSettingsDesc;

  /// No description provided for @notifications.
  ///
  /// In pt, this message translates to:
  /// **'Notificações'**
  String get notifications;

  /// No description provided for @notificationsDesc.
  ///
  /// In pt, this message translates to:
  /// **'Gerir preferências de notificações'**
  String get notificationsDesc;

  /// No description provided for @privacySecurity.
  ///
  /// In pt, this message translates to:
  /// **'Privacidade e Segurança'**
  String get privacySecurity;

  /// No description provided for @privacySecurityDesc.
  ///
  /// In pt, this message translates to:
  /// **'Controlar dados e permissões RGPD'**
  String get privacySecurityDesc;

  /// No description provided for @preferences.
  ///
  /// In pt, this message translates to:
  /// **'Preferências'**
  String get preferences;

  /// No description provided for @language.
  ///
  /// In pt, this message translates to:
  /// **'Idioma'**
  String get language;

  /// No description provided for @languageDesc.
  ///
  /// In pt, this message translates to:
  /// **'Alterar idioma da aplicação'**
  String get languageDesc;

  /// No description provided for @support.
  ///
  /// In pt, this message translates to:
  /// **'Suporte'**
  String get support;

  /// No description provided for @aboutApp.
  ///
  /// In pt, this message translates to:
  /// **'Sobre a Aplicação'**
  String get aboutApp;

  /// No description provided for @aboutAppDesc.
  ///
  /// In pt, this message translates to:
  /// **'Versão, termos e condições'**
  String get aboutAppDesc;

  /// No description provided for @helpFaq.
  ///
  /// In pt, this message translates to:
  /// **'Ajuda e FAQ'**
  String get helpFaq;

  /// No description provided for @helpFaqDesc.
  ///
  /// In pt, this message translates to:
  /// **'Perguntas frequentes e suporte'**
  String get helpFaqDesc;

  /// No description provided for @logout.
  ///
  /// In pt, this message translates to:
  /// **'Terminar Sessão'**
  String get logout;

  /// No description provided for @myEvolution.
  ///
  /// In pt, this message translates to:
  /// **'Minha Evolução'**
  String get myEvolution;

  /// No description provided for @loginWelcome.
  ///
  /// In pt, this message translates to:
  /// **'Bem-vindo de volta! Por favor, faça login na sua conta.'**
  String get loginWelcome;

  /// No description provided for @actionRequired.
  ///
  /// In pt, this message translates to:
  /// **'Ação necessária: {action}'**
  String actionRequired(String action);

  /// No description provided for @emailAddress.
  ///
  /// In pt, this message translates to:
  /// **'Email Address'**
  String get emailAddress;

  /// No description provided for @enterEmail.
  ///
  /// In pt, this message translates to:
  /// **'Digite o seu email'**
  String get enterEmail;

  /// No description provided for @passwordLabel.
  ///
  /// In pt, this message translates to:
  /// **'Password'**
  String get passwordLabel;

  /// No description provided for @enterPassword.
  ///
  /// In pt, this message translates to:
  /// **'Digite a sua senha'**
  String get enterPassword;

  /// No description provided for @loginButtonLog.
  ///
  /// In pt, this message translates to:
  /// **'Log'**
  String get loginButtonLog;

  /// No description provided for @loginButtonIn.
  ///
  /// In pt, this message translates to:
  /// **' In'**
  String get loginButtonIn;

  /// No description provided for @rememberMe.
  ///
  /// In pt, this message translates to:
  /// **'Lembrar-me'**
  String get rememberMe;

  /// No description provided for @forgotPassword.
  ///
  /// In pt, this message translates to:
  /// **'Esqueceu a senha?'**
  String get forgotPassword;

  /// No description provided for @requiredField.
  ///
  /// In pt, this message translates to:
  /// **'Campo obrigatório'**
  String get requiredField;

  /// No description provided for @learningPath.
  ///
  /// In pt, this message translates to:
  /// **'Learning Path'**
  String get learningPath;

  /// No description provided for @serviceLine.
  ///
  /// In pt, this message translates to:
  /// **'Service Line'**
  String get serviceLine;

  /// No description provided for @area.
  ///
  /// In pt, this message translates to:
  /// **'Área'**
  String get area;

  /// No description provided for @configureProfileTitle.
  ///
  /// In pt, this message translates to:
  /// **'Configure o seu Perfil'**
  String get configureProfileTitle;

  /// No description provided for @configureProfileSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Para podermos sugerir badges e desafios alinhados com a sua carreira, siga os passos.'**
  String get configureProfileSubtitle;

  /// No description provided for @selectLearningPath.
  ///
  /// In pt, this message translates to:
  /// **'Selecione uma Learning Path'**
  String get selectLearningPath;

  /// No description provided for @selectServiceLine.
  ///
  /// In pt, this message translates to:
  /// **'Selecione uma Service Line'**
  String get selectServiceLine;

  /// No description provided for @selectArea.
  ///
  /// In pt, this message translates to:
  /// **'Selecione uma Área'**
  String get selectArea;

  /// No description provided for @confirmArea.
  ///
  /// In pt, this message translates to:
  /// **'Confirmar Área'**
  String get confirmArea;

  /// No description provided for @passwordChangedLoginAgain.
  ///
  /// In pt, this message translates to:
  /// **'Password alterada com sucesso! Faça login novamente.'**
  String get passwordChangedLoginAgain;

  /// No description provided for @passwordChangedSuccess.
  ///
  /// In pt, this message translates to:
  /// **'Palavra-passe alterada com sucesso!'**
  String get passwordChangedSuccess;

  /// No description provided for @passwordChangeError.
  ///
  /// In pt, this message translates to:
  /// **'Erro ao alterar a password. Verifique os dados.'**
  String get passwordChangeError;

  /// No description provided for @newPasswordTitle.
  ///
  /// In pt, this message translates to:
  /// **'Nova Palavra-passe'**
  String get newPasswordTitle;

  /// No description provided for @newPasswordSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Por motivos de segurança, é obrigatório alterar a palavra-passe gerada pelo sistema no primeiro acesso.'**
  String get newPasswordSubtitle;

  /// No description provided for @newPasswordLabel.
  ///
  /// In pt, this message translates to:
  /// **'Nova Password'**
  String get newPasswordLabel;

  /// No description provided for @min8Chars.
  ///
  /// In pt, this message translates to:
  /// **'Mínimo 15 caracteres'**
  String get min8Chars;

  /// No description provided for @passwordMinError.
  ///
  /// In pt, this message translates to:
  /// **'A senha deve ter pelo menos 15 caracteres'**
  String get passwordMinError;

  /// No description provided for @confirmNewPasswordLabel.
  ///
  /// In pt, this message translates to:
  /// **'Confirmar Nova Senha'**
  String get confirmNewPasswordLabel;

  /// No description provided for @repeatNewPassword.
  ///
  /// In pt, this message translates to:
  /// **'Repita a sua nova senha'**
  String get repeatNewPassword;

  /// No description provided for @passwordsDontMatch.
  ///
  /// In pt, this message translates to:
  /// **'As senhas não coincidem'**
  String get passwordsDontMatch;

  /// No description provided for @confirmChange.
  ///
  /// In pt, this message translates to:
  /// **'Confirmar Alteração'**
  String get confirmChange;

  /// No description provided for @insertVerificationCode.
  ///
  /// In pt, this message translates to:
  /// **'Insira o código de verificação.'**
  String get insertVerificationCode;

  /// No description provided for @emailVerifiedLoginAgain.
  ///
  /// In pt, this message translates to:
  /// **'Email verificado com sucesso! Faça login novamente.'**
  String get emailVerifiedLoginAgain;

  /// No description provided for @invalidCode.
  ///
  /// In pt, this message translates to:
  /// **'Código inválido. Tente novamente.'**
  String get invalidCode;

  /// No description provided for @newCodeSent.
  ///
  /// In pt, this message translates to:
  /// **'Novo código enviado para o seu email!'**
  String get newCodeSent;

  /// No description provided for @errorResendingCode.
  ///
  /// In pt, this message translates to:
  /// **'Erro ao reenviar código.'**
  String get errorResendingCode;

  /// No description provided for @emailVerificationTitle.
  ///
  /// In pt, this message translates to:
  /// **'Verificação de Email'**
  String get emailVerificationTitle;

  /// No description provided for @emailVerificationSubtitleEmail.
  ///
  /// In pt, this message translates to:
  /// **'Enviámos um código de verificação para\n{email}'**
  String emailVerificationSubtitleEmail(String email);

  /// No description provided for @emailVerificationSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Enviámos um código de verificação para o seu email.'**
  String get emailVerificationSubtitle;

  /// No description provided for @verifyCode.
  ///
  /// In pt, this message translates to:
  /// **'Verificar Código'**
  String get verifyCode;

  /// No description provided for @didntReceiveCode.
  ///
  /// In pt, this message translates to:
  /// **'Não recebeu o código? '**
  String get didntReceiveCode;

  /// No description provided for @resendCooldown.
  ///
  /// In pt, this message translates to:
  /// **'Reenviar ({seconds}s)'**
  String resendCooldown(int seconds);

  /// No description provided for @resend.
  ///
  /// In pt, this message translates to:
  /// **'Reenviar'**
  String get resend;

  /// No description provided for @backToLogin.
  ///
  /// In pt, this message translates to:
  /// **'Voltar ao Login'**
  String get backToLogin;

  /// No description provided for @errorLoadingTerms.
  ///
  /// In pt, this message translates to:
  /// **'Ocorreu um erro ao carregar os termos. Por favor, contacte o administrador.'**
  String get errorLoadingTerms;

  /// No description provided for @errorAcceptingTerms.
  ///
  /// In pt, this message translates to:
  /// **'Ocorreu um erro ao aceitar os termos. Tente novamente.'**
  String get errorAcceptingTerms;

  /// No description provided for @termsAndConditions.
  ///
  /// In pt, this message translates to:
  /// **'Termos e Condições'**
  String get termsAndConditions;

  /// No description provided for @rgpdSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Para continuar a usar a aplicação, por favor leia e aceite a nossa política de privacidade e proteção de dados (RGPD).'**
  String get rgpdSubtitle;

  /// No description provided for @acceptTerms.
  ///
  /// In pt, this message translates to:
  /// **'Aceitar Termos'**
  String get acceptTerms;

  /// No description provided for @newMilestoneReached.
  ///
  /// In pt, this message translates to:
  /// **'NOVO MARCO ALCANÇADO!'**
  String get newMilestoneReached;

  /// No description provided for @congratulations.
  ///
  /// In pt, this message translates to:
  /// **'Parabéns!'**
  String get congratulations;

  /// No description provided for @fantastic.
  ///
  /// In pt, this message translates to:
  /// **'Fantástico!'**
  String get fantastic;

  /// No description provided for @navHome.
  ///
  /// In pt, this message translates to:
  /// **'Início'**
  String get navHome;

  /// No description provided for @navCatalog.
  ///
  /// In pt, this message translates to:
  /// **'Catálogo'**
  String get navCatalog;

  /// No description provided for @navBadges.
  ///
  /// In pt, this message translates to:
  /// **'Badges'**
  String get navBadges;

  /// No description provided for @navRequests.
  ///
  /// In pt, this message translates to:
  /// **'Pedidos'**
  String get navRequests;

  /// No description provided for @navProfile.
  ///
  /// In pt, this message translates to:
  /// **'Perfil'**
  String get navProfile;

  /// No description provided for @greetingMorning.
  ///
  /// In pt, this message translates to:
  /// **'Bom dia! 👋'**
  String get greetingMorning;

  /// No description provided for @greetingAfternoon.
  ///
  /// In pt, this message translates to:
  /// **'Boa tarde! 👋'**
  String get greetingAfternoon;

  /// No description provided for @greetingEvening.
  ///
  /// In pt, this message translates to:
  /// **'Boa noite! 👋'**
  String get greetingEvening;

  /// No description provided for @logoutTitle.
  ///
  /// In pt, this message translates to:
  /// **'Terminar Sessão'**
  String get logoutTitle;

  /// No description provided for @logoutConfirmation.
  ///
  /// In pt, this message translates to:
  /// **'Pretende terminar a sua sessão?'**
  String get logoutConfirmation;

  /// No description provided for @cancel.
  ///
  /// In pt, this message translates to:
  /// **'Cancelar'**
  String get cancel;

  /// No description provided for @yes.
  ///
  /// In pt, this message translates to:
  /// **'Sim'**
  String get yes;

  /// No description provided for @welcomeBack.
  ///
  /// In pt, this message translates to:
  /// **'Bem-vindo novamente'**
  String get welcomeBack;

  /// No description provided for @premiumBadgesTitle.
  ///
  /// In pt, this message translates to:
  /// **'Conquistas Premium'**
  String get premiumBadgesTitle;

  /// No description provided for @premiumBadgesSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Badges especiais que refletem marcos\nimportantes da sua jornada'**
  String get premiumBadgesSubtitle;

  /// No description provided for @noPremiumBadges.
  ///
  /// In pt, this message translates to:
  /// **'Ainda não desbloqueaste badges Premium.\nContinua o bom trabalho!'**
  String get noPremiumBadges;

  /// No description provided for @pointsHistoryTitle.
  ///
  /// In pt, this message translates to:
  /// **'Histórico de Pontos'**
  String get pointsHistoryTitle;

  /// No description provided for @pointsHistorySubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Evolução mensal da sua jornada'**
  String get pointsHistorySubtitle;

  /// No description provided for @noPointsHistory.
  ///
  /// In pt, this message translates to:
  /// **'Ainda não tens histórico de pontos.\nComeça a ganhar badges!'**
  String get noPointsHistory;

  /// No description provided for @recommendedForYou.
  ///
  /// In pt, this message translates to:
  /// **'Recomendados para Si'**
  String get recommendedForYou;

  /// No description provided for @preferenceArea.
  ///
  /// In pt, this message translates to:
  /// **'🎯 Área de Preferência'**
  String get preferenceArea;

  /// No description provided for @exploredArea.
  ///
  /// In pt, this message translates to:
  /// **'🌐 Área Explorada'**
  String get exploredArea;

  /// No description provided for @levelNumber.
  ///
  /// In pt, this message translates to:
  /// **'Nível {level}'**
  String levelNumber(String level);

  /// No description provided for @viewAction.
  ///
  /// In pt, this message translates to:
  /// **'Ver'**
  String get viewAction;

  /// No description provided for @applyAction.
  ///
  /// In pt, this message translates to:
  /// **'Candidatar-se'**
  String get applyAction;

  /// No description provided for @professionalEvolutionTitle.
  ///
  /// In pt, this message translates to:
  /// **'Evolução Profissional'**
  String get professionalEvolutionTitle;

  /// No description provided for @detailsAction.
  ///
  /// In pt, this message translates to:
  /// **'Detalhes'**
  String get detailsAction;

  /// No description provided for @noProfessionalEvolution.
  ///
  /// In pt, this message translates to:
  /// **'A tua evolução profissional começa aqui. Ganha o teu primeiro badge para veres a timeline!'**
  String get noProfessionalEvolution;

  /// No description provided for @objectiveDeletedSuccess.
  ///
  /// In pt, this message translates to:
  /// **'Objetivo eliminado com sucesso!'**
  String get objectiveDeletedSuccess;

  /// No description provided for @myObjectives.
  ///
  /// In pt, this message translates to:
  /// **'Meus Objetivos'**
  String get myObjectives;

  /// No description provided for @noActiveObjectives.
  ///
  /// In pt, this message translates to:
  /// **'Sem objetivos ativos!'**
  String get noActiveObjectives;

  /// No description provided for @defineNewObjective.
  ///
  /// In pt, this message translates to:
  /// **'Define um novo objetivo e acompanha o teu progresso.'**
  String get defineNewObjective;

  /// No description provided for @createObjectiveAction.
  ///
  /// In pt, this message translates to:
  /// **'Criar Objetivo'**
  String get createObjectiveAction;

  /// No description provided for @progressCurrentTarget.
  ///
  /// In pt, this message translates to:
  /// **'Progresso: {current} / {target}'**
  String progressCurrentTarget(String current, String target);

  /// No description provided for @expired.
  ///
  /// In pt, this message translates to:
  /// **'Expirado'**
  String get expired;

  /// No description provided for @daysRemaining.
  ///
  /// In pt, this message translates to:
  /// **'Restam {days} dias'**
  String daysRemaining(int days);

  /// No description provided for @silverMedal.
  ///
  /// In pt, this message translates to:
  /// **'PRATA'**
  String get silverMedal;

  /// No description provided for @goldMedal.
  ///
  /// In pt, this message translates to:
  /// **'OURO'**
  String get goldMedal;

  /// No description provided for @bronzeMedal.
  ///
  /// In pt, this message translates to:
  /// **'BRONZE'**
  String get bronzeMedal;

  /// No description provided for @noMoreConsultants.
  ///
  /// In pt, this message translates to:
  /// **'Não existem mais consultores.'**
  String get noMoreConsultants;

  /// No description provided for @generalRankingTitle.
  ///
  /// In pt, this message translates to:
  /// **'Ranking Geral'**
  String get generalRankingTitle;

  /// No description provided for @tryAgainAction.
  ///
  /// In pt, this message translates to:
  /// **'Tentar Novamente'**
  String get tryAgainAction;

  /// No description provided for @noRankingData.
  ///
  /// In pt, this message translates to:
  /// **'Ainda não há dados de ranking.'**
  String get noRankingData;

  /// No description provided for @newObjective.
  ///
  /// In pt, this message translates to:
  /// **'Novo Objetivo'**
  String get newObjective;

  /// No description provided for @noTimelineEvents.
  ///
  /// In pt, this message translates to:
  /// **'Ainda não tem marcos na sua jornada.\nExplore o catálogo!'**
  String get noTimelineEvents;

  /// No description provided for @badgesCatalogTitle.
  ///
  /// In pt, this message translates to:
  /// **'Catálogo de Badges'**
  String get badgesCatalogTitle;

  /// No description provided for @searchBadgesHint.
  ///
  /// In pt, this message translates to:
  /// **'Pesquisar badges...'**
  String get searchBadgesHint;

  /// No description provided for @filters.
  ///
  /// In pt, this message translates to:
  /// **'Filtros'**
  String get filters;

  /// No description provided for @lessPoints.
  ///
  /// In pt, this message translates to:
  /// **'Menos Pontos'**
  String get lessPoints;

  /// No description provided for @morePoints.
  ///
  /// In pt, this message translates to:
  /// **'Mais Pontos'**
  String get morePoints;

  /// No description provided for @serviceLinesCount.
  ///
  /// In pt, this message translates to:
  /// **'{count} Service Lines'**
  String serviceLinesCount(int count);

  /// No description provided for @areasCount.
  ///
  /// In pt, this message translates to:
  /// **'{count, plural, =0{0 Áreas} =1{1 Área} other{{count} Áreas}}'**
  String areasCount(int count);

  /// No description provided for @levelsCount.
  ///
  /// In pt, this message translates to:
  /// **'{count, plural, =0{0 Níveis} =1{1 Nível} other{{count} Níveis}}'**
  String levelsCount(int count);

  /// No description provided for @levelsGrid.
  ///
  /// In pt, this message translates to:
  /// **'Níveis'**
  String get levelsGrid;

  /// No description provided for @badgesGrid.
  ///
  /// In pt, this message translates to:
  /// **'Badges'**
  String get badgesGrid;

  /// No description provided for @earnedGrid.
  ///
  /// In pt, this message translates to:
  /// **'Ganhos'**
  String get earnedGrid;

  /// No description provided for @badgesCount.
  ///
  /// In pt, this message translates to:
  /// **'{count} badges'**
  String badgesCount(int count);

  /// No description provided for @noBadgesMatchFilters.
  ///
  /// In pt, this message translates to:
  /// **'Nenhum badge corresponde aos filtros'**
  String get noBadgesMatchFilters;

  /// No description provided for @statusCompleted.
  ///
  /// In pt, this message translates to:
  /// **'Concluído'**
  String get statusCompleted;

  /// No description provided for @statusInProgress.
  ///
  /// In pt, this message translates to:
  /// **'Em Progresso'**
  String get statusInProgress;

  /// No description provided for @statusAvailable.
  ///
  /// In pt, this message translates to:
  /// **'Disponível'**
  String get statusAvailable;

  /// No description provided for @goBack.
  ///
  /// In pt, this message translates to:
  /// **'Voltar'**
  String get goBack;

  /// No description provided for @tabInformation.
  ///
  /// In pt, this message translates to:
  /// **'Informação'**
  String get tabInformation;

  /// No description provided for @tabCompetences.
  ///
  /// In pt, this message translates to:
  /// **'Competências'**
  String get tabCompetences;

  /// No description provided for @loadingRequirements.
  ///
  /// In pt, this message translates to:
  /// **'A carregar requisitos...'**
  String get loadingRequirements;

  /// No description provided for @requirementsCount.
  ///
  /// In pt, this message translates to:
  /// **'Requisitos ({count})'**
  String requirementsCount(int count);

  /// No description provided for @statusApproved.
  ///
  /// In pt, this message translates to:
  /// **'Aprovado'**
  String get statusApproved;

  /// No description provided for @statusInValidation.
  ///
  /// In pt, this message translates to:
  /// **'Em Validação'**
  String get statusInValidation;

  /// No description provided for @statusSubmitted.
  ///
  /// In pt, this message translates to:
  /// **'Submetida'**
  String get statusSubmitted;

  /// No description provided for @statusPending.
  ///
  /// In pt, this message translates to:
  /// **'Pendente'**
  String get statusPending;

  /// No description provided for @certifiedCompetences.
  ///
  /// In pt, this message translates to:
  /// **'Competências Certificadas'**
  String get certifiedCompetences;

  /// No description provided for @actionsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Ações'**
  String get actionsTitle;

  /// No description provided for @backToCatalog.
  ///
  /// In pt, this message translates to:
  /// **'Voltar ao Catálogo'**
  String get backToCatalog;

  /// No description provided for @submitApplication.
  ///
  /// In pt, this message translates to:
  /// **'Submeter Candidatura'**
  String get submitApplication;

  /// No description provided for @continueDraft.
  ///
  /// In pt, this message translates to:
  /// **'Continuar Rascunho'**
  String get continueDraft;

  /// No description provided for @viewApplication.
  ///
  /// In pt, this message translates to:
  /// **'Ver Candidatura'**
  String get viewApplication;

  /// No description provided for @project.
  ///
  /// In pt, this message translates to:
  /// **'Projeto'**
  String get project;

  /// No description provided for @onDate.
  ///
  /// In pt, this message translates to:
  /// **'em {date}'**
  String onDate(String date);

  /// No description provided for @badgeApplicationTitle.
  ///
  /// In pt, this message translates to:
  /// **'Candidatura ao Badge'**
  String get badgeApplicationTitle;

  /// No description provided for @singleLevel.
  ///
  /// In pt, this message translates to:
  /// **'Nível Único'**
  String get singleLevel;

  /// No description provided for @achievementsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Conquistas'**
  String get achievementsTitle;

  /// No description provided for @tabBadges.
  ///
  /// In pt, this message translates to:
  /// **'Badges'**
  String get tabBadges;

  /// No description provided for @tabMilestones.
  ///
  /// In pt, this message translates to:
  /// **'Marcos'**
  String get tabMilestones;

  /// No description provided for @tabSpecials.
  ///
  /// In pt, this message translates to:
  /// **'Especiais'**
  String get tabSpecials;

  /// No description provided for @noBadgesEarned.
  ///
  /// In pt, this message translates to:
  /// **'Ainda não tens badges conquistados.'**
  String get noBadgesEarned;

  /// No description provided for @exploreCatalogPrompt.
  ///
  /// In pt, this message translates to:
  /// **'Começa a explorar o catálogo e candidata-te aos teus primeiros Badges!'**
  String get exploreCatalogPrompt;

  /// No description provided for @goToCatalog.
  ///
  /// In pt, this message translates to:
  /// **'Ir para o Catálogo'**
  String get goToCatalog;

  /// No description provided for @achievementSharing.
  ///
  /// In pt, this message translates to:
  /// **'Partilha de Conquista'**
  String get achievementSharing;

  /// No description provided for @publicStatus.
  ///
  /// In pt, this message translates to:
  /// **'Público'**
  String get publicStatus;

  /// No description provided for @privateStatus.
  ///
  /// In pt, this message translates to:
  /// **'Privado'**
  String get privateStatus;

  /// No description provided for @viewBadge.
  ///
  /// In pt, this message translates to:
  /// **'Ver Badge'**
  String get viewBadge;

  /// No description provided for @viewCertificate.
  ///
  /// In pt, this message translates to:
  /// **'Ver Certificado'**
  String get viewCertificate;

  /// No description provided for @shareAction.
  ///
  /// In pt, this message translates to:
  /// **'Partilhar'**
  String get shareAction;

  /// No description provided for @linkedIn.
  ///
  /// In pt, this message translates to:
  /// **'LinkedIn'**
  String get linkedIn;

  /// No description provided for @applicationIdNotAvailable.
  ///
  /// In pt, this message translates to:
  /// **'ID de candidatura não disponível.'**
  String get applicationIdNotAvailable;

  /// No description provided for @shareMessage.
  ///
  /// In pt, this message translates to:
  /// **'Vê a minha nova certificação da Softinsa: {title}!\n{link}'**
  String shareMessage(String title, String link);

  /// No description provided for @shareSubject.
  ///
  /// In pt, this message translates to:
  /// **'Certificação {title}'**
  String shareSubject(String title);

  /// No description provided for @shareTermsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Termos de Partilha do Badge'**
  String get shareTermsTitle;

  /// No description provided for @shareTermsContent.
  ///
  /// In pt, this message translates to:
  /// **'Ao aceitar estes termos, autoriza a plataforma a tornar os dados desta certificação públicos. Confirma que leu e aceita os Termos RGPD?'**
  String get shareTermsContent;

  /// No description provided for @decline.
  ///
  /// In pt, this message translates to:
  /// **'Recusar'**
  String get decline;

  /// No description provided for @accept.
  ///
  /// In pt, this message translates to:
  /// **'Aceitar'**
  String get accept;

  /// No description provided for @publicShareError.
  ///
  /// In pt, this message translates to:
  /// **'Erro ao ativar partilha pública. Tente novamente.'**
  String get publicShareError;

  /// No description provided for @achieved.
  ///
  /// In pt, this message translates to:
  /// **'Alcançados'**
  String get achieved;

  /// No description provided for @available.
  ///
  /// In pt, this message translates to:
  /// **'Disponíveis'**
  String get available;

  /// No description provided for @searchAvailableMilestones.
  ///
  /// In pt, this message translates to:
  /// **'Pesquisar marcos disponíveis...'**
  String get searchAvailableMilestones;

  /// No description provided for @noMilestoneFound.
  ///
  /// In pt, this message translates to:
  /// **'Nenhum marco encontrado.'**
  String get noMilestoneFound;

  /// No description provided for @tryAgain.
  ///
  /// In pt, this message translates to:
  /// **'Tentar Novamente'**
  String get tryAgain;

  /// No description provided for @noSpecialBadgeApplications.
  ///
  /// In pt, this message translates to:
  /// **'Ainda não tens candidaturas a badges especiais.'**
  String get noSpecialBadgeApplications;

  /// No description provided for @exploreSpecialBadgesPrompt.
  ///
  /// In pt, this message translates to:
  /// **'Explora os Badges Especiais no separador \'Disponíveis\' para submeteres as tuas certificações.'**
  String get exploreSpecialBadgesPrompt;

  /// No description provided for @statusConquered.
  ///
  /// In pt, this message translates to:
  /// **'Conquistado'**
  String get statusConquered;

  /// No description provided for @statusUnderAnalysis.
  ///
  /// In pt, this message translates to:
  /// **'Em Análise'**
  String get statusUnderAnalysis;

  /// No description provided for @statusRejected.
  ///
  /// In pt, this message translates to:
  /// **'Recusada'**
  String get statusRejected;

  /// No description provided for @reasonPrefix.
  ///
  /// In pt, this message translates to:
  /// **'Motivo: '**
  String get reasonPrefix;

  /// No description provided for @viewProof.
  ///
  /// In pt, this message translates to:
  /// **'Ver Comprovativo'**
  String get viewProof;

  /// No description provided for @publicProfileSharing.
  ///
  /// In pt, this message translates to:
  /// **'Partilha Pública no Perfil'**
  String get publicProfileSharing;

  /// No description provided for @statusActive.
  ///
  /// In pt, this message translates to:
  /// **'Ativo'**
  String get statusActive;

  /// No description provided for @statusInactive.
  ///
  /// In pt, this message translates to:
  /// **'Inativo'**
  String get statusInactive;

  /// No description provided for @noSpecialBadgeAvailable.
  ///
  /// In pt, this message translates to:
  /// **'Nenhum badge especial disponível no momento.'**
  String get noSpecialBadgeAvailable;

  /// No description provided for @viewDetails.
  ///
  /// In pt, this message translates to:
  /// **'Ver Detalhes'**
  String get viewDetails;

  /// No description provided for @applyButton.
  ///
  /// In pt, this message translates to:
  /// **'Candidatar-se'**
  String get applyButton;

  /// No description provided for @bonusPointsSuffix.
  ///
  /// In pt, this message translates to:
  /// **'pontos bónus'**
  String get bonusPointsSuffix;

  /// No description provided for @descriptionLabel.
  ///
  /// In pt, this message translates to:
  /// **'Descrição'**
  String get descriptionLabel;

  /// No description provided for @noAdditionalDescription.
  ///
  /// In pt, this message translates to:
  /// **'Sem descrição adicional para este badge especial.'**
  String get noAdditionalDescription;

  /// No description provided for @applicationRequirementsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Requisitos para Candidatura'**
  String get applicationRequirementsTitle;

  /// No description provided for @requirementLinkPublic.
  ///
  /// In pt, this message translates to:
  /// **'É necessário submeter um link URL comprovativo público válido.'**
  String get requirementLinkPublic;

  /// No description provided for @requirementFilePdf.
  ///
  /// In pt, this message translates to:
  /// **'É necessário anexar um documento comprovativo em formato PDF.'**
  String get requirementFilePdf;

  /// No description provided for @applyForThisBadge.
  ///
  /// In pt, this message translates to:
  /// **'Candidatar-se a este Badge'**
  String get applyForThisBadge;

  /// No description provided for @specialBadgeApplicationTitle.
  ///
  /// In pt, this message translates to:
  /// **'Candidatura ao Badge Especial'**
  String get specialBadgeApplicationTitle;

  /// No description provided for @publicLinkMandatory.
  ///
  /// In pt, this message translates to:
  /// **'Link Público (Obrigatório) *'**
  String get publicLinkMandatory;

  /// No description provided for @publicLinkOptional.
  ///
  /// In pt, this message translates to:
  /// **'Link Público (Opcional)'**
  String get publicLinkOptional;

  /// No description provided for @exampleLink.
  ///
  /// In pt, this message translates to:
  /// **'https://exemplo.com/certificado'**
  String get exampleLink;

  /// No description provided for @errorInsertUrl.
  ///
  /// In pt, this message translates to:
  /// **'Por favor insira o URL do link comprovativo.'**
  String get errorInsertUrl;

  /// No description provided for @errorLinkFormat.
  ///
  /// In pt, this message translates to:
  /// **'O link deve começar por http:// ou https://'**
  String get errorLinkFormat;

  /// No description provided for @pdfFileMandatory.
  ///
  /// In pt, this message translates to:
  /// **'Ficheiro Comprovativo PDF (Obrigatório) *'**
  String get pdfFileMandatory;

  /// No description provided for @pdfFileOptional.
  ///
  /// In pt, this message translates to:
  /// **'Ficheiro Comprovativo PDF (Opcional)'**
  String get pdfFileOptional;

  /// No description provided for @errorFileSize.
  ///
  /// In pt, this message translates to:
  /// **'O ficheiro não pode exceder 5MB.'**
  String get errorFileSize;

  /// No description provided for @errorFileSelection.
  ///
  /// In pt, this message translates to:
  /// **'Erro ao selecionar ficheiro: '**
  String get errorFileSelection;

  /// No description provided for @selectPdfFile.
  ///
  /// In pt, this message translates to:
  /// **'Selecionar Ficheiro PDF (máx. 5MB)'**
  String get selectPdfFile;

  /// No description provided for @errorPdfMandatory.
  ///
  /// In pt, this message translates to:
  /// **'É obrigatório anexar um comprovativo PDF.'**
  String get errorPdfMandatory;

  /// No description provided for @applicationSubmittedSuccess.
  ///
  /// In pt, this message translates to:
  /// **'Candidatura submetida com sucesso para análise do Team Manager!'**
  String get applicationSubmittedSuccess;

  /// No description provided for @returnedApplicationsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Candidaturas Retornadas'**
  String get returnedApplicationsTitle;

  /// No description provided for @noReturnedApplications.
  ///
  /// In pt, this message translates to:
  /// **'Não há candidaturas devolvidas para alteração.'**
  String get noReturnedApplications;

  /// No description provided for @applicationRequiresCorrection.
  ///
  /// In pt, this message translates to:
  /// **'Candidatura Requer Correção'**
  String get applicationRequiresCorrection;

  /// No description provided for @tapToCorrectAndResubmit.
  ///
  /// In pt, this message translates to:
  /// **'ID: {id}\nToque para corrigir e reenviar evidências.'**
  String tapToCorrectAndResubmit(Object id);

  /// No description provided for @approvedValidatedEvidenceTitle.
  ///
  /// In pt, this message translates to:
  /// **'Evidências Aprovadas / Validadas'**
  String get approvedValidatedEvidenceTitle;

  /// No description provided for @noValidatedEvidence.
  ///
  /// In pt, this message translates to:
  /// **'Não tens evidências validadas neste momento.'**
  String get noValidatedEvidence;

  /// No description provided for @requirementIdAndDate.
  ///
  /// In pt, this message translates to:
  /// **'Requisito ID: {id} - Data: {date}'**
  String requirementIdAndDate(Object date, Object id);

  /// No description provided for @incompleteSubmissionsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Submissões Incompletas'**
  String get incompleteSubmissionsTitle;

  /// No description provided for @noIncompleteSubmissions.
  ///
  /// In pt, this message translates to:
  /// **'Não tens submissões incompletas.'**
  String get noIncompleteSubmissions;

  /// No description provided for @applicationId.
  ///
  /// In pt, this message translates to:
  /// **'Candidatura: {id}'**
  String applicationId(Object id);

  /// No description provided for @tapToUploadAndSubmit.
  ///
  /// In pt, this message translates to:
  /// **'Toque para carregar ficheiros e submeter evidências.'**
  String get tapToUploadAndSubmit;

  /// No description provided for @unknownBadge.
  ///
  /// In pt, this message translates to:
  /// **'Insígnia Desconhecida'**
  String get unknownBadge;

  /// No description provided for @noArea.
  ///
  /// In pt, this message translates to:
  /// **'Sem Área'**
  String get noArea;

  /// No description provided for @noDescriptionAvailable.
  ///
  /// In pt, this message translates to:
  /// **'Nenhuma descrição disponível.'**
  String get noDescriptionAvailable;

  /// No description provided for @statusDraft.
  ///
  /// In pt, this message translates to:
  /// **'Rascunho'**
  String get statusDraft;

  /// No description provided for @statusRejectedCancelled.
  ///
  /// In pt, this message translates to:
  /// **'Rejeitado / Cancelado'**
  String get statusRejectedCancelled;

  /// No description provided for @applicationDetailsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Detalhes da Candidatura'**
  String get applicationDetailsTitle;

  /// No description provided for @submissionRequirementsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Requisitos de Submissão'**
  String get submissionRequirementsTitle;

  /// No description provided for @noEvidenceSubmitted.
  ///
  /// In pt, this message translates to:
  /// **'Nenhuma evidência submetida.'**
  String get noEvidenceSubmitted;

  /// No description provided for @evidences.
  ///
  /// In pt, this message translates to:
  /// **'Evidências'**
  String get evidences;

  /// No description provided for @mainRequirement.
  ///
  /// In pt, this message translates to:
  /// **'Requisito Principal - {title}'**
  String mainRequirement(Object title);

  /// No description provided for @mandatory.
  ///
  /// In pt, this message translates to:
  /// **'Obrigatório'**
  String get mandatory;

  /// No description provided for @practicalCompetenceDemo.
  ///
  /// In pt, this message translates to:
  /// **'Demonstração de competência prática em {title}'**
  String practicalCompetenceDemo(Object title);

  /// No description provided for @evidencePresentedForProof.
  ///
  /// In pt, this message translates to:
  /// **'Evidência apresentada para comprovação deste requisito.'**
  String get evidencePresentedForProof;

  /// No description provided for @changeButton.
  ///
  /// In pt, this message translates to:
  /// **'Alterar'**
  String get changeButton;

  /// No description provided for @currentState.
  ///
  /// In pt, this message translates to:
  /// **'* Estado Atual: {status}'**
  String currentState(Object status);

  /// No description provided for @closeButton.
  ///
  /// In pt, this message translates to:
  /// **'Fechar'**
  String get closeButton;

  /// No description provided for @accountTitle.
  ///
  /// In pt, this message translates to:
  /// **'Conta'**
  String get accountTitle;

  /// No description provided for @profileSettingsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Definições de Perfil'**
  String get profileSettingsTitle;

  /// No description provided for @profileSettingsSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Editar informações pessoais'**
  String get profileSettingsSubtitle;

  /// No description provided for @notificationsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Notificações'**
  String get notificationsTitle;

  /// No description provided for @notificationsSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Gerir preferências de notificações'**
  String get notificationsSubtitle;

  /// No description provided for @privacySecurityTitle.
  ///
  /// In pt, this message translates to:
  /// **'Privacidade e Segurança'**
  String get privacySecurityTitle;

  /// No description provided for @privacySecuritySubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Controlar dados e permissões RGPD'**
  String get privacySecuritySubtitle;

  /// No description provided for @preferencesTitle.
  ///
  /// In pt, this message translates to:
  /// **'Preferências'**
  String get preferencesTitle;

  /// No description provided for @languageTitle.
  ///
  /// In pt, this message translates to:
  /// **'Idioma'**
  String get languageTitle;

  /// No description provided for @languageSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Alterar idioma da aplicação'**
  String get languageSubtitle;

  /// No description provided for @supportTitle.
  ///
  /// In pt, this message translates to:
  /// **'Suporte'**
  String get supportTitle;

  /// No description provided for @helpFaqTitle.
  ///
  /// In pt, this message translates to:
  /// **'Ajuda e FAQ'**
  String get helpFaqTitle;

  /// No description provided for @helpFaqSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Perguntas frequentes'**
  String get helpFaqSubtitle;

  /// No description provided for @aboutTitle.
  ///
  /// In pt, this message translates to:
  /// **'Sobre'**
  String get aboutTitle;

  /// No description provided for @aboutSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Versão 1.0.0'**
  String get aboutSubtitle;

  /// No description provided for @logoutButton.
  ///
  /// In pt, this message translates to:
  /// **'Terminar Sessão'**
  String get logoutButton;

  /// No description provided for @platformVersion.
  ///
  /// In pt, this message translates to:
  /// **'Softinsa Badge Platform v1.0.0'**
  String get platformVersion;

  /// No description provided for @pointsLabel.
  ///
  /// In pt, this message translates to:
  /// **'Pontos'**
  String get pointsLabel;

  /// No description provided for @badgesLabel.
  ///
  /// In pt, this message translates to:
  /// **'Badges'**
  String get badgesLabel;

  /// No description provided for @personalInformationTitle.
  ///
  /// In pt, this message translates to:
  /// **'Informação Pessoal'**
  String get personalInformationTitle;

  /// No description provided for @nameField.
  ///
  /// In pt, this message translates to:
  /// **'Nome'**
  String get nameField;

  /// No description provided for @surnameField.
  ///
  /// In pt, this message translates to:
  /// **'Sobrenome'**
  String get surnameField;

  /// No description provided for @emailField.
  ///
  /// In pt, this message translates to:
  /// **'Email'**
  String get emailField;

  /// No description provided for @profileUpdatedSuccess.
  ///
  /// In pt, this message translates to:
  /// **'Perfil sincronizado e guardado com sucesso!'**
  String get profileUpdatedSuccess;

  /// No description provided for @profileUpdateError.
  ///
  /// In pt, this message translates to:
  /// **'Erro ao atualizar o perfil.'**
  String get profileUpdateError;

  /// No description provided for @saveChangesButton.
  ///
  /// In pt, this message translates to:
  /// **'Guardar Alterações'**
  String get saveChangesButton;

  /// No description provided for @notificationChannelsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Canais de Notificação'**
  String get notificationChannelsTitle;

  /// No description provided for @pushNotificationsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Notificações Push'**
  String get pushNotificationsTitle;

  /// No description provided for @pushNotificationsSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Receber alertas em tempo real no dispositivo'**
  String get pushNotificationsSubtitle;

  /// No description provided for @emailAlertsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Alertas por Email'**
  String get emailAlertsTitle;

  /// No description provided for @emailAlertsSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Receber resumos periódicos de atividade'**
  String get emailAlertsSubtitle;

  /// No description provided for @syncAlertsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Avisos de Sincronização'**
  String get syncAlertsTitle;

  /// No description provided for @syncAlertsSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Notificar quando houver atualizações na base de dados'**
  String get syncAlertsSubtitle;

  /// No description provided for @accountSecurityTitle.
  ///
  /// In pt, this message translates to:
  /// **'Segurança da Conta'**
  String get accountSecurityTitle;

  /// No description provided for @changePasswordTitle.
  ///
  /// In pt, this message translates to:
  /// **'Alterar Palavra-passe'**
  String get changePasswordTitle;

  /// No description provided for @changePasswordSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Atualizar credenciais de acesso ao sistema'**
  String get changePasswordSubtitle;

  /// No description provided for @gdprComplianceTitle.
  ///
  /// In pt, this message translates to:
  /// **'Conformidade RGPD e Dados'**
  String get gdprComplianceTitle;

  /// No description provided for @downloadMyDataTitle.
  ///
  /// In pt, this message translates to:
  /// **'Descarregar os meus dados'**
  String get downloadMyDataTitle;

  /// No description provided for @downloadMyDataSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Obter uma cópia de segurança local e em nuvem'**
  String get downloadMyDataSubtitle;

  /// No description provided for @deleteAccountTitle.
  ///
  /// In pt, this message translates to:
  /// **'Eliminar Conta'**
  String get deleteAccountTitle;

  /// No description provided for @deleteAccountSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Apagar permanentemente os dados da aplicação'**
  String get deleteAccountSubtitle;

  /// No description provided for @currentPasswordLabel.
  ///
  /// In pt, this message translates to:
  /// **'Password Atual'**
  String get currentPasswordLabel;

  /// No description provided for @cancelButton.
  ///
  /// In pt, this message translates to:
  /// **'Cancelar'**
  String get cancelButton;

  /// No description provided for @confirmButton.
  ///
  /// In pt, this message translates to:
  /// **'Confirmar'**
  String get confirmButton;

  /// No description provided for @passwordChangeErrorWithArg.
  ///
  /// In pt, this message translates to:
  /// **'Erro ao alterar palavra-passe: {error}'**
  String passwordChangeErrorWithArg(Object error);

  /// No description provided for @faqHeaderTitle.
  ///
  /// In pt, this message translates to:
  /// **'Perguntas Frequentes'**
  String get faqHeaderTitle;

  /// No description provided for @faqHeaderSubtitle.
  ///
  /// In pt, this message translates to:
  /// **'Encontra respostas rápidas às dúvidas mais comuns.'**
  String get faqHeaderSubtitle;

  /// No description provided for @frequentQuestionsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Dúvidas Frequentes'**
  String get frequentQuestionsTitle;

  /// No description provided for @stillHaveQuestionsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Ainda com dúvidas?'**
  String get stillHaveQuestionsTitle;

  /// No description provided for @contactSupportTitle.
  ///
  /// In pt, this message translates to:
  /// **'Contactar Suporte'**
  String get contactSupportTitle;

  /// No description provided for @aboutAppTitle.
  ///
  /// In pt, this message translates to:
  /// **'Sobre a Aplicação'**
  String get aboutAppTitle;

  /// No description provided for @aboutAppDescription.
  ///
  /// In pt, this message translates to:
  /// **'A Softinsa Badges Platform é uma aplicação móvel desenvolvida para reconhecer e valorizar as competências dos colaboradores da Softinsa.\n\nAtravés de um sistema de badges e pontos, os colaboradores podem acompanhar o seu crescimento profissional e celebrar as suas conquistas.'**
  String get aboutAppDescription;

  /// No description provided for @technicalInfoTitle.
  ///
  /// In pt, this message translates to:
  /// **'Informações Técnicas'**
  String get technicalInfoTitle;

  /// No description provided for @versionLabel.
  ///
  /// In pt, this message translates to:
  /// **'Versão'**
  String get versionLabel;

  /// No description provided for @buildLabel.
  ///
  /// In pt, this message translates to:
  /// **'Build'**
  String get buildLabel;

  /// No description provided for @platformLabel.
  ///
  /// In pt, this message translates to:
  /// **'Plataforma'**
  String get platformLabel;

  /// No description provided for @frameworkLabel.
  ///
  /// In pt, this message translates to:
  /// **'Framework'**
  String get frameworkLabel;

  /// No description provided for @developedByTitle.
  ///
  /// In pt, this message translates to:
  /// **'Desenvolvido por'**
  String get developedByTitle;

  /// No description provided for @developmentTeam.
  ///
  /// In pt, this message translates to:
  /// **'Equipa de Desenvolvimento'**
  String get developmentTeam;

  /// No description provided for @legalTitle.
  ///
  /// In pt, this message translates to:
  /// **'Legal'**
  String get legalTitle;

  /// No description provided for @termsOfService.
  ///
  /// In pt, this message translates to:
  /// **'Termos de Serviço'**
  String get termsOfService;

  /// No description provided for @privacyPolicy.
  ///
  /// In pt, this message translates to:
  /// **'Política de Privacidade'**
  String get privacyPolicy;

  /// No description provided for @softwareLicenses.
  ///
  /// In pt, this message translates to:
  /// **'Licenças de Software'**
  String get softwareLicenses;

  /// No description provided for @copyrightNotice.
  ///
  /// In pt, this message translates to:
  /// **'© 2026 Softinsa · Todos os direitos reservados'**
  String get copyrightNotice;

  /// No description provided for @errorLoading.
  ///
  /// In pt, this message translates to:
  /// **'Erro ao carregar'**
  String get errorLoading;

  /// No description provided for @totalProducts.
  ///
  /// In pt, this message translates to:
  /// **'Total de produtos: {count}'**
  String totalProducts(Object count);

  /// No description provided for @myPath.
  ///
  /// In pt, this message translates to:
  /// **'O Meu Percurso'**
  String get myPath;

  /// No description provided for @completedLabel.
  ///
  /// In pt, this message translates to:
  /// **'Completas'**
  String get completedLabel;

  /// No description provided for @inProgressLabel.
  ///
  /// In pt, this message translates to:
  /// **'Em Progresso'**
  String get inProgressLabel;

  /// No description provided for @notStartedLabel.
  ///
  /// In pt, this message translates to:
  /// **'Não Iniciadas'**
  String get notStartedLabel;

  /// No description provided for @completedSubtext.
  ///
  /// In pt, this message translates to:
  /// **'concluído'**
  String get completedSubtext;

  /// No description provided for @loadingLearningPaths.
  ///
  /// In pt, this message translates to:
  /// **'A carregar Learning Paths...'**
  String get loadingLearningPaths;

  /// No description provided for @searchFilters.
  ///
  /// In pt, this message translates to:
  /// **'Filtros de Pesquisa'**
  String get searchFilters;

  /// No description provided for @allGender.
  ///
  /// In pt, this message translates to:
  /// **'Todas'**
  String get allGender;

  /// No description provided for @allPlural.
  ///
  /// In pt, this message translates to:
  /// **'Todos'**
  String get allPlural;

  /// No description provided for @areaLabel.
  ///
  /// In pt, this message translates to:
  /// **'Área'**
  String get areaLabel;

  /// No description provided for @levelLabel.
  ///
  /// In pt, this message translates to:
  /// **'Nível'**
  String get levelLabel;

  /// No description provided for @statusLabel.
  ///
  /// In pt, this message translates to:
  /// **'Estados'**
  String get statusLabel;

  /// No description provided for @tryAgainButton.
  ///
  /// In pt, this message translates to:
  /// **'Tentar Novamente'**
  String get tryAgainButton;

  /// No description provided for @submissionRequirements.
  ///
  /// In pt, this message translates to:
  /// **'Requisitos de Submissão'**
  String get submissionRequirements;

  /// No description provided for @noRequirementsConfigured.
  ///
  /// In pt, this message translates to:
  /// **'Nenhum requisito configurado para este badge.'**
  String get noRequirementsConfigured;

  /// No description provided for @applicationInstructions.
  ///
  /// In pt, this message translates to:
  /// **'Instruções de Candidatura'**
  String get applicationInstructions;

  /// No description provided for @applicationInstructionsDesc.
  ///
  /// In pt, this message translates to:
  /// **'Anexe os comprovativos necessários em cada requisito. Ficheiros permitidos: PDF (máx. 5MB), ZIP, RAR ou 7Z (máx. 15MB).'**
  String get applicationInstructionsDesc;

  /// No description provided for @requirementFallback.
  ///
  /// In pt, this message translates to:
  /// **'Requisito'**
  String get requirementFallback;

  /// No description provided for @mandatoryLabel.
  ///
  /// In pt, this message translates to:
  /// **'Obrigatório'**
  String get mandatoryLabel;

  /// No description provided for @optionalLabel.
  ///
  /// In pt, this message translates to:
  /// **'Opcional'**
  String get optionalLabel;

  /// No description provided for @attachedFileFallback.
  ///
  /// In pt, this message translates to:
  /// **'Ficheiro anexado'**
  String get attachedFileFallback;

  /// No description provided for @attachFileLabel.
  ///
  /// In pt, this message translates to:
  /// **'Anexar Ficheiro (PDF, ZIP, RAR, 7Z)'**
  String get attachFileLabel;

  /// No description provided for @submittingLabel.
  ///
  /// In pt, this message translates to:
  /// **'A submeter...'**
  String get submittingLabel;

  /// No description provided for @submitApplicationButton.
  ///
  /// In pt, this message translates to:
  /// **'Submeter Candidatura'**
  String get submitApplicationButton;

  /// No description provided for @savingLabel.
  ///
  /// In pt, this message translates to:
  /// **'A gravar...'**
  String get savingLabel;

  /// No description provided for @saveDraftButton.
  ///
  /// In pt, this message translates to:
  /// **'Guardar Rascunho'**
  String get saveDraftButton;

  /// No description provided for @errorLoadRequirements.
  ///
  /// In pt, this message translates to:
  /// **'Erro ao carregar os requisitos do badge: {error}'**
  String errorLoadRequirements(Object error);

  /// No description provided for @fileSizeExceeded.
  ///
  /// In pt, this message translates to:
  /// **'Ficheiro excede o limite de {mb}MB para .{extension}'**
  String fileSizeExceeded(Object extension, Object mb);

  /// No description provided for @mustAttachMandatory.
  ///
  /// In pt, this message translates to:
  /// **'Deve anexar ficheiros de evidência em todos os requisitos obrigatórios.'**
  String get mustAttachMandatory;

  /// No description provided for @attachAtLeastOne.
  ///
  /// In pt, this message translates to:
  /// **'Anexe pelo menos um ficheiro para gravar o rascunho.'**
  String get attachAtLeastOne;

  /// No description provided for @errorCreateApplication.
  ///
  /// In pt, this message translates to:
  /// **'Não foi possível criar o registo da candidatura.'**
  String get errorCreateApplication;

  /// No description provided for @draftSavedSuccess.
  ///
  /// In pt, this message translates to:
  /// **'Rascunho gravado com sucesso!'**
  String get draftSavedSuccess;

  /// No description provided for @applicationStatusTitle.
  ///
  /// In pt, this message translates to:
  /// **'Estado das Candidaturas'**
  String get applicationStatusTitle;

  /// No description provided for @refreshRequests.
  ///
  /// In pt, this message translates to:
  /// **'Atualizar Pedidos'**
  String get refreshRequests;

  /// No description provided for @renewalsManagement.
  ///
  /// In pt, this message translates to:
  /// **'Gestão de Renovações'**
  String get renewalsManagement;

  /// No description provided for @noApplicationsPullToRefresh.
  ///
  /// In pt, this message translates to:
  /// **'Não existem candidaturas registadas.\nPuxe para baixo para atualizar.'**
  String get noApplicationsPullToRefresh;

  /// No description provided for @noTitle.
  ///
  /// In pt, this message translates to:
  /// **'Sem título'**
  String get noTitle;

  /// No description provided for @noObjectiveTypesAvailable.
  ///
  /// In pt, this message translates to:
  /// **'Não há tipos de objetivos disponíveis de momento.'**
  String get noObjectiveTypesAvailable;

  /// No description provided for @objectiveType.
  ///
  /// In pt, this message translates to:
  /// **'Tipo de Objetivo *'**
  String get objectiveType;

  /// No description provided for @select.
  ///
  /// In pt, this message translates to:
  /// **'Selecione...'**
  String get select;

  /// No description provided for @qtyBadges.
  ///
  /// In pt, this message translates to:
  /// **'Qtd de Badges (3 a 5)'**
  String get qtyBadges;

  /// No description provided for @qtyPoints.
  ///
  /// In pt, this message translates to:
  /// **'Qtd de Pontos (100 a 2000)'**
  String get qtyPoints;

  /// No description provided for @diversityType.
  ///
  /// In pt, this message translates to:
  /// **'Tipo de Diversidade'**
  String get diversityType;

  /// No description provided for @qtyDiversity.
  ///
  /// In pt, this message translates to:
  /// **'Qtd de Diversidade'**
  String get qtyDiversity;

  /// No description provided for @deadline.
  ///
  /// In pt, this message translates to:
  /// **'Prazo'**
  String get deadline;

  /// No description provided for @unit.
  ///
  /// In pt, this message translates to:
  /// **'Unidade'**
  String get unit;

  /// No description provided for @days.
  ///
  /// In pt, this message translates to:
  /// **'Dias'**
  String get days;

  /// No description provided for @weeks.
  ///
  /// In pt, this message translates to:
  /// **'Semanas'**
  String get weeks;

  /// No description provided for @months.
  ///
  /// In pt, this message translates to:
  /// **'Meses'**
  String get months;

  /// No description provided for @objectiveCreatedSuccess.
  ///
  /// In pt, this message translates to:
  /// **'Objetivo criado com sucesso!'**
  String get objectiveCreatedSuccess;

  /// No description provided for @errorCreatingObjective.
  ///
  /// In pt, this message translates to:
  /// **'Erro ao criar objetivo. Verifique os valores.'**
  String get errorCreatingObjective;

  /// No description provided for @alertsTitle.
  ///
  /// In pt, this message translates to:
  /// **'Avisos'**
  String get alertsTitle;

  /// No description provided for @markAllAsReadTooltip.
  ///
  /// In pt, this message translates to:
  /// **'Marcar todas como lidas'**
  String get markAllAsReadTooltip;

  /// No description provided for @refresh.
  ///
  /// In pt, this message translates to:
  /// **'Atualizar'**
  String get refresh;

  /// No description provided for @filterAll.
  ///
  /// In pt, this message translates to:
  /// **'Todas'**
  String get filterAll;

  /// No description provided for @filterUnread.
  ///
  /// In pt, this message translates to:
  /// **'Não Lidas'**
  String get filterUnread;

  /// No description provided for @filterRead.
  ///
  /// In pt, this message translates to:
  /// **'Lidas'**
  String get filterRead;

  /// No description provided for @errorLoadingAlerts.
  ///
  /// In pt, this message translates to:
  /// **'Não foi possível carregar os avisos.'**
  String get errorLoadingAlerts;

  /// No description provided for @noAlertsFound.
  ///
  /// In pt, this message translates to:
  /// **'Nenhum aviso encontrado.'**
  String get noAlertsFound;

  /// No description provided for @pullToRefresh.
  ///
  /// In pt, this message translates to:
  /// **'Puxe para baixo para atualizar'**
  String get pullToRefresh;

  /// No description provided for @systemAlert.
  ///
  /// In pt, this message translates to:
  /// **'Aviso do Sistema'**
  String get systemAlert;

  /// No description provided for @general.
  ///
  /// In pt, this message translates to:
  /// **'Geral'**
  String get general;

  /// No description provided for @readAction.
  ///
  /// In pt, this message translates to:
  /// **'Ler'**
  String get readAction;

  /// No description provided for @fromPrefix.
  ///
  /// In pt, this message translates to:
  /// **'De: '**
  String get fromPrefix;

  /// No description provided for @noAdditionalContent.
  ///
  /// In pt, this message translates to:
  /// **'Sem conteúdo adicional.'**
  String get noAdditionalContent;

  /// No description provided for @markAllAsReadTitle.
  ///
  /// In pt, this message translates to:
  /// **'Marcar todas como lidas?'**
  String get markAllAsReadTitle;

  /// No description provided for @markAllAsReadMessage.
  ///
  /// In pt, this message translates to:
  /// **'Deseja marcar todas as notificações como lidas?'**
  String get markAllAsReadMessage;

  /// No description provided for @allMarkedAsReadSuccess.
  ///
  /// In pt, this message translates to:
  /// **'Todas as notificações foram marcadas como lidas.'**
  String get allMarkedAsReadSuccess;

  /// No description provided for @yesConfirm.
  ///
  /// In pt, this message translates to:
  /// **'Sim, confirmar'**
  String get yesConfirm;

  /// No description provided for @now.
  ///
  /// In pt, this message translates to:
  /// **'Agora'**
  String get now;

  /// No description provided for @minsAgo.
  ///
  /// In pt, this message translates to:
  /// **'min atrás'**
  String get minsAgo;

  /// No description provided for @hoursAgo.
  ///
  /// In pt, this message translates to:
  /// **'h atrás'**
  String get hoursAgo;

  /// No description provided for @yesterdayAt.
  ///
  /// In pt, this message translates to:
  /// **'Ontem às '**
  String get yesterdayAt;

  /// No description provided for @renewalRequestSubmittedSuccess.
  ///
  /// In pt, this message translates to:
  /// **'Pedido de renovação submetido com sucesso.'**
  String get renewalRequestSubmittedSuccess;

  /// No description provided for @eligible.
  ///
  /// In pt, this message translates to:
  /// **'Elegíveis'**
  String get eligible;

  /// No description provided for @myApplicationsTab.
  ///
  /// In pt, this message translates to:
  /// **'Minhas Candidaturas'**
  String get myApplicationsTab;

  /// No description provided for @noBadgesToRenew.
  ///
  /// In pt, this message translates to:
  /// **'Nenhum badge a expirar ou elegível para renovação.'**
  String get noBadgesToRenew;

  /// No description provided for @renewalPointsPrefix.
  ///
  /// In pt, this message translates to:
  /// **'Pontos Renovação: +'**
  String get renewalPointsPrefix;

  /// No description provided for @expiresInDays.
  ///
  /// In pt, this message translates to:
  /// **'Expira em {days} dias'**
  String expiresInDays(Object days);

  /// No description provided for @pendingModeration.
  ///
  /// In pt, this message translates to:
  /// **'Pendente de Moderação'**
  String get pendingModeration;

  /// No description provided for @requestRenewalTitle.
  ///
  /// In pt, this message translates to:
  /// **'Solicitar Renovação?'**
  String get requestRenewalTitle;

  /// No description provided for @requestRenewalMessage.
  ///
  /// In pt, this message translates to:
  /// **'Tem a certeza que deseja submeter este pedido de renovação?'**
  String get requestRenewalMessage;

  /// No description provided for @confirm.
  ///
  /// In pt, this message translates to:
  /// **'Confirmar'**
  String get confirm;

  /// No description provided for @renew.
  ///
  /// In pt, this message translates to:
  /// **'Renovar'**
  String get renew;

  /// No description provided for @noRenewalRequestsSubmitted.
  ///
  /// In pt, this message translates to:
  /// **'Nenhum pedido de renovação submetido.'**
  String get noRenewalRequestsSubmitted;

  /// No description provided for @previewShare.
  ///
  /// In pt, this message translates to:
  /// **'Pré-visualizar Partilha'**
  String get previewShare;

  /// No description provided for @howYourPostWillLook.
  ///
  /// In pt, this message translates to:
  /// **'Como ficará o teu post:'**
  String get howYourPostWillLook;

  /// No description provided for @yourName.
  ///
  /// In pt, this message translates to:
  /// **'O Teu Nome'**
  String get yourName;

  /// No description provided for @softinsaTalent.
  ///
  /// In pt, this message translates to:
  /// **'Talento Softinsa'**
  String get softinsaTalent;

  /// No description provided for @shareOnLinkedIn.
  ///
  /// In pt, this message translates to:
  /// **'Partilhar no LinkedIn'**
  String get shareOnLinkedIn;

  /// No description provided for @shareNow.
  ///
  /// In pt, this message translates to:
  /// **'Partilhar Agora'**
  String get shareNow;

  /// No description provided for @documentRotatedDegrees.
  ///
  /// In pt, this message translates to:
  /// **'Documento rodado {degrees}°'**
  String documentRotatedDegrees(Object degrees);

  /// No description provided for @errorSharingCertificate.
  ///
  /// In pt, this message translates to:
  /// **'Erro ao partilhar o certificado: {error}'**
  String errorSharingCertificate(Object error);

  /// No description provided for @certificateSavedSuccess.
  ///
  /// In pt, this message translates to:
  /// **'Certificado guardado com sucesso!'**
  String get certificateSavedSuccess;

  /// No description provided for @errorDownloadingCertificate.
  ///
  /// In pt, this message translates to:
  /// **'Erro ao descarregar certificado: {error}'**
  String errorDownloadingCertificate(Object error);

  /// No description provided for @certificateTitle.
  ///
  /// In pt, this message translates to:
  /// **'Certificado'**
  String get certificateTitle;

  /// No description provided for @errorLoadingCertificate.
  ///
  /// In pt, this message translates to:
  /// **'Ocorreu um erro ao gerar o certificado.'**
  String get errorLoadingCertificate;

  /// No description provided for @loadingCertificate.
  ///
  /// In pt, this message translates to:
  /// **'A carregar o teu certificado...'**
  String get loadingCertificate;

  /// No description provided for @noSubmissionsYet.
  ///
  /// In pt, this message translates to:
  /// **'Ainda não fez nenhuma submissão.'**
  String get noSubmissionsYet;

  /// No description provided for @achievedBadge.
  ///
  /// In pt, this message translates to:
  /// **'Alcançaste o badge {badgeName}'**
  String achievedBadge(Object badgeName);

  /// No description provided for @plusPoints.
  ///
  /// In pt, this message translates to:
  /// **'+{points} Pontos'**
  String plusPoints(Object points);

  /// No description provided for @continueEvolving.
  ///
  /// In pt, this message translates to:
  /// **'Continuar a Evoluir'**
  String get continueEvolving;

  /// No description provided for @goodMorning.
  ///
  /// In pt, this message translates to:
  /// **'Bom dia!'**
  String get goodMorning;

  /// No description provided for @technicalJourney.
  ///
  /// In pt, this message translates to:
  /// **'Jornada Técnica'**
  String get technicalJourney;

  /// No description provided for @weekProgress.
  ///
  /// In pt, this message translates to:
  /// **'Progresso da Semana'**
  String get weekProgress;

  /// No description provided for @errorGeneral.
  ///
  /// In pt, this message translates to:
  /// **'Erro: {error}'**
  String errorGeneral(Object error);

  /// No description provided for @dashboardBadges.
  ///
  /// In pt, this message translates to:
  /// **'Badges'**
  String get dashboardBadges;

  /// No description provided for @dashboardAccumulatedPoints.
  ///
  /// In pt, this message translates to:
  /// **'Pontos\nAcumulados'**
  String get dashboardAccumulatedPoints;

  /// No description provided for @dashboardPointsUnit.
  ///
  /// In pt, this message translates to:
  /// **'pts'**
  String get dashboardPointsUnit;

  /// No description provided for @dashboardApplications.
  ///
  /// In pt, this message translates to:
  /// **'Candidaturas'**
  String get dashboardApplications;

  /// No description provided for @dashboardRanking.
  ///
  /// In pt, this message translates to:
  /// **'Ranking'**
  String get dashboardRanking;

  /// No description provided for @dashboardVsPreviousMonth.
  ///
  /// In pt, this message translates to:
  /// **'vs. mês anterior'**
  String get dashboardVsPreviousMonth;

  /// No description provided for @sliderNewBadge.
  ///
  /// In pt, this message translates to:
  /// **'Novo Badge!'**
  String get sliderNewBadge;

  /// No description provided for @sliderBadgeExpiring.
  ///
  /// In pt, this message translates to:
  /// **'Badge a Expirar'**
  String get sliderBadgeExpiring;

  /// No description provided for @timelineBadgeConquered.
  ///
  /// In pt, this message translates to:
  /// **'Badge Conquistado'**
  String get timelineBadgeConquered;

  /// No description provided for @timelineSpecialConquest.
  ///
  /// In pt, this message translates to:
  /// **'Conquista Especial'**
  String get timelineSpecialConquest;

  /// No description provided for @timelineActionApprovedSll.
  ///
  /// In pt, this message translates to:
  /// **'Candidatura Aprovada'**
  String get timelineActionApprovedSll;

  /// No description provided for @timelineActionApproved.
  ///
  /// In pt, this message translates to:
  /// **'Candidatura Aprovada'**
  String get timelineActionApproved;

  /// No description provided for @statusNotStarted.
  ///
  /// In pt, this message translates to:
  /// **'Não Iniciada'**
  String get statusNotStarted;

  /// No description provided for @statusNotStartedPlural.
  ///
  /// In pt, this message translates to:
  /// **'Não Iniciadas'**
  String get statusNotStartedPlural;

  /// No description provided for @statusNotStartedPluralM.
  ///
  /// In pt, this message translates to:
  /// **'Não Iniciados'**
  String get statusNotStartedPluralM;

  /// No description provided for @timelineEarnedPoints.
  ///
  /// In pt, this message translates to:
  /// **'Ganhaste {points} pontos'**
  String timelineEarnedPoints(int points);

  /// No description provided for @progressAreas.
  ///
  /// In pt, this message translates to:
  /// **'{current}/{total} áreas'**
  String progressAreas(int current, int total);

  /// No description provided for @progressLevels.
  ///
  /// In pt, this message translates to:
  /// **'{current}/{total} níveis'**
  String progressLevels(int current, int total);

  /// No description provided for @progressBadges.
  ///
  /// In pt, this message translates to:
  /// **'{current}/{total} badges completos'**
  String progressBadges(int current, int total);

  /// No description provided for @sliderMilestoneTitle.
  ///
  /// In pt, this message translates to:
  /// **'Marco Alcançado!'**
  String get sliderMilestoneTitle;

  /// No description provided for @sliderMilestoneDesc.
  ///
  /// In pt, this message translates to:
  /// **'Parabéns! Alcançaste o marco \"{title}\".'**
  String sliderMilestoneDesc(String title);

  /// No description provided for @sliderMilestoneAction.
  ///
  /// In pt, this message translates to:
  /// **'Ver Conquista 🎉'**
  String get sliderMilestoneAction;

  /// No description provided for @sliderNewBadgeDesc.
  ///
  /// In pt, this message translates to:
  /// **'Conquistaste o badge \"{title}\". Continua o excelente trabalho!'**
  String sliderNewBadgeDesc(String title);

  /// No description provided for @sliderNewBadgeAction.
  ///
  /// In pt, this message translates to:
  /// **'Ver Detalhes ->'**
  String get sliderNewBadgeAction;

  /// No description provided for @sliderObjectiveTitle.
  ///
  /// In pt, this message translates to:
  /// **'Lembrete de Objetivo'**
  String get sliderObjectiveTitle;

  /// No description provided for @sliderObjectiveDesc.
  ///
  /// In pt, this message translates to:
  /// **'Tens um objetivo ativo: alcançar {qtd} {tipo}.'**
  String sliderObjectiveDesc(int qtd, String tipo);

  /// No description provided for @sliderObjectiveAction.
  ///
  /// In pt, this message translates to:
  /// **'Ver Objetivo ->'**
  String get sliderObjectiveAction;

  /// No description provided for @sliderSlaUrgent.
  ///
  /// In pt, this message translates to:
  /// **'SLA Ultrapassado / Urgente'**
  String get sliderSlaUrgent;

  /// No description provided for @sliderBadgeExpiringDesc.
  ///
  /// In pt, this message translates to:
  /// **'O badge \"{title}\" expira em {days} dias.'**
  String sliderBadgeExpiringDesc(String title, int days);

  /// No description provided for @sliderBadgeExpiringAction.
  ///
  /// In pt, this message translates to:
  /// **'Renovar Certificação ->'**
  String get sliderBadgeExpiringAction;

  /// No description provided for @sliderFallbackTitle.
  ///
  /// In pt, this message translates to:
  /// **'A tua jornada começa aqui!'**
  String get sliderFallbackTitle;

  /// No description provided for @sliderFallbackDesc.
  ///
  /// In pt, this message translates to:
  /// **'Explora o catálogo, candidata-te a Badges e conquista os teus primeiros marcos!'**
  String get sliderFallbackDesc;
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  Future<AppLocalizations> load(Locale locale) {
    return SynchronousFuture<AppLocalizations>(lookupAppLocalizations(locale));
  }

  @override
  bool isSupported(Locale locale) =>
      <String>['en', 'es', 'pt'].contains(locale.languageCode);

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

AppLocalizations lookupAppLocalizations(Locale locale) {
  // Lookup logic when only language code is specified.
  switch (locale.languageCode) {
    case 'en':
      return AppLocalizationsEn();
    case 'es':
      return AppLocalizationsEs();
    case 'pt':
      return AppLocalizationsPt();
  }

  throw FlutterError(
      'AppLocalizations.delegate failed to load unsupported locale "$locale". This is likely '
      'an issue with the localizations generation tool. Please file an issue '
      'on GitHub with a reproducible sample app and the gen-l10n configuration '
      'that was used.');
}
