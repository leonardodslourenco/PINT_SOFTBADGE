import 'package:flutter/foundation.dart';
import 'package:app_badge_plus/app_badge_plus.dart';

/// Serviço responsável por atualizar o contador numérico exibido no ícone
/// da aplicação no ecrã inicial do telemóvel (Android Launcher / iOS Badge).
///
/// Garante que o contador reflete exclusivamente os Avisos não lidos.
class AppBadgeService {
  /// Atualiza o número no ícone da aplicação
  static Future<void> updateBadgeCount(int count) async {
    if (kIsWeb) return;
    try {
      final isSupported = await AppBadgePlus.isSupported();
      if (isSupported) {
        await AppBadgePlus.updateBadge(count > 0 ? count : 0);
        debugPrint('[AppBadgeService] Contador do ícone da app atualizado para: $count');
      } else {
        debugPrint('[AppBadgeService] O launcher deste dispositivo não suporta badges numéricos diretamente.');
      }
    } catch (e) {
      debugPrint('[AppBadgeService] Erro ao atualizar contador do ícone: $e');
    }
  }

  /// Remove o contador numérico do ícone da aplicação
  static Future<void> removeBadge() async {
    if (kIsWeb) return;
    try {
      final isSupported = await AppBadgePlus.isSupported();
      if (isSupported) {
        await AppBadgePlus.updateBadge(0);
        debugPrint('[AppBadgeService] Contador do ícone limpo com sucesso.');
      }
    } catch (e) {
      debugPrint('[AppBadgeService] Erro ao limpar badge: $e');
    }
  }
}
