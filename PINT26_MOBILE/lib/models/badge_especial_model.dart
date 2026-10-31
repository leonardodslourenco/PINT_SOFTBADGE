class TipoBadgeEspecialModel {
  final int idTipoBadgeEspecial;
  final String nome;
  final bool requerLink;
  final bool requerFicheiro;
  final bool requerData;

  TipoBadgeEspecialModel({
    required this.idTipoBadgeEspecial,
    required this.nome,
    required this.requerLink,
    required this.requerFicheiro,
    required this.requerData,
  });

  factory TipoBadgeEspecialModel.fromJson(Map<String, dynamic> json) {
    return TipoBadgeEspecialModel(
      idTipoBadgeEspecial: json['id_tipo_badge_especial'] is int
          ? json['id_tipo_badge_especial']
          : int.tryParse(json['id_tipo_badge_especial']?.toString() ?? '0') ?? 0,
      nome: json['nome']?.toString() ?? '',
      requerLink: json['requer_link'] == true ||
          json['requer_link'] == 1 ||
          json['requer_link'] == 'true',
      requerFicheiro: json['requer_ficheiro'] == true ||
          json['requer_ficheiro'] == 1 ||
          json['requer_ficheiro'] == 'true',
      requerData: json['requer_data'] == true ||
          json['requer_data'] == 1 ||
          json['requer_data'] == 'true',
    );
  }
}

class BadgeEspecialModel {
  final String idConquistaEspecial;
  final String titulo;
  final String descricao;
  final int pontosBonus;
  final String? logoConquista;
  final bool ativo;
  final TipoBadgeEspecialModel? tipoBadgeEspecial;

  BadgeEspecialModel({
    required this.idConquistaEspecial,
    required this.titulo,
    required this.descricao,
    required this.pontosBonus,
    this.logoConquista,
    required this.ativo,
    this.tipoBadgeEspecial,
  });

  factory BadgeEspecialModel.fromJson(Map<String, dynamic> json) {
    return BadgeEspecialModel(
      idConquistaEspecial:
          json['id_conquista_especial']?.toString() ?? '',
      titulo: json['titulo']?.toString() ?? 'Badge Especial',
      descricao: json['descricao']?.toString() ?? '',
      pontosBonus: json['pontos_bonus'] is int
          ? json['pontos_bonus']
          : int.tryParse(json['pontos_bonus']?.toString() ?? '0') ?? 0,
      logoConquista: json['logo_conquista']?.toString(),
      ativo: json['ativo'] == true || json['ativo'] == 1 || json['ativo'] == 'true',
      tipoBadgeEspecial: json['tipo_badge_especial'] != null &&
              json['tipo_badge_especial'] is Map<String, dynamic>
          ? TipoBadgeEspecialModel.fromJson(json['tipo_badge_especial'])
          : null,
    );
  }
}
