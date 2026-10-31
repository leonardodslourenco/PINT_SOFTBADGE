import 'package:flutter/material.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/services/firebase_messaging_service.dart';
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';
import 'package:projeto_pratico/riverpood/dashboard_notifier.dart';
import 'package:projeto_pratico/riverpood/timeline_notifier.dart';
import 'package:projeto_pratico/riverpood/status_history_notifier.dart';
import 'package:projeto_pratico/riverpood/learning_path_notifier.dart';
import 'package:projeto_pratico/riverpood/badge_expiration_notifier.dart';
import 'package:projeto_pratico/riverpood/objetivo_notifier.dart';
import 'package:projeto_pratico/riverpood/notification_notifier.dart';
import 'package:projeto_pratico/riverpood/marcos_notifier.dart';

// Importa os teus 4 ecrãs atuais:
import 'package:projeto_pratico/screens/dashboard/dashboard_screen.dart';
import 'package:projeto_pratico/screens/catalog/catalog_screen.dart';
import 'package:projeto_pratico/screens/history/history_screen.dart';
import 'package:projeto_pratico/screens/history/status_history.dart';
import 'package:projeto_pratico/screens/profile/profile_screen.dart';
import 'package:projeto_pratico/services/celebration_service.dart';

class MainScreen extends ConsumerStatefulWidget {
  const MainScreen({super.key});

  @override
  ConsumerState<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends ConsumerState<MainScreen> with WidgetsBindingObserver {
  // A variável que guarda qual é o "canal" selecionado (começa no 0: Dashboard)
  int _currentIndex = 0;
  DateTime? _lastSyncTime;

  // A lista dos nossos "canais" (os teus 5 ecrãs)
  final List<Widget> _screens = [
    const DashboardScreen(),
    const CatalogScreen(),
    const HistoryScreen(),       // Os teus Badges Conquistados
    const StatusHistoryScreen(), // Os teus Pedidos
    const ProfileScreen(), 
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    FirebaseMessagingService.onDataSyncNeeded = _silentSyncAllData;
    _checkCelebrations();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    if (FirebaseMessagingService.onDataSyncNeeded == _silentSyncAllData) {
      FirebaseMessagingService.onDataSyncNeeded = null;
    }
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    if (state == AppLifecycleState.resumed) {
      debugPrint('[MainScreen] App em primeiro plano (resumed). Sincronizando dados silenciosamente...');
      _silentSyncAllData();
    }
  }

  /// Sincroniza silenciosamente todos os estados da app via FCM ou Lifecycle
  void _silentSyncAllData() {
    if (!mounted) return;

    // Evita múltiplas chamadas consecutivas em menos de 1.5 segundo
    final now = DateTime.now();
    if (_lastSyncTime != null && now.difference(_lastSyncTime!).inMilliseconds < 1500) {
      return;
    }
    _lastSyncTime = now;

    final authState = ref.read(authProvider);
    final userId = authState.user?.id;
    if (userId != null && mounted) {
      debugPrint('[MainScreen] Atualização silenciosa em tempo real dos providers iniciada via FCM/Lifecycle...');
      final l10n = AppLocalizations.of(context)!;
      ref.read(objetivoProvider.notifier).loadData();
      ref.read(badgeProvider.notifier).loadRealMetrics(userId);
      ref.read(dashboardProvider.notifier).loadRealData();
      ref.read(timelineProvider.notifier).loadRealTimeline(userId, l10n);
      ref.read(statusHistoryProvider.notifier).loadRealData();
      ref.read(learningPathProvider.notifier).loadLearningPaths(userId);
      ref.read(badgeExpirationProvider.notifier).loadExpirationAlerts(userId);
      ref.read(notificationProvider.notifier).fetchNotifications();
      ref.read(marcosProvider.notifier).loadMarcos();
      _checkCelebrations();
    }
  }

  Future<void> _checkCelebrations() async {
    final service = CelebrationService();
    final pendentes = await service.fetchPendingCelebrations();
    
    if (pendentes.isNotEmpty && mounted) {
      for (var marco in pendentes) {
        await _showCelebrationDialog(marco);
        await service.markAsCelebrated(marco['id_marco']);
      }
    }
  }

  Future<void> _showCelebrationDialog(dynamic marco) async {
    return showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) {
        final l10n = AppLocalizations.of(context)!;
        return AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Text(
                '🎉',
                style: TextStyle(fontSize: 60),
              ),
              const SizedBox(height: 16),
              Text(
                l10n.newMilestoneReached,
                style: const TextStyle(
                  fontFamily: 'Arimo',
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF155DFC),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                marco['nome'] ?? l10n.congratulations,
                style: const TextStyle(
                  fontFamily: 'Arimo',
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                marco['descricao'] ?? '',
                style: const TextStyle(
                  fontFamily: 'Arimo',
                  fontSize: 14,
                  color: Color(0xFF61738D),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF155DFC),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                  minimumSize: const Size(double.infinity, 45),
                ),
                child: Text(l10n.fantastic, style: const TextStyle(color: Colors.white, fontFamily: 'Arimo')),
              )
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final unreadBadgesCount = ref.watch(unreadBadgesCountProvider);
    final unreadPedidosCount = ref.watch(unreadPedidosCountProvider);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      // O MEIO DO ECRÃ: Mostra a página correspondente ao index atual
      body: _screens[_currentIndex],
      
      // A TUA NOVA BOTTOM BAR PROFISSIONAL:
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          boxShadow: [
            BoxShadow(color: Color(0x19000000), blurRadius: 10, offset: Offset(0, -2)),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (index) {
            // Quando o utilizador clica, mudamos o "canal"
            setState(() {
              _currentIndex = index;
            });
          },
          type: BottomNavigationBarType.fixed, // Necessário para mostrar mais de 3 itens
          backgroundColor: Colors.white,
          selectedItemColor: const Color(0xFF155DFC), // O teu Azul Softinsa
          unselectedItemColor: const Color(0xFF61738D), // O teu Cinza
          selectedLabelStyle: const TextStyle(fontFamily: 'Arimo', fontSize: 12, fontWeight: FontWeight.bold),
          unselectedLabelStyle: const TextStyle(fontFamily: 'Arimo', fontSize: 12),
          
          // CORREÇÃO: O 'const' vem logo aqui para a lista toda!
          items: [
            BottomNavigationBarItem(
              icon: const Icon(Icons.home_rounded),
              label: l10n.navHome,
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.auto_stories_rounded),
              label: l10n.navCatalog,
            ),
            BottomNavigationBarItem(
              icon: Badge(
                isLabelVisible: unreadBadgesCount > 0,
                label: Text('$unreadBadgesCount', style: const TextStyle(color: Colors.white, fontFamily: 'Arimo')),
                backgroundColor: const Color(0xFF155DFC), // Cor da notificação
                child: const Icon(Icons.workspace_premium_rounded),
              ),
              label: l10n.navBadges,
            ),
            BottomNavigationBarItem(
              icon: Badge(
                isLabelVisible: unreadPedidosCount > 0,
                label: Text('$unreadPedidosCount', style: const TextStyle(color: Colors.white, fontFamily: 'Arimo')),
                backgroundColor: const Color(0xFF155DFC),
                child: const Icon(Icons.pending_actions_rounded),
              ),
              label: l10n.navRequests,
            ),
            BottomNavigationBarItem(
              icon: const Icon(Icons.person_rounded),
              label: l10n.navProfile,
            ),
          ],
        ),
      ),
    );
  }
}