import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:projeto_pratico/config/api_config.dart';
import 'package:projeto_pratico/models/marco_model.dart';
import 'package:projeto_pratico/services/auth_storage.dart';

class MarcosService {
  final String baseUrl = ApiConfig.baseUrl;

  Future<Map<String, String>> _authHeaders() async {
    final token = await AuthStorage.getToken();
    if (token == null) throw Exception('Token nulo. Faça login.');
    return ApiConfig.authHeaders(token);
  }

  /// Busca o catálogo completo de marcos (Disponíveis e Alcançados)
  Future<List<MarcoModel>> fetchCatologoMarcos() async {
    try {
      final headers = await _authHeaders();
      final url = Uri.parse(ApiConfig.appendLang('$baseUrl/utilizador_marco/configuracoes'));
      final response = await http.get(url, headers: headers);

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final List<dynamic> data = jsonResponse['data'] ?? [];
        
        final list = data.map((item) => MarcoModel.fromJson(item)).toList();
        if (list.isNotEmpty) return list;
      }
      
      debugPrint('Catálogo vazio ou erro. A retornar dados mock para testes.');
      return _getMockMarcos();
    } catch (e, stacktrace) {
      debugPrint('--- [MarcosService] Erro a carregar marcos: $e ---');
      debugPrint(stacktrace.toString());
      return _getMockMarcos();
    }
  }

  List<MarcoModel> _getMockMarcos() {
    return [
      MarcoModel(
        idMarco: 1,
        idTipoMarco: 1,
        codigoTipo: 'INICIO',
        tipoNome: 'Início de Candidatura',
        tipoDescricao: 'Marcos relacionados com inícios',
        nome: 'Primeiro Passo',
        descricao: 'Iniciou a sua primeira candidatura a um Badge na plataforma.',
        quantidadeObjetivo: 1,
        ativo: true,
        conquistado: true,
        dataConquistaMarco: DateTime.now().subtract(const Duration(days: 2)),
        celebrado: true,
      ),
      MarcoModel(
        idMarco: 2,
        idTipoMarco: 1,
        codigoTipo: 'INICIO',
        tipoNome: 'Início de Candidatura',
        tipoDescricao: 'Marcos relacionados com inícios',
        nome: 'Empreendedor do Conhecimento',
        descricao: 'Iniciou 5 candidaturas a Badges no sistema.',
        quantidadeObjetivo: 5,
        ativo: true,
        conquistado: false,
        celebrado: false,
      ),
      MarcoModel(
        idMarco: 3,
        idTipoMarco: 2,
        codigoTipo: 'CONQUISTA',
        tipoNome: 'Conquista de Badge',
        tipoDescricao: 'Marcos relacionados com conquistas',
        nome: 'Pioneiro Certificado',
        descricao: 'Conquistou com sucesso o seu primeiro Badge oficial.',
        quantidadeObjetivo: 1,
        ativo: true,
        conquistado: false,
        celebrado: false,
      ),
    ];
  }
}
