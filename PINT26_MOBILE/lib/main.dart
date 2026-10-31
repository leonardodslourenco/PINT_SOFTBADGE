// TERMINAL PARA CHROME --> flutter run -d chrome --web-experimental-hot-reload

import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sqflite_common_ffi_web/sqflite_ffi_web.dart';
import 'package:sqflite/sqflite.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/data/latest_all.dart' as tz;
import 'package:timezone/timezone.dart' as tz;

//Importação de Providers
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';
import 'package:projeto_pratico/riverpood/locale_notifier.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

//Importação de Screens
import 'package:projeto_pratico/screens/auth/login_screen.dart';
import 'package:projeto_pratico/screens/auth/rgpd_screen.dart';
import 'package:projeto_pratico/screens/dashboard/dashboard_screen.dart';
import 'package:projeto_pratico/screens/dashboard/timeline_screen.dart';
import 'package:projeto_pratico/screens/auth/area_selection_screen.dart';
import 'package:projeto_pratico/screens/auth/change_password_screen.dart';
import 'package:projeto_pratico/screens/history/status_history.dart';
import 'package:projeto_pratico/screens/catalog/catalog_screen.dart';
import 'package:projeto_pratico/screens/history/history_screen.dart';
import 'package:projeto_pratico/screens/dashboard/main_screen.dart';
import 'package:projeto_pratico/screens/catalog/badge_details_screen.dart';
import 'package:projeto_pratico/screens/learning_path/learning_path_detail_screen.dart';
import 'package:projeto_pratico/screens/learning_path/service_line_detail_screen.dart';
import 'package:projeto_pratico/screens/learning_path/area_detail_screen.dart';
import 'package:projeto_pratico/screens/evidence/candidatura_details_screen.dart';
import 'package:projeto_pratico/screens/evidence/evidencias_submetidas_screen.dart';
import 'package:projeto_pratico/screens/evidence/submissoes_incompletas_screens.dart';
import 'package:projeto_pratico/screens/evidence/candidaturas_retornadas_screen.dart';
import 'package:projeto_pratico/models/learning_path_model.dart';
import 'package:projeto_pratico/screens/notifications/notifications_screen.dart';
import 'package:projeto_pratico/config/app_navigator.dart';

import 'package:projeto_pratico/services/firebase_messaging_service.dart';

// Instância global — importada por reminder_service.dart para agendar notificações
final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
    FlutterLocalNotificationsPlugin();

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Inicializa o SQLite para funcionar no browser (Chrome/Web)
  // No Android/iOS o sqflite funciona nativamente, mas no Web precisa deste factory
  if (kIsWeb) {
    databaseFactory = databaseFactoryFfiWeb;
  }

  // Inicializar fusos horários (necessário para TZDateTime no agendamento de notificações)
  tz.initializeTimeZones();
  // Define o fuso horário local (Portugal)
  tz.setLocalLocation(tz.getLocation('Europe/Lisbon'));

  // Inicializar flutter_local_notifications e Firebase Messaging
  if (!kIsWeb) {
    const androidSettings = AndroidInitializationSettings('@mipmap/launcher_icon');
    const initSettings = InitializationSettings(android: androidSettings);
    await flutterLocalNotificationsPlugin.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (NotificationResponse response) {
        AppNavigator.toNotifications();
      },
    );

    // Inicialização do Firebase para Push Notifications (ecrã bloqueado e em background)
    await FirebaseMessagingService.initialize();
  }

  runApp(const ProviderScope(child: SoftinsaBadgeApp()));
}

class SoftinsaBadgeApp extends ConsumerWidget {
  const SoftinsaBadgeApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final locale = ref.watch(localeProvider);

    return MaterialApp(
      navigatorKey: AppNavigator.navigatorKey,
      title: 'Softinsa Badges',
      debugShowCheckedModeBanner: false,
      locale: locale,
      supportedLocales: const [
        Locale('pt'),
        Locale('en'),
        Locale('es'),
      ],
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: Colors.blue),
        useMaterial3: true,
      ),
      home: const AuthWrapper(),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/rgpd_screen': (context) => const RgpdScreen(),
        '/main': (context) => const MainScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/evidencias_submetidas': (context) => const EvidenciasSubmetidasScreen(),
        '/submissoes_incompletas': (context) => const SubmissoesIncompletasScreen(),
        '/candidaturas_retornadas': (context) => const CandidaturasRetornadasScreen(),
        '/change_password': (context) => const ChangePasswordScreen(),
        '/area_selection': (context) => const AreaSelectionScreen(),
        '/catalog': (context) => const CatalogScreen(),
        '/status_history': (context) => const StatusHistoryScreen(),
        '/history': (context) => const HistoryScreen(),
        '/timeline': (context) => const TimelineScreen(),
        '/notifications': (context) => const NotificationsScreen(),
        '/badge_details': (context) {
          final badgeId = ModalRoute.of(context)!.settings.arguments as String;
          return BadgeDetailsScreen(badgeId: badgeId);
        },
        '/candidatura_details': (context) {
          final candidaturaId = ModalRoute.of(context)!.settings.arguments as String;
          return CandidaturaDetailsScreen(idCandidatura: candidaturaId);
        },
      },
      onGenerateRoute: (settings) {
        // ── Learning Path Detail ──────────────────────────────────
        if (settings.name == '/learning_path_detail') {
          final lp = settings.arguments as LearningPathModel;
          return MaterialPageRoute(
            builder: (_) => LearningPathDetailScreen(learningPath: lp),
          );
        }

        // ── Service Line Detail ───────────────────────────────────
        if (settings.name == '/service_line_detail') {
          final args = settings.arguments as Map<String, dynamic>;
          return MaterialPageRoute(
            builder: (_) => ServiceLineDetailScreen(
              idServiceLine: args['idServiceLine'] as int,
              nome: args['nome'] as String,
              learningPathNome: args['learningPathNome'] as String,
            ),
          );
        }

        // ── Area Detail ───────────────────────────────────────────
        if (settings.name == '/area_detail') {
          final args = settings.arguments as Map<String, dynamic>;
          return MaterialPageRoute(
            builder: (_) => AreaDetailScreen(
              idArea: args['idArea'] as int,
              nome: args['nome'] as String,
              serviceLineNome: args['serviceLineNome'] as String,
            ),
          );
        }

        return null;
      },
    );
  }
}

//WRAPPER DE AUTENTICAÇÃO COM RIVERPOD
// Transforma-se em ConsumerWidget para ganhar o parâmetro 'WidgetRef ref'
class AuthWrapper extends ConsumerWidget {
  const AuthWrapper({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Executa uma vez o carregamento dos mocks dos teus colegas (Equivalente ao antigo ..loadMockData())
    // Usamos o ref.read no notifier deles apenas para disparar a função inicial.
    // Nota: Garante que no ficheiro 'badge_provider.dart' existe a variável global 'badgeProvider' criada.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(badgeProvider.notifier).loadBadgesFromApi();
    });

    // O FutureBuilder escuta o tryAutoLogin do teu SQLite
    return FutureBuilder<bool>(
      future: ref.read(authProvider.notifier).tryAutoLogin(),
      builder: (context, snapshot) {
        // Enquanto a BD local bdpdm.db está a ser lida, mostra loading
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(
            body: Center(
              child: CircularProgressIndicator(color: Colors.blue),
            ),
          );
        }

        // Se encontrou sessão guardada, vai direto para o Dashboard. Se não, vai para o Login.
        if (snapshot.data == true) {
          // Verificar se o utilizador já aceitou o RGPD
          final authState = ref.watch(authProvider);
          final user = authState.user;
          
          if (user != null && !user.rgpdConsent) {
            return const RgpdScreen();
          }
          
          return const MainScreen();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}
