import 'package:flutter/material.dart';

/// Chave e métodos globais de navegação sem depender de BuildContext.
/// Permite que serviços de background (como Firebase e Notificações)
/// redirecionem o utilizador para ecrãs específicos ao tocar em notificações.
class AppNavigator {
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  /// Navega para o ecrã de Avisos / Notificações com segurança mesmo durante o arranque
  static void toNotifications() {
    debugPrint('[AppNavigator] Redirecionando para o ecrã de Avisos...');
    if (navigatorKey.currentState != null) {
      navigatorKey.currentState!.pushNamed('/notifications');
    } else {
      // Se a app ainda estiver a inicializar o primeiro frame ao desbloquear o ecrã
      WidgetsBinding.instance.addPostFrameCallback((_) {
        Future.delayed(const Duration(milliseconds: 500), () {
          navigatorKey.currentState?.pushNamed('/notifications');
        });
      });
    }
  }
}
