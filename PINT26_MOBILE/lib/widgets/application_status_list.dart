import 'package:flutter/material.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../riverpood/status_history_notifier.dart';
import '../models/status_history_model.dart';


class ApplicationStatusList extends ConsumerWidget {
  const ApplicationStatusList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // DADOS VINDOS DO PROVIDER
    final historicoSubmissoes = ref.watch(statusHistoryProvider).submissions;

    if (historicoSubmissoes.isEmpty) {
      return _buildEmptyState(context);
    }

    return ListView.separated(
      padding: const EdgeInsets.all(20),
      itemCount: historicoSubmissoes.length,
      separatorBuilder: (context, index) => const SizedBox(height: 16),
      itemBuilder: (context, index) {
        final item = historicoSubmissoes[index];
        return _buildHistoryCard(item);
      },
    );
  }

  // O Cartão que desenha cada submissão
  Widget _buildHistoryCard(StatusHistoryModel item) {
    Color statusColor;
    Color statusBgColor;
    IconData statusIcon;

    switch (item.status.toLowerCase()) {
      case 'rascunho':
      case 'aberto':
        statusColor = const Color(0xFF64748B);
        statusBgColor = const Color(0xFFF1F5F9);
        statusIcon = Icons.edit_note_rounded;
        break;
      case 'submetida':
      case 'submetido':
        statusColor = const Color(0xFFD97706);
        statusBgColor = const Color(0xFFFEF3C7);
        statusIcon = Icons.schedule_rounded;
        break;
      case 'em validação':
      case 'validação':
        statusColor = const Color(0xFF2563EB);
        statusBgColor = const Color(0xFFDBEAFE);
        statusIcon = Icons.hourglass_top_rounded;
        break;
      case 'aprovado':
      case 'aprovada':
        statusColor = const Color(0xFF059669);
        statusBgColor = const Color(0xFFD1FAE5);
        statusIcon = Icons.check_circle_rounded;
        break;
      case 'rejeitado':
      case 'rejeitado / cancelado':
      case 'cancelado':
        statusColor = const Color(0xFFEF4444);
        statusBgColor = const Color(0xFFFEE2E2);
        statusIcon = Icons.cancel_rounded;
        break;
      default:
        statusColor = const Color(0xFF64748B);
        statusBgColor = const Color(0xFFF1F5F9);
        statusIcon = Icons.info_outline;
    }

    final dateStr = "${item.submissionDate.day.toString().padLeft(2, '0')}/${item.submissionDate.month.toString().padLeft(2, '0')}/${item.submissionDate.year}";

    return Container(
      padding: const EdgeInsets.all(16),
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Text(
                  item.requirementCode,
                  style: GoogleFonts.firaCode(color: const Color(0xFF94A3B8), fontSize: 12, fontWeight: FontWeight.w500),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              const SizedBox(width: 8),
              Text(dateStr, style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 12)),
            ],
          ),
          const SizedBox(height: 8),
          Text(item.badgeTitle, style: GoogleFonts.outfit(color: const Color(0xFF0F172B), fontSize: 16, fontWeight: FontWeight.bold)),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            decoration: BoxDecoration(color: statusBgColor, borderRadius: BorderRadius.circular(8)),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(statusIcon, size: 14, color: statusColor),
                const SizedBox(width: 6),
                Text(item.status, style: GoogleFonts.inter(color: statusColor, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          if (item.feedback != null) ...[
            const Padding(
              padding: EdgeInsets.only(top: 16, bottom: 8),
              child: Divider(color: Color(0xFFE2E8F0), height: 1),
            ),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.feedback_outlined, size: 16, color: Color(0xFFEF4444)),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    item.feedback!,
                    style: GoogleFonts.inter(color: const Color(0xFF475569), fontSize: 13, height: 1.4),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildEmptyState(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 40),
        child: Text(
          AppLocalizations.of(context)!.noSubmissionsYet,
          style: const TextStyle(color: Color(0xFF64748B), fontSize: 14, fontFamily: 'Inter'),
        ),
      ),
    );
  }
}