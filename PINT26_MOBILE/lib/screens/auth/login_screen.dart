import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_svg/flutter_svg.dart';
// Certifica-te de que o caminho do import coincide com a pasta (reparámos que tinhas 'riverpood' com dois 'o', garante que bate certo com o teu projeto)
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/screens/auth/email_verification_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class AppColors {
  static const primaryBlue = Color(0xFF155DFC);
  static const secondaryBlue = Color(0xFF369FFF);
  static const background = Colors.white;
  static const inputBackground = Color(0xFFF3F3F5);
  static const textGray = Color(0xFF6A7282);
  static const borderGray = Color(0xFFE5E7EB);
}

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _rememberMe = false;
  bool _obscurePassword = true;

  @override
  void initState() {
    super.initState();
    _loadSavedEmail();
  }

  Future<void> _loadSavedEmail() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final savedEmail = prefs.getString('saved_login_email');
      if (savedEmail != null && savedEmail.isNotEmpty) {
        setState(() {
          _emailController.text = savedEmail;
          _rememberMe = true;
        });
      }
    } catch (e) {
      debugPrint("Erro ao carregar email memorizado: $e");
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    // 1. Extrair o l10n ANTES de qualquer await
    final l10n = AppLocalizations.of(context)!;
    final authNotifier = ref.read(authProvider.notifier);

    authNotifier.clearSessionExpiredMessage();

    // Memorizar ou esquecer o email com base no checkbox "Lembrar-me"
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_rememberMe) {
        await prefs.setString(
            'saved_login_email', _emailController.text.trim());
      } else {
        await prefs.remove('saved_login_email');
      }
    } catch (e) {
      debugPrint("Erro ao guardar email memorizado: $e");
    }

    try {
      final success = await authNotifier.signIn(_emailController.text.trim(),
          _passwordController.text.trim(), _rememberMe);

      // 2. O teu check mounted já aqui estava e está correto!
      if (!mounted) return;

      if (success) {
        // Login completo — verificar se precisa alterar password
        if (authNotifier.currentUser?.isFirstLogin == true) {
          Navigator.pushReplacementNamed(
            context,
            '/change_password',
            arguments: {
              'password': _passwordController.text.trim(),
              'email': _emailController.text.trim(),
            },
          );
        } else if (authNotifier.currentUser?.rgpdConsent == false) {
          Navigator.pushReplacementNamed(context, '/rgpd_screen');
        } else if (authNotifier.currentUser?.idArea == null) {
          // Primeiro login sem área selecionada
          Navigator.pushReplacementNamed(context, '/area_selection');
        } else {
          Navigator.pushReplacementNamed(context, '/main');
        }
      } else {
        // Login incompleto — verificar ação bloqueante
        final authState = ref.read(authProvider);
        if (authState.hasBlockedAction) {
          switch (authState.blockedAction) {
            case 'EMAIL_VERIFICATION_REQUIRED':
              final token =
                  authState.actionData?['email_verification_token'] ?? '';
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => EmailVerificationScreen(
                    emailVerificationToken: token,
                    email: _emailController.text.trim(),
                  ),
                ),
              );
              break;
            case 'FORCE_PASSWORD_CHANGE':
            case 'RECOVERY_CANCEL_CONFIRMATION_REQUIRED':
            case 'RECOVERY_TEMP_EXPIRED':
              Navigator.pushReplacementNamed(
                context,
                '/change_password',
                arguments: {
                  'password': _passwordController.text.trim(),
                  'email': _emailController.text.trim(),
                },
              );
              break;
            default:
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content:
                      Text(l10n.actionRequired(authState.blockedAction ?? '')),
                  backgroundColor: Colors.orange,
                ),
              );
          }
        }
      }
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(error.toString().replaceAll("Exception: ", "")),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Escuta as alterações de estado do teu AuthState
    final authState = ref.watch(authProvider);
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 30.0),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 30),

                  // LOGO / TÍTULO
                  SvgPicture.asset(
                    'assets/images/logo-softinsa.svg',
                    height: 120,
                    semanticsLabel: 'Logo Softinsa',
                  ),

                  // Texto Boas-vindas Softinsa
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: Text(
                      l10n.loginWelcome,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 16,
                        color: AppColors.textGray,
                        fontFamily: 'Arimo',
                        height: 1.50,
                      ),
                    ),
                  ),

                  // Alerta de Sessão Expirada
                  if (authState.sessionExpiredMessage != null) ...[
                    const SizedBox(height: 20),
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 14, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFFBEB),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: const Color(0xFFFDE68A), width: 1.2),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.warning_amber_rounded,
                              color: Color(0xFFD97706), size: 22),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              authState.sessionExpiredMessage!,
                              style: const TextStyle(
                                color: Color(0xFF92400E),
                                fontSize: 13,
                                fontWeight: FontWeight.w600,
                                fontFamily: 'Arimo',
                              ),
                            ),
                          ),
                          IconButton(
                            padding: EdgeInsets.zero,
                            constraints: const BoxConstraints(),
                            icon: const Icon(Icons.close,
                                color: Color(0xFFD97706), size: 18),
                            onPressed: () => ref
                                .read(authProvider.notifier)
                                .clearSessionExpiredMessage(),
                          ),
                        ],
                      ),
                    ),
                  ],

                  const SizedBox(height: 30),

                  // Campo Email
                  _buildInputLabel(l10n.emailAddress),
                  _buildTextField(
                    controller: _emailController,
                    hintText: l10n.enterEmail,
                    isPassword: false,
                    l10n: l10n,
                  ),
                  const SizedBox(height: 16),

                  // Campo Password
                  _buildInputLabel(l10n.passwordLabel),
                  _buildTextField(
                    controller: _passwordController,
                    hintText: l10n.enterPassword,
                    isPassword: true,
                    l10n: l10n,
                  ),

                  const SizedBox(height: 20),

                  // Botão login
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    child: GestureDetector(
                      // INTERCALAÇÃO DO ONTAP EXPLICADA:
                      // Se authState.isLoading for true, o onTap recebe 'null' (o botão fica desativado)
                      // Se for false, o botão chama a função '_submit' normalmente.
                      onTap: authState.isLoading ? null : _submit,
                      child: Container(
                        width: 300,
                        height: 48,
                        decoration: ShapeDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topCenter,
                            end: Alignment.bottomCenter,
                            colors: [
                              AppColors.primaryBlue,
                              AppColors.secondaryBlue
                            ],
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                          shadows: const [
                            BoxShadow(
                              color: Color(0x19000000),
                              blurRadius: 15,
                              offset: Offset(0, 10),
                              spreadRadius: -3,
                            )
                          ],
                        ),
                        // INTERCALAÇÃO DO CHILD EXPLICADA:
                        // Se estiver a carregar, renderiza o CircularProgressIndicator.
                        // Caso contrário (está em espera), mostra o texto em RichText original.
                        child: authState.isLoading
                            ? const Center(
                                child: CircularProgressIndicator(
                                  color: Colors.white,
                                ),
                              )
                            : Center(
                                child: Text.rich(
                                  TextSpan(
                                    children: [
                                      TextSpan(
                                          text: l10n.loginButtonLog,
                                          style: const TextStyle(
                                              color: AppColors.background,
                                              fontSize: 20,
                                              fontWeight: FontWeight.w400)),
                                      TextSpan(
                                          text: l10n.loginButtonIn,
                                          style: const TextStyle(
                                              color: AppColors.background,
                                              fontSize: 20,
                                              fontWeight: FontWeight.bold)),
                                    ],
                                  ),
                                ),
                              ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 10),

                  // LEMBRAR-ME E ESQUECEU A SENHA
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 10),
                    child: SizedBox(
                      width: 400,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              SizedBox(
                                height: 24,
                                width: 24,
                                child: Checkbox(
                                  value: _rememberMe,
                                  onChanged: (value) =>
                                      setState(() => _rememberMe = value!),
                                ),
                              ),
                              const SizedBox(width: 2),
                              Text(
                                l10n.rememberMe,
                                style: const TextStyle(
                                  color: AppColors.textGray,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                          GestureDetector(
                            onTap: () => Navigator.pushNamed(
                                context, '/forgot-password'),
                            child: Text(
                              l10n.forgotPassword,
                              style: const TextStyle(
                                color: AppColors.primaryBlue,
                                fontWeight: FontWeight.w400,
                                fontSize: 14,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInputLabel(String label) {
    return Container(
      alignment: Alignment.centerLeft,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Text(
        label,
        style: const TextStyle(
            color: Color(0xFF303030), fontSize: 16, fontFamily: 'Arimo'),
      ),
    );
  }

  Widget _buildTextField(
      {required TextEditingController controller,
      required String hintText,
      required bool isPassword,
      required AppLocalizations l10n}) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
      child: TextFormField(
        controller: controller,
        obscureText: isPassword ? _obscurePassword : false,
        decoration: InputDecoration(
          hintText: hintText,
          filled: true,
          fillColor: AppColors.inputBackground,
          contentPadding:
              const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.borderGray),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
            borderSide: const BorderSide(color: AppColors.borderGray),
          ),
          suffixIcon: isPassword
              ? IconButton(
                  icon: Icon(
                    _obscurePassword
                        ? Icons.visibility_off_outlined
                        : Icons.visibility_outlined,
                    color: AppColors.textGray,
                  ),
                  onPressed: () {
                    setState(() {
                      _obscurePassword = !_obscurePassword;
                    });
                  },
                )
              : null,
        ),
        validator: (value) =>
            (value == null || value.isEmpty) ? l10n.requiredField : null,
      ),
    );
  }
}
