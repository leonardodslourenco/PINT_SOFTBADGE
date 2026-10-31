// Modelo de apresentação para o ecrã de Histórico de Status.
// Este modelo é construído combinando dados de CandidaturaModel + AcaoCandidaturaModel
// NÃO corresponde diretamente a um endpoint — é derivado no notifier.
class StatusHistoryModel {
  final String id;
  final String badgeId;
  final String badgeTitle;
  final String requirementCode;
  final String status;
  final DateTime submissionDate;
  final String? feedback;

  StatusHistoryModel({
    required this.id,
    required this.badgeId,
    required this.badgeTitle,
    required this.requirementCode,
    required this.status,
    required this.submissionDate,
    this.feedback,
  });

  // Factory para criar a partir de uma candidatura real
  factory StatusHistoryModel.fromCandidatura({
    required String idCandidatura,
    required String idBadge,
    required String badgeTitle,
    required int estadoCandidatura,
    required String? estadoTraduzido,
    required DateTime dataCandidatura,
    String? feedback,
  }) {
    return StatusHistoryModel(
      id: idCandidatura,
      badgeId: idBadge,
      badgeTitle: badgeTitle,
      requirementCode: idBadge, // Para histórico de candidatura usamos o badge ID
      status: estadoTraduzido ?? _fallbackEstado(estadoCandidatura),
      submissionDate: dataCandidatura,
      feedback: feedback,
    );
  }

  static String _fallbackEstado(int estado) {
    switch (estado) {
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
        return 'Pendente';
    }
  }

  // Método para transformar o estado numa cor amigável para a Interface
  String get getStatusHexColor {
    switch (status.toLowerCase()) {
      case 'aprovado':
      case 'aprovada':
        return '0xFF10B981'; // Verde
      case 'em validação':
      case 'validação':
        return '0xFF2563EB'; // Azul
      case 'rejeitado':
      case 'rejeitada':
      case 'rejeitado / cancelado':
      case 'cancelado':
        return '0xFFEF4444'; // Vermelho
      case 'submetido':
      case 'submetida':
        return '0xFFF59E0B'; // Amarelo/Laranja
      case 'aberto':
      case 'rascunho':
        return '0xFF64748B'; // Cinzento
      case 'pendente':
      default:
        return '0xFF64748B';
    }
  }
}