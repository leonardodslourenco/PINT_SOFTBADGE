import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'package:projeto_pratico/config/api_config.dart';
import 'package:projeto_pratico/models/badge_atribuido_model.dart';
import 'package:projeto_pratico/models/candidatura_model.dart';
import 'package:projeto_pratico/models/evidence_model.dart';
import 'package:projeto_pratico/models/ranking_model.dart';
import 'package:projeto_pratico/models/conquista_especial_model.dart';
import 'package:projeto_pratico/models/badge_especial_model.dart';
import 'package:projeto_pratico/services/auth_storage.dart';

// Pergunta ao servidor quais badges & candidaturas atribuidos a idCandidato
// Transforma a resposta nos models respetivos (BadgeModel & CandidaturaModel)

class MetricasService {
  final String baseUrl = ApiConfig.baseUrl;

  // Busca todas as conquistas/badges já atribuídos a este consultor
  Future<List<BadgeAtribuidoModel>> fetchMeusBadgesAtribuidos(
      String idCandidato) async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/badge_atribuido?id_candidato=$idCandidato'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        return data.map((json) => BadgeAtribuidoModel.fromJson(json)).toList();
      } else {
        throw Exception(
            'Falha ao carregar badges atribuídos: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint(
          '--- [MetricasService] Erro fetchMeusBadgesAtribuidos: $e ---');
      throw Exception('Falha na comunicação com o servidor.');
    }
  }

  // Busca todas as candidaturas do utilizador
  Future<List<CandidaturaModel>> fetchMinhasCandidaturas() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/candidatura_badge'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        return data.map((json) => CandidaturaModel.fromJson(json)).toList();
      } else {
        throw Exception(
            'Falha ao carregar candidaturas: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [MetricasService] Erro fetchMinhasCandidaturas: $e ---');
      throw Exception('Falha na comunicação com o servidor.');
    }
  }


  // Busca todas as evidências submetidas pelo utilizador
  Future<List<EvidenceModel>> fetchMinhasEvidencias() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    // Ajusta o endpoint conforme a rota real do teu backend para as evidências
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/evidencia_candidatura/minhas'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        return data.map((json) => EvidenceModel.fromJson(json)).toList();
      } else {
        throw Exception(
            'Falha ao carregar evidências: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [MetricasService] Erro fetchMinhasEvidencias: $e ---');
      throw Exception('Falha na comunicação com o servidor.');
    }
  }

  // Busca o ranking geral de pontuação
  Future<List<RankingModel>> fetchRankingGeral() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/metricas/ranking-geral'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        return data.map((json) => RankingModel.fromJson(json)).toList();
      } else {
        throw Exception(
            'Falha ao carregar ranking: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [MetricasService] Erro fetchRankingGeral: $e ---');
      throw Exception('Falha na comunicação com o servidor.');
    }
  }

  // Busca as candidaturas a badges especiais
  Future<List<ConquistaEspecialModel>> fetchConquistasEspeciais() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/candidatura_especial/minhas'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        return data.map((json) => ConquistaEspecialModel.fromJson(json)).toList();
      } else {
        throw Exception(
            'Falha ao carregar conquistas especiais: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [MetricasService] Erro fetchConquistasEspeciais: $e ---');
      throw Exception('Falha na comunicação com o servidor.');
    }
  }

  // Busca o catálogo geral de badges especiais disponíveis
  Future<List<BadgeEspecialModel>> fetchCatalogoBadgesEspeciais() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/conquista-especial'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        return data.map((json) => BadgeEspecialModel.fromJson(json)).toList();
      } else {
        throw Exception(
            'Falha ao carregar catálogo de badges especiais: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [MetricasService] Erro fetchCatalogoBadgesEspeciais: $e ---');
      throw Exception('Falha na comunicação com o servidor.');
    }
  }

  // Comutar partilha pública RGPD de candidatura especial
  Future<bool> togglePublicSharingEspecial(
      String idCandidaturaEspecial, bool share) async {
    final token = await AuthStorage.getToken();
    if (token == null) return false;

    final url =
        Uri.parse(ApiConfig.appendLang('$baseUrl/candidatura_especial/$idCandidaturaEspecial/share'));

    try {
      final response = await http.patch(
        url,
        headers: ApiConfig.authHeaders(token),
        body: jsonEncode({'rgpd_partilha_conquista': share}),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('--- [MetricasService] Erro togglePublicSharingEspecial: $e ---');
      return false;
    }
  }

  // Submeter candidatura a badge especial
  Future<bool> submeterCandidaturaEspecial({
    required String idConquistaEspecial,
    String? urlComprovativo,
    String? filePath,
    List<int>? fileBytes,
    String? fileName,
  }) async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/candidatura_especial'));

    try {
      final request = http.MultipartRequest('POST', url);
      request.headers['Authorization'] = 'Bearer $token';

      request.fields['id_conquista_especial'] = idConquistaEspecial;

      if (urlComprovativo != null && urlComprovativo.trim().isNotEmpty) {
        request.fields['url_comprovativo'] = urlComprovativo.trim();
      }

      if (filePath != null && filePath.isNotEmpty) {
        request.files.add(
          await http.MultipartFile.fromPath(
            'ficheiro_comprovativo',
            filePath,
            contentType: MediaType('application', 'pdf'),
          ),
        );
      } else if (fileBytes != null && fileName != null) {
        request.files.add(
          http.MultipartFile.fromBytes(
            'ficheiro_comprovativo',
            fileBytes,
            filename: fileName,
            contentType: MediaType('application', 'pdf'),
          ),
        );
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 201 || response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        return jsonResponse['success'] == true;
      } else {
        final jsonResponse = jsonDecode(response.body);
        throw Exception(
            jsonResponse['message'] ?? 'Falha ao submeter candidatura especial.');
      }
    } catch (e) {
      debugPrint('--- [MetricasService] Erro submeterCandidaturaEspecial: $e ---');
      rethrow;
    }
  }
}
