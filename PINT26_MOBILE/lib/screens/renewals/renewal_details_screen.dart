import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:projeto_pratico/models/renovacao_model.dart';
import 'package:projeto_pratico/services/renovacao_service.dart';
import 'package:projeto_pratico/config/api_config.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class RenewalDetailsScreen extends StatefulWidget {
  final MinhaRenovacaoModel renovacao;

  const RenewalDetailsScreen({
    super.key,
    required this.renovacao,
  });

  @override
  State<RenewalDetailsScreen> createState() => _RenewalDetailsScreenState();
}

class _RenewalDetailsScreenState extends State<RenewalDetailsScreen> {
  final RenovacaoService _renovacaoService = RenovacaoService();
  bool _isLoading = true;
  Map<String, dynamic>? _detalhes;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _fetchDetalhes();
  }

  Future<void> _fetchDetalhes() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final detalhes = await _renovacaoService.fetchDetalhesRenovacao(widget.renovacao.idRenovacaoBadge);
      if (mounted) {
        setState(() {
          _detalhes = detalhes;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _openFile(String path) async {
    final cleanPath = path.startsWith('/') ? path.substring(1) : path;
    final url = Uri.parse('${ApiConfig.baseUrl}/$cleanPath');
    try {
      await launchUrl(url, mode: LaunchMode.externalApplication);
    } catch (e) {
      debugPrint('Error launching URL: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.errorGeneral('Could not launch URL')),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF0F172B)),
        title: Text(
          AppLocalizations.of(context)!.detailsAction,
          style: GoogleFonts.inter(
            color: const Color(0xFF0F172B),
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator(color: Color(0xFF155DFC)));
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 48),
            const SizedBox(height: 16),
            Text(_errorMessage!),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _fetchDetalhes,
              child: Text(AppLocalizations.of(context)!.tryAgainButton),
            ),
          ],
        ),
      );
    }

    final data = _detalhes!;
    final isAprovada = data['renovacao_aprovada']; // pode ser null, true, false
    
    // Status visual
    Color statusColor;
    String statusText;
    IconData statusIcon;

    if (isAprovada == null) {
      statusColor = const Color(0xFFD97706);
      statusText = AppLocalizations.of(context)!.pendingModeration;
      statusIcon = Icons.schedule;
    } else if (isAprovada == true) {
      statusColor = const Color(0xFF10B981);
      statusText = AppLocalizations.of(context)!.statusApproved;
      statusIcon = Icons.check_circle;
    } else {
      statusColor = Colors.red;
      statusText = AppLocalizations.of(context)!.statusRejected;
      statusIcon = Icons.cancel;
    }

    // Comentário
    final moderador = data['moderador'];
    String? feedback;
    // O moderador pode ter deixado nota em "comentarios" ou no próprio pedido
    if (data['comentarios'] != null && data['comentarios'].isNotEmpty) {
       feedback = data['comentarios'];
    }

    final evidencias = data['evidencias'] as List<dynamic>? ?? [];

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Card de Estado Geral
        Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.02),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(statusIcon, color: statusColor, size: 28),
                  const SizedBox(width: 12),
                  Text(
                    statusText,
                    style: GoogleFonts.inter(
                      color: statusColor,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              Text(
                widget.renovacao.badgeNome,
                style: GoogleFonts.inter(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: const Color(0xFF0F172B),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                AppLocalizations.of(context)!.renewalPointsPrefix + widget.renovacao.pontosRenovacao.toString(),
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 20),

        // Comentários do Moderador (se houver)
        if (feedback != null || (moderador != null && isAprovada != null)) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: isAprovada == false ? const Color(0xFFFEF2F2) : const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: isAprovada == false ? const Color(0xFFFECACA) : const Color(0xFFE2E8F0)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      isAprovada == false ? Icons.feedback_outlined : Icons.comment_outlined,
                      color: isAprovada == false ? Colors.red : const Color(0xFF475569),
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      moderador != null ? moderador['nome'] : AppLocalizations.of(context)!.detailsAction,
                      style: GoogleFonts.inter(
                        fontWeight: FontWeight.bold,
                        color: isAprovada == false ? Colors.red : const Color(0xFF334155),
                      ),
                    ),
                  ],
                ),
                if (feedback != null) ...[
                  const SizedBox(height: 8),
                  Text(
                    feedback,
                    style: GoogleFonts.inter(
                      fontSize: 14,
                      color: isAprovada == false ? const Color(0xFF991B1B) : const Color(0xFF475569),
                    ),
                  ),
                ]
              ],
            ),
          ),
          const SizedBox(height: 20),
        ],

        // Lista de Evidências
        Text(
          AppLocalizations.of(context)!.evidences,
          style: GoogleFonts.inter(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF0F172B),
          ),
        ),
        const SizedBox(height: 12),

        if (evidencias.isEmpty)
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Center(
              child: Text(
                AppLocalizations.of(context)!.noEvidenceSubmitted,
                style: GoogleFonts.inter(color: const Color(0xFF64748B)),
              ),
            ),
          )
        else
          ...evidencias.map((ev) {
            final fileName = ev['nome_ficheiro'] ?? 'Documento';
            final evAprovada = ev['evidencia_aprovada'];
            
            Color evStatusColor;
            IconData evStatusIcon;
            if (evAprovada == null) {
               evStatusColor = const Color(0xFF64748B);
               evStatusIcon = Icons.hourglass_empty;
            } else if (evAprovada == true) {
               evStatusColor = const Color(0xFF10B981);
               evStatusIcon = Icons.check_circle;
            } else {
               evStatusColor = Colors.red;
               evStatusIcon = Icons.cancel;
            }

            return Container(
              margin: const EdgeInsets.only(bottom: 12),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFEFF6FF),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.picture_as_pdf, color: Color(0xFF155DFC)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          fileName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.inter(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                            color: const Color(0xFF0F172B),
                          ),
                        ),
                        if (ev['comentario'] != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            ev['comentario'],
                            style: GoogleFonts.inter(
                              fontSize: 12,
                              color: const Color(0xFF64748B),
                            ),
                          ),
                        ]
                      ],
                    ),
                  ),
                  const SizedBox(width: 8),
                  Icon(evStatusIcon, color: evStatusColor, size: 20),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.open_in_new, color: Color(0xFF155DFC)),
                    onPressed: () {
                      if (ev['url_ficheiro'] != null) {
                         _openFile(ev['url_ficheiro']);
                      }
                    },
                  ),
                ],
              ),
            );
          }),
      ],
    );
  }
}
