import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/models/badge_model.dart';
// Mantém o teu import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/screens/catalog/evidence_upload_screen.dart';
import 'package:projeto_pratico/screens/evidence/candidatura_details_screen.dart';

import 'package:projeto_pratico/riverpood/badge_notifier.dart';
import 'package:projeto_pratico/widgets/badge_logo_widget.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

// Provider local para gerir a tab selecionada neste ecrã
final detailsTabProvider = StateProvider.autoDispose<int>((ref) => 0);

class BadgeDetailsScreen extends ConsumerStatefulWidget {
  final String badgeId;

  const BadgeDetailsScreen({super.key, required this.badgeId});

  @override
  ConsumerState<BadgeDetailsScreen> createState() => _BadgeDetailsScreenState();
}

class _BadgeDetailsScreenState extends ConsumerState<BadgeDetailsScreen> {
  @override
  void initState() {
    super.initState();
    // Faz o trigger da API para carregar as "bolinhas" (requisitos)
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final badge = ref.read(badgeProvider).badges.firstWhere((b) => b.id == widget.badgeId);
      ref.read(badgeProvider.notifier).carregarRequisitosBadge(badge.id, badge.level);
    });
  }

  @override
  Widget build(BuildContext context) {
    final tabAtiva = ref.watch(detailsTabProvider);
    // Observa o badge em tempo real
    final badge = ref.watch(badgeProvider).badges.firstWhere(
      (b) => b.id == widget.badgeId,
      orElse: () => throw Exception('Badge não encontrado'),
    );

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          _buildGradientHeader(context, badge, AppLocalizations.of(context)!),
          _buildBody(context, ref, tabAtiva, badge, AppLocalizations.of(context)!),
        ],
      ),
    );
  }

  Widget _buildGradientHeader(BuildContext context, BadgeModel badge, AppLocalizations l10n) {
    String statusText;
    Color statusColor;
    Color statusBgColor;

    if (badge.status == 'concluido') {
      statusText = l10n.statusCompleted;
      statusColor = const Color(0xFF10B981);
      statusBgColor = const Color(0xFFD1FAE5);
    } else if (badge.status == 'em_progresso') {
      statusText = l10n.statusInProgress;
      statusColor = const Color(0xFF2563EB);
      statusBgColor = const Color(0xFFDBEAFE);
    } else {
      statusText = l10n.statusAvailable;
      statusColor = const Color(0xFF64748B);
      statusBgColor = const Color(0xFFF1F5F9);
    }

    return Container(
      width: double.infinity,
      padding: EdgeInsets.only(top: MediaQuery.of(context).padding.top + 16, left: 20, right: 20, bottom: 24),
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
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 16),
                const SizedBox(width: 6),
                Text(
                  l10n.goBack,
                  style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w500, fontFamily: 'Inter'),
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
                    BoxShadow(color: Color(0x1A000000), blurRadius: 10, offset: Offset(0, 4)),
                  ],
                ),
                child: Center(
                  child: BadgeLogoWidget(
                    logo: badge.logo,
                    size: 48,
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      badge.title,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 22,
                        fontWeight: FontWeight.bold,
                        fontFamily: 'Inter',
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: statusBgColor,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        statusText,
                        style: TextStyle(color: statusColor, fontSize: 12, fontWeight: FontWeight.w600, fontFamily: 'Inter'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            badge.description,
            style: const TextStyle(
              color: Color(0xE6FFFFFF),
              fontSize: 14,
              fontFamily: 'Inter',
              height: 1.5,
            ),
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              _buildInfoChip(Icons.stars_rounded, '${badge.points} XP'),
              const SizedBox(width: 12),
              _buildInfoChip(Icons.category_rounded, badge.area),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildInfoChip(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: const Color(0x33FFFFFF),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: const Color(0x4DFFFFFF), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 16),
          const SizedBox(width: 6),
          Text(
            text,
            style: const TextStyle(color: Colors.white, fontSize: 13, fontWeight: FontWeight.w500, fontFamily: 'Inter'),
          ),
        ],
      ),
    );
  }  Widget _buildBody(BuildContext context, WidgetRef ref, int tabAtiva, BadgeModel badge, AppLocalizations l10n) {
    return Expanded(
      child: SingleChildScrollView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildCustomTabBar(ref, tabAtiva, l10n),
            const SizedBox(height: 32),

            // A Mágica da TabBar: Só mostra um ou o outro!
            if (tabAtiva == 0)
              _buildRequisitosList(badge, l10n) 
            else
              _buildCompetenciasList(badge, l10n),

            const SizedBox(height: 32),

            // SECÇÃO DE AÇÕES
            Text(
              l10n.actionsTitle,
              style: const TextStyle(
                color: Color(0xFF0F172B),
                fontSize: 16,
                fontFamily: 'Inter',
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 16),
            
            // Botão Primário — context-aware baseado no estado da candidatura
            _buildPrimaryButton(context, badge, l10n),
            const SizedBox(height: 12),
            
            // Botão Secundário
            SizedBox(
              width: double.infinity,
              height: 48,
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
                child: Text(l10n.backToCatalog, style: const TextStyle(color: Color(0xFF45556C), fontSize: 14, fontWeight: FontWeight.w600)),
              ),
            ),
            const SizedBox(height: 32), 
          ],
        ),
      ),
    );
  }

  /// Botão primário contextual:
  /// - disponivel → "Submeter Candidatura" (abre EvidenceUploadScreen)
  /// - rascunho (estado 1) → "Ver Rascunho" cinzento (abre CandidaturaDetailsScreen)
  /// - submetida/validação/concluído (estado 2+) → "Ver Candidatura" azul (abre CandidaturaDetailsScreen)
  Widget _buildPrimaryButton(BuildContext context, BadgeModel badge, AppLocalizations l10n) {
    // Sem candidatura — disponivel para submeter
    if (badge.status == 'disponivel' || badge.idCandidatura == null) {
      return Container(
        width: double.infinity,
        height: 48,
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
          ),
          borderRadius: BorderRadius.circular(14),
          boxShadow: const [
            BoxShadow(color: Color(0x33155DFC), blurRadius: 15, offset: Offset(0, 8)),
          ],
        ),
        child: ElevatedButton.icon(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => EvidenceUploadScreen(badge: badge),
              ),
            );
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.transparent,
            shadowColor: Colors.transparent,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
          icon: const Icon(Icons.upload_file_rounded, color: Colors.white, size: 18),
          label: Text(l10n.submitApplication, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
        ),
      );
    }

    // Tem candidatura — mostrar botão adequado ao estado
    final isRascunho = badge.idEstadoCandidatura == 1;
    final label = isRascunho ? l10n.continueDraft : l10n.viewApplication;
    final icon = isRascunho ? Icons.edit_note_rounded : Icons.assignment_turned_in_rounded;
    final gradientColors = isRascunho
        ? [const Color(0xFF64748B), const Color(0xFF94A3B8)]
        : [const Color(0xFF155DFC), const Color(0xFF369FFF)];
    final shadowColor = isRascunho ? const Color(0x3364748B) : const Color(0x33155DFC);

    return Container(
      width: double.infinity,
      height: 48,
      decoration: BoxDecoration(
        gradient: LinearGradient(colors: gradientColors),
        borderRadius: BorderRadius.circular(14),
        boxShadow: [BoxShadow(color: shadowColor, blurRadius: 15, offset: const Offset(0, 8))],
      ),
      child: ElevatedButton.icon(
        onPressed: () {
          if (isRascunho) {
            // Rascunho → abre o formulário de submissão para o utilizador continuar
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => EvidenceUploadScreen(badge: badge),
              ),
            );
          } else {
            // Submetida / Em Validação / Concluído → abre os detalhes em modo leitura
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (context) => CandidaturaDetailsScreen(idCandidatura: badge.idCandidatura!),
              ),
            );
          }
        },
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
        icon: Icon(icon, color: Colors.white, size: 18),
        label: Text(label, style: const TextStyle(color: Colors.white, fontSize: 14, fontWeight: FontWeight.w600)),
      ),
    );
  }

  Widget _buildCustomTabBar(WidgetRef ref, int tabAtiva, AppLocalizations l10n) {
    return Container(
      height: 44,
      decoration: BoxDecoration(
        color: const Color(0xFFECECF0),
        borderRadius: BorderRadius.circular(14),
      ),
      child: Padding(
        padding: const EdgeInsets.all(4.0),
        child: Row(
          children: [
            Expanded(
              child: GestureDetector(
                onTap: () => ref.read(detailsTabProvider.notifier).state = 0,
                child: Container(
                  decoration: BoxDecoration(
                    color: tabAtiva == 0 ? Colors.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: tabAtiva == 0 
                        ? const [BoxShadow(color: Color(0x0C000000), blurRadius: 2, offset: Offset(0, 1))]
                        : null,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    l10n.tabInformation, 
                    style: TextStyle(
                      color: tabAtiva == 0 ? const Color(0xFF0A0A0A) : const Color(0xFF64748B), 
                      fontSize: 14, 
                      fontWeight: tabAtiva == 0 ? FontWeight.w600 : FontWeight.w500,
                    ),
                  ),
                ),
              ),
            ),
            Expanded(
              child: GestureDetector(
                onTap: () => ref.read(detailsTabProvider.notifier).state = 1,
                child: Container(
                  decoration: BoxDecoration(
                    color: tabAtiva == 1 ? Colors.white : Colors.transparent,
                    borderRadius: BorderRadius.circular(10),
                    boxShadow: tabAtiva == 1 
                        ? const [BoxShadow(color: Color(0x0C000000), blurRadius: 2, offset: Offset(0, 1))]
                        : null,
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    l10n.tabCompetences, 
                    style: TextStyle(
                      color: tabAtiva == 1 ? const Color(0xFF0A0A0A) : const Color(0xFF64748B), 
                      fontSize: 14, 
                      fontWeight: tabAtiva == 1 ? FontWeight.w600 : FontWeight.w500,
                    ),
                  ),
                )
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRequisitosList(BadgeModel badge, AppLocalizations l10n) {
    if (!badge.isRequirementsLoaded) {
      return Center(
        child: Text(
          l10n.loadingRequirements,
          style: const TextStyle(fontFamily: 'Inter', color: Color(0xFF64748B)),
        ),
      );
    }

    if (badge.requirements.isEmpty) {
      return Center(
        child: Text(
          l10n.noRequirementsConfigured,
          style: const TextStyle(fontFamily: 'Inter', color: Color(0xFF64748B)),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.requirementsCount(badge.requirements.length),
          style: const TextStyle(
            color: Color(0xFF0F172B),
            fontSize: 16,
            fontFamily: 'Inter',
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        ...badge.requirements.map((req) {
          String statusString;
          switch (req.status) {
            case RequirementStatus.concluido:
              statusString = l10n.statusApproved;
              break;
            case RequirementStatus.emValidacao:
              statusString = l10n.statusInValidation;
              break;
            case RequirementStatus.submetido:
              statusString = l10n.statusSubmitted;
              break;
            case RequirementStatus.emProgresso:
              statusString = l10n.statusInProgress;
              break;
            default:
              statusString = l10n.statusPending;
          }
          
          return Padding(
            padding: const EdgeInsets.only(bottom: 12.0),
            child: _buildRequirementCard(
              title: req.title,
              description: req.description,
              code: req.code, // id do requisito
              status: statusString,
              l10n: l10n,
            ),
          );
        }),
      ],
    );
  }

  Widget _buildCompetenciasList(BadgeModel badge, AppLocalizations l10n) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.certifiedCompetences,
          style: const TextStyle(
            color: Color(0xFF0F172B),
            fontSize: 16,
            fontFamily: 'Inter',
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 16),
        
        _buildCompetenciaCard(
          title: 'API Design & Development',
          description: 'Capacidade de desenhar e implementar APIs RESTful robustas.',
          type: 'Teórica',
          level: 'Intermédio',
        ),
        const SizedBox(height: 12),
        
        _buildCompetenciaCard(
          title: 'Database Management',
          description: 'Modelagem de dados, escrita de queries e gestão de bases de dados.',
          type: 'Teórica',
          level: 'Intermédio',
        ),
        const SizedBox(height: 12),
        
        _buildCompetenciaCard(
          title: 'Server-Side Logic & Business Rules',
          description: 'Capacidade de traduzir requisitos de negócio em lógica de servidor.',
          type: 'Skills',
          level: 'Intermédio',
        ),
      ],
    );
  }

  Widget _buildRequirementCard({
    required String title,
    required String description,
    required String code,
    required String status,
    String? date,
    required AppLocalizations l10n,
  }) {
    Color statusColor;
    Color statusBgColor;
    IconData icon;
    Color iconColor;

    if (status == l10n.statusApproved) {
      statusColor = const Color(0xFF059669);
      statusBgColor = const Color(0xFFD1FAE5);
      iconColor = const Color(0xFF10B981);
      icon = Icons.check_circle_rounded;
    } else if (status == l10n.statusInValidation) {
      statusColor = const Color(0xFF2563EB);
      statusBgColor = const Color(0xFFDBEAFE);
      iconColor = const Color(0xFF3B82F6);
      icon = Icons.hourglass_empty_rounded;
    } else {
      statusColor = const Color(0xFF64748B);
      statusBgColor = const Color(0xFFF1F5F9);
      iconColor = const Color(0xFFCBD5E1);
      icon = Icons.circle_outlined;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
        borderRadius: BorderRadius.circular(16),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 2),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: Color(0xFF0F172B), fontSize: 14, fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(description, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, height: 1.4)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 6,
                  runSpacing: 6,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  children: [
                    Text(code, style: const TextStyle(color: Color(0xFF94A3B8), fontSize: 11, fontFamily: 'Consolas')),
                    const Text('•', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 11)),
                    Text('💼 ${l10n.project}', style: const TextStyle(color: Color(0xFF64748B), fontSize: 11)),
                    const Text('•', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 11)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: statusBgColor,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        status,
                        style: TextStyle(color: statusColor, fontSize: 10, fontWeight: FontWeight.w600),
                      ),
                    ),
                    if (date != null) ...[
                      const Text('•', style: TextStyle(color: Color(0xFFCBD5E1), fontSize: 11)),
                      Text(l10n.onDate(date), style: TextStyle(color: statusColor, fontSize: 11)),
                    ]
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCompetenciaCard({
    required String title,
    required String description,
    required String type,
    required String level,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
        borderRadius: BorderRadius.circular(14),
        boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 10, offset: Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(color: Color(0xFF0F172B), fontSize: 14, fontWeight: FontWeight.w600, fontFamily: 'Inter')),
          const SizedBox(height: 6),
          Text(description, style: const TextStyle(color: Color(0xFF64748B), fontSize: 12, height: 1.4, fontFamily: 'Inter')),
          const SizedBox(height: 16),
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(type, style: const TextStyle(color: Color(0xFF0A0A0A), fontSize: 11, fontWeight: FontWeight.w500)),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFFDCD8D).withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(level, style: const TextStyle(color: Color(0xFFA65F00), fontSize: 11, fontWeight: FontWeight.w600)),
              ),
            ],
          ),
        ],
      ),
    );
  }
}