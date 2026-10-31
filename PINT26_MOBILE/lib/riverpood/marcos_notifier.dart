import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/models/marco_model.dart';
import 'package:projeto_pratico/services/marcos_service.dart';

class MarcosState {
  final List<MarcoModel> marcos;
  final bool isLoading;
  final String searchQuery;
  final bool showingAlcancados; // true = Alcançados, false = Disponíveis

  MarcosState({
    this.marcos = const [],
    this.isLoading = false,
    this.searchQuery = '',
    this.showingAlcancados = true,
  });

  MarcosState copyWith({
    List<MarcoModel>? marcos,
    bool? isLoading,
    String? searchQuery,
    bool? showingAlcancados,
  }) {
    return MarcosState(
      marcos: marcos ?? this.marcos,
      isLoading: isLoading ?? this.isLoading,
      searchQuery: searchQuery ?? this.searchQuery,
      showingAlcancados: showingAlcancados ?? this.showingAlcancados,
    );
  }

  List<MarcoModel> get filteredMarcos {
    // 1. Filtrar por Alcançados vs Disponíveis
    var filtered = marcos.where((m) => m.conquistado == showingAlcancados).toList();
    
    // 2. Filtrar por pesquisa
    if (searchQuery.isNotEmpty) {
      final query = searchQuery.toLowerCase();
      filtered = filtered.where((m) => 
        m.nome.toLowerCase().contains(query) || 
        m.descricao.toLowerCase().contains(query) ||
        m.tipoNome.toLowerCase().contains(query)
      ).toList();
    }
    
    return filtered;
  }
}

class MarcosNotifier extends StateNotifier<MarcosState> {
  final MarcosService _service = MarcosService();

  MarcosNotifier() : super(MarcosState()) {
    loadMarcos();
  }

  Future<void> loadMarcos() async {
    state = state.copyWith(isLoading: true);
    try {
      final marcos = await _service.fetchCatologoMarcos();
      
      // Se não houver nenhum marco alcançado, mostrar a lista de disponíveis por defeito
      final hasAlcancados = marcos.any((m) => m.conquistado);
      
      state = state.copyWith(
        marcos: marcos, 
        isLoading: false,
        showingAlcancados: hasAlcancados,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false);
    }
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void toggleShowingAlcancados(bool showAlcancados) {
    state = state.copyWith(showingAlcancados: showAlcancados);
  }
}

final marcosProvider = StateNotifierProvider<MarcosNotifier, MarcosState>((ref) {
  return MarcosNotifier();
});
