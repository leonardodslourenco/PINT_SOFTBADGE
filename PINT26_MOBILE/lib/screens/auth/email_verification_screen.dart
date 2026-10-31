import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/services/auth_service.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class AppColors {
  static const primaryBlue = Color(0xFF155DFC);
  static const secondaryBlue = Color(0xFF369FFF);
  static const background = Colors.white;
  static const inputBackground = Color(0xFFF3F3F5);
  static const textGray = Color(0xFF6A7282);
  static const borderGray = Color(0xFFE5E7EB);
}

class EmailVerificationScreen extends ConsumerStatefulWidget {
  final String emailVerificationToken;
  final String? email;

  const EmailVerificationScreen({
    super.key,
    required this.emailVerificationToken,
    this.email,
  });

  @override
  ConsumerState<EmailVerificationScreen> createState() =>
      _EmailVerificationScreenState();
}

class _EmailVerificationScreenState
    extends ConsumerState<EmailVerificationScreen> {
  final _codeController = TextEditingController();
  final _authService = AuthService();
  bool _isLoading = false;
  bool _isResending = false;
  int _resendCooldown = 0;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _startResendCooldown();
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  void _startResendCooldown() {
    setState(() => _resendCooldown = 60);
    Future.doWhile(() async {
      await Future.delayed(const Duration(seconds: 1));
      if (!mounted) return false;
      setState(() => _resendCooldown--);
      return _resendCooldown > 0;
    });
  }

  Future<void> _verifyCode(AppLocalizations l10n) async {
    final code = _codeController.text.trim();
    if (code.isEmpty) {
      setState(() => _errorMessage = l10n.insertVerificationCode);
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final result = await _authService.verifyEmailCode(
        widget.emailVerificationToken,
        code,
      );

      if (!mounted) return;

      if (result['success'] == true) {
        // Email verificado com sucesso — voltar ao login para completar
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.emailVerifiedLoginAgain),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
        // Limpar estado de ação bloqueante e voltar ao login
        ref.read(authProvider.notifier).clearBlockedAction();
        Navigator.pushReplacementNamed(context, '/login');
      } else {
        setState(() {
          _errorMessage =
              result['message'] ?? l10n.invalidCode;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _resendCode(AppLocalizations l10n) async {
    if (_resendCooldown > 0 || _isResending) return;

    setState(() {
      _isResending = true;
      _errorMessage = null;
    });

    try {
      final result = await _authService.resendVerificationCode(
        widget.emailVerificationToken,
      );

      if (!mounted) return;

      if (result['success'] == true) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.newCodeSent),
            backgroundColor: const Color(0xFF10B981),
          ),
        );
        _startResendCooldown();
      } else {
        setState(() {
          _errorMessage = result['message'] ?? l10n.errorResendingCode;
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isResending = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 30.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const SizedBox(height: 60),

                // Ícone de Email
                Container(
                  width: 100,
                  height: 100,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [AppColors.primaryBlue, AppColors.secondaryBlue],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(25),
                  ),
                  child: const Icon(
                    Icons.mark_email_read_rounded,
                    size: 50,
                    color: Colors.white,
                  ),
                ),

                const SizedBox(height: 30),

                // Título
                Text(
                  l10n.emailVerificationTitle,
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0E162B),
                    fontFamily: 'Arimo',
                  ),
                ),
                const SizedBox(height: 12),

                // Subtítulo
                Text(
                  widget.email != null
                      ? l10n.emailVerificationSubtitleEmail(widget.email!)
                      : l10n.emailVerificationSubtitle,
                  textAlign: TextAlign.center,
                  style: const TextStyle(
                    fontSize: 15,
                    color: AppColors.textGray,
                    fontFamily: 'Arimo',
                    height: 1.5,
                  ),
                ),

                const SizedBox(height: 40),

                // Campo de código
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 5),
                  child: TextFormField(
                    controller: _codeController,
                    textAlign: TextAlign.center,
                    keyboardType: TextInputType.text,
                    autofillHints: const [AutofillHints.oneTimeCode],
                    inputFormatters: [
                      LengthLimitingTextInputFormatter(10),
                    ],
                    style: const TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 8,
                      fontFamily: 'Arimo',
                    ),
                    decoration: InputDecoration(
                      hintText: '••••••',
                      hintStyle: TextStyle(
                        color: Colors.grey.shade400,
                        fontSize: 24,
                        letterSpacing: 8,
                      ),
                      filled: true,
                      fillColor: AppColors.inputBackground,
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 16),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide:
                            const BorderSide(color: AppColors.borderGray),
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide:
                            const BorderSide(color: AppColors.borderGray),
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                        borderSide: const BorderSide(
                            color: AppColors.primaryBlue, width: 2),
                      ),
                    ),
                  ),
                ),

                // Mensagem de erro
                if (_errorMessage != null) ...[
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFEE2E2),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.error_outline,
                            color: Color(0xFFEF4444), size: 20),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: const TextStyle(
                              color: Color(0xFFDC2626),
                              fontSize: 13,
                              fontFamily: 'Arimo',
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],

                const SizedBox(height: 30),

                // Botão verificar
                GestureDetector(
                  onTap: _isLoading ? null : () => _verifyCode(l10n),
                  child: Container(
                    width: 300,
                    height: 50,
                    decoration: ShapeDecoration(
                      gradient: const LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          AppColors.primaryBlue,
                          AppColors.secondaryBlue,
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
                        ),
                      ],
                    ),
                    child: Center(
                      child: _isLoading
                          ? const CircularProgressIndicator(
                              color: Colors.white,
                            )
                          : Text(
                              l10n.verifyCode,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontFamily: 'Arimo',
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ),

                const SizedBox(height: 20),

                // Reenviar código
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      l10n.didntReceiveCode,
                      style: const TextStyle(
                        color: AppColors.textGray,
                        fontSize: 14,
                        fontFamily: 'Arimo',
                      ),
                    ),
                    GestureDetector(
                      onTap: _resendCooldown > 0 ? null : () => _resendCode(l10n),
                      child: _isResending
                          ? const SizedBox(
                              width: 16,
                              height: 16,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                color: AppColors.primaryBlue,
                              ),
                            )
                          : Text(
                              _resendCooldown > 0
                                  ? l10n.resendCooldown(_resendCooldown)
                                  : l10n.resend,
                              style: TextStyle(
                                color: _resendCooldown > 0
                                    ? AppColors.textGray
                                    : AppColors.primaryBlue,
                                fontSize: 14,
                                fontFamily: 'Arimo',
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ],
                ),

                const SizedBox(height: 30),

                // Voltar ao login
                TextButton.icon(
                  onPressed: () {
                    ref.read(authProvider.notifier).clearBlockedAction();
                    Navigator.pushReplacementNamed(context, '/login');
                  },
                  icon: const Icon(Icons.arrow_back, size: 18),
                  label: Text(
                    l10n.backToLogin,
                    style: const TextStyle(fontFamily: 'Arimo'),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
