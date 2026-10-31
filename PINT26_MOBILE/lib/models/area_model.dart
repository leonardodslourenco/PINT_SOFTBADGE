// Modelo que mapeia as Áreas técnicas devolvidas pelo Backend.
// Resposta real do Backend (GET /area):
// O controller area.controller.js usa mapArea() que devolve:
// {
//   "id_area": 1,
//   "nome": "LowCode (traduzido)",
//   "id_service_line": 1,
//   "areaAtiva": true
// }
class AreaModel {
  final int idArea;
  final String nome;
  final int idServiceLine;
  final bool areaAtiva;

  AreaModel({
    required this.idArea,
    required this.nome,
    required this.idServiceLine,
    required this.areaAtiva,
  });

  factory AreaModel.fromJson(Map<String, dynamic> json) {
    // O controller faz mapArea que extrai a tradução.
    // Suporta ambos os formatos: flat (já traduzido) ou com objeto de tradução.
    String nomeExtraido = '';
    if (json['nome'] is String) {
      nomeExtraido = json['nome'];
    } else if (json['area'] is String) {
      nomeExtraido = json['area'];
    } else if (json['traducao_area'] != null) {
      final trad = json['traducao_area'];
      if (trad is Map) {
        nomeExtraido = trad['pt']?.toString() ??
            trad['en']?.toString() ??
            trad.values.first?.toString() ??
            '';
      }
    }

    return AreaModel(
      idArea: json['id_area'] is int
          ? json['id_area']
          : int.tryParse(json['id_area']?.toString() ?? '0') ?? 0,
      nome: nomeExtraido,
      idServiceLine: json['id_service_line'] is int
          ? json['id_service_line']
          : int.tryParse(json['id_service_line']?.toString() ?? '0') ?? 0,
      areaAtiva: json['areaAtiva'] != false,
    );
  }
}
