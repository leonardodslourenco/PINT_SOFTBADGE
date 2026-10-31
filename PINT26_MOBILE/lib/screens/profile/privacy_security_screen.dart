import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class PrivacySecurityScreen extends ConsumerWidget {
  const PrivacySecurityScreen({super.key});

  Widget _buildCardTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
    Color iconColor = const Color(0xFF155DFC),
    Color titleColor = const Color(0xFF0F172A),
    bool showTrailing = false,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 22),
        ),
        title: Text(
          title,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: titleColor,
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4.0),
          child: Text(
            subtitle,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              color: const Color(0xFF64748B),
            ),
          ),
        ),
        trailing: showTrailing ? const Icon(Icons.arrow_forward_ios, size: 16, color: Color(0xFFCBD5E1)) : null,
        onTap: onTap,
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          l10n.privacySecurityTitle,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF0F172A),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(24.0),
        children: [
          Text(
            l10n.accountSecurityTitle,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF64748B),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 16),
          _buildCardTile(
            icon: Icons.lock_reset,
            title: l10n.changePasswordTitle,
            subtitle: l10n.changePasswordSubtitle,
            showTrailing: true,
            onTap: () {
              _mostrarDialogoAlterarPassword(context, ref, l10n);
            },
          ),
          const SizedBox(height: 24),
          Text(
            l10n.gdprComplianceTitle,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF64748B),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 16),
          _buildCardTile(
            icon: Icons.download_rounded,
            title: l10n.downloadMyDataTitle,
            subtitle: l10n.downloadMyDataSubtitle,
            onTap: () {
              // Lógica de exportação de dados
            },
          ),
          _buildCardTile(
            icon: Icons.delete_forever_rounded,
            iconColor: const Color(0xFFEF4444), // Red
            titleColor: const Color(0xFFEF4444),
            title: l10n.deleteAccountTitle,
            subtitle: l10n.deleteAccountSubtitle,
            onTap: () {
              // Diálogo de confirmação para apagar conta no backend
            },
          ),
        ],
      ),
    );
  }
}

void _mostrarDialogoAlterarPassword(BuildContext context, WidgetRef ref, AppLocalizations l10n) {
  final oldPasswordController = TextEditingController();
  final newPasswordController = TextEditingController();

  showDialog(
    context: context,
    builder: (context) {
      return AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: Text(
          l10n.changePasswordTitle,
          style: GoogleFonts.plusJakartaSans(fontWeight: FontWeight.bold),
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: oldPasswordController,
              obscureText: true,
              style: GoogleFonts.plusJakartaSans(fontSize: 15),
              decoration: InputDecoration(
                labelText: l10n.currentPasswordLabel,
                labelStyle: GoogleFonts.plusJakartaSans(color: const Color(0xFF64748B)),
              ),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: newPasswordController,
              obscureText: true,
              style: GoogleFonts.plusJakartaSans(fontSize: 15),
              decoration: InputDecoration(
                labelText: l10n.newPasswordLabel,
                labelStyle: GoogleFonts.plusJakartaSans(color: const Color(0xFF64748B)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(
              l10n.cancelButton,
              style: GoogleFonts.plusJakartaSans(color: const Color(0xFF64748B)),
            ),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF155DFC),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
            ),
            onPressed: () async {
              final oldPass = oldPasswordController.text;
              final newPass = newPasswordController.text;

              Navigator.of(context).pop(); // Fecha o diálogo

              try {
                await ref.read(authProvider.notifier).changePassword(oldPass, newPass);
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(l10n.passwordChangedSuccess)),
                );
              } catch (e) {
                if (!context.mounted) return;
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text(l10n.passwordChangeErrorWithArg(e.toString()))),
                );
              }
            },
            child: Text(
              l10n.confirmButton,
              style: GoogleFonts.plusJakartaSans(color: Colors.white),
            ),
          ),
        ],
      );
    },
  );
}
