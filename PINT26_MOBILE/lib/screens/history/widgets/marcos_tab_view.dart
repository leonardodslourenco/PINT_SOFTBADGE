import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/riverpood/marcos_notifier.dart';
import 'package:projeto_pratico/screens/history/widgets/marco_card_widget.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class MarcosTabView extends ConsumerWidget {
  const MarcosTabView({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final state = ref.watch(marcosProvider);
    final notifier = ref.read(marcosProvider.notifier);

    // Calcular contagens
    final alcancadosCount = state.marcos.where((m) => m.conquistado).length;
    final disponiveisCount = state.marcos.where((m) => !m.conquistado).length;

    return Column(
      children: [
        // ── BARRA DE FERRAMENTAS: Toggle e Pesquisa ──
        Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Toggle Container
              Container(
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
                        isActive: state.showingAlcancados,
                        onTap: () => notifier.toggleShowingAlcancados(true),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _buildToggleButton(
                        title: l10n.available,
                        count: disponiveisCount,
                        isActive: !state.showingAlcancados,
                        icon: Icons.auto_awesome,
                        onTap: () => notifier.toggleShowingAlcancados(false),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Search Bar (Alinhada à direita ou ocupando o espaço)
              Align(
                alignment: Alignment.centerRight,
                child: Container(
                  width: double.infinity, // Ocupa tudo no mobile, ou SizedBox(width: 300) se for tablet
                  constraints: const BoxConstraints(maxWidth: 400),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: const Color(0xFFE2E8F0)),
                  ),
                  child: TextField(
                    onChanged: notifier.setSearchQuery,
                    decoration: InputDecoration(
                      hintText: l10n.searchAvailableMilestones,
                      hintStyle: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 13),
                      prefixIcon: const Icon(Icons.search, color: Color(0xFF64748B), size: 20),
                      border: InputBorder.none,
                      contentPadding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),

        // ── LISTA/GRELHA DE MARCOS ──
        Expanded(
          child: state.isLoading
              ? const Center(child: CircularProgressIndicator())
              : state.filteredMarcos.isEmpty
                  ? Center(
                      child: Text(
                        l10n.noMilestoneFound,
                        style: GoogleFonts.inter(color: Colors.grey, fontSize: 14),
                      ),
                    )
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      itemCount: state.filteredMarcos.length,
                      separatorBuilder: (context, index) => const SizedBox(height: 16),
                      itemBuilder: (context, index) {
                        return MarcoCardWidget(marco: state.filteredMarcos[index]);
                      },
                    ),
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
          color: isActive ? const Color(0xFF155DFC) : Colors.transparent, // Azul Softinsa para o ativo
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (icon != null) ...[
              Icon(icon, size: 16, color: isActive ? Colors.white : const Color(0xFF64748B)),
              const SizedBox(width: 4),
            ] else if (!isActive) ...[
              const Icon(Icons.emoji_events, size: 16, color: Color(0xFFEF4444)),
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
                color: isActive ? Colors.white.withValues(alpha: 0.2) : const Color(0xFFF1F5F9),
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
}
