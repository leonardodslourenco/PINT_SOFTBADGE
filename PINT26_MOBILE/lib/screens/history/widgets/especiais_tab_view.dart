import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:projeto_pratico/models/conquista_especial_model.dart';
import 'package:projeto_pratico/models/badge_especial_model.dart';
import 'package:projeto_pratico/services/metricas_service.dart';
import 'package:projeto_pratico/config/api_config.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';
import 'package:share_plus/share_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/auth_notifier.dart';

class EspeciaisTabView extends ConsumerStatefulWidget {
  const EspeciaisTabView({super.key});

  @override
  ConsumerState<EspeciaisTabView> createState() => _EspeciaisTabViewState();
}

class _EspeciaisTabViewState extends ConsumerState<EspeciaisTabView> {
  final MetricasService _metricasService = MetricasService();
  bool _isLoading = true;
  bool _showingAlcancados = true;
  String _errorMessage = '';

  List<ConquistaEspecialModel> _candidaturas = [];
  List<BadgeEspecialModel> _catalogo = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });
    try {
      final results = await Future.wait([
        _metricasService.fetchConquistasEspeciais(),
        _metricasService.fetchCatalogoBadgesEspeciais(),
      ]);

      if (mounted) {
        setState(() {
          _candidaturas = results[0] as List<ConquistaEspecialModel>;
          _catalogo = results[1] as List<BadgeEspecialModel>;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _isLoading = false;
        });
      }
    }
  }

  // Verifica a candidatura do utilizador para um badge do catálogo
  ConquistaEspecialModel? _findUserCandidatura(BadgeEspecialModel badge) {
    for (final c in _candidaturas) {
      if (c.idConquistaEspecial != null &&
          c.idConquistaEspecial == badge.idConquistaEspecial) {
        return c;
      }
      if (c.badgeTitulo.trim().toLowerCase() ==
          badge.titulo.trim().toLowerCase()) {
        return c;
      }
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_errorMessage.isNotEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              Text(
                _errorMessage,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: Colors.red, fontSize: 14),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: _loadData,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF155DFC),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(10)),
                ),
                child: Text(l10n.tryAgain,
                    style: const TextStyle(color: Colors.white)),
              ),
            ],
          ),
        ),
      );
    }

    // Contagens
    final alcancadosCount =
        _candidaturas.where((c) => c.idEstado == 2).length;
    final disponiveisCount = _catalogo.where((badge) {
      final userCand = _findUserCandidatura(badge);
      return userCand == null || userCand.idEstado == 3;
    }).length;

    return Column(
      children: [
        // ── TOGGLE BAR (Idêntico ao MarcosTabView) ──
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 12),
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.02),
                  blurRadius: 8,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              children: [
                Expanded(
                  child: _buildToggleButton(
                    title: l10n.achieved,
                    count: alcancadosCount,
                    isActive: _showingAlcancados,
                    onTap: () => setState(() => _showingAlcancados = true),
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: _buildToggleButton(
                    title: l10n.available,
                    count: disponiveisCount,
                    isActive: !_showingAlcancados,
                    icon: Icons.auto_awesome,
                    onTap: () => setState(() => _showingAlcancados = false),
                  ),
                ),
              ],
            ),
          ),
        ),

        // ── LISTA DE CONTEÚDO (Alcançados vs Disponíveis) ──
        Expanded(
          child: _showingAlcancados
              ? _buildAlcancadosList(l10n)
              : _buildDisponiveisList(l10n),
        ),
      ],
    );
  }

  Widget _buildToggleButton({
    required String title,
    required int count,
    required bool isActive,
    IconData? icon,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        decoration: BoxDecoration(
          color: isActive ? const Color(0xFF155DFC) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon,
                  size: 16,
                  color: isActive ? Colors.white : const Color(0xFF64748B)),
              const SizedBox(width: 4),
            ] else if (!isActive) ...[
              const Icon(Icons.emoji_events,
                  size: 16, color: Color(0xFFEF4444)),
              const SizedBox(width: 4),
            ],
            Flexible(
              child: Text(
                title,
                style: GoogleFonts.inter(
                  color: isActive ? Colors.white : const Color(0xFF64748B),
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                color: isActive
                    ? Colors.white.withValues(alpha: 0.2)
                    : const Color(0xFFF1F5F9),
                shape: BoxShape.circle,
              ),
              child: Text(
                count.toString(),
                style: GoogleFonts.inter(
                  color: isActive ? Colors.white : const Color(0xFF64748B),
                  fontWeight: FontWeight.bold,
                  fontSize: 11,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ── VISTA ALCANÇADOS (Minhas Candidaturas) ──
  Widget _buildAlcancadosList(AppLocalizations l10n) {
    final candidaturasValidas = _candidaturas.where((c) => c.idEstado != 3).toList();

    if (candidaturasValidas.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.stars_rounded, size: 64, color: Color(0xFF94A3B8)),
              const SizedBox(height: 16),
              Text(
                l10n.noSpecialBadgeApplications,
                style: GoogleFonts.outfit(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF0F172B),
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                l10n.exploreSpecialBadgesPrompt,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: const Color(0xFF64748B),
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      itemCount: candidaturasValidas.length,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final item = candidaturasValidas[index];
        return _buildAlcancadoCard(item, l10n);
      },
    );
  }

  Widget _buildAlcancadoCard(ConquistaEspecialModel item, AppLocalizations l10n) {
    final logoUrl = item.logoConquista != null && item.logoConquista!.isNotEmpty
        ? '${ApiConfig.baseUrl}/uploads/logo_especial/${item.logoConquista}'
        : null;

    final isApproved = item.idEstado == 2;
    final isPending = item.idEstado == 1;
    final isRejected = item.idEstado == 3;

    Color statusColor;
    Color statusBg;
    String statusText;
    IconData statusIcon;

    if (isApproved) {
      statusColor = const Color(0xFF16A34A);
      statusBg = const Color(0xFFDCFCE7);
      statusText = l10n.statusConquered;
      statusIcon = Icons.check_circle_outline;
    } else if (isPending) {
      statusColor = const Color(0xFFD97706);
      statusBg = const Color(0xFFFEF3C7);
      statusText = l10n.statusUnderAnalysis;
      statusIcon = Icons.hourglass_top_rounded;
    } else if (isRejected) {
      statusColor = const Color(0xFFDC2626);
      statusBg = const Color(0xFFFEE2E2);
      statusText = l10n.statusRejected;
      statusIcon = Icons.cancel_outlined;
    } else {
      statusColor = const Color(0xFF64748B);
      statusBg = const Color(0xFFF1F5F9);
      statusText = l10n.statusSubmitted;
      statusIcon = Icons.info_outline;
    }

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF155DFC).withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Container(
                width: 60,
                height: 60,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: logoUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.network(
                          logoUrl,
                          width: 60,
                          height: 60,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) =>
                              const Icon(Icons.star,
                                  color: Color(0xFFF59E0B), size: 30),
                        ),
                      )
                    : const Icon(Icons.star,
                        color: Color(0xFFF59E0B), size: 30),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Estado e Bónus
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: statusBg,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(statusIcon, size: 12, color: statusColor),
                              const SizedBox(width: 4),
                              Text(
                                statusText,
                                style: GoogleFonts.inter(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: statusColor,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFFBEB),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFFCD34D)),
                          ),
                          child: Text(
                            '+${item.pontosBonus} pts',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFFD97706),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      item.badgeTitulo,
                      style: GoogleFonts.outfit(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF0F172B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Motivo da recusa se houver
          if (isRejected &&
              item.motivoRecusa != null &&
              item.motivoRecusa!.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Text(
                '${l10n.reasonPrefix}${item.motivoRecusa}',
                style: GoogleFonts.inter(
                    fontSize: 12, color: const Color(0xFF991B1B)),
              ),
            ),
          ],

          // Comprovativo (link)
          if (item.urlComprovativo != null &&
              item.urlComprovativo!.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            InkWell(
              onTap: () async {
                final url = Uri.parse(item.urlComprovativo!.trim());
                if (await canLaunchUrl(url)) {
                  await launchUrl(url, mode: LaunchMode.externalApplication);
                }
              },
              borderRadius: BorderRadius.circular(8),
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.link, size: 14, color: Color(0xFF155DFC)),
                    const SizedBox(width: 6),
                    Flexible(
                      child: Text(
                        l10n.viewProof,
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: const Color(0xFF155DFC),
                          fontWeight: FontWeight.bold,
                        ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],

          // Partilha Pública (Apenas se aprovado)
          if (isApproved) ...[
            const SizedBox(height: 14),
            const Divider(color: Color(0xFFE2E8F0), height: 1),
            const SizedBox(height: 10),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  l10n.publicProfileSharing,
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
                      item.rgpdPartilhaConquista ? l10n.statusActive : l10n.statusInactive,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        fontWeight: FontWeight.bold,
                        color: item.rgpdPartilhaConquista
                            ? const Color(0xFF10B981)
                            : const Color(0xFF64748B),
                      ),
                    ),

                    Switch(
                      value: item.rgpdPartilhaConquista,
                      activeThumbColor: const Color(0xFF10B981),
                      onChanged: (val) async {
                        if (val) {
                          final bool? aceitou = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: Text(l10n.shareTermsTitle,
                                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
                              content: FutureBuilder<String?>(
                                future: ref.read(authProvider.notifier).fetchPoliticaRGPDCandidatura(),
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
                                  child: Text(l10n.decline, style: const TextStyle(color: Colors.grey)),
                                ),
                                ElevatedButton(
                                  onPressed: () => Navigator.pop(ctx, true),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF155DFC),
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                  ),
                                  child: Text(l10n.accept, style: const TextStyle(color: Colors.white)),
                                ),
                              ],
                            ),
                          );

                          if (aceitou != true) return;
                        }

                        final success = await _metricasService
                            .togglePublicSharingEspecial(
                                item.idCandidaturaEspecial, val);
                        if (success && mounted) {
                          setState(() {
                            final idx = _candidaturas.indexWhere((c) =>
                                c.idCandidaturaEspecial ==
                                item.idCandidaturaEspecial);
                            if (idx != -1) {
                              _candidaturas[idx] = ConquistaEspecialModel(
                                idConquistaEspecial:
                                    _candidaturas[idx].idConquistaEspecial,
                                idCandidaturaEspecial:
                                    _candidaturas[idx].idCandidaturaEspecial,
                                logoConquista: _candidaturas[idx].logoConquista,
                                badgeTitulo: _candidaturas[idx].badgeTitulo,
                                pontosBonus: _candidaturas[idx].pontosBonus,
                                dataCandidatura:
                                    _candidaturas[idx].dataCandidatura,
                                urlComprovativo:
                                    _candidaturas[idx].urlComprovativo,
                                ficheiroComprovativo:
                                    _candidaturas[idx].ficheiroComprovativo,
                                idEstado: _candidaturas[idx].idEstado,
                                motivoRecusa: _candidaturas[idx].motivoRecusa,
                                rgpdPartilhaConquista: val,
                                publicUrl: _candidaturas[idx].publicUrl,
                              );
                            }
                          });
                        }
                      },
                    ),
                  ],
                ),
              ],
            ),
            if (item.rgpdPartilhaConquista) ...[
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
                        final String uuidConsultor = ref.read(authProvider).user?.id ?? '';
                        final fullUrl = 'https://www.softbadge.pt/shares/$uuidConsultor/${item.idCandidaturaEspecial}?tipo=especial';
                        final url = Uri.parse(fullUrl);
                        await launchUrl(url, mode: LaunchMode.externalApplication);
                      },
                    ),
                    const SizedBox(width: 8),
                    _buildActionButton(
                      icon: Icons.share_rounded,
                      label: l10n.shareAction,
                      color: const Color(0xFF10B981),
                      onTap: () {
                        final String uuidConsultor = ref.read(authProvider).user?.id ?? '';
                        final fullUrl = 'https://www.softbadge.pt/shares/$uuidConsultor/${item.idCandidaturaEspecial}?tipo=especial';
                        SharePlus.instance.share(ShareParams(
                          text: l10n.shareMessage(item.badgeTitulo, fullUrl),
                          subject: l10n.shareSubject(item.badgeTitulo),
                        ));
                      },
                    ),
                  ],
                ),
              ),
            ],
          ],
        ],
      ),
    );
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

  // ── VISTA DISPONÍVEIS (Catálogo de Badges Especiais) ──
  Widget _buildDisponiveisList(AppLocalizations l10n) {
    if (_catalogo.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Text(
            l10n.noSpecialBadgeAvailable,
            style: GoogleFonts.inter(color: Colors.grey, fontSize: 14),
          ),
        ),
      );
    }

    final disponiveis = _catalogo.where((badge) {
      final userCand = _findUserCandidatura(badge);
      // Mostra se não tem candidatura OU se foi rejeitado (idEstado == 3)
      return userCand == null || userCand.idEstado == 3;
    }).toList();

    if (disponiveis.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Text(
            l10n.noSpecialBadgeAvailable,
            style: GoogleFonts.inter(color: Colors.grey, fontSize: 14),
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
      itemCount: disponiveis.length,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final badge = disponiveis[index];
        final userApp = _findUserCandidatura(badge);
        return _buildDisponivelCard(badge, userApp, l10n);
      },
    );
  }

  Widget _buildDisponivelCard(
      BadgeEspecialModel badge, ConquistaEspecialModel? userApp, AppLocalizations l10n) {
    final logoUrl =
        badge.logoConquista != null && badge.logoConquista!.isNotEmpty
            ? '${ApiConfig.baseUrl}/uploads/logo_especial/${badge.logoConquista}'
            : null;

    final isConquered = userApp != null && userApp.idEstado == 2;
    final isPending = userApp != null && userApp.idEstado == 1;
    final isRejected = userApp != null && userApp.idEstado == 3;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: isConquered
              ? const Color(0xFF10B981).withValues(alpha: 0.4)
              : isRejected
                  ? const Color(0xFFEF4444).withValues(alpha: 0.4)
                  : const Color(0xFFE2E8F0),
          width: 1.5,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF155DFC).withValues(alpha: 0.06),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header com Logo, Titulo e Ribbon
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Logo
              Container(
                width: 60,
                height: 60,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: logoUrl != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(14),
                        child: Image.network(
                          logoUrl,
                          width: 60,
                          height: 60,
                          fit: BoxFit.contain,
                          errorBuilder: (context, error, stackTrace) =>
                              const Icon(Icons.star,
                                  color: Color(0xFFF59E0B), size: 30),
                        ),
                      )
                    : const Icon(Icons.star,
                        color: Color(0xFFF59E0B), size: 30),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        if (isConquered)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFDCFCE7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.check_circle_outline,
                                    size: 12, color: Color(0xFF16A34A)),
                                const SizedBox(width: 4),
                                Text(
                                  l10n.statusConquered,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFF16A34A),
                                  ),
                                ),
                              ],
                            ),
                          )
                        else if (isPending)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEF3C7),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.hourglass_top_rounded,
                                    size: 12, color: Color(0xFFD97706)),
                                const SizedBox(width: 4),
                                Text(
                                  l10n.statusUnderAnalysis,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFFD97706),
                                  ),
                                ),
                              ],
                            ),
                          )
                        else if (isRejected)
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFFEE2E2),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.cancel_outlined,
                                    size: 12, color: Color(0xFFDC2626)),
                                const SizedBox(width: 4),
                                Text(
                                  l10n.statusRejected,
                                  style: GoogleFonts.inter(
                                    fontSize: 11,
                                    fontWeight: FontWeight.bold,
                                    color: const Color(0xFFDC2626),
                                  ),
                                ),
                              ],
                            ),
                          )
                        else
                          Container(
                            padding: const EdgeInsets.symmetric(
                                horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: const Color(0xFFEFF6FF),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              l10n.available,
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                color: const Color(0xFF155DFC),
                              ),
                            ),
                          ),
                        const Spacer(),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFFBEB),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFFCD34D)),
                          ),
                          child: Text(
                            '⚡ +${badge.pontosBonus} pts',
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFFD97706),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      badge.titulo,
                      style: GoogleFonts.outfit(
                        fontSize: 17,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF0F172B),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),

          // Descrição
          if (badge.descricao.isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(
              badge.descricao,
              style: GoogleFonts.inter(
                fontSize: 13,
                color: const Color(0xFF64748B),
                height: 1.4,
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],

          // Motivo da recusa se houver
          if (isRejected &&
              userApp!.motivoRecusa != null &&
              userApp.motivoRecusa!.trim().isNotEmpty) ...[
            const SizedBox(height: 12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFEF2F2),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFECACA)),
              ),
              child: Text(
                '${l10n.reasonPrefix}${userApp.motivoRecusa}',
                style: GoogleFonts.inter(
                    fontSize: 12, color: const Color(0xFF991B1B)),
              ),
            ),
          ],

          // Tag de Tipo
          if (badge.tipoBadgeEspecial != null) ...[
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(6),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    badge.tipoBadgeEspecial!.requerLink ? '🌐 ' : '📜 ',
                    style: const TextStyle(fontSize: 12),
                  ),
                  Text(
                    badge.tipoBadgeEspecial!.nome,
                    style: GoogleFonts.inter(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: const Color(0xFF475569),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),
          const Divider(color: Color(0xFFE2E8F0), height: 1),
          const SizedBox(height: 14),

          // ── BOTÕES DE AÇÃO: Ver Detalhes & Candidatar-se ──
          Row(
            children: [
              // Botão 1: Ver Detalhes
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: () => _showDetailsModal(badge, userApp, l10n),
                  icon: const Icon(Icons.info_outline_rounded, size: 16),
                  label: Text(
                    l10n.viewDetails,
                    style: GoogleFonts.inter(
                        fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFF334155),
                    side: const BorderSide(color: Color(0xFFCBD5E1)),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                    padding: const EdgeInsets.symmetric(vertical: 10),
                  ),
                ),
              ),
              const SizedBox(width: 10),

              // Botão 2: Candidatar-se (ou Conquistado / Em Análise)
              Expanded(
                child: isConquered
                    ? ElevatedButton.icon(
                        onPressed: null,
                        icon: const Icon(Icons.check_circle_outline, size: 16),
                        label: Text(
                          l10n.statusConquered,
                          style: GoogleFonts.inter(
                              fontSize: 13, fontWeight: FontWeight.bold),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFDCFCE7),
                          disabledBackgroundColor: const Color(0xFFDCFCE7),
                          foregroundColor: const Color(0xFF16A34A),
                          disabledForegroundColor: const Color(0xFF16A34A),
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(10)),
                          padding: const EdgeInsets.symmetric(vertical: 10),
                          elevation: 0,
                        ),
                      )
                    : isPending
                        ? ElevatedButton.icon(
                            onPressed: null,
                            icon: const Icon(Icons.hourglass_top_rounded,
                                size: 16),
                            label: Text(
                              l10n.statusUnderAnalysis,
                              style: GoogleFonts.inter(
                                  fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFFEF3C7),
                              disabledBackgroundColor: const Color(0xFFFEF3C7),
                              foregroundColor: const Color(0xFFD97706),
                              disabledForegroundColor: const Color(0xFFD97706),
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              elevation: 0,
                            ),
                          )
                        : ElevatedButton.icon(
                            onPressed: () => _showCandidaturaModal(badge, l10n),
                            icon: const Icon(Icons.rocket_launch_rounded,
                                size: 16),
                            label: Text(
                              l10n.applyButton,
                              style: GoogleFonts.inter(
                                  fontSize: 13, fontWeight: FontWeight.bold),
                            ),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF155DFC),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(
                                  borderRadius: BorderRadius.circular(10)),
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              elevation: 0,
                            ),
                          ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── MODAL VER DETALHES ──
  void _showDetailsModal(
      BadgeEspecialModel badge, ConquistaEspecialModel? userApp, AppLocalizations l10n) {
    final logoUrl =
        badge.logoConquista != null && badge.logoConquista!.isNotEmpty
            ? '${ApiConfig.baseUrl}/uploads/logo_especial/${badge.logoConquista}'
            : null;

    final isConquered = userApp != null && userApp.idEstado == 2;
    final isPending = userApp != null && userApp.idEstado == 1;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return Padding(
          padding: EdgeInsets.fromLTRB(
              24, 20, 24, MediaQuery.of(ctx).padding.bottom + 24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Barra de arrastar
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  margin: const EdgeInsets.only(bottom: 20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),

              // Header com Logo e Título
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: 64,
                    height: 64,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: logoUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(16),
                            child: Image.network(
                              logoUrl,
                              width: 64,
                              height: 64,
                              fit: BoxFit.contain,
                              errorBuilder: (context, error, stackTrace) =>
                                  const Icon(Icons.star,
                                      color: Color(0xFFF59E0B), size: 36),
                            ),
                          )
                        : const Icon(Icons.star,
                            color: Color(0xFFF59E0B), size: 36),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFFFBEB),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(color: const Color(0xFFFCD34D)),
                          ),
                          child: Text(
                            '⚡ +${badge.pontosBonus} ${l10n.bonusPointsSuffix}',
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFFD97706),
                            ),
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          badge.titulo,
                          style: GoogleFonts.outfit(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF0F172B),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              const Divider(color: Color(0xFFE2E8F0)),
              const SizedBox(height: 16),

              // Descrição
              Text(
                l10n.descriptionLabel,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF0F172B),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                badge.descricao.isNotEmpty
                    ? badge.descricao
                    : l10n.noAdditionalDescription,
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: const Color(0xFF475569),
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 20),

              // Requisitos
              if (badge.tipoBadgeEspecial != null) ...[
                Text(
                  l10n.applicationRequirementsTitle,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF0F172B),
                  ),
                ),
                const SizedBox(height: 8),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFF8FAFC),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            badge.tipoBadgeEspecial!.requerLink
                                ? Icons.link_rounded
                                : Icons.description_rounded,
                            size: 18,
                            color: const Color(0xFF155DFC),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            badge.tipoBadgeEspecial!.nome,
                            style: GoogleFonts.inter(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF1E293B),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        badge.tipoBadgeEspecial!.requerLink
                            ? '• ${l10n.requirementLinkPublic}'
                            : '• ${l10n.requirementFilePdf}',
                        style: GoogleFonts.inter(
                          fontSize: 12,
                          color: const Color(0xFF64748B),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Botão Candidatar-se dentro do modal de detalhes
              if (!isConquered && !isPending)
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.pop(ctx);
                      _showCandidaturaModal(badge, l10n);
                    },
                    icon: const Icon(Icons.rocket_launch_rounded, size: 18),
                    label: Text(
                      l10n.applyForThisBadge,
                      style: GoogleFonts.inter(
                          fontSize: 14, fontWeight: FontWeight.bold),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF155DFC),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12)),
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      elevation: 0,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  // ── MODAL CANDIDATAR-SE ──
  void _showCandidaturaModal(BadgeEspecialModel badge, AppLocalizations l10n) {
    final formKey = GlobalKey<FormState>();
    final urlController = TextEditingController();
    PlatformFile? pickedFile;
    bool isSubmitting = false;
    String? formError;

    final tipo = badge.tipoBadgeEspecial;
    final isLinkRequired = tipo?.requerLink ?? false;
    final isFileRequired = tipo?.requerFicheiro ?? true;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) {
        return StatefulBuilder(
          builder: (BuildContext context, StateSetter modalSetState) {
            return Padding(
              padding: EdgeInsets.fromLTRB(
                24,
                20,
                24,
                MediaQuery.of(context).viewInsets.bottom +
                    MediaQuery.of(context).padding.bottom +
                    20,
              ),
              child: SingleChildScrollView(
                child: Form(
                  key: formKey,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Barra topo
                      Center(
                        child: Container(
                          width: 40,
                          height: 4,
                          margin: const EdgeInsets.only(bottom: 20),
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E8F0),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),

                      // Título
                      Text(
                        l10n.specialBadgeApplicationTitle,
                        style: GoogleFonts.outfit(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172B),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        badge.titulo,
                        style: GoogleFonts.inter(
                          fontSize: 14,
                          color: const Color(0xFF155DFC),
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Divider(color: Color(0xFFE2E8F0)),
                      const SizedBox(height: 16),

                      // Erro de formulário se houver
                      if (formError != null) ...[
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFEF2F2),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: const Color(0xFFFECACA)),
                          ),
                          child: Text(
                            formError!,
                            style: GoogleFonts.inter(
                                fontSize: 12, color: const Color(0xFF991B1B)),
                          ),
                        ),
                        const SizedBox(height: 16),
                      ],

                      // Campo URL Comprovativo
                      Text(
                        isLinkRequired
                            ? l10n.publicLinkMandatory
                            : l10n.publicLinkOptional,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 6),
                      TextFormField(
                        controller: urlController,
                        keyboardType: TextInputType.url,
                        decoration: InputDecoration(
                          hintText: l10n.exampleLink,
                          hintStyle: GoogleFonts.inter(
                              color: const Color(0xFF94A3B8), fontSize: 13),
                          prefixIcon: const Icon(Icons.link,
                              color: Color(0xFF64748B), size: 20),
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 12),
                          filled: true,
                          fillColor: const Color(0xFFF8FAFC),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide:
                                const BorderSide(color: Color(0xFFCBD5E1)),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide:
                                const BorderSide(color: Color(0xFFE2E8F0)),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(10),
                            borderSide:
                                const BorderSide(color: Color(0xFF155DFC)),
                          ),
                        ),
                        validator: (val) {
                          if (isLinkRequired) {
                            if (val == null || val.trim().isEmpty) {
                              return l10n.errorInsertUrl;
                            }
                            if (!val.startsWith('http://') &&
                                !val.startsWith('https://')) {
                              return l10n.errorLinkFormat;
                            }
                          }
                          return null;
                        },
                      ),
                      const SizedBox(height: 18),

                      // Campo Ficheiro Comprovativo (PDF)
                      Text(
                        isFileRequired
                            ? l10n.pdfFileMandatory
                            : l10n.pdfFileOptional,
                        style: GoogleFonts.inter(
                          fontSize: 13,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF1E293B),
                        ),
                      ),
                      const SizedBox(height: 6),

                      if (pickedFile == null)
                        InkWell(
                          onTap: () async {
                            modalSetState(() => formError = null);
                            try {
                              final result = await FilePicker.pickFiles(
                                type: FileType.custom,
                                allowedExtensions: ['pdf'],
                                withData: kIsWeb,
                              );
                              if (result != null && result.files.isNotEmpty) {
                                final f = result.files.first;
                                if (f.size > 5 * 1024 * 1024) {
                                  modalSetState(() => formError =
                                      l10n.errorFileSize);
                                  return;
                                }
                                modalSetState(() => pickedFile = f);
                              }
                            } catch (e) {
                              modalSetState(() => formError =
                                  '${l10n.errorFileSelection}$e');
                            }
                          },
                          borderRadius: BorderRadius.circular(10),
                          child: Container(
                            width: double.infinity,
                            padding: const EdgeInsets.symmetric(
                                vertical: 16, horizontal: 16),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(10),
                              border: Border.all(
                                  color: const Color(0xFFCBD5E1),
                                  style: BorderStyle.solid),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.upload_file_rounded,
                                    color: Color(0xFF155DFC), size: 22),
                                const SizedBox(width: 8),
                                Text(
                                  l10n.selectPdfFile,
                                  style: GoogleFonts.inter(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF155DFC),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        )
                      else
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF0FDF4),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(color: const Color(0xFFBBF7D0)),
                          ),
                          child: Row(
                            children: [
                              const Icon(Icons.picture_as_pdf_rounded,
                                  color: Color(0xFFDC2626), size: 24),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      pickedFile!.name,
                                      style: GoogleFonts.inter(
                                        fontSize: 13,
                                        fontWeight: FontWeight.bold,
                                        color: const Color(0xFF0F172B),
                                      ),
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                    Text(
                                      '${(pickedFile!.size / 1024).toStringAsFixed(1)} KB',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: const Color(0xFF64748B),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              IconButton(
                                icon: const Icon(Icons.close,
                                    color: Color(0xFF64748B), size: 18),
                                onPressed: () {
                                  modalSetState(() => pickedFile = null);
                                },
                              ),
                            ],
                          ),
                        ),

                      const SizedBox(height: 24),

                      // Botão Submeter
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: isSubmitting
                              ? null
                              : () async {
                                  modalSetState(() => formError = null);
                                  if (!formKey.currentState!.validate()) return;

                                  if (isFileRequired && pickedFile == null) {
                                    modalSetState(() => formError =
                                        l10n.errorPdfMandatory);
                                    return;
                                  }

                                  modalSetState(() => isSubmitting = true);

                                  try {
                                    final success = await _metricasService
                                        .submeterCandidaturaEspecial(
                                      idConquistaEspecial:
                                          badge.idConquistaEspecial,
                                      urlComprovativo:
                                          urlController.text.trim(),
                                      filePath: pickedFile?.path,
                                      fileBytes: pickedFile?.bytes,
                                      fileName: pickedFile?.name,
                                    );

                                    if (success) {
                                      if (ctx.mounted) Navigator.pop(ctx);
                                      if (mounted) {
                                        ScaffoldMessenger.of(this.context)
                                            .showSnackBar(
                                          SnackBar(
                                            content: Text(
                                                l10n.applicationSubmittedSuccess),
                                            backgroundColor: const Color(0xFF10B981),
                                          ),
                                        );
                                        _loadData();
                                      }
                                    }
                                  } catch (e) {
                                    modalSetState(() {
                                      isSubmitting = false;
                                      formError = e
                                          .toString()
                                          .replaceAll('Exception: ', '');
                                    });
                                  }
                                },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF155DFC),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(12)),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 0,
                          ),
                          child: isSubmitting
                              ? const SizedBox(
                                  height: 20,
                                  width: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : Text(
                                  l10n.submitApplication,
                                  style: GoogleFonts.inter(
                                      fontSize: 14,
                                      fontWeight: FontWeight.bold),
                                ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }
}
