import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/screens/history/widgets/marcos_tab_view.dart';
import 'package:projeto_pratico/screens/history/widgets/especiais_tab_view.dart';
import 'package:projeto_pratico/screens/Sharing/certificate_preview_screen.dart';
import 'package:projeto_pratico/screens/catalog/badge_details_screen.dart';
import 'package:share_plus/share_plus.dart';
import 'package:projeto_pratico/services/candidatura_service.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:projeto_pratico/widgets/badge_logo_widget.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final badgeState = ref.watch(badgeProvider);
    final completedBadges =
        badgeState.badges.where((b) => b.status == 'concluido').toList();

    final initialIndex =
        ModalRoute.of(context)?.settings.arguments as int? ?? 0;

    return DefaultTabController(
      length: 3,
      initialIndex: initialIndex,
      child: Scaffold(
        backgroundColor: const Color(0xFFF8FAFC),
        body: Column(
          children: [
            Container(
              height: MediaQuery.of(context).padding.top + 100,
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                boxShadow: [
                  BoxShadow(
                    color: Color(0x33155DFC),
                    blurRadius: 12,
                    offset: Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(height: MediaQuery.of(context).padding.top + 16),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.achievementsTitle,
                          style: GoogleFonts.inter(
                            fontSize: 20,
                            fontWeight: FontWeight.w800,
                            color: Colors.white,
                            letterSpacing: -0.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  TabBar(
                    indicatorColor: Colors.white,
                    indicatorWeight: 3,
                    labelColor: Colors.white,
                    unselectedLabelColor: Colors.white60,
                    labelStyle: GoogleFonts.inter(
                        fontWeight: FontWeight.bold, fontSize: 13),
                    unselectedLabelStyle: GoogleFonts.inter(
                        fontWeight: FontWeight.w500, fontSize: 13),
                    dividerColor: Colors.white24,
                    tabs: [
                      Tab(text: l10n.tabBadges),
                      Tab(text: l10n.tabMilestones),
                      Tab(text: l10n.tabSpecials),
                    ],
                  ),
                ],
              ),
            ),
            Expanded(
              child: TabBarView(
                children: [
                  // ── TAB BADGES ──
                  completedBadges.isEmpty
                      ? _buildEmptyState(context, l10n)
                      : ListView.separated(
                          padding: const EdgeInsets.all(20),
                          itemCount: completedBadges.length,
                          separatorBuilder: (context, index) =>
                              const SizedBox(height: 20),
                          itemBuilder: (context, index) {
                            final badge = completedBadges[index];
                            return _buildTrophyCard(context, ref, badge, l10n);
                          },
                        ),

                  // ── TAB MARCOS ──
                  const MarcosTabView(),

                  // ── TAB ESPECIAIS ──
                  const EspeciaisTabView(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context, AppLocalizations l10n) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.stars_rounded, size: 64, color: Color(0xFF94A3B8)),
            const SizedBox(height: 16),
            Text(
              l10n.noBadgesEarned,
              style: GoogleFonts.outfit(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF0F172B),
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              l10n.exploreCatalogPrompt,
              style: GoogleFonts.inter(
                fontSize: 14,
                color: const Color(0xFF64748B),
                height: 1.4,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pushNamed('/catalog');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF155DFC),
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
              child: Text(
                l10n.goToCatalog,
                style: GoogleFonts.inter(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTrophyCard(BuildContext context, WidgetRef ref, dynamic badge,
      AppLocalizations l10n) {
    String fallbackEmoji = "🏆";
    if (badge.title.toLowerCase().contains('react')) {
      fallbackEmoji = "⚛️";
    } else if (badge.title.toLowerCase().contains('node')) {
      fallbackEmoji = "🟢";
    } else if (badge.title.toLowerCase().contains('typescript')) {
      fallbackEmoji = "🟦";
    } else if (badge.title.toLowerCase().contains('javascript')) {
      fallbackEmoji = "🟨";
    }

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                BadgeDetailsScreen(badgeId: badge.id.toString()),
          ),
        );
      },
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
          boxShadow: [
            BoxShadow(
              color: const Color(0xFF155DFC).withValues(alpha: 0.06),
              blurRadius: 20,
              offset: const Offset(0, 8),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  width: 64,
                  height: 64,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(
                    color: const Color(0xFF155DFC).withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Center(
                    child: BadgeLogoWidget(
                      logo: badge.logo,
                      size: 40,
                      fallbackEmoji: fallbackEmoji,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF), // Fundo azul claro
                          borderRadius: BorderRadius.circular(6),
                          border: Border.all(
                              color: const Color(0xFF155DFC)
                                  .withValues(alpha: 0.2)),
                        ),
                        child: Text(
                          badge.level,
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF155DFC),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        badge.title,
                        style: GoogleFonts.outfit(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172B),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        badge.area,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          color: const Color(0xFF64748B),
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(color: Color(0xFFE2E8F0), height: 1),
            const SizedBox(height: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      l10n.achievementSharing,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: const Color(0xFF64748B),
                      ),
                    ),
                    Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          badge.isPublic
                              ? l10n.publicStatus
                              : l10n.privateStatus,
                          style: GoogleFonts.inter(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                            color: badge.isPublic
                                ? const Color(0xFF10B981)
                                : const Color(0xFF64748B),
                          ),
                        ),
                        Switch(
                          value: badge.isPublic,
                          activeThumbColor: const Color(0xFF10B981),
                          onChanged: (val) {
                            _handlePublicToggle(context, ref, badge, val, l10n);
                          },
                        ),
                      ],
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  physics: const BouncingScrollPhysics(),
                  child: Row(
                    children: [
                      _buildActionButton(
                        icon: Icons.remove_red_eye_rounded,
                        label: l10n.viewBadge,
                        color: const Color(0xFF155DFC),
                        onTap: () async {
                          final String uuidConsultor =
                              ref.read(authProvider).user!.id;
                          final String uuidBadge =
                              badge.idCandidatura ?? badge.id;
                          final url = Uri.parse(
                              'https://softbadge.pt/shares/$uuidConsultor/$uuidBadge');
                          await launchUrl(url,
                              mode: LaunchMode.externalApplication);
                        },
                      ),
                      const SizedBox(width: 8),
                      _buildActionButton(
                        icon: Icons.assignment_rounded,
                        label: l10n.viewCertificate,
                        color: const Color(0xFF8B5CF6),
                        onTap: () {
                          final idCand = badge.idCandidatura;
                          if (idCand != null) {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => CertificatePreviewScreen(
                                  idCandidatura: idCand.toString(),
                                ),
                              ),
                            );
                          } else {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(l10n.applicationIdNotAvailable),
                              ),
                            );
                          }
                        },
                      ),
                      const SizedBox(width: 8),
                      _buildActionButton(
                        icon: Icons.share_rounded,
                        label: l10n.shareAction,
                        color: const Color(0xFF10B981),
                        onTap: () {
                          final String uuidConsultor =
                              ref.read(authProvider).user!.id;
                          final String uuidBadge =
                              badge.idCandidatura ?? badge.id;
                          final String linkParaPartilhar =
                              'https://www.softbadge.pt/shares/$uuidConsultor/$uuidBadge';
                          SharePlus.instance.share(
                            ShareParams(
                              text: l10n.shareMessage(
                                  badge.title, linkParaPartilhar),
                              subject: l10n.shareSubject(badge.title),
                            ),
                          );
                        },
                      ),
                      const SizedBox(width: 8),
                      _buildActionButton(
                        icon: Icons.link_rounded,
                        label: l10n.linkedIn,
                        color: const Color(0xFF0A66C2),
                        onTap: () async {
                          final String uuidBadge =
                              badge.idCandidatura ?? badge.id;
                          final String encodedUrl = Uri.encodeComponent(
                              'https://softinsa.pt/badges/verify/$uuidBadge');
                          final String linkedInUrl =
                              'https://www.linkedin.com/login/?session_redirect=https%3A%2F%2Fwww.linkedin.com%2FshareArticle%2F%3Furl%3D$encodedUrl';
                          final url = Uri.parse(linkedInUrl);
                          await launchUrl(url,
                              mode: LaunchMode.externalApplication);
                        },
                      ),
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

  Future<void> _handlePublicToggle(BuildContext context, WidgetRef ref,
      dynamic badge, bool val, AppLocalizations l10n) async {
    if (!val) {
      // Turn off silently
      if (badge.idCandidatura != null) {
        final success = await CandidaturaService()
            .togglePublicSharing(badge.idCandidatura!, false);
        if (success && context.mounted) {
          ref.read(badgeProvider.notifier).loadBadgesFromApi();
        }
      }
      return;
    }

    final bool? aceitou = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text(l10n.shareTermsTitle,
            style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: FutureBuilder<String?>(
          future:
              ref.read(authProvider.notifier).fetchPoliticaRGPDCandidatura(),
          builder: (context, snapshot) {
            if (snapshot.connectionState == ConnectionState.waiting) {
              return const SizedBox(
                height: 100,
                child: Center(child: CircularProgressIndicator()),
              );
            }
            final textoRGPD = snapshot.data ?? l10n.shareTermsContent;

            return SingleChildScrollView(
              child: Text(
                textoRGPD,
                textAlign: TextAlign.justify,
                style: const TextStyle(fontSize: 14),
              ),
            );
          },
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child:
                Text(l10n.decline, style: const TextStyle(color: Colors.grey)),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF155DFC),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8)),
            ),
            child:
                Text(l10n.accept, style: const TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (aceitou == true && badge.idCandidatura != null) {
      final success = await CandidaturaService()
          .togglePublicSharing(badge.idCandidatura!, true);
      if (success && context.mounted) {
        ref.read(badgeProvider.notifier).loadBadgesFromApi();
      } else if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(l10n.publicShareError)),
        );
      }
    }
  }

  Widget _buildActionButton({
    required IconData icon,
    required String label,
    required Color color,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 6),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
