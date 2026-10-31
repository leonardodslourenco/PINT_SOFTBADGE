import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:projeto_pratico/config/api_config.dart';

class LocaleNotifier extends StateNotifier<Locale> {
  LocaleNotifier() : super(const Locale('pt')) {
    _loadSavedLocale();
  }

  Future<void> _loadSavedLocale() async {
    final prefs = await SharedPreferences.getInstance();
    final savedLang = prefs.getString('language_code');
    if (savedLang != null) {
      state = Locale(savedLang);
      ApiConfig.currentLanguage = savedLang;
    } else {
      ApiConfig.currentLanguage = 'pt';
    }
  }

  Future<void> setLocale(String languageCode) async {
    state = Locale(languageCode);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language_code', languageCode);
    ApiConfig.currentLanguage = languageCode;
  }
}

final localeProvider = StateNotifierProvider<LocaleNotifier, Locale>((ref) {
  return LocaleNotifier();
});
