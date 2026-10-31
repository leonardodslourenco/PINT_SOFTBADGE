import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'package:projeto_pratico/models/acao_candidatura_model.dart';
import 'package:projeto_pratico/services/auth_storage.dart';
import 'package:projeto_pratico/config/api_config.dart';

// Serviço de Histórico de Ações das Candidaturas — comunicação com:
// - GET /acao_candidatura/candidatura/:id → Listar ações de uma candidatura

class AcaoCandidaturaService {
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

  // ─── LISTAR AÇÕES DE UMA CANDIDATURA ──────────────────────────────────────
  // GET /acao_candidatura/candidatura/:id
  Future<List<AcaoCandidaturaModel>> fetchAcoesByCandidatura(
      String idCandidatura) async {
    final headers = await _authHeaders();
    final url =
        Uri.parse(ApiConfig.appendLang('$baseUrl/acao_candidatura/candidatura/$idCandidatura'));

    try {
      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        debugPrint(
            '--- [AcaoService] ${data.length} ações recebidas para candidatura $idCandidatura ---');

        return data.map((e) => AcaoCandidaturaModel.fromJson(e)).toList();
      } else {
        throw Exception(
            'Falha ao listar ações da candidatura: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint(
          '--- [AcaoService] Erro fetchAcoesByCandidatura: $e ---');
      rethrow;
    }
  }
}
