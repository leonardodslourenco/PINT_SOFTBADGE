import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

import 'package:projeto_pratico/config/api_config.dart';
import 'package:projeto_pratico/services/auth_storage.dart';

class CertificadoService {
  final String baseUrl = ApiConfig.baseUrl;

  Future<Map<String, String>> _authHeaders() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');
    return ApiConfig.authHeaders(token);
  }

  /// Obtém o ID do certificado associado a uma candidatura.
  Future<String?> getCertificadoIdByCandidatura(String idCandidatura) async {
    final headers = await _authHeaders();
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/certificado/candidatura/$idCandidatura'));

    try {
      final response = await http.get(url, headers: headers);
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        if (jsonResponse['success'] == true && jsonResponse['data'] != null) {
          return jsonResponse['data']['id_certificado']?.toString();
        }
      }
      return null;
    } catch (e) {
      debugPrint('Erro ao obter certificado da candidatura: $e');
      return null;
    }
  }

  /// Descarrega os bytes do PDF do certificado a partir do servidor.
  Future<Uint8List?> getCertificadoPdfBytes(String idCertificado) async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final headers = {
      'Authorization': 'Bearer $token',
      // Não precisamos de Content-Type pois é um GET normal que retorna bytes
    };

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/certificado/$idCertificado/view'));

    try {
      final response = await http.get(url, headers: headers);
      if (response.statusCode == 200) {
        return response.bodyBytes;
      }
      debugPrint('Erro no download do PDF. Status: ${response.statusCode}');
      return null;
    } catch (e) {
      debugPrint('Erro ao obter PDF do certificado: $e');
      return null;
    }
  }

  /// Descarrega os bytes do PDF através do endpoint de download do backend.
  Future<Uint8List?> downloadCertificadoPdfBytes(String idCertificado) async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final headers = {
      'Authorization': 'Bearer $token',
    };

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/certificado/$idCertificado/download'));

    try {
      final response = await http.get(url, headers: headers);
      if (response.statusCode == 200) {
        return response.bodyBytes;
      }
      debugPrint('Erro no download do PDF. Status: ${response.statusCode}');
      return null;
    } catch (e) {
      debugPrint('Erro ao obter download do certificado: $e');
      return null;
    }
  }
}
