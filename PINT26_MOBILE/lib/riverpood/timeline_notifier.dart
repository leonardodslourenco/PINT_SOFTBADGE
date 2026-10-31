import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter/foundation.dart';
import '../models/timeline_model.dart';
import '../services/metricas_service.dart';
import 'package:projeto_pratico/models/badge_atribuido_model.dart';
import 'package:projeto_pratico/services/basededados.dart';
import '../services/candidatura_service.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

// Cria histórico cronológico e visual do progresso do utilizador
// Histórico de pontos por mês

class TimelineState {
  final List<TimelineEvent> events;
  final List<TimelineEntryData> pointsHistory;

  TimelineState({
    this.events = const [],
    this.pointsHistory = const [],
  });
}

class TimelineNotifier extends StateNotifier<TimelineState> {
  TimelineNotifier() : super(TimelineState());

  Future<void> loadRealTimeline(String userId, AppLocalizations l10n) async {
    try {
      final metricasService = MetricasService();
      final atribuidos =
          await metricasService.fetchMeusBadgesAtribuidos(userId);
          
      final Set<String> specialBadgeIds = {};
      
      try {
        final conquistasEspeciaisUser = await metricasService.fetchConquistasEspeciais();
        for (var ce in conquistasEspeciaisUser) {
          if (ce.idEstado == 2) {
            final id = ce.idConquistaEspecial ?? '';
            specialBadgeIds.add(id);
            atribuidos.add(BadgeAtribuidoModel(
              idAtribuicao: -1,
              idCandidato: userId,
              idBadge: id,
              pontosAdquiridos: ce.pontosBonus,
              dataAtribuicao: ce.dataCandidatura ?? DateTime.now(),
              atribuicaoAtiva: true,
              rgdpPartilhaBadge: ce.rgpdPartilhaConquista,
            ));
          }
        }
      } catch (e) {
        debugPrint("Erro carregar conquistas especiais na timeline: $e");
      }

      final sqliteService = Basededados();
      final userData = await sqliteService.getUser();
      DateTime? dataRegisto;
      if (userData != null && userData['data_registo'] != null) {
        dataRegisto = DateTime.tryParse(userData['data_registo'].toString());
      }

      // --- 1. Calcular Histórico de Pontos Agrupado por Mês ---
      final meses = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      final cores = [0xFF155DFC, 0xFF7C3AED, 0xFF0891B2, 0xFFD946EF];

      final List<TimelineEntryData> history = [];
      final now = DateTime.now();
      
      int monthsToGenerate = 24; // Máximo por defeito
      if (dataRegisto != null) {
        // Calcular meses de diferença desde o registo até agora
        int diff = (now.year - dataRegisto.year) * 12 + now.month - dataRegisto.month + 1; // +1 para incluir o mês atual
        if (diff > 0) {
           monthsToGenerate = diff;
           // Limite para não sobrecarregar
           if (monthsToGenerate > 60) monthsToGenerate = 60; // Max 5 anos
        } else {
           monthsToGenerate = 1; // Pelo menos o mês atual
        }
      }

      // Gerar os meses a partir do limite calculado
      for (int i = 0; i < monthsToGenerate; i++) {
        // Subtrair i meses lidará automaticamente com a viragem do ano
        final targetDate = DateTime(now.year, now.month - i, 1);
        final mesString = '${meses[targetDate.month - 1]} ${targetDate.year}';

        // Encontrar os badges até ao último dia deste mês para calcular o total cumulativo
        final badgesAteMes = atribuidos.where((b) {
          final data = b.dataAtribuicao;
          return data.year < targetDate.year ||
              (data.year == targetDate.year && data.month <= targetDate.month);
        }).toList();

        // Encontrar os badges apenas deste mês específico
        final badgesNoMes = badgesAteMes.where((b) =>
            b.dataAtribuicao.year == targetDate.year &&
            b.dataAtribuicao.month == targetDate.month).toList();

        final ptsGanhos = badgesNoMes.fold(0, (sum, b) => sum + b.pontosAdquiridos);
        final qntGanhos = badgesNoMes.length;

        history.add(TimelineEntryData(
          month: mesString,
          points: "$ptsGanhos",
          detail: "$qntGanhos Badges",
          colorHex: cores[i % cores.length],
        ));
      }

      // --- 2. Calcular Evolução Profissional (Events) ---
      final List<TimelineEvent> computedEvents = atribuidos.map((b) {
        final isSpecial = specialBadgeIds.contains(b.idBadge);
        return TimelineEvent(
          title: isSpecial ? l10n.timelineSpecialConquest : l10n.timelineBadgeConquered,
          description: l10n.timelineEarnedPoints(b.pontosAdquiridos),
          date: b.dataAtribuicao,
          isCompleted: true,
          badgeId: b.idBadge,
          badgeImageUrl: 'Básico',
          emoji: isSpecial ? '🌟' : '⭐',
          isSpecialBadge: isSpecial,
        );
      }).toList();

      // --- 3. Adicionar Histórico de Ações das Candidaturas ---
      try {
        final candidaturas = await CandidaturaService().fetchMinhasCandidaturas();
        for (var candidatura in candidaturas) {
          final badgeName = candidatura.badge?.title ?? 'Badge';
          for (var acao in candidatura.acoes) {
            // Filtrar apenas ações principais (2, 3, 4, 5, 6)
            if ([2, 3, 4, 5, 6].contains(acao.tipoAcao)) {
              String emoji = '📝';
              String title = acao.tipoAcaoTraduzido ?? 'Atualização de Candidatura';
              
              if (acao.tipoAcao == 2) {
                emoji = '📩';
                title = l10n.statusSubmitted;
              } else if (acao.tipoAcao == 3 || acao.tipoAcao == 5) {
                emoji = '❌';
                title = l10n.statusRejectedCancelled;
              } else if (acao.tipoAcao == 4) {
                emoji = '⏳';
                title = l10n.statusInValidation;
              } else if (acao.tipoAcao == 6) {
                emoji = '✅';
                title = l10n.statusApproved;
              }

              computedEvents.add(
                TimelineEvent(
                  title: title,
                  description: badgeName,
                  date: acao.dataAcao,
                  isCompleted: true,
                  badgeId: candidatura.idBadge,
                  emoji: emoji,
                ),
              );
            }
          }
        }
      } catch (e) {
        debugPrint("Erro ao carregar candidaturas na timeline: $e");
      }

      computedEvents.sort((a, b) => b.date.compareTo(a.date));

      state = TimelineState(
        events: computedEvents,
        pointsHistory: history,
      );
    } catch (e) {
      debugPrint("Erro ao carregar Timeline: $e");
    }
  }
}

final timelineProvider =
    StateNotifierProvider<TimelineNotifier, TimelineState>((ref) {
  return TimelineNotifier();
});
