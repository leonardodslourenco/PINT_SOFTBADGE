import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter/foundation.dart';

class ShareUtil {
  // 1. Apenas gera o texto (assim podemos mostrá-lo no ecrã de preview!)
  static String generateShareText({required String badgeTitle, required String level}) {
    return 'Acabei de conquistar o badge "$badgeTitle" (Nível: $level) na Softinsa! 🚀\n\n'
        'Estou muito focado na minha evolução e este é mais um passo importante na minha jornada técnica.\n\n'
        '#Softinsa #EvoluçãoContinua #Certificação #CarreiraTI';
  }

  // 2. Executa a partilha real (genérica — abre sheet nativo)
  static Future<void> executeShare({required String badgeTitle, required String level}) async {
    final String message = generateShareText(badgeTitle: badgeTitle, level: level);
    
    await SharePlus.instance.share(
      ShareParams(
        text: message,
        subject: 'Nova conquista na Softinsa: $badgeTitle!',
      ),
    );
  }

  // 3. Partilha específica no LinkedIn usando o deep-link de share
  //    O LinkedIn Share API usa um URL público que será pré-visualizado
  static Future<void> shareOnLinkedIn({
    required String badgeTitle,
    required String level,
    String? publicBadgeUrl,
  }) async {
    // URL público do badge (se disponível via candidatura_badge/:id/share)
    final shareUrl = publicBadgeUrl ?? 'https://back.softbadge.pt';
    
    // LinkedIn Share URL
    // Formato: https://www.linkedin.com/sharing/share-offsite/?url=<URL>
    final linkedInUrl = Uri.parse(
      'https://www.linkedin.com/sharing/share-offsite/?url=${Uri.encodeComponent(shareUrl)}'
    );

    try {
      await launchUrl(linkedInUrl, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('Erro ao partilhar no LinkedIn: $e');
      // Fallback para partilha genérica
      await executeShare(badgeTitle: badgeTitle, level: level);
    }
  }

  // 4. Gera URL público de partilha de badge
  static String generatePublicBadgeUrl(String candidaturaId) {
    return 'https://back.softbadge.pt/candidatura_badge/public/$candidaturaId';
  }
}
