import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class RgpdScreen extends ConsumerStatefulWidget {
  const RgpdScreen({super.key});

  @override
  ConsumerState<RgpdScreen> createState() => _RgpdScreenState();
}

class _RgpdScreenState extends ConsumerState<RgpdScreen> {
  String? _politicaTexto;
  bool _isLoading = true;
  bool _isAccepting = false;

  @override
  void initState() {
    super.initState();
    _fetchPolitica();
  }

  Future<void> _fetchPolitica() async {
    final politica = await ref.read(authProvider.notifier).fetchPoliticaRGPD();
    if (mounted) {
      final l10n = AppLocalizations.of(context)!;
      setState(() {
        _politicaTexto = politica ?? l10n.errorLoadingTerms;
        _isLoading = false;
      });
    }
  }

  Future<void> _aceitarTermos() async {
    setState(() {
      _isAccepting = true;
    });
    
    final success = await ref.read(authProvider.notifier).acceptRGPD();
    
    if (mounted) {
      setState(() {
        _isAccepting = false;
      });
      
      if (success) {
        final authState = ref.read(authProvider);
        if (authState.user?.idArea == null) {
          Navigator.pushReplacementNamed(context, '/area_selection');
        } else {
          Navigator.pushReplacementNamed(context, '/main');
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.errorAcceptingTerms),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: Text(l10n.termsAndConditions, style: const TextStyle(fontFamily: 'Arimo', fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF155DFC)))
          : Column(
              children: [
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Text(
                    l10n.rgpdSubtitle,
                    style: const TextStyle(
                      fontFamily: 'Arimo',
                      fontSize: 16,
                      color: Color(0xFF61738D),
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
                Expanded(
                  child: Container(
                    margin: const EdgeInsets.symmetric(horizontal: 24.0),
                    padding: const EdgeInsets.all(16.0),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F7FA),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFE2E8F0)),
                    ),
                    child: SingleChildScrollView(
                      child: Text(
                        _politicaTexto ?? '',
                        style: const TextStyle(
                          fontFamily: 'Arimo',
                          fontSize: 14,
                          height: 1.5,
                          color: Color(0xFF2D3748),
                        ),
                      ),
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: SizedBox(
                    width: double.infinity,
                    height: 50,
                    child: ElevatedButton(
                      onPressed: _isAccepting ? null : _aceitarTermos,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF155DFC),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      child: _isAccepting
                          ? const SizedBox(
                              height: 20,
                              width: 20,
                              child: CircularProgressIndicator(
                                color: Colors.white,
                                strokeWidth: 2,
                              ),
                            )
                          : Text(
                              l10n.acceptTerms,
                              style: const TextStyle(
                                fontFamily: 'Arimo',
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                                color: Colors.white,
                              ),
                            ),
                    ),
                  ),
                ),
              ],
            ),
    );
  }
}
