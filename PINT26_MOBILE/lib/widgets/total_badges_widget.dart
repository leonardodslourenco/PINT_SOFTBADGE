import 'package:flutter/material.dart';
import '../services/basededados.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class TotalProductsWidget extends StatelessWidget {
  const TotalProductsWidget({super.key});

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<int>(
      future: Basededados().contarBadges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const CircularProgressIndicator();
        } else if (snapshot.hasError) {
          return Text(AppLocalizations.of(context)!.errorLoading);
        } else {
          return Text(
            AppLocalizations.of(context)!.totalProducts(snapshot.data?.toString() ?? '0'),
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          );
        }
      },
    );
  }
}
