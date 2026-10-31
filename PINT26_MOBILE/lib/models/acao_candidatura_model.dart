// Modelo que mapeia as Ações/Histórico de uma Candidatura.
// Resposta real do Backend (GET /acao_candidatura/candidatura/:id):
// {
//   "id_acao_candidatura": "UUID",
//   "id_candidatura": "UUID",
//   "id_utilizador": "UUID",
//   "tipo_acao_candidatura": 1,
//   "id_traducao_comentario_acao": "UUID" | null,
//   "data_acao_candidatura": "2026-06-25T20:00:00.000Z",
//   "acaoAtiva": true,
//   "tipo_acao": { "traducao_acao": { "pt": "Candidatura Criada" } },
//   "comentario": { "pt": "Texto do comentário" } | null,
//   "autor_acao": { "id_utilizador": "...", "nome": "...", "apelido": "...", "email": "..." }
// }
class AcaoCandidaturaModel {
  final String idAcao;
  final String idCandidatura;
  final String idUtilizador;
  final int tipoAcao;
  final String? tipoAcaoTraduzido;
  final String? comentario;
  final DateTime dataAcao;
  final bool acaoAtiva;
  // Dados do autor (se disponíveis)
  final String? autorNome;
  final String? autorApelido;
  final String? autorEmail;

  AcaoCandidaturaModel({
    required this.idAcao,
    required this.idCandidatura,
    required this.idUtilizador,
    required this.tipoAcao,
    this.tipoAcaoTraduzido,
    this.comentario,
    required this.dataAcao,
    this.acaoAtiva = true,
    this.autorNome,
    this.autorApelido,
    this.autorEmail,
  });

  factory AcaoCandidaturaModel.fromJson(Map<String, dynamic> json) {
    // Extrair tradução do tipo de ação
    String? tipoStr;
    if (json['tipo_acao'] != null && json['tipo_acao']['traducao_acao'] != null) {
      final trad = json['tipo_acao']['traducao_acao'] as Map<String, dynamic>;
      tipoStr = trad['pt']?.toString() ??
          trad['en']?.toString() ??
          trad.values.first?.toString();
    }

    // Extrair comentário traduzido
    String? comentarioStr;
    if (json['comentario'] != null && json['comentario'] is Map) {
      final trad = json['comentario'] as Map<String, dynamic>;
      comentarioStr = trad['pt']?.toString() ??
          trad['en']?.toString() ??
          trad.values.first?.toString();
    }

    // Extrair dados do autor
    final autor = json['autor_acao'];

    return AcaoCandidaturaModel(
      idAcao: json['id_acao_candidatura']?.toString() ?? '',
      idCandidatura: json['id_candidatura']?.toString() ?? '',
      idUtilizador: json['id_utilizador']?.toString() ?? '',
      tipoAcao: json['tipo_acao_candidatura'] is int
          ? json['tipo_acao_candidatura']
          : int.tryParse(json['tipo_acao_candidatura']?.toString() ?? '0') ?? 0,
      tipoAcaoTraduzido: tipoStr,
      comentario: comentarioStr,
      dataAcao: json['data_acao_candidatura'] != null
          ? DateTime.tryParse(json['data_acao_candidatura'].toString()) ??
              DateTime.now()
          : DateTime.now(),
      acaoAtiva: json['acaoAtiva'] != false,
      autorNome: autor?['nome']?.toString(),
      autorApelido: autor?['apelido']?.toString(),
      autorEmail: autor?['email']?.toString(),
    );
  }

  // Helper para nome completo do autor
  String get autorNomeCompleto {
    if (autorNome == null) return 'Sistema';
    return '${autorNome ?? ''} ${autorApelido ?? ''}'.trim();
  }
}
