// Modelo que mapeia os Níveis de Área do Backend.
// Resposta real (GET /nivel_area e GET /nivel_area/area/:id):
// {
//   "id_nivel_area": 5,
//   "nivel_area": "Nível A" (traduzido),
//   "id_area_sl": 2,
//   "area": "LowCode" (traduzido),
//   "candidatura_com_prazo": false,
//   "tempo_concluir_candidatura": null,
//   "nivelAtivo": true
// }
class NivelAreaModel {
  final int idNivelArea;
  final String nivelArea;
  final int idAreaSl;
  final String? areaNome;
  final bool candidaturaComPrazo;
  final int? tempoConcluirCandidatura;
  final bool nivelAtivo;

  NivelAreaModel({
    required this.idNivelArea,
    required this.nivelArea,
    required this.idAreaSl,
    this.areaNome,
    this.candidaturaComPrazo = false,
    this.tempoConcluirCandidatura,
    this.nivelAtivo = true,
  });

  factory NivelAreaModel.fromJson(Map<String, dynamic> json) {
    return NivelAreaModel(
      idNivelArea: json['id_nivel_area'] is int
          ? json['id_nivel_area']
          : int.tryParse(json['id_nivel_area']?.toString() ?? '0') ?? 0,
      nivelArea: json['nivel_area']?.toString() ?? '',
      idAreaSl: json['id_area_sl'] is int
          ? json['id_area_sl']
          : int.tryParse(json['id_area_sl']?.toString() ?? '0') ?? 0,
      areaNome: json['area']?.toString(),
      candidaturaComPrazo: json['candidatura_com_prazo'] == true,
      tempoConcluirCandidatura: json['tempo_concluir_candidatura'] is int
          ? json['tempo_concluir_candidatura']
          : int.tryParse(json['tempo_concluir_candidatura']?.toString() ?? ''),
      nivelAtivo: json['nivelAtivo'] != false,
    );
  }
}
