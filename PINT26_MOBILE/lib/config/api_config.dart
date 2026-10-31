/// Configuração centralizada da API para todo o projeto.
/// Altera o [baseUrl] conforme o teu ambiente:
///   - Emulador Android: 'http://10.0.2.2:3000' (mapeia para localhost do PC)
///   - Browser Chrome:   'http://localhost:3000'
///   - Dispositivo físico na mesma rede: 'http://<IP_DO_PC>:3000'
///   - Produção:          https://back.softbadge.pt   Backend
///                        https://webapp.softbadge.pt/ Frontend
class ApiConfig {
  // URL base do servidor Backend (Node.js / Express)
  static const String baseUrl = 'https://back.softbadge.pt';

  // Atalho para a porta da API
  static const int port = 3000;

  static String currentLanguage = 'pt';

  /// Cabeçalhos padrão para identificar a plataforma mobile no backend (permite emissão de token de 7 dias)
  static Map<String, String> get defaultHeaders => {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Platform': 'mobile',
        'x-app-language': currentLanguage,
      };

  /// Helper para adicionar o idioma à query string
  static String appendLang(String pathOrUrl) {
    if (pathOrUrl.contains(RegExp(r'[?&]lang='))) {
      return pathOrUrl.replaceAllMapped(
          RegExp(r'([?&])lang=[^&]*'), 
          (match) => '${match.group(1)}lang=$currentLanguage'
      );
    }
    return pathOrUrl.contains('?') 
        ? '$pathOrUrl&lang=$currentLanguage' 
        : '$pathOrUrl?lang=$currentLanguage';
  }

  /// Helper para gerar cabeçalhos autenticados com identificação mobile
  static Map<String, String> authHeaders(String token) => {
        ...defaultHeaders,
        'Authorization': 'Bearer $token',
      };

      /// Resolve o URL absoluto de um avatar de utilizador
      static String getAvatarUrl(String? avatar) {
        if (avatar == null || avatar.trim().isEmpty) return '';
        if (avatar.startsWith('http://') || avatar.startsWith('https://')) {
          return avatar;
        }
        final clean = avatar.startsWith('/') ? avatar.substring(1) : avatar;
        if (clean.startsWith('uploads/avatars/')) {
          return '$baseUrl/$clean';
        }
        return '$baseUrl/uploads/avatars/$clean';
      }

      /// Resolve o URL absoluto de um logótipo de badge
      static String getBadgeLogoUrl(String? logo) {
        if (logo == null || logo.trim().isEmpty) return '';
        if (logo.startsWith('http://') || logo.startsWith('https://')) {
          return logo;
        }
        final clean = logo.startsWith('/') ? logo.substring(1) : logo;
        if (clean.startsWith('uploads/logo_badges/')) {
          return '$baseUrl/$clean';
        }
        return '$baseUrl/uploads/logo_badges/$clean';
      }
}
