import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _pushNotifications = true;
  bool _emailAlerts = false;
  bool _syncAlerts = true;

  Widget _buildSwitchTile({
    required String title,
    required String subtitle,
    required bool value,
    required ValueChanged<bool> onChanged,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFF1F5F9)),
        boxShadow: const [
          BoxShadow(
            color: Color(0x05000000),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: SwitchListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        title: Text(
          title,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 15,
            fontWeight: FontWeight.w600,
            color: const Color(0xFF0F172A),
          ),
        ),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 4.0),
          child: Text(
            subtitle,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 13,
              color: const Color(0xFF64748B),
            ),
          ),
        ),
        value: value,
        activeThumbColor: const Color(0xFF155DFC),
        onChanged: onChanged,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text(
          l10n.notificationsTitle,
          style: GoogleFonts.plusJakartaSans(
            fontSize: 18,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF0F172A),
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        centerTitle: true,
      ),
      body: ListView(
        padding: const EdgeInsets.all(24.0),
        children: [
          Text(
            l10n.notificationChannelsTitle,
            style: GoogleFonts.plusJakartaSans(
              fontSize: 14,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF64748B),
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 16),
          _buildSwitchTile(
            title: l10n.pushNotificationsTitle,
            subtitle: l10n.pushNotificationsSubtitle,
            value: _pushNotifications,
            onChanged: (val) => setState(() => _pushNotifications = val),
          ),
          _buildSwitchTile(
            title: l10n.emailAlertsTitle,
            subtitle: l10n.emailAlertsSubtitle,
            value: _emailAlerts,
            onChanged: (val) => setState(() => _emailAlerts = val),
          ),
          _buildSwitchTile(
            title: l10n.syncAlertsTitle,
            subtitle: l10n.syncAlertsSubtitle,
            value: _syncAlerts,
            onChanged: (val) => setState(() => _syncAlerts = val),
          ),
        ],
      ),
    );
  }
}