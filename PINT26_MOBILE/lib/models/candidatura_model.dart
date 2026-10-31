import 'package:projeto_pratico/models/badge_model.dart';
import 'package:projeto_pratico/models/evidence_model.dart';
import 'package:projeto_pratico/models/acao_candidatura_model.dart';

// Modelo que mapeia as Candidaturas do utilizador.
// Resposta real do Backend (GET /candidatura_badge):
// O endpoint devolve candidaturas com JOINs profundos incluindo:
// - estado (com tradução)
// - badge (com tradução de título/descrição)
// - consultor (dados básicos)
// - evidencias (array)
// - acoes (histórico)
class CandidaturaModel {
  final String idCandidatura;
  final String idUtilizador;
  final String idBadge;
  final int idEstadoCandidatura;
  final String? estadoTraduzido;
  final DateTime dataCandidatura;
  final DateTime? dataEncerramento;
  final bool candidaturaAtiva;
  final BadgeModel? badge;
  final List<EvidenceModel> evidencias;
  final List<AcaoCandidaturaModel> acoes;
  // Campos extras do detalhe
  final bool? completa;
  final List<int>? requisitosEmFalta;
  final bool partilharConclusao;

  CandidaturaModel({
    required this.idCandidatura,
    required this.idUtilizador,
    required this.idBadge,
    required this.idEstadoCandidatura,
    this.estadoTraduzido,
    required this.dataCandidatura,
    this.dataEncerramento,
    this.candidaturaAtiva = true,
    this.badge,
    this.evidencias = const [],
    this.acoes = const [],
    this.completa,
    this.requisitosEmFalta,
    this.partilharConclusao = false,
  });

  CandidaturaModel copyWith({
    String? idCandidatura,
    String? idUtilizador,
    String? idBadge,
    int? idEstadoCandidatura,
    String? estadoTraduzido,
    DateTime? dataCandidatura,
    DateTime? dataEncerramento,
    bool? candidaturaAtiva,
    BadgeModel? badge,
    List<EvidenceModel>? evidencias,
    List<AcaoCandidaturaModel>? acoes,
    bool? completa,
    List<int>? requisitosEmFalta,
    bool? partilharConclusao,
  }) {
    return CandidaturaModel(
      idCandidatura: idCandidatura ?? this.idCandidatura,
      idUtilizador: idUtilizador ?? this.idUtilizador,
      idBadge: idBadge ?? this.idBadge,
      idEstadoCandidatura: idEstadoCandidatura ?? this.idEstadoCandidatura,
      estadoTraduzido: estadoTraduzido ?? this.estadoTraduzido,
      dataCandidatura: dataCandidatura ?? this.dataCandidatura,
      dataEncerramento: dataEncerramento ?? this.dataEncerramento,
      candidaturaAtiva: candidaturaAtiva ?? this.candidaturaAtiva,
      badge: badge ?? this.badge,
      evidencias: evidencias ?? this.evidencias,
      acoes: acoes ?? this.acoes,
      completa: completa ?? this.completa,
      requisitosEmFalta: requisitosEmFalta ?? this.requisitosEmFalta,
      partilharConclusao: partilharConclusao ?? this.partilharConclusao,
    );
  }

  factory CandidaturaModel.fromJson(Map<String, dynamic> json) {
    // Extrair a tradução do estado (multi-idioma)
    // O backend envia: estado: { traducao_estado: { pt: "Aberto" } }
    String? estadoStr;
    if (json['estado'] != null && json['estado']['traducao_estado'] != null) {
      final traducoes =
          json['estado']['traducao_estado'] as Map<String, dynamic>;
      if (traducoes.isNotEmpty) {
        // Tenta pt > en > es > primeiro valor
        estadoStr = traducoes['pt']?.toString() ??
            traducoes['en']?.toString() ??
            traducoes['es']?.toString() ??
            traducoes.values.first?.toString();
      }
    }

    // Extrair o badge associado (se vier no JOIN)
    BadgeModel? badgeExtraido;
    if (json['badge'] != null) {
      try {
        badgeExtraido = BadgeModel.fromJson(json['badge']);
      } catch (_) {
        // Se falhar, ignora e mantém null
      }
    }

    // Extrair evidências (array) da candidatura
    List<EvidenceModel> evidenciasExtraidas = [];
    if (json['evidencias'] != null) {
      final List<dynamic> evidenciasJson = json['evidencias'];
      for (var e in evidenciasJson) {
        try {
          evidenciasExtraidas.add(EvidenceModel.fromJson(e));
        } catch (_) {
          // Protege contra evidências mal-formadas
        }
      }
    }

    // Extrair ações (histórico)
    List<AcaoCandidaturaModel> acoesExtraidas = [];
    if (json['acoes'] != null) {
      final List<dynamic> acoesJson = json['acoes'];
      for (var a in acoesJson) {
        try {
          acoesExtraidas.add(AcaoCandidaturaModel.fromJson(a));
        } catch (_) {}
      }
    }

    // Extrair requisitos em falta (campo extra do detalhe)
    List<int>? reqEmFalta;
    if (json['requisitos_em_falta'] != null) {
      reqEmFalta = (json['requisitos_em_falta'] as List)
          .map((e) => e is int ? e : int.tryParse(e.toString()) ?? 0)
          .toList();
    }

    return CandidaturaModel(
      idCandidatura: json['id_candidatura']?.toString() ?? '',
      idUtilizador: json['id_utilizador']?.toString() ?? '',
      idBadge: json['id_badge']?.toString() ?? '',
      idEstadoCandidatura: json['id_estado_candidatura'] is int
          ? json['id_estado_candidatura']
          : int.tryParse(json['id_estado_candidatura']?.toString() ?? '1') ?? 1,
      estadoTraduzido: estadoStr,
      dataCandidatura: json['data_candidatura'] != null
          ? DateTime.tryParse(json['data_candidatura'].toString()) ??
              DateTime.now()
          : DateTime.now(),
      dataEncerramento: json['data_encerramento_candidatura'] != null
          ? DateTime.tryParse(
              json['data_encerramento_candidatura'].toString())
          : null,
      candidaturaAtiva: json['candidaturaAtiva'] != false,
      badge: badgeExtraido,
      evidencias: evidenciasExtraidas,
      acoes: acoesExtraidas,
      completa: json['completa'],
      requisitosEmFalta: reqEmFalta,
      partilharConclusao: json['partilhar_conclusao'] ?? false,
    );
  }

  // Helpers de estado para a UI
  bool get isOpen => idEstadoCandidatura == 1;
  bool get isSubmitted => idEstadoCandidatura == 2;
  bool get isEmValidacao => idEstadoCandidatura == 3;
  bool get isAprovada => idEstadoCandidatura == 4;
  bool get isRejeitada => idEstadoCandidatura == 5;

  String get estadoLabel {
    return estadoTraduzido ?? _estadoFallback;
  }

  String get _estadoFallback {
    switch (idEstadoCandidatura) {
      case 1:
        return 'Rascunho';
      case 2:
        return 'Submetida';
      case 3:
        return 'Em Validação';
      case 4:
        return 'Aprovado';
      case 5:
        return 'Rejeitado / Cancelado';
      default:
        return 'Desconhecido';
    }
  }
}
