import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import 'package:projeto_pratico/services/metricas_service.dart';
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/models/badge_atribuido_model.dart';
// Prepara, fornece e organiza todos os dados que vão aparecer na dashboard
// Agora carrega dados reais automaticamente em vez de mock data

// --- Modelos ---
class MarcoAlcancado {
  final String title;
  final String description;
  final String points;

  MarcoAlcancado(
      {required this.title, required this.description, required this.points});
}

class PremiumBadge {
  final String emoji;
  final String title;
  final String tag;
  final String points;
  final String date;

  PremiumBadge({
    required this.emoji,
    required this.title,
    required this.tag,
    required this.points,
    required this.date,
  });
}

class RequisitoPendente {
  final String code;
  final String title;
  final String description;
  final String status;

  RequisitoPendente({
    required this.code,
    required this.title,
    required this.description,
    required this.status,
  });
}

class DashboardMetrics {
  final int totalBadges;
  final int badgesGrowth;
  final int totalPoints;
  final int pointsGrowth;
  final int totalCandidaturas;
  final int candidaturasGrowth;
  final int rankingPosition;

  DashboardMetrics({
    this.totalBadges = 0,
    this.badgesGrowth = 0,
    this.totalPoints = 0,
    this.pointsGrowth = 0,
    this.totalCandidaturas = 0,
    this.candidaturasGrowth = 0,
    this.rankingPosition = 0,
  });
}

class DashboardState {
  final List<MarcoAlcancado> marcos;
  final List<PremiumBadge> premiumBadges;
  final List<RequisitoPendente> requisitosPendentes;
  final DashboardMetrics metrics;
  final String? saudacao;

  DashboardState({
    this.marcos = const [],
    this.premiumBadges = const [],
    this.requisitosPendentes = const [],
    DashboardMetrics? metrics,
    this.saudacao,
  }) : metrics = metrics ?? DashboardMetrics();
}

class DashboardNotifier extends StateNotifier<DashboardState> {
  final Ref ref;

  DashboardNotifier(this.ref) : super(DashboardState()) {
    // Carrega dados reais automaticamente
    loadRealData();
  }

  Future<void> loadRealData() async {
    try {
      final metricasService = MetricasService();
      
      final authState = ref.read(authProvider);
      final userId = authState.user?.id;
      final saudacao = authState.user?.saudacao;
      
      if (userId == null) return;

      final candidaturas = await metricasService.fetchMinhasCandidaturas();
      final atribuidos = await metricasService.fetchMeusBadgesAtribuidos(userId);
      
      try {
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
        debugPrint("Erro carregar conquistas especiais dashboard: $e");
      }
      // Calculate Dates
      final now = DateTime.now();
      final firstDayOfCurrentMonth = DateTime(now.year, now.month, 1);

      // Calculo Candidaturas
      final currentCandidaturas = candidaturas.length;
      final lastMonthCandidaturas = candidaturas.where((c) => c.dataCandidatura.isBefore(firstDayOfCurrentMonth)).length;
      final candidaturasGrowth = _calculateGrowth(currentCandidaturas, lastMonthCandidaturas);

      // Calculo Badges
      final currentBadges = atribuidos.length;
      final lastMonthBadges = atribuidos.where((b) => b.dataAtribuicao.isBefore(firstDayOfCurrentMonth)).length;
      final badgesGrowth = _calculateGrowth(currentBadges, lastMonthBadges);

      // Calculo Ranking & Points directly from backend
      int currentRank = 0;
      int backendPoints = 0;
      try {
        final rankingList = await metricasService.fetchRankingGeral();
        final myRanking = rankingList.firstWhere((r) => r.id == userId);
        currentRank = myRanking.rank;
        backendPoints = myRanking.pontos;
      } catch (e) {
        debugPrint("Erro ranking/pontos: $e");
        backendPoints = atribuidos.fold(0, (sum, b) => sum + b.pontosAdquiridos);
      }

      final lastMonthPoints = atribuidos.where((b) => b.dataAtribuicao.isBefore(firstDayOfCurrentMonth))
                                        .fold(0, (sum, b) => sum + b.pontosAdquiridos);
      final pointsGrowth = _calculateGrowth(backendPoints, lastMonthPoints);


      // Mapear candidaturas para RequisitoPendente na UI
      final requisitos =
          candidaturas.where((c) => c.idEstadoCandidatura != 4).map((c) {
        return RequisitoPendente(
          code: c.badge?.id ?? 'Badge',
          title: c.badge?.title ?? 'Candidatura Ativa',
          description:
              c.badge?.description ?? 'Verifique os requisitos em falta.',
          status: c.estadoLabel,
        );
      }).toList();

      state = DashboardState(
        marcos: [], // A ser preenchido futuramente com lógicas de conquistas
        premiumBadges: [], // A ser preenchido futuramente com badges de nível superior
        requisitosPendentes: requisitos,
        metrics: DashboardMetrics(
          totalBadges: currentBadges,
          badgesGrowth: badgesGrowth,
          totalPoints: backendPoints,
          pointsGrowth: pointsGrowth,
          totalCandidaturas: currentCandidaturas,
          candidaturasGrowth: candidaturasGrowth,
          rankingPosition: currentRank,
        ),
        saudacao: saudacao,
      );
    } catch (e) {
      debugPrint("Erro ao carregar dados do dashboard reais: $e");
    }
  }

  int _calculateGrowth(int current, int lastMonth) {
    if (lastMonth == 0) {
      if (current > 0) return 100;
      return 0;
    }
    return (((current - lastMonth) / lastMonth) * 100).round();
  }
}

final dashboardProvider =
    StateNotifierProvider<DashboardNotifier, DashboardState>((ref) {
  return DashboardNotifier(ref);
});
