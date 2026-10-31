import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import 'package:projeto_pratico/services/badge_expiration_service.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';

/// Estado dos alertas de expiração
class BadgeExpirationState {
  final List<BadgeExpirationAlert> alerts;
  final bool isLoading;

  BadgeExpirationState({
    this.alerts = const [],
    this.isLoading = false,
  });

  /// Número de badges em urgência crítica (≤ 7 dias)
  int get urgentCount => alerts.where((a) => 
    a.urgencyLevel == 'critico' || a.urgencyLevel == 'alto'
  ).length;

  /// Verdadeiro se houver pelo menos um alerta
  bool get hasAlerts => alerts.isNotEmpty;
}

class BadgeExpirationNotifier extends StateNotifier<BadgeExpirationState> {
  final BadgeExpirationService _service = BadgeExpirationService();
  final Ref _ref;

  BadgeExpirationNotifier(this._ref) : super(BadgeExpirationState());

  /// Carrega alertas de expiração para o utilizador
  Future<void> loadExpirationAlerts(String userId) async {
    state = BadgeExpirationState(isLoading: true);

    try {
      final alerts = await _service.getExpirationAlerts(userId);

      // Enriquecer títulos com dados do catálogo de badges
      final badgeState = _ref.read(badgeProvider);
      final enrichedAlerts = alerts.map((alert) {
        final catalogBadge = badgeState.badges.firstWhere(
          (b) => b.id == alert.idBadge,
          orElse: () => badgeState.badges.isNotEmpty 
            ? badgeState.badges.first 
            : throw Exception('Badge não encontrado'),
        );
        return BadgeExpirationAlert(
          idBadge: alert.idBadge,
          badgeTitle: catalogBadge.title,
          dataExpiracao: alert.dataExpiracao,
          diasRestantes: alert.diasRestantes,
        );
      }).toList();

      state = BadgeExpirationState(alerts: enrichedAlerts);
    } catch (e) {
      debugPrint('--- [BadgeExpirationNotifier] Erro: $e ---');
      state = BadgeExpirationState(alerts: []);
    }
  }
}

final badgeExpirationProvider = StateNotifierProvider<BadgeExpirationNotifier, BadgeExpirationState>((ref) {
  return BadgeExpirationNotifier(ref);
});
