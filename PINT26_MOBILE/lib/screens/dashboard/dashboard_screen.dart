import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/screens/catalog/evidence_upload_screen.dart';
import 'package:projeto_pratico/models/timeline_model.dart';
import 'package:projeto_pratico/models/badge_model.dart';
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';
import 'package:projeto_pratico/riverpood/dashboard_notifier.dart';
import 'package:projeto_pratico/riverpood/timeline_notifier.dart';
import 'package:projeto_pratico/riverpood/status_history_notifier.dart';
import 'package:projeto_pratico/riverpood/learning_path_notifier.dart';
import 'package:projeto_pratico/widgets/learning_path_progress_widget.dart';
import 'package:projeto_pratico/screens/notifications/notifications_screen.dart';
import 'package:projeto_pratico/riverpood/notification_notifier.dart';
import 'package:projeto_pratico/riverpood/badge_expiration_notifier.dart';
import 'package:projeto_pratico/riverpood/objetivo_notifier.dart';
import 'package:projeto_pratico/models/objetivo_model.dart';
import 'package:projeto_pratico/services/badge_expiration_service.dart';
import 'package:projeto_pratico/screens/dashboard/widgets/create_objetivo_modal.dart';
import 'package:projeto_pratico/widgets/dashboard_metrics_grid.dart';
import 'package:projeto_pratico/screens/dashboard/widgets/dynamic_alerts_slider.dart';
import 'package:projeto_pratico/widgets/badge_logo_widget.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  @override
  void initState() {
    super.initState();
    // Chamar métodos de carregamento de dados reais com segurança apos o widget montar
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final authState = ref.read(authProvider);
      final l10n = AppLocalizations.of(context)!;
      if (authState.user?.id != null) {
        final userId = authState.user!.id;
        ref.read(badgeProvider.notifier).loadRealMetrics(userId);
        ref.read(dashboardProvider.notifier).loadRealData();
        ref.read(timelineProvider.notifier).loadRealTimeline(userId, l10n);
        ref.read(statusHistoryProvider.notifier).loadRealData();
        ref.read(learningPathProvider.notifier).loadLearningPaths(userId);
        ref.read(badgeExpirationProvider.notifier).loadExpirationAlerts(userId);
        ref.read(objetivoProvider.notifier).loadData();
        ref.read(notificationProvider.notifier).fetchNotifications();
      }
    });
  }

  String _getGreeting(AppLocalizations l10n) {
    final hour = DateTime.now().hour;
    if (hour >= 5 && hour < 12) return l10n.greetingMorning;
    if (hour >= 12 && hour < 18) return l10n.greetingAfternoon;
    return l10n.greetingEvening;
  }

  void _confirmarLogout(
      BuildContext context, WidgetRef ref, AppLocalizations l10n) {
    showDialog(
      context: context,
      builder: (BuildContext context) => AlertDialog(
        title: Text(l10n.logoutTitle),
        content: Text(l10n.logoutConfirmation),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text(l10n.cancel),
          ),
          TextButton(
            onPressed: () async {
              if (context.mounted) {
                Navigator.of(context, rootNavigator: true)
                    .pushNamedAndRemoveUntil('/login', (route) => false);
              }
              await ref.read(authProvider.notifier).signOut();
            },
            child: Text(l10n.yes, style: const TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);
    final badgeState = ref.watch(badgeProvider);
    final dashboardState = ref.watch(dashboardProvider);
    final timelineState = ref.watch(timelineProvider);
    final unreadCount = ref.watch(unreadNotificationsCountProvider);
    final expirationState = ref.watch(badgeExpirationProvider);
    final objetivoState = ref.watch(objetivoProvider);
    final meusObjetivosList = objetivoState.ativos;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        child: Stack(
          clipBehavior: Clip.none,
          children: [
            // Container para preencher o overscroll elástico no topo
            // Usa um gradiente idêntico ao header para que não haja corte visual ao scrollar para cima
            Positioned(
              top: -800,
              left: 0,
              right: 0,
              height: 800,
              child: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    colors: [Color(0xFF155DFC), Color(0xFF155DFC)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                ),
              ),
            ),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // ─── HEADER AZUL GRADIENTE ────────────────────────────────────
                _DashboardHeader(
                  greeting: _getGreeting(l10n),
                  userName: (authState.user?.name != null &&
                          authState.user!.name.isNotEmpty)
                      ? authState.user!.name
                      : 'João Duarte',
                  totalPoints: badgeState.totalPoints,
                  weeklyPoints: badgeState.weeklyPoints.isNotEmpty
                      ? badgeState.weeklyPoints
                      : [50, 80, 45, 120, 45, 10, 0],
                  badgeCount: badgeState.badges
                      .where((b) => b.status == 'concluido')
                      .length,
                  unreadNotifications: unreadCount,
                  onNotificationTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const NotificationsScreen()),
                    );
                  },
                  onLogout: () => _confirmarLogout(context, ref, l10n),
                  ultimoMarco: dashboardState.marcos.isNotEmpty
                      ? dashboardState.marcos.last
                      : null,
                  ultimoBadge: badgeState.badges
                      .where((b) => b.status == 'concluido')
                      .lastOrNull,
                  lembreteObjetivo: meusObjetivosList.isNotEmpty
                      ? meusObjetivosList.first
                      : null,
                  alertaExpiracao: expirationState.alerts.isNotEmpty
                      ? expirationState.alerts.first
                      : null,
                ),

                // ─── CORPO DA PÁGINA ──────────────────────────────────────────
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 20),

                      // ── GRELHA DE MÉTRICAS (KPIs) ───────────────────────────
                      DashboardMetricsGridWidget(
                          metrics: dashboardState.metrics),
                      const SizedBox(height: 24),

                      // ── OBJETIVOS ATIVOS ────────────────────────────────────
                      _ObjetivosSection(
                        objetivos: meusObjetivosList,
                        onAddObjetivo: () {
                          showCreateObjetivoModal(context, ref);
                        },
                        onDeleteObjetivo: (String id) async {
                          final success = await ref
                              .read(objetivoProvider.notifier)
                              .cancelarObjetivo(id);
                          if (success && context.mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                  content: Text(l10n.objectiveDeletedSuccess)),
                            );
                          }
                        },
                      ),
                      const SizedBox(height: 16),

                      // ── Recomendações Carousel ─────────────────────────────
                      _RecommendationsCarousel(
                        recommendations: badgeState.recommendations,
                      ),
                      const SizedBox(height: 24),

                      // ── Progresso Learning Paths ────────────────────────────
                      const LearningPathProgressWidget(),
                      const SizedBox(height: 24),

                      // ── Evolução Profissional (Timeline) ───────────────────
                      _EvolucaoProfissionalSection(
                        events: timelineState.events,
                        onDetalhes: () =>
                            Navigator.pushNamed(context, '/timeline'),
                      ),
                      const SizedBox(height: 24),

                      // ── Histórico de Pontos ───────────────────────────────
                      _PointsTimeline(
                        entries: timelineState.pointsHistory,
                      ),
                      const SizedBox(height: 40),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// HEADER COM GRADIENTE AZUL + GLASSMORPHISM CARD
// ─────────────────────────────────────────────────────────────────────────────

class _DashboardHeader extends StatelessWidget {
  final String greeting;
  final String userName;
  final int totalPoints;
  final int badgeCount;
  final List<int> weeklyPoints;
  final int unreadNotifications;
  final VoidCallback onNotificationTap;
  final VoidCallback onLogout;

  final MarcoAlcancado? ultimoMarco;
  final BadgeModel? ultimoBadge;
  final ObjetivoModel? lembreteObjetivo;
  final BadgeExpirationAlert? alertaExpiracao;

  const _DashboardHeader({
    required this.greeting,
    required this.userName,
    required this.totalPoints,
    required this.badgeCount,
    required this.weeklyPoints,
    required this.unreadNotifications,
    required this.onNotificationTap,
    required this.onLogout,
    this.ultimoMarco,
    this.ultimoBadge,
    this.lembreteObjetivo,
    this.alertaExpiracao,
  });

  @override
  Widget build(BuildContext context) {
    final topPadding = MediaQuery.of(context).padding.top;
    final l10n = AppLocalizations.of(context)!;

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(36),
          bottomRight: Radius.circular(36),
        ),
      ),
      child: Padding(
        padding: EdgeInsets.fromLTRB(20, topPadding + 16, 20, 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Saudação + Bell + Logout ──────────────────────────────
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        greeting,
                        style: const TextStyle(
                          color: Colors.white70,
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        userName,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          letterSpacing: -0.5,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        l10n.welcomeBack,
                        style: const TextStyle(
                          color: Colors.white60,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
                // Botão de Notificação
                Stack(
                  children: [
                    Container(
                      width: 44,
                      height: 44,
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.2),
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: Colors.white.withValues(alpha: 0.3)),
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.notifications_outlined,
                            color: Colors.white, size: 22),
                        onPressed: onNotificationTap,
                        padding: EdgeInsets.zero,
                      ),
                    ),
                    if (unreadNotifications > 0)
                      Positioned(
                        top: 0,
                        right: 0,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFF3B30),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: const Color(0xFF1C64FD),
                              width: 2,
                            ),
                          ),
                          child: Text(
                            unreadNotifications > 99
                                ? "99+"
                                : "$unreadNotifications",
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),

            // ── Slider de Alertas Dinâmicos ──────────────────────────────
            DynamicAlertsSlider(
              ultimoMarco: ultimoMarco,
              ultimoBadge: ultimoBadge,
              lembreteObjetivo: lembreteObjetivo,
              alertaExpiracao: alertaExpiracao,
            ),
          ],
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TIMELINE DE PONTOS MENSAIS
// ─────────────────────────────────────────────────────────────────────────────
// 1. Extraímos o modelo de dados para fora, para o pai poder usar
// A classe TimelineEntryData agora vem do models/timeline_model.dart

