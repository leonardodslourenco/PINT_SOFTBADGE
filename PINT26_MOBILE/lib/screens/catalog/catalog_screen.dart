import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';
import 'package:projeto_pratico/screens/catalog/badge_details_screen.dart';
import 'package:projeto_pratico/widgets/badge_card_widget.dart';
import 'package:projeto_pratico/widgets/filter_bottom_sheet_widget.dart';
import 'package:projeto_pratico/services/sync_manager.dart';
import 'package:projeto_pratico/screens/notifications/notifications_screen.dart';
import 'package:projeto_pratico/riverpood/notification_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class CatalogScreen extends ConsumerStatefulWidget {
  const CatalogScreen({super.key});

  @override
  ConsumerState<CatalogScreen> createState() => _CatalogScreenState();
}

class _CatalogScreenState extends ConsumerState<CatalogScreen> {
  late final TextEditingController _searchController;

  @override
  void initState() {
    super.initState();
    _searchController = TextEditingController();

    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(syncManagerProvider).performFullSync();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final badgeState = ref.watch(badgeProvider);
    final notifier = ref.read(badgeProvider.notifier);
    final unreadNotifications = ref.watch(unreadNotificationsCountProvider);

    final listaFiltrada = badgeState.filteredBadges;
    final quantidadeFiltrada = listaFiltrada.length;

    final isAscending = badgeState.sortByPointsAscending;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          _buildHeader(context, notifier, unreadNotifications,
              AppLocalizations.of(context)!),
          _buildFilterBar(context, quantidadeFiltrada, isAscending,
              AppLocalizations.of(context)!),
          Expanded(
            child: quantidadeFiltrada == 0
                ? _buildEmptyState(AppLocalizations.of(context)!)
                : ListView.separated(
                    padding: EdgeInsets.only(
                      top: 16,
                      left: 16,
                      right: 16,
                      bottom: MediaQuery.of(context).padding.bottom + 16,
                    ),
                    itemCount: quantidadeFiltrada,
                    separatorBuilder: (context, index) =>
                        const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final badge = listaFiltrada[index];
                      return InkWell(
                        borderRadius: BorderRadius.circular(16),
                        onTap: () {
                          Navigator.push(
                              context,
                              MaterialPageRoute(
                                  builder: (context) =>
                                      BadgeDetailsScreen(badgeId: badge.id)));
                        },
                        child: BadgeCardWidget(badge: badge),
                      );
                    },
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context, BadgeNotifier notifier,
      int unreadNotifications, AppLocalizations l10n) {
    final topPadding = MediaQuery.of(context).padding.top;
    return Container(
      padding: EdgeInsets.fromLTRB(20, topPadding + 16, 20, 32),
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
        ),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                l10n.badgesCatalogTitle,
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 20,
                    fontFamily: 'Inter',
                    fontWeight: FontWeight.w800,
                    letterSpacing: -0.5,
                ),
              ),
              Stack(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.2),
                      shape: BoxShape.circle,
                      border: Border.all(
                          color: Colors.white.withValues(alpha: 0.3)),
                    ),
                    child: IconButton(
                      icon: const Icon(Icons.notifications_outlined,
                          color: Colors.white, size: 22),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const NotificationsScreen(),
                          ),
                        );
                      },
                      padding: EdgeInsets.zero,
                    ),
                  ),
                  if (unreadNotifications > 0)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFFF3B30),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: const Color(0xFF3B82F6),
                            width: 2,
                          ),
                        ),
                        child: Text(
                          unreadNotifications > 99
                              ? '99+'
                              : '$unreadNotifications',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
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

  Widget _buildFilterBar(BuildContext context, int badgeCount, bool isAscending,
      AppLocalizations l10n) {
    return Transform.translate(
      offset: const Offset(0, -24), // Negative margin equivalent (-mt-6)
      child: Container(
        color: Colors.transparent,
        child: Column(
          children: [
            // Search Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Container(
                height: 52,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  boxShadow: const [
                    BoxShadow(
                      color: Color(0x0A000000),
                      blurRadius: 10,
                      offset: Offset(0, 4),
                    ),
                  ],
                  border: Border.all(color: const Color(0xFFF1F5F9), width: 1),
                ),
                child: TextField(
                  controller: _searchController,
                  onChanged: (query) => ref.read(badgeProvider.notifier).setSearchQuery(query),
                  decoration: InputDecoration(
                    hintText: l10n.searchBadgesHint,
                    hintStyle: const TextStyle(
                        color: Color(0xFF94A3B8),
                        fontSize: 14,
                        fontFamily: 'Inter'),
                    prefixIcon:
                        const Icon(Icons.search, color: Color(0xFF94A3B8)),
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 12),
            // Filtros Rápidos e Contador
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildFilterChip(context, Icons.tune, l10n.filters,
                      isFilterButton: true),
                  const SizedBox(width: 8),
                  _buildFilterChip(
                    context,
                    Icons.unfold_more_rounded,
                    isAscending
                        ? l10n.lessPoints
                        : l10n.morePoints,
                    onTap: () {
                      ref.read(badgeProvider.notifier).togglePointsSorting();
                    },
                  ),
                  const Spacer(),
                  Text(
                    l10n.badgesCount(badgeCount),
                    style: const TextStyle(
                        color: Color(0xFF64748B),
                        fontSize: 13,
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(BuildContext context, IconData icon, String label,
      {bool isFilterButton = false, VoidCallback? onTap}) {
    return InkWell(
      // Se um 'onTap' explícito for fornecido (como no caso da ordenação), ele tem prioridade máxima!
      onTap: onTap ??
          (isFilterButton ? () => _showFilterBottomSheet(context) : () {}),
      borderRadius: BorderRadius.circular(14),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: const Color(0xFFE2E8F0), width: 1.5),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 16, color: const Color(0xFF45556C)),
            const SizedBox(width: 4),
            Text(
              label,
              style: const TextStyle(
                  color: Color(0xFF45556C),
                  fontSize: 13,
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w500),
            ),
          ],
        ),
      ),
    );
  }

  void _showFilterBottomSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(20))),
      builder: (context) => const FilterBottomSheetContent(),
    );
  }

  Widget _buildEmptyState(AppLocalizations l10n) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.search_off_rounded,
              size: 44, color: Color(0xFF94A3B8)),
          const SizedBox(height: 8),
          Text(
            l10n.noBadgesMatchFilters,
            style: const TextStyle(
                color: Color(0xFF64748B),
                fontSize: 14,
                fontFamily: 'Inter',
                fontWeight: FontWeight.w500),
          ),
        ],
      ),
    );
  }
}
