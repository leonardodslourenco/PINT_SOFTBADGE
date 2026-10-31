import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../riverpood/timeline_notifier.dart'; 
import '../../widgets/timeline_card_widget.dart';
import '../dashboard/widgets/create_objetivo_modal.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class TimelineScreen extends ConsumerStatefulWidget {
  const TimelineScreen({super.key});

  @override
  ConsumerState<TimelineScreen> createState() => _TimelineScreenState();
}

class _TimelineScreenState extends ConsumerState<TimelineScreen> {
  void _abrirModalCriarObjetivo(BuildContext context, WidgetRef ref) {
    showCreateObjetivoModal(context, ref);
  }

  @override
  Widget build(BuildContext context) {
    final events = ref.watch(timelineProvider).events;
    final l10n = AppLocalizations.of(context)!;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          l10n.myEvolution,
          style: GoogleFonts.outfit(
              fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
        ),
        elevation: 0,
        backgroundColor: Colors.white,
        iconTheme: const IconThemeData(color: Color(0xFF1E293B)),
        centerTitle: true,
      ),
      
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          _abrirModalCriarObjetivo(context, ref);
        },
        backgroundColor: const Color(0xFF155DFC),
        elevation: 4,
        icon: const Icon(Icons.add_task_rounded, color: Colors.white),
        label: Text(
          l10n.newObjective,
          style: GoogleFonts.inter(
            fontWeight: FontWeight.bold, 
            color: Colors.white,
          ),
        ),
      ),
      
      body: events.isEmpty
          ? Center(
              child: Text(
                l10n.noTimelineEvents,
                textAlign: TextAlign.center,
                style: GoogleFonts.inter(color: Colors.grey.shade600),
              ),
            )
          : ListView.builder(
              physics: const BouncingScrollPhysics(),
              padding: const EdgeInsets.only(left: 24, right: 24, top: 32, bottom: 80), // 🌟 Bottom 80 para não esconder atrás do FAB
              itemCount: events.length,
              itemBuilder: (context, index) {
                return TimelineCardWidget(
                  event: events[index],
                  isLast: index == events.length - 1,
                );
              },
            ),
    );
  }
}