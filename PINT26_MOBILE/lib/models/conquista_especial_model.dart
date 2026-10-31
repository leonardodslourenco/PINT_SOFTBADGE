class ConquistaEspecialModel {
  final String? idConquistaEspecial;
  final String idCandidaturaEspecial;
  final String? logoConquista;
  final String badgeTitulo;
  final int pontosBonus;
  final DateTime? dataCandidatura;
  final String? urlComprovativo;
  final String? ficheiroComprovativo;
  final int idEstado;
  final String? motivoRecusa;
  final bool rgpdPartilhaConquista;
  final String? publicUrl;

  ConquistaEspecialModel({
    this.idConquistaEspecial,
    required this.idCandidaturaEspecial,
    this.logoConquista,
    required this.badgeTitulo,
    required this.pontosBonus,
    this.dataCandidatura,
    this.urlComprovativo,
    this.ficheiroComprovativo,
    required this.idEstado,
    this.motivoRecusa,
    required this.rgpdPartilhaConquista,
    this.publicUrl,
  });

  factory ConquistaEspecialModel.fromJson(Map<String, dynamic> json) {
    return ConquistaEspecialModel(
      idConquistaEspecial: json['id_conquista_especial']?.toString(),
      idCandidaturaEspecial: json['id_candidatura_especial']?.toString() ?? json['id']?.toString() ?? json['id_candidatura']?.toString() ?? '',
      logoConquista: json['logo_conquista']?.toString(),
      badgeTitulo: json['badge_titulo']?.toString() ?? 'Badge Especial',
      pontosBonus: json['pontos_bonus'] is int
          ? json['pontos_bonus']
          : int.tryParse(json['pontos_bonus']?.toString() ?? '0') ?? 0,
      dataCandidatura: json['data_candidatura'] != null
          ? DateTime.tryParse(json['data_candidatura'].toString())
          : null,
      urlComprovativo: json['url_comprovativo']?.toString(),
      ficheiroComprovativo: json['ficheiro_comprovativo']?.toString(),
      idEstado: json['id_estado'] is int
          ? json['id_estado']
          : int.tryParse(json['id_estado']?.toString() ?? '0') ?? 0,
      motivoRecusa: json['motivo_recusa']?.toString(),
      rgpdPartilhaConquista: json['rgpd_partilha_conquista'] == true ||
          json['rgpd_partilha_conquista'] == 1 ||
          json['rgpd_partilha_conquista'] == 'true' ||
          json['partilhar_conquista_especial'] == true ||
          json['partilhar_conquista_especial'] == 1 ||
          json['partilhar_conquista_especial'] == 'true',
      publicUrl: json['public_url']?.toString(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id_candidatura_especial': idCandidaturaEspecial,
      'logo_conquista': logoConquista,
      'badge_titulo': badgeTitulo,
      'pontos_bonus': pontosBonus,
      'data_candidatura': dataCandidatura?.toIso8601String(),
      'url_comprovativo': urlComprovativo,
      'ficheiro_comprovativo': ficheiroComprovativo,
      'id_estado': idEstado,
      'motivo_recusa': motivoRecusa,
      'rgpd_partilha_conquista': rgpdPartilhaConquista,
      'public_url': publicUrl,
    };
  }
}
