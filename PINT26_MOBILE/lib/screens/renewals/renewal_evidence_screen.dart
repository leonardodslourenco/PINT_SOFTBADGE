import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:file_picker/file_picker.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/models/renovacao_model.dart';
import 'package:projeto_pratico/models/badge_model.dart';
import 'package:projeto_pratico/services/badge_service.dart';
import 'package:projeto_pratico/services/renovacao_service.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class RenewalEvidenceScreen extends StatefulWidget {
  final RenovacaoElegivelModel badgeItem;

  const RenewalEvidenceScreen({
    super.key,
    required this.badgeItem,
  });

  @override
  State<RenewalEvidenceScreen> createState() => _RenewalEvidenceScreenState();
}

class _RenewalEvidenceScreenState extends State<RenewalEvidenceScreen> {
  final BadgeService _badgeService = BadgeService();
  final RenovacaoService _renovacaoService = RenovacaoService();

  List<RequirementModel> _requirements = [];
  bool _isLoading = true;
  String? _errorMessage;

  final Map<String, File> _selectedFiles = {};
  final Map<String, String> _selectedFileNames = {};

  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    _loadRequirements();
  }

  Future<void> _loadRequirements() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. Carregar requisitos reais do badge da BD
      final reqs = await _badgeService.fetchRequirementsByBadge(widget.badgeItem.idBadge);

      if (mounted) {
        setState(() {
          _requirements = reqs;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = AppLocalizations.of(context)!.errorLoadRequirements(e.toString());
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _pickFileForRequirement(RequirementModel req) async {
    final l10n = AppLocalizations.of(context)!;

    try {
      final result = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf', 'zip', 'rar', '7z'],
        withData: kIsWeb,
      );

      if (result != null && result.files.isNotEmpty) {
        final pickedFile = result.files.first;
        final extension = pickedFile.extension?.toLowerCase() ?? '';
        final maxBytes = extension == 'pdf'
            ? 5 * 1024 * 1024 // 5MB para PDF
            : 15 * 1024 * 1024; // 15MB para ZIP/RAR/7Z

        if (pickedFile.size > maxBytes) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                  l10n.fileSizeExceeded(
                      (maxBytes ~/ (1024 * 1024)).toString(), extension),
                ),
                backgroundColor: Colors.redAccent,
              ),
            );
          }
          return;
        }

        setState(() {
          if (!kIsWeb && pickedFile.path != null) {
            _selectedFiles[req.code] = File(pickedFile.path!);
          }
          _selectedFileNames[req.code] = pickedFile.name;
        });
      }
    } catch (e) {
      debugPrint('Erro ao selecionar ficheiro: $e');
    }
  }

  void _removeFileForRequirement(RequirementModel req) {
    setState(() {
      _selectedFiles.remove(req.code);
      _selectedFileNames.remove(req.code);
    });
  }

  bool _validateMandatoryRequirements() {
    for (final req in _requirements) {
      if (req.obrigatorio) {
        final hasLocalFile = _selectedFiles.containsKey(req.code);
        if (!hasLocalFile) {
          return false;
        }
      }
    }
    return true;
  }

  Future<void> _handleSubmit() async {
    final l10n = AppLocalizations.of(context)!;

    if (!_validateMandatoryRequirements()) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(l10n.mustAttachMandatory),
          backgroundColor: const Color(0xFFDC2626),
          duration: const Duration(seconds: 4),
        ),
      );
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      // 1. Criar o pedido de renovação
      String? idRenovacao;
      if (widget.badgeItem.statusRenovacao == 'pendente') {
        idRenovacao = widget.badgeItem.idRenovacaoAtiva;
      }
      
      if (idRenovacao == null || idRenovacao.isEmpty) {
        idRenovacao = await _renovacaoService.submitRenovacao(widget.badgeItem.idCandidatura);
      }

      // 2. Fazer upload das evidências
      for (final entry in _selectedFiles.entries) {
        final reqCode = entry.key;
        final file = entry.value;
        final reqId = int.tryParse(reqCode) ?? 0;

        await _renovacaoService.uploadEvidenciaRenovacao(
          idRenovacao: idRenovacao,
          idCandidatura: widget.badgeItem.idCandidatura,
          idRequisito: reqId,
          ficheiro: file,
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.renewalRequestSubmittedSuccess),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 4),
          ),
        );
        Navigator.pop(context, true); // Retorna true para dar refresh na lista
      }
    } catch (e) {
      debugPrint('Erro ao processar renovação: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
                l10n.errorGeneral(e.toString().replaceAll('Exception: ', ''))),
            backgroundColor: const Color(0xFFDC2626),
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isSubmitting = false;
        });
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
          AppLocalizations.of(context)!.renew,
          style: GoogleFonts.inter(
            color: const Color(0xFF0F172B),
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
      ),
      body: _buildBody(),
      bottomNavigationBar: _buildBottomBar(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Color(0xFF155DFC)),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline_rounded,
                color: Colors.red, size: 48),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              textAlign: TextAlign.center,
              style: const TextStyle(color: Color(0xFF0F172B), fontSize: 14),
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadRequirements,
              child: Text(AppLocalizations.of(context)!.tryAgainButton),
            ),
          ],
        ),
      );
    }

    return ListView(
      padding: const EdgeInsets.all(20),
      children: [
        // Informação do Badge
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFE2E8F0)),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.badgeItem.badgeNome,
                style: GoogleFonts.inter(
                  fontWeight: FontWeight.bold,
                  fontSize: 16,
                  color: const Color(0xFF0F172B),
                ),
              ),
              const SizedBox(height: 4),
              Text(
                '${widget.badgeItem.lpNome} • ${widget.badgeItem.areaNome}',
                style: GoogleFonts.inter(
                  fontSize: 13,
                  color: const Color(0xFF64748B),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),
        Text(
          AppLocalizations.of(context)!.submissionRequirements,
          style: GoogleFonts.inter(
            color: const Color(0xFF0F172B),
            fontSize: 16,
            fontWeight: FontWeight.w700,
          ),
        ),
        const SizedBox(height: 12),
        if (_requirements.isEmpty)
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(14),
              border: Border.all(color: const Color(0xFFE2E8F0)),
            ),
            child: Center(
              child: Text(
                AppLocalizations.of(context)!.noRequirementsConfigured,
                style: const TextStyle(
                    color: Color(0xFF64748B), fontSize: 13),
              ),
            ),
          )
        else
          ..._requirements.map(_buildRequirementCard),
      ],
    );
  }

  Widget _buildRequirementCard(RequirementModel req) {
    final hasLocalFile = _selectedFiles.containsKey(req.code);
    final localFileName = _selectedFileNames[req.code];

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: req.obrigatorio
              ? const Color(0xFFBFDBFE)
              : const Color(0xFFE2E8F0),
          width: req.obrigatorio ? 1.5 : 1.0,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      req.title.isNotEmpty
                          ? req.title
                          : AppLocalizations.of(context)!.requirementFallback,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF0F172B),
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: req.obrigatorio
                      ? const Color(0xFFFEF2F2)
                      : const Color(0xFFF1F5F9),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: req.obrigatorio
                        ? const Color(0xFFFECACA)
                        : const Color(0xFFE2E8F0),
                  ),
                ),
                child: Text(
                  req.obrigatorio
                      ? AppLocalizations.of(context)!.mandatoryLabel
                      : AppLocalizations.of(context)!.optionalLabel,
                  style: GoogleFonts.inter(
                    color: req.obrigatorio
                        ? const Color(0xFFDC2626)
                        : const Color(0xFF64748B),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
            ],
          ),
          if (req.description.isNotEmpty) ...[
            const SizedBox(height: 10),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF8FAFC),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFE2E8F0)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.description_outlined,
                    size: 16,
                    color: Color(0xFF475569),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      req.description,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF334155),
                        fontSize: 12,
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 14),
          if (hasLocalFile)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
              decoration: BoxDecoration(
                color: const Color(0xFFECFDF5),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: const Color(0xFF10B981), width: 1.2),
              ),
              child: Row(
                children: [
                  const Icon(Icons.check_circle_rounded,
                      color: Color(0xFF10B981), size: 22),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      localFileName!,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF065F46),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  InkWell(
                    onTap: () => _pickFileForRequirement(req),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Text(
                        AppLocalizations.of(context)!.changeButton,
                        style: GoogleFonts.inter(
                          color: const Color(0xFF155DFC),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 4),
                  InkWell(
                    onTap: () => _removeFileForRequirement(req),
                    child: const Padding(
                      padding: EdgeInsets.all(4),
                      child: Icon(Icons.close_rounded,
                          color: Colors.redAccent, size: 18),
                    ),
                  ),
                ],
              ),
            )
          else
            GestureDetector(
              onTap: () => _pickFileForRequirement(req),
              child: Container(
                width: double.infinity,
                padding:
                    const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8FAFC),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFCBD5E1),
                    width: 1.2,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(Icons.upload_file_rounded,
                        size: 20, color: Color(0xFF155DFC)),
                    const SizedBox(width: 8),
                    Text(
                      AppLocalizations.of(context)!.attachFileLabel,
                      style: GoogleFonts.inter(
                        color: const Color(0xFF155DFC),
                        fontSize: 13,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBottomBar() {
    return SafeArea(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: const BoxDecoration(
          color: Colors.white,
          border: Border(top: BorderSide(color: Color(0xFFE2E8F0), width: 1.0)),
        ),
        child: SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isSubmitting ? null : _handleSubmit,
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF155DFC),
              disabledBackgroundColor: const Color(0xFF93B4FC),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              elevation: 0,
            ),
            child: _isSubmitting
                ? Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor:
                              AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Text(
                        AppLocalizations.of(context)!.submittingLabel,
                        style: GoogleFonts.inter(
                          color: Colors.white,
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  )
                : Text(
                    AppLocalizations.of(context)!.confirm,
                    style: GoogleFonts.inter(
                      color: Colors.white,
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
          ),
        ),
      ),
    );
  }
}
