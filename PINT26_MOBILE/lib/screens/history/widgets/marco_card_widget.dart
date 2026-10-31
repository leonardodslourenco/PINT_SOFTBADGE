import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/models/marco_model.dart';

class MarcoCardWidget extends StatelessWidget {
  final MarcoModel marco;

  const MarcoCardWidget({super.key, required this.marco});

  @override
  Widget build(BuildContext context) {
    // Definir emoji baseado no título ou tipo
    String emoji = "🏆";
    if (marco.nome.toLowerCase().contains('primeiro') || marco.nome.toLowerCase().contains('passo')) {
      emoji = "🚀";
    } else if (marco.nome.toLowerCase().contains('empreendedor')) {
      emoji = "💡";
    } else if (marco.nome.toLowerCase().contains('pioneiro')) {
      emoji = "⭐";
    } else if (marco.nome.toLowerCase().contains('expert')) {
      emoji = "🎓";
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E8F0)),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF155DFC).withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // ── TOPO: Ícone e Status ──
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Círculo Azul Claro com Ícone
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFF155DFC).withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Text(emoji, style: const TextStyle(fontSize: 24)),
                ),
              ),
              // Chip de Status (Conquistado ou Objetivo)
              if (marco.conquistado)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFD1FAE5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.check, size: 14, color: Color(0xFF10B981)),
                      const SizedBox(width: 4),
                      Text(
                        'Conquistado',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF10B981),
                        ),
                      ),
                    ],
                  ),
                )
              else
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: const Color(0xFFE2E8F0).withValues(alpha: 0.5),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.track_changes, size: 14, color: Color(0xFFEF4444)),
                      const SizedBox(width: 4),
                      Text(
                        'Objetivo: ${marco.quantidadeObjetivo}',
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF475569),
                        ),
                      ),
                    ],
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),

          // ── MEIO: Título, Tipo e Descrição ──
          Text(
            marco.nome,
            style: GoogleFonts.outfit(
              color: const Color(0xFF0F172B),
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 8),
          
          // Chip do Tipo (Área)
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF), // Azul claro
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              marco.tipoNome,
              style: GoogleFonts.inter(
                fontSize: 10,
                fontWeight: FontWeight.bold,
                color: const Color(0xFF155DFC), // Azul Softinsa
              ),
            ),
          ),
          const SizedBox(height: 12),
          
          Text(
            marco.descricao,
            style: GoogleFonts.inter(
              color: const Color(0xFF475569),
              fontSize: 13,
              height: 1.4,
            ),
            maxLines: 3,
            overflow: TextOverflow.ellipsis,
          ),
          
          const SizedBox(height: 16),

          // ── RODAPÉ ──
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Chip Objetivo
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFFF1F5F9), // Fundo cinza muito claro para contrastar com branco
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: RichText(
                  text: TextSpan(
                    style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF0F172B)),
                    children: [
                      const TextSpan(text: 'Objetivo: ', style: TextStyle(fontWeight: FontWeight.bold)),
                      TextSpan(text: '${marco.quantidadeObjetivo} conquista${marco.quantidadeObjetivo == 1 ? '' : 's'}'),
                    ],
                  ),
                ),
              ),
              
              // Info genérica "Marco atribuído a..."
              Flexible(
                child: Text(
                  'Marco atribuído a um Consultor',
                  style: GoogleFonts.inter(
                    color: const Color(0xFF64748B),
                    fontSize: 10,
                    fontStyle: FontStyle.italic,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  textAlign: TextAlign.right,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
