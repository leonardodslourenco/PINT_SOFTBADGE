import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
// Importa os teus notifiers
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';

import 'profile_settings_screen.dart';
import 'notifications_screen.dart';
import 'privacy_security_screen.dart';
import 'sobre_screen.dart';
import 'ajuda_faq_screen.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:projeto_pratico/config/api_config.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

import 'package:projeto_pratico/riverpood/locale_notifier.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    final authState = ref.watch(authProvider);
    final badgeState = ref.watch(badgeProvider);

    final user = authState.user;

    if (user == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    final String safeNome = user.nome.trim();
    String initials = '';
    if (safeNome.isNotEmpty) {
      final nameParts = safeNome.split(RegExp(r'\s+'));
      if (nameParts.length > 1) {
        initials = '${nameParts.first[0]}${nameParts.last[0]}'.toUpperCase();
      } else {
        initials = safeNome.length > 1
            ? safeNome.substring(0, 2).toUpperCase()
            : safeNome.toUpperCase();
      }
    }

    final completedBadgesCount = badgeState.meusBadgesAtribuidos.length;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          Container(
            height: MediaQuery.of(context).padding.top + 60,
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              boxShadow: [
                BoxShadow(
                  color: Color(0x33155DFC),
                  blurRadius: 12,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(height: MediaQuery.of(context).padding.top + 16),
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        l10n.myProfile,
                        style: const TextStyle(
                          fontFamily: 'Inter',
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: Colors.white,
                          letterSpacing: -0.5,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
              ],
            ),
          ),
          Expanded(
            child: SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  _buildStatsCard(
                    nome: user.nome,
                    email: user.email,
                    avatar: user.avatar,
                    iniciais: initials,
                    pontos: badgeState.totalPoints,
                    badgesConcluidos: completedBadgesCount,
                    l10n: l10n,
                  ),
                  const SizedBox(height: 32),

                  // BOTÃO: VER PERFIL PÚBLICO
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        final String uuidConsultor = user.id;
                        final url = Uri.parse(
                            'https://softbadge.pt/user/$uuidConsultor');
                        await launchUrl(url,
                            mode: LaunchMode.externalApplication);
                      },
                      icon: const Icon(Icons.remove_red_eye_rounded,
                          size: 18, color: Colors.white),
                      label: Text(
                        l10n.viewPublicProfile,
                        style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.w600,
                            color: Colors.white),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF155DFC),
                        shadowColor: const Color(0xFF155DFC),
                        elevation: 4,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 32),

                  // 1. SECÇÃO DA CONTA
                  _buildAccountSection(context),
                  const SizedBox(height: 24),
                  _buildPreferencesSection(context, ref),
                  const SizedBox(height: 24),
                  _buildSupportSection(context),
                  const SizedBox(height: 40),

                  // 4. BOTÃO DE LOGOUT
                  _buildLogoutButton(context, ref),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // Removido o _buildProfileHeader pois passamos a usar o AppBar padrão.

  Widget _buildStatsCard({
    required String nome,
    required String email,
    required String? avatar,
    required String iniciais,
    required int pontos,
    required int badgesConcluidos,
    required AppLocalizations l10n,
  }) {
    final avatarUrl = ApiConfig.getAvatarUrl(avatar);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: ShapeDecoration(
        gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF155DFC), Color(0xFF369FFF)]),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        shadows: const [
          BoxShadow(
              color: Color(0x19000000),
              blurRadius: 6,
              offset: Offset(0, 4),
              spreadRadius: -4),
          BoxShadow(
              color: Color(0x19000000),
              blurRadius: 15,
              offset: Offset(0, 10),
              spreadRadius: -3),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.20),
                  shape: BoxShape.circle,
                  border:
                      Border.all(color: const Color(0x4CFFFEFE), width: 1.5),
                ),
                alignment: Alignment.center,
                child: ClipOval(
                  child: avatarUrl.isNotEmpty
                      ? Image.network(
                          avatarUrl,
                          width: 64,
                          height: 64,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) => Text(
                            iniciais,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 24,
                              fontFamily: 'Inter',
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        )
                      : Text(
                          iniciais,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 24,
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(nome,
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.bold),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    const SizedBox(height: 4),
                    Text(email,
                        style: const TextStyle(
                            color: Color(0xFFDFE7FF),
                            fontSize: 14,
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w400),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: const BoxDecoration(
                border: Border(
                    top: BorderSide(color: Color(0x33FFFEFE), width: 1.5))),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _buildStatItem(pontos.toString(), l10n.pointsLabel),
                _buildDivider(),
                _buildStatItem(badgesConcluidos.toString(), l10n.badgesLabel),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String value, String label) {
    return Column(
      children: [
        Text(value,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 24,
                fontFamily: 'Inter',
                fontWeight: FontWeight.bold)),
        const SizedBox(height: 4),
        Text(label,
            style: const TextStyle(
                color: Color(0xFFDFE7FF),
                fontSize: 12,
                fontFamily: 'Inter',
                fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildDivider() => Container(
      width: 1, height: 30, color: Colors.white.withValues(alpha: 0.3));

  // ==========================================
  // SECÇÃO: CONTA
  // ==========================================
  Widget _buildAccountSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Text(AppLocalizations.of(context)!.accountTitle,
              style: const TextStyle(
                  color: Color(0xFF314157),
                  fontSize: 16,
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600)),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          decoration: _buildCardDecoration(),
          child: Column(
            children: [
              _buildSettingsItem(
                  icon: Icons.person_outline_rounded,
                  title: AppLocalizations.of(context)!.profileSettingsTitle,
                  subtitle:
                      AppLocalizations.of(context)!.profileSettingsSubtitle,
                  showDivider: true,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const ProfileSettingsScreen()),
                    );
                  }),
              _buildSettingsItem(
                  icon: Icons.notifications_none_rounded,
                  title: AppLocalizations.of(context)!.notificationsTitle,
                  subtitle: AppLocalizations.of(context)!.notificationsSubtitle,
                  showDivider: true,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const NotificationsScreen()),
                    );
                  }),
              _buildSettingsItem(
                  icon: Icons.shield_outlined,
                  title: AppLocalizations.of(context)!.privacySecurityTitle,
                  subtitle:
                      AppLocalizations.of(context)!.privacySecuritySubtitle,
                  showDivider: false,
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const PrivacySecurityScreen()),
                    );
                  }),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================
  // SECÇÃO: PREFERÊNCIAS (IDIOMA)
  // ==========================================
  Widget _buildPreferencesSection(BuildContext context, WidgetRef ref) {
    final currentLocale = ref.watch(localeProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Text(AppLocalizations.of(context)!.preferencesTitle,
              style: const TextStyle(
                  color: Color(0xFF314157),
                  fontSize: 16,
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600)),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          padding: const EdgeInsets.all(16),
          decoration: _buildCardDecoration(),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Título do Bloco
              Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12)),
                    child: const Icon(Icons.language_rounded,
                        color: Color(0xFF61738D), size: 22),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(AppLocalizations.of(context)!.languageTitle,
                            style: const TextStyle(
                                color: Color(0xFF0E162B),
                                fontSize: 16,
                                fontFamily: 'Inter',
                                fontWeight: FontWeight.w500)),
                        const SizedBox(height: 2),
                        Text(AppLocalizations.of(context)!.languageSubtitle,
                            style: const TextStyle(
                                color: Color(0xFF61738D),
                                fontSize: 13,
                                fontFamily: 'Inter')),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),

              // Opções de Idioma replicadas do teu Figma
              _buildLanguageOption(
                  language: 'Português',
                  isSelected: currentLocale.languageCode == 'pt',
                  onTap: () =>
                      ref.read(localeProvider.notifier).setLocale('pt')),
              const SizedBox(height: 8),
              _buildLanguageOption(
                  language: 'English',
                  isSelected: currentLocale.languageCode == 'en',
                  onTap: () =>
                      ref.read(localeProvider.notifier).setLocale('en')),
              const SizedBox(height: 8),
              _buildLanguageOption(
                  language: 'Español',
                  isSelected: currentLocale.languageCode == 'es',
                  onTap: () =>
                      ref.read(localeProvider.notifier).setLocale('es')),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================
  // SECÇÃO: SUPORTE
  // ==========================================
  Widget _buildSupportSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 8),
          child: Text(AppLocalizations.of(context)!.supportTitle,
              style: const TextStyle(
                  color: Color(0xFF314157),
                  fontSize: 16,
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w600)),
        ),
        const SizedBox(height: 12),
        Container(
          width: double.infinity,
          decoration: _buildCardDecoration(),
          child: Column(
            children: [
              _buildSettingsItem(
                  icon: Icons.help_outline_rounded,
                  title: AppLocalizations.of(context)!.helpFaqTitle,
                  subtitle: AppLocalizations.of(context)!.helpFaqSubtitle,
                  showDivider: true,
                  onTap: () {
                    Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => const AjudaFaqScreen()));
                  }),
              _buildSettingsItem(
                  icon: Icons.info_outline_rounded,
                  title: AppLocalizations.of(context)!.aboutTitle,
                  subtitle: AppLocalizations.of(context)!.aboutSubtitle,
                  showDivider: false,
                  onTap: () {
                    Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => const SobreScreen()));
                  }),
            ],
          ),
        ),
      ],
    );
  }

  // ==========================================
  // MÉTODOS AUXILIARES E REUTILIZÁVEIS
  // ==========================================

  // Decoração padrão para os cartões brancos (Conta, Preferências, Suporte)
  Decoration _buildCardDecoration() {
    return ShapeDecoration(
      color: Colors.white,
      shape: RoundedRectangleBorder(
          side: const BorderSide(width: 1, color: Color(0xFFF1F5F9)),
          borderRadius: BorderRadius.circular(16)),
      shadows: const [
        BoxShadow(
            color: Color(0x05000000), blurRadius: 4, offset: Offset(0, 2)),
      ],
    );
  }

  // Componente para a lista de opções
  Widget _buildSettingsItem(
      {required IconData icon,
      required String title,
      required String subtitle,
      required bool showDivider,
      required VoidCallback onTap}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          decoration: BoxDecoration(
              border: showDivider
                  ? const Border(
                      bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1))
                  : null),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                    color: const Color(0xFFEFF6FF),
                    borderRadius: BorderRadius.circular(12)),
                child: Icon(icon, color: const Color(0xFF256CFC), size: 20),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title,
                        style: const TextStyle(
                            color: Color(0xFF0F172A),
                            fontSize: 14,
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(subtitle,
                        style: const TextStyle(
                            color: Color(0xFF94A3B8),
                            fontSize: 12,
                            fontFamily: 'Inter')),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded,
                  color: Color(0xFFCBD5E1), size: 14),
            ],
          ),
        ),
      ),
    );
  }

  // Componente específico para a escolha do idioma (Figma: fundo azul para selecionado)
  Widget _buildLanguageOption(
      {required String language,
      required bool isSelected,
      required VoidCallback onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: double.infinity,
        height: 48,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        decoration: BoxDecoration(
          gradient: isSelected
              ? const LinearGradient(
                  colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                )
              : null,
          color: isSelected ? null : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(10),
          border: isSelected
              ? null
              : Border.all(color: const Color(0xFFE2E8F0), width: 1),
        ),
        alignment: Alignment.centerLeft,
        child: Text(
          language,
          style: TextStyle(
            color: isSelected ? Colors.white : const Color(0xFF314157),
            fontSize: 15,
            fontFamily: 'Inter',
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
          ),
        ),
      ),
    );
  }

  // ================
  // BOTÃO DE LOGOUT
  // ================
  Widget _buildLogoutButton(BuildContext context, WidgetRef ref) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          height: 59.48, // Altura do teu Figma
          child: ElevatedButton.icon(
            onPressed: () async {
              if (context.mounted) {
                Navigator.pushNamedAndRemoveUntil(
                    context, '/login', (route) => false);
              }
              await ref.read(authProvider.notifier).signOut();
            },
            icon: const Icon(Icons.logout_rounded,
                size: 20, color: Color(0xFFE7000B)),
            label: Text(
              AppLocalizations.of(context)!.logoutButton,
              style: const TextStyle(
                  fontSize: 16,
                  fontFamily: 'Inter',
                  fontWeight: FontWeight.w400,
                  color: Color(0xFFE7000B)),
            ),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white, // Fundo branco
              elevation: 0, // Tirar a sombra padrão do ElevatedButton
              shadowColor: Colors.transparent,
              side: const BorderSide(
                  color: Color(0xFFFFC9C9),
                  width: 1.74), // Contorno rosa claro do Figma
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),

        const SizedBox(height: 24),

        // TEXTO DE RODAPÉ (Versão da Plataforma)
        Center(
          child: Text(
            AppLocalizations.of(context)!.platformVersion,
            textAlign: TextAlign.center,
            style: const TextStyle(
              color: Color(0xFF90A1B9),
              fontSize: 14,
              fontFamily: 'Inter',
              fontWeight: FontWeight.w400,
              height: 1.43,
            ),
          ),
        ),
        const SizedBox(height: 16), // Espaço extra no fundo da página
      ],
    );
  }
}
