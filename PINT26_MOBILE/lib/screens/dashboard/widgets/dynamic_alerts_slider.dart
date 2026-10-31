import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../riverpood/dashboard_notifier.dart';
import '../../../models/badge_model.dart';
import '../../../models/objetivo_model.dart';
import '../../../services/badge_expiration_service.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class DynamicAlertsSlider extends StatefulWidget {
  final MarcoAlcancado? ultimoMarco;
  final BadgeModel? ultimoBadge;
  final ObjetivoModel? lembreteObjetivo;
  final BadgeExpirationAlert? alertaExpiracao;

  const DynamicAlertsSlider({
    super.key,
    this.ultimoMarco,
    this.ultimoBadge,
    this.lembreteObjetivo,
    this.alertaExpiracao,
  });

  @override
  State<DynamicAlertsSlider> createState() => _DynamicAlertsSliderState();
}

class _DynamicAlertsSliderState extends State<DynamicAlertsSlider> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  Timer? _timer;
  late List<Widget> _slides;

  @override
  void initState() {
    super.initState();
    _startAutoPlay();
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    _buildSlides();
  }

  @override
  void didUpdateWidget(DynamicAlertsSlider oldWidget) {
    super.didUpdateWidget(oldWidget);
    _buildSlides();
  }

  void _buildSlides() {
    final l10n = AppLocalizations.of(context)!;
    _slides = [];

    // 1. Marco Alcançado (Green)
    if (widget.ultimoMarco != null) {
      _slides.add(_buildSlide(
        backgroundColor: const Color(0xFFD1FAE5), // Light Green
        iconText: '🏆',
        title: l10n.sliderMilestoneTitle,
        titleColor: const Color(0xFF065F46),
        description: l10n.sliderMilestoneDesc(widget.ultimoMarco!.title),
        descriptionColor: const Color(0xFF065F46),
        actionText: l10n.sliderMilestoneAction,
        actionColor: const Color(0xFF2563EB),
        onTapAction: () => Navigator.pushNamed(context, '/history'),
      ));
    }

    // 2. Novo Badge (Light Purple)
    if (widget.ultimoBadge != null) {
      _slides.add(_buildSlide(
        backgroundColor: const Color(0xFFF3E8FF), // Light Purple
        iconText: '🎖️',
        title: l10n.sliderNewBadge,
        titleColor: const Color(0xFF6B21A8),
        description: l10n.sliderNewBadgeDesc(widget.ultimoBadge!.title),
        descriptionColor: const Color(0xFF6B21A8),
        actionText: l10n.sliderNewBadgeAction,
        actionColor: const Color(0xFF2563EB),
        onTapAction: () => Navigator.pushNamed(context, '/badge_details', arguments: widget.ultimoBadge!.id),
      ));
    }

    // 3. Lembrete de Objetivo (Light Blue)
    if (widget.lembreteObjetivo != null) {
      final isPontos = widget.lembreteObjetivo!.quantidadePontos != null;
      final qtd = isPontos ? widget.lembreteObjetivo!.quantidadePontos! : widget.lembreteObjetivo!.quantidadeBadges!;
      final tipo = isPontos ? 'pontos' : 'badges';
      
      _slides.add(_buildSlide(
        backgroundColor: const Color(0xFFDBEAFE), // Light Blue
        iconText: '🐳',
        title: l10n.sliderObjectiveTitle,
        titleColor: const Color(0xFF1E40AF),
        description: l10n.sliderObjectiveDesc(qtd, tipo),
        descriptionColor: const Color(0xFF1E40AF),
        actionText: l10n.sliderObjectiveAction,
        actionColor: const Color(0xFF2563EB),
        onTapAction: () {},
      ));
    }

    // 4. Alerta de Expiração (Yellow / Red)
    if (widget.alertaExpiracao != null) {
      final isCritico = widget.alertaExpiracao!.diasRestantes <= 7;
      _slides.add(_buildSlide(
        backgroundColor: isCritico ? const Color(0xFFFEE2E2) : const Color(0xFFFEF3C7),
        iconText: isCritico ? '⏰' : '⚠️',
        title: isCritico ? l10n.sliderSlaUrgent : l10n.sliderBadgeExpiring,
        titleColor: isCritico ? const Color(0xFF991B1B) : const Color(0xFF92400E),
        description: l10n.sliderBadgeExpiringDesc(widget.alertaExpiracao!.badgeTitle, widget.alertaExpiracao!.diasRestantes),
        descriptionColor: isCritico ? const Color(0xFF991B1B) : const Color(0xFF92400E),
        actionText: l10n.sliderBadgeExpiringAction,
        actionColor: const Color(0xFF2563EB),
        onTapAction: () => Navigator.pushNamed(context, '/badge_details', arguments: widget.alertaExpiracao!.idBadge),
      ));
    }

    // Fallback if empty (A tua jornada começa aqui)
    if (_slides.isEmpty) {
      _slides.add(_buildSlide(
        backgroundColor: const Color(0xFFEFF6FF),
        iconText: '✨',
        title: l10n.sliderFallbackTitle,
        titleColor: const Color(0xFF1E3A8A),
        description: l10n.sliderFallbackDesc,
        descriptionColor: const Color(0xFF1E40AF),
        actionText: '',
        actionColor: Colors.transparent,
        onTapAction: () {},
      ));
    }
  }

  void _startAutoPlay() {
    _timer = Timer.periodic(const Duration(seconds: 4), (Timer timer) {
      if (_slides.length <= 1) return;
      if (_pageController.hasClients) {
        int nextPage = _currentPage + 1;
        if (nextPage >= _slides.length) {
          nextPage = 0;
          _pageController.jumpToPage(0);
        } else {
          _pageController.animateToPage(
            nextPage,
            duration: const Duration(milliseconds: 400),
            curve: Curves.easeInOut,
          );
        }
      }
    });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  Widget _buildSlide({
    required Color backgroundColor,
    required String iconText,
    required String title,
    required Color titleColor,
    required String description,
    required Color descriptionColor,
    required String actionText,
    required Color actionColor,
    required VoidCallback onTapAction,
  }) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.black.withValues(alpha: 0.05)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.04),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Text(iconText, style: const TextStyle(fontSize: 22)),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  title,
                  style: GoogleFonts.inter(
                    color: titleColor,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: GoogleFonts.inter(
              color: descriptionColor,
              fontSize: 13,
              height: 1.4,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          if (actionText.isNotEmpty) ...[
            const SizedBox(height: 12),
            GestureDetector(
              onTap: onTapAction,
              child: Text(
                actionText,
                style: GoogleFonts.inter(
                  color: actionColor,
                  fontSize: 13,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 160,
      child: Stack(
        alignment: Alignment.bottomCenter,
        children: [
          PageView(
            controller: _pageController,
            onPageChanged: (int page) {
              setState(() {
                _currentPage = page;
              });
            },
            children: _slides,
          ),
          if (_slides.length > 1)
            Positioned(
              bottom: 12,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _slides.length,
                  (index) => Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: _currentPage == index ? 16 : 6,
                    height: 6,
                    decoration: BoxDecoration(
                      color: _currentPage == index
                          ? Colors.black.withValues(alpha: 0.4)
                          : Colors.black.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
