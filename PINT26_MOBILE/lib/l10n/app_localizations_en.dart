// ignore: unused_import
import 'package:intl/intl.dart' as intl;
import 'app_localizations.dart';

// ignore_for_file: type=lint

/// The translations for English (`en`).
class AppLocalizationsEn extends AppLocalizations {
  AppLocalizationsEn([String locale = 'en']) : super(locale);

  @override
  String get myProfile => 'My Profile';

  @override
  String get manageAccount => 'Manage your account and preferences';

  @override
  String get points => 'Points';

  @override
  String get badges => 'Badges';

  @override
  String get viewPublicProfile => 'View Public Profile';

  @override
  String get account => 'Account';

  @override
  String get profileSettings => 'Profile Settings';

  @override
  String get profileSettingsDesc => 'Edit personal information';

  @override
  String get notifications => 'Notifications';

  @override
  String get notificationsDesc => 'Manage notification preferences';

  @override
  String get privacySecurity => 'Privacy & Security';

  @override
  String get privacySecurityDesc => 'Control data and GDPR permissions';

  @override
  String get preferences => 'Preferences';

  @override
  String get language => 'Language';

  @override
  String get languageDesc => 'Change application language';

  @override
  String get support => 'Support';

  @override
  String get aboutApp => 'About the App';

  @override
  String get aboutAppDesc => 'Version, terms and conditions';

  @override
  String get helpFaq => 'Help & FAQ';

  @override
  String get helpFaqDesc => 'Frequently asked questions and support';

  @override
  String get logout => 'Logout';

  @override
  String get myEvolution => 'My Evolution';

  @override
  String get loginWelcome => 'Welcome back! Please log in to your account.';

  @override
  String actionRequired(String action) {
    return 'Action required: $action';
  }

  @override
  String get emailAddress => 'Email Address';

  @override
  String get enterEmail => 'Enter your email';

  @override
  String get passwordLabel => 'Password';

  @override
  String get enterPassword => 'Enter your password';

  @override
  String get loginButtonLog => 'Log';

  @override
  String get loginButtonIn => ' In';

  @override
  String get rememberMe => 'Remember me';

  @override
  String get forgotPassword => 'Forgot password?';

  @override
  String get requiredField => 'Required field';

  @override
  String get learningPath => 'Learning Path';

  @override
  String get serviceLine => 'Service Line';

  @override
  String get area => 'Area';

  @override
  String get configureProfileTitle => 'Configure your Profile';

  @override
  String get configureProfileSubtitle =>
      'To suggest badges and challenges aligned with your career, follow these steps.';

  @override
  String get selectLearningPath => 'Select a Learning Path';

  @override
  String get selectServiceLine => 'Select a Service Line';

  @override
  String get selectArea => 'Select an Area';

  @override
  String get confirmArea => 'Confirm Area';

  @override
  String get passwordChangedLoginAgain =>
      'Password changed successfully! Please log in again.';

  @override
  String get passwordChangedSuccess => 'Password changed successfully!';

  @override
  String get passwordChangeError =>
      'Error changing password. Check your details.';

  @override
  String get newPasswordTitle => 'New Password';

  @override
  String get newPasswordSubtitle =>
      'For security reasons, you must change the system-generated password on your first login.';

  @override
  String get newPasswordLabel => 'New Password';

  @override
  String get min8Chars => 'Minimum 15 characters';

  @override
  String get passwordMinError => 'Password must be at least 15 characters long';

  @override
  String get confirmNewPasswordLabel => 'Confirm New Password';

  @override
  String get repeatNewPassword => 'Repeat your new password';

  @override
  String get passwordsDontMatch => 'Passwords do not match';

  @override
  String get confirmChange => 'Confirm Change';

  @override
  String get insertVerificationCode => 'Enter the verification code.';

  @override
  String get emailVerifiedLoginAgain =>
      'Email verified successfully! Please log in again.';

  @override
  String get invalidCode => 'Invalid code. Please try again.';

  @override
  String get newCodeSent => 'New code sent to your email!';

  @override
  String get errorResendingCode => 'Error resending code.';

  @override
  String get emailVerificationTitle => 'Email Verification';

  @override
  String emailVerificationSubtitleEmail(String email) {
    return 'We\'ve sent a verification code to\n$email';
  }

  @override
  String get emailVerificationSubtitle =>
      'We\'ve sent a verification code to your email.';

  @override
  String get verifyCode => 'Verify Code';

  @override
  String get didntReceiveCode => 'Didn\'t receive the code? ';

  @override
  String resendCooldown(int seconds) {
    return 'Resend (${seconds}s)';
  }

  @override
  String get resend => 'Resend';

  @override
  String get backToLogin => 'Back to Login';

  @override
  String get errorLoadingTerms =>
      'An error occurred while loading the terms. Please contact the administrator.';

  @override
  String get errorAcceptingTerms =>
      'An error occurred while accepting the terms. Please try again.';

  @override
  String get termsAndConditions => 'Terms and Conditions';

  @override
  String get rgpdSubtitle =>
      'To continue using the application, please read and accept our privacy and data protection policy (GDPR).';

  @override
  String get acceptTerms => 'Accept Terms';

  @override
  String get newMilestoneReached => 'NEW MILESTONE REACHED!';

  @override
  String get congratulations => 'Congratulations!';

  @override
  String get fantastic => 'Fantastic!';

  @override
  String get navHome => 'Home';

  @override
  String get navCatalog => 'Catalog';

  @override
  String get navBadges => 'Badges';

  @override
  String get navRequests => 'Requests';

  @override
  String get navProfile => 'Profile';

  @override
  String get greetingMorning => 'Good morning! 👋';

  @override
  String get greetingAfternoon => 'Good afternoon! 👋';

  @override
  String get greetingEvening => 'Good evening! 👋';

  @override
  String get logoutTitle => 'Sign Out';

  @override
  String get logoutConfirmation => 'Are you sure you want to sign out?';

  @override
  String get cancel => 'Cancel';

  @override
  String get yes => 'Yes';

  @override
  String get welcomeBack => 'Welcome back';

  @override
  String get premiumBadgesTitle => 'Premium Badges';

  @override
  String get premiumBadgesSubtitle =>
      'Special badges that reflect important\nmilestones of your journey';

  @override
  String get noPremiumBadges =>
      'You haven\'t unlocked Premium badges yet.\nKeep up the good work!';

  @override
  String get pointsHistoryTitle => 'Points History';

  @override
  String get pointsHistorySubtitle => 'Monthly evolution of your journey';

  @override
  String get noPointsHistory => 'No points history yet.\nStart earning badges!';

  @override
  String get recommendedForYou => 'Recommended for You';

  @override
  String get preferenceArea => '🎯 Preference Area';

  @override
  String get exploredArea => '🌐 Explored Area';

  @override
  String levelNumber(String level) {
    return 'Level $level';
  }

  @override
  String get viewAction => 'View';

  @override
  String get applyAction => 'Apply';

  @override
  String get professionalEvolutionTitle => 'Professional Evolution';

  @override
  String get detailsAction => 'Details';

  @override
  String get noProfessionalEvolution =>
      'Your professional evolution starts here. Earn your first badge to see the timeline!';

  @override
  String get objectiveDeletedSuccess => 'Objective successfully deleted!';

  @override
  String get myObjectives => 'My Objectives';

  @override
  String get noActiveObjectives => 'No active objectives!';

  @override
  String get defineNewObjective =>
      'Define a new objective and track your progress.';

  @override
  String get createObjectiveAction => 'Create Objective';

  @override
  String progressCurrentTarget(String current, String target) {
    return 'Progress: $current / $target';
  }

  @override
  String get expired => 'Expired';

  @override
  String daysRemaining(int days) {
    return '$days days left';
  }

  @override
  String get silverMedal => 'SILVER';

  @override
  String get goldMedal => 'GOLD';

  @override
  String get bronzeMedal => 'BRONZE';

  @override
  String get noMoreConsultants => 'There are no more consultants.';

  @override
  String get generalRankingTitle => 'General Ranking';

  @override
  String get tryAgainAction => 'Try Again';

  @override
  String get noRankingData => 'No ranking data yet.';

  @override
  String get newObjective => 'New Objective';

  @override
  String get noTimelineEvents =>
      'You don\'t have any milestones in your journey yet.\nExplore the catalog!';

  @override
  String get badgesCatalogTitle => 'Badges Catalog';

  @override
  String get searchBadgesHint => 'Search badges...';

  @override
  String get filters => 'Filters';

  @override
  String get lessPoints => 'Fewer Points';

  @override
  String get morePoints => 'More Points';

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
      other: '$count Areas',
      one: '1 Area',
      zero: '0 Areas',
    );
    return '$_temp0';
  }

  @override
  String levelsCount(int count) {
    String _temp0 = intl.Intl.pluralLogic(
      count,
      locale: localeName,
      other: '$count Levels',
      one: '1 Level',
      zero: '0 Levels',
    );
    return '$_temp0';
  }

  @override
  String get levelsGrid => 'Levels';

  @override
  String get badgesGrid => 'Badges';

  @override
  String get earnedGrid => 'Earned';

  @override
  String badgesCount(int count) {
    return '$count badges';
  }

  @override
  String get noBadgesMatchFilters => 'No badge matches the filters';

  @override
  String get statusCompleted => 'Completed';

  @override
  String get statusInProgress => 'In Progress';

  @override
  String get statusAvailable => 'Available';

  @override
  String get goBack => 'Back';

  @override
  String get tabInformation => 'Information';

  @override
  String get tabCompetences => 'Competences';

  @override
  String get loadingRequirements => 'Loading requirements...';

  @override
  String requirementsCount(int count) {
    return 'Requirements ($count)';
  }

  @override
  String get statusApproved => 'Approved';

  @override
  String get statusInValidation => 'In Validation';

  @override
  String get statusSubmitted => 'Submitted';

  @override
  String get statusPending => 'Pending';

  @override
  String get certifiedCompetences => 'Certified Competences';

  @override
  String get actionsTitle => 'Actions';

  @override
  String get backToCatalog => 'Back to Catalog';

  @override
  String get submitApplication => 'Submit Application';

  @override
  String get continueDraft => 'Continue Draft';

  @override
  String get viewApplication => 'View Application';

  @override
  String get project => 'Project';

  @override
  String onDate(String date) {
    return 'on $date';
  }

  @override
  String get badgeApplicationTitle => 'Badge Application';

  @override
  String get singleLevel => 'Single Level';

  @override
  String get achievementsTitle => 'Achievements';

  @override
  String get tabBadges => 'Badges';

  @override
  String get tabMilestones => 'Milestones';

  @override
  String get tabSpecials => 'Specials';

  @override
  String get noBadgesEarned => 'You haven\'t earned any badges yet.';

  @override
  String get exploreCatalogPrompt =>
      'Start exploring the catalog and apply for your first Badges!';

  @override
  String get goToCatalog => 'Go to Catalog';

  @override
  String get achievementSharing => 'Achievement Sharing';

  @override
  String get publicStatus => 'Public';

  @override
  String get privateStatus => 'Private';

  @override
  String get viewBadge => 'View Badge';

  @override
  String get viewCertificate => 'View Certificate';

  @override
  String get shareAction => 'Share';

  @override
  String get linkedIn => 'LinkedIn';

  @override
  String get applicationIdNotAvailable => 'Application ID not available.';

  @override
  String shareMessage(String title, String link) {
    return 'Check out my new certification from Softinsa: $title!\n$link';
  }

  @override
  String shareSubject(String title) {
    return '$title Certification';
  }

  @override
  String get shareTermsTitle => 'Badge Sharing Terms';

  @override
  String get shareTermsContent =>
      'By accepting these terms, you authorize the platform to make this certification data public. Do you confirm that you have read and accept the GDPR Terms?';

  @override
  String get decline => 'Decline';

  @override
  String get accept => 'Accept';

  @override
  String get publicShareError =>
      'Error enabling public sharing. Please try again.';

  @override
  String get achieved => 'Achieved';

  @override
  String get available => 'Available';

  @override
  String get searchAvailableMilestones => 'Search available milestones...';

  @override
  String get noMilestoneFound => 'No milestone found.';

  @override
  String get tryAgain => 'Try Again';

  @override
  String get noSpecialBadgeApplications =>
      'You haven\'t applied to any special badges yet.';

  @override
  String get exploreSpecialBadgesPrompt =>
      'Explore Special Badges in the \'Available\' tab to submit your certifications.';

  @override
  String get statusConquered => 'Earned';

  @override
  String get statusUnderAnalysis => 'Under Analysis';

  @override
  String get statusRejected => 'Rejected';

  @override
  String get reasonPrefix => 'Reason: ';

  @override
  String get viewProof => 'View Proof';

  @override
  String get publicProfileSharing => 'Public Profile Sharing';

  @override
  String get statusActive => 'Active';

  @override
  String get statusInactive => 'Inactive';

  @override
  String get noSpecialBadgeAvailable =>
      'No special badge available at the moment.';

  @override
  String get viewDetails => 'View Details';

  @override
  String get applyButton => 'Apply';

  @override
  String get bonusPointsSuffix => 'bonus points';

  @override
  String get descriptionLabel => 'Description';

  @override
  String get noAdditionalDescription =>
      'No additional description for this special badge.';

  @override
  String get applicationRequirementsTitle => 'Application Requirements';

  @override
  String get requirementLinkPublic =>
      'You must submit a valid public proof URL link.';

  @override
  String get requirementFilePdf =>
      'You must attach a proof document in PDF format.';

  @override
  String get applyForThisBadge => 'Apply for this Badge';

  @override
  String get specialBadgeApplicationTitle => 'Special Badge Application';

  @override
  String get publicLinkMandatory => 'Public Link (Mandatory) *';

  @override
  String get publicLinkOptional => 'Public Link (Optional)';

  @override
  String get exampleLink => 'https://example.com/certificate';

  @override
  String get errorInsertUrl => 'Please enter the proof link URL.';

  @override
  String get errorLinkFormat => 'The link must start with http:// or https://';

  @override
  String get pdfFileMandatory => 'PDF Proof File (Mandatory) *';

  @override
  String get pdfFileOptional => 'PDF Proof File (Optional)';

  @override
  String get errorFileSize => 'The file cannot exceed 5MB.';

  @override
  String get errorFileSelection => 'Error selecting file: ';

  @override
  String get selectPdfFile => 'Select PDF File (max 5MB)';

  @override
  String get errorPdfMandatory => 'Attaching a PDF proof is mandatory.';

  @override
  String get applicationSubmittedSuccess =>
      'Application submitted successfully for Team Manager analysis!';

  @override
  String get returnedApplicationsTitle => 'Returned Applications';

  @override
  String get noReturnedApplications =>
      'There are no returned applications for changes.';

  @override
  String get applicationRequiresCorrection => 'Application Requires Correction';

  @override
  String tapToCorrectAndResubmit(Object id) {
    return 'ID: $id\nTap to correct and resubmit evidence.';
  }

  @override
  String get approvedValidatedEvidenceTitle => 'Approved / Validated Evidence';

  @override
  String get noValidatedEvidence =>
      'You don\'t have any validated evidence at the moment.';

  @override
  String requirementIdAndDate(Object date, Object id) {
    return 'Requirement ID: $id - Date: $date';
  }

  @override
  String get incompleteSubmissionsTitle => 'Incomplete Submissions';

  @override
  String get noIncompleteSubmissions => 'You have no incomplete submissions.';

  @override
  String applicationId(Object id) {
    return 'Application: $id';
  }

  @override
  String get tapToUploadAndSubmit => 'Tap to upload files and submit evidence.';

  @override
  String get unknownBadge => 'Unknown Badge';

  @override
  String get noArea => 'No Area';

  @override
  String get noDescriptionAvailable => 'No description available.';

  @override
  String get statusDraft => 'Draft';

  @override
  String get statusRejectedCancelled => 'Rejected / Cancelled';

  @override
  String get applicationDetailsTitle => 'Application Details';

  @override
  String get submissionRequirementsTitle => 'Submission Requirements';

  @override
  String get noEvidenceSubmitted => 'No evidence submitted.';

  @override
  String get evidences => 'Evidências';

  @override
  String mainRequirement(Object title) {
    return 'Main Requirement - $title';
  }

  @override
  String get mandatory => 'Mandatory';

  @override
  String practicalCompetenceDemo(Object title) {
    return 'Demonstration of practical competence in $title';
  }

  @override
  String get evidencePresentedForProof =>
      'Evidence presented as proof for this requirement.';

  @override
  String get changeButton => 'Change';

  @override
  String currentState(Object status) {
    return '* Current State: $status';
  }

  @override
  String get closeButton => 'Close';

  @override
  String get accountTitle => 'Account';

  @override
  String get profileSettingsTitle => 'Profile Settings';

  @override
  String get profileSettingsSubtitle => 'Edit personal information';

  @override
  String get notificationsTitle => 'Notifications';

  @override
  String get notificationsSubtitle => 'Manage notification preferences';

  @override
  String get privacySecurityTitle => 'Privacy and Security';

  @override
  String get privacySecuritySubtitle => 'Control data and GDPR permissions';

  @override
  String get preferencesTitle => 'Preferences';

  @override
  String get languageTitle => 'Language';

  @override
  String get languageSubtitle => 'Change application language';

  @override
  String get supportTitle => 'Support';

  @override
  String get helpFaqTitle => 'Help and FAQ';

  @override
  String get helpFaqSubtitle => 'Frequently asked questions';

  @override
  String get aboutTitle => 'About';

  @override
  String get aboutSubtitle => 'Version 1.0.0';

  @override
  String get logoutButton => 'Logout';

  @override
  String get platformVersion => 'Softinsa Badge Platform v1.0.0';

  @override
  String get pointsLabel => 'Points';

  @override
  String get badgesLabel => 'Badges';

  @override
  String get personalInformationTitle => 'Personal Information';

  @override
  String get nameField => 'Name';

  @override
  String get surnameField => 'Surname';

  @override
  String get emailField => 'Email';

  @override
  String get profileUpdatedSuccess =>
      'Profile synchronized and saved successfully!';

  @override
  String get profileUpdateError => 'Error updating profile.';

  @override
  String get saveChangesButton => 'Save Changes';

  @override
  String get notificationChannelsTitle => 'Notification Channels';

  @override
  String get pushNotificationsTitle => 'Push Notifications';

  @override
  String get pushNotificationsSubtitle =>
      'Receive real-time alerts on your device';

  @override
  String get emailAlertsTitle => 'Email Alerts';

  @override
  String get emailAlertsSubtitle => 'Receive periodic activity summaries';

  @override
  String get syncAlertsTitle => 'Synchronization Alerts';

  @override
  String get syncAlertsSubtitle => 'Notify when there are database updates';

  @override
  String get accountSecurityTitle => 'Account Security';

  @override
  String get changePasswordTitle => 'Change Password';

  @override
  String get changePasswordSubtitle => 'Update system access credentials';

  @override
  String get gdprComplianceTitle => 'GDPR Compliance and Data';

  @override
  String get downloadMyDataTitle => 'Download my data';

  @override
  String get downloadMyDataSubtitle => 'Get a local and cloud backup';

  @override
  String get deleteAccountTitle => 'Delete Account';

  @override
  String get deleteAccountSubtitle => 'Permanently delete application data';

  @override
  String get currentPasswordLabel => 'Current Password';

  @override
  String get cancelButton => 'Cancel';

  @override
  String get confirmButton => 'Confirm';

  @override
  String passwordChangeErrorWithArg(Object error) {
    return 'Error changing password: $error';
  }

  @override
  String get faqHeaderTitle => 'Frequently Asked Questions';

  @override
  String get faqHeaderSubtitle =>
      'Find quick answers to the most common questions.';

  @override
  String get frequentQuestionsTitle => 'Frequent Questions';

  @override
  String get stillHaveQuestionsTitle => 'Still have questions?';

  @override
  String get contactSupportTitle => 'Contact Support';

  @override
  String get aboutAppTitle => 'About the Application';

  @override
  String get aboutAppDescription =>
      'The Softinsa Badges Platform is a mobile application developed to recognize and value the skills of Softinsa\'s employees.\n\nThrough a system of badges and points, employees can track their professional growth and celebrate their achievements.';

  @override
  String get technicalInfoTitle => 'Technical Information';

  @override
  String get versionLabel => 'Version';

  @override
  String get buildLabel => 'Build';

  @override
  String get platformLabel => 'Platform';

  @override
  String get frameworkLabel => 'Framework';

  @override
  String get developedByTitle => 'Developed by';

  @override
  String get developmentTeam => 'Development Team';

  @override
  String get legalTitle => 'Legal';

  @override
  String get termsOfService => 'Terms of Service';

  @override
  String get privacyPolicy => 'Privacy Policy';

  @override
  String get softwareLicenses => 'Software Licenses';

  @override
  String get copyrightNotice => '© 2026 Softinsa · All rights reserved';

  @override
  String get errorLoading => 'Error loading';

  @override
  String totalProducts(Object count) {
    return 'Total products: $count';
  }

  @override
  String get myPath => 'My Path';

  @override
  String get completedLabel => 'Completed';

  @override
  String get inProgressLabel => 'In Progress';

  @override
  String get notStartedLabel => 'Not Started';

  @override
  String get completedSubtext => 'completed';

  @override
  String get loadingLearningPaths => 'Loading Learning Paths...';

  @override
  String get searchFilters => 'Search Filters';

  @override
  String get allGender => 'All';

  @override
  String get allPlural => 'All';

  @override
  String get areaLabel => 'Area';

  @override
  String get levelLabel => 'Level';

  @override
  String get statusLabel => 'Statuses';

  @override
  String get tryAgainButton => 'Try Again';

  @override
  String get submissionRequirements => 'Submission Requirements';

  @override
  String get noRequirementsConfigured =>
      'No requirements configured for this badge.';

  @override
  String get applicationInstructions => 'Application Instructions';

  @override
  String get applicationInstructionsDesc =>
      'Attach the necessary proofs in each requirement. Allowed files: PDF (max. 5MB), ZIP, RAR or 7Z (max. 15MB).';

  @override
  String get requirementFallback => 'Requirement';

  @override
  String get mandatoryLabel => 'Mandatory';

  @override
  String get optionalLabel => 'Optional';

  @override
  String get attachedFileFallback => 'Attached file';

  @override
  String get attachFileLabel => 'Attach File (PDF, ZIP, RAR, 7Z)';

  @override
  String get submittingLabel => 'Submitting...';

  @override
  String get submitApplicationButton => 'Submit Application';

  @override
  String get savingLabel => 'Saving...';

  @override
  String get saveDraftButton => 'Save Draft';

  @override
  String errorLoadRequirements(Object error) {
    return 'Error loading badge requirements: $error';
  }

  @override
  String fileSizeExceeded(Object extension, Object mb) {
    return 'File exceeds the limit of ${mb}MB for .$extension';
  }

  @override
  String get mustAttachMandatory =>
      'You must attach evidence files in all mandatory requirements.';

  @override
  String get attachAtLeastOne => 'Attach at least one file to save the draft.';

  @override
  String get errorCreateApplication =>
      'Could not create the application record.';

  @override
  String get draftSavedSuccess => 'Draft saved successfully!';

  @override
  String get applicationStatusTitle => 'Application Status';

  @override
  String get refreshRequests => 'Refresh Requests';

  @override
  String get renewalsManagement => 'Renewals Management';

  @override
  String get noApplicationsPullToRefresh =>
      'There are no registered applications.\nPull down to refresh.';

  @override
  String get noTitle => 'No title';

  @override
  String get noObjectiveTypesAvailable =>
      'There are no objective types available at the moment.';

  @override
  String get objectiveType => 'Objective Type *';

  @override
  String get select => 'Select...';

  @override
  String get qtyBadges => 'Qty of Badges (3 to 5)';

  @override
  String get qtyPoints => 'Qty of Points (100 to 2000)';

  @override
  String get diversityType => 'Diversity Type';

  @override
  String get qtyDiversity => 'Qty of Diversity';

  @override
  String get deadline => 'Deadline';

  @override
  String get unit => 'Unit';

  @override
  String get days => 'Days';

  @override
  String get weeks => 'Weeks';

  @override
  String get months => 'Months';

  @override
  String get objectiveCreatedSuccess => 'Objective created successfully!';

  @override
  String get errorCreatingObjective =>
      'Error creating objective. Check the values.';

  @override
  String get alertsTitle => 'Alerts';

  @override
  String get markAllAsReadTooltip => 'Mark all as read';

  @override
  String get refresh => 'Refresh';

  @override
  String get filterAll => 'All';

  @override
  String get filterUnread => 'Unread';

  @override
  String get filterRead => 'Read';

  @override
  String get errorLoadingAlerts => 'Could not load alerts.';

  @override
  String get noAlertsFound => 'No alerts found.';

  @override
  String get pullToRefresh => 'Pull down to refresh';

  @override
  String get systemAlert => 'System Alert';

  @override
  String get general => 'General';

  @override
  String get readAction => 'Read';

  @override
  String get fromPrefix => 'From: ';

  @override
  String get noAdditionalContent => 'No additional content.';

  @override
  String get markAllAsReadTitle => 'Mark all as read?';

  @override
  String get markAllAsReadMessage =>
      'Do you want to mark all notifications as read?';

  @override
  String get allMarkedAsReadSuccess => 'All notifications were marked as read.';

  @override
  String get yesConfirm => 'Yes, confirm';

  @override
  String get now => 'Now';

  @override
  String get minsAgo => 'mins ago';

  @override
  String get hoursAgo => 'h ago';

  @override
  String get yesterdayAt => 'Yesterday at ';

  @override
  String get renewalRequestSubmittedSuccess =>
      'Renewal request submitted successfully.';

  @override
  String get eligible => 'Eligible';

  @override
  String get myApplicationsTab => 'My Applications';

  @override
  String get noBadgesToRenew => 'No badge expiring or eligible for renewal.';

  @override
  String get renewalPointsPrefix => 'Renewal Points: +';

  @override
  String expiresInDays(Object days) {
    return 'Expires in $days days';
  }

  @override
  String get pendingModeration => 'Pending Moderation';

  @override
  String get requestRenewalTitle => 'Request Renewal?';

  @override
  String get requestRenewalMessage =>
      'Are you sure you want to submit this renewal request?';

  @override
  String get confirm => 'Confirm';

  @override
  String get renew => 'Renew';

  @override
  String get noRenewalRequestsSubmitted => 'No renewal requests submitted.';

  @override
  String get previewShare => 'Preview Share';

  @override
  String get howYourPostWillLook => 'How your post will look:';

  @override
  String get yourName => 'Your Name';

  @override
  String get softinsaTalent => 'Softinsa Talent';

  @override
  String get shareOnLinkedIn => 'Share on LinkedIn';

  @override
  String get shareNow => 'Share Now';

  @override
  String documentRotatedDegrees(Object degrees) {
    return 'Document rotated $degrees°';
  }

  @override
  String errorSharingCertificate(Object error) {
    return 'Error sharing certificate: $error';
  }

  @override
  String get certificateSavedSuccess => 'Certificate saved successfully!';

  @override
  String errorDownloadingCertificate(Object error) {
    return 'Error downloading certificate: $error';
  }

  @override
  String get certificateTitle => 'Certificate';

  @override
  String get errorLoadingCertificate =>
      'An error occurred while generating the certificate.';

  @override
  String get loadingCertificate => 'Loading your certificate...';

  @override
  String get noSubmissionsYet => 'You haven\'t made any submissions yet.';

  @override
  String achievedBadge(Object badgeName) {
    return 'You achieved the $badgeName badge';
  }

  @override
  String plusPoints(Object points) {
    return '+$points Points';
  }

  @override
  String get continueEvolving => 'Continue to Evolve';

  @override
  String get goodMorning => 'Good morning!';

  @override
  String get technicalJourney => 'Technical Journey';

  @override
  String get weekProgress => 'Week Progress';

  @override
  String errorGeneral(Object error) {
    return 'Error: $error';
  }

  @override
  String get dashboardBadges => 'Badges';

  @override
  String get dashboardAccumulatedPoints => 'Accumulated\nPoints';

  @override
  String get dashboardPointsUnit => 'pts';

  @override
  String get dashboardApplications => 'Applications';

  @override
  String get dashboardRanking => 'Ranking';

  @override
  String get dashboardVsPreviousMonth => 'vs. previous month';

  @override
  String get sliderNewBadge => 'New Badge!';

  @override
  String get sliderBadgeExpiring => 'Badge Expiring';

  @override
  String get timelineBadgeConquered => 'Badge Earned';

  @override
  String get timelineSpecialConquest => 'Special Conquest';

  @override
  String get timelineActionApprovedSll => 'Application Approved';

  @override
  String get timelineActionApproved => 'Application Approved';

  @override
  String get statusNotStarted => 'Not Started';

  @override
  String get statusNotStartedPlural => 'Not Started';

  @override
  String get statusNotStartedPluralM => 'Not Started';

  @override
  String timelineEarnedPoints(int points) {
    return 'You earned $points points';
  }

  @override
  String progressAreas(int current, int total) {
    return '$current/$total areas';
  }

  @override
  String progressLevels(int current, int total) {
    return '$current/$total levels';
  }

  @override
  String progressBadges(int current, int total) {
    return '$current/$total completed badges';
  }

  @override
  String get sliderMilestoneTitle => 'Milestone Achieved!';

  @override
  String sliderMilestoneDesc(String title) {
    return 'Congratulations! You reached the milestone \"$title\".';
  }

  @override
  String get sliderMilestoneAction => 'View Achievement 🎉';

  @override
  String sliderNewBadgeDesc(String title) {
    return 'You earned the badge \"$title\". Keep up the great work!';
  }

  @override
  String get sliderNewBadgeAction => 'View Details ->';

  @override
  String get sliderObjectiveTitle => 'Objective Reminder';

  @override
  String sliderObjectiveDesc(int qtd, String tipo) {
    return 'You have an active objective: reach $qtd $tipo.';
  }

  @override
  String get sliderObjectiveAction => 'View Objective ->';

  @override
  String get sliderSlaUrgent => 'SLA Overdue / Urgent';

  @override
  String sliderBadgeExpiringDesc(String title, int days) {
    return 'The badge \"$title\" expires in $days days.';
  }

  @override
  String get sliderBadgeExpiringAction => 'Renew Certification ->';

  @override
  String get sliderFallbackTitle => 'Your journey starts here!';

  @override
  String get sliderFallbackDesc =>
      'Explore the catalog, apply for Badges and achieve your first milestones!';
}
