import 'package:projeto_pratico/models/badge_atribuido_model.dart';
import 'package:projeto_pratico/models/candidatura_model.dart';

// Serviço de gamificação com cálculos locais baseados nos dados
// reais obtidos das APIs de badge_atribuido e candidatura_badge.

class GamificationService {
  // ─── PONTUAÇÃO TOTAL ──────────────────────────────────────────────────────
  int calcularPontosTotal(List<BadgeAtribuidoModel> atribuidos) {
    return atribuidos.fold(0, (sum, b) => sum + b.pontosAdquiridos);
  }

  // ─── PROGRESSO GLOBAL ─────────────────────────────────────────────────────
  // Percentagem de badges concluídos vs total de badges no catálogo
  double calcularProgressoGlobal(int badgesConcluidos, int totalBadges) {
    if (totalBadges == 0) return 0.0;
    return badgesConcluidos / totalBadges;
  }

  // ─── TENDÊNCIA SEMANAL ────────────────────────────────────────────────────
  // Compara pontos da semana atual com semana anterior
  Map<String, int> calcularTendenciaSemanal(
      List<BadgeAtribuidoModel> atribuidos) {
    final now = DateTime.now();
    final umaSemanaAtras = now.subtract(const Duration(days: 7));
    final duasSemanasAtras = now.subtract(const Duration(days: 14));

    int pontosEssaSemana = 0;
    int pontosSemanaAnterior = 0;

    for (var b in atribuidos) {
      if (b.dataAtribuicao.isAfter(umaSemanaAtras)) {
        pontosEssaSemana += b.pontosAdquiridos;
      } else if (b.dataAtribuicao.isAfter(duasSemanasAtras) &&
          b.dataAtribuicao.isBefore(umaSemanaAtras)) {
        pontosSemanaAnterior += b.pontosAdquiridos;
      }
    }

    return {
      'semana_atual': pontosEssaSemana,
      'semana_anterior': pontosSemanaAnterior,
    };
  }

  // ─── CANDIDATURAS PENDENTES ───────────────────────────────────────────────
  int contarCandidaturasPendentes(List<CandidaturaModel> candidaturas) {
    return candidaturas.where((c) => c.isOpen || c.isSubmitted).length;
  }

  // ─── BADGE STREAK (Sequência sem interrupção) ─────────────────────────────
  int calcularStreak(List<BadgeAtribuidoModel> atribuidos) {
    if (atribuidos.isEmpty) return 0;

    final sorted = List<BadgeAtribuidoModel>.from(atribuidos)
      ..sort((a, b) => b.dataAtribuicao.compareTo(a.dataAtribuicao));

    int streak = 1;
    for (int i = 0; i < sorted.length - 1; i++) {
      final diff =
          sorted[i].dataAtribuicao.difference(sorted[i + 1].dataAtribuicao);
      if (diff.inDays <= 30) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }
}
