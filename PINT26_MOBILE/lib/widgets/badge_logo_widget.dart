import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:projeto_pratico/config/api_config.dart';

class BadgeLogoWidget extends StatelessWidget {
  final String? logo;
  final double size;
  final BoxFit fit;
  final String? fallbackEmoji;
  final IconData fallbackIcon;
  final Color fallbackIconColor;

  const BadgeLogoWidget({
    super.key,
    required this.logo,
    this.size = 36,
    this.fit = BoxFit.contain,
    this.fallbackEmoji,
    this.fallbackIcon = Icons.workspace_premium_rounded,
    this.fallbackIconColor = const Color(0xFF155DFC),
  });

  @override
  Widget build(BuildContext context) {
    final logoUrl = ApiConfig.getBadgeLogoUrl(logo);

    if (logoUrl.isEmpty || logo == 'default_badge.svg' || logo == 'default_badge.png') {
      return _buildFallback();
    }

    final isSvg = logoUrl.toLowerCase().contains('.svg');

    if (isSvg) {
      return SvgPicture.network(
        logoUrl,
        width: size,
        height: size,
        fit: fit,
        placeholderBuilder: (_) => SizedBox(
          width: size,
          height: size,
          child: const Center(
            child: SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 1.5),
            ),
          ),
        ),
      );
    }

    return Image.network(
      logoUrl,
      width: size,
      height: size,
      fit: fit,
      errorBuilder: (context, error, stackTrace) {
        return _buildFallback();
      },
      loadingBuilder: (context, child, loadingProgress) {
        if (loadingProgress == null) return child;
        return SizedBox(
          width: size,
          height: size,
          child: const Center(
            child: SizedBox(
              width: 14,
              height: 14,
              child: CircularProgressIndicator(strokeWidth: 1.5),
            ),
          ),
        );
      },
    );
  }

  Widget _buildFallback() {
    if (fallbackEmoji != null && fallbackEmoji!.isNotEmpty) {
      return SizedBox(
        width: size,
        height: size,
        child: Center(
          child: Text(
            fallbackEmoji!,
            style: TextStyle(fontSize: size * 0.6),
          ),
        ),
      );
    }

    return Icon(
      fallbackIcon,
      size: size * 0.75,
      color: fallbackIconColor,
    );
  }
}