class _PointsTimeline extends StatelessWidget {
  final List<TimelineEntryData> entries;

  const _PointsTimeline({required this.entries});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF155DFC).withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // ── Cabeçalho integrado ────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.pointsHistoryTitle,
                    style: GoogleFonts.outfit(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF1A202C),
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    l10n.pointsHistorySubtitle,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: const Color(0xFF718096),
                    ),
                  ),
                ],
              ),
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFF155DFC).withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Icon(
                  Icons.timeline_rounded,
                  color: Color(0xFF155DFC),
                  size: 20,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ── Conteúdo ─────────────────────────────────────────────────
          if (entries.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Text(
                l10n.noPointsHistory,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(
                  color: const Color(0xFF718096),
                  fontSize: 13,
                ),
              ),
            )
          else
            PointsHistoryChart(entries: entries),
        ],
      ),
    );
  }
}

class PointsHistoryChart extends StatelessWidget {
  final List<TimelineEntryData> entries;

  const PointsHistoryChart({super.key, required this.entries});

  @override
  Widget build(BuildContext context) {
    if (entries.isEmpty) return const SizedBox.shrink();

    // As 'entries' já vêm estritamente calculadas (ex: 24 meses) no Notifier.
    // Invertemos a ordem para ler da esquerda (antigo) para a direita (recente) no gráfico.
    final reversedEntries = entries.reversed.toList();

    // Descobrir max/min para o eixo Y
    double maxPoints = 0;
    for (var e in reversedEntries) {
      final pointsStr = e.points.replaceAll(RegExp(r'[^0-9]'), '');
      final y = double.tryParse(pointsStr) ?? 0;
      if (y > maxPoints) maxPoints = y;
    }
    double maxY = maxPoints + (maxPoints * 0.2); // +20% margem topo
    if (maxY == 0) maxY = 100; // fallback seguro

    // Extrair os valores Y para a linha
    final spots = reversedEntries.asMap().entries.map((e) {
      final index = e.key.toDouble();
      final pointsStr = e.value.points.replaceAll(RegExp(r'[^0-9]'), '');
      final yVal = double.tryParse(pointsStr) ?? 0;
      return FlSpot(index, yVal);
    }).toList();

    // Calcular largura necessária para os meses (70px por mês) para evitar sobreposição de texto
    double chartWidth = reversedEntries.length * 70.0;
    double minWidth = MediaQuery.of(context).size.width - 40; // Margens do ecrã
    double finalWidth = chartWidth > minWidth ? chartWidth : minWidth;

    return Container(
      height: 220,
      margin: const EdgeInsets.only(top: 16),
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        reverse: true, // Começa no fim (mais recente)
        child: SizedBox(
          width: finalWidth,
          child: LineChart(
            LineChartData(
              gridData: FlGridData(
                show: true,
                drawVerticalLine: false,
                horizontalInterval: maxY > 0 ? (maxY / 4) : 100,
                getDrawingHorizontalLine: (value) {
                  return const FlLine(
                    color: Color(0xFFE2E8F0),
                    strokeWidth: 1,
                    dashArray: [5, 5],
                  );
                },
              ),
              titlesData: FlTitlesData(
                show: true,
                rightTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                topTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                leftTitles:
                    const AxisTitles(sideTitles: SideTitles(showTitles: false)),
                bottomTitles: AxisTitles(
                  sideTitles: SideTitles(
                    showTitles: true,
                    reservedSize: 40,
                    interval: 1,
                    getTitlesWidget: (value, meta) {
                      // O fl_chart pode gerar valores fracionários (ex: -0.5, 0.5, 23.5)
                      // Só queremos desenhar o título nos números inteiros exatos
                      if (value % 1 != 0) return const SizedBox.shrink();

                      final int index = value.toInt();
                      if (index >= 0 && index < reversedEntries.length) {
                        return SideTitleWidget(
                          meta: meta,
                          space: 10,
                          child: Text(
                            reversedEntries[index].month,
                            style: GoogleFonts.inter(
                              color: const Color(0xFF64748B),
                              fontSize: 10,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        );
                      }
                      return const SizedBox.shrink();
                    },
                  ),
                ),
              ),
              borderData: FlBorderData(
                show: true,
                border: const Border(
                  bottom: BorderSide(color: Color(0xFFE2E8F0), width: 1),
                  left: BorderSide.none,
                  right: BorderSide.none,
                  top: BorderSide.none,
                ),
              ),
              minX: -0.5,
              maxX: reversedEntries.length - 0.5,
              minY: 0,
              maxY: maxY,
              lineBarsData: [
                LineChartBarData(
                  spots: spots,
                  isCurved: true,
                  curveSmoothness: 0.35,
                  color: const Color(0xFF155DFC), // Azul padrão da app
                  barWidth: 3,
                  isStrokeCapRound: true,
                  dotData: const FlDotData(
                    show: false, // Remover as bolas em cima de cada mês
                  ),
                  belowBarData: BarAreaData(
                    show: true,
                    gradient: LinearGradient(
                      colors: [
                        const Color(0xFF155DFC).withValues(alpha: 0.3),
                        const Color(0xFF155DFC).withValues(alpha: 0.0),
                      ],
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                    ),
                  ),
                ),
              ],
              lineTouchData: LineTouchData(
                handleBuiltInTouches: true,
                getTouchedSpotIndicator:
                    (LineChartBarData barData, List<int> spotIndexes) {
                  return spotIndexes.map((spotIndex) {
                    return TouchedSpotIndicatorData(
                      FlLine(
                        color: const Color(0xFF64748B).withValues(alpha: 0.5),
                        strokeWidth: 2,
                        dashArray: [4, 4], // Linha vertical tracejada ao tocar
                      ),
                      const FlDotData(
                        show: false, // Remove a bola ao tocar
                      ),
                    );
                  }).toList();
                },
                touchTooltipData: LineTouchTooltipData(
                  fitInsideHorizontally: true,
                  fitInsideVertically: true,
                  getTooltipColor: (LineBarSpot touchedSpot) =>
                      const Color(0xFFEFF6FF),
                  getTooltipItems: (touchedSpots) {
                    return touchedSpots.map((LineBarSpot touchedSpot) {
                      final entry = reversedEntries[touchedSpot.x.toInt()];
                      return LineTooltipItem(
                        '+${entry.points} pts\n',
                        GoogleFonts.inter(
                          color: const Color(0xFF1E40AF),
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                        ),
                        children: [
                          TextSpan(
                            text: entry.detail,
                            style: GoogleFonts.inter(
                              color: const Color(0xFF64748B),
                              fontWeight: FontWeight.normal,
                              fontSize: 10,
                            ),
                          ),
                        ],
                      );
                    }).toList();
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// RECOMMENDATIONS CAROUSEL (roxo/violeta, com dots de paginação)
// ─────────────────────────────────────────────────────────────────────────────

class _RecommendationsCarousel extends StatefulWidget {
  final List<BadgeModel> recommendations;

  const _RecommendationsCarousel({required this.recommendations});

  @override
  State<_RecommendationsCarousel> createState() =>
      _RecommendationsCarouselState();
}

class _RecommendationsCarouselState extends State<_RecommendationsCarousel> {
  int _currentPage = 0;
  final PageController _pageController = PageController();

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // 1. PROTEÇÃO DE ESTADO VAZIO: Se não há recomendações, não desenhamos a caixa roxa.
    if (widget.recommendations.isEmpty) {
      return const SizedBox.shrink();
    }

    final l10n = AppLocalizations.of(context)!;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.auto_awesome, color: Color(0xFF155DFC), size: 20),
            const SizedBox(width: 8),
            Text(
              l10n.recommendedForYou,
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF0F172B),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 240, // Altura aumentada para o novo card
          child: PageView.builder(
            controller: _pageController,
            itemCount: widget.recommendations.length,
            onPageChanged: (i) => setState(() => _currentPage = i),
            itemBuilder: (context, index) {
              final rec = widget.recommendations[index];

              // Determinar o chip da área superior (preferência vs explorada)
              final bool isPreferencia =
                  index == 0; // Exemplo simplificado, o 1º é a prefência
              final topChipLabel =
                  isPreferencia ? l10n.preferenceArea : l10n.exploredArea;
              final topChipColor = isPreferencia
                  ? const Color(0xFF155DFC)
                  : const Color(0xFF06B6D4);
              final topChipBg = isPreferencia
                  ? const Color(0xFFEFF6FF)
                  : const Color(0xFFECFEFF);

              return Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.03),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Linha de topo: Chip de Preferência e Chip de Nível
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Flexible(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: topChipBg,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                  color: topChipColor.withValues(alpha: 0.2)),
                            ),
                            child: Text(
                              topChipLabel,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: topChipColor,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Flexible(
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: Colors.white,
                              borderRadius: BorderRadius.circular(12),
                              border:
                                  Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Text(
                              l10n.levelNumber(rec.level),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: GoogleFonts.inter(
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF475569),
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    // Meio: Ícone, Título e Área
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            color: const Color(0xFFF1F5F9),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: const Color(0xFFE2E8F0)),
                          ),
                          child: Center(
                            child: BadgeLogoWidget(
                              logo: rec.logo,
                              size: 28,
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                rec.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.outfit(
                                  fontSize: 16,
                                  fontWeight: FontWeight.bold,
                                  color: const Color(0xFF0F172B),
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                rec.area,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: GoogleFonts.inter(
                                  fontSize: 12,
                                  color: const Color(0xFF64748B),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Chip de Pontos
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.star_rounded,
                              color: Color(0xFFD97706), size: 14),
                          const SizedBox(width: 4),
                          Text(
                            '${rec.points} pts',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF92400E),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const Spacer(),
                    const Divider(height: 1, color: Color(0xFFE2E8F0)),
                    const SizedBox(height: 12),

                    // Botões de Ação
                    Row(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        TextButton(
                          onPressed: () {
                            Navigator.pushNamed(context, '/badge_details',
                                arguments: rec.id);
                          },
                          style: TextButton.styleFrom(
                            backgroundColor: const Color(0xFFEFF6FF),
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            minimumSize: const Size(0, 36),
                          ),
                          child: Text(
                            l10n.viewAction,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: const Color(0xFF155DFC),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        ElevatedButton(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) =>
                                    EvidenceUploadScreen(badge: rec),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF155DFC),
                            elevation: 0,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(8)),
                            padding: const EdgeInsets.symmetric(
                                horizontal: 16, vertical: 8),
                            minimumSize: const Size(0, 36),
                          ),
                          child: Text(
                            l10n.applyAction,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 16),
        // Dots
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(widget.recommendations.length, (index) {
            final isActive = index == _currentPage;
            return AnimatedContainer(
              duration: const Duration(milliseconds: 250),
              margin: const EdgeInsets.symmetric(horizontal: 4),
              width: isActive ? 24 : 8,
              height: 8,
              decoration: BoxDecoration(
                color: isActive
                    ? const Color(0xFF155DFC)
                    : const Color(0xFFE2E8F0),
                borderRadius: BorderRadius.circular(4),
              ),
            );
          }),
        ),
      ],
    );
  }
}

/// ─────────────────────────────────────────────────────────────────────────────
// REQUISITOS & CANDIDATURAS (com cartões clicáveis individualmente)
// ─────────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// EVOLUÇÃO PROFISSIONAL (excerto da timeline, fiel ao protótipo)
// ─────────────────────────────────────────────────────────────────────────────

class _EvolucaoProfissionalSection extends StatelessWidget {
  final List<TimelineEvent> events;
  final VoidCallback onDetalhes;

  const _EvolucaoProfissionalSection(
      {required this.events, required this.onDetalhes});

  @override
  Widget build(BuildContext context) {
    const colorPrimary = Color(0xFF155DFC);
    const colorSecondary = Color(0xFF369FFF);
    final l10n = AppLocalizations.of(context)!;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: colorPrimary.withValues(alpha: 0.06),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        children: [
          // ── Cabeçalho ────────────────────────────────────────────────
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.professionalEvolutionTitle,
                style: GoogleFonts.outfit(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF1A202C),
                ),
              ),
              GestureDetector(
                onTap: onDetalhes,
                child: Row(
                  children: [
                    Text(
                      l10n.detailsAction,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                        color: colorPrimary,
                      ),
                    ),
                    const SizedBox(width: 2),
                    const Icon(Icons.chevron_right,
                        color: colorPrimary, size: 18),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // ── ESTADO VAZIO ────────────────────────────────────────────
          if (events.isEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Text(
                l10n.noProfessionalEvolution,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.grey, fontSize: 13),
              ),
            )
          else
            // ── Timeline items ─────────────────────────────────────────────
            ...events.take(4).toList().asMap().entries.map((entry) {
              final idx = entry.key;
              final event = entry.value;
              final isLast = idx == events.take(4).length - 1;

              return IntrinsicHeight(
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // ── Indicador timeline ─────────────────────────────────
                    SizedBox(
                      width: 30,
                      child: Column(
                        children: [
                          Container(
                            width: 20,
                            height: 20,
                            decoration: BoxDecoration(
                              gradient: event.isCompleted
                                  ? const LinearGradient(
                                      colors: [colorPrimary, colorSecondary],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    )
                                  : null,
                              color:
                                  event.isCompleted ? null : Colors.transparent,
                              shape: BoxShape.circle,
                              border: event.isCompleted
                                  ? Border.all(color: Colors.white, width: 3)
                                  : Border.all(
                                      color: const Color(0xFFCBD5E1), width: 2),
                              boxShadow: event.isCompleted
                                  ? [
                                      BoxShadow(
                                        color:
                                            colorPrimary.withValues(alpha: 0.3),
                                        blurRadius: 6,
                                        offset: const Offset(0, 2),
                                      ),
                                    ]
                                  : null,
                            ),
                          ),
                          if (!isLast)
                            Expanded(
                              child: Container(
                                width: 2,
                                margin: const EdgeInsets.symmetric(vertical: 4),
                                decoration: BoxDecoration(
                                  gradient: LinearGradient(
                                    begin: Alignment.topCenter,
                                    end: Alignment.bottomCenter,
                                    colors: [
                                      colorPrimary,
                                      colorSecondary.withValues(alpha: 0.15),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),

                    // ── Card do evento ─────────────────────────────────────
                    Expanded(
                      child: Padding(
                        padding: EdgeInsets.only(bottom: isLast ? 0 : 16),
                        child: GestureDetector(
                          onTap: () {
                            if (event.isSpecialBadge) {
                              Navigator.pushNamed(context, '/history',
                                  arguments: 2);
                            } else {
                              Navigator.pushNamed(context, '/badge_details',
                                  arguments: event.badgeId);
                            }
                          },
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(14),
                              border:
                                  Border.all(color: const Color(0xFFE2E8F0)),
                            ),
                            child: Row(
                              children: [
                                Container(
                                  width: 38,
                                  height: 38,
                                  decoration: BoxDecoration(
                                    color: colorPrimary.withValues(alpha: 0.12),
                                    borderRadius: BorderRadius.circular(10),
                                  ),
                                  child: Center(
                                    child: Text(
                                      event.emoji,
                                      style: const TextStyle(fontSize: 18),
                                    ),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        event.title,
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                        style: GoogleFonts.outfit(
                                          fontSize: 13,
                                          fontWeight: FontWeight.bold,
                                          color: const Color(0xFF1E293B),
                                        ),
                                      ),
                                      const SizedBox(height: 2),
                                      Row(
                                        children: [
                                          Expanded(
                                            child: Text(
                                              event.description,
                                              style: GoogleFonts.inter(
                                                fontSize: 11,
                                                color: const Color(0xFF94A3B8),
                                              ),
                                              maxLines: 2,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                          const SizedBox(width: 8),
                                          Container(
                                            padding: const EdgeInsets.symmetric(
                                                horizontal: 6, vertical: 2),
                                            decoration: BoxDecoration(
                                              color: colorPrimary.withValues(
                                                  alpha: 0.08),
                                              borderRadius:
                                                  BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              "${event.date.day.toString().padLeft(2, '0')}/${event.date.month.toString().padLeft(2, '0')}/${event.date.year}",
                                              style: GoogleFonts.inter(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                                color: colorPrimary,
                                              ),
                                            ),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              );
            }),
        ],
      ),
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECÇÃO DE OBJETIVOS ATIVOS
// ═══════════════════════════════════════════════════════════════════════════════
class _ObjetivosSection extends StatelessWidget {
  final List<ObjetivoModel> objetivos;
  final VoidCallback onAddObjetivo;
  final ValueChanged<String> onDeleteObjetivo;

  const _ObjetivosSection({
    required this.objetivos,
    required this.onAddObjetivo,
    required this.onDeleteObjetivo,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // CABEÇALHO COM BOTÕES DE AÇÃO
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              children: [
                Container(
                  width: 28,
                  height: 28,
                  decoration: BoxDecoration(
                    color: const Color(0xFF155DFC).withValues(alpha: 0.12),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.track_changes_rounded,
                      color: Color(0xFF155DFC), size: 16),
                ),
                const SizedBox(width: 8),
                Text(
                  l10n.myObjectives,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172A),
                  ),
                ),
              ],
            ),
            InkWell(
              onTap: onAddObjetivo,
              borderRadius: BorderRadius.circular(8),
              child: Container(
                width: 28,
                height: 28,
                decoration: BoxDecoration(
                  color: const Color(0xFF155DFC).withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.add_rounded,
                    color: Color(0xFF155DFC), size: 18),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        // ESTADO VAZIO (EMPTY STATE)
        if (objetivos.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.flag_circle_rounded,
                    color: Color(0xFF94A3B8), size: 40),
                const SizedBox(height: 12),
                Text(
                  l10n.noActiveObjectives,
                  style: GoogleFonts.inter(
                      color: const Color(0xFF0F172A),
                      fontSize: 14,
                      fontWeight: FontWeight.w600),
                ),
                const SizedBox(height: 4),
                Text(
                  l10n.defineNewObjective,
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(
                      color: const Color(0xFF64748B),
                      fontSize: 12,
                      height: 1.4),
                ),
                const SizedBox(height: 16),
                OutlinedButton.icon(
                  onPressed: onAddObjetivo,
                  icon: const Icon(Icons.add, size: 16),
                  label: Text(l10n.createObjectiveAction),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF155DFC),
                    side: const BorderSide(color: Color(0xFF155DFC)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                ),
              ],
            ),
          )

        // LISTA DE OBJETIVOS
        else
          ...objetivos.map((objetivo) => Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: Container(
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFE2E8F0),
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.04),
                        blurRadius: 8,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              objetivo.descricaoDinamica,
                              style: GoogleFonts.inter(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: const Color(0xFF0F172A),
                              ),
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.delete_outline,
                                color: Colors.redAccent, size: 20),
                            onPressed: () => onDeleteObjetivo(objetivo.id),
                            constraints: const BoxConstraints(),
                            padding: EdgeInsets.zero,
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      // Barra de progresso
                      Row(
                        children: [
                          Expanded(
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(4),
                              child: LinearProgressIndicator(
                                value: objetivo.progressoPercentual / 100,
                                minHeight: 8,
                                backgroundColor: const Color(0xFFF1F5F9),
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  objetivo.isConcluido
                                      ? const Color(0xFF10B981)
                                      : const Color(0xFF155DFC),
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            '${objetivo.progressoPercentual.toStringAsFixed(0)}%',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: objetivo.isConcluido
                                  ? const Color(0xFF10B981)
                                  : const Color(0xFF64748B),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            l10n.progressCurrentTarget(
                              objetivo.progressoAtual.toString(),
                              objetivo.valorAlvo.toString(),
                            ),
                            style: GoogleFonts.inter(
                                fontSize: 12, color: const Color(0xFF64748B)),
                          ),
                          if (objetivo.diasRestantes != null)
                            Text(
                              objetivo.diasRestantes! < 0
                                  ? l10n.expired
                                  : l10n.daysRemaining(objetivo.diasRestantes!),
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.w600,
                                color: objetivo.diasRestantes! < 0
                                    ? const Color(0xFFEF4444)
                                    : (objetivo.diasRestantes! < 3
                                        ? const Color(0xFFF59E0B)
                                        : const Color(0xFF64748B)),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              )),
      ],
    );
  }
}
