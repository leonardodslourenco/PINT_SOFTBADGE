// Modelo que mapeia os Badges Atribuídos (conquistados) pelo utilizador.
// Resposta real do Backend (GET /badge_atribuido?id_candidato=UUID):
// {
//   "id_atribuicao": 1,        ← INTEGER auto-increment (NÃO é UUID!)
//   "id_candidato": "UUID",
//   "id_candidatura": "UUID",
//   "id_badge": "UUID",
//   "data_atribuicao_badge": "2026-06-25T20:00:00.000Z",
//   "data_expiracao": null,
//   "url_publico_badge": null,
//   "pontos_adquiridos": 100,
//   "rgdp_partilha_badge": false,
//   "atribuicaoAtiva": true
// }
class BadgeAtribuidoModel {
  final int idAtribuicao;
  final String idCandidato;
  final String? idCandidatura;
  final String idBadge;
  final DateTime dataAtribuicao;
  final DateTime? dataExpiracao;
  final String? urlPublicoBadge;
  final int pontosAdquiridos;
  final bool rgdpPartilhaBadge;
  final bool atribuicaoAtiva;

  BadgeAtribuidoModel({
    required this.idAtribuicao,
    required this.idCandidato,
    this.idCandidatura,
    required this.idBadge,
    required this.dataAtribuicao,
    this.dataExpiracao,
    this.urlPublicoBadge,
    required this.pontosAdquiridos,
    this.rgdpPartilhaBadge = false,
    required this.atribuicaoAtiva,
  });

  factory BadgeAtribuidoModel.fromJson(Map<String, dynamic> json) {
    return BadgeAtribuidoModel(
      // A PK é 'id_atribuicao' (integer), não UUID
      idAtribuicao: json['id_atribuicao'] is int
          ? json['id_atribuicao']
          : int.tryParse(json['id_atribuicao']?.toString() ?? '0') ?? 0,
      idCandidato: json['id_candidato']?.toString() ?? '',
      idCandidatura: json['id_candidatura']?.toString(),
      idBadge: json['id_badge']?.toString() ?? '',
      dataAtribuicao: json['data_atribuicao_badge'] != null
          ? DateTime.tryParse(json['data_atribuicao_badge'].toString()) ??
              DateTime.now()
          : DateTime.now(),
      dataExpiracao: json['data_expiracao'] != null
          ? DateTime.tryParse(json['data_expiracao'].toString())
          : null,
      urlPublicoBadge: json['url_publico_badge']?.toString(),
      pontosAdquiridos: json['pontos_adquiridos'] is int
          ? json['pontos_adquiridos']
          : int.tryParse(json['pontos_adquiridos']?.toString() ?? '0') ?? 0,
      rgdpPartilhaBadge: json['rgdp_partilha_badge'] == true,
      atribuicaoAtiva: json['atribuicaoAtiva'] != false,
    );
  }
}
