import 'package:flutter/material.dart';
import 'package:projeto_pratico/models/badge_model.dart';
import 'package:projeto_pratico/widgets/evidence_upload_form.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class EvidenceUploadScreen extends StatelessWidget {
  final BadgeModel badge;

  const EvidenceUploadScreen({super.key, required this.badge});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
          ),
        ),
        child: SafeArea(
          bottom: false, 
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildAppBar(context, AppLocalizations.of(context)!),
              const SizedBox(height: 16),
              
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 20.0),
                child: _buildRequirementInfoCard(AppLocalizations.of(context)!),
              ),
              const SizedBox(height: 24),
              
              // O formulário estica até ao fundo do ecrã
              Expanded(
                // Passamos o badge para o form para podermos associar a evidência ao badge correto na BD!
                child: EvidenceUploadForm(badge: badge),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context, AppLocalizations l10n) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8.0, vertical: 8.0),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 22),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 8),
          Text(
            l10n.badgeApplicationTitle,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 20,
              fontFamily: 'Inter',
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequirementInfoCard(AppLocalizations l10n) {
    // Extração dinâmica do nível
    final titleParts = badge.title.split(' ');
    final level = titleParts.length > 1 ? titleParts.last : l10n.singleLevel;
    // Letra inicial para o ícone quadrado
    final initial = badge.title.isNotEmpty ? badge.title.substring(0, 1).toUpperCase() : 'B';

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.20),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: Colors.white.withValues(alpha: 0.30), width: 1.5),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.30),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Text(initial, style: const TextStyle(color: Colors.white, fontSize: 18, fontFamily: 'Inter', fontWeight: FontWeight.w700)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(badge.title, style: const TextStyle(color: Colors.white, fontSize: 16, fontFamily: 'Inter', fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                Text(badge.description, style: TextStyle(color: Colors.white.withValues(alpha: 0.80), fontSize: 12, fontFamily: 'Inter', height: 1.4)),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    _buildTag(badge.area),
                    _buildTag(level),
                    _buildTag('${badge.points} pts'),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTag(String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.20),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(text, style: const TextStyle(color: Colors.white, fontSize: 11, fontFamily: 'Inter', fontWeight: FontWeight.w500)),
    );
  }
}