import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class AppColors {
  static const primaryBlue = Color(0xFF155DFC);
  static const secondaryBlue = Color(0xFF369FFF);
  static const background = Colors.white;
  static const inputBackground = Color(0xFFF3F3F5);
  static const textGray = Color(0xFF6A7282);
  static const borderGray = Color(0xFFE5E7EB);
}

class ChangePasswordScreen extends ConsumerStatefulWidget {
  const ChangePasswordScreen({super.key});

  @override
  ConsumerState<ChangePasswordScreen> createState() => _ChangePasswordScreenState();
}

class _ChangePasswordScreenState extends ConsumerState<ChangePasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    final args = ModalRoute.of(context)!.settings.arguments;
    String currentPassword = '';
    String? userEmail;

    if (args is Map) {
      currentPassword = args['password'] as String? ?? '';
      userEmail = args['email'] as String?;
    } else if (args is String) {
      currentPassword = args;
    }

    final newPassword = _newPasswordController.text.trim();

    setState(() => _isLoading = true);

    try {
      final success = await ref.read(authProvider.notifier).changePassword(
        currentPassword,
        newPassword,
        email: userEmail,
      );

      if (!mounted) return;

      if (success) {
        final authState = ref.read(authProvider);

        if (authState.user == null) {
          // Utilizador mudou a password a partir de um estado intermédio.
          // Limpa a ação bloqueante e redireciona para o login.
          ref.read(authProvider.notifier).clearBlockedAction();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.passwordChangedLoginAgain),
              backgroundColor: const Color(0xFF10B981),
            ),
          );
          Navigator.pushReplacementNamed(context, '/login');
        } else {
          // Utilizador mudou a password estando autenticado (ex: primeiro login).
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.passwordChangedSuccess),
              backgroundColor: const Color(0xFF10B981),
            ),
          );

          if (authState.user!.rgpdConsent == false) {
            Navigator.pushReplacementNamed(context, '/rgpd_screen');
          } else if (authState.user!.idArea == null) {
            Navigator.pushReplacementNamed(context, '/area_selection');
          } else {
            Navigator.pushReplacementNamed(context, '/main');
          }
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.passwordChangeError),
            backgroundColor: Colors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        String errorMsg = e.toString();
        if (errorMsg.startsWith('Exception: ')) {
          errorMsg = errorMsg.replaceFirst('Exception: ', '');
        }
        
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(errorMsg),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SingleChildScrollView(
        child: Container(
          width: size.width,
          height: size.height,
          padding: const EdgeInsets.symmetric(horizontal: 30.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Ícone de Segurança
                const Icon(Icons.lock_reset,
                    size: 80, color: AppColors.primaryBlue),
                const SizedBox(height: 20),

                // Título
                Text(
                  l10n.newPasswordTitle,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'Arimo',
                    color: Color(0xFF1D1B20),
                  ),
                ),
                const SizedBox(height: 16),

                // Instruções
                Text(
                  l10n.newPasswordSubtitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    color: AppColors.textGray,
                    fontSize: 16,
                    fontFamily: 'Arimo',
                    height: 1.50,
                  ),
                ),

                const SizedBox(height: 20),

                // CAMPO NOVA PASSWORD
                _buildInputLabel(l10n.newPasswordLabel),
                _buildTextField(
                  controller: _newPasswordController,
                  hintText: l10n.min8Chars,
                  isPassword: true,
                  // Validador simples de tamanho
                  validator: (val) {
                    if (val == null || val.isEmpty) {
                      return l10n.requiredField;
                    }
                    if (val.length < 8) {
                      return l10n.passwordMinError;
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // CAMPO CONFIRMAR PASSWORD
                _buildInputLabel(l10n.confirmNewPasswordLabel),
                _buildTextField(
                  controller: _confirmPasswordController,
                  hintText: l10n.repeatNewPassword,
                  isPassword: true,
                  // Validador Cruzado: Compara com o primeiro campo
                  validator: (val) {
                    if (val == null || val.isEmpty) {
                      return l10n.requiredField;
                    }
                    if (val != _newPasswordController.text) {
                      return l10n.passwordsDontMatch;
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 20),

                // BOTÃO CONFIRMAR
                GestureDetector(
                  onTap: _isLoading ? null : _submit,
                  child: Container(
                    width: double.infinity,
                    height: 50,
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: _isLoading 
                          ? [Colors.grey, Colors.grey]
                          : [AppColors.primaryBlue, AppColors.secondaryBlue],
                      ),
                      borderRadius: BorderRadius.circular(14),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 5),
                        ),
                      ],
                    ),
                    child: Center(
                      child: _isLoading
                        ? const CircularProgressIndicator(color: Colors.white)
                        : Text(
                            l10n.confirmChange,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  // WIDGETS AUXILIARES
  Widget _buildInputLabel(String text) {
    return Container(
      alignment: Alignment.centerLeft,
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        text,
        style: const TextStyle(
            fontWeight: FontWeight.w600, color: Color(0xFF303030)),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hintText,
    required bool isPassword,
    required String? Function(String?) validator,
  }) {
    return TextFormField(
      controller: controller,
      obscureText: isPassword,
      decoration: InputDecoration(
        hintText: hintText,
        filled: true,
        fillColor: AppColors.inputBackground,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding:
            const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      validator: validator, // Usa o validador específico passado por parâmetro
    );
  }
}
