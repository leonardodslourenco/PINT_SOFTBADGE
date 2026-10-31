import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:file_picker/file_picker.dart';
import 'package:projeto_pratico/models/badge_model.dart';
import 'package:projeto_pratico/models/candidatura_model.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';
import 'package:projeto_pratico/riverpood/status_history_notifier.dart';
import 'package:projeto_pratico/services/candidatura_service.dart';
import 'package:projeto_pratico/services/evidence_service.dart';
import 'package:projeto_pratico/services/badge_service.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class EvidenceUploadForm extends ConsumerStatefulWidget {
  final BadgeModel badge;
  final String? existingCandidaturaId;

  const EvidenceUploadForm({
    super.key,
    required this.badge,
    this.existingCandidaturaId,
  });

  @override
  ConsumerState<EvidenceUploadForm> createState() => _EvidenceUploadFormState();
}

class _EvidenceUploadFormState extends ConsumerState<EvidenceUploadForm> {
  final CandidaturaService _candidaturaService = CandidaturaService();
  final EvidenceService _evidenceService = EvidenceService();
  final BadgeService _badgeService = BadgeService();

  List<RequirementModel> _requirements = [];
  bool _isLoading = true;
  String? _errorMessage;

  String? _candidaturaId;

  // Mapa de ficheiros selecionados localmente: [reqId] -> File
  final Map<String, File> _selectedFiles = {};
  final Map<String, String> _selectedFileNames = {};

  // Mapa de evidências já existentes no servidor: [reqId] -> nome_ficheiro
  final Map<String, String> _existingEvidenceNames = {};

  bool _isSavingDraft = false;
  bool _isSubmitting = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    // 1. Extrair o l10n ANTES do try/await
    final l10n = AppLocalizations.of(context)!;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. Carregar requisitos reais do badge da BD
      final reqs =
          await _badgeService.fetchRequirementsByBadge(widget.badge.id);

      // 2. Procurar candidatura ativa ou rascunho existente
      String? candId = widget.existingCandidaturaId;
      if (candId == null || candId.isEmpty) {
        try {
          final apps = await _candidaturaService.fetchMinhasCandidaturas();
          CandidaturaModel? existingApp;
          for (final a in apps) {
            if (a.idBadge == widget.badge.id && a.idEstadoCandidatura != 5) {
              existingApp = a;
              break;
            }
          }

          if (existingApp != null) {
            candId = existingApp.idCandidatura;
            for (final ev in existingApp.evidencias) {
              final rId = ev.idRequisitoNivel.toString();
              if (ev.nomeFicheiro.isNotEmpty) {
                _existingEvidenceNames[rId] = ev.nomeFicheiro;
              }
            }
          }
        } catch (e) {
          debugPrint('Erro ao procurar candidatura existente: $e');
        }
      }

      if (mounted) {
        setState(() {
          _requirements = reqs;
          _candidaturaId = candId;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          // Usar o l10n capturado no início
          _errorMessage = l10n.errorLoadRequirements(e.toString());
          _isLoading = false;
        });
      }
    }
  }

  // ─── SELEÇÃO DE FICHEIRO PARA UM REQUISITO ESPECÍFICO ────────────────────
  Future<void> _pickFileForRequirement(RequirementModel req) async {
    // Extrair l10n antes do await
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
                  // Usar o l10n capturado
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
      _existingEvidenceNames.remove(req.code);
    });
  }

  // ─── VALIDAÇÃO DE REQUISITOS OBRIGATÓRIOS ────────────────────────────────
  bool _validateMandatoryRequirements() {
    for (final req in _requirements) {
      if (req.obrigatorio) {
        final hasLocalFile = _selectedFiles.containsKey(req.code);
        final hasExistingFile = _existingEvidenceNames.containsKey(req.code);
        if (!hasLocalFile && !hasExistingFile) {
          return false;
        }
      }
    }
    return true;
  }

  // ─── GUARDAR RASCUNHO OU SUBMETER CANDIDATURA ────────────────────────────
  Future<void> _handleSave({required bool submitAfterSave}) async {
    // Extrair l10n no topo, antes de qualquer lógica assíncrona
    final l10n = AppLocalizations.of(context)!;

    // 1. Validação de campos obrigatórios se for submissão final
    if (submitAfterSave) {
      if (!_validateMandatoryRequirements()) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.mustAttachMandatory), // Usa o l10n local
            backgroundColor: const Color(0xFFDC2626),
            duration: const Duration(seconds: 4),
          ),
        );
        return;
      }
    } else {
      // Se for apenas guardar rascunho, deve ter selecionado pelo menos 1 ficheiro
      if (_selectedFiles.isEmpty && _existingEvidenceNames.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(l10n.attachAtLeastOne), // Usa o l10n local
            backgroundColor: const Color(0xFFD97706),
          ),
        );
        return;
      }
    }

    setState(() {
      if (submitAfterSave) {
        _isSubmitting = true;
      } else {
        _isSavingDraft = true;
      }
    });

    try {
      String targetCandidaturaId = _candidaturaId ?? '';

      // 2. Garantir que a candidatura existe na BD (em estado 1 - Rascunho)
      if (targetCandidaturaId.isEmpty) {
        final createRes = await _candidaturaService.createCandidatura(
          idBadge: widget.badge.id,
          submeterDireto: false,
        );
        targetCandidaturaId = createRes['id_candidatura'] ?? '';
        if (targetCandidaturaId.isEmpty) {
          // Usa o l10n local no throw
          throw Exception(l10n.errorCreateApplication);
        }
        _candidaturaId = targetCandidaturaId;
      }

      // 3. Upload dos novos ficheiros selecionados para cada requisito
      for (final entry in _selectedFiles.entries) {
        final reqCode = entry.key;
        final file = entry.value;
        final reqId = int.tryParse(reqCode) ?? 0;

        // Procura o requisito para obter a descrição
        final req = _requirements.firstWhere(
          (r) => r.code == reqCode,
          orElse: () => RequirementModel(
            code: reqCode,
            title: '',
            subtitle: '',
            description: '',
            obrigatorio: true,
            status: RequirementStatus.disponivel,
          ),
        );

        await _evidenceService.uploadEvidencia(
          idCandidatura: targetCandidaturaId,
          idRequisitoNivel: reqId,
          ficheiro: file,
          descricao: req.description,
        );
      }

      // 4. Se for "Submeter Candidatura", faz a transição de estado para 2 (Submetida)
      if (submitAfterSave) {
        await _candidaturaService.submitCandidatura(targetCandidaturaId);
      }

      // 5. Atualizar os dados globais da aplicação
      await ref.read(badgeProvider.notifier).refreshBadges();
      await ref.read(statusHistoryProvider.notifier).loadRealData();

      // Guarded by mounted: o context e o Navigator estão protegidos
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            // Usa o l10n local
            content: Text(submitAfterSave
                ? l10n.applicationSubmittedSuccess
                : l10n.draftSavedSuccess),
            backgroundColor: const Color(0xFF10B981),
            duration: const Duration(seconds: 4),
          ),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      debugPrint('Erro ao processar candidatura: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            // Usa o l10n local
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
          _isSavingDraft = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const CircularProgressIndicator(color: Color(0xFF155DFC)),
              const SizedBox(height: 16),
              Text(
                AppLocalizations.of(context)!.loadingRequirements,
                style: const TextStyle(color: Color(0xFF64748B), fontSize: 14),
              ),
            ],
          ),
        ),
      );
    }

    if (_errorMessage != null) {
      return Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
        ),
        padding: const EdgeInsets.all(24),
        child: Center(
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
                onPressed: _loadData,
                child: Text(AppLocalizations.of(context)!.tryAgainButton),
              ),
            ],
          ),
        ),
      );
    }

    return Container(
      width: double.infinity,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(20),
              children: [
                _buildInfoBox(),
                const SizedBox(height: 20),
                Text(
                  AppLocalizations.of(context)!.submissionRequirements,
                  style: const TextStyle(
                    color: Color(0xFF0F172B),
                    fontSize: 16,
                    fontFamily: 'Inter',
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
                const SizedBox(height: 16),
              ],
            ),
          ),
          _buildBottomBar(),
        ],
      ),
    );
  }

  Widget _buildInfoBox() {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: const Color(0xFFEFF6FF),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFFBFDBFE), width: 1.5),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.info_outline_rounded,
              color: Color(0xFF1E40AF), size: 20),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  AppLocalizations.of(context)!.applicationInstructions,
                  style: const TextStyle(
                    color: Color(0xFF1E40AF),
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'Inter',
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  AppLocalizations.of(context)!.applicationInstructionsDesc,
                  style: const TextStyle(
                    color: Color(0xFF1E40AF),
                    fontSize: 12,
                    fontFamily: 'Inter',
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRequirementCard(RequirementModel req) {
    final hasLocalFile = _selectedFiles.containsKey(req.code);
    final localFileName = _selectedFileNames[req.code];
    final existingFileName = _existingEvidenceNames[req.code];
    final hasFile = hasLocalFile || existingFileName != null;
    final displayFileName = hasLocalFile ? localFileName : existingFileName;

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
        boxShadow: const [
          BoxShadow(
            color: Color(0x08000000),
            blurRadius: 6,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cabeçalho do Requisito com Badge Obrigatório / Opcional
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
                      style: const TextStyle(
                        color: Color(0xFF0F172B),
                        fontSize: 14,
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                    if (req.subtitle.isNotEmpty) ...[
                      const SizedBox(height: 2),
                      Text(
                        req.subtitle,
                        style: const TextStyle(
                          color: Color(0xFF64748B),
                          fontSize: 12,
                          fontFamily: 'Inter',
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
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
                  style: TextStyle(
                    color: req.obrigatorio
                        ? const Color(0xFFDC2626)
                        : const Color(0xFF64748B),
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    fontFamily: 'Inter',
                  ),
                ),
              ),
            ],
          ),

          // Descrição do Requisito (vinda da BD, indicando o que o consultor deve demonstrar)
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
                      style: const TextStyle(
                        color: Color(0xFF334155),
                        fontSize: 12,
                        fontFamily: 'Inter',
                        height: 1.4,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 14),

          // Área de Anexo de Ficheiro deste Requisito
          if (hasFile)
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
                      displayFileName ??
                          AppLocalizations.of(context)!.attachedFileFallback,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        color: Color(0xFF065F46),
                        fontSize: 13,
                        fontFamily: 'Inter',
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
                        style: const TextStyle(
                          color: Color(0xFF155DFC),
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          fontFamily: 'Inter',
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
                      style: const TextStyle(
                        color: Color(0xFF155DFC),
                        fontSize: 13,
                        fontFamily: 'Inter',
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
    return Container(
      padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
      decoration: const BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Color(0xFFE2E8F0), width: 1.0)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Botão Primário: Submeter Candidatura
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton(
              onPressed: (_isSubmitting || _isSavingDraft)
                  ? null
                  : () => _handleSave(submitAfterSave: true),
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
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 14,
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    )
                  : Text(
                      AppLocalizations.of(context)!.submitApplicationButton,
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 14,
                        fontFamily: 'Inter',
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 8),

          // Botão Secundário: Guardar Rascunho
          SizedBox(
            width: double.infinity,
            height: 44,
            child: OutlinedButton(
              onPressed: (_isSubmitting || _isSavingDraft)
                  ? null
                  : () => _handleSave(submitAfterSave: false),
              style: OutlinedButton.styleFrom(
                side: const BorderSide(color: Color(0xFFCBD5E1)),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isSavingDraft
                  ? Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        const SizedBox(
                          width: 16,
                          height: 16,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor: AlwaysStoppedAnimation<Color>(
                              Color(0xFF64748B),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          AppLocalizations.of(context)!.savingLabel,
                          style: const TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 13,
                            fontFamily: 'Inter',
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    )
                  : Text(
                      AppLocalizations.of(context)!.saveDraftButton,
                      style: const TextStyle(
                        color: Color(0xFF475569),
                        fontSize: 13,
                        fontFamily: 'Inter',
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
