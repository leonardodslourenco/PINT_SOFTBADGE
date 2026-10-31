import 'package:flutter/foundation.dart';
import 'package:projeto_pratico/services/metricas_service.dart';

/// Representa um alerta de expiração de badge
class BadgeExpirationAlert {
  final String idBadge;
  final String badgeTitle;
  final DateTime dataExpiracao;
  final int diasRestantes;

  BadgeExpirationAlert({
    required this.idBadge,
    required this.badgeTitle,
    required this.dataExpiracao,
    required this.diasRestantes,
  });

  /// Nível de urgência baseado nos dias restantes
  String get urgencyLevel {
    if (diasRestantes <= 1) return 'critico';   // Expira hoje ou amanhã
    if (diasRestantes <= 7) return 'alto';       // Expira esta semana
    if (diasRestantes <= 30) return 'medio';     // Expira este mês
    return 'baixo';
  }

  /// Mensagem formatada para o utilizador
  String get message {
    if (diasRestantes <= 0) return 'Badge expirado!';
    if (diasRestantes == 1) return 'Expira amanhã!';
    if (diasRestantes <= 7) return 'Expira em $diasRestantes dias';
    return 'Expira em $diasRestantes dias';
  }
}

/// Serviço que calcula alertas de expiração com base nos badges atribuídos
class BadgeExpirationService {
  final MetricasService _metricasService = MetricasService();

  /// Busca badges atribuídos com data de expiração e calcula alertas
  Future<List<BadgeExpirationAlert>> getExpirationAlerts(String userId) async {
    try {
      final atribuidos = await _metricasService.fetchMeusBadgesAtribuidos(userId);
      
      final now = DateTime.now();
      final List<BadgeExpirationAlert> alerts = [];

      for (var badge in atribuidos) {
        if (badge.dataExpiracao != null && badge.atribuicaoAtiva) {
          final diasRestantes = badge.dataExpiracao!.difference(now).inDays;
          
          // Alertar se expira nos próximos 30 dias
          if (diasRestantes <= 30) {
            alerts.add(BadgeExpirationAlert(
              idBadge: badge.idBadge,
              badgeTitle: badge.idBadge, // Será enriquecido pelo notifier
              dataExpiracao: badge.dataExpiracao!,
              diasRestantes: diasRestantes,
            ));
          }
        }
      }

      // Ordenar por urgência (mais urgente primeiro)
      alerts.sort((a, b) => a.diasRestantes.compareTo(b.diasRestantes));

      debugPrint('--- [BadgeExpirationService] ${alerts.length} alertas de expiração ---');
      return alerts;
    } catch (e) {
      debugPrint('--- [BadgeExpirationService] Erro: $e ---');
      return [];
    }
  }
}
