import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/badge_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class CandidaturasRetornadasScreen extends ConsumerWidget {
  const CandidaturasRetornadasScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final badgeState = ref.watch(badgeProvider);
    final l10n = AppLocalizations.of(context)!;

    // Exemplo: Filtrar candidaturas cujo estado indique rejeição ou retorno para alteração (ex: estado 0 ou outro código que usem)
    final retornadas = badgeState.minhasCandidaturas
        .where((c) => c.idEstadoCandidatura == 0) // Ajusta o ID do estado conforme a tua base de dados
        .toList();

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(l10n.returnedApplicationsTitle, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        automaticallyImplyLeading: true,
      ),
      body: retornadas.isEmpty
          ? Center(child: Text(l10n.noReturnedApplications, style: const TextStyle(color: Colors.grey)))
          : ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: retornadas.length,
              itemBuilder: (context, index) {
                final cand = retornadas[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 12),
                  elevation: 0,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: const BorderSide(color: Colors.redAccent),
                  ),
                  child: ListTile(
                    leading: const Icon(Icons.error_outline, color: Colors.red),
                    title: Text(l10n.applicationRequiresCorrection),
                    subtitle: Text(l10n.tapToCorrectAndResubmit(cand.idCandidatura.toString())),
                    isThreeLine: true,
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      // Lógica para permitir editar/submeter novamente a evidência
                    },
                  ),
                );
              },
            ),
    );
  }
}