import 'dart:math';
import 'package:flutter/material.dart';

/// Segmento do gráfico donut
class DonutSegment {
  final String label;
  final int value;
  final Color color;

  const DonutSegment({
    required this.label,
    required this.value,
    required this.color,
  });
}

/// Gráfico donut reutilizável pintado com CustomPainter.
/// Sem dependências externas.
class DonutChart extends StatelessWidget {
  final List<DonutSegment> segments;
  final String centerText;
  final String? centerSubText;
  final double size;
  final double strokeWidth;

  const DonutChart({
    super.key,
    required this.segments,
    required this.centerText,
    this.centerSubText,
    this.size = 140,
    this.strokeWidth = 18,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: size,
      height: size,
      child: Stack(
        alignment: Alignment.center,
        children: [
          CustomPaint(
            size: Size(size, size),
            painter: _DonutPainter(
              segments: segments,
              strokeWidth: strokeWidth,
            ),
          ),
          // Texto central
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                centerText,
                style: TextStyle(
                  fontSize: size * 0.18,
                  fontWeight: FontWeight.bold,
                  color: const Color(0xFF0F172B),
                  fontFamily: 'Inter',
                  height: 1.1,
                ),
              ),
              if (centerSubText != null)
                Text(
                  centerSubText!,
                  style: TextStyle(
                    fontSize: size * 0.08,
                    color: const Color(0xFF64748B),
                    fontFamily: 'Inter',
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }
}

/// CustomPainter para pintar arcos do donut chart
class _DonutPainter extends CustomPainter {
  final List<DonutSegment> segments;
  final double strokeWidth;

  _DonutPainter({required this.segments, required this.strokeWidth});

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = (min(size.width, size.height) - strokeWidth) / 2;
    final rect = Rect.fromCircle(center: center, radius: radius);

    final total = segments.fold<int>(0, (sum, s) => sum + s.value);

    if (total == 0) {
      // Desenha um anel cinza vazio quando não há dados
      final emptyPaint = Paint()
        ..color = const Color(0xFFE2E8F0)
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;
      canvas.drawCircle(center, radius, emptyPaint);
      return;
    }

    double startAngle = -pi / 2; // Começa no topo
    const gapAngle = 0.04; // Espaço entre segmentos
    final totalGap = gapAngle * segments.where((s) => s.value > 0).length;
    final availableSweep = 2 * pi - totalGap;

    for (final segment in segments) {
      if (segment.value <= 0) continue;

      final sweepAngle = (segment.value / total) * availableSweep;

      final paint = Paint()
        ..color = segment.color
        ..style = PaintingStyle.stroke
        ..strokeWidth = strokeWidth
        ..strokeCap = StrokeCap.round;

      canvas.drawArc(rect, startAngle, sweepAngle, false, paint);
      startAngle += sweepAngle + gapAngle;
    }
  }

  @override
  bool shouldRepaint(covariant _DonutPainter oldDelegate) {
    return oldDelegate.segments != segments;
  }
}

/// Widget de legenda para usar junto ao donut chart
class DonutLegend extends StatelessWidget {
  final List<DonutSegment> segments;

  const DonutLegend({super.key, required this.segments});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: segments.map((s) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 8),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: s.color,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  '${s.label} (${s.value})',
                  style: const TextStyle(
                    fontSize: 12,
                    color: Color(0xFF475569),
                    fontFamily: 'Inter',
                  ),
                ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }
}
