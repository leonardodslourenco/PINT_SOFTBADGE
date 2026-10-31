import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http_parser/http_parser.dart';
import 'package:http/http.dart' as http;
import 'package:projeto_pratico/config/api_config.dart';
import 'package:projeto_pratico/models/renovacao_model.dart';
import 'package:projeto_pratico/services/auth_storage.dart';

class RenovacaoService {
  final String baseUrl = ApiConfig.baseUrl;

  // Busca os badges elegíveis para renovação do consultor atual
  Future<List<RenovacaoElegivelModel>> fetchElegiveis() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/renovacao_badge/elegiveis?lang=pt'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        return data.map((json) => RenovacaoElegivelModel.fromJson(json)).toList();
      } else {
        throw Exception(
            'Falha ao carregar badges elegíveis para renovação: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [RenovacaoService] Erro fetchElegiveis: $e ---');
      throw Exception('Falha na comunicação com o servidor.');
    }
  }

  // Busca o histórico de renovações submetidas pelo consultor atual
  Future<List<MinhaRenovacaoModel>> fetchMinhasRenovacoes() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/renovacao_badge/minhas?lang=pt'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        return data.map((json) => MinhaRenovacaoModel.fromJson(json)).toList();
      } else {
        throw Exception(
            'Falha ao carregar o histórico de renovações: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [RenovacaoService] Erro fetchMinhasRenovacoes: $e ---');
      throw Exception('Falha na comunicação com o servidor.');
    }
  }

  // Submete um pedido de renovação e retorna o ID criado
  Future<String> submitRenovacao(String idCandidatura) async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');
    
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/renovacao_badge/solicitar'));
    
    try {
      final response = await http.post(
        url,
        headers: {
          'Authorization': 'Bearer $token',
          'Content-Type': 'application/json',
        },
        body: jsonEncode({
          'id_candidatura': idCandidatura,
        }),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        final jsonResponse = jsonDecode(response.body);
        final idRenovacao = jsonResponse['data']['id_renovacao_badge'];
        return idRenovacao.toString();
      } else {
        final errorMsg = jsonDecode(response.body)['message'] ?? 'Erro desconhecido';
        throw Exception(errorMsg);
      }
    } catch (e) {
      debugPrint('--- [RenovacaoService] Erro submitRenovacao: $e ---');
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  // Upload de evidência para uma renovação
  Future<bool> uploadEvidenciaRenovacao({
    required String idRenovacao,
    required String idCandidatura,
    required int idRequisito,
    required File ficheiro,
  }) async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/renovacao_badge/$idRenovacao/evidencia'));

    try {
      final request = http.MultipartRequest('POST', url);
      request.headers['Authorization'] = 'Bearer $token';
      request.fields['id_candidatura'] = idCandidatura;
      request.fields['id_requisito'] = idRequisito.toString();

      final extension = ficheiro.path.split('.').last.toLowerCase();
      MediaType contentType;
      switch (extension) {
        case 'pdf':
          contentType = MediaType('application', 'pdf');
          break;
        case 'zip':
          contentType = MediaType('application', 'zip');
          break;
        case 'rar':
          contentType = MediaType('application', 'x-rar-compressed');
          break;
        case '7z':
          contentType = MediaType('application', 'x-7z-compressed');
          break;
        default:
          contentType = MediaType('application', 'octet-stream');
      }

      request.files.add(
        await http.MultipartFile.fromPath(
          'evidencia',
          ficheiro.path,
          contentType: contentType,
        ),
      );

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 201 || response.statusCode == 200) {
        return true;
      } else {
        final errorBody = jsonDecode(response.body);
        throw Exception(errorBody['message'] ?? 'Falha ao enviar evidência.');
      }
    } catch (e) {
      debugPrint('--- [RenovacaoService] Erro uploadEvidenciaRenovacao: $e ---');
      throw Exception(e.toString().replaceAll('Exception: ', ''));
    }
  }

  // Busca detalhes de uma renovação
  Future<Map<String, dynamic>> fetchDetalhesRenovacao(String idRenovacao) async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/renovacao_badge/$idRenovacao?lang=pt'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        return jsonResponse['data'];
      } else {
        throw Exception('Falha ao obter detalhes da renovação: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [RenovacaoService] Erro fetchDetalhesRenovacao: $e ---');
      throw Exception('Falha na comunicação com o servidor.');
    }
  }
}
