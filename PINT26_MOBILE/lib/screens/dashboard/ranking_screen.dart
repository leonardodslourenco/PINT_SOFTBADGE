import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/config/api_config.dart';
import 'package:projeto_pratico/models/ranking_model.dart';
import 'package:projeto_pratico/services/metricas_service.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class RankingScreen extends StatefulWidget {
  const RankingScreen({super.key});

  @override
  State<RankingScreen> createState() => _RankingScreenState();
}

class _RankingScreenState extends State<RankingScreen> with SingleTickerProviderStateMixin {
  final MetricasService _metricasService = MetricasService();
  bool _isLoading = true;
  List<RankingModel> _rankingData = [];
  String _errorMessage = '';
  late AnimationController _crownController;

  @override
  void initState() {
    super.initState();
    _crownController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);
    _fetchRanking();
  }

  @override
  void dispose() {
    _crownController.dispose();
    super.dispose();
  }

  Future<void> _fetchRanking() async {
    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      final data = await _metricasService.fetchRankingGeral();
      setState(() {
        _rankingData = data;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = e.toString().replaceAll('Exception: ', '');
        _isLoading = false;
      });
    }
  }

  String _getAvatarUrl(String? path) {
    return ApiConfig.getAvatarUrl(path);
  }

  String _getInitials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0].substring(0, 1).toUpperCase();
    return (parts[0][0] + parts.last[0]).toUpperCase();
  }

  String _formatName(String fullName) {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '';
    if (parts.length == 1) return parts.first;
    return '${parts.first}\n${parts.last}';
  }

  Widget _buildAvatar(RankingModel user, double size, Color borderColor, {double padding = 2}) {
    final avatarUrl = _getAvatarUrl(user.avatar);
    
    return Container(
      width: size,
      height: size,
      padding: EdgeInsets.all(padding),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: Colors.white.withValues(alpha: 0.3),
        boxShadow: const [
          BoxShadow(
            color: Color(0x47000000),
            blurRadius: 18,
            offset: Offset(0, 10),
          ),
        ],
      ),
      child: Container(
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          border: Border.all(color: borderColor, width: 2),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(size / 2),
          child: avatarUrl.isNotEmpty
              ? Image.network(
                  avatarUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => _buildInitials(user, size),
                )
              : _buildInitials(user, size),
        ),
      ),
    );
  }

  Widget _buildInitials(RankingModel user, double size) {
    return Container(
      color: const Color(0xFFF1F5F9),
      alignment: Alignment.center,
      child: Text(
        _getInitials(user.nome),
        style: GoogleFonts.plusJakartaSans(
          fontSize: size * 0.4,
          fontWeight: FontWeight.bold,
          color: const Color(0xFF475569),
        ),
      ),
    );
  }

  Widget _buildPodiumPlace(RankingModel user, int rank) {
    final bool isFirst = rank == 1;
    final double avatarSize = isFirst ? 76.0 : 60.0;
    final double pillarHeight = isFirst ? 140.0 : (rank == 2 ? 100.0 : 80.0);
    
    Color pillarColor;
    Color borderColor;
    String medalText;
    
    if (isFirst) {
      pillarColor = const Color(0xFFF59E0B);
      borderColor = const Color(0xFFFEF08A);
      medalText = 'GOLD';
    } else if (rank == 2) {
      pillarColor = const Color(0xFF8E9CAE);
      borderColor = const Color(0xFFCBD5E1);
      medalText = 'SILVER';
    } else {
      pillarColor = const Color(0xFFC26325);
      borderColor = const Color(0xFFF59E0B); // Amber 500
      medalText = 'BRONZE';
    }
    
    return Expanded(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          // Avatar and Crown
          Stack(
            alignment: Alignment.topCenter,
            clipBehavior: Clip.none,
            children: [
              Padding(
                padding: EdgeInsets.only(top: isFirst ? 16.0 : 8.0),
                child: _buildAvatar(user, avatarSize, borderColor),
              ),
              if (isFirst)
                Positioned(
                  top: -8,
                  child: AnimatedBuilder(
                    animation: _crownController,
                    builder: (context, child) {
                      return Transform.translate(
                        offset: Offset(0, -6 * _crownController.value),
                        child: child,
                      );
                    },
                    child: const Text('👑', style: TextStyle(fontSize: 28)),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            _formatName(user.nome),
            textAlign: TextAlign.center,
            style: GoogleFonts.plusJakartaSans(
              fontSize: isFirst ? 16 : 14,
              fontWeight: FontWeight.bold,
              color: Colors.white,
              letterSpacing: 0.5,
              height: 1.1,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
            margin: const EdgeInsets.only(bottom: 12),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.2),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              '${user.pontos} pts',
              style: GoogleFonts.plusJakartaSans(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Colors.white,
              ),
            ),
          ),
          // Pillar
          Container(
            width: double.infinity,
            height: pillarHeight,
            margin: const EdgeInsets.symmetric(horizontal: 4),
            decoration: BoxDecoration(
              color: pillarColor,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
              border: Border(
                top: BorderSide(color: borderColor, width: 2),
              ),
              boxShadow: const [
                BoxShadow(
                  color: Colors.black26,
                  blurRadius: 10,
                  offset: Offset(0, -2),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  rank.toString(),
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: isFirst ? 36 : 28,
                    fontWeight: FontWeight.w900,
                    color: Colors.white,
                    height: 1,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  medalText,
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                    color: Colors.white.withValues(alpha: 0.8),
                    letterSpacing: 1,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTopHeader(AppLocalizations l10n) {
    final top1 = _rankingData.isNotEmpty ? _rankingData[0] : null;
    final top2 = _rankingData.length > 1 ? _rankingData[1] : null;
    final top3 = _rankingData.length > 2 ? _rankingData[2] : null;

    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          colors: [Color(0xFF155DFC), Color(0xFF1E69FD), Color(0xFF369FFF)],
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black12,
            blurRadius: 10,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          children: [
            // Custom App Bar
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new, color: Colors.white, size: 22),
                    onPressed: () => Navigator.pop(context),
                  ),
                  Text(
                    l10n.generalRankingTitle,
                    style: GoogleFonts.plusJakartaSans(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.refresh, color: Colors.white, size: 24),
                    onPressed: _fetchRanking,
                  ),
                ],
              ),
            ),
            // Podium
            if (_rankingData.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    if (top2 != null) _buildPodiumPlace(top2, 2) else const Expanded(child: SizedBox()),
                    if (top1 != null) _buildPodiumPlace(top1, 1) else const Expanded(child: SizedBox()),
                    if (top3 != null) _buildPodiumPlace(top3, 3) else const Expanded(child: SizedBox()),
                  ],
                ),
              )
            else
              const SizedBox(height: 150), // Spacer if empty
          ],
        ),
      ),
    );
  }

  Widget _buildRankingList(AppLocalizations l10n) {
    if (_rankingData.length <= 3) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32.0),
          child: Text(
            l10n.noMoreConsultants,
            style: GoogleFonts.plusJakartaSans(color: Colors.grey.shade500),
          ),
        ),
      );
    }

    final listData = _rankingData.sublist(3);

    return ListView.separated(
      padding: const EdgeInsets.all(16),
      itemCount: listData.length,
      separatorBuilder: (context, index) => const SizedBox(height: 10),
      itemBuilder: (context, index) {
        final user = listData[index];

        return Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF1F5F9)),
            boxShadow: const [
              BoxShadow(
                color: Color(0x08000000),
                blurRadius: 10,
                offset: Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              SizedBox(
                width: 36,
                child: Text(
                  '${user.rank}º',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF64748B),
                  ),
                  textAlign: TextAlign.center,
                ),
              ),
              const SizedBox(width: 8),
              _buildAvatar(user, 48, Colors.transparent, padding: 0),
              const SizedBox(width: 14),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      user.nome,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF0F172B),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      user.serviceLine,
                      style: GoogleFonts.plusJakartaSans(
                        fontSize: 11,
                        color: const Color(0xFF64748B),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFEFF6FF),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${user.pontos} pts',
                  style: GoogleFonts.plusJakartaSans(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: const Color(0xFF1D4ED8),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF155DFC)))
          : _errorMessage.isNotEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline, size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text(
                        _errorMessage,
                        style: GoogleFonts.plusJakartaSans(color: Colors.red),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _fetchRanking,
                        child: Text(l10n.tryAgainAction),
                      ),
                    ],
                  ),
                )
              : _rankingData.isEmpty
                  ? Column(
                      children: [
                        _buildTopHeader(l10n),
                        Expanded(
                          child: Center(
                            child: Text(
                              l10n.noRankingData,
                              style: GoogleFonts.plusJakartaSans(color: Colors.grey),
                            ),
                          ),
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        _buildTopHeader(l10n),
                        Expanded(child: _buildRankingList(l10n)),
                      ],
                    ),
    );
  }
}
