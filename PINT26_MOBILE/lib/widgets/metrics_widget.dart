import 'package:flutter/material.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class MetricsWidget extends StatelessWidget {
  final double overallProgress;
  final int points;

  const MetricsWidget({
    super.key,
    required double progress,
    int? points,
  })  : overallProgress = progress,
        points = points ?? 0;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        // Requisito: Identidade visual Softinsa com gradiente azul
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(context),
            const SizedBox(height: 30),
            _buildGlassCard(context),
          ],
        ),
      ),
    );
  }

  // Cabeçalho com saudação e ícone de notificação
  Widget _buildHeader(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(AppLocalizations.of(context)!.goodMorning,
                style: const TextStyle(
                    fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white)),
            Text(AppLocalizations.of(context)!.technicalJourney,
                style: const TextStyle(fontSize: 16, color: Colors.white70)),
          ],
        ),
        const Icon(Icons.notifications_outlined, color: Colors.white, size: 28),
      ],
    );
  }

  // O "Glass Card" central do teu protótipo SVG
  Widget _buildGlassCard(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.2), // Efeito de vidro
        borderRadius: BorderRadius.circular(25),
        border: Border.all(color: Colors.white.withValues(alpha: 0.3)),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(AppLocalizations.of(context)!.weekProgress,
                  style: const TextStyle(
                      fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
              Text("${(overallProgress * 100).toInt()}%",
                  style: const TextStyle(color: Colors.white)),
            ],
          ),
          const SizedBox(height: 20),
          // Gráfico de Barras Simplificado
          SizedBox(
            height: 100,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                _buildBar(40), _buildBar(60), _buildBar(45),
                _buildBar(70), _buildBar(85), _buildBar(50),
                _buildBar(95, isLast: true), // A última barra branca do teu SVG
              ],
            ),
          ),
          const SizedBox(height: 20),
          // Indicadores de Pontos e Nível
          _buildStatRow(Icons.stars, "Pontos Acumulados", "$points pts"),
          const Divider(color: Colors.white24),
          _buildStatRow(Icons.trending_up, "Nível Atual", "Júnior (A3)"),
        ],
      ),
    );
  }

  Widget _buildBar(double height, {bool isLast = false}) {
    return Container(
      width: 12,
      height: height,
      decoration: BoxDecoration(
        color: isLast ? Colors.white : Colors.white.withValues(alpha: 0.4),
        borderRadius: BorderRadius.circular(10),
      ),
    );
  }

  Widget _buildStatRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8.0),
      child: Row(
        children: [
          Icon(icon, color: Colors.white, size: 20),
          const SizedBox(width: 10),
          Text(label, style: const TextStyle(color: Colors.white70)),
          const Spacer(),
          Text(value,
              style: const TextStyle(
                  color: Colors.white, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }
}
