class RankingModel {
  final String id;
  final String nome;
  final String email;
  final String? avatar;
  final int pontos;
  final String serviceLine;
  final int rank;

  RankingModel({
    required this.id,
    required this.nome,
    required this.email,
    this.avatar,
    required this.pontos,
    required this.serviceLine,
    required this.rank,
  });

  factory RankingModel.fromJson(Map<String, dynamic> json) {
    // A API web no backend de ranking-geral retorna um array de objetos complexos (consultor, pontos).
    // Vou mapear com base no que a API efetivamente retorna.
    
    // O backend envia um objeto com:
    // { "consultor": { "id_utilizador", "nome", "apelido", "avatar", "email", "id_sl", "nome_sl" }, "pontos": 100, "last_approved": "...", "posicao": 1 }
    
    final consultor = json['consultor'] ?? {};
    final idUtilizador = consultor['id_utilizador']?.toString() ?? json['id']?.toString() ?? '';
    final nome = consultor['nome']?.toString() ?? json['nome']?.toString() ?? '';
    final apelido = consultor['apelido']?.toString() ?? '';
    final nomeCompleto = nome.isNotEmpty ? '$nome $apelido'.trim() : 'Utilizador Desconhecido';
    
    final serviceLine = consultor['nome_sl']?.toString() ?? json['serviceLine']?.toString() ?? '—';
    
    return RankingModel(
      id: idUtilizador,
      nome: nomeCompleto,
      email: consultor['email']?.toString() ?? json['email']?.toString() ?? '',
      avatar: consultor['avatar']?.toString() ?? json['avatar']?.toString(),
      pontos: json['pontos'] is int
          ? json['pontos']
          : int.tryParse(json['pontos']?.toString() ?? '0') ?? 0,
      serviceLine: serviceLine,
      rank: json['posicao'] is int
          ? json['posicao']
          : (json['rank'] is int ? json['rank'] : int.tryParse(json['posicao']?.toString() ?? json['rank']?.toString() ?? '0') ?? 0),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nome': nome,
      'email': email,
      'avatar': avatar,
      'pontos': pontos,
      'serviceLine': serviceLine,
      'rank': rank,
    };
  }
}
