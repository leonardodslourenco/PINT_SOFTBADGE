import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'package:projeto_pratico/models/area_model.dart';
import 'package:projeto_pratico/services/auth_storage.dart';
import 'package:projeto_pratico/config/api_config.dart';

// Serviço de Áreas Técnicas — comunicação com os endpoints:
// - GET /area       → Listar todas as áreas
// - GET /area/sl/:id → Listar áreas por Service Line

class AreaService {
  final String baseUrl = ApiConfig.baseUrl;

  // Helper para obter headers autenticados
  Future<Map<String, String>> _authHeaders() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');
    return {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  // ─── LISTAR TODAS AS ÁREAS ────────────────────────────────────────────────
  // GET /area
  Future<List<AreaModel>> fetchAllAreas() async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/area'));

    try {
      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        debugPrint('--- [AreaService] ${data.length} áreas recebidas ---');

        return data.map((e) => AreaModel.fromJson(e)).toList();
      } else {
        throw Exception('Falha ao listar áreas: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [AreaService] Erro fetchAllAreas: $e ---');
      rethrow;
    }
  }

  // ─── LISTAR ÁREAS POR SERVICE LINE ────────────────────────────────────────
  // GET /area/sl/:id
  Future<List<AreaModel>> fetchAreasByServiceLine(int idServiceLine) async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/area/sl/$idServiceLine'));

    try {
      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        return data.map((e) => AreaModel.fromJson(e)).toList();
      } else {
        throw Exception(
            'Falha ao listar áreas por service line: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [AreaService] Erro fetchAreasByServiceLine: $e ---');
      rethrow;
    }
  }

  // ─── ATUALIZAR ÁREA DO UTILIZADOR ──────────────────────────────────────────
  // PUT /utilizador/:id — envia id_area para atualizar no backend
  Future<bool> updateUserArea(String userId, int idArea) async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/utilizador/$userId'));

    try {
      final response = await http.put(
        url,
        headers: headers,
        body: jsonEncode({'id_area': idArea}),
      );

      if (response.statusCode == 200) {
        debugPrint('--- [AreaService] Área do utilizador atualizada: $idArea ---');
        return true;
      } else {
        debugPrint('--- [AreaService] Erro ao atualizar área: ${response.statusCode} ---');
        return false;
      }
    } catch (e) {
      debugPrint('--- [AreaService] Erro updateUserArea: $e ---');
      return false;
    }
  }
}
