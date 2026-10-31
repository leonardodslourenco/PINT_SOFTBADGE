import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/models/notification_model.dart';
import 'package:projeto_pratico/services/notification_service.dart';
import 'package:projeto_pratico/services/app_badge_service.dart';

final notificationServiceProvider = Provider<NotificationService>((ref) {
  return NotificationService();
});

final notificationProvider = StateNotifierProvider<NotificationNotifier, AsyncValue<List<NotificationModel>>>((ref) {
  final service = ref.read(notificationServiceProvider);
  return NotificationNotifier(service);
});

class NotificationNotifier extends StateNotifier<AsyncValue<List<NotificationModel>>> {
  final NotificationService _service;
  Timer? _pollingTimer;

  NotificationNotifier(this._service) : super(const AsyncValue.loading()) {
    fetchNotifications();
    _startPolling();
  }

  // ─── POLLING PERIÓDICO (60s) ────────────────────────────────────────────
  void _startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 60), (_) {
      _pollForNewNotifications();
    });
  }

  /// Verifica se há novas notificações sem forçar loading na UI
  Future<void> _pollForNewNotifications() async {
    try {
      final notifications = await _service.fetchNotifications();
      
      // Comparar com estado atual para detetar novas
      final currentCount = state.valueOrNull?.where((n) => !n.lida).length ?? 0;
      final newCount = notifications.where((n) => !n.lida).length;
      
      if (newCount > currentCount) {
        debugPrint('--- [NotificationNotifier] ${newCount - currentCount} nova(s) notificação(ões) ---');
      }
      
      state = AsyncValue.data(notifications);
      _updateLauncherBadge(notifications);
    } catch (e) {
      debugPrint('--- [NotificationNotifier] Erro no polling: $e ---');
      // Não sobrescrever dados existentes em caso de erro de polling
    }
  }

  Future<void> fetchNotifications() async {
    try {
      // Não forçar loading completo se já houver dados para não piscar o ecrã ao fazer pull-to-refresh
      if (!state.hasValue) {
         state = const AsyncValue.loading();
      }
      final notifications = await _service.fetchNotifications();
      state = AsyncValue.data(notifications);
      _updateLauncherBadge(notifications);
    } catch (e, stackTrace) {
      state = AsyncValue.error(e, stackTrace);
    }
  }

  Future<void> markAsRead(String id) async {
    try {
      // Atualização otimista na UI
      if (state is AsyncData<List<NotificationModel>>) {
        final currentList = state.value!;
        final updatedList = currentList.map((notif) {
          if (notif.id == id && !notif.lida) {
            return notif.copyWith(lida: true);
          }
          return notif;
        }).toList();
        state = AsyncValue.data(updatedList);
        _updateLauncherBadge(updatedList);
      }
      
      // Chamada à API
      await _service.markAsRead(id);
    } catch (e) {
      // Reverter caso falhe
      fetchNotifications();
    }
  }

  Future<void> markAllAsRead() async {
    try {
      // Atualização otimista
      if (state is AsyncData<List<NotificationModel>>) {
        final currentList = state.value!;
        final updatedList = currentList.map((notif) {
          return notif.copyWith(lida: true);
        }).toList();
        state = AsyncValue.data(updatedList);
        _updateLauncherBadge(updatedList);
      }

      // Chamada à API
      await _service.markAllAsRead();
    } catch (e) {
      // Reverter caso falhe
      fetchNotifications();
    }
  }

  void _updateLauncherBadge(List<NotificationModel> notifications) {
    final unreadAvisos = notifications.where((n) => !n.lida).length;
    AppBadgeService.updateBadgeCount(unreadAvisos);
  }

  void reset() {
    state = const AsyncValue.data([]);
    AppBadgeService.removeBadge();
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
}

// Provider auxiliar para contar as notificações não lidas e usar no badge do header
final unreadNotificationsCountProvider = Provider<int>((ref) {
  final notificationsState = ref.watch(notificationProvider);
  return notificationsState.maybeWhen(
    data: (notifications) => notifications.where((n) => !n.lida).length,
    orElse: () => 0,
  );
});

// Provider para contar notificações de novos Badges (Aprovações)
final unreadBadgesCountProvider = Provider<int>((ref) {
  final notificationsState = ref.watch(notificationProvider);
  return notificationsState.maybeWhen(
    data: (notifications) => notifications.where((n) => !n.lida && n.isApproval).length,
    orElse: () => 0,
  );
});

// Provider para contar notificações de atualizações nos Pedidos (Rejeições / Retornos)
final unreadPedidosCountProvider = Provider<int>((ref) {
  final notificationsState = ref.watch(notificationProvider);
  return notificationsState.maybeWhen(
    data: (notifications) => notifications.where((n) => !n.lida && (n.isRejection || n.isReturn)).length,
    orElse: () => 0,
  );
});
