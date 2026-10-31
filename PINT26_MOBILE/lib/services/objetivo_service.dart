import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:projeto_pratico/config/api_config.dart';
import 'package:projeto_pratico/services/auth_storage.dart';
import 'package:projeto_pratico/models/objetivo_model.dart';

class ObjetivoService {
  final String baseUrl = ApiConfig.baseUrl;

  Future<Map<String, String>> _authHeaders() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');
    return ApiConfig.authHeaders(token);
  }

  /// GET /objetivo-consultor/meus?status=ativos
  /// Lista os objetivos ativos do consultor com o cálculo de progresso em tempo real
  Future<List<ObjetivoModel>> fetchMeusObjetivos({String status = 'todos'}) async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/objetivo-consultor/meus?status=$status'));

    try {
      final response = await http.get(url, headers: headers);
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final List<dynamic> data = json['data'] ?? [];
        return data.map((item) => ObjetivoModel.fromJson(item)).toList();
      } else {
        throw Exception('Falha ao carregar objetivos: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [ObjetivoService] Erro ao carregar meus objetivos: $e ---');
      return [];
    }
  }

  /// GET /objetivo-consultor/tipos
  /// Lista os 5 tipos de objetivos disponíveis (para criação)
  Future<List<TipoObjetivoModel>> fetchTiposObjetivo() async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/objetivo-consultor/tipos'));

    try {
      final response = await http.get(url, headers: headers);
      if (response.statusCode == 200) {
        final json = jsonDecode(response.body);
        final List<dynamic> data = json['data'] ?? [];
        return data.map((item) => TipoObjetivoModel.fromJson(item)).toList();
      } else {
        throw Exception('Falha ao carregar tipos de objetivo: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [ObjetivoService] Erro ao carregar tipos: $e ---');
      return [];
    }
  }

  /// POST /objetivo-consultor/
  /// Cria um novo objetivo
  Future<bool> criarObjetivo(Map<String, dynamic> payload) async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/objetivo-consultor/'));

    try {
      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(payload),
      );

      if (response.statusCode == 201 || response.statusCode == 200) {
        return true;
      } else {
        debugPrint('Falha ao criar objetivo: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('--- [ObjetivoService] Erro ao criar objetivo: $e ---');
      return false;
    }
  }

  /// DELETE /objetivo-consultor/:id
  /// Cancela (soft-delete) um objetivo ativo
  Future<bool> cancelarObjetivo(String idObjetivo) async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/objetivo-consultor/$idObjetivo'));

    try {
      final response = await http.delete(url, headers: headers);
      return response.statusCode == 200 || response.statusCode == 204;
    } catch (e) {
      debugPrint('--- [ObjetivoService] Erro ao cancelar objetivo: $e ---');
      return false;
    }
  }
}
