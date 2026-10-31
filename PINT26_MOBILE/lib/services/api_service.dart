import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/config/api_config.dart';

// Pega no Email + Password
// Verifica na BD se dados estão corretos
// Se corretos deixa utilizador entrar e atribui-lhe um token

class ApiService {
  final String baseUrl = ApiConfig.baseUrl;

  // Chamada de Login HTTP Post
  Future<Map<String, dynamic>> login(String email, String password) async {
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/auth/login'));

    try {
      final response = await http.post(
        url,
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({"email": email, "password": password}),
      );

      if (response.statusCode == 200) {
        return jsonDecode(response.body); // Retorna o User + Token
      } else {
        throw Exception(
            jsonDecode(response.body)['message'] ?? "Erro no Login");
      }
    } catch (e) {
      throw Exception("Erro de ligação ao servidor: $e");
    }
  }
}

final apiServiceProvider = Provider<ApiService>((ref) {
  return ApiService();
});
