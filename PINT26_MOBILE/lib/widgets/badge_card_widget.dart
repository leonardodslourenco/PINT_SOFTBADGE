import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/badge_model.dart';
import '../screens/catalog/evidence_upload_screen.dart';
import '../screens/catalog/badge_details_screen.dart';
import '../screens/evidence/candidatura_details_screen.dart';
import 'badge_logo_widget.dart';

class BadgeCardWidget extends StatelessWidget {
  final BadgeModel badge;

  const BadgeCardWidget({super.key, required this.badge});

  @override
  Widget build(BuildContext context) {
    final totalReqs = badge.requirements.length;
    final completedReqs = badge.completedRequirementsCount;
    final isCompleted = badge.status == 'concluido' || (totalReqs > 0 && completedReqs == totalReqs);
    
    String fallbackEmoji = "⭐";
    if (badge.title.toLowerCase().contains('react')) {
      fallbackEmoji = "⚛️";
    } else if (badge.title.toLowerCase().contains('node')) {
      fallbackEmoji = "🟢";
    } else if (badge.title.toLowerCase().contains('typescript')) {
      fallbackEmoji = "🟦";
    } else if (badge.title.toLowerCase().contains('javascript')) {
      fallbackEmoji = "🟨";
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F1722).withValues(alpha: 0.05),
            blurRadius: 12,
            spreadRadius: -2,
            offset: const Offset(0, 3),
          ),
          BoxShadow(
            color: const Color(0xFF0F1722).withValues(alpha: 0.03),
            blurRadius: 3,
            offset: const Offset(0, 1),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // TOPO: Chip Nível e Status
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(6), // tag-style
                ),
                child: Text(
                  badge.level.isNotEmpty ? badge.level : 'Sem Nível',
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF475569),
                    letterSpacing: -0.1,
                  ),
                ),
              ),
              if (isCompleted)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD1FAE5),
                    borderRadius: BorderRadius.circular(20), // Pill shape
                  ),
                  child: Text(
                    'Concluído',
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                      color: const Color(0xFF10B981),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 12),
          
          // MEIO: Ícone, Título, Área
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 52,
                height: 52,
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Center(
                  child: BadgeLogoWidget(
                    logo: badge.logo,
                    size: 34,
                    fallbackEmoji: fallbackEmoji,
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      badge.title,
                      style: GoogleFonts.outfit(
                        color: const Color(0xFF0F172B),
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      badge.area,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF64748B),
                        fontSize: 11,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          
          // DESCRIÇÃO
          Text(
            badge.description,
            style: GoogleFonts.inter(
              color: const Color(0xFF475569),
              fontSize: 13,
              height: 1.4,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          
          const SizedBox(height: 16),
          const Divider(color: Color(0xFFE2E8F0), height: 1),
          const SizedBox(height: 12),
          
          // BOTÕES DE AÇÃO
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => BadgeDetailsScreen(badgeId: badge.id),
                    ),
                  );
                },
                style: TextButton.styleFrom(
                  backgroundColor: Colors.white, // Fundo branco
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                    side: const BorderSide(color: Color(0xFFE2E8F0)), // Borda subtil (secundário)
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  minimumSize: const Size(0, 36),
                ),
                child: Text(
                  'Ver',
                  style: GoogleFonts.inter(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF475569), // Cinzento escuro
                  ),
                ),
              ),
              const SizedBox(width: 8),
              Container(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF155DFC), Color(0xFF369FFF)], // Gradiente primário
                    begin: Alignment.centerLeft,
                    end: Alignment.centerRight,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: ElevatedButton(
                  onPressed: () {
                    final bool isSubmitted = badge.idEstadoCandidatura != null && badge.idEstadoCandidatura! > 1;
                    if (isSubmitted && badge.idCandidatura != null) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => CandidaturaDetailsScreen(idCandidatura: badge.idCandidatura!),
                        ),
                      );
                    } else {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => EvidenceUploadScreen(badge: badge),
                        ),
                      );
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent, // Transparente para ver o gradiente
                    shadowColor: Colors.transparent, // Remover sombra extra
                    elevation: 0,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    minimumSize: const Size(0, 36),
                  ),
                  child: Text(
                    (badge.idEstadoCandidatura != null && badge.idEstadoCandidatura! > 1) 
                        ? 'Ver Candidatura' 
                        : 'Candidatar-se',
                    style: GoogleFonts.inter(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}