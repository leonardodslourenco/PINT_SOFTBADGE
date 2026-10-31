import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';
import 'package:projeto_pratico/models/badge_model.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:projeto_pratico/config/api_config.dart';

class CandidaturaDetailsScreen extends ConsumerStatefulWidget {
  final String idCandidatura;

  const CandidaturaDetailsScreen({super.key, required this.idCandidatura});

  @override
  ConsumerState<CandidaturaDetailsScreen> createState() => _CandidaturaDetailsScreenState();
}

class _CandidaturaDetailsScreenState extends ConsumerState<CandidaturaDetailsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final badgeState = ref.read(badgeProvider);
      final candidatura = badgeState.minhasCandidaturas.firstWhere(
        (c) => c.idCandidatura == widget.idCandidatura,
        orElse: () => throw Exception('Candidatura não encontrada'),
      );
      if (candidatura.badge != null) {
        ref.read(badgeProvider.notifier).carregarRequisitosBadge(candidatura.badge!.id, candidatura.badge!.level);
      }
    });
  }

  Future<void> _openFile(String path) async {
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    final url = Uri.parse('${ApiConfig.baseUrl}/$cleanPath');
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('Error launching URL: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(AppLocalizations.of(context)!.errorGeneral('Could not launch URL'))),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final badgeState = ref.watch(badgeProvider);
    final l10n = AppLocalizations.of(context)!;

    final candidatura = badgeState.minhasCandidaturas.firstWhere(
      (c) => c.idCandidatura == widget.idCandidatura,
    );

    final badge = candidatura.badge;
    final globalBadge = badge != null 
        ? badgeState.badges.firstWhere((b) => b.id == badge.id, orElse: () => badge)
        : null;

    final title = badge?.title ?? l10n.unknownBadge;
    final area = badge?.area ?? l10n.noArea;
    final description = badge?.description ?? l10n.noDescriptionAvailable;
    final evidencias = candidatura.evidencias;

    String statusText;
    Color statusTextColor;

    switch (candidatura.idEstadoCandidatura) {
      case 1:
        statusText = l10n.statusDraft;
        statusTextColor = const Color(0xFF64748B);
        break;
      case 2:
        statusText = l10n.statusSubmitted;
        statusTextColor = const Color(0xFFD97706);
        break;
      case 3:
        statusText = l10n.statusInValidation;
        statusTextColor = const Color(0xFF2563EB);
        break;
      case 4:
        statusText = l10n.statusApproved;
        statusTextColor = const Color(0xFF16A34A);
        break;
      case 5:
        statusText = l10n.statusRejectedCancelled;
        statusTextColor = const Color(0xFFDC2626);
        break;
      default:
        statusText = candidatura.estadoLabel;
        statusTextColor = const Color(0xFF64748B);
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          // ── HEADER COM GRADIENTE ──
          Container(
            width: double.infinity,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
              ),
            ),
            child: SafeArea(
              bottom: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
                    child: Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 22),
                          onPressed: () => Navigator.pop(context),
                        ),
                        const SizedBox(width: 4),
                        Expanded(
                          child: Text(
                            l10n.applicationDetailsTitle,
                            style: GoogleFonts.inter(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600),
                          ),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.20),
                            borderRadius: BorderRadius.circular(20),
                            border: Border.all(color: Colors.white.withValues(alpha: 0.40)),
                          ),
                          child: Text(
                            statusText,
                            style: GoogleFonts.inter(color: Colors.white, fontSize: 11, fontWeight: FontWeight.w600),
                          ),
                        ),
                        const SizedBox(width: 8),
                      ],
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.fromLTRB(16, 4, 16, 20),
                    child: Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white.withValues(alpha: 0.20),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: Colors.white.withValues(alpha: 0.30), width: 1.5),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Container(
                            width: 44,
                            height: 44,
                            alignment: Alignment.center,
                            decoration: BoxDecoration(
                              color: Colors.white.withValues(alpha: 0.30),
                              borderRadius: BorderRadius.circular(10),
                            ),
                            child: Text(
                              title.isNotEmpty ? title.substring(0, 1).toUpperCase() : 'B',
                              style: const TextStyle(color: Colors.white, fontSize: 18, fontFamily: 'Inter', fontWeight: FontWeight.w700),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(title, style: const TextStyle(color: Colors.white, fontSize: 16, fontFamily: 'Inter', fontWeight: FontWeight.w600)),
                                const SizedBox(height: 6),
                                Text(
                                  description,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(color: Colors.white.withValues(alpha: 0.80), fontSize: 12, fontFamily: 'Inter', height: 1.4),
                                ),
                                const SizedBox(height: 10),
                                Wrap(
                                  spacing: 8,
                                  runSpacing: 6,
                                  children: [
                                    _buildTag(area),
                                    _buildTag('${badge?.points ?? 0} pts'),
                                  ],
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // ── CORPO SCROLLÁVEL ──
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.assignment_outlined, size: 20, color: Color(0xFF0F172B)),
                      const SizedBox(width: 8),
                      Text(
                        l10n.submissionRequirementsTitle,
                        style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172B)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  if (globalBadge != null && !globalBadge.isRequirementsLoaded)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Column(
                          children: [
                            const CircularProgressIndicator(color: Color(0xFF155DFC)),
                            const SizedBox(height: 16),
                            Text(l10n.loadingRequirements, style: GoogleFonts.inter(color: Colors.grey.shade600)),
                          ],
                        ),
                      ),
                    )
                  else if (evidencias.isEmpty)
                    Center(
                      child: Padding(
                        padding: const EdgeInsets.all(32.0),
                        child: Text(l10n.noEvidenceSubmitted, style: GoogleFonts.inter(color: Colors.grey.shade600)),
                      ),
                    )
                  else
                    ...evidencias.map((ev) {
                      // Tenta encontrar o requisito correspondente a esta evidência
                      final req = globalBadge?.requirements.firstWhere(
                        (r) => r.code == ev.idRequisitoNivel.toString(),
                        orElse: () => RequirementModel(
                          code: ev.idRequisitoNivel.toString(),
                          title: title, // Fallback para o nome do badge se não encontrar
                          subtitle: '',
                          description: '',
                          status: RequirementStatus.disponivel,
                        ),
                      );

                      final reqTitle = req?.title ?? title;

                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(color: Colors.black.withValues(alpha: 0.02), blurRadius: 4, offset: const Offset(0, 2)),
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
                                    reqTitle,
                                    style: GoogleFonts.outfit(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF0F172B)),
                                  ),
                                ),
                                if (req?.obrigatorio ?? false)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFFEE2E2),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      l10n.mandatory,
                                      style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: const Color(0xFFDC2626)),
                                    ),
                                  ),
                              ],
                            ),
                            const SizedBox(height: 6),
                            Text(
                              l10n.practicalCompetenceDemo(reqTitle),
                              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF475569)),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              l10n.evidencePresentedForProof,
                              style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8)),
                            ),
                            const SizedBox(height: 16),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
                              decoration: BoxDecoration(
                                color: const Color(0xFFF8FAFC),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: const Color(0xFFCBD5E1)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.check_circle_rounded, color: Color(0xFF10B981), size: 20),
                                  const SizedBox(width: 8),
                                  Expanded(
                                    child: Text(
                                      ev.nomeFicheiro,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w500, color: const Color(0xFF0F172B)),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  if (ev.urlFicheiro.isNotEmpty)
                                    IconButton(
                                      icon: const Icon(Icons.open_in_new, color: Color(0xFF155DFC)),
                                      onPressed: () => _openFile(ev.urlFicheiro),
                                    ),
                                  // Botão "Alterar" só disponível em Rascunho
                                  if (candidatura.idEstadoCandidatura == 1)
                                    OutlinedButton(
                                      onPressed: () {},
                                      style: OutlinedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 12),
                                        minimumSize: const Size(0, 32),
                                        side: const BorderSide(color: Color(0xFFCBD5E1)),
                                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                      ),
                                      child: Text(l10n.changeButton, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF64748B))),
                                    ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    }),
                ],
              ),
            ),
          ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Colors.grey.shade200)),
        ),
        child: SafeArea(
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  l10n.currentState(statusText),
                  style: GoogleFonts.inter(fontSize: 12, color: statusTextColor, fontWeight: FontWeight.w600),
                ),
              ),
              OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  side: const BorderSide(color: Color(0xFFCBD5E1)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                ),
                child: Text(l10n.closeButton, style: GoogleFonts.inter(fontSize: 13, fontWeight: FontWeight.w600, color: const Color(0xFF475569))),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.20),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 11, fontFamily: 'Inter', fontWeight: FontWeight.w500)),
    );
  }
}
