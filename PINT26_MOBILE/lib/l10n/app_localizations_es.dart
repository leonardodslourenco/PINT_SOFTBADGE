// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for Spanish Castilian (`es`).
class AppLocalizationsEs extends AppLocalizations {
  AppLocalizationsEs([String locale = 'es']) : super(locale);

  @override
  String get myProfile => 'Mi Perfil';

  @override
  String get manageAccount => 'Gestiona tu cuenta y preferencias';

  @override
  String get points => 'Puntos';

  @override
  String get badges => 'Insignias';

  @override
  String get viewPublicProfile => 'Ver Perfil Público';

  @override
  String get account => 'Cuenta';

  @override
  String get profileSettings => 'Configuración de Perfil';

  @override
  String get profileSettingsDesc => 'Editar información personal';

  @override
  String get notifications => 'Notificaciones';

  @override
  String get notificationsDesc => 'Gestionar preferencias de notificaciones';

  @override
  String get privacySecurity => 'Privacidad y Seguridad';

  @override
  String get privacySecurityDesc => 'Controlar datos y permisos RGPD';

  @override
  String get preferences => 'Preferencias';

  @override
  String get language => 'Idioma';

  @override
  String get languageDesc => 'Cambiar el idioma de la aplicación';

  @override
  String get support => 'Soporte';

  @override
  String get aboutApp => 'Acerca de la Aplicación';

  @override
  String get aboutAppDesc => 'Versión, términos y condiciones';

  @override
  String get helpFaq => 'Ayuda y FAQ';

  @override
  String get helpFaqDesc => 'Preguntas frecuentes y soporte';

  @override
  String get logout => 'Cerrar Sesión';

  @override
  String get myEvolution => 'Mi Evolución';

  @override
  String get loginWelcome =>
      '¡Bienvenido de nuevo! Por favor, inicie sesión en su cuenta.';

  @override
  String actionRequired(String action) {
    return 'Acción requerida: $action';
  }

  @override
  String get emailAddress => 'Email Address';

  @override
  String get enterEmail => 'Introduzca su correo electrónico';

  @override
  String get passwordLabel => 'Password';

  @override
  String get enterPassword => 'Introduzca su contraseña';

  @override
  String get loginButtonLog => 'Log';

  @override
  String get loginButtonIn => ' In';

  @override
  String get rememberMe => 'Recordarme';

  @override
  String get forgotPassword => '¿Olvidó su contraseña?';

  @override
  String get requiredField => 'Campo obligatorio';

  @override
  String get learningPath => 'Learning Path';

  @override
  String get serviceLine => 'Service Line';

  @override
  String get area => 'Área';

  @override
  String get configureProfileTitle => 'Configure su Perfil';

  @override
  String get configureProfileSubtitle =>
      'Para poder sugerir insignias y desafíos alineados con su carrera, siga los pasos.';

  @override
  String get selectLearningPath => 'Seleccione una Learning Path';

  @override
  String get selectServiceLine => 'Seleccione una Service Line';

  @override
  String get selectArea => 'Seleccione una Área';

  @override
  String get confirmArea => 'Confirmar Área';

  @override
  String get passwordChangedLoginAgain =>
      '¡Contraseña cambiada con éxito! Por favor, inicie sesión de nuevo.';

  @override
  String get passwordChangedSuccess => '¡Contraseña cambiada con éxito!';

  @override
  String get passwordChangeError =>
      'Error al cambiar la contraseña. Verifique los datos.';

  @override
  String get newPasswordTitle => 'Nueva Contraseña';

  @override
  String get newPasswordSubtitle =>
      'Por razones de seguridad, debe cambiar la contraseña generada por el sistema en su primer inicio de sesión.';

  @override
  String get newPasswordLabel => 'Nueva Contraseña';

  @override
  String get min8Chars => 'Mínimo 15 caracteres';

  @override
  String get passwordMinError =>
      'La contraseña debe tener al menos 15 caracteres';

  @override
  String get confirmNewPasswordLabel => 'Confirmar Nueva Contraseña';

  @override
  String get repeatNewPassword => 'Repita su nueva contraseña';

  @override
  String get passwordsDontMatch => 'Las contraseñas no coinciden';

  @override
  String get confirmChange => 'Confirmar Cambio';

  @override
  String get insertVerificationCode => 'Introduzca el código de verificación.';

  @override
  String get emailVerifiedLoginAgain =>
      '¡Correo electrónico verificado con éxito! Por favor, inicie sesión de nuevo.';

  @override
  String get invalidCode => 'Código no válido. Inténtelo de nuevo.';

  @override
  String get newCodeSent => '¡Nuevo código enviado a su correo electrónico!';

  @override
  String get errorResendingCode => 'Error al reenviar el código.';

  @override
  String get emailVerificationTitle => 'Verificación de Correo Electrónico';

  @override
  String emailVerificationSubtitleEmail(String email) {
    return 'Hemos enviado un código de verificación a\n$email';
  }

  @override
  String get emailVerificationSubtitle =>
      'Hemos enviado un código de verificación a su correo electrónico.';

  @override
  String get verifyCode => 'Verificar Código';

  @override
  String get didntReceiveCode => '¿No recibió el código? ';

  @override
  String resendCooldown(int seconds) {
    return 'Reenviar (${seconds}s)';
  }

  @override
  String get resend => 'Reenviar';

  @override
  String get backToLogin => 'Volver al Inicio de Sesión';

  @override
  String get errorLoadingTerms =>
      'Se produjo un error al cargar los términos. Póngase en contacto con el administrador.';

  @override
  String get errorAcceptingTerms =>
      'Se produjo un error al aceptar los términos. Inténtelo de nuevo.';

  @override
  String get termsAndConditions => 'Términos y Condiciones';

  @override
  String get rgpdSubtitle =>
      'Para continuar usando la aplicación, lea y acepte nuestra política de privacidad y protección de datos (RGPD).';

  @override
  String get acceptTerms => 'Aceptar Términos';

  @override
  String get newMilestoneReached => '¡NUEVO HITO ALCANZADO!';

  @override
  String get congratulations => '¡Felicidades!';

  @override
  String get fantastic => '¡Fantástico!';

  @override
  String get navHome => 'Inicio';

  @override
  String get navCatalog => 'Catálogo';

  @override
  String get navBadges => 'Insignias';

  @override
  String get navRequests => 'Solicitudes';

  @override
  String get navProfile => 'Perfil';

  @override
  String get greetingMorning => '¡Buenos días! 👋';

  @override
  String get greetingAfternoon => '¡Buenas tardes! 👋';

  @override
  String get greetingEvening => '¡Buenas noches! 👋';

  @override
  String get logoutTitle => 'Cerrar Sesión';

  @override
  String get logoutConfirmation => '¿Seguro que desea cerrar sesión?';

  @override
  String get cancel => 'Cancelar';

  @override
  String get yes => 'Sí';

  @override
  String get welcomeBack => 'Bienvenido de nuevo';

  @override
  String get premiumBadgesTitle => 'Insignias Premium';

  @override
  String get premiumBadgesSubtitle =>
      'Insignias especiales que reflejan hitos\nimportantes de su viaje';

  @override
  String get noPremiumBadges =>
      'Aún no ha desbloqueado insignias Premium.\n¡Siga con el buen trabajo!';

  @override
  String get pointsHistoryTitle => 'Historial de Puntos';

  @override
  String get pointsHistorySubtitle => 'Evolución mensual de su viaje';

  @override
  String get noPointsHistory =>
      'Aún no hay historial de puntos.\n¡Empiece a ganar insignias!';

  @override
  String get recommendedForYou => 'Recomendado para Usted';

  @override
  String get preferenceArea => '🎯 Área de Preferencia';

  @override
  String get exploredArea => '🌐 Área Explorada';

  @override
  String levelNumber(String level) {
    return 'Nivel $level';
  }

  @override
  String get viewAction => 'Ver';

  @override
  String get applyAction => 'Aplicar';

  @override
  String get professionalEvolutionTitle => 'Evolución Profesional';

  @override
  String get detailsAction => 'Detalles';

  @override
  String get noProfessionalEvolution =>
      'Su evolución profesional comienza aquí. ¡Gane su primera insignia para ver la línea de tiempo!';

  @override
  String get objectiveDeletedSuccess => '¡Objetivo eliminado con éxito!';

  @override
  String get myObjectives => 'Mis Objetivos';

  @override
  String get noActiveObjectives => '¡Sin objetivos activos!';

  @override
  String get defineNewObjective =>
      'Defina un nuevo objetivo y haga un seguimiento de su progreso.';

  @override
  String get createObjectiveAction => 'Crear Objetivo';

  @override
  String progressCurrentTarget(String current, String target) {
    return 'Progreso: $current / $target';
  }

  @override
  String get expired => 'Expirado';

  @override
  String daysRemaining(int days) {
    return 'Quedan $days días';
  }

  @override
  String get silverMedal => 'PLATA';

  @override
  String get goldMedal => 'ORO';

  @override
  String get bronzeMedal => 'BRONCE';

  @override
  String get noMoreConsultants => 'No hay más consultores.';

  @override
  String get generalRankingTitle => 'Ranking General';

  @override
  String get tryAgainAction => 'Intentar de Nuevo';

  @override
  String get noRankingData => 'Aún no hay datos de ranking.';

  @override
  String get newObjective => 'Nuevo Objetivo';

  @override
  String get noTimelineEvents =>
      'Aún no tiene hitos en su viaje.\n¡Explore el catálogo!';

  @override
  String get badgesCatalogTitle => 'Catálogo de Insignias';

  @override
  String get searchBadgesHint => 'Buscar insignias...';

  @override
  String get filters => 'Filtros';

  @override
  String get lessPoints => 'Menos Puntos';

  @override
  String get morePoints => 'Más Puntos';

  @override
  String serviceLinesCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Service Lines',
      one: '1 Service Line',
      zero: '0 Service Lines',
    );
    return '$_temp0';
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
      other: '$count Niveles',
      one: '1 Nivel',
      zero: '0 Niveles',
    );
    return '$_temp0';
  }

  @override
  String get levelsGrid => 'Niveles';

  @override
  String get badgesGrid => 'Badges';

  @override
  String get earnedGrid => 'Ganadas';

  @override
  String badgesCount(int count) {
    return '$count insignias';
  }

  @override
  String get noBadgesMatchFilters =>
      'Ninguna insignia coincide con los filtros';

  @override
  String get statusCompleted => 'Completado';

  @override
  String get statusInProgress => 'En Progreso';

  @override
  String get statusAvailable => 'Disponible';

  @override
  String get goBack => 'Volver';

  @override
  String get tabInformation => 'Información';

  @override
  String get tabCompetences => 'Competencias';

  @override
  String get loadingRequirements => 'Cargando requisitos...';

  @override
  String requirementsCount(int count) {
    return 'Requisitos ($count)';
  }

  @override
  String get statusApproved => 'Aprobado';

  @override
  String get statusInValidation => 'En Validación';

  @override
  String get statusSubmitted => 'Enviado';

  @override
  String get statusPending => 'Pendiente';

  @override
  String get certifiedCompetences => 'Competencias Certificadas';

  @override
  String get actionsTitle => 'Acciones';

  @override
  String get backToCatalog => 'Volver al Catálogo';

  @override
  String get submitApplication => 'Enviar Solicitud';

  @override
  String get continueDraft => 'Continuar Borrador';

  @override
  String get viewApplication => 'Ver Candidatura';

  @override
  String get project => 'Proyecto';

  @override
  String onDate(String date) {
    return 'el $date';
  }

  @override
  String get badgeApplicationTitle => 'Candidatura a la Insignia';

  @override
  String get singleLevel => 'Nivel Único';

  @override
  String get achievementsTitle => 'Logros';

  @override
  String get tabBadges => 'Insignias';

  @override
  String get tabMilestones => 'Hitos';

  @override
  String get tabSpecials => 'Especiales';

  @override
  String get noBadgesEarned => 'Aún no has obtenido ninguna insignia.';

  @override
  String get exploreCatalogPrompt =>
      '¡Empieza a explorar el catálogo y solicita tus primeras insignias!';

  @override
  String get goToCatalog => 'Ir al Catálogo';

  @override
  String get achievementSharing => 'Compartir Logro';

  @override
  String get publicStatus => 'Público';

  @override
  String get privateStatus => 'Privado';

  @override
  String get viewBadge => 'Ver Insignia';

  @override
  String get viewCertificate => 'Ver Certificado';

  @override
  String get shareAction => 'Compartir';

  @override
  String get linkedIn => 'LinkedIn';

  @override
  String get applicationIdNotAvailable => 'ID de candidatura no disponible.';

  @override
  String shareMessage(String title, String link) {
    return '¡Mira mi nueva certificación de Softinsa: $title!\n$link';
  }

  @override
  String shareSubject(String title) {
    return 'Certificación $title';
  }

  @override
  String get shareTermsTitle => 'Términos de Compartición de la Insignia';

  @override
  String get shareTermsContent =>
      'Al aceptar estos términos, autoriza a la plataforma a hacer públicos los datos de esta certificación. ¿Confirma que ha leído y acepta los Términos RGPD?';

  @override
  String get decline => 'Rechazar';

  @override
  String get accept => 'Aceptar';

  @override
  String get publicShareError =>
      'Error al activar la compartición pública. Inténtalo de nuevo.';

  @override
  String get achieved => 'Alcanzados';

  @override
  String get available => 'Disponibles';

  @override
  String get searchAvailableMilestones => 'Buscar hitos disponibles...';

  @override
  String get noMilestoneFound => 'No se encontró ningún hito.';

  @override
  String get tryAgain => 'Intentar de Nuevo';

  @override
  String get noSpecialBadgeApplications =>
      'Aún no tienes solicitudes para insignias especiales.';

  @override
  String get exploreSpecialBadgesPrompt =>
      'Explora las Insignias Especiales en la pestaña \'Disponibles\' para enviar tus certificaciones.';

  @override
  String get statusConquered => 'Conquistado';

  @override
  String get statusUnderAnalysis => 'En Análisis';

  @override
  String get statusRejected => 'Rechazado';

  @override
  String get reasonPrefix => 'Motivo: ';

  @override
  String get viewProof => 'Ver Comprobante';

  @override
  String get publicProfileSharing => 'Compartir Perfil Público';

  @override
  String get statusActive => 'Activo';

  @override
  String get statusInactive => 'Inactivo';

  @override
  String get noSpecialBadgeAvailable =>
      'Ninguna insignia especial disponible por el momento.';

  @override
  String get viewDetails => 'Ver Detalles';

  @override
  String get applyButton => 'Aplicar';

  @override
  String get bonusPointsSuffix => 'puntos de bonificación';

  @override
  String get descriptionLabel => 'Descripción';

  @override
  String get noAdditionalDescription =>
      'Sin descripción adicional para esta insignia especial.';

  @override
  String get applicationRequirementsTitle => 'Requisitos de la Solicitud';

  @override
  String get requirementLinkPublic =>
      'Debe enviar un enlace URL público válido de comprobante.';

  @override
  String get requirementFilePdf =>
      'Debe adjuntar un documento de comprobante en formato PDF.';

  @override
  String get applyForThisBadge => 'Aplicar para esta Insignia';

  @override
  String get specialBadgeApplicationTitle => 'Solicitud de Insignia Especial';

  @override
  String get publicLinkMandatory => 'Enlace Público (Obligatorio) *';

  @override
  String get publicLinkOptional => 'Enlace Público (Opcional)';

  @override
  String get exampleLink => 'https://ejemplo.com/certificado';

  @override
  String get errorInsertUrl =>
      'Por favor, introduzca la URL del enlace de comprobante.';

  @override
  String get errorLinkFormat =>
      'El enlace debe comenzar por http:// o https://';

  @override
  String get pdfFileMandatory => 'Archivo Comprobante PDF (Obligatorio) *';

  @override
  String get pdfFileOptional => 'Archivo Comprobante PDF (Opcional)';

  @override
  String get errorFileSize => 'El archivo no puede exceder los 5MB.';

  @override
  String get errorFileSelection => 'Error al seleccionar el archivo: ';

  @override
  String get selectPdfFile => 'Seleccionar Archivo PDF (máx. 5MB)';

  @override
  String get errorPdfMandatory =>
      'Es obligatorio adjuntar un comprobante en PDF.';

  @override
  String get applicationSubmittedSuccess =>
      'Candidatura enviada con éxito para el análisis del Team Manager!';

  @override
  String get returnedApplicationsTitle => 'Solicitudes Devueltas';

  @override
  String get noReturnedApplications =>
      'No hay solicitudes devueltas para alteración.';

  @override
  String get applicationRequiresCorrection => 'Solicitud Requiere Corrección';

  @override
  String tapToCorrectAndResubmit(Object id) {
    return 'ID: $id\nToca para corregir y reenviar evidencias.';
  }

  @override
  String get approvedValidatedEvidenceTitle =>
      'Evidencias Aprobadas / Validadas';

  @override
  String get noValidatedEvidence =>
      'No tienes evidencias validadas en este momento.';

  @override
  String requirementIdAndDate(Object date, Object id) {
    return 'Requisito ID: $id - Fecha: $date';
  }

  @override
  String get incompleteSubmissionsTitle => 'Envíos Incompletos';

  @override
  String get noIncompleteSubmissions => 'No tienes envíos incompletos.';

  @override
  String applicationId(Object id) {
    return 'Solicitud: $id';
  }

  @override
  String get tapToUploadAndSubmit =>
      'Toca para subir archivos y enviar evidencias.';

  @override
  String get unknownBadge => 'Insignia Desconocida';

  @override
  String get noArea => 'Sin Área';

  @override
  String get noDescriptionAvailable => 'Sin descripción disponible.';

  @override
  String get statusDraft => 'Borrador';

  @override
  String get statusRejectedCancelled => 'Rechazado / Cancelado';

  @override
  String get applicationDetailsTitle => 'Detalles de la Solicitud';

  @override
  String get submissionRequirementsTitle => 'Requisitos de Envío';

  @override
  String get noEvidenceSubmitted => 'Ninguna evidencia enviada.';

  @override
  String get evidences => 'Evidências';

  @override
  String mainRequirement(Object title) {
    return 'Requisito Principal - $title';
  }

  @override
  String get mandatory => 'Obligatorio';

  @override
  String practicalCompetenceDemo(Object title) {
    return 'Demostración de competencia práctica en $title';
  }

  @override
  String get evidencePresentedForProof =>
      'Evidencia presentada para comprobación de este requisito.';

  @override
  String get changeButton => 'Cambiar';

  @override
  String currentState(Object status) {
    return '* Estado Actual: $status';
  }

  @override
  String get closeButton => 'Cerrar';

  @override
  String get accountTitle => 'Cuenta';

  @override
  String get profileSettingsTitle => 'Configuración de Perfil';

  @override
  String get profileSettingsSubtitle => 'Editar información personal';

  @override
  String get notificationsTitle => 'Notificaciones';

  @override
  String get notificationsSubtitle =>
      'Gestionar preferencias de notificaciones';

  @override
  String get privacySecurityTitle => 'Privacidad y Seguridad';

  @override
  String get privacySecuritySubtitle => 'Controlar datos y permisos RGPD';

  @override
  String get preferencesTitle => 'Preferencias';

  @override
  String get languageTitle => 'Idioma';

  @override
  String get languageSubtitle => 'Cambiar idioma de la aplicación';

  @override
  String get supportTitle => 'Soporte';

  @override
  String get helpFaqTitle => 'Ayuda y FAQ';

  @override
  String get helpFaqSubtitle => 'Preguntas frecuentes';

  @override
  String get aboutTitle => 'Acerca de';

  @override
  String get aboutSubtitle => 'Versión 1.0.0';

  @override
  String get logoutButton => 'Cerrar Sesión';

  @override
  String get platformVersion => 'Softinsa Badge Platform v1.0.0';

  @override
  String get pointsLabel => 'Puntos';

  @override
  String get badgesLabel => 'Insignias';

  @override
  String get personalInformationTitle => 'Información Personal';

  @override
  String get nameField => 'Nombre';

  @override
  String get surnameField => 'Apellido';

  @override
  String get emailField => 'Correo Electrónico';

  @override
  String get profileUpdatedSuccess =>
      '¡Perfil sincronizado y guardado con éxito!';

  @override
  String get profileUpdateError => 'Error al actualizar el perfil.';

  @override
  String get saveChangesButton => 'Guardar Cambios';

  @override
  String get notificationChannelsTitle => 'Canales de Notificación';

  @override
  String get pushNotificationsTitle => 'Notificaciones Push';

  @override
  String get pushNotificationsSubtitle =>
      'Recibir alertas en tiempo real en el dispositivo';

  @override
  String get emailAlertsTitle => 'Alertas por Correo';

  @override
  String get emailAlertsSubtitle => 'Recibir resúmenes periódicos de actividad';

  @override
  String get syncAlertsTitle => 'Alertas de Sincronización';

  @override
  String get syncAlertsSubtitle =>
      'Notificar cuando haya actualizaciones en la base de datos';

  @override
  String get accountSecurityTitle => 'Seguridad de la Cuenta';

  @override
  String get changePasswordTitle => 'Cambiar Contraseña';

  @override
  String get changePasswordSubtitle =>
      'Actualizar credenciales de acceso al sistema';

  @override
  String get gdprComplianceTitle => 'Cumplimiento RGPD y Datos';

  @override
  String get downloadMyDataTitle => 'Descargar mis datos';

  @override
  String get downloadMyDataSubtitle =>
      'Obtener una copia de seguridad local y en la nube';

  @override
  String get deleteAccountTitle => 'Eliminar Cuenta';

  @override
  String get deleteAccountSubtitle =>
      'Borrar permanentemente los datos de la aplicación';

  @override
  String get currentPasswordLabel => 'Contraseña Actual';

  @override
  String get cancelButton => 'Cancelar';

  @override
  String get confirmButton => 'Confirmar';

  @override
  String passwordChangeErrorWithArg(Object error) {
    return 'Error al cambiar la contraseña: $error';
  }

  @override
  String get faqHeaderTitle => 'Preguntas Frecuentes';

  @override
  String get faqHeaderSubtitle =>
      'Encuentra respuestas rápidas a las dudas más comunes.';

  @override
  String get frequentQuestionsTitle => 'Dudas Frecuentes';

  @override
  String get stillHaveQuestionsTitle => '¿Aún tienes dudas?';

  @override
  String get contactSupportTitle => 'Contactar Soporte';

  @override
  String get aboutAppTitle => 'Acerca de la Aplicación';

  @override
  String get aboutAppDescription =>
      'La Softinsa Badges Platform es una aplicación móvil desarrollada para reconocer y valorar las competencias de los empleados de Softinsa.\n\nA través de un sistema de insignias y puntos, los empleados pueden seguir su crecimiento profesional y celebrar sus logros.';

  @override
  String get technicalInfoTitle => 'Información Técnica';

  @override
  String get versionLabel => 'Versión';

  @override
  String get buildLabel => 'Build';

  @override
  String get platformLabel => 'Plataforma';

  @override
  String get frameworkLabel => 'Framework';

  @override
  String get developedByTitle => 'Desarrollado por';

  @override
  String get developmentTeam => 'Equipo de Desarrollo';

  @override
  String get legalTitle => 'Legal';

  @override
  String get termsOfService => 'Términos de Servicio';

  @override
  String get privacyPolicy => 'Política de Privacidad';

  @override
  String get softwareLicenses => 'Licencias de Software';

  @override
  String get copyrightNotice =>
      '© 2026 Softinsa · Todos los derechos reservados';

  @override
  String get errorLoading => 'Error al cargar';

  @override
  String totalProducts(Object count) {
    return 'Total de productos: $count';
  }

  @override
  String get myPath => 'Mi Camino';

  @override
  String get completedLabel => 'Completadas';

  @override
  String get inProgressLabel => 'En Progreso';

  @override
  String get notStartedLabel => 'No Iniciadas';

  @override
  String get completedSubtext => 'completado';

  @override
  String get loadingLearningPaths => 'Cargando Learning Paths...';

  @override
  String get searchFilters => 'Filtros de Búsqueda';

  @override
  String get allGender => 'Todas';

  @override
  String get allPlural => 'Todos';

  @override
  String get areaLabel => 'Área';

  @override
  String get levelLabel => 'Nivel';

  @override
  String get statusLabel => 'Estados';

  @override
  String get tryAgainButton => 'Intentar Nuevamente';

  @override
  String get submissionRequirements => 'Requisitos de Sumisión';

  @override
  String get noRequirementsConfigured =>
      'Ningún requisito configurado para esta insignia.';

  @override
  String get applicationInstructions => 'Instrucciones de Candidatura';

  @override
  String get applicationInstructionsDesc =>
      'Adjunte los comprobantes necesarios en cada requisito. Archivos permitidos: PDF (máx. 5MB), ZIP, RAR o 7Z (máx. 15MB).';

  @override
  String get requirementFallback => 'Requisito';

  @override
  String get mandatoryLabel => 'Obligatorio';

  @override
  String get optionalLabel => 'Opcional';

  @override
  String get attachedFileFallback => 'Archivo adjunto';

  @override
  String get attachFileLabel => 'Adjuntar Archivo (PDF, ZIP, RAR, 7Z)';

  @override
  String get submittingLabel => 'Enviando...';

  @override
  String get submitApplicationButton => 'Enviar Candidatura';

  @override
  String get savingLabel => 'Guardando...';

  @override
  String get saveDraftButton => 'Guardar Borrador';

  @override
  String errorLoadRequirements(Object error) {
    return 'Error al cargar los requisitos de la insignia: $error';
  }

  @override
  String fileSizeExceeded(Object extension, Object mb) {
    return 'El archivo excede el límite de ${mb}MB para .$extension';
  }

  @override
  String get mustAttachMandatory =>
      'Debe adjuntar archivos de evidencia en todos los requisitos obligatorios.';

  @override
  String get attachAtLeastOne =>
      'Adjunte al menos un archivo para guardar el borrador.';

  @override
  String get errorCreateApplication =>
      'No se pudo crear el registro de la candidatura.';

  @override
  String get draftSavedSuccess => 'Borrador guardado con éxito!';

  @override
  String get applicationStatusTitle => 'Estado de las Candidaturas';

  @override
  String get refreshRequests => 'Actualizar Solicitudes';

  @override
  String get renewalsManagement => 'Gestión de Renovaciones';

  @override
  String get noApplicationsPullToRefresh =>
      'No hay candidaturas registradas.\nDesliza hacia abajo para actualizar.';

  @override
  String get noTitle => 'Sin título';

  @override
  String get noObjectiveTypesAvailable =>
      'No hay tipos de objetivos disponibles en este momento.';

  @override
  String get objectiveType => 'Tipo de Objetivo *';

  @override
  String get select => 'Seleccionar...';

  @override
  String get qtyBadges => 'Cant. de Badges (3 a 5)';

  @override
  String get qtyPoints => 'Cant. de Puntos (100 a 2000)';

  @override
  String get diversityType => 'Tipo de Diversidad';

  @override
  String get qtyDiversity => 'Cant. de Diversidad';

  @override
  String get deadline => 'Plazo';

  @override
  String get unit => 'Unidad';

  @override
  String get days => 'Días';

  @override
  String get weeks => 'Semanas';

  @override
  String get months => 'Meses';

  @override
  String get objectiveCreatedSuccess => '¡Objetivo creado con éxito!';

  @override
  String get errorCreatingObjective =>
      'Error al crear el objetivo. Compruebe los valores.';

  @override
  String get alertsTitle => 'Avisos';

  @override
  String get markAllAsReadTooltip => 'Marcar todas como leídas';

  @override
  String get refresh => 'Actualizar';

  @override
  String get filterAll => 'Todas';

  @override
  String get filterUnread => 'No Leídas';

  @override
  String get filterRead => 'Leídas';

  @override
  String get errorLoadingAlerts => 'No se pudieron cargar los avisos.';

  @override
  String get noAlertsFound => 'No se encontraron avisos.';

  @override
  String get pullToRefresh => 'Desliza hacia abajo para actualizar';

  @override
  String get systemAlert => 'Aviso del Sistema';

  @override
  String get general => 'General';

  @override
  String get readAction => 'Leer';

  @override
  String get fromPrefix => 'De: ';

  @override
  String get noAdditionalContent => 'Sin contenido adicional.';

  @override
  String get markAllAsReadTitle => '¿Marcar todas como leídas?';

  @override
  String get markAllAsReadMessage =>
      '¿Deseas marcar todas las notificaciones como leídas?';

  @override
  String get allMarkedAsReadSuccess =>
      'Todas las notificaciones fueron marcadas como leídas.';

  @override
  String get yesConfirm => 'Sí, confirmar';

  @override
  String get now => 'Ahora';

  @override
  String get minsAgo => 'min atrás';

  @override
  String get hoursAgo => 'h atrás';

  @override
  String get yesterdayAt => 'Ayer a las ';

  @override
  String get renewalRequestSubmittedSuccess =>
      'Solicitud de renovación enviada con éxito.';

  @override
  String get eligible => 'Elegibles';

  @override
  String get myApplicationsTab => 'Mis Candidaturas';

  @override
  String get noBadgesToRenew =>
      'No hay ningún badge a punto de expirar o elegible para renovación.';

  @override
  String get renewalPointsPrefix => 'Puntos Renovación: +';

  @override
  String expiresInDays(Object days) {
    return 'Expira en $days días';
  }

  @override
  String get pendingModeration => 'Pendiente de Moderación';

  @override
  String get requestRenewalTitle => '¿Solicitar Renovación?';

  @override
  String get requestRenewalMessage =>
      '¿Estás seguro de que deseas enviar esta solicitud de renovación?';

  @override
  String get confirm => 'Confirmar';

  @override
  String get renew => 'Renovar';

  @override
  String get noRenewalRequestsSubmitted =>
      'Ninguna solicitud de renovación enviada.';

  @override
  String get previewShare => 'Vista Previa de la Compartición';

  @override
  String get howYourPostWillLook => 'Cómo se verá tu publicación:';

  @override
  String get yourName => 'Tu Nombre';

  @override
  String get softinsaTalent => 'Talento Softinsa';

  @override
  String get shareOnLinkedIn => 'Compartir en LinkedIn';

  @override
  String get shareNow => 'Compartir Ahora';

  @override
  String documentRotatedDegrees(Object degrees) {
    return 'Documento rotado $degrees°';
  }

  @override
  String errorSharingCertificate(Object error) {
    return 'Error al compartir el certificado: $error';
  }

  @override
  String get certificateSavedSuccess => '¡Certificado guardado con éxito!';

  @override
  String errorDownloadingCertificate(Object error) {
    return 'Error al descargar el certificado: $error';
  }

  @override
  String get certificateTitle => 'Certificado';

  @override
  String get errorLoadingCertificate =>
      'Ocurrió un error al generar el certificado.';

  @override
  String get loadingCertificate => 'Cargando tu certificado...';

  @override
  String get noSubmissionsYet => 'Aún no has hecho ninguna presentación.';

  @override
  String achievedBadge(Object badgeName) {
    return 'Alcanzaste el badge $badgeName';
  }

  @override
  String plusPoints(Object points) {
    return '+$points Puntos';
  }

  @override
  String get continueEvolving => 'Continuar Evolucionando';

  @override
  String get goodMorning => '¡Buenos días!';

  @override
  String get technicalJourney => 'Jornada Técnica';

  @override
  String get weekProgress => 'Progreso de la Semana';

  @override
  String errorGeneral(Object error) {
    return 'Error: $error';
  }

  @override
  String get dashboardBadges => 'Insignias';

  @override
  String get dashboardAccumulatedPoints => 'Puntos\nAcumulados';

  @override
  String get dashboardPointsUnit => 'pts';

  @override
  String get dashboardApplications => 'Candidaturas';

  @override
  String get dashboardRanking => 'Ranking';

  @override
  String get dashboardVsPreviousMonth => 'vs. mes anterior';

  @override
  String get sliderNewBadge => '¡Nueva Insignia!';

  @override
  String get sliderBadgeExpiring => 'Insignia a Expirar';

  @override
  String get timelineBadgeConquered => 'Insignia Obtenida';

  @override
  String get timelineSpecialConquest => 'Conquista Especial';

  @override
  String get timelineActionApprovedSll => 'Candidatura Aprobada';

  @override
  String get timelineActionApproved => 'Candidatura Aprobada';

  @override
  String get statusNotStarted => 'No Iniciada';

  @override
  String get statusNotStartedPlural => 'No Iniciadas';

  @override
  String get statusNotStartedPluralM => 'No Iniciados';

  @override
  String timelineEarnedPoints(int points) {
    return 'Has ganado $points puntos';
  }

  @override
  String progressAreas(int current, int total) {
    return '$current/$total áreas';
  }

  @override
  String progressLevels(int current, int total) {
    return '$current/$total niveles';
  }

  @override
  String progressBadges(int current, int total) {
    return '$current/$total badges completados';
  }

  @override
  String get sliderMilestoneTitle => '¡Hito Alcanzado!';

  @override
  String sliderMilestoneDesc(String title) {
    return '¡Felicidades! Alcanzaste el hito \"$title\".';
  }

  @override
  String get sliderMilestoneAction => 'Ver Logro 🎉';

  @override
  String sliderNewBadgeDesc(String title) {
    return 'Conseguiste la insignia \"$title\". ¡Sigue con el excelente trabajo!';
  }

  @override
  String get sliderNewBadgeAction => 'Ver Detalles ->';

  @override
  String get sliderObjectiveTitle => 'Recordatorio de Objetivo';

  @override
  String sliderObjectiveDesc(int qtd, String tipo) {
    return 'Tienes un objetivo activo: alcanzar $qtd $tipo.';
  }

  @override
  String get sliderObjectiveAction => 'Ver Objetivo ->';

  @override
  String get sliderSlaUrgent => 'SLA Vencido / Urgente';

  @override
  String sliderBadgeExpiringDesc(String title, int days) {
    return 'La insignia \"$title\" caduca en $days días.';
  }

  @override
  String get sliderBadgeExpiringAction => 'Renovar Certificación ->';

  @override
  String get sliderFallbackTitle => '¡Tu viaje empieza aquí!';

  @override
  String get sliderFallbackDesc =>
      '¡Explora el catálogo, postúlate para Insignias y conquista tus primeros hitos!';
}
