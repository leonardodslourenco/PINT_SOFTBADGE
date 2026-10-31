import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/utils/share_util.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class BadgeSharingViewScreen extends ConsumerWidget {
  final String badgeTitle;
  final String level;

  const BadgeSharingViewScreen({
    super.key,
    required this.badgeTitle,
    required this.level,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Vamos buscar o texto gerado para mostrar no ecrã
    final postText = ShareUtil.generateShareText(badgeTitle: badgeTitle, level: level);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(AppLocalizations.of(context)!.previewShare, style: const TextStyle(fontFamily: 'Arimo')),
        backgroundColor: Colors.white,
        centerTitle: true,
        surfaceTintColor: Colors.transparent,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              AppLocalizations.of(context)!.howYourPostWillLook,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, fontFamily: 'Arimo'),
            ),
            const SizedBox(height: 16),
            
            // O CARTÃO QUE SIMULA O POST DO LINKEDIN
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE1E8F0), width: 1.5),
                boxShadow: const [BoxShadow(color: Color(0x0A000000), blurRadius: 10, offset: Offset(0, 4))],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Cabeçalho do Post (Avatar e Nome)
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: const Color(0xFFEFF6FF),
                        child: Icon(Icons.person_outline_rounded, color: const Color(0xFF155DFC).withValues(alpha: 0.8)),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(AppLocalizations.of(context)!.yourName, style: const TextStyle(color: Color(0xFF0E162B), fontSize: 15, fontFamily: 'Arimo', fontWeight: FontWeight.bold)),
                            Text(AppLocalizations.of(context)!.softinsaTalent, style: const TextStyle(color: Color(0xFF61738D), fontSize: 13, fontFamily: 'Arimo')),
                          ],
                        ),
                      ),
                      const Icon(Icons.more_horiz_rounded, color: Color(0xFF61738D)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  // Texto do Post
                  Text(
                    postText,
                    style: const TextStyle(color: Color(0xFF314157), fontSize: 14, fontFamily: 'Arimo', height: 1.5),
                  ),
                  const SizedBox(height: 20),
                  
                  // A Imagem/Badge Anexada
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 30),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                      ),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 80, height: 80,
                          alignment: Alignment.center,
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Text('🏆', style: TextStyle(fontSize: 40)),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          badgeTitle,
                          style: const TextStyle(color: Colors.white, fontSize: 20, fontFamily: 'Arimo', fontWeight: FontWeight.bold),
                        ),
                        const SizedBox(height: 8),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: Colors.white.withValues(alpha: 0.2),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Text(
                            'Nível: $level',
                            style: const TextStyle(color: Colors.white, fontSize: 13, fontFamily: 'Arimo', fontWeight: FontWeight.w600),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      
      // BOTÕES FIXOS NO FUNDO PARA PARTILHAR
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Botão LinkedIn
              SizedBox(
                height: 50,
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    await ShareUtil.shareOnLinkedIn(
                      badgeTitle: badgeTitle,
                      level: level,
                    );
                  },
                  icon: const Icon(Icons.share, size: 20),
                  label: Text(AppLocalizations.of(context)!.shareOnLinkedIn, style: const TextStyle(fontSize: 16, fontFamily: 'Arimo', fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0A66C2), // LinkedIn Brand Color
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
              const SizedBox(height: 10),
              // Botão genérico
              SizedBox(
                height: 50,
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () async {
                    await ShareUtil.executeShare(badgeTitle: badgeTitle, level: level);
                  },
                  icon: const Icon(Icons.share_outlined, size: 20),
                  label: Text(AppLocalizations.of(context)!.shareNow, style: const TextStyle(fontSize: 16, fontFamily: 'Arimo', fontWeight: FontWeight.bold)),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF155DFC),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}