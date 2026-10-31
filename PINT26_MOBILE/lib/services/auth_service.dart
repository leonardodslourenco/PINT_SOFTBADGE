import 'dart:convert';
import 'package:http/http.dart'
    as http; // adicionar dependencia - flutter pub add http
import 'package:flutter/foundation.dart';
import '../models/user_model.dart';
import 'auth_storage.dart';
import 'package:projeto_pratico/config/api_config.dart';

// Envia Email + Password para o Servidor
// Se success transforma a resposta do servidor num UserModel (user_model.dart)
// Guarda o token na memória do dispositivo (AuthStorage)

class AuthExpiredException implements Exception {
  final String message;
  AuthExpiredException([this.message = 'Sessão expirada']);
  @override
  String toString() => message;
}

class AuthService {
  // URL base da API centralizada
  final String baseUrl = ApiConfig.baseUrl;

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  // Resposta do backend pode conter:
  // - Login completo: { success: true, data: { token, utilizador, saudacao, force_password_change } }
  // - Ação intermédia: { success: true, data: { action: "EMAIL_VERIFICATION_REQUIRED", ... } }
  // - Erro: { success: false, message: "..." }
  Future<Map<String, dynamic>> loginRaw(String email, String password) async {
    try {
      final response = await http.post(
        Uri.parse(ApiConfig.appendLang('$baseUrl/auth/login')),
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({'email': email, 'password': password}),
      );

      final jsonResponse = jsonDecode(response.body);
      return jsonResponse;
    } catch (e) {
      debugPrint("Erro de conexão no login: $e");
      rethrow;
    }
  }

  // Método simplificado que retorna UserModel (mantém compatibilidade)
  Future<UserModel?> login(String email, String password) async {
    try {
      final jsonResponse = await loginRaw(email, password);

      if (jsonResponse['success'] == true) {
        final data = jsonResponse['data'];

        // Se a resposta contiver uma ação intermédia, não é login completo
        if (data['action'] != null) {
          debugPrint(
              "--- [AuthService] Ação intermédia: ${data['action']} ---");
          throw Exception(data['action']);
        }

        final user = UserModel.fromJson(data);

        debugPrint(
            "🚨 CHECKPOINT - Token no modelo: '${user.token.substring(0, 20)}...'");

        await AuthStorage.saveToken(user.token);

        return user;
      } else {
        final message =
            jsonResponse['message'] ?? 'Erro desconhecido no login';
        throw Exception(message);
      }
    } catch (e) {
      debugPrint("Erro de conexão no login: $e");
      rethrow;
    }
  }

  // ─── ALTERAÇÃO DE PASSWORD ────────────────────────────────────────────────
  // Endpoint: POST /auth/change-default-password
  Future<String?> changePassword(
      String email, String currentPassword, String newPassword) async {
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/auth/change-default-password'));

    try {
      final response = await http.post(
        url,
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({
          "email": email,
          "current_password": currentPassword,
          "new_password": newPassword,
          "confirm_new_password": newPassword,
        }),
      );

      // 3. O tratamento de dados JSON faz-se quando os dados são obtidos com sucesso[cite: 7]
      if (response.statusCode == 200) {
        final Map<String, dynamic> jsonResponse = json.decode(response.body); // Faz o parsing do JSON[cite: 7]
        
        // Ajusta o caminho ['data']['token'] consoante o formato exato que a tua API devolve
        final newToken = jsonResponse['data']?['token']; 
        
        return newToken; // Aqui estamos finalmente a devolver a String prometida!
      }

      // Se a API não devolver 200, lançamos a mensagem de erro que vem do backend
      final Map<String, dynamic> errorResponse = json.decode(response.body);
      throw Exception(errorResponse['message'] ?? 'Erro desconhecido da API.');
    } catch (e) {
      debugPrint("Erro de conexão ao alterar password: $e");
      rethrow;
    }
  }

  // ─── RECUPERAÇÃO DE PASSWORD ──────────────────────────────────────────────
  // Endpoint: POST /auth/request-password-recovery
  Future<bool> recoverPassword(String email) async {
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/auth/request-password-recovery'));

    try {
      final response = await http.post(
        url,
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({"email": email}),
      );

      final jsonResponse = jsonDecode(response.body);
      return jsonResponse['success'] == true;
    } catch (e) {
      debugPrint("Erro ao solicitar recuperação de password: $e");
      return false;
    }
  }

  // ─── LOGOUT (com revogação de token) ──────────────────────────────────────
  // Endpoint: POST /auth/logout
  Future<bool> logout() async {
    final token = await AuthStorage.getToken();
    if (token == null) return true; // Sem token = já está deslogado

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/auth/logout'));

    try {
      final response = await http.post(
        url,
        headers: ApiConfig.authHeaders(token),
      );

      debugPrint(
          "--- [AuthService] Logout response: ${response.statusCode} ---");
      return response.statusCode == 200;
    } catch (e) {
      debugPrint("Erro ao fazer logout no servidor: $e");
      return false; // Mesmo que falhe no servidor, o logout local é feito
    }
  }

