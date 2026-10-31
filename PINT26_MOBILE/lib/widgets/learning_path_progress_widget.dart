import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/learning_path_notifier.dart';
import 'package:projeto_pratico/widgets/donut_chart.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

import 'package:projeto_pratico/riverpood/auth_notifier.dart';

/// Widget de progresso da Learning Path para exibir na Dashboard.
/// Mostra um único donut chart da LP selecionada, com um dropdown para alternar.
class LearningPathProgressWidget extends ConsumerStatefulWidget {
  const LearningPathProgressWidget({super.key});

  @override
  ConsumerState<LearningPathProgressWidget> createState() => _LearningPathProgressWidgetState();
}

class _LearningPathProgressWidgetState extends ConsumerState<LearningPathProgressWidget> {
  int? _selectedLpId;
  bool _initialized = false;
  PageController? _pageController;
  int _currentPage = 0;

  void _initDefaultLp() {
    if (_initialized) return;
    
    final lpState = ref.read(learningPathProvider);
    if (lpState.learningPaths.isEmpty) return;

    final userAreaId = ref.read(authProvider).user?.idArea;
    if (userAreaId != null && lpState.progressoRaw != null) {
      for (var lp in lpState.progressoRaw!) {
        final sls = lp['service_lines'] as List<dynamic>? ?? [];
        for (var sl in sls) {
          final areas = sl['areas'] as List<dynamic>? ?? [];
          for (var area in areas) {
            if (area['id_area'] == userAreaId) {
              _selectedLpId = lp['id_learning_path'] as int;
              break;
            }
          }
          if (_selectedLpId != null) break;
        }
        if (_selectedLpId != null) break;
      }
    }
    
    _selectedLpId ??= lpState.learningPaths.first.idLearningPath;

    _currentPage = lpState.learningPaths.indexWhere((lp) => lp.idLearningPath == _selectedLpId);
    if (_currentPage < 0) _currentPage = 0;
    
    _pageController = PageController(initialPage: _currentPage, viewportFraction: 1);
    _initialized = true;
  }

  @override
  void dispose() {
    _pageController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final lpState = ref.watch(learningPathProvider);
    final l10n = AppLocalizations.of(context)!;

    if (lpState.isLoading) {
      return _buildLoadingCard(l10n);
    }

    if (lpState.learningPaths.isEmpty) {
      return const SizedBox.shrink();
    }

    if (!_initialized) {
      _initDefaultLp();
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Cabeçalho da secção
        Row(
          children: [
            const Icon(Icons.route_rounded, size: 20, color: Color(0xFF155DFC)),
            const SizedBox(width: 8),
            Text(
              l10n.myPath,
              style: const TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: Color(0xFF0F172B),
                fontFamily: 'Inter',
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),

        SizedBox(
          height: 310,
          child: PageView.builder(
            controller: _pageController,
            itemCount: lpState.learningPaths.length,
            onPageChanged: (i) {
              setState(() {
                _currentPage = i;
                _selectedLpId = lpState.learningPaths[i].idLearningPath;
              });
            },
            itemBuilder: (context, index) {
              final lp = lpState.learningPaths[index];
              final progress = lpState.lpProgress[lp.idLearningPath];
              
              if (progress == null) return const SizedBox.shrink();
              
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 5.0),
                child: _LearningPathCard(
                  nome: lp.nome,
                  descricao: lp.descricao,
                  progress: progress,
                  l10n: l10n,
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      '/learning_path_detail',
                      arguments: lp,
                    );
                  },
                ),
              );
            },
          ),
        ),

        if (lpState.learningPaths.length > 1)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(lpState.learningPaths.length, (index) {
                final isSelected = index == _currentPage;
                return AnimatedContainer(
                  duration: const Duration(milliseconds: 300),
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  width: isSelected ? 20 : 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: isSelected ? const Color(0xFF155DFC) : const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(4),
                  ),
                );
              }),
            ),
          ),
      ],
    );
  }

  Widget _buildLoadingCard(AppLocalizations l10n) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: const [
          BoxShadow(
              color: Color(0x0D000000), blurRadius: 12, offset: Offset(0, 4)),
        ],
      ),
      child: Column(
        children: [
          const CircularProgressIndicator(
            strokeWidth: 2,
            color: Color(0xFF155DFC),
          ),
          const SizedBox(height: 12),
          Text(
            l10n.loadingLearningPaths,
            style: const TextStyle(
              fontSize: 13,
              color: Color(0xFF94A3B8),
              fontFamily: 'Inter',
            ),
          ),
        ],
      ),
    );
  }
}

/// Card individual de uma Learning Path com donut chart
class _LearningPathCard extends StatelessWidget {
  final String nome;
  final String descricao;
  final ProgressData progress;
  final AppLocalizations l10n;
  final VoidCallback onTap;

  const _LearningPathCard({
    required this.nome,
    required this.progress,
    required this.l10n,
    required this.onTap,
    required this.descricao,
  });

  @override
  Widget build(BuildContext context) {
    final segments = [
      DonutSegment(
        label: l10n.completedLabel,
        value: progress.completedItems,
        color: const Color(0xFF10B981),
      ),
      DonutSegment(
        label: l10n.inProgressLabel,
        value: progress.inProgressItems,
        color: const Color(0xFFF59E0B),
      ),
      DonutSegment(
        label: l10n.notStartedLabel,
        value: progress.notStartedItems,
        color: const Color(0xFFE2E8F0),
      ),
    ];

    final percentText = '${progress.progressPercent.toInt()}%';

    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1),
          boxShadow: const [
            BoxShadow(
                color: Color(0x0D000000),
                blurRadius: 12,
                offset: Offset(0, 4)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Título + Seta ─────────────────────────────────────────
            Row(
              children: [
                // Ícone LP
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
                    ),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.school_rounded,
                    color: Colors.white,
                    size: 22,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        nome,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF0F172B),
                          fontFamily: 'Inter',
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        l10n.serviceLinesCount(progress.totalItems),
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF94A3B8),
                          fontFamily: 'Inter',
                        ),
                      ),
                    ],
                  ),
                ),
                const Icon(
                  Icons.chevron_right_rounded,
                  color: Color(0xFF94A3B8),
                  size: 24,
                ),
              ],
            ),
            const SizedBox(height: 20),

            // ── Donut Chart + Legenda ─────────────────────────────────
            Row(
              children: [
                DonutChart(
                  segments: segments,
                  centerText: percentText,
                  centerSubText: l10n.completedSubtext,
                  size: 120,
                  strokeWidth: 16,
                ),
                const SizedBox(width: 24),
                Expanded(
                  child: DonutLegend(segments: segments),
                ),
              ],
            ),

            // ── Descrição ─────────────────────────────────────────────
            if (descricao.isNotEmpty) ...[
              const SizedBox(height: 16),
              Text(
                descricao,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF64748B),
                  fontFamily: 'Inter',
                  height: 1.4,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
