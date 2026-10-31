import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import 'package:projeto_pratico/models/objetivo_model.dart';
import 'package:projeto_pratico/services/objetivo_service.dart';

class ObjetivoState {
  final List<ObjetivoModel> objetivos;
  final List<TipoObjetivoModel> tiposDisponiveis;
  final bool isLoading;

  ObjetivoState({
    this.objetivos = const [],
    this.tiposDisponiveis = const [],
    this.isLoading = false,
  });

  /// Retorna apenas os objetivos ativos (não cumpridos e não expirados)
  List<ObjetivoModel> get ativos =>
      objetivos.where((o) => o.ativo && !o.cumprido && !o.expirado).toList();
}

class ObjetivoNotifier extends StateNotifier<ObjetivoState> {
  final ObjetivoService _service = ObjetivoService();

  ObjetivoNotifier() : super(ObjetivoState());

  Future<void> loadData() async {
    state = ObjetivoState(
      isLoading: true,
      objetivos: state.objetivos,
      tiposDisponiveis: state.tiposDisponiveis,
    );

    try {
      final objetivos = await _service.fetchMeusObjetivos(status: 'todos');
      final tipos = await _service.fetchTiposObjetivo();

      state = ObjetivoState(
        objetivos: objetivos,
        tiposDisponiveis: tipos,
      );
    } catch (e) {
      debugPrint('--- [ObjetivoNotifier] Erro ao carregar dados: $e ---');
      state = ObjetivoState(
        objetivos: [],
        tiposDisponiveis: [],
      );
    }
  }

  Future<bool> criarObjetivo(Map<String, dynamic> payload) async {
    final success = await _service.criarObjetivo(payload);
    if (success) {
      await loadData();
    }
    return success;
  }

  Future<bool> cancelarObjetivo(String idObjetivo) async {
    final success = await _service.cancelarObjetivo(idObjetivo);
    if (success) {
      await loadData();
    }
    return success;
  }
}

final objetivoProvider = StateNotifierProvider<ObjetivoNotifier, ObjetivoState>((ref) {
  return ObjetivoNotifier();
});
