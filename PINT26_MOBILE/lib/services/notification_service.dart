import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:projeto_pratico/config/api_config.dart';
import 'package:projeto_pratico/models/notification_model.dart';
import 'package:projeto_pratico/services/auth_storage.dart';
import 'package:flutter/foundation.dart';

class NotificationService {
  final String baseUrl = ApiConfig.baseUrl;

  Future<List<NotificationModel>> fetchNotifications() async {
    final token = await AuthStorage.getToken();
    if (token == null || token.isEmpty) {
      debugPrint('[NotificationService] Sem token guardado. A aguardar login.');
      return [];
    }

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/notificacao'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        
        List<dynamic> data = [];
        if (jsonResponse is Map && jsonResponse.containsKey('data')) {
           data = jsonResponse['data'];
        } else if (jsonResponse is List) {
           data = jsonResponse;
        }

        List<NotificationModel> notifications = [];
        for (var item in data) {
          try {
            notifications.add(NotificationModel.fromJson(item));
          } catch (e) {
            debugPrint('Erro ao parsear notificação: $e');
          }
        }
        
        // Ordenar as mais recentes primeiro
        notifications.sort((a, b) => b.createdAt.compareTo(a.createdAt));
        
        return notifications;
      } else {
        throw Exception('Falha ao obter notificações.');
      }
    } catch (e) {
      throw Exception('Falha na comunicação: $e');
    }
  }

  Future<void> markAsRead(String id) async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/notificacao/$id/lida'));

    try {
      final response = await http.put(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception('Falha ao marcar notificação como lida.');
      }
    } catch (e) {
      throw Exception('Falha na comunicação: $e');
    }
  }

  Future<void> markAllAsRead() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/notificacao/lidas-todas'));

    try {
      final response = await http.put(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode != 200 && response.statusCode != 204) {
        throw Exception('Falha ao marcar todas como lidas.');
      }
    } catch (e) {
      throw Exception('Falha na comunicação: $e');
    }
  }
}
