// Representa o estado individual de validação de um requisito profissional.
enum RequirementStatus {
  disponivel,
  emProgresso,
  submetido,
  emValidacao,
  concluido
}

// Entidade que mapeia os requisitos de cada nível da API.
// Resposta real do Backend (GET /requisito_nivel/nivel/:id):
// {
//   "id_requisito_nivel": 1,
//   "id_nivel_area": 5,
//   "obrigatoriedade_req_nivel": true,
//   "requisitoAtivo": true,
//   "traducao_titulo": { "pt": "Titulo..." },
//   "traducao_subtitulo": { "pt": "Sub..." },
//   "traducao_descricao": { "pt": "Desc..." }
// }
class RequirementModel {
  final String code; // Representa o id_requisito_nivel da BD
  final String title;
  final String subtitle;
  final String description;
  final bool obrigatorio;
  final String? imageUrl;
  final RequirementStatus status;

  RequirementModel({
    required this.code,
    required this.title,
    required this.subtitle,
    required this.description,
    this.obrigatorio = true,
    this.imageUrl,
    required this.status,
  });

  RequirementModel copyWith({
    RequirementStatus? status,
  }) {
    return RequirementModel(
      code: code,
      title: title,
      subtitle: subtitle,
      description: description,
      obrigatorio: obrigatorio,
      imageUrl: imageUrl,
      status: status ?? this.status,
    );
  }

  factory RequirementModel.fromJson(Map<String, dynamic> json) {
    RequirementStatus parseStatus(String? statusStr) {
      switch (statusStr) {
        case 'emProgresso':
          return RequirementStatus.emProgresso;
        case 'submetido':
          return RequirementStatus.submetido;
        case 'emValidacao':
          return RequirementStatus.emValidacao;
        case 'concluido':
          return RequirementStatus.concluido;
        default:
          return RequirementStatus.disponivel;
      }
    }

    // O backend devolve as traduções como objetos { "pt": "texto" }
    // O campo final traduzido é extraído com a chave de idioma (default: 'pt')
    String extractTranslation(dynamic traducao) {
      if (traducao == null) return '';
      if (traducao is String) return traducao;
      if (traducao is Map) {
        // Tenta pt > en > es > primeiro valor disponível
        return traducao['pt']?.toString() ??
            traducao['en']?.toString() ??
            traducao['es']?.toString() ??
            traducao.values.first?.toString() ??
            '';
      }
      return traducao.toString();
    }

    bool parseBool(dynamic value) {
      if (value == null) return true;
      if (value is bool) return value;
      if (value is int) return value == 1;
      if (value is String) return value.toLowerCase() == 'true' || value == '1';
      return true;
    }

    return RequirementModel(
      code: (json['id_requisito'] ?? json['id_requisito_badge'] ?? json['id_requisito_nivel'])?.toString() ?? '',
      // Suporte a ambos os formatos: string direta ou objeto de tradução
      title: json['titulo']?.toString() ??
          extractTranslation(json['traducao_titulo']),
      subtitle: json['subtitulo']?.toString() ??
          extractTranslation(json['traducao_subtitulo']),
      description: json['descricao']?.toString() ??
          extractTranslation(json['traducao_descricao']),
      obrigatorio: parseBool(json['obrigatoriedade_req'] ?? json['obrigatoriedade_req_nivel']),
      imageUrl: json['imagem_url']?.toString(),
      status: parseStatus(json['estado']?.toString()),
    );
  }
}

// Entidade principal que mapeia uma Badge do catálogo.
// Resposta real do Backend (GET /api/badges) após processamento pelo mapBadge():
// {
//   "id_badge": "UUID",
//   "titulo": "Badge Title (traduzido)",
//   "descricao": "Descrição (traduzida)",
//   "logo": "default_badge.svg",
//   "emissor": "Sistema Integração",
//   "pontos": 100,
//   "badge_expiravel": false,
//   "tempo_expiracao": null,
//   "badgeAtivo": true,
//   "id_nivel_area": 5,
//   "nivel_area": "Nível A (traduzido)",
//   "area": "LowCode (traduzido)",
//   "id_area": 2,
//   "id_service_line": 1
// }
class BadgeModel {
  final String id;
  final String title;
  final String description;
  final String logo;
  final String emissor;
  final String status; // 'disponivel', 'em_progresso', 'concluido'
  final int? idEstadoCandidatura; // 1=Rascunho, 2=Submetida, 3=Em Validação, 4=Aprovado, 5=Rejeitado
  final int points;
  final bool badgeExpiravel;
  final int? tempoExpiracao;
  final bool badgeAtivo;
  final bool isPublic;
  final String? idCandidatura;

  // Hierarquia Softinsa
  final int? idNivelArea;
  final String level; // nivel_area traduzido
  final int? idArea;
  final String area; // area traduzida

  final int? idServiceLine;
  final String learningPath;
  final String serviceLine;
  final String? dateEarned;

  final List<RequirementModel> requirements;

  final bool isRequirementsLoaded;

  /// Helper para uniformizar o nome do nível (limpa sufixos e prefixos)
  static String _formatLevel(String rawLevel) {
    if (rawLevel.isEmpty) return rawLevel;
    
    String formatted = rawLevel;
    // Corta no " - " se existir (ex: "Nível Júnior - Backend" -> "Nível Júnior")
    if (formatted.contains(' - ')) {
      formatted = formatted.split(' - ').first;
    }
    // Remove o prefixo "Nível " ou "Nivel "
    formatted = formatted.replaceAll(RegExp(r'^Nível\s+', caseSensitive: false), '');
    formatted = formatted.replaceAll(RegExp(r'^Nivel\s+', caseSensitive: false), '');
    formatted = formatted.trim();
    
    // Capitaliza a primeira letra (ex: intermédio -> Intermédio)
    if (formatted.isNotEmpty) {
      formatted = formatted[0].toUpperCase() + formatted.substring(1);
    }
    return formatted;
  }

  BadgeModel({
    required this.id,
    required this.title,
    required this.description,
    required this.logo,
    required this.emissor,
    required this.status,
    this.idEstadoCandidatura,
    required this.points,
    required this.badgeExpiravel,
    this.tempoExpiracao,
    required this.badgeAtivo,
    required this.isPublic,
    this.idCandidatura,
    this.idNivelArea,
    required this.level,
    this.idArea,
    required this.area,
    this.idServiceLine,
    required this.learningPath,
    required this.serviceLine,
    this.dateEarned,
    required this.requirements,
    this.isRequirementsLoaded = false,
  });

  BadgeModel copyWith({
    String? status,
    int? idEstadoCandidatura,
    List<RequirementModel>? requirements,
    bool? isPublic,
    String? idCandidatura,
    bool? isRequirementsLoaded,
  }) {
    return BadgeModel(
      id: id,
      title: title,
      description: description,
      logo: logo,
      emissor: emissor,
      status: status ?? this.status,
      idEstadoCandidatura: idEstadoCandidatura ?? this.idEstadoCandidatura,
      points: points,
      badgeExpiravel: badgeExpiravel,
      tempoExpiracao: tempoExpiracao,
      badgeAtivo: badgeAtivo,
      isPublic: isPublic ?? this.isPublic,
      idCandidatura: idCandidatura ?? this.idCandidatura,
      idNivelArea: idNivelArea,
      level: level,
      idArea: idArea,
      area: area,
      idServiceLine: idServiceLine,
      learningPath: learningPath, 
      serviceLine: serviceLine,
      dateEarned: dateEarned,
      requirements: requirements ?? this.requirements,
      isRequirementsLoaded: isRequirementsLoaded ?? this.isRequirementsLoaded,
    );
  }

  // Retorna o número de requisitos que já estão com o estado concluído.
  int get completedRequirementsCount {
    return requirements
        .where((req) => req.status == RequirementStatus.concluido)
        .length;
  }

  // Retorna a percentagem de progresso real do Badge entre 0.0 e 1.0
  double get progressPercentage {
    if (requirements.isEmpty) return 0.0;
    return completedRequirementsCount / requirements.length;
  }

  factory BadgeModel.fromJson(Map<String, dynamic> json) {
    // Desserialização da lista de sub-objetos de forma segura
    var requirementsList = json['requisitos'] as List? ?? [];
    List<RequirementModel> parsedRequirements = requirementsList
        .map((reqJson) =>
            RequirementModel.fromJson(reqJson as Map<String, dynamic>))
        .toList();

    // Extrair tradução quando vem como objeto { "pt": "texto" }
    String extractTranslation(dynamic traducao) {
      if (traducao == null) return '';
      if (traducao is String) return traducao;
      if (traducao is Map) {
        return traducao['pt']?.toString() ??
            traducao['en']?.toString() ??
            traducao['es']?.toString() ??
            traducao.values.first?.toString() ??
            '';
      }
      return traducao.toString();
    }

    return BadgeModel(
      id: json['id_badge']?.toString() ?? '',

      // O backend mapBadge() já devolve 'titulo' e 'descricao' como strings
      // traduzidas. Em caso de vir como objeto, extraímos com fallback.
      title: json['titulo'] is String
          ? json['titulo']
          : extractTranslation(json['traducao_titulo']) != ''
              ? extractTranslation(json['traducao_titulo'])
              : 'Sem título',

      description: json['descricao'] is String
          ? json['descricao']
          : extractTranslation(json['traducao_descricao']) != ''
              ? extractTranslation(json['traducao_descricao'])
              : 'Sem descrição',

      logo: json['logo']?.toString() ?? 'default_badge.svg',

      emissor: json['emissor']?.toString() ?? 'Sistema Integração',

      // O estado dinâmico é injetado pelo badge_notifier (não vem da API diretamente)
      status: json['estado']?.toString() ?? 'disponivel',

      // Pontos com parsing seguro
      points: (json['pontos'] is int)
          ? json['pontos']
          : int.tryParse(json['pontos']?.toString() ?? '0') ?? 0,

      badgeExpiravel: json['badge_expiravel'] == true,

      tempoExpiracao: json['tempo_expiracao'] is int
          ? json['tempo_expiracao']
          : int.tryParse(json['tempo_expiracao']?.toString() ?? ''),

      badgeAtivo: json['badgeAtivo'] != false,

      isPublic: json['is_public'] ?? false,
      idCandidatura: json['id_candidatura']?.toString(),

      // Hierarquia — mapBadge() devolve estes campos flat
      idNivelArea: json['id_nivel_area'] is int
          ? json['id_nivel_area']
          : int.tryParse(json['id_nivel_area']?.toString() ?? ''),

      // nivel_area vem traduzido ou como string, limpamos com _formatLevel
      level: _formatLevel(
        json['nivel_area'] is String
            ? json['nivel_area']
            : extractTranslation(json['traducao_nivel_area']) != ''
                ? extractTranslation(json['traducao_nivel_area'])
                : json['nivel']?.toString() ?? 'A',
      ),

      idArea: json['id_area'] is int
          ? json['id_area']
          : int.tryParse(json['id_area']?.toString() ?? ''),

      area: json['area'] is String
          ? json['area']
          : extractTranslation(json['traducao_area']) != ''
              ? extractTranslation(json['traducao_area'])
              : 'Geral',

      idServiceLine: json['id_service_line'] is int
          ? json['id_service_line']
          : int.tryParse(json['id_service_line']?.toString() ?? ''),

      learningPath: json['learning_path']?.toString() ?? 'Jornada Técnica',

      serviceLine: json['service_line'] is String
          ? json['service_line']
          : extractTranslation(json['traducao_service_line']) != ''
              ? extractTranslation(json['traducao_service_line'])
              : json['service_line']?.toString() ?? 'Todas',

      dateEarned: json['data_conclusao']?.toString() ?? '',

      requirements: parsedRequirements,
    );
  }
}
