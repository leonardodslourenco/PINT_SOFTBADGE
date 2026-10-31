import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../riverpood/dashboard_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';
import '../screens/dashboard/ranking_screen.dart';

class DashboardMetricsGridWidget extends StatelessWidget {
  final DashboardMetrics metrics;

  const DashboardMetricsGridWidget({
    super.key,
    required this.metrics,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Column(
      children: [
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                title: l10n.dashboardBadges,
                value: metrics.totalBadges.toString(),
                growth: metrics.badgesGrowth,
                iconData: Icons.workspace_premium_outlined,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: _MetricCard(
                title: l10n.dashboardAccumulatedPoints,
                value: metrics.totalPoints.toString(),
                valueSuffix: ' ${l10n.dashboardPointsUnit}',
                growth: metrics.pointsGrowth,
                iconData: Icons.stars_rounded,
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _MetricCard(
                title: l10n.dashboardApplications,
                value: metrics.totalCandidaturas.toString(),
                growth: metrics.candidaturasGrowth,
                iconData: Icons.folder_open_rounded,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: GestureDetector(
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const RankingScreen()),
                  );
                },
                child: _MetricCard(
                  title: l10n.dashboardRanking,
                  value: '${metrics.rankingPosition}º',
                  growth: null, // Sem histórico de ranking para calcular
                  iconData: Icons.leaderboard_outlined,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String? valueSuffix;
  final int? growth;
  final IconData iconData;

  const _MetricCard({
    required this.title,
    required this.value,
    this.valueSuffix,
    this.growth,
    required this.iconData,
  });

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    // Definir as cores com base no crescimento
    final isPositive = (growth ?? 0) >= 0;
    final growthBgColor = isPositive ? const Color(0xFFDCFCE7) : const Color(0xFFFEE2E2);
    final growthTextColor = isPositive ? const Color(0xFF166534) : const Color(0xFF991B1B);
    final growthIcon = isPositive ? Icons.arrow_outward_rounded : Icons.south_east_rounded;
    final growthText = isPositive ? '+$growth%' : '$growth%';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Icon & Title
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: const BoxDecoration(
                  color: Color(0xFFEFF6FF),
                  shape: BoxShape.circle,
                ),
                child: Icon(iconData, color: const Color(0xFF2563EB), size: 24),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.only(top: 4.0),
                  child: SizedBox(
                    height: 34, // Altura exata para 2 linhas (14 * 1.2 * 2 = 33.6)
                    child: Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF334155),
                        height: 1.2,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // Value & Growth
          Row(
            crossAxisAlignment: CrossAxisAlignment.end,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  alignment: Alignment.centerLeft,
                  child: RichText(
                    text: TextSpan(
                      children: [
                        TextSpan(
                          text: value,
                          style: GoogleFonts.outfit(
                            fontSize: 28,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF0F172B),
                          ),
                        ),
                        if (valueSuffix != null)
                          TextSpan(
                            text: valueSuffix,
                            style: GoogleFonts.inter(
                              fontSize: 14,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF0F172B),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
              ),
              if (growth != null)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: growthBgColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(growthIcon, color: growthTextColor, size: 12),
                          const SizedBox(width: 2),
                          Text(
                            growthText,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: growthTextColor,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      l10n.dashboardVsPreviousMonth,
                      style: GoogleFonts.inter(
                        fontSize: 10,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
            ],
          ),
          
        ],
      ),
    );
  }
}
