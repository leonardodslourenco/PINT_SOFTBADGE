// Modelo que mapeia a estrutura completa do Utilizador devolvida pelo Backend.
// Alinhado com: POST /auth/login → data.utilizador + data.token + data.force_password_change + data.saudacao
class UserModel {
  final String nPessoa;
  final String nome;
  final String apelido;
  final String email;
  final String avatar;
  final String idiomaPreferencial;
  final int thema;
  final List<int> perfis;
  final int? idArea;
  final String? area;
  final int pontos;
  final bool rgpdConsent;
  final bool passwordDefault;
  final String token;
  final String? saudacao;
  final DateTime? dataRegisto;

  UserModel({
    required this.nPessoa,
    required this.nome,
    required this.apelido,
    required this.email,
    required this.avatar,
    required this.idiomaPreferencial,
    required this.thema,
    required this.perfis,
    this.idArea,
    this.area,
    required this.pontos,
    required this.rgpdConsent,
    required this.passwordDefault,
    required this.token,
    this.saudacao,
    this.dataRegisto,
  });

  // ─── TRADUTOR: LER DA API (Node.js) OU DA BASE DE DADOS LOCAL (SQLite) ────────
  // Resposta real do Backend (POST /auth/login):
  // {
  //   "success": true,
  //   "data": {
  //     "token": "eyJ...",
  //     "token_type": "Bearer",
  //     "force_password_change": false,
  //     "utilizador": {
  //       "id_utilizador": "UUID",
  //       "nome": "...",
  //       "apelido": "...",
  //       "email": "...",
  //       "avatar": "default_avatar.webp",
  //       "idioma_preferencial": "pt",
  //       "thema": 2,
  //       "perfis": [4]
  //     },
  //     "saudacao": "Bom Dia!"
  //   }
  // }
  factory UserModel.fromJson(Map<String, dynamic> json) {
    // Detetar origem: Se o JSON tiver 'utilizador', vem do Backend.
    // Se não, vem do SQLite local e usamos o json diretamente.
    final userData = json['utilizador'] ?? json;

    // Extrair perfis como List<int> (vem como array de inteiros do backend)
    List<int> parsedPerfis = [];
    if (userData['perfis'] != null) {
      if (userData['perfis'] is List) {
        parsedPerfis = (userData['perfis'] as List)
            .map((e) => e is int ? e : int.tryParse(e.toString()) ?? 0)
            .toList();
      } else if (userData['perfis'] is String) {
        // Do SQLite pode vir como string JSON "1,2,3"
        parsedPerfis = (userData['perfis'] as String)
            .split(',')
            .map((e) => int.tryParse(e.trim()) ?? 0)
            .where((e) => e > 0)
            .toList();
      }
    }

    return UserModel(
      // Backend: 'id_utilizador' | SQLite: 'id'
      nPessoa: (userData['id_utilizador'] ?? userData['id'] ?? '').toString(),

      // Backend: 'nome' | SQLite: 'name'
      nome: userData['nome'] ?? userData['name'] ?? '',

      // Backend: 'apelido' | SQLite: 'apelido'
      apelido: userData['apelido'] ?? '',

      email: userData['email'] ?? '',

      // Backend: 'avatar' | SQLite: 'avatar'
      avatar: userData['avatar'] ?? 'default_avatar.webp',

      // Backend: 'idioma_preferencial' | SQLite: 'idioma'
      idiomaPreferencial:
          userData['idioma_preferencial'] ?? userData['idioma'] ?? 'pt',

      // Backend: 'thema' | SQLite: 'thema'
      thema: userData['thema'] is int
          ? userData['thema']
          : int.tryParse(userData['thema']?.toString() ?? '2') ?? 2,

      perfis: parsedPerfis,

      // Backend: 'id_area' | SQLite: 'id_area'
      idArea: userData['id_area'] is int
          ? userData['id_area']
          : int.tryParse(userData['id_area']?.toString() ?? ''),

      area: userData['area'] ?? '',

      pontos: userData['pontos'] is int
          ? userData['pontos']
          : int.tryParse(userData['pontos']?.toString() ?? '0') ?? 0,

      rgpdConsent:
          userData['rgpdConsent'] == 1 || userData['rgpdConsent'] == true || userData['aceitou_rgpd'] == true || userData['aceitou_rgpd'] == 1,

      // Backend: 'force_password_change' (no json root) | SQLite: 'isFirstLogin'
      passwordDefault: json['force_password_change'] == true ||
          userData['password_default'] == true ||
          userData['isFirstLogin'] == 1 ||
          userData['isFirstLogin'] == true,

      // Token: no Backend está fora do 'utilizador', no SQLite está junto
      token: json['token'] ?? userData['token'] ?? '',

      // Saudação contextual do backend (ex: "Bom Dia!")
      saudacao: json['saudacao'] ?? userData['saudacao'],

      dataRegisto: userData['data_registo'] != null
          ? DateTime.tryParse(userData['data_registo'].toString())
          : null,
    );
  }

  // ─── TRADUTOR: ESCREVER NA BASE DE DADOS LOCAL (SQLite) ────────
  Map<String, dynamic> toMap() {
    return {
      'id': nPessoa,
      'name': nome,
      'apelido': apelido,
      'email': email,
      'avatar': avatar,
      'idioma': idiomaPreferencial,
      'thema': thema,
      'perfis': perfis.join(','),
      'id_area': idArea,
      'area': area,
      'token': token,
      'isFirstLogin': passwordDefault ? 1 : 0,
      'rgpdConsent': rgpdConsent ? 1 : 0,
      'pontos': pontos,
      'saudacao': saudacao,
      'data_registo': dataRegisto?.toIso8601String(),
    };
  }

  UserModel copyWith({
    String? nPessoa,
    String? nome,
    String? apelido,
    String? email,
    String? avatar,
    String? idiomaPreferencial,
    int? thema,
    List<int>? perfis,
    int? idArea,
    String? area,
    int? pontos,
    bool? rgpdConsent,
    bool? passwordDefault,
    String? token,
    String? saudacao,
    DateTime? dataRegisto,
  }) {
    return UserModel(
      nPessoa: nPessoa ?? this.nPessoa,
      nome: nome ?? this.nome,
      apelido: apelido ?? this.apelido,
      email: email ?? this.email,
      avatar: avatar ?? this.avatar,
      idiomaPreferencial: idiomaPreferencial ?? this.idiomaPreferencial,
      thema: thema ?? this.thema,
      perfis: perfis ?? this.perfis,
      idArea: idArea ?? this.idArea,
      area: area ?? this.area,
      pontos: pontos ?? this.pontos,
      rgpdConsent: rgpdConsent ?? this.rgpdConsent,
      passwordDefault: passwordDefault ?? this.passwordDefault,
      token: token ?? this.token,
      saudacao: saudacao ?? this.saudacao,
      dataRegisto: dataRegisto ?? this.dataRegisto,
    );
  }

  // Getters de compatibilidade retroativa
  String get id => nPessoa.toString();
  String get name => nome;
  String get nomeCompleto => '$nome $apelido';
  bool get isFirstLogin => passwordDefault;
  bool get isConsultor => perfis.contains(4);
  bool get isAdmin => perfis.contains(1);
}
