import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../models/timeline_model.dart';

class TimelineCardWidget extends StatelessWidget {
  final TimelineEvent event;
  final bool isLast;

  const TimelineCardWidget({
    super.key,
    required this.event,
    required this.isLast,
  });

  @override
  Widget build(BuildContext context) {
    // Cores Oficiais da Plataforma Softinsa
    const colorPrimary = Color(0xFF155DFC);
    const colorSecondary = Color(0xFF369FFF);

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Indicador da Timeline (Bolinha e Gradiente)
          Column(
            children: [
              Container(
                width: 20,
                height: 20,
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [colorPrimary, colorSecondary],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                  border: Border.all(color: Colors.white, width: 4),
                  boxShadow: [
                    BoxShadow(
                      color: colorPrimary.withValues(alpha: 0.3),
                      blurRadius: 8,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
              ),
              if (!isLast)
                Expanded(
                  child: Container(
                    width: 2,
                    margin: const EdgeInsets.symmetric(vertical: 4),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          colorPrimary,
                          colorSecondary.withValues(alpha: 0.1), // Desvanece suavemente
                        ],
                      ),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(width: 20),
          
          // Cartão de Conteúdo (Clean UI)
          Expanded(
            child: Padding(
              padding: const EdgeInsets.only(bottom: 32),
              child: GestureDetector(
                onTap: () {
                  if (event.isSpecialBadge) {
                    Navigator.pushNamed(context, '/history', arguments: 2);
                  } else {
                    Navigator.pushNamed(context, '/badge_details', arguments: event.badgeId);
                  }
                },
                child: Container(
                  padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: colorPrimary.withValues(alpha: 0.06),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Text(
                            event.title,
                            style: GoogleFonts.outfit(
                              fontWeight: FontWeight.bold,
                              fontSize: 17,
                              color: const Color(0xFF1E293B),
                            ),
                          ),
                        ),
                        Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: colorPrimary.withValues(alpha: 0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Center(
                            child: Text(
                              event.emoji,
                              style: const TextStyle(fontSize: 16),
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      "${event.date.day.toString().padLeft(2, '0')}/${event.date.month.toString().padLeft(2, '0')}/${event.date.year}",
                      style: GoogleFonts.inter(
                        color: colorSecondary,
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      event.description,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF64748B),
                        fontSize: 14,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        ],
      ),
    );
  }
}