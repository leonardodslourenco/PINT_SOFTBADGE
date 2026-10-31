import 'dart:io';
import 'dart:typed_data';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:path_provider/path_provider.dart';
import 'package:pdfrx/pdfrx.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';
import 'package:projeto_pratico/services/certificado_service.dart';
import 'package:share_plus/share_plus.dart';

class CertificatePreviewScreen extends StatefulWidget {
  final String idCandidatura;

  const CertificatePreviewScreen({
    super.key,
    required this.idCandidatura,
  });

  @override
  State<CertificatePreviewScreen> createState() =>
      _CertificatePreviewScreenState();
}

class _CertificatePreviewScreenState extends State<CertificatePreviewScreen> {
  final CertificadoService _service = CertificadoService();

  Uint8List? _pdfBytes;
  String? _idCertificado;
  bool _isLoading = true;
  bool _isSharing = false;
  bool _isDownloading = false;
  String? _errorMessage;

  // Rotação: 0 = 0°, 1 = 90°, 2 = 180°, 3 = 270°
  int _quarterTurns = 0;

  @override
  void initState() {
    super.initState();
    _loadCertificate();
  }

  Future<void> _loadCertificate() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final idCert = await _service.getCertificadoIdByCandidatura(widget.idCandidatura);
      if (idCert == null) {
        if (mounted) {
          setState(() {
            _errorMessage = 'Certificado não encontrado para esta candidatura.';
            _isLoading = false;
          });
        }
        return;
      }

      _idCertificado = idCert;
      final bytes = await _service.getCertificadoPdfBytes(idCert);
      if (bytes == null || bytes.isEmpty) {
        if (mounted) {
          setState(() {
            _errorMessage = 'Não foi possível carregar o documento do certificado.';
            _isLoading = false;
          });
        }
        return;
      }

      if (mounted) {
        setState(() {
          _pdfBytes = bytes;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = 'Erro ao obter certificado: $e';
          _isLoading = false;
        });
      }
    }
  }

  void _rotateClockwise() {
    setState(() {
      _quarterTurns = (_quarterTurns + 1) % 4;
    });
    ScaffoldMessenger.of(context).hideCurrentSnackBar();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(AppLocalizations.of(context)!.documentRotatedDegrees((_quarterTurns * 90).toString())),
        duration: const Duration(seconds: 1),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  Future<void> _shareCertificate() async {
    if (_pdfBytes == null) return;

    setState(() => _isSharing = true);
    try {
      final tempDir = await getTemporaryDirectory();
      final fileName = 'Certificado_${_idCertificado ?? "badge"}.pdf';
      final file = File('${tempDir.path}/$fileName');
      await file.writeAsBytes(_pdfBytes!);

      final xFile = XFile(file.path, mimeType: 'application/pdf');
      await SharePlus.instance.share(
        ShareParams(
          files: [xFile],
          text: 'Partilho o meu certificado de conquista de Badge!',
          subject: 'Certificado de Conquista - Softinsa',
        ),
      );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.errorSharingCertificate(e.toString())),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isSharing = false);
      }
    }
  }

  Future<void> _downloadCertificate() async {
    if (_idCertificado == null && _pdfBytes == null) return;

    setState(() => _isDownloading = true);
    try {
      Uint8List? downloadBytes;
      if (_idCertificado != null) {
        downloadBytes = await _service.downloadCertificadoPdfBytes(_idCertificado!);
      }
      downloadBytes ??= _pdfBytes;

      if (downloadBytes == null) {
        throw Exception('Dados do ficheiro não disponíveis para transferência.');
      }

      final fileName = 'Certificado_${_idCertificado ?? "badge"}.pdf';

      final result = await FilePicker.saveFile(
        dialogTitle: 'Guardar Certificado PDF',
        fileName: fileName,
        type: FileType.custom,
        allowedExtensions: ['pdf'],
        bytes: downloadBytes,
      );

      if (result != null) {
        // Garantir que os bytes foram gravados caso a plataforma não grave diretamente
        final file = File(result);
        if (!await file.exists()) {
          await file.writeAsBytes(downloadBytes);
        }

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(AppLocalizations.of(context)!.certificateSavedSuccess),
              backgroundColor: Colors.green,
              behavior: SnackBarBehavior.floating,
            ),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(AppLocalizations.of(context)!.errorDownloadingCertificate(e.toString())),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isDownloading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF3F4F6),
      appBar: AppBar(
        title: Text(
          AppLocalizations.of(context)!.certificateTitle,
          style: const TextStyle(
            fontFamily: 'Arimo',
            fontWeight: FontWeight.w600,
            fontSize: 18,
            color: Color(0xFF111827),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0.5,
        centerTitle: true,
        iconTheme: const IconThemeData(color: Color(0xFF111827)),
        actions: [
          if (_pdfBytes != null) ...[
            IconButton(
              icon: const Icon(Icons.rotate_right_rounded),
              tooltip: 'Rodar 90°',
              onPressed: _rotateClockwise,
            ),
            IconButton(
              icon: _isDownloading
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFF111827),
                      ),
                    )
                  : const Icon(Icons.download_rounded),
              tooltip: 'Descarregar',
              onPressed: _isDownloading ? null : _downloadCertificate,
            ),
            IconButton(
              icon: _isSharing
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Color(0xFF111827),
                      ),
                    )
                  : const Icon(Icons.share_rounded),
              tooltip: 'Partilhar',
              onPressed: _isSharing ? null : _shareCertificate,
            ),
            const SizedBox(width: 4),
          ],
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(
              color: Color(0xFF0284C7),
            ),
            const SizedBox(height: 16),
            Text(
              AppLocalizations.of(context)!.loadingCertificate,
              style: const TextStyle(
                fontFamily: 'Arimo',
                fontSize: 14,
                color: Color(0xFF6B7280),
              ),
            ),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline_rounded,
                size: 48,
                color: Color(0xFFEF4444),
              ),
              const SizedBox(height: 16),
              Text(
                _errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontFamily: 'Arimo',
                  fontSize: 15,
                  color: Color(0xFF374151),
                ),
              ),
              const SizedBox(height: 20),
              ElevatedButton.icon(
                onPressed: _loadCertificate,
                icon: const Icon(Icons.refresh_rounded),
                label: Text(AppLocalizations.of(context)!.tryAgain),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF0284C7),
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (_pdfBytes == null) {
      return const SizedBox.shrink();
    }

    return Container(
      color: const Color(0xFFE5E7EB),
      child: RotatedBox(
        quarterTurns: _quarterTurns,
        child: PdfViewer.data(
          _pdfBytes!,
          sourceName: 'Certificado.pdf',
        ),
      ),
    );
  }
}