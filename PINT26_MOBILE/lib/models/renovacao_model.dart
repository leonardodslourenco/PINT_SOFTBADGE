class RenovacaoElegivelModel {
  final String idCandidatura;
  final String idBadge;
  final String badgeNome;
  final String lpNome;
  final String areaNome;
  final String nivelNome;
  final int pontosRenovacao;
  final int diasRestantes;
  final String statusRenovacao; // 'pendente', 'none', etc
  final String? idRenovacaoAtiva;
  final String? badgeLogo;

  RenovacaoElegivelModel({
    required this.idCandidatura,
    required this.idBadge,
    required this.badgeNome,
    required this.lpNome,
    required this.areaNome,
    required this.nivelNome,
    required this.pontosRenovacao,
    required this.diasRestantes,
    required this.statusRenovacao,
    this.idRenovacaoAtiva,
    this.badgeLogo,
  });

  factory RenovacaoElegivelModel.fromJson(Map<String, dynamic> json) {
    return RenovacaoElegivelModel(
      idCandidatura: json['id_candidatura'].toString(),
      idBadge: json['id_badge'].toString(),
      badgeNome: json['badge_nome'] ?? 'Badge',
      lpNome: json['lp_nome'] ?? '',
      areaNome: json['area_nome'] ?? '',
      nivelNome: json['nivel_nome'] ?? '',
      pontosRenovacao: json['pontos_renovacao'] ?? 0,
      diasRestantes: json['dias_restantes'] ?? 0,
      statusRenovacao: json['status_renovacao'] ?? 'none',
      idRenovacaoAtiva: json['id_renovacao_ativa']?.toString(),
      badgeLogo: json['badge_logo'],
    );
  }
}

class MinhaRenovacaoModel {
  final String idRenovacaoBadge;
  final DateTime dataPedido;
  final bool? renovacaoAprovada; // null = pendente, true = aprovado, false = recusado
  final int pontosRenovacao;
  final String? moderadorNome;
  final List<dynamic> evidencias;
  final String badgeNome;
  final String badgeLpNome;
  final String badgeAreaNome;
  final String? badgeLogo;

  MinhaRenovacaoModel({
    required this.idRenovacaoBadge,
    required this.dataPedido,
    this.renovacaoAprovada,
    required this.pontosRenovacao,
    this.moderadorNome,
    required this.evidencias,
    required this.badgeNome,
    required this.badgeLpNome,
    required this.badgeAreaNome,
    this.badgeLogo,
  });

  factory MinhaRenovacaoModel.fromJson(Map<String, dynamic> json) {
    final badgeData = json['badge'] ?? {};
    final moderadorData = json['moderador'];

    return MinhaRenovacaoModel(
      idRenovacaoBadge: json['id_renovacao_badge'].toString(),
      dataPedido: DateTime.parse(json['data_pedido']),
      renovacaoAprovada: json['renovacao_aprovada'],
      pontosRenovacao: json['pontos_renovacao'] ?? 0,
      moderadorNome: moderadorData != null ? moderadorData['nome'] : null,
      evidencias: json['evidencias'] ?? [],
      badgeNome: badgeData['nome'] ?? 'Badge',
      badgeLpNome: badgeData['lp_nome'] ?? '',
      badgeAreaNome: badgeData['area_nome'] ?? '',
      badgeLogo: badgeData['logo'] ?? json['badge_logo'],
    );
  }
}
