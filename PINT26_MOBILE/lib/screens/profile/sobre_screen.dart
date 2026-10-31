import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class SobreScreen extends StatelessWidget {
  const SobreScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: CustomScrollView(
        physics: const BouncingScrollPhysics(),
        slivers: [
          // App Bar com gradiente
          SliverAppBar(
            expandedHeight: 220,
            pinned: true,
            backgroundColor: const Color(0xFF155DFC),
            leading: IconButton(
              icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 20),
              onPressed: () => Navigator.pop(context),
            ),
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
                  ),
                ),
                child: SafeArea(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(height: 32),
                      Container(
                        width: 80,
                        height: 80,
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.15),
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: Colors.white.withOpacity(0.3), width: 1.5),
                        ),
                        child: const Icon(Icons.workspace_premium_rounded, color: Colors.white, size: 44),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Softinsa Badges',
                        style: GoogleFonts.plusJakartaSans(
                          color: Colors.white,
                          fontSize: 22,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        l10n.aboutSubtitle,
                        style: GoogleFonts.plusJakartaSans(
                          color: const Color(0xFFDFE7FF),
                          fontSize: 14,
                          fontWeight: FontWeight.w400,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          SliverPadding(
            padding: const EdgeInsets.all(24),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                _buildSectionTitle(l10n.aboutAppTitle),
                const SizedBox(height: 12),
                _buildInfoCard(
                  child: Padding(
                    padding: const EdgeInsets.all(20),
                    child: Text(
                      l10n.aboutAppDescription,
                      style: GoogleFonts.plusJakartaSans(
                        color: const Color(0xFF64748B),
                        fontSize: 14,
                        height: 1.6,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                _buildSectionTitle(l10n.technicalInfoTitle),
                const SizedBox(height: 12),
                _buildInfoCard(
                  child: Column(
                    children: [
                      _buildInfoRow(icon: Icons.tag_rounded, label: l10n.versionLabel, value: '1.0.0', showDivider: true),
                      _buildInfoRow(icon: Icons.build_circle_outlined, label: l10n.buildLabel, value: '2026.08', showDivider: true),
                      _buildInfoRow(icon: Icons.phone_android_rounded, label: l10n.platformLabel, value: 'Android / iOS', showDivider: true),
                      _buildInfoRow(icon: Icons.code_rounded, label: l10n.frameworkLabel, value: 'Flutter', showDivider: false),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                _buildSectionTitle(l10n.developedByTitle),
                const SizedBox(height: 12),
                _buildInfoCard(
                  child: Column(
                    children: [
                      _buildTeamRow(initials: 'SI', name: 'Softinsa PINT 2026', role: l10n.developmentTeam, showDivider: false),
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                _buildSectionTitle(l10n.legalTitle),
                const SizedBox(height: 12),
                _buildInfoCard(
                  child: Column(
                    children: [
                      _buildLegalRow(icon: Icons.description_outlined, label: l10n.termsOfService, showDivider: true, onTap: () {}),
                      _buildLegalRow(icon: Icons.privacy_tip_outlined, label: l10n.privacyPolicy, showDivider: true, onTap: () {}),
                      _buildLegalRow(icon: Icons.gavel_rounded, label: l10n.softwareLicenses, showDivider: false, onTap: () {}),
                    ],
                  ),
                ),
                const SizedBox(height: 40),

                Center(
                  child: Text(
                    l10n.copyrightNotice,
                    textAlign: TextAlign.center,
                    style: GoogleFonts.plusJakartaSans(
                      color: const Color(0xFF94A3B8),
                      fontSize: 12,
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ]),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.plusJakartaSans(
        color: const Color(0xFF64748B),
        fontSize: 14,
        fontWeight: FontWeight.bold,
        letterSpacing: 0.5,
      ),
    );
  }

  Widget _buildInfoCard({required Widget child}) {
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x05000000),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: child,
    );
  }

  Widget _buildInfoRow({required IconData icon, required String label, required String value, required bool showDivider}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        border: showDivider ? const Border(bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1)) : null,
      ),
      child: Row(
        children: [
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: const Color(0xFF155DFC), size: 18),
          ),
          const SizedBox(width: 14),
          Text(
            label,
            style: GoogleFonts.plusJakartaSans(color: const Color(0xFF64748B), fontSize: 14),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.plusJakartaSans(
              color: const Color(0xFF0F172A),
              fontSize: 14,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTeamRow({required String initials, required String name, required String role, required bool showDivider}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        border: showDivider ? const Border(bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1)) : null,
      ),
      child: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF155DFC), Color(0xFF369FFF)]),
              borderRadius: BorderRadius.circular(12),
            ),
            alignment: Alignment.center,
            child: Text(
              initials,
              style: GoogleFonts.plusJakartaSans(
                color: Colors.white,
                fontWeight: FontWeight.w700,
                fontSize: 14,
              ),
            ),
          ),
          const SizedBox(width: 14),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                name,
                style: GoogleFonts.plusJakartaSans(
                  color: const Color(0xFF0F172A),
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                role,
                style: GoogleFonts.plusJakartaSans(
                  color: const Color(0xFF64748B),
                  fontSize: 13,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegalRow({required IconData icon, required String label, required bool showDivider, required VoidCallback onTap}) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
          decoration: BoxDecoration(
            border: showDivider ? const Border(bottom: BorderSide(color: Color(0xFFF1F5F9), width: 1)) : null,
          ),
          child: Row(
            children: [
              Container(
                width: 36,
                height: 36,
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: const Color(0xFFE2E8F0)),
                ),
                child: Icon(icon, color: const Color(0xFF64748B), size: 18),
              ),
              const SizedBox(width: 14),
              Expanded(
                child: Text(
                  label,
                  style: GoogleFonts.plusJakartaSans(
                    color: const Color(0xFF0F172A),
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFFCBD5E1), size: 14),
            ],
          ),
        ),
      ),
    );
  }
}
