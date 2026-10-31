import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/models/notification_model.dart';
import 'package:projeto_pratico/riverpood/notification_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  String _filter = 'all'; // all, unread, read

  @override
  void initState() {
    super.initState();
    // Busca as notificações mais recentes assim que o ecrã abre
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationProvider.notifier).fetchNotifications();
    });
  }

  @override
  Widget build(BuildContext context) {
    final notificationsState = ref.watch(notificationProvider);
    final unreadCount = ref.watch(unreadNotificationsCountProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          AppLocalizations.of(context)!.alertsTitle,
          style: GoogleFonts.inter(
            color: const Color(0xFF0F172A),
            fontWeight: FontWeight.bold,
            fontSize: 19,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(1.0),
          child: Container(color: const Color(0xFFE2E8F0), height: 1.0),
        ),
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        actions: [
          if (unreadCount > 0)
            IconButton(
              icon: const Icon(Icons.done_all_rounded, color: Color(0xFF155DFC)),
              tooltip: AppLocalizations.of(context)!.markAllAsReadTooltip,
              onPressed: _showMarkAllAsReadDialog,
            ),
          IconButton(
            icon: const Icon(Icons.refresh_rounded, color: Color(0xFF64748B)),
            tooltip: AppLocalizations.of(context)!.refresh,
            onPressed: () => ref.read(notificationProvider.notifier).fetchNotifications(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Subtítulo e Toolbar de Filtros protegidos contra overflow
          Container(
            width: double.infinity,
            color: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                children: [
                  _buildFilterChip(AppLocalizations.of(context)!.filterAll, 'all', null),
                  const SizedBox(width: 8),
                  _buildFilterChip(AppLocalizations.of(context)!.filterUnread, 'unread', unreadCount > 0 ? unreadCount : null),
                  const SizedBox(width: 8),
                  _buildFilterChip(AppLocalizations.of(context)!.filterRead, 'read', null),
                ],
              ),
            ),
          ),
          Container(color: const Color(0xFFE2E8F0), height: 1.0),
          
          // Lista de Notificações
          Expanded(
            child: notificationsState.when(
              data: (notifications) {
                final filtered = notifications.where((n) {
                  if (_filter == 'unread' && n.lida) return false;
                  if (_filter == 'read' && !n.lida) return false;
                  return true;
                }).toList();

                if (filtered.isEmpty) {
                  return RefreshIndicator(
                    onRefresh: () => ref.read(notificationProvider.notifier).fetchNotifications(),
                    color: const Color(0xFF155DFC),
                    child: ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: [
                        SizedBox(
                          height: MediaQuery.of(context).size.height * 0.55,
                          child: _buildEmptyState(),
                        ),
                      ],
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () => ref.read(notificationProvider.notifier).fetchNotifications(),
                  color: const Color(0xFF155DFC),
                  child: ListView.separated(
                    physics: const AlwaysScrollableScrollPhysics(),
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    separatorBuilder: (context, index) => const SizedBox(height: 10),
                    itemBuilder: (context, index) {
                      final notif = filtered[index];
                      return _buildNotificationCard(notif);
                    },
                  ),
                );
              },
              loading: () => const Center(
                child: CircularProgressIndicator(color: Color(0xFF155DFC)),
              ),
              error: (error, stack) => Center(
                child: Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline_rounded, color: Colors.redAccent, size: 48),
                      const SizedBox(height: 12),
                      Text(
                        AppLocalizations.of(context)!.errorLoadingAlerts,
                        style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 16),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        '$error',
                        textAlign: TextAlign.center,
                        style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 13),
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton.icon(
                        onPressed: () => ref.read(notificationProvider.notifier).fetchNotifications(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF155DFC),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                        ),
                        icon: const Icon(Icons.refresh_rounded, color: Colors.white, size: 18),
                        label: Text(AppLocalizations.of(context)!.tryAgain, style: const TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value, int? count) {
    final isSelected = _filter == value;
    return ChoiceChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: GoogleFonts.inter(
              color: isSelected ? Colors.white : const Color(0xFF334155),
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
              fontSize: 13,
            ),
          ),
          if (count != null && count > 0) ...[
            const SizedBox(width: 6),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
              decoration: BoxDecoration(
                color: isSelected ? Colors.white : const Color(0xFFEF4444),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(
                count > 99 ? '99+' : '$count',
                style: TextStyle(
                  color: isSelected ? const Color(0xFF155DFC) : Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ],
      ),
      selected: isSelected,
      selectedColor: const Color(0xFF155DFC),
      backgroundColor: const Color(0xFFF1F5F9),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      side: BorderSide(
        color: isSelected ? const Color(0xFF155DFC) : const Color(0xFFE2E8F0),
      ),
      onSelected: (selected) {
        if (selected) {
          setState(() {
            _filter = value;
          });
        }
      },
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: const Icon(Icons.notifications_none_rounded, size: 48, color: Color(0xFF94A3B8)),
          ),
          const SizedBox(height: 16),
          Text(
            AppLocalizations.of(context)!.noAlertsFound,
            style: GoogleFonts.inter(
              color: const Color(0xFF334155),
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 6),
          Text(
            AppLocalizations.of(context)!.pullToRefresh,
            style: GoogleFonts.inter(
              color: const Color(0xFF94A3B8),
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationCard(NotificationModel notif) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _showNotificationDetails(notif),
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: notif.lida ? Colors.white : const Color(0xFFF0F6FF),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: notif.lida ? const Color(0xFFE2E8F0) : const Color(0xFF93C5FD),
              width: notif.lida ? 1.0 : 1.2,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 4,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Indicador não lida
              Container(
                margin: const EdgeInsets.only(top: 4, right: 10),
                width: 9,
                height: 9,
                decoration: BoxDecoration(
                  color: notif.lida ? Colors.transparent : const Color(0xFF155DFC),
                  shape: BoxShape.circle,
                ),
              ),
              // Conteúdo principal
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            notif.titulo.isNotEmpty ? notif.titulo : AppLocalizations.of(context)!.systemAlert,
                            style: GoogleFonts.inter(
                              fontSize: 14.5,
                              fontWeight: notif.lida ? FontWeight.w500 : FontWeight.w700,
                              color: notif.lida ? const Color(0xFF334155) : const Color(0xFF0F172A),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          _formatDate(notif.createdAt),
                          style: GoogleFonts.inter(
                            fontSize: 11,
                            color: const Color(0xFF94A3B8),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Row(
                      children: [
                        // Tag de Tipo
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                          decoration: BoxDecoration(
                            color: _getTypeColor(notif).withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(6),
                            border: Border.all(
                              color: _getTypeColor(notif).withValues(alpha: 0.25),
                            ),
                          ),
                          child: Text(
                            notif.tipo.isNotEmpty ? notif.tipo : AppLocalizations.of(context)!.general,
                            style: GoogleFonts.inter(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: _getTypeColor(notif),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        // Emissor
                        Expanded(
                          child: Text(
                            notif.emissor,
                            overflow: TextOverflow.ellipsis,
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ),
                        // Botão "Ler"
                        InkWell(
                          onTap: () => _showNotificationDetails(notif),
                          child: Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Text('📖 ', style: TextStyle(fontSize: 11)),
                                Text(
                                  AppLocalizations.of(context)!.readAction,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: const Color(0xFF155DFC),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getTypeColor(NotificationModel notif) {
    if (notif.isApproval) return const Color(0xFF059669); // Verde esmeralda
    if (notif.isRejection) return const Color(0xFFDC2626); // Vermelho
    if (notif.isReturn) return const Color(0xFFD97706); // Âmbar
    if (notif.isExpiration) return const Color(0xFFEA580C); // Laranja
    if (notif.isReminder) return const Color(0xFF7C3AED); // Roxo
    if (notif.isMilestone) return const Color(0xFFCA8A04); // Amarelo escuro
    if (notif.isForum) return const Color(0xFF0891B2); // Ciano
    return const Color(0xFF2563EB); // Azul padrão
  }

  void _showNotificationDetails(NotificationModel notif) {
    // Marca como lida na API e localmente se ainda não estiver lida
    if (!notif.lida) {
      ref.read(notificationProvider.notifier).markAsRead(notif.id);
    }

    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          surfaceTintColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          titlePadding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
          contentPadding: const EdgeInsets.fromLTRB(20, 0, 20, 16),
          title: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                notif.titulo.isNotEmpty ? notif.titulo : AppLocalizations.of(context)!.systemAlert,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 17,
                  color: const Color(0xFF0F172A),
                ),
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: _getTypeColor(notif).withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(
                        color: _getTypeColor(notif).withValues(alpha: 0.25),
                      ),
                    ),
                    child: Text(
                      notif.tipo.isNotEmpty ? notif.tipo : AppLocalizations.of(context)!.general,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: _getTypeColor(notif),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const Spacer(),
                  Text(
                    _formatDate(notif.createdAt),
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: const Color(0xFF94A3B8),
                    ),
                  ),
                ],
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 6),
              Text(
                '${AppLocalizations.of(context)!.fromPrefix}${notif.emissor}',
                style: GoogleFonts.inter(
                  fontSize: 12.5,
                  fontWeight: FontWeight.w500,
                  color: const Color(0xFF64748B),
                ),
              ),
              const Divider(height: 20, color: Color(0xFFE2E8F0)),
              Container(
                width: double.infinity,
                constraints: const BoxConstraints(maxHeight: 280),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    notif.mensagem.isNotEmpty ? notif.mensagem : AppLocalizations.of(context)!.noAdditionalContent,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: const Color(0xFF1E293B),
                      height: 1.45,
                    ),
                  ),
                ),
              ),
            ],
          ),
          actionsPadding: const EdgeInsets.fromLTRB(16, 0, 16, 12),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(
                AppLocalizations.of(context)!.closeButton,
                style: GoogleFonts.inter(
                  color: const Color(0xFF155DFC),
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  void _showMarkAllAsReadDialog() {
    showDialog(
      context: context,
      builder: (context) {
        return AlertDialog(
          backgroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Text(
            AppLocalizations.of(context)!.markAllAsReadTitle,
            style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 17),
          ),
          content: Text(
            AppLocalizations.of(context)!.markAllAsReadMessage,
            style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF475569)),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: Text(AppLocalizations.of(context)!.cancel, style: GoogleFonts.inter(color: const Color(0xFF64748B))),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF155DFC),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              onPressed: () async {
                await ref.read(notificationProvider.notifier).markAllAsRead();
                if (context.mounted) {
                  Navigator.of(context).pop();
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(
                        AppLocalizations.of(context)!.allMarkedAsReadSuccess,
                        style: GoogleFonts.inter(),
                      ),
                      backgroundColor: const Color(0xFF059669),
                    ),
                  );
                }
              },
              child: Text(AppLocalizations.of(context)!.yesConfirm, style: const TextStyle(color: Colors.white)),
            ),
          ],
        );
      },
    );
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final difference = now.difference(date);
    final l10n = AppLocalizations.of(context)!;

    if (difference.inDays == 0) {
      if (difference.inHours == 0) {
        if (difference.inMinutes == 0) {
          return l10n.now;
        }
        return '${difference.inMinutes} ${l10n.minsAgo}';
      }
      return '${difference.inHours}${l10n.hoursAgo}';
    } else if (difference.inDays == 1) {
      return '${l10n.yesterdayAt}${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    } else {
      return '${date.day.toString().padLeft(2, '0')}/${date.month.toString().padLeft(2, '0')}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
    }
  }
}