  // ─── REFRESH TOKEN ────────────────────────────────────────────────────────
  // Endpoint: POST /auth/refresh-token
  Future<String?> refreshToken() async {
    final token = await AuthStorage.getToken();
    if (token == null) return null;

    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/auth/refresh-token'));

    try {
      final response = await http.post(
        url,
        headers: ApiConfig.authHeaders(token),
      );

      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        final newToken = jsonResponse['data']?['token'];
        if (newToken != null) {
          await AuthStorage.saveToken(newToken);
          return newToken;
        }
      } else if (response.statusCode == 401 || response.statusCode == 403) {
        debugPrint("--- [AuthService] Token expirado ou rejeitado (${response.statusCode}) ---");
        throw AuthExpiredException('Sessão expirada');
      }
    } on AuthExpiredException {
      rethrow;
    } catch (e) {
      debugPrint("Erro ao renovar token: $e");
    }
    return null;
  }


  // ─── ATUALIZAÇÃO DE DADOS NO SERVIDOR ─────────────────────────────────── 
  Future<void> atualizarDadosNoServidor(UserModel user) async {
  // 1. Preparamos o cabeçalho com o token atualizado do modelo
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ${user.token}', // Lemos o token diretamente do teu UserModel
  };

  // 2. Preparamos o corpo do pedido (apenas com os dados que vão mudar)
  var body = json.encode({
    'nome': user.nome,
    'apelido': user.apelido,
  });

  // 3. Efetuamos o pedido assíncrono à API
  final response = await http.post(
    Uri.parse(ApiConfig.appendLang('$baseUrl/perfil/atualizar')),
    headers: headers, // Injetamos o cabeçalho para provar a identidade
    body: body,
  );

  if (response.statusCode == 200) {
    debugPrint("Dados enviados com sucesso utilizando o novo token!");
  }
}

  // Método no teu AuthService para atualizar o perfil no backend principal
  Future<bool> updateProfileOnServer(String token, String nome, String apelido, String email) async {
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/auth/update-profile')); // Substitui pelo endpoint correto da tua API

    try {
      final response = await http.post(
        url,
        headers: ApiConfig.authHeaders(token),
        body: jsonEncode({
          "nome": nome,
          "apelido": apelido,
          "email": email,
        }),
      );

      // Valida se o servidor respondeu com sucesso (Código HTTP 200)
      return response.statusCode == 200;
    } catch (e) {
      debugPrint("Erro de conexão ao atualizar perfil no servidor: $e");
      return false;
    }
  }

  // Atualizar consentimento RGPD global do utilizador
  Future<bool> updateRgpdConsent(String token, bool consent) async {
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/utilizador/rgpd/aceitar'));
    try {
      final response = await http.put(
        url,
        headers: ApiConfig.authHeaders(token),
        body: jsonEncode({
          "aceitou_rgpd": consent,
        }),
      );
      return response.statusCode == 200;
    } catch (e) {
      debugPrint("Erro ao atualizar consentimento RGPD no servidor: $e");
      return false;
    }
  }

  // Obter texto da Política RGPD
  Future<String?> getPoliticaRGPD(String token) async {
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/politica_rgpd'));
    try {
      final response = await http.get(
        url,
        headers: ApiConfig.authHeaders(token),
      );
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        return jsonResponse['data']?['geral_localizado'] ?? jsonResponse['data']?['geral_pt'];
      }
      return null;
    } catch (e) {
      debugPrint("Erro ao obter a política RGPD: $e");
      return null;
    }
  }

  // Obter texto da Política RGPD de Candidatura (específica)
  Future<String?> getPoliticaRGPDCandidatura(String token) async {
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/politica_rgpd'));
    try {
      final response = await http.get(
        url,
        headers: ApiConfig.authHeaders(token),
      );
      if (response.statusCode == 200) {
        final jsonResponse = jsonDecode(response.body);
        return jsonResponse['data']?['candidatura_localizado'] ?? jsonResponse['data']?['candidatura_pt'];
      }
      return null;
    } catch (e) {
      debugPrint("Erro ao obter a política RGPD de candidatura: $e");
      return null;
    }
  }

  // ─── VERIFICAÇÃO DE EMAIL ─────────────────────────────────────────────────
  // Endpoint: POST /auth/verify-email-code
  // Body: { email_verification_token, email_code }
  Future<Map<String, dynamic>> verifyEmailCode(String token, String code) async {
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/auth/verify-email-code'));

    try {
      final response = await http.post(
        url,
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({
          "email_verification_token": token,
          "email_code": code,
        }),
      );

      final jsonResponse = jsonDecode(response.body);
      return jsonResponse;
    } catch (e) {
      debugPrint("Erro ao verificar código de email: $e");
      rethrow;
    }
  }

  // ─── REENVIO DE CÓDIGO DE VERIFICAÇÃO ──────────────────────────────────────
  // Endpoint: POST /auth/resend-email-verification-code
  // Body: { email_verification_token }
  Future<Map<String, dynamic>> resendVerificationCode(String token) async {
    final url = Uri.parse(ApiConfig.appendLang('$baseUrl/auth/resend-email-verification-code'));

    try {
      final response = await http.post(
        url,
        headers: ApiConfig.defaultHeaders,
        body: jsonEncode({
          "email_verification_token": token,
        }),
      );

      final jsonResponse = jsonDecode(response.body);
      return jsonResponse;
    } catch (e) {
      debugPrint("Erro ao reenviar código de verificação: $e");
      rethrow;
    }
  }
}

