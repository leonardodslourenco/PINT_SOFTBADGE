// Modelo que mapeia as Evidências devolvidas pelo Backend.
// Resposta real (GET /evidencia_candidatura/minhas):
// {
//   "id_evidencia_candidatura": "UUID",
//   "id_candidatura": "UUID",
//   "id_requisito_nivel": 5,
//   "nome_ficheiro": "relatorio.pdf",
//   "url_ficheiro": "/uploads/evidences/UUID/evid_20260625_573921.pdf",
//   "data_upload_evidencia": "2026-06-25T20:00:00.000Z",
//   "validado_tm": null,
//   "id_tm_validador": null,
//   "validado_sll": null,
//   "id_sll_validador": null,
//   "evidenciaAtiva": true,
//   "candidatura": { "id_candidatura": "...", "id_estado_candidatura": 1 },
//   "requisito": { ... }
// }
class EvidenceModel {
  final String id;
  final String idCandidatura;
  final int idRequisitoNivel;
  final String nomeFicheiro;
  final String urlFicheiro;
  final DateTime dataUpload;
  final bool? validadoTm;
  final String? idTmValidador;
  final bool? validadoSll;
  final String? idSllValidador;
  final bool evidenciaAtiva;

  EvidenceModel({
    required this.id,
    required this.idCandidatura,
    required this.idRequisitoNivel,
    required this.nomeFicheiro,
    required this.urlFicheiro,
    required this.dataUpload,
    this.validadoTm,
    this.idTmValidador,
    this.validadoSll,
    this.idSllValidador,
    this.evidenciaAtiva = true,
  });

  // Converte o objeto para JSON (para enviar ao backend via API)
  Map<String, dynamic> toJson() {
    return {
      'id_candidatura': idCandidatura,
      'id_requisito': idRequisitoNivel,
      'nome_ficheiro': nomeFicheiro,
      'url_ficheiro': urlFicheiro,
    };
  }

  // PARA RECEBER DA API (Web → Mobile)
  factory EvidenceModel.fromJson(Map<String, dynamic> json) {
    return EvidenceModel(
      id: json['id_evidencia_candidatura']?.toString() ?? '',
      idCandidatura: json['id_candidatura']?.toString() ?? '',
      idRequisitoNivel: json['id_requisito'] is int
          ? json['id_requisito']
          : int.tryParse(json['id_requisito']?.toString() ?? '0') ?? 0,
      nomeFicheiro: json['nome_ficheiro']?.toString() ?? '',
      urlFicheiro: json['url_ficheiro']?.toString() ?? '',
      dataUpload: json['data_upload_evidencia'] != null
          ? DateTime.tryParse(json['data_upload_evidencia'].toString()) ??
              DateTime.now()
          : DateTime.now(),
      validadoTm: json['validado_tm'],
      idTmValidador: json['id_tm_validador']?.toString(),
      validadoSll: json['validado_sll'],
      idSllValidador: json['id_sll_validador']?.toString(),
      evidenciaAtiva: json['evidenciaAtiva'] != false,
    );
  }

  // Helper: verifica se tem pelo menos uma validação
  bool get foiValidado => validadoTm != null || validadoSll != null;

  // Helper: verifica se ambas as validações foram aprovadas
  bool get aprovadoTotal => validadoTm == true && validadoSll == true;
}