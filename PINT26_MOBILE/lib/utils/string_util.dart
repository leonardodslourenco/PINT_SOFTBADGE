
String normalizeText(String text) {
  // Passa logo tudo para minúsculas
  String normalized = text.toLowerCase();
  
  // Substitui as letras acentuadas comuns em Português
  normalized = normalized.replaceAll(RegExp(r'[áàâãä]'), 'a');
  normalized = normalized.replaceAll(RegExp(r'[éèêë]'), 'e');
  normalized = normalized.replaceAll(RegExp(r'[íìîï]'), 'i');
  normalized = normalized.replaceAll(RegExp(r'[óòôõö]'), 'o');
  normalized = normalized.replaceAll(RegExp(r'[úùûü]'), 'u');
  normalized = normalized.replaceAll(RegExp(r'[ç]'), 'c');
  
  return normalized;
}
