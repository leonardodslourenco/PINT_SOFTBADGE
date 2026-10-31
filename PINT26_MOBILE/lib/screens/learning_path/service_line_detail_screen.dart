import 'package:flutter/material.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/learning_path_notifier.dart';
import 'package:projeto_pratico/widgets/donut_chart.dart';

/// Página de detalhes de uma Service Line.
/// Mostra gráfico circular + lista de Áreas com progresso.
class ServiceLineDetailScreen extends ConsumerStatefulWidget {
  final int idServiceLine;
  final String nome;
  final String learningPathNome;

  const ServiceLineDetailScreen({
    super.key,
    required this.idServiceLine,
    required this.nome,
    required this.learningPathNome,
  });

  @override
  ConsumerState<ServiceLineDetailScreen> createState() =>
      _ServiceLineDetailScreenState();
}

class _ServiceLineDetailScreenState
    extends ConsumerState<ServiceLineDetailScreen> {
  List<ProgressData> _areaProgress = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final notifier = ref.read(learningPathProvider.notifier);
    final result =
        await notifier.getAreaProgressForSL(widget.idServiceLine);
    if (mounted) {
      setState(() {
        _areaProgress = result;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    final totalAreas = _areaProgress.length;
    final completedAreas =
        _areaProgress.where((a) => a.status == 'completo').length;
    final inProgressAreas =
        _areaProgress.where((a) => a.status == 'em_progresso').length;
    final notStartedAreas = totalAreas - completedAreas - inProgressAreas;

    final percentComplete =
        totalAreas > 0 ? (completedAreas / totalAreas * 100).toInt() : 0;

    final segments = [
      DonutSegment(
          label: 'Completas',
          value: completedAreas,
          color: const Color(0xFF10B981)),
      DonutSegment(
          label: l10n.statusInProgress,
          value: inProgressAreas,
          color: const Color(0xFFF59E0B)),
      DonutSegment(
          label: l10n.statusNotStartedPlural,
          value: notStartedAreas,
          color: const Color(0xFFE2E8F0)),
    ];

    String statusText = l10n.statusNotStarted;
    Color statusColor = const Color(0xFF64748B);
    Color statusBgColor = const Color(0xFFF1F5F9);

    if (totalAreas > 0) {
      if (completedAreas == totalAreas) {
        statusText = 'Concluído';
        statusColor = const Color(0xFF10B981);
        statusBgColor = const Color(0xFFD1FAE5);
      } else if (completedAreas > 0 || inProgressAreas > 0) {
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
                        Icons.layers_rounded,
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
                  widget.learningPathNome,
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
                      color: Color(0xFF155DFC),
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
                        Text(
                          l10n.areasCount(totalAreas),
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF0F172B),
                            fontFamily: 'Inter',
                          ),
                        ),
                        const SizedBox(height: 16),
                        ..._areaProgress.map((area) => _AreaCard(
                              progress: area,
                              onTap: () {
                                Navigator.pushNamed(
                                  context,
                                  '/area_detail',
                                  arguments: {
                                    'idArea': area.id,
                                    'nome': area.nome,
                                    'serviceLineNome': widget.nome,
                                  },
                                );
                              },
                            )),
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

class _AreaCard extends StatelessWidget {
  final ProgressData progress;
  final VoidCallback onTap;

  const _AreaCard({required this.progress, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    Color statusColor;
    IconData statusIcon;
    String statusLabel;

    switch (progress.status) {
      case 'completo':
        statusColor = const Color(0xFF10B981);
        statusIcon = Icons.check_circle_rounded;
        statusLabel = 'Completa';
        break;
      case 'em_progresso':
        statusColor = const Color(0xFFF59E0B);
        statusIcon = Icons.timelapse_rounded;
        statusLabel = l10n.statusInProgress;
        break;
      default:
        statusColor = const Color(0xFFCBD5E1);
        statusIcon = Icons.radio_button_unchecked;
        statusLabel = l10n.statusNotStarted;
    }

    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: progress.status == 'completo'
                ? const Color(0xFF10B981).withValues(alpha: 0.3)
                : const Color(0xFFE2E8F0),
            width: 1.5,
          ),
          boxShadow: const [
            BoxShadow(
                color: Color(0x08000000),
                blurRadius: 8,
                offset: Offset(0, 2)),
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 44,
              height: 44,
              decoration: BoxDecoration(
                color: statusColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Icon(statusIcon, color: statusColor, size: 24),
            ),
            const SizedBox(width: 14),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    progress.nome,
                    style: const TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF0F172B),
                      fontFamily: 'Inter',
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        statusLabel,
                        style: TextStyle(
                          fontSize: 12,
                          color: statusColor,
                          fontWeight: FontWeight.w500,
                          fontFamily: 'Inter',
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        l10n.progressLevels(progress.completedItems, progress.totalItems),
                        style: const TextStyle(
                          fontSize: 12,
                          color: Color(0xFF94A3B8),
                          fontFamily: 'Inter',
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: progress.totalItems > 0
                          ? progress.completedItems / progress.totalItems
                          : 0,
                      minHeight: 6,
                      backgroundColor: const Color(0xFFF1F5F9),
                      valueColor:
                          AlwaysStoppedAnimation<Color>(statusColor),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right_rounded,
                color: Color(0xFFCBD5E1), size: 22),
          ],
        ),
      ),
    );
  }
}
