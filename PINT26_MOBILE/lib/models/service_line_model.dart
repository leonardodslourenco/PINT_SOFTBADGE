// Modelo que mapeia as Service Lines do Backend.
// Resposta real (GET /service_line e GET /service_line/lp/:id):
// {
//   "id_service_line": 1,
//   "service_line": "Núvem Híbrida" (traduzido),
//   "id_learning_path": 1,
//   "learning_path": "Jornada Técnica" (traduzido),
//   "id_sl_lider": "UUID",
//   "nome_sll": "Nome Apelido",
//   "slAtivo": true
// }
class ServiceLineModel {
  final int idServiceLine;
  final String nome;
  final int idLearningPath;
  final String? learningPath;
  final String? idSlLider;
  final String? nomeSll;
  final bool slAtivo;

  ServiceLineModel({
    required this.idServiceLine,
    required this.nome,
    required this.idLearningPath,
    this.learningPath,
    this.idSlLider,
    this.nomeSll,
    this.slAtivo = true,
  });

  factory ServiceLineModel.fromJson(Map<String, dynamic> json) {
    return ServiceLineModel(
      idServiceLine: json['id_service_line'] is int
          ? json['id_service_line']
          : int.tryParse(json['id_service_line']?.toString() ?? '0') ?? 0,
      nome: json['service_line']?.toString() ?? '',
      idLearningPath: json['id_learning_path'] is int
          ? json['id_learning_path']
          : int.tryParse(json['id_learning_path']?.toString() ?? '0') ?? 0,
      learningPath: json['learning_path']?.toString(),
      idSlLider: json['id_sl_lider']?.toString(),
      nomeSll: json['nome_sll']?.toString(),
      slAtivo: json['slAtivo'] != false,
    );
  }
}
