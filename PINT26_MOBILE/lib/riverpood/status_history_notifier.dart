import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/status_history_model.dart';
import '../services/metricas_service.dart';

// Lista todas as submissoes de candidaturas do utilizador e o seu status
// Agora carrega dados reais automaticamente em vez de mock data

class StatusHistoryState {
  final List<StatusHistoryModel> submissions;
  StatusHistoryState({this.submissions = const []});
}

class StatusHistoryNotifier extends StateNotifier<StatusHistoryState> {
  StatusHistoryNotifier() : super(StatusHistoryState()) {
    // Carrega dados reais automaticamente
    loadRealData();
  }

  Future<void> loadRealData() async {
    try {
      final metricasService = MetricasService();
      final candidaturas = await metricasService.fetchMinhasCandidaturas();

      final List<StatusHistoryModel> submissions = candidaturas.map((c) {
        return StatusHistoryModel.fromCandidatura(
          idCandidatura: c.idCandidatura,
          idBadge: c.badge?.id ?? '',
          badgeTitle: c.badge?.title ?? 'Candidatura',
          estadoCandidatura: c.idEstadoCandidatura,
          estadoTraduzido: c.estadoLabel,
          dataCandidatura: c.dataCandidatura,
          feedback: c.idEstadoCandidatura == 5
              ? 'Por favor, reveja os documentos e submeta de novo.'
              : null,
        );
      }).toList();

      submissions.sort((a, b) => b.submissionDate.compareTo(a.submissionDate));

      state = StatusHistoryState(submissions: submissions);
    } catch (e) {
      debugPrint("Erro ao carregar historico de candidaturas real: $e");
    }
  }
}

final statusHistoryProvider =
    StateNotifierProvider<StatusHistoryNotifier, StatusHistoryState>((ref) {
  return StatusHistoryNotifier();
});
