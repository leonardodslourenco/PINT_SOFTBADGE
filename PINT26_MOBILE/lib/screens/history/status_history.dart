import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart'; // Ajusta o caminho do teu provider se necessário
import 'package:projeto_pratico/models/candidatura_model.dart';
import 'package:projeto_pratico/screens/renewals/renew_management_screen.dart';
import 'package:projeto_pratico/screens/catalog/evidence_upload_screen.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class StatusHistoryScreen extends ConsumerStatefulWidget {
  const StatusHistoryScreen({super.key});

  @override
  ConsumerState<StatusHistoryScreen> createState() =>
      _StatusHistoryScreenState();
}

class _StatusHistoryScreenState extends ConsumerState<StatusHistoryScreen> {
  @override
  void initState() {
    super.initState();
    // Atualiza automaticamente os pedidos assim que a tela abre
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(badgeProvider.notifier).loadBadgesFromApi();
    });
  }

  Future<void> _refresh() async {
    await ref.read(badgeProvider.notifier).loadBadgesFromApi();
  }

  @override
  Widget build(BuildContext context) {
    // 1. Observamos o estado global através do Riverpod para obter os dados reais da BD/API
    final badgeState = ref.watch(badgeProvider);
    final List<CandidaturaModel> todasAsCandidaturas =
        badgeState.minhasCandidaturas;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC), // Fundo cinza super claro
      body: Column(
        children: [
          Container(
            height: MediaQuery.of(context).padding.top + 60,
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
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.applicationStatusTitle,
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                      Row(
                        children: [
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.refresh_rounded,
                                  color: Colors.white, size: 20),
                              tooltip: l10n.refreshRequests,
                              onPressed: _refresh,
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            width: 36,
                            height: 36,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.15),
                              shape: BoxShape.circle,
                            ),
                            child: IconButton(
                              icon: const Icon(Icons.autorenew_rounded,
                                  color: Colors.white, size: 20),
                              tooltip: l10n.renewalsManagement,
                              onPressed: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) =>
                                        const RenewManagementScreen(),
                                  ),
                                );
                              },
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const Spacer(),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: _refresh,
              child: todasAsCandidaturas.isEmpty
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.6,
                          child: Center(
                            child: Text(
                              l10n.noApplicationsPullToRefresh,
                              textAlign: TextAlign.center,
                              style: GoogleFonts.inter(
                                  color: Colors.grey.shade600, fontSize: 14),
                            ),
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      physics: const AlwaysScrollableScrollPhysics(),
                      padding: const EdgeInsets.all(16),
                      itemCount: todasAsCandidaturas.length,
                      itemBuilder: (context, index) {
                        final candidatura = todasAsCandidaturas[index];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: InkWell(
                            borderRadius: BorderRadius.circular(14),
                            onTap: () {
                              if (candidatura.idEstadoCandidatura == 1 &&
                                  candidatura.badge != null) {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => EvidenceUploadScreen(
                                        badge: candidatura.badge!),
                                  ),
                                );
                              } else {
                                Navigator.pushNamed(
                                  context,
                                  '/candidatura_details',
                                  arguments: candidatura.idCandidatura,
                                );
                              }
                            },
                            child: _CandidaturaHistoryCard(item: candidatura),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENTE DE CARTÃO COM O MESMO ESTILO DO DASHBOARD E REGRAS DE VALIDAÇÃO
// ─────────────────────────────────────────────────────────────────────────────

class _CandidaturaHistoryCard extends StatelessWidget {
  final CandidaturaModel item;

  const _CandidaturaHistoryCard({required this.item});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    Color statusColor;
    Color statusBg;
    IconData icon;
    Color iconColor;
    Color borderColor;
    String statusText;

    // Mapeamento dos 5 estados oficiais do backend:
    // 1: Aberto / Rascunho, 2: Submetida, 3: Em Validação, 4: Aprovado, 5: Rejeitado / Cancelado
    switch (item.idEstadoCandidatura) {
      case 1:
        statusText = l10n.statusDraft;
        borderColor = const Color(0xFFCBD5E1); // bg-slate-300
        statusColor = const Color(0xFF475569);
        statusBg = const Color(0xFFF1F5F9);
        icon = Icons.edit_note_rounded;
        iconColor = const Color(0xFF475569);
        break;
      case 2:
        statusText = l10n.statusSubmitted;
        borderColor = const Color(0xFFF59E0B);
        statusColor = const Color(0xFFD97706);
        statusBg = const Color(0xFFFEF3C7);
        icon = Icons.schedule_rounded;
        iconColor = const Color(0xFFD97706);
        break;
      case 3:
        statusText = l10n.statusInValidation;
        borderColor = const Color(0xFF3B82F6);
        statusColor = const Color(0xFF2563EB);
        statusBg = const Color(0xFFDBEAFE);
        icon = Icons.hourglass_top_rounded;
        iconColor = const Color(0xFF2563EB);
        break;
      case 4:
        statusText = l10n.statusApproved;
        borderColor = const Color(0xFF10B981); // emerald-500
        statusColor = const Color(0xFF10B981);
        statusBg = const Color(0xFFECFDF5); // emerald-50
        icon = Icons.check_circle_outline;
        iconColor = const Color(0xFF10B981);
        break;
      case 5:
        statusText = l10n.statusRejectedCancelled;
        borderColor = const Color(0xFFEF4444);
        statusColor = const Color(0xFFDC2626);
        statusBg = const Color(0xFFFEE2E2);
        icon = Icons.highlight_off_rounded;
        iconColor = const Color(0xFFDC2626);
        break;
      default:
        statusText = item.estadoLabel;
        borderColor = const Color(0xFFCBD5E1);
        statusColor = const Color(0xFF64748B);
        statusBg = const Color(0xFFF8FAFC);
        icon = Icons.info_outline;
        iconColor = const Color(0xFF64748B);
    }

    final badge = item.badge;
    final badgeTitle = badge?.title ?? l10n.noTitle;
    final area = badge?.area ?? l10n.noArea;

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(14),
        border: Border(
          left: BorderSide(color: borderColor, width: 4),
        ),
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
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  badgeTitle,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.outfit(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1E293B),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: statusBg,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(icon, color: iconColor, size: 14),
                    const SizedBox(width: 4),
                    Text(
                      statusText,
                      style: TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.bold,
                        color: statusColor,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              const Icon(Icons.category_rounded,
                  size: 14, color: Color(0xFF64748B)),
              const SizedBox(width: 4),
              Text(
                area,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: const Color(0xFF64748B),
                ),
              ),
              const Spacer(),
              const Icon(Icons.calendar_today_rounded,
                  size: 14, color: Color(0xFF64748B)),
              const SizedBox(width: 4),
              Text(
                item.dataCandidatura.toLocal().toString().split(' ')[0],
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: const Color(0xFF64748B),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(height: 1, color: Color(0xFFE2E8F0)),
          const SizedBox(height: 12),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              Text(
                l10n.viewDetails,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF155DFC),
                ),
              ),
              const SizedBox(width: 4),
              const Icon(Icons.arrow_forward_ios_rounded,
                  size: 12, color: Color(0xFF155DFC)),
            ],
          ),
        ],
      ),
    );
  }
}
