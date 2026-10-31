import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class SubmissoesIncompletasScreen extends ConsumerWidget {
  const SubmissoesIncompletasScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final badgeState = ref.watch(badgeProvider);
    final l10n = AppLocalizations.of(context)!;

    // Filtra candidaturas que estão em aberto / rascunho (ex: estado 1 ou -1)
    final incompletas = badgeState.minhasCandidaturas
        .where((c) => c.idEstadoCandidatura == 1 || c.idEstadoCandidatura == -1)
        .toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(l10n.incompleteSubmissionsTitle, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: true,
      ),
      body: incompletas.isEmpty
          ? Center(child: Text(l10n.noIncompleteSubmissions, style: const TextStyle(color: Colors.grey)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: incompletas.length,
              itemBuilder: (context, index) {
                final cand = incompletas[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  child: ListTile(
                    leading: const Icon(Icons.edit_note, color: Colors.orange),
                    title: Text(l10n.applicationId(cand.idCandidatura.toString())),
                    subtitle: Text(l10n.tapToUploadAndSubmit),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      // Aqui podes abrir o ecrã de upload/submissão para esta candidatura específica
                    },
                  ),
                );
              },
            ),
    );
  }
}