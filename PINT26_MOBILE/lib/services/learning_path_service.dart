import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:projeto_pratico/config/api_config.dart';
import 'package:projeto_pratico/models/learning_path_model.dart';
import 'package:projeto_pratico/models/service_line_model.dart';
import 'package:projeto_pratico/models/area_model.dart';
import 'package:projeto_pratico/models/nivel_area_model.dart';
import 'package:projeto_pratico/models/badge_model.dart';
import 'package:projeto_pratico/services/auth_storage.dart';

/// Serviço centralizado para toda a hierarquia de Learning Paths.
/// Endpoints consumidos:
///   GET /learning_path
///   GET /service_line/lp/:id
///   GET /area/sl/:id
///   GET /nivel_area/area/:id
///   GET /api/badges/nivel/:id
///   GET /requisito_nivel/nivel/:id
class LearningPathService {
  final String _baseUrl = ApiConfig.baseUrl;

  /// Headers comuns — inclui o token de auth guardado no SharedPreferences
  Future<Map<String, String>> _headers() async {
    final token = await AuthStorage.getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Busca toda a árvore de LPs com progresso do utilizador num único request
  Future<List<dynamic>> fetchProgressos(String userId) async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.appendLang('$_baseUrl/metricas/dashboard/lp-progress/$userId?lang=pt')),
        headers: await _headers(),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body['success'] == true && body['data'] != null) {
          return body['data'] as List<dynamic>;
        }
      }
      debugPrint('--- [LP Service] fetchProgressos status: ${response.statusCode} ---');
      return [];
    } catch (e) {
      debugPrint('--- [LP Service] fetchProgressos erro: $e ---');
      return [];
    }
  }

  // ─── LEARNING PATHS ───────────────────────────────────────────────────────

  /// Lista todas as Learning Paths ativas
  Future<List<LearningPathModel>> fetchAllLearningPaths() async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.appendLang('$_baseUrl/learning_path?ativo=true&lang=pt')),
        headers: await _headers(),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body['success'] == true && body['data'] != null) {
          return (body['data'] as List)
              .map((json) => LearningPathModel.fromJson(json))
              .toList();
        }
      }
      debugPrint('--- [LP Service] fetchAllLPs status: ${response.statusCode} ---');
      return [];
    } catch (e) {
      debugPrint('--- [LP Service] fetchAllLPs erro: $e ---');
      return [];
    }
  }

  // ─── SERVICE LINES ────────────────────────────────────────────────────────

  /// Lista as Service Lines de uma Learning Path
  Future<List<ServiceLineModel>> fetchServiceLinesByLP(int idLearningPath) async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.appendLang('$_baseUrl/service_line/lp/$idLearningPath?ativo=true&lang=pt')),
        headers: await _headers(),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body['success'] == true && body['data'] != null) {
          return (body['data'] as List)
              .map((json) => ServiceLineModel.fromJson(json))
              .toList();
        }
      }
      debugPrint('--- [LP Service] fetchSLsByLP status: ${response.statusCode} ---');
      return [];
    } catch (e) {
      debugPrint('--- [LP Service] fetchSLsByLP erro: $e ---');
      return [];
    }
  }

  // ─── ÁREAS ────────────────────────────────────────────────────────────────

  /// Lista as Áreas de uma Service Line
  Future<List<AreaModel>> fetchAreasBySL(int idServiceLine) async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.appendLang('$_baseUrl/area/sl/$idServiceLine?ativo=true&lang=pt')),
        headers: await _headers(),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body['success'] == true && body['data'] != null) {
          return (body['data'] as List)
              .map((json) => AreaModel.fromJson(json))
              .toList();
        }
      }
      debugPrint('--- [LP Service] fetchAreasBySL status: ${response.statusCode} ---');
      return [];
    } catch (e) {
      debugPrint('--- [LP Service] fetchAreasBySL erro: $e ---');
      return [];
    }
  }

  // ─── NÍVEIS ───────────────────────────────────────────────────────────────

  /// Lista os Níveis de uma Área
  Future<List<NivelAreaModel>> fetchNiveisByArea(int idArea) async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.appendLang('$_baseUrl/nivel_area/area/$idArea?ativo=true&lang=pt')),
        headers: await _headers(),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body['success'] == true && body['data'] != null) {
          return (body['data'] as List)
              .map((json) => NivelAreaModel.fromJson(json))
              .toList();
        }
      }
      debugPrint('--- [LP Service] fetchNiveisByArea status: ${response.statusCode} ---');
      return [];
    } catch (e) {
      debugPrint('--- [LP Service] fetchNiveisByArea erro: $e ---');
      return [];
    }
  }

  // ─── BADGES POR NÍVEL ─────────────────────────────────────────────────────

  /// Lista os Badges associados a um Nível
  Future<List<BadgeModel>> fetchBadgesByNivel(int idNivel) async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.appendLang('$_baseUrl/api/badges/nivel/$idNivel?lang=pt')),
        headers: await _headers(),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body['success'] == true && body['data'] != null) {
          return (body['data'] as List)
              .map((json) => BadgeModel.fromJson(json))
              .toList();
        }
      }
      debugPrint('--- [LP Service] fetchBadgesByNivel status: ${response.statusCode} ---');
      return [];
    } catch (e) {
      debugPrint('--- [LP Service] fetchBadgesByNivel erro: $e ---');
      return [];
    }
  }

  // ─── REQUISITOS POR NÍVEL ─────────────────────────────────────────────────

  /// Lista os Requisitos de um Nível
  Future<List<Map<String, dynamic>>> fetchRequisitosByNivel(int idNivel) async {
    try {
      final response = await http.get(
        Uri.parse(ApiConfig.appendLang('$_baseUrl/requisito_nivel/nivel/$idNivel?lang=pt')),
        headers: await _headers(),
      );

      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        if (body['success'] == true && body['data'] != null) {
          return List<Map<String, dynamic>>.from(body['data']);
        }
      }
      return [];
    } catch (e) {
      debugPrint('--- [LP Service] fetchRequisitosByNivel erro: $e ---');
      return [];
    }
  }
}
