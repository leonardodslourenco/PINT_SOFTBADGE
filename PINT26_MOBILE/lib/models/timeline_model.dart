// uma estrutura que represente cada marco na carreira do consultor

class TimelineEvent {
  final String title;
  final String description;
  final DateTime date;
  final bool isCompleted;
  final String? badgeImageUrl;
  final String badgeId;
  final String emoji;
  final bool isSpecialBadge;

  TimelineEvent({
    required this.title,
    required this.description,
    required this.date,
    this.isCompleted = true,
    this.badgeImageUrl,
    required this.badgeId,
    this.emoji = '⭐',
    this.isSpecialBadge = false,
  });
}

class TimelineEntryData {
  final String month;
  final String points;
  final String detail;
  final int colorHex; // Cor em int para facilitar a passagem

  const TimelineEntryData({
    required this.month,
    required this.points,
    required this.detail,
    required this.colorHex,
  });
}
