import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

import 'package:projeto_pratico/models/evidence_model.dart';
import 'package:projeto_pratico/services/auth_storage.dart';
import 'package:projeto_pratico/config/api_config.dart';

// Serviço de Evidências:
// - fetchEvidencias: Vai buscar as evidências do utilizador (GET /evidencia_candidatura/minhas)
// - fetchByCandidatura: Evidências de uma candidatura (GET /evidencia_candidatura/candidatura/:id)
// - uploadEvidencia: Envia ficheiro + dados (POST /evidencia_candidatura) via multipart/form-data

class EvidenceService {
  final String baseUrl = ApiConfig.baseUrl;

  // ─── LISTAR MINHAS EVIDÊNCIAS ─────────────────────────────────────────────
  // GET /evidencia_candidatura/minhas
  Future<List<EvidenceModel>> fetchEvidencias() async {
    try {
      final token = await AuthStorage.getToken();

      if (token == null || token.isEmpty) {
        throw Exception(
            'Token não encontrado. Utilizador tem de fazer login.');
      }

      debugPrint(
          '--- [EvidenciaService] A pedir as tuas evidências ao servidor... ---');

      final response = await http.get(
        Uri.parse(ApiConfig.appendLang('$baseUrl/evidencia_candidatura/minhas')),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        debugPrint(
            '--- [EvidenciaService] Sucesso: ${data.length} evidências recebidas! ---');

        List<EvidenceModel> evidenciasProcessadas = [];
        for (var item in data) {
          try {
            evidenciasProcessadas.add(EvidenceModel.fromJson(item));
          } catch (e) {
            debugPrint(
                '--- [ERRO NO JSON DA EVIDÊNCIA] Não foi possível ler: $e ---');
          }
        }

        return evidenciasProcessadas;
      } else {
        debugPrint(
            '--- [EvidenciaService] Erro do servidor: Status ${response.statusCode} ---');
        throw Exception('Falha ao carregar evidências do servidor.');
      }
    } catch (e) {
      debugPrint(
          '--- [EvidenciaService] Erro crítico de rede ou processamento: $e ---');
      rethrow;
    }
  }

  // ─── LISTAR EVIDÊNCIAS DE UMA CANDIDATURA ─────────────────────────────────
  // GET /evidencia_candidatura/candidatura/:idCandidatura
  Future<List<EvidenceModel>> fetchByCandidatura(String idCandidatura) async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url =
        Uri.parse(ApiConfig.appendLang('$baseUrl/evidencia_candidatura/candidatura/$idCandidatura'));

    try {
      final response = await http.get(url, headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      });

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];

        return data.map((e) => EvidenceModel.fromJson(e)).toList();
      } else {
        throw Exception(
            'Falha ao obter evidências da candidatura: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('--- [EvidenciaService] Erro fetchByCandidatura: $e ---');
      rethrow;
    }
  }

  // ─── UPLOAD DE EVIDÊNCIA (MULTIPART) ──────────────────────────────────────
  Future<bool> uploadEvidencia({
    required String idCandidatura,
    required int idRequisitoNivel,
    String? descricao,
    String? link,              
    File? ficheiro,            
  }) async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/evidencia_candidatura'));

    try {
      final request = http.MultipartRequest('POST', url);

      // Headers de autenticação
      request.headers['Authorization'] = 'Bearer $token';

      // Campos do formulário (Textos e IDs)
      request.fields['id_candidatura'] = idCandidatura;
      request.fields['id_requisito'] = idRequisitoNivel.toString();
      if (descricao != null && descricao.isNotEmpty) {
        request.fields['descricao'] = descricao;
      }
      
      // Se houver um link preenchido, adiciona-o ao pedido
      if (link != null && link.isNotEmpty) {
        request.fields['link'] = link;
      }

      // ─── Lógica do Ficheiro (só corre se o utilizador selecionou um) ───
      if (ficheiro != null) {
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
      }

      debugPrint('--- [EvidenciaService] A enviar evidência... (Com ficheiro: ${ficheiro != null}) ---');

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode == 201) {
        debugPrint('--- [EvidenciaService] Upload com sucesso! ---');
        return true;
      } else {
        final errorBody = jsonDecode(response.body);
        debugPrint('--- [EvidenciaService] Erro no upload: ${errorBody['message']} ---');
        throw Exception(errorBody['message'] ?? 'Falha ao enviar evidência.');
      }
    } catch (e) {
      debugPrint('--- [EvidenciaService] Erro no upload: $e ---');
      rethrow;
    }
  }
}