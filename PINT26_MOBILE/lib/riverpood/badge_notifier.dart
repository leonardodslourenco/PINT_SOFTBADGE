import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/models/badge_model.dart';
import 'package:flutter/foundation.dart';
import 'package:projeto_pratico/services/metricas_service.dart';
import 'package:projeto_pratico/services/badge_service.dart';
import 'package:projeto_pratico/models/candidatura_model.dart';
import 'package:projeto_pratico/models/badge_atribuido_model.dart';
import 'package:projeto_pratico/models/evidence_model.dart';

// Serve como controlador do ecra do catálogo
// Cruza informações gerais dos badges com o progresso atual do utilizador
// Valida individualmente requisitos
// Classe que auxilia na filtragem do catalogo

class BadgeState {
  final List<BadgeModel> badges;
  final List<BadgeModel> filteredBadges;
  final List<BadgeModel> recommendations;
  final int totalPoints;
  final double overallProgress;
  final List<int> weeklyPoints;

  // Listas Dinâmicas de Progresso
  final List<CandidaturaModel> minhasCandidaturas;
  final List<BadgeAtribuidoModel> meusBadgesAtribuidos;
  final List<EvidenceModel> minhasEvidencias;

  //Variáveis de Filtro
  final Set<String> selectedLevels; //Guardar nível escolhido
  final String selectedServiceLine;
  final String selectedArea;
  final String selectedStatus;
  final String searchQuery;
  final bool sortByPointsAscending; // true = Menos pontos, false = Mais pontos

  BadgeState({
    this.badges = const [],
    this.filteredBadges = const [],
    this.recommendations = const [],
    this.totalPoints = 0,
    this.overallProgress = 0.0,
    this.weeklyPoints = const [],
    this.minhasCandidaturas = const [],
    this.meusBadgesAtribuidos = const [],
    this.minhasEvidencias = const [],
    this.selectedLevels = const {}, // inicalmente nada seleciondo
    this.selectedServiceLine = 'Todas',
    this.selectedArea = 'Todas',
    this.selectedStatus = 'Todos',
    this.searchQuery = '',
    this.sortByPointsAscending = true,
  });

  BadgeState copyWith({
    List<BadgeModel>? badges,
    List<BadgeModel>? filteredBadges,
    List<BadgeModel>? recommendations,
    int? totalPoints,
    double? overallProgress,
    List<int>? weeklyPoints,
    List<CandidaturaModel>? minhasCandidaturas,
    List<BadgeAtribuidoModel>? meusBadgesAtribuidos,
    List<EvidenceModel>? minhasEvidencias,
    Set<String>? selectedLevels,
    String? selectedServiceLine,
    String? selectedArea,
    String? selectedStatus,
    String? searchQuery,
    bool? sortByPointsAscending,
  }) {
    return BadgeState(
      badges: badges ?? this.badges,
      filteredBadges: filteredBadges ?? this.filteredBadges,
      recommendations: recommendations ?? this.recommendations,
      totalPoints: totalPoints ?? this.totalPoints,
      overallProgress: overallProgress ?? this.overallProgress,
      weeklyPoints: weeklyPoints ?? this.weeklyPoints,
      minhasCandidaturas: minhasCandidaturas ?? this.minhasCandidaturas,
      meusBadgesAtribuidos: meusBadgesAtribuidos ?? this.meusBadgesAtribuidos,
      minhasEvidencias: minhasEvidencias ?? this.minhasEvidencias,
      selectedLevels: selectedLevels ?? this.selectedLevels,
      selectedServiceLine: selectedServiceLine ?? this.selectedServiceLine,
      selectedArea: selectedArea ?? this.selectedArea,
      selectedStatus: selectedStatus ?? this.selectedStatus,
      searchQuery: searchQuery ?? this.searchQuery,
      sortByPointsAscending: sortByPointsAscending ?? this.sortByPointsAscending,
    );
  }

  List<String> get availableServiceLines {
    // 1. Faz o trim e mapeia para evitar valores nulos ou vazios
    final lines = badges
        .map((b) => b.serviceLine.trim())
        .where((line) => line.isNotEmpty && line.toLowerCase() != 'todas')
        .toSet()
        .toList();
        
    // 2. Ordena de forma sensata alfabeticamente
    lines.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    
    // 3. Retorna com a opção 'Todas' no topo
    return ['Todas', ...lines];
  }

  List<String> get availableAreas {
    // 1. Faz o trim e extrai as áreas de forma única
    final areas = badges
        .map((b) => b.area.trim())
        .where((area) => area.isNotEmpty && area.toLowerCase() != 'todas')
        .toSet()
        .toList();
        
    // 2. Ordena alfabeticamente
    areas.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    
    // 3. Retorna com a opção 'Todas' no início
    return ['Todas', ...areas];
  }

  List<String> get availableStatuses {
    final statuses = badges
        .map((b) => b.status.trim())
        .where((status) => status.isNotEmpty && status.toLowerCase() != 'todos')
        .toSet()
        .toList();
        
    statuses.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    return ['Todos', ...statuses];
  }

 // Getter útil para descobrir quais os níveis que realmente existem nos badges atuais
  Set<String> get availableLevelsWithBadges {
    return badges.map((b) => b.level.trim().toUpperCase()).toSet();
  }

  /// Áreas filtradas pela service line atualmente selecionada.
  /// Quando 'Todas' está selecionado, devolve todas as áreas disponíveis.
  List<String> availableAreasForServiceLine(String serviceLine) {
    final source = (serviceLine == 'Todas')
        ? badges
        : badges.where((b) => b.serviceLine.trim().toLowerCase() == serviceLine.trim().toLowerCase()).toList();

    final areas = source
        .map((b) => b.area.trim())
        .where((area) => area.isNotEmpty && area.toLowerCase() != 'todas')
        .toSet()
        .toList();

    areas.sort((a, b) => a.toLowerCase().compareTo(b.toLowerCase()));
    return ['Todas', ...areas];
  }
}

class BadgeNotifier extends StateNotifier<BadgeState> {
  final Ref ref;

  BadgeNotifier(this.ref) : super(BadgeState()) {
    loadBadgesFromApi();
  }

  Future<void> loadBadgesFromApi() async {
    try {
      final badgeService = BadgeService();
      final metricasService = MetricasService();

      // 1. Vai buscar o catálogo base
      final badgesCat = await badgeService.fetchAllBadges();

      // 2. Vai buscar o utilizador atual para os dados pessoais
      final authState = ref.read(authProvider);
      final userId = authState.user?.id;

      List<BadgeAtribuidoModel> atribuidos = [];
      List<CandidaturaModel> candidaturas = [];
      List<EvidenceModel> evidencias = [];

      if (userId != null && userId.isNotEmpty) {
        try {
          atribuidos = await metricasService.fetchMeusBadgesAtribuidos(userId);
          candidaturas = await metricasService.fetchMinhasCandidaturas();
          evidencias = await metricasService.fetchMinhasEvidencias();

          final conquistasEspeciaisUser = await metricasService.fetchConquistasEspeciais();
          for (var ce in conquistasEspeciaisUser) {
            if (ce.idEstado == 2) {
              atribuidos.add(BadgeAtribuidoModel(
                idAtribuicao: -1,
                idCandidato: userId,
                idBadge: ce.idConquistaEspecial ?? '',
                pontosAdquiridos: ce.pontosBonus,
                dataAtribuicao: ce.dataCandidatura ?? DateTime.now(),
                atribuicaoAtiva: true,
                rgdpPartilhaBadge: ce.rgpdPartilhaConquista,
              ));
            }
          }
        } catch (e) {
          debugPrint(
              "Erro ao carregar métricas pessoais no badge_notifier: $e");
        }
      }

      // 3. Cruzar dados: Definir o "status" dinâmico
      final List<BadgeModel> crossedBadges = badgesCat.map((badge) {
        // Preserva requisitos carregados
        final existingBadge = state.badges.firstWhere((b) => b.id == badge.id, orElse: () => badge);
        final preservedRequirements = existingBadge.requirements;

        // Verifica se já o ganhou
        final ganhou = atribuidos.any((b) => b.idBadge == badge.id);
        
        // Verifica se tem candidatura (rascunho ou submetida, ignora as rejeitadas)
        final candidatura = candidaturas.firstWhere(
            (c) => c.idBadge == badge.id && c.idEstadoCandidatura != 5,
            orElse: () => CandidaturaModel(
                idCandidatura: '',
                idUtilizador: '',
                idBadge: '',
                idEstadoCandidatura: -1,
                dataCandidatura: DateTime.now()));

        if (ganhou) {
          return badge.copyWith(
              status: 'concluido',
              idEstadoCandidatura: candidatura.idCandidatura.isNotEmpty ? candidatura.idEstadoCandidatura : null,
              requirements: preservedRequirements,
              idCandidatura: candidatura.idCandidatura.isNotEmpty ? candidatura.idCandidatura : null,
              isPublic: candidatura.partilharConclusao,
          );
        }


        if (candidatura.idEstadoCandidatura != -1) {
          // 1 = Rascunho, 2 = Submetida, 3 = Em Validação...
          return badge.copyWith(
              status: 'em_progresso',
              idEstadoCandidatura: candidatura.idEstadoCandidatura,
              requirements: preservedRequirements,
              idCandidatura: candidatura.idCandidatura,
              isPublic: candidatura.partilharConclusao,
          );
        }

        // Não ganhou nem tem candidatura
        return badge.copyWith(status: 'disponivel', requirements: preservedRequirements);
      }).toList();

      debugPrint(
          "--- [BadgeNotifier] Quantidade de badges recebidos da API: ${crossedBadges.length} ---");

      state = state.copyWith(
        badges: crossedBadges,
        minhasCandidaturas: candidaturas,
        meusBadgesAtribuidos: atribuidos,
        minhasEvidencias: evidencias,
      );

      _calculateRecommendations();

      _applyFilters();
    } catch (e) {
      debugPrint("Erro ao carregar badges da API: $e");
    }
  }

  // Novo método para carregar os requisitos reais de um badge a partir da API
  Future<void> carregarRequisitosBadge(
      String idBadge, String idNivelArea) async {
    try {
      final badgeService = BadgeService();
      final requisitosGerais =
          await badgeService.fetchRequirementsByBadge(idBadge);

      // Procura se o user tem candidatura para este badge
      final candidatura = state.minhasCandidaturas.firstWhere(
          (c) => c.idBadge == idBadge,
          orElse: () => CandidaturaModel(
              idCandidatura: '',
              idUtilizador: '',
              idBadge: '',
              idEstadoCandidatura: -1,
              dataCandidatura: DateTime.now()));

      // Cruzamento de dados: Se a candidatura existir, verificar evidências
      final requisitosCruzados = requisitosGerais.map((req) {
        if (candidatura.idEstadoCandidatura == -1) {
          // Se não há candidatura, está tudo pendente
          return req;
        }

        // O utilizador já se candidatou! Vamos ver se tem evidência para ESTE requisito
        // Usa o id_requisito_nivel para cruzar com as evidências da candidatura
        final temEvidencia = candidatura.evidencias.any(
            (ev) => ev.idRequisitoNivel.toString() == req.code);

        if (temEvidencia) {
          // A lógica de estado baseia-se na candidatura:
          if (candidatura.idEstadoCandidatura == 4) { // Aprovada
            return req.copyWith(status: RequirementStatus.concluido);
          } else if (candidatura.idEstadoCandidatura == 3) { // Em validação
            return req.copyWith(status: RequirementStatus.emValidacao);
          } else if (candidatura.idEstadoCandidatura == 2) { // Submetida
            return req.copyWith(status: RequirementStatus.submetido);
          } else if (candidatura.idEstadoCandidatura == 1) { // Rascunho
            return req.copyWith(status: RequirementStatus.emProgresso);
          }
        }

        return req; // Mantém Pendente se não tiver evidência
      }).toList();

      final index = state.badges.indexWhere((b) => b.id == idBadge);
      List<BadgeModel>? newBadges;
      if (index != -1) {
        newBadges = List.from(state.badges);
        newBadges[index] =
            newBadges[index].copyWith(requirements: requisitosCruzados, isRequirementsLoaded: true);
      }

      final candIndex = state.minhasCandidaturas.indexWhere((c) => c.idBadge == idBadge);
      List<CandidaturaModel>? newCands;
      if (candIndex != -1) {
        newCands = List.from(state.minhasCandidaturas);
        if (newCands[candIndex].badge != null) {
          newCands[candIndex] = newCands[candIndex].copyWith(
            badge: newCands[candIndex].badge!.copyWith(
              requirements: requisitosCruzados,
              isRequirementsLoaded: true,
            ),
          );
        }
      }

      if (newBadges != null || newCands != null) {
        state = state.copyWith(
          badges: newBadges ?? state.badges,
          minhasCandidaturas: newCands ?? state.minhasCandidaturas,
        );
        _applyFilters();
      }
    } catch (e) {
      debugPrint("Erro ao carregar requisitos do badge $idBadge: $e");
      final index = state.badges.indexWhere((b) => b.id == idBadge);
      List<BadgeModel>? newBadges;
      if (index != -1) {
        newBadges = List.from(state.badges);
        newBadges[index] = newBadges[index].copyWith(isRequirementsLoaded: true);
      }

      final candIndex = state.minhasCandidaturas.indexWhere((c) => c.idBadge == idBadge);
      List<CandidaturaModel>? newCands;
      if (candIndex != -1) {
        newCands = List.from(state.minhasCandidaturas);
        if (newCands[candIndex].badge != null) {
          newCands[candIndex] = newCands[candIndex].copyWith(
            badge: newCands[candIndex].badge!.copyWith(isRequirementsLoaded: true),
          );
        }
      }

      if (newBadges != null || newCands != null) {
        state = state.copyWith(
          badges: newBadges ?? state.badges,
          minhasCandidaturas: newCands ?? state.minhasCandidaturas,
        );
      }
    }
  }

  Future<void> loadRealMetrics(String userId) async {
    try {
      final metricasService = MetricasService();
      final atribuidos =
          await metricasService.fetchMeusBadgesAtribuidos(userId);

      final conquistasEspeciaisUser = await metricasService.fetchConquistasEspeciais();
      for (var ce in conquistasEspeciaisUser) {
        if (ce.idEstado == 2) {
          atribuidos.add(BadgeAtribuidoModel(
            idAtribuicao: -1,
            idCandidato: userId,
            idBadge: ce.idConquistaEspecial ?? '',
            pontosAdquiridos: ce.pontosBonus,
            dataAtribuicao: ce.dataCandidatura ?? DateTime.now(),
            atribuicaoAtiva: true,
            rgdpPartilhaBadge: ce.rgpdPartilhaConquista,
          ));
        }
      }

      // Total de Pontos real a partir do backend (Ranking)
      int totalPts = atribuidos.fold(0, (sum, b) => sum + b.pontosAdquiridos);
      try {
        final rankingList = await metricasService.fetchRankingGeral();
        final myRanking = rankingList.firstWhere((r) => r.id == userId);
        totalPts = myRanking.pontos;
      } catch (e) {
        debugPrint("Erro ranking/pontos em badge_notifier: $e");
      }

      // Calculo de tendencia semanal (Esta semana vs Semana Anterior)
      final now = DateTime.now();
      final oneWeekAgo = now.subtract(const Duration(days: 7));
      final twoWeeksAgo = now.subtract(const Duration(days: 14));

      int prevWeekPts = 0;
      int thisWeekPts = 0;

      for (var b in atribuidos) {
        if (b.dataAtribuicao.isAfter(oneWeekAgo)) {
          thisWeekPts += b.pontosAdquiridos;
        } else if (b.dataAtribuicao.isAfter(twoWeeksAgo) &&
            b.dataAtribuicao.isBefore(oneWeekAgo)) {
          prevWeekPts += b.pontosAdquiridos;
        }
      }

      state = state.copyWith(
        totalPoints: totalPts,
        weeklyPoints: [prevWeekPts, thisWeekPts],
      );
    } catch (e) {
      debugPrint("Erro ao carregar metricas reais: $e");
    }
  }

  void setSearchQuery(String query) {
    state = state.copyWith(searchQuery: query.toLowerCase());
    _applyFilters();
  }

  void setServiceLineFilter(String val) {
    // Ao mudar a service line, resetamos também a área (cascading filter)
    state = state.copyWith(selectedServiceLine: val.trim(), selectedArea: 'Todas');
    _applyFilters();
  }

  void setAreaFilter(String val) {
    state = state.copyWith(selectedArea: val.trim());
    _applyFilters();
  }

  void setStatusFilter(String val) {
    state = state.copyWith(selectedStatus: val.trim());
    _applyFilters();
  }

  void togglePointsSorting() {
    // Inverte o sentido da ordenação atual
    final novoEstadoAsc = !state.sortByPointsAscending;
    
    state = state.copyWith(sortByPointsAscending: novoEstadoAsc);
    _applyFilters(); // Re-aplica os filtros e a nova ordenação
  }

  void toggleLevelFilter(String level) {
    final normalizedLevel = level.trim().toUpperCase();
    // Criamos uma cópia do conjunto atual de níveis selecionados
    final currentLevels = Set<String>.from(state.selectedLevels);

    if (currentLevels.contains(normalizedLevel)) {
      // Se já estava selecionado, remove-o (segundo clique desativa o filtro deste nível)
      currentLevels.remove(normalizedLevel);
    } else {
      // Se não estava selecionado, adiciona-o (permite seleção múltipla)
      currentLevels.add(normalizedLevel);
    }

    // Atualiza o estado e dispara o motor de filtragem
    state = state.copyWith(selectedLevels: currentLevels);
    _applyFilters();
  }

  // Método centralizado para aplicar os filtros
  void _applyFilters() {

    for (var b in state.badges) {
      debugPrint('Badge: ${b.title} | ServiceLine: "${b.serviceLine}"');
    }
    debugPrint('ServiceLine selecionada no Estado: "${state.selectedServiceLine}"');

    // Aplicamos os filtros baseados no estado atual
    final filtered = state.badges.where((badge) {
      // 1. Filtro por Pesquisa Textual
      final matchesSearch = state.searchQuery.isEmpty ||
          badge.title.toLowerCase().contains(state.searchQuery.toLowerCase()) ||
          badge.description
              .toLowerCase()
              .contains(state.searchQuery.toLowerCase());

      // 2. Filtro por Nível
      final matchesLevel = state.selectedLevels.isEmpty ||
          state.selectedLevels.contains(badge.level.trim().toUpperCase());

      // 3. Filtro por Área
      final matchesArea =
          state.selectedArea == 'Todas' || badge.area.trim().toLowerCase() == state.selectedArea.trim().toLowerCase();

      // 4. Filtro por Estado
      final matchesStatus = state.selectedStatus == 'Todos' ||
          badge.status.trim().toLowerCase() == state.selectedStatus.trim().toLowerCase();

      //5. Filtro por Service Line
      final matchesServiceLine = state.selectedServiceLine == 'Todas' ||
          badge.serviceLine.trim().toLowerCase() == state.selectedServiceLine.trim().toLowerCase();

      return matchesSearch && matchesLevel && matchesArea && matchesStatus && matchesServiceLine;
    }).toList();

    // Ordena por pontos (crescente ou decrescente)
    filtered.sort((a, b) => state.sortByPointsAscending
      ? a.points.compareTo(b.points)  // Menos para mais pontos
      : b.points.compareTo(a.points)); // Mais para menos pontos

    // Emite o novo estado com a lista filtrada atualizada
    state = state.copyWith(filteredBadges: filtered);
    
  }

