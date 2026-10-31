import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/models/learning_path_model.dart';
import 'package:projeto_pratico/services/learning_path_service.dart';

// ─── STATE ──────────────────────────────────────────────────────────────────

/// Dados de progresso para um item hierárquico (SL, Área, Nível)
class ProgressData {
  final String nome;
  final int id;
  final int totalItems;
  final int completedItems;
  final int inProgressItems;

  ProgressData({
    required this.nome,
    required this.id,
    required this.totalItems,
    required this.completedItems,
    required this.inProgressItems,
  });

  int get notStartedItems => totalItems - completedItems - inProgressItems;

  double get progressPercent =>
      totalItems == 0 ? 0.0 : (completedItems / totalItems) * 100;

  String get status {
    if (completedItems == totalItems && totalItems > 0) return 'completo';
    if (completedItems > 0 || inProgressItems > 0) return 'em_progresso';
    return 'nao_iniciado';
  }
}

class LearningPathState {
  final List<LearningPathModel> learningPaths;
  final bool isLoading;
  final String? error;

  // Progresso por LP: key = idLearningPath
  final Map<int, List<ProgressData>> serviceLineProgress;

  // Progresso total de cada LP (pré-calculado)
  final Map<int, ProgressData> lpProgress;
  
  // Árvore completa do backend para acesso rápido
  final List<dynamic>? progressoRaw;

  const LearningPathState({
    this.learningPaths = const [],
    this.isLoading = false,
    this.error,
    this.serviceLineProgress = const {},
    this.lpProgress = const {},
    this.progressoRaw,
  });

  LearningPathState copyWith({
    List<LearningPathModel>? learningPaths,
    bool? isLoading,
    String? error,
    Map<int, List<ProgressData>>? serviceLineProgress,
    Map<int, ProgressData>? lpProgress,
    List<dynamic>? progressoRaw,
  }) {
    return LearningPathState(
      learningPaths: learningPaths ?? this.learningPaths,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      serviceLineProgress: serviceLineProgress ?? this.serviceLineProgress,
      lpProgress: lpProgress ?? this.lpProgress,
      progressoRaw: progressoRaw ?? this.progressoRaw,
    );
  }
}

// ─── NOTIFIER ───────────────────────────────────────────────────────────────

class LearningPathNotifier extends StateNotifier<LearningPathState> {
  final LearningPathService _lpService = LearningPathService();

  LearningPathNotifier() : super(const LearningPathState());

  /// Carrega todas as Learning Paths e calcula o progresso global
  Future<void> loadLearningPaths(String userId) async {
    state = state.copyWith(isLoading: true);

    try {
      // 1. Buscar todas as LPs (básico) para o catálogo
      final lps = await _lpService.fetchAllLearningPaths();

      // 2. Buscar a árvore de progresso num único request (Otimização)
      final progressoBackend = await _lpService.fetchProgressos(userId);

      final Map<int, List<ProgressData>> slProgress = {};
      final Map<int, ProgressData> lpProg = {};

      for (final lpJson in progressoBackend) {
        final idLp = lpJson['id_learning_path'] as int;
        
        final List<ProgressData> slData = [];
        final slsJson = lpJson['service_lines'] as List<dynamic>? ?? [];
        
        for (final slJson in slsJson) {
          slData.add(ProgressData(
            nome: slJson['nome'] ?? '',
            id: slJson['id_service_line'] as int,
            totalItems: slJson['total_areas'] as int,
            completedItems: slJson['areas_completas'] as int,
            inProgressItems: slJson['areas_em_progresso'] as int,
          ));
        }

        slProgress[idLp] = slData;

        lpProg[idLp] = ProgressData(
          nome: lpJson['nome'] ?? '',
          id: idLp,
          totalItems: lpJson['total_sls'] as int,
          completedItems: lpJson['sls_completas'] as int,
          inProgressItems: lpJson['sls_em_progresso'] as int,
        );
      }

      state = state.copyWith(
        learningPaths: lps,
        serviceLineProgress: slProgress,
        lpProgress: lpProg,
        progressoRaw: progressoBackend,
        isLoading: false,
      );

      debugPrint('--- [LP Notifier] Carregadas ${lps.length} LPs com progresso otimizado ---');
    } catch (e) {
      debugPrint('--- [LP Notifier] Erro: $e ---');
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  /// Calcula progresso de áreas para uma Service Line específica (Otimizado via cache)
  Future<List<ProgressData>> getAreaProgressForSL(int idServiceLine) async {
    try {
      if (state.progressoRaw == null) return [];
      
      final List<ProgressData> result = [];
      
      for (final lpJson in state.progressoRaw!) {
        final slsJson = lpJson['service_lines'] as List<dynamic>? ?? [];
        final slJson = slsJson.firstWhere(
            (s) => s['id_service_line'] == idServiceLine,
            orElse: () => null);
            
        if (slJson != null) {
          final areasJson = slJson['areas'] as List<dynamic>? ?? [];
          for (final area in areasJson) {
            result.add(ProgressData(
              nome: area['nome'] ?? '',
              id: area['id_area'] as int,
              totalItems: area['total_niveis'] as int,
              completedItems: area['niveis_completos'] as int,
              inProgressItems: area['niveis_em_progresso'] as int,
            ));
          }
          break; // Found the SL, no need to check other LPs
        }
      }

      return result;
    } catch (e) {
      debugPrint('--- [LP Notifier] getAreaProgressForSL erro: $e ---');
      return [];
    }
  }

  /// Calcula progresso de níveis para uma Área específica (Otimizado via cache)
  Future<List<ProgressData>> getNivelProgressForArea(int idArea) async {
    try {
      if (state.progressoRaw == null) return [];
      
      final List<ProgressData> result = [];
      
      for (final lpJson in state.progressoRaw!) {
        final slsJson = lpJson['service_lines'] as List<dynamic>? ?? [];
        for (final slJson in slsJson) {
          final areasJson = slJson['areas'] as List<dynamic>? ?? [];
          final areaJson = areasJson.firstWhere(
              (a) => a['id_area'] == idArea,
              orElse: () => null);
              
          if (areaJson != null) {
            final niveisJson = areaJson['niveis'] as List<dynamic>? ?? [];
            for (final nivel in niveisJson) {
              final badgesConquistados = nivel['badges_completos'] as int;
              final totalBadges = nivel['total_badges'] as int;
              
              final inProgress = (badgesConquistados > 0 && badgesConquistados < totalBadges) ? 1 : 0;
              final completed = (badgesConquistados == totalBadges && totalBadges > 0) ? totalBadges : badgesConquistados;

              result.add(ProgressData(
                nome: nivel['nome'] ?? '',
                id: nivel['id_nivel'] as int,
                totalItems: totalBadges,
                completedItems: completed,
                inProgressItems: inProgress,
              ));
            }
            return result; // Found the area, return
          }
        }
      }

      return result;
    } catch (e) {
      debugPrint('--- [LP Notifier] getNivelProgressForArea erro: $e ---');
      return [];
    }
  }

}

// ─── PROVIDER ───────────────────────────────────────────────────────────────

final learningPathProvider =
    StateNotifierProvider<LearningPathNotifier, LearningPathState>(
  (ref) => LearningPathNotifier(),
);
