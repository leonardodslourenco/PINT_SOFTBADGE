import 'package:flutter/foundation.dart';
import '../services/badge_service.dart';
import '../services/basededados.dart';
import '../models/badge_model.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../riverpood/badge_notifier.dart';
import '../models/evidence_model.dart';
import '../services/evidence_service.dart';

// Liga a API á base de dados
// garante que a aplicação descarrega as informações mais recentes da BD local
// sincroniza por completo badges & evidencias

// 1. Criamos o Provider para o SyncManager
final syncManagerProvider = Provider<SyncManager>((ref) {
  return SyncManager(ref);
});

class SyncManager {
  final Ref ref;
  final BadgeService _badgeService = BadgeService();
  final Basededados _db = Basededados();
  final EvidenceService _evidenciaService = EvidenceService();

  SyncManager(this.ref);

  Future<void> performFullSync() async {
    debugPrint('--- [SyncManager] Iniciando Full Sync ---');
    try {
      await _syncBadges();
      await _syncEvidencias();

      // Notifica a UI uma única vez no final
      ref.read(badgeProvider.notifier).refreshBadges();

      debugPrint('--- [SyncManager] Sync concluído ---');
    } catch (e) {
      debugPrint('--- [SyncManager] ERRO: $e ---');
    }
  }

  Future<void> _syncBadges() async {
    final List<BadgeModel> remoteBadges = await _badgeService.fetchAllBadges();

    if (remoteBadges.isEmpty) return;

    for (var badge in remoteBadges) {
      await _db.rawInsert(
          'INSERT OR REPLACE INTO badges (id_badge, titulo, descricao, pontos) VALUES (?, ?, ?, ?)',
          [badge.id, badge.title, badge.description, badge.points]);
    }

    await _db.saveLastSyncDate(DateTime.now().toIso8601String());
  }

  Future<void> _syncEvidencias() async {
    try {
      final List<EvidenceModel> remoteEvidences =
          await _evidenciaService.fetchEvidencias();

      if (remoteEvidences.isEmpty) return;

      for (var ev in remoteEvidences) {
        // Guarda no SQLite do telemóvel para funcionar offline!
        // Usa os campos corretos do EvidenceModel atualizado
        await _db.rawInsert(
            'INSERT OR REPLACE INTO evidencias (id_evidencia, id_candidatura, id_requisito_nivel, nome_ficheiro, url_ficheiro) VALUES (?, ?, ?, ?, ?)',
            [
              ev.id,
              ev.idCandidatura,
              ev.idRequisitoNivel,
              ev.nomeFicheiro,
              ev.urlFicheiro,
            ]);
      }
      debugPrint(
          '--- [SyncManager] Evidências sincronizadas: ${remoteEvidences.length} ---');
    } catch (e) {
      debugPrint('--- [SyncManager] Erro ao sincronizar evidências: $e ---');
    }
  }
}
