import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class ProfileSettingsScreen extends ConsumerStatefulWidget {
  const ProfileSettingsScreen({super.key});

  @override
  ConsumerState<ProfileSettingsScreen> createState() => _ProfileSettingsScreenState();
}

class _ProfileSettingsScreenState extends ConsumerState<ProfileSettingsScreen> {
  late TextEditingController _nameController;
  late TextEditingController _surnameController;
  late TextEditingController _emailController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    _nameController = TextEditingController(text: user?.name ?? '');
    _surnameController = TextEditingController(text: user?.apelido ?? '');
    _emailController = TextEditingController(text: user?.email ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _surnameController.dispose();
    _emailController.dispose();
    super.dispose();
  }

  Widget _buildTextField(String label, TextEditingController controller, {TextInputType type = TextInputType.text}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: const [
          BoxShadow(
            color: Color(0x05000000),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: TextField(
        controller: controller,
        keyboardType: type,
        style: GoogleFonts.plusJakartaSans(
          fontSize: 15,
          color: const Color(0xFF0F172A),
        ),
        decoration: InputDecoration(
          labelText: label,
          labelStyle: GoogleFonts.plusJakartaSans(
            color: const Color(0xFF64748B),
            fontSize: 14,
          ),
          border: InputBorder.none,
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          l10n.profileSettingsTitle,
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
            l10n.personalInformationTitle,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF64748B),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 16),
          _buildTextField(l10n.nameField, _nameController),
          const SizedBox(height: 16),
          _buildTextField(l10n.surnameField, _surnameController),
          const SizedBox(height: 16),
          _buildTextField(l10n.emailField, _emailController, type: TextInputType.emailAddress),
          const SizedBox(height: 32),
          SizedBox(
            height: 54,
            child: ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF155DFC),
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              onPressed: _isSaving
                  ? null
                  : () async {
                      setState(() => _isSaving = true);
                      final messenger = ScaffoldMessenger.of(context);
                      final navigator = Navigator.of(context);

                      final sucesso = await ref.read(authProvider.notifier).updateProfile(
                        _nameController.text,
                        _surnameController.text,
                        _emailController.text,
                      );

                      if (!mounted) return;
                      setState(() => _isSaving = false);

                      if (sucesso) {
                        messenger.showSnackBar(
                          SnackBar(content: Text(l10n.profileUpdatedSuccess)),
                        );
                        navigator.pop();
                      } else {
                        messenger.showSnackBar(
                          SnackBar(content: Text(l10n.profileUpdateError)),
                        );
                      }
                    },
              child: _isSaving
                  ? const SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                    )
                  : Text(
                      l10n.saveChangesButton,
                      style: GoogleFonts.plusJakartaSans(
                        color: Colors.white,
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }
}