// Modelo que mapeia os Learning Paths do Backend.
// Resposta real (GET /learning_path):
// {
//   "id_learning_path": 1,
//   "learning_path": "Jornada Técnica" (traduzido),
//   "descricao_lp": "Descrição..." (traduzido),
//   "cor": "--color1-LP",
//   "visibilidade": true,
//   "suspenso": false,
//   "lpAtivo": true
// }
class LearningPathModel {
  final int idLearningPath;
  final String nome;
  final String descricao;
  final String? cor;
  final bool visibilidade;
  final bool suspenso;
  final bool lpAtivo;

  LearningPathModel({
    required this.idLearningPath,
    required this.nome,
    required this.descricao,
    this.cor,
    this.visibilidade = true,
    this.suspenso = false,
    this.lpAtivo = true,
  });

  factory LearningPathModel.fromJson(Map<String, dynamic> json) {
    return LearningPathModel(
      idLearningPath: json['id_learning_path'] is int
          ? json['id_learning_path']
          : int.tryParse(json['id_learning_path']?.toString() ?? '0') ?? 0,
      nome: json['learning_path']?.toString() ?? '',
      descricao: json['descricao_lp']?.toString() ?? json['descricao']?.toString() ?? '',
      cor: json['cor']?.toString(),
      visibilidade: json['visibilidade'] != false,
      suspenso: json['suspenso'] == true,
      lpAtivo: json['lpAtivo'] != false,
    );
  }
}