  Future<void> refreshBadges() async {
    // 1. Recarrega os dados reais da API
    await loadBadgesFromApi();

    // 2. Garante que os filtros atuais (pesquisa/nível) são reaplicados
    _applyFilters();

    debugPrint("--- [BadgeNotifier] UI atualizada com novos dados da API ---");
  }


  void _calculateRecommendations() {
    // 1. Filtra apenas os badges que estão disponíveis para o utilizador
    final availableBadges = state.badges
        .where((b) => b.status == 'disponivel')
        .toList();

    // 2. Extrai a área de preferência do utilizador
    final authState = ref.read(authProvider);
    final userArea = authState.user?.area ?? '';

    // Função auxiliar para determinar a hierarquia do nível
    int levelWeight(String level) {
      final l = level.toLowerCase();
      if (l.contains('júnior') || l.contains('junior')) return 1;
      if (l.contains('intermédio') || l.contains('intermedio')) return 2;
      if (l.contains('sénior') || l.contains('senior')) return 3;
      return 99; // Casos não previstos
    }

    // 3. Ordenar por relevância (Área -> Nível mais baixo -> Menos pontos)
    availableBadges.sort((a, b) {
      // Prioridade 1: Match com a área do utilizador
      if (userArea.isNotEmpty) {
        final aMatch = a.area.toLowerCase() == userArea.toLowerCase() ? 0 : 1;
        final bMatch = b.area.toLowerCase() == userArea.toLowerCase() ? 0 : 1;
        if (aMatch != bMatch) return aMatch.compareTo(bMatch);
      }
      
      // Prioridade 2: Hierarquia de nível (júnior > intermédio > sénior)
      final aLevel = levelWeight(a.level);
      final bLevel = levelWeight(b.level);
      if (aLevel != bLevel) return aLevel.compareTo(bLevel);
      
      // Prioridade 3: Menos pontos (badges mais rápidos/fáceis de conquistar primeiro)
      return a.points.compareTo(b.points);
    });

    // 4. Limitar o resultado a um máximo de 5 badges recomendados
    final topRecommendations = availableBadges.take(5).toList();

    // 5. Atualizar o estado global com as recomendações calculadas
    state = state.copyWith(recommendations: topRecommendations);
  }

  // Adiciona isto dentro do teu BadgeNotifier
  Future<void> toggleVisibility(String badgeId, bool newValue) async {
    try {
      final badgeService = BadgeService(); // O teu serviço
      
      // 1. Envia para a API
      await badgeService.toggleBadgeVisibility(badgeId, newValue);

      // 2. Se a API responder com sucesso, atualizamos o estado local!
      state = state.copyWith(
        badges: state.badges.map((badge) {
          if (badge.id == badgeId) {
             // Atualiza apenas o badge clicado
            return badge.copyWith(isPublic: newValue); 
          }
          return badge;
        }).toList(),
      );

    } catch (e) {
      // Se falhar (ex: sem net), podes emitir um erro ou ignorar, 
      // e o botão volta à posição original automaticamente.
      debugPrint('Não foi possível mudar a visibilidade: $e');
    }
  }
}

final badgeProvider = StateNotifierProvider<BadgeNotifier, BadgeState>((ref) {
  return BadgeNotifier(ref);
});
