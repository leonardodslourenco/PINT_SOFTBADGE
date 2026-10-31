import 'package:flutter/material.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class CelebrationDialog extends StatelessWidget {
  final String badgeName;
  final int points;

  const CelebrationDialog(
      {super.key, required this.badgeName, required this.points});

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.stars, size: 80, color: Colors.amber),
          const SizedBox(height: 16),
          Text(AppLocalizations.of(context)!.congratulations, style: Theme.of(context).textTheme.headlineMedium),
          const SizedBox(height: 10),
          Text(AppLocalizations.of(context)!.achievedBadge(badgeName)),
          Text(AppLocalizations.of(context)!.plusPoints(points.toString()),
              style: const TextStyle(
                  fontWeight: FontWeight.bold, color: Colors.blue)),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: Text(AppLocalizations.of(context)!.continueEvolving),
          ),
        ],
      ),
    );
  }
}
