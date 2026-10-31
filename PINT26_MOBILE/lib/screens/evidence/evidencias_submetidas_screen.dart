import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart'; // Ajusta o caminho do teu provider se necessário
import 'package:projeto_pratico/l10n/app_localizations.dart';

class EvidenciasSubmetidasScreen extends ConsumerWidget {
  const EvidenciasSubmetidasScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final badgeState = ref.watch(badgeProvider);
    final l10n = AppLocalizations.of(context)!;
    
    // Filtra apenas as evidências validadas / aprovadas
    final evidenciasValidas = badgeState.minhasEvidencias
        .where((ev) => ev.aprovadoTotal || ev.foiValidado)
        .toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(l10n.approvedValidatedEvidenceTitle, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: true, // Garante a seta de retorno
      ),
      body: evidenciasValidas.isEmpty
          ? Center(child: Text(l10n.noValidatedEvidence, style: const TextStyle(color: Colors.grey)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: evidenciasValidas.length,
              itemBuilder: (context, index) {
                final ev = evidenciasValidas[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  child: ListTile(
                    leading: const Icon(Icons.check_circle, color: Colors.green),
                    title: Text(ev.nomeFicheiro, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(l10n.requirementIdAndDate(ev.idRequisitoNivel.toString(), ev.dataUpload.toLocal().toString().split(' ')[0])),
                  ),
                );
              },
            ),
    );
  }
}