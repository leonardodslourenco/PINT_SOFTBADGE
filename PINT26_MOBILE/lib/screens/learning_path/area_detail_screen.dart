import 'package:flutter/material.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/models/badge_model.dart';
import 'package:projeto_pratico/riverpood/learning_path_notifier.dart';
import 'package:projeto_pratico/services/learning_path_service.dart';
import 'package:projeto_pratico/widgets/donut_chart.dart';

/// Página de detalhes de uma Área.
/// Mostra gráfico circular + níveis com barras de progresso + badges por nível + estatísticas.
class AreaDetailScreen extends ConsumerStatefulWidget {
  final int idArea;
  final String nome;
  final String serviceLineNome;

  const AreaDetailScreen({
    super.key,
    required this.idArea,
    required this.nome,
    required this.serviceLineNome,
  });

  @override
  ConsumerState<AreaDetailScreen> createState() => _AreaDetailScreenState();
}

class _AreaDetailScreenState extends ConsumerState<AreaDetailScreen> {
  List<ProgressData> _nivelProgress = [];
  Map<int, List<BadgeModel>> _badgesByNivel = {};
  bool _isLoading = true;

  final LearningPathService _lpService = LearningPathService();

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final notifier = ref.read(learningPathProvider.notifier);

    // 1. Progresso dos níveis
    final nivelProgress = await notifier.getNivelProgressForArea(widget.idArea);

    // 2. Badges por nível
    final niveis = await _lpService.fetchNiveisByArea(widget.idArea);
    final Map<int, List<BadgeModel>> badgesMap = {};

    for (final nivel in niveis) {
      final badges =
          await _lpService.fetchBadgesByNivel(nivel.idNivelArea);
      badgesMap[nivel.idNivelArea] = badges;
    }

    if (mounted) {
      setState(() {
        _nivelProgress = nivelProgress;
        _badgesByNivel = badgesMap;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final totalNiveis = _nivelProgress.length;
    final completedNiveis =
        _nivelProgress.where((n) => n.status == 'completo').length;
    final inProgressNiveis =
        _nivelProgress.where((n) => n.status == 'em_progresso').length;
    final notStartedNiveis =
        totalNiveis - completedNiveis - inProgressNiveis;

    final percentComplete =
        totalNiveis > 0 ? (completedNiveis / totalNiveis * 100).toInt() : 0;

    final totalBadges = _badgesByNivel.values
        .fold<int>(0, (sum, list) => sum + list.length);
    final totalBadgesGanhos = _nivelProgress.fold<int>(
        0, (sum, n) => sum + n.completedItems);

    final segments = [
      DonutSegment(
          label: 'Completos',
          value: completedNiveis,
          color: const Color(0xFF10B981)),
      DonutSegment(
          label: l10n.statusInProgress,
          value: inProgressNiveis,
          color: const Color(0xFFF59E0B)),
      DonutSegment(
          label: l10n.statusNotStartedPluralM,
          value: notStartedNiveis,
          color: const Color(0xFFE2E8F0)),
    ];

    String statusText = l10n.statusNotStarted;
    Color statusColor = const Color(0xFF64748B);
    Color statusBgColor = const Color(0xFFF1F5F9);

    if (totalNiveis > 0) {
      if (completedNiveis == totalNiveis) {
        statusText = 'Concluída';
        statusColor = const Color(0xFF10B981);
        statusBgColor = const Color(0xFFD1FAE5);
      } else if (completedNiveis > 0 || inProgressNiveis > 0) {
        statusText = l10n.statusInProgress;
        statusColor = const Color(0xFF2563EB);
        statusBgColor = const Color(0xFFDBEAFE);
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          Container(
            width: double.infinity,
            padding: EdgeInsets.only(
                top: MediaQuery.of(context).padding.top + 16,
                left: 20,
                right: 20,
                bottom: 24),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xED3B82F6), Color(0xFF2563EB)],
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                InkWell(
                  onTap: () => Navigator.pop(context),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(Icons.arrow_back_ios_new,
                          color: Colors.white, size: 16),
                      SizedBox(width: 6),
                      Text(
                        'Voltar',
                        style: TextStyle(
                            color: Colors.white,
                            fontSize: 15,
                            fontWeight: FontWeight.w500,
                            fontFamily: 'Inter'),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 72,
                      height: 72,
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        boxShadow: const [
                          BoxShadow(
                              color: Color(0x1A000000),
                              blurRadius: 10,
                              offset: Offset(0, 4)),
                        ],
                      ),
                      child: const Icon(
                        Icons.school_rounded,
                        size: 40,
                        color: Color(0xFF155DFC),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            widget.nome,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 22,
                              fontWeight: FontWeight.bold,
                              fontFamily: 'Inter',
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: statusBgColor,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  statusText,
                                  style: TextStyle(
                                      color: statusColor,
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      fontFamily: 'Inter'),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                Text(
                  widget.serviceLineNome,
                  style: const TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                    fontFamily: 'Inter',
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: _isLoading
                ? const Center(
                    child: CircularProgressIndicator(
                      color: Color(0xFF0891B2),
                      strokeWidth: 2,
                    ),
                  )
                : SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            DonutChart(
                              segments: segments,
                              centerText: '$percentComplete%',
                              centerSubText: 'concluído',
                              size: 100,
                              strokeWidth: 14,
                            ),
                            const SizedBox(width: 24),
                            DonutLegend(segments: segments),
                          ],
                        ),
                        const SizedBox(height: 30),
                        _StatsRow(
                          totalNiveis: totalNiveis,
                          totalBadges: totalBadges,
                          badgesGanhos: totalBadgesGanhos,
                        ),
                        const SizedBox(height: 24),
                        Text(
                          l10n.levelsCount(totalNiveis),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172B),
                            fontFamily: 'Inter',
                          ),
                        ),
                        const SizedBox(height: 16),
                        ..._nivelProgress.map((nivel) {
                          final badges = _badgesByNivel[nivel.id] ?? [];
                          return _NivelExpansionCard(
                            progress: nivel,
                            badges: badges,
                          );
                        }),
                        const SizedBox(height: 40),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}

// ── ESTATÍSTICAS ROW ────────────────────────────────────────────────────────

class _StatsRow extends StatelessWidget {
  final int totalNiveis;
  final int totalBadges;
  final int badgesGanhos;

  const _StatsRow({
    required this.totalNiveis,
    required this.totalBadges,
    required this.badgesGanhos,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Row(
      children: [
        _StatCard(
          icon: Icons.layers_rounded,
          label: l10n.levelsGrid,
          value: '$totalNiveis',
          color: const Color(0xFF7C3AED),
        ),
        const SizedBox(width: 10),
        _StatCard(
          icon: Icons.workspace_premium_rounded,
          label: l10n.badgesGrid,
          value: '$totalBadges',
          color: const Color(0xFFF59E0B),
        ),
        const SizedBox(width: 10),
        _StatCard(
          icon: Icons.emoji_events_rounded,
          label: l10n.earnedGrid,
          value: '$badgesGanhos',
          color: const Color(0xFF10B981),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          boxShadow: const [
            BoxShadow(
                color: Color(0x08000000),
                blurRadius: 8,
                offset: Offset(0, 2)),
          ],
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
                fontFamily: 'Inter',
              ),
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: const TextStyle(
                fontSize: 11,
                color: Color(0xFF94A3B8),
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── NÍVEL EXPANSION CARD ────────────────────────────────────────────────────

class _NivelExpansionCard extends StatefulWidget {
  final ProgressData progress;
  final List<BadgeModel> badges;

  const _NivelExpansionCard({
    required this.progress,
    required this.badges,
  });

  @override
  State<_NivelExpansionCard> createState() => _NivelExpansionCardState();
}

class _NivelExpansionCardState extends State<_NivelExpansionCard> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    Color statusColor;
    IconData statusIcon;

    switch (widget.progress.status) {
      case 'completo':
        statusColor = const Color(0xFF10B981);
        statusIcon = Icons.check_circle_rounded;
        break;
      case 'em_progresso':
        statusColor = const Color(0xFFF59E0B);
        statusIcon = Icons.timelapse_rounded;
        break;
      default:
        statusColor = const Color(0xFFCBD5E1);
        statusIcon = Icons.radio_button_unchecked;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
        boxShadow: const [
          BoxShadow(
              color: Color(0x08000000),
              blurRadius: 8,
              offset: Offset(0, 2)),
        ],
      ),
      child: Column(
        children: [
          // ── Header do nível ──────────────────────────────────────
          InkWell(
            onTap: () => setState(() => _isExpanded = !_isExpanded),
            borderRadius: BorderRadius.circular(16),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child:
                        Icon(statusIcon, color: statusColor, size: 22),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.progress.nome,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF0F172B),
                            fontFamily: 'Inter',
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          l10n.progressBadges(widget.progress.completedItems, widget.progress.totalItems),
                          style: const TextStyle(
                            fontSize: 12,
                            color: Color(0xFF94A3B8),
                            fontFamily: 'Inter',
                          ),
                        ),
                        const SizedBox(height: 6),
                        ClipRRect(
                          borderRadius: BorderRadius.circular(4),
                          child: LinearProgressIndicator(
                            value: widget.progress.totalItems > 0
                                ? widget.progress.completedItems /
                                    widget.progress.totalItems
                                : 0,
                            minHeight: 5,
                            backgroundColor: const Color(0xFFF1F5F9),
                            valueColor: AlwaysStoppedAnimation<Color>(
                                statusColor),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  AnimatedRotation(
                    turns: _isExpanded ? 0.25 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: const Icon(Icons.chevron_right_rounded,
                        color: Color(0xFFCBD5E1), size: 22),
                  ),
                ],
              ),
            ),
          ),

          // ── Badges expandidos ────────────────────────────────────
          AnimatedCrossFade(
            firstChild: const SizedBox(height: 0, width: double.infinity),
            secondChild: _buildBadgeGrid(),
            crossFadeState: _isExpanded
                ? CrossFadeState.showSecond
                : CrossFadeState.showFirst,
            duration: const Duration(milliseconds: 250),
          ),
        ],
      ),
    );
  }

  Widget _buildBadgeGrid() {
    if (widget.badges.isEmpty) {
      return const Padding(
        padding: EdgeInsets.all(16),
        child: Text(
          'Nenhum badge neste nível.',
          style: TextStyle(
            fontSize: 13,
            color: Color(0xFF94A3B8),
            fontFamily: 'Inter',
          ),
        ),
      );
    }

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.fromLTRB(16, 0, 16, 16),
      child: Wrap(
        spacing: 10,
        runSpacing: 10,
        children: widget.badges.map((badge) {
          return InkWell(
            onTap: () {
              Navigator.pushNamed(context, '/badge_details', arguments: badge.id);
            },
            borderRadius: BorderRadius.circular(12),
            child: Container(
              width: (MediaQuery.of(context).size.width - 64 - 10) / 2,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(12),
                border:
                    Border.all(color: const Color(0xFFE2E8F0), width: 1),
              ),
              child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Ícone do badge
                Container(
                  width: 36,
                  height: 36,
                  decoration: BoxDecoration(
                    color: const Color(0xFF155DFC).withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(
                    Icons.workspace_premium_rounded,
                    color: Color(0xFF155DFC),
                    size: 20,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  badge.title,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF0F172B),
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${badge.points} pontos',
                  style: const TextStyle(
                    fontSize: 11,
                    color: Color(0xFF94A3B8),
                    fontFamily: 'Inter',
                  ),
                ),
              ],
            ),
          ),
          );
        }).toList(),
      ),
    );
  }
}
