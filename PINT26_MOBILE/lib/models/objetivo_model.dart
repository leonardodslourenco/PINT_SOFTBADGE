class TipoObjetivoModel {
  final String idTipoObjetivo;
  final String codigoTipo;
  final Map<String, dynamic> traducaoTitulo;
  final Map<String, dynamic> traducaoDescricao;

  TipoObjetivoModel({
    required this.idTipoObjetivo,
    required this.codigoTipo,
    required this.traducaoTitulo,
    required this.traducaoDescricao,
  });

  factory TipoObjetivoModel.fromJson(Map<String, dynamic> json) {
    return TipoObjetivoModel(
      idTipoObjetivo: json['id_tipo_objetivo']?.toString() ?? '',
      codigoTipo: json['codigo_tipo'] ?? '',
      traducaoTitulo: json['traducao_titulo'] ?? {},
      traducaoDescricao: json['traducao_descricao'] ?? {},
    );
  }

  String getTitulo(String lang) {
    return traducaoTitulo[lang] ?? traducaoTitulo['pt'] ?? codigoTipo;
  }

  String getDescricao(String lang) {
    return traducaoDescricao[lang] ?? traducaoDescricao['pt'] ?? '';
  }
}

class ProgressoObjetivoModel {
  final bool atingiu;
  final num progressoAtual;
  final num metaTotal;
  final String descricaoMeta;

  ProgressoObjetivoModel({
    required this.atingiu,
    required this.progressoAtual,
    required this.metaTotal,
    required this.descricaoMeta,
  });

  factory ProgressoObjetivoModel.fromJson(Map<String, dynamic> json) {
    return ProgressoObjetivoModel(
      atingiu: json['atingiu'] ?? false,
      progressoAtual: json['progresso_atual'] ?? 0,
      metaTotal: json['meta_total'] ?? 0,
      descricaoMeta: json['descricao_meta'] ?? '',
    );
  }
}

class ObjetivoModel {
  final String idObjetivo;
  final String idUtilizador;
  final String idTipoObjetivo;
  final int? quantidadeBadges;
  final int? quantidadePontos;
  final String? tipoDiversidade;
  final int? quantidadeDiversidade;
  final int? prazoValor;
  final String? unidadePrazo;
  final DateTime dataInicio;
  final DateTime? dataLimite;
  final bool ativo;
  final bool cumprido;
  final bool expirado;
  final TipoObjetivoModel? tipoObjetivo;
  final ProgressoObjetivoModel? progresso;

  ObjetivoModel({
    required this.idObjetivo,
    required this.idUtilizador,
    required this.idTipoObjetivo,
    this.quantidadeBadges,
    this.quantidadePontos,
    this.tipoDiversidade,
    this.quantidadeDiversidade,
    this.prazoValor,
    this.unidadePrazo,
    required this.dataInicio,
    this.dataLimite,
    required this.ativo,
    required this.cumprido,
    required this.expirado,
    this.tipoObjetivo,
    this.progresso,
  });

  factory ObjetivoModel.fromJson(Map<String, dynamic> json) {
    return ObjetivoModel(
      idObjetivo: json['id_objetivo']?.toString() ?? '',
      idUtilizador: json['id_utilizador']?.toString() ?? '',
      idTipoObjetivo: json['id_tipo_objetivo']?.toString() ?? '',
      quantidadeBadges: json['quantidade_badges'],
      quantidadePontos: json['quantidade_pontos'],
      tipoDiversidade: json['tipo_diversidade'],
      quantidadeDiversidade: json['quantidade_diversidade'],
      prazoValor: json['prazo_valor'],
      unidadePrazo: json['unidade_prazo'],
      dataInicio: json['data_inicio_objetivo'] != null
          ? DateTime.parse(json['data_inicio_objetivo'])
          : DateTime.now(),
      dataLimite: json['data_limite_objetivo'] != null
          ? DateTime.parse(json['data_limite_objetivo'])
          : null,
      ativo: json['objetivoAtivo'] ?? false,
      cumprido: json['objetivo_cumprido'] ?? false,
      expirado: json['objetivo_expirado'] ?? false,
      tipoObjetivo: json['tipo_objetivo'] != null
          ? TipoObjetivoModel.fromJson(json['tipo_objetivo'])
          : null,
      progresso: json['progresso'] != null
          ? ProgressoObjetivoModel.fromJson(json['progresso'])
          : null,
    );
  }

  /// ID de conveniência (alias para idObjetivo)
  String get id => idObjetivo;

  /// Indica se o objetivo está concluído
  bool get isConcluido => cumprido || (progresso?.atingiu ?? false);

  /// Progresso atual (0..metaTotal)
  num get progressoAtual => progresso?.progressoAtual ?? 0;

  /// Valor alvo (metaTotal)
  num get valorAlvo => progresso?.metaTotal ?? 1;

  /// Calcula a percentagem de conclusão [0..100]
  double get progressoPercentual {
    if (progresso == null || progresso!.metaTotal <= 0) return 0.0;
    final pct = (progresso!.progressoAtual / progresso!.metaTotal) * 100;
    return pct > 100 ? 100.0 : pct;
  }

  /// Dias restantes (nullable — null se não tiver data limite)
  int? get diasRestantes {
    if (dataLimite == null) return null;
    return dataLimite!.difference(DateTime.now()).inDays;
  }

  /// Descrição dinâmica baseada nos dados do backend
  String get descricaoDinamica {
    if (progresso != null && progresso!.descricaoMeta.isNotEmpty) {
      return progresso!.descricaoMeta;
    }
    if (tipoObjetivo != null) {
      return tipoObjetivo!.getTitulo('pt');
    }
    return 'Objetivo #$idObjetivo';
  }
}
