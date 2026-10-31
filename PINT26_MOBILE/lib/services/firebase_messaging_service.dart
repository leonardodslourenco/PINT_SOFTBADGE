import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:projeto_pratico/config/app_navigator.dart';

// Handler de mensagens em segundo plano ou quando a aplicação está fechada / ecrã bloqueado
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint(
      '[FCM Background] Notificação recebida em segundo plano: ${message.notification?.title} - ${message.notification?.body}');
}

class FirebaseMessagingService {
  static final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  static final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'softbadge_notifications', // ID correspondente ao backend (firebase.service.js)
    'Notificações SoftBadge',
    description: 'Canal de notificações oficiais do sistema SoftBadge',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
    showBadge: true,
  );

  /// Callback global para sincronização em tempo real de dados na aplicação (Riverpod)
  /// Invocado quando uma notificação FCM é recebida (em primeiro plano ou aberta)
  static VoidCallback? onDataSyncNeeded;

  /// Inicializa o Firebase e o serviço de notificações Push
  static Future<void> initialize() async {
    try {
      // 1. Inicializar Firebase Core
      await Firebase.initializeApp();
      debugPrint('[Firebase] Firebase inicializado com sucesso.');

      // 2. Registar o handler de background
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // 3. Solicitar permissões ao utilizador (Obrigatório no Android 13+)
      final settings = await _fcm.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      debugPrint(
          '[Firebase] Estado da permissão de notificações: ${settings.authorizationStatus}');

      // 4. Criar o canal de notificação com prioridade MAX no Android
      if (!kIsWeb) {
        final androidPlugin = _localNotifications
            .resolvePlatformSpecificImplementation<
                AndroidFlutterLocalNotificationsPlugin>();
        if (androidPlugin != null) {
          await androidPlugin.createNotificationChannel(_channel);
          debugPrint('[Firebase] Canal Android ${_channel.id} criado com sucesso.');
        }

        // Inicializar o plugin de notificações locais para responder ao toque do utilizador
        const androidInit = AndroidInitializationSettings('@mipmap/launcher_icon');
        await _localNotifications.initialize(
          const InitializationSettings(android: androidInit),
          onDidReceiveNotificationResponse: (NotificationResponse response) {
            debugPrint('[LocalNotification] Clique na notificação local');
            AppNavigator.toNotifications();
          },
        );
      }

      // 5. Configurar apresentação em primeiro plano (quando o app está aberto)
      await _fcm.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );

      // 6. Ouvir notificações recebidas com o app em primeiro plano
      FirebaseMessaging.onMessage.listen((RemoteMessage message) {
        debugPrint(
            '[FCM Foreground] Mensagem recebida: ${message.notification?.title}');

        // Disparar sincronização silenciosa em tempo real dos estados Riverpod
        try {
          onDataSyncNeeded?.call();
        } catch (e) {
          debugPrint('[FCM] Erro ao sincronizar dados em tempo real: $e');
        }

        final notification = message.notification;
        if (notification != null) {
          _localNotifications.show(
            notification.hashCode,
            notification.title,
            notification.body,
            NotificationDetails(
              android: AndroidNotificationDetails(
                _channel.id,
                _channel.name,
                channelDescription: _channel.description,
                icon: '@mipmap/launcher_icon',
                importance: Importance.max,
                priority: Priority.high,
                visibility: NotificationVisibility.public, // Visível no ecrã bloqueado
              ),
            ),
            payload: 'notifications',
          );
        }
      });

      // 7. Ouvir clique na notificação quando a aplicação está em segundo plano (minimizada ou ecrã bloqueado)
      FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
        debugPrint('[FCM] Notificação clicada em segundo plano: ${message.data}');
        try {
          onDataSyncNeeded?.call();
        } catch (e) {
          debugPrint('[FCM] Erro ao sincronizar dados em tempo real: $e');
        }
        AppNavigator.toNotifications();
      });

      // 8. Verificar se a aplicação foi aberta diretamente através do clique numa notificação (com a app fechada)
      _fcm.getInitialMessage().then((RemoteMessage? message) {
        if (message != null) {
          debugPrint('[FCM] App iniciada a partir de notificação push: ${message.data}');
          try {
            onDataSyncNeeded?.call();
          } catch (e) {
            debugPrint('[FCM] Erro ao sincronizar dados em tempo real: $e');
          }
          WidgetsBinding.instance.addPostFrameCallback((_) {
            Future.delayed(const Duration(milliseconds: 600), () {
              AppNavigator.toNotifications();
            });
          });
        }
      });

      // 9. Obter e exibir o FCM Token para depuração
      final token = await _fcm.getToken();
      debugPrint('[Firebase FCM Token] $token');
    } catch (e) {
      debugPrint('[Firebase] Erro ao inicializar Firebase Messaging: $e');
    }
  }

  /// Subscreve os 3 canais oficiais:
  /// 1. 'global' (avisos gerais da empresa)
  /// 2. 'room_consultor' (canal específico de todos os consultores)
  /// 3. 'user_<id>' (canal privado do utilizador para respostas a candidaturas)
  static Future<void> subscribeToConsultorTopics(String userId) async {
    try {
      // 1. Canal Global
      await _fcm.subscribeToTopic('global');
      debugPrint('[FCM] Subscrito com sucesso ao tópico: global');

      // 2. Canal do Grupo de Consultores
      await _fcm.subscribeToTopic('room_consultor');
      debugPrint('[FCM] Subscrito com sucesso ao tópico: room_consultor');

      // 3. Canal Privado do Utilizador
      if (userId.isNotEmpty) {
        final cleanUserId = userId.replaceAll(RegExp(r'[^a-zA-Z0-9-_.~%]'), '_');
        final userTopic = 'user_$cleanUserId';
        await _fcm.subscribeToTopic(userTopic);
        debugPrint('[FCM] Subscrito com sucesso ao tópico pessoal: $userTopic');
      }
    } catch (e) {
      debugPrint('[FCM] Erro ao subscrever tópicos: $e');
    }
  }

  /// Cancela a subscrição dos canais aquando do Logout
  static Future<void> unsubscribeFromConsultorTopics(String userId) async {
    try {
      await _fcm.unsubscribeFromTopic('global');
      await _fcm.unsubscribeFromTopic('room_consultor');
      if (userId.isNotEmpty) {
        final cleanUserId = userId.replaceAll(RegExp(r'[^a-zA-Z0-9-_.~%]'), '_');
        await _fcm.unsubscribeFromTopic('user_$cleanUserId');
      }
      debugPrint('[FCM] Canceladas subscrições dos tópicos do consultor.');
    } catch (e) {
      debugPrint('[FCM] Erro ao cancelar subscrições: $e');
    }
  }
}
