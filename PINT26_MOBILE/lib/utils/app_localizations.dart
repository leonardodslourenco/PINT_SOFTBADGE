import 'package:flutter_riverpod/flutter_riverpod.dart';

// 1. Definimos as três línguas suportadas
enum AppLanguage { pt, en, es }

// 2. O nosso Dicionário (A base de dados das nossas traduções)
const Map<AppLanguage, Map<String, String>> _dictionary = {
  AppLanguage.pt: {
    'history_title': 'Badges Conquistados',
    'no_trophies': 'Ainda não tens troféus. Toca a aprender!',
    'certificate': 'Certificado',
    'share': 'Partilhar',
    'level': 'Nível',
    'earned_on': 'Conquistado a',
  },
  AppLanguage.en: {
    'history_title': 'Earned Badges',
    'no_trophies': 'No trophies yet. Keep learning!',
    'certificate': 'Certificate',
    'share': 'Share',
    'level': 'Level',
    'earned_on': 'Earned on',
  },
  AppLanguage.es: {
    'history_title': 'Badges Conquistados',
    'no_trophies': 'Aún no tienes trofeos. ¡Sigue aprendiendo!',
    'certificate': 'Certificado',
    'share': 'Compartir',
    'level': 'Nivel',
    'earned_on': 'Conquistado el',
  },
};

// 3. O Notifier que guarda a língua que o utilizador escolheu
class LanguageNotifier extends StateNotifier<AppLanguage> {
  LanguageNotifier() : super(AppLanguage.pt); // Começa sempre em Português

  // Função para mudar a língua
  void changeLanguage(AppLanguage newLanguage) {
    state = newLanguage;
  }
}

// 4. PROVIDER 1: Para gerir o estado da língua (usado para mudar de PT para EN)
final languageProvider = StateNotifierProvider<LanguageNotifier, AppLanguage>((ref) {
  return LanguageNotifier();
});

// 5. PROVIDER 2 (O Mágico): Fornece apenas as palavras da língua atual aos ecrãs!
final translationProvider = Provider<Map<String, String>>((ref) {
  final currentLang = ref.watch(languageProvider);
  return _dictionary[currentLang]!;
});
