class MarcoModel {
  final int idMarco;
  final int idTipoMarco;
  final String codigoTipo;
  final String tipoNome;
  final String tipoDescricao;
  final String nome;
  final String descricao;
  final int quantidadeObjetivo;
  final bool ativo;
  final bool conquistado;
  final DateTime? dataConquistaMarco;
  final bool celebrado;

  MarcoModel({
    required this.idMarco,
    required this.idTipoMarco,
    required this.codigoTipo,
    required this.tipoNome,
    required this.tipoDescricao,
    required this.nome,
    required this.descricao,
    required this.quantidadeObjetivo,
    required this.ativo,
    required this.conquistado,
    this.dataConquistaMarco,
    required this.celebrado,
  });

  factory MarcoModel.fromJson(Map<String, dynamic> json) {
    return MarcoModel(
      idMarco: int.tryParse(json['id_marco']?.toString() ?? '') ?? 0,
      idTipoMarco: int.tryParse(json['id_tipo_marco']?.toString() ?? '') ?? 0,
      codigoTipo: json['codigo_tipo']?.toString() ?? '',
      tipoNome: json['tipo_nome']?.toString() ?? '',
      tipoDescricao: json['tipo_descricao']?.toString() ?? '',
      nome: json['nome']?.toString() ?? '',
      descricao: json['descricao']?.toString() ?? '',
      quantidadeObjetivo: int.tryParse(json['quantidade_objetivo']?.toString() ?? '') ?? 0,
      ativo: json['ativo'] == true || json['ativo'] == 'true',
      conquistado: json['conquistado'] == true || json['conquistado'] == 'true',
      dataConquistaMarco: json['data_conquista_marco'] != null
          ? DateTime.tryParse(json['data_conquista_marco'].toString())
          : null,
      celebrado: json['celebrado'] == true || json['celebrado'] == 'true',
    );
  }
}
