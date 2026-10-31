import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class FilterBottomSheetContent extends ConsumerWidget {
  const FilterBottomSheetContent({super.key});

  // Mapa fixo: letra do n\u00edvel -> nome descritivo (para o tooltip)
  static const Map<String, String> _levelNames = {
    'A': 'J\u00fanior',
    'B': 'Pleno',
    'C': 'S\u00e9nior',
    'D': 'Especialista',
    'E': 'Principal',
  };

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final badgeState = ref.watch(badgeProvider);
    final notifier = ref.read(badgeProvider.notifier);
    final l10n = AppLocalizations.of(context)!;

    // \u00c1reas filtradas pela service line selecionada (filtro cascata)
    final cascadedAreas = badgeState.availableAreasForServiceLine(badgeState.selectedServiceLine);

    return Padding(
      padding: EdgeInsets.fromLTRB(
          16, 24, 16, MediaQuery.of(context).padding.bottom + 24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(l10n.searchFilters,
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
              IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context)),
            ],
          ),
          const SizedBox(height: 16),

          // \u2500\u2500 Service Line \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
          _buildLabel('Service Line'),
          Builder(
            builder: (context) {
              final rawLines = badgeState.availableServiceLines;
              final serviceLines = rawLines.isNotEmpty ? rawLines : ['Todas'];

              final currentStateVal = badgeState.selectedServiceLine.trim();
              final matchingValue = serviceLines.firstWhere(
                (item) => item.trim().toLowerCase() == currentStateVal.toLowerCase(),
                orElse: () => serviceLines.first,
              );

              return _buildRealDropdown(
                currentValue: matchingValue,
                items: serviceLines,
                onChanged: (val) {
                  if (val != null) {
                    notifier.setServiceLineFilter(val);
                  }
                },
              );
            },
          ),
          const SizedBox(height: 16),

          // \u2500\u2500 \u00c1rea (cascata dependente da Service Line) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
          _buildLabel(l10n.areaLabel),
          Builder(
            builder: (context) {
              final areas = cascadedAreas.isNotEmpty ? cascadedAreas : ['Todas'];
              final currentStateVal = badgeState.selectedArea.trim();
              final safeValue = areas.firstWhere(
                (item) => item.trim().toLowerCase() == currentStateVal.toLowerCase(),
                orElse: () => areas.first,
              );

              return _buildRealDropdown(
                currentValue: safeValue,
                items: areas,
                onChanged: (val) {
                  if (val != null) {
                    notifier.setAreaFilter(val);
                  }
                },
              );
            },
          ),
          const SizedBox(height: 16),

          // \u2500\u2500 N\u00edvel (A a E fixo, tooltip ao segurar) \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
          _buildLabel(l10n.levelLabel),
          _buildLevelSection(badgeState, notifier),
          const SizedBox(height: 16),

          // \u2500\u2500 Estado \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500
          _buildLabel(l10n.statusLabel),
          Builder(
            builder: (context) {
              final rawStatuses = badgeState.availableStatuses;
              final statuses = rawStatuses.isNotEmpty ? rawStatuses : [l10n.allPlural];
              final currentStateVal = badgeState.selectedStatus.trim();
              final safeValue = statuses.firstWhere(
                (item) => item.trim().toLowerCase() == currentStateVal.toLowerCase(),
                orElse: () => statuses.first,
              );

              return _buildRealDropdown(
                currentValue: safeValue,
                items: statuses,
                onChanged: (val) {
                  if (val != null) {
                    notifier.setStatusFilter(val);
                  }
                },
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRealDropdown({
    required String currentValue,
    required List<String> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      width: double.infinity,
      height: 46,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
        borderRadius: BorderRadius.circular(14),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: currentValue,
          isExpanded: true,
          icon: const Icon(Icons.keyboard_arrow_down_rounded,
              color: Color(0xFF64748B)),
          style: const TextStyle(
              color: Color(0xFF45556C),
              fontSize: 13,
              fontWeight: FontWeight.w500,
              fontFamily: 'Inter'),
          items: items.map((String value) {
            return DropdownMenuItem<String>(
              value: value,
              child: Text(value),
            );
          }).toList(),
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildLabel(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Text(text,
          style: const TextStyle(
              color: Color(0xFF64748B),
              fontSize: 12,
              fontWeight: FontWeight.w500)),
    );
  }

  Widget _buildLevelSection(BadgeState badgeState, BadgeNotifier notifier) {
    // N\u00edveis sempre fixos de A a E
    const allLevels = ['A', 'B', 'C', 'D', 'E'];
    final activeLevels = badgeState.availableLevelsWithBadges;

    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: allLevels.map((level) {
        final hasBadges = activeLevels.contains(level);
        final isSelected = badgeState.selectedLevels.contains(level);
        final tooltipName = _levelNames[level] ?? level;

        return Tooltip(
          message: tooltipName,
          triggerMode: TooltipTriggerMode.longPress,
          decoration: BoxDecoration(
            color: const Color(0xFF0F172B),
            borderRadius: BorderRadius.circular(8),
          ),
          textStyle: const TextStyle(
            color: Colors.white,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
          preferBelow: false,
          child: GestureDetector(
            onTap: hasBadges ? () => notifier.toggleLevelFilter(level) : null,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 180),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              decoration: BoxDecoration(
                color: !hasBadges
                    ? Colors.grey.shade200
                    : (isSelected ? const Color(0xFF155DFC) : const Color(0xFFF1F5F9)),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(
                  color: isSelected
                      ? const Color(0xFF155DFC)
                      : (hasBadges ? const Color(0xFFE2E8F0) : Colors.grey.shade300),
                  width: 1.5,
                ),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: const Color(0xFF155DFC).withValues(alpha: 0.25),
                          blurRadius: 8,
                          offset: const Offset(0, 3),
                        )
                      ]
                    : null,
              ),
              child: Text(
                level,
                style: TextStyle(
                  color: !hasBadges
                      ? Colors.grey.withValues(alpha: 0.4)
                      : (isSelected ? Colors.white : const Color(0xFF64748B)),
                  fontWeight: FontWeight.w700,
                  fontSize: 15,
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

