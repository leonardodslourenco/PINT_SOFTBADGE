import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:projeto_pratico/models/badge_model.dart';
import 'package:projeto_pratico/services/auth_storage.dart';
import 'package:projeto_pratico/config/api_config.dart';

// Carregar badges & os seus requisitos

class BadgeService {
  final String baseUrl = ApiConfig.baseUrl;

  Future<List<BadgeModel>> fetchAllBadges() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/badge'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        List<BadgeModel> badgesProcessados = [];
        for (var item in data) {
          try {
            badgesProcessados.add(BadgeModel.fromJson(item));
          } catch (e) {
            debugPrint('Erro ao parsear Badge: $e');
          }
        }
        return badgesProcessados;
      } else {
        throw Exception('Falha ao obter catálogo de badges.');
      }
    } catch (e) {
      throw Exception('Falha na comunicação: $e');
    }
  }

  Future<List<RequirementModel>> fetchRequirementsByBadge(
      String badgeId) async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/requisito_badge/badge/$badgeId'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        List<RequirementModel> requirementsProcessados = [];
        for (var item in data) {
          try {
            requirementsProcessados.add(RequirementModel.fromJson(item));
          } catch (e) {
            debugPrint('Erro ao parsear Requisito: $e');
          }
        }
        return requirementsProcessados;
      } else {
        throw Exception('Falha ao obter requisitos.');
      }
    } catch (e) {
      throw Exception('Falha na comunicação: $e');
    }
  }

  // Adiciona esta função ao teu serviço
  Future<bool> toggleBadgeVisibility(String idBadge, bool isPublic) async {
    final token = await AuthStorage.getToken();
    
    // O URL exato depende da rota que o teu colega criou no Node.js
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/badges/visibility')); 

    try {
      final response = await http.patch(
        url,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
        body: jsonEncode({
          'id_badge': idBadge,
          'is_public': isPublic,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        return true;
      } else {
        throw Exception('Falha ao atualizar a visibilidade');
      }
    } catch (e) {
      debugPrint('Erro no toggle de visibilidade: $e');
      rethrow;
    }
  }
}
