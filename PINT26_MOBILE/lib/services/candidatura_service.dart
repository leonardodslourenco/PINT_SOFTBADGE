import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

import 'package:projeto_pratico/models/candidatura_model.dart';
import 'package:projeto_pratico/services/auth_storage.dart';
import 'package:projeto_pratico/config/api_config.dart';

// Serviço de Candidaturas — comunicação com os endpoints:
// - POST /candidatura_badge        → Criar candidatura (rascunho OPEN)
// - POST /candidatura_badge/:id/submeter → Submeter para análise
// - GET  /candidatura_badge        → Listar candidaturas do utilizador
// - GET  /candidatura_badge/:id    → Detalhe de uma candidatura

class CandidaturaService {
  final String baseUrl = ApiConfig.baseUrl;

  // Helper para obter headers autenticados
  Future<Map<String, String>> _authHeaders() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');
    return ApiConfig.authHeaders(token);
  }

  // ─── CRIAR CANDIDATURA (RASCUNHO) ────────────────────────────────────────
  // POST /candidatura_badge
  // Body: { id_badge: "UUID", submeter: false }
  // Resposta: { success, data: { id_candidatura, id_estado_candidatura, completa, requisitos_em_falta } }
  Future<Map<String, dynamic>> createCandidatura({
    required String idBadge,
    bool submeterDireto = false,
  }) async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/candidatura_badge'));

    try {
      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode({
          'id_badge': idBadge,
          'submeter': submeterDireto,
        }),
      );

      final jsonResponse = jsonDecode(response.body);

      if (response.statusCode == 201 || response.statusCode == 200) {
        debugPrint(
            '--- [CandidaturaService] Candidatura criada: ${jsonResponse['data']?['id_candidatura']} ---');
        return jsonResponse['data'] ?? {};
      } else if (response.statusCode == 409) {
        // Conflito: já existe uma candidatura ativa para este badge
        debugPrint(
            '--- [CandidaturaService] Conflito: candidatura já existe ---');
        return {
          'conflito': true,
          'id_candidatura': jsonResponse['data']?['id_candidatura'],
          'message': jsonResponse['message'],
        };
      } else {
        throw Exception(
            jsonResponse['message'] ?? 'Erro ao criar candidatura.');
      }
    } catch (e) {
      debugPrint('--- [CandidaturaService] Erro createCandidatura: $e ---');
      rethrow;
    }
  }

  // ─── SUBMETER CANDIDATURA ────────────────────────────────────────────────
  // POST /candidatura_badge/:id/submeter
  // Dispara a validação de requisitos obrigatórios e altera estado para SUBMITTED
  Future<Map<String, dynamic>> submitCandidatura(
      String idCandidatura) async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/candidatura_badge/$idCandidatura/submeter'));

    try {
      final response = await http.post(url, headers: headers);
      final jsonResponse = jsonDecode(response.body);

      if (response.statusCode == 200) {
        debugPrint(
            '--- [CandidaturaService] Candidatura submetida com sucesso ---');
        return jsonResponse['data'] ?? {};
      } else if (response.statusCode == 400 &&
          jsonResponse['requisitos_em_falta'] != null) {
        // A candidatura não pode ser submetida por faltar evidências
        return {
          'incompleta': true,
          'message': jsonResponse['message'],
          'requisitos_em_falta': jsonResponse['requisitos_em_falta'],
        };
      } else {
        throw Exception(
            jsonResponse['message'] ?? 'Erro ao submeter candidatura.');
      }
    } catch (e) {
      debugPrint('--- [CandidaturaService] Erro submitCandidatura: $e ---');
      rethrow;
    }
  }

  // ─── LISTAR CANDIDATURAS ─────────────────────────────────────────────────
  // GET /candidatura_badge
  // O backend filtra automaticamente pelo utilizador do token (se for consultor)
  Future<List<CandidaturaModel>> fetchMinhasCandidaturas() async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/candidatura_badge'));

    try {
      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        debugPrint(
            '--- [CandidaturaService] ${data.length} candidaturas recebidas ---');

        return data.map((e) => CandidaturaModel.fromJson(e)).toList();
      } else {
        throw Exception('Falha ao listar candidaturas: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint(
          '--- [CandidaturaService] Erro fetchMinhasCandidaturas: $e ---');
      rethrow;
    }
  }

  // ─── DETALHE DE UMA CANDIDATURA ──────────────────────────────────────────
  // GET /candidatura_badge/:id
  // Retorna a árvore completa: evidências, ações, estado traduzido
  Future<CandidaturaModel> fetchDetalheCandidatura(
      String idCandidatura) async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/candidatura_badge/$idCandidatura'));

    try {
      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        return CandidaturaModel.fromJson(jsonResponse['data']);
      } else {
        throw Exception(
            'Falha ao obter detalhe da candidatura: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint(
          '--- [CandidaturaService] Erro fetchDetalheCandidatura: $e ---');
      rethrow;
    }
  }

  // ─── PARTILHA PÚBLICA ───────────────────────────────────────────
  // PATCH /candidatura_badge/:id/share
  // Body: { partilhar_conclusao: boolean }
  Future<bool> togglePublicSharing(String idCandidatura, bool share) async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/candidatura_badge/$idCandidatura/share'));

    try {
      final response = await http.patch(
        url,
        headers: headers,
        body: jsonEncode({'partilhar_conclusao': share}),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint("--- [CandidaturaService] Erro alterar partilha pública: $e ---");
      return false;
    }
  }
}
