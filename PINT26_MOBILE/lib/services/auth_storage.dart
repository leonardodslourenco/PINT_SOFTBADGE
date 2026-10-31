import 'package:shared_preferences/shared_preferences.dart';

// Guardar, Ler e Remover token

class AuthStorage {
  static const String _keyToken = 'jwt_token';

  // Guarda o token após o login
  static Future<void> saveToken(String token) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_keyToken, token);
  }

  // Recupera o token para enviar nos pedidos
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(_keyToken);
  }

  // Limpa o token no logout
  static Future<void> clearToken() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_keyToken);
  }
}
