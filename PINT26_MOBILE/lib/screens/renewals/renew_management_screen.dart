import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/models/renovacao_model.dart';
import 'package:projeto_pratico/services/renovacao_service.dart';
import 'package:projeto_pratico/config/api_config.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';
import 'package:projeto_pratico/screens/renewals/renewal_evidence_screen.dart';
import 'package:projeto_pratico/screens/renewals/renewal_details_screen.dart';

class RenewManagementScreen extends StatefulWidget {
  const RenewManagementScreen({super.key});

  @override
  State<RenewManagementScreen> createState() => _RenewManagementScreenState();
}

class _RenewManagementScreenState extends State<RenewManagementScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final RenovacaoService _renovacaoService = RenovacaoService();

  bool _isLoadingElegiveis = true;
  List<RenovacaoElegivelModel> _elegiveis = [];

  bool _isLoadingMinhas = true;
  List<MinhaRenovacaoModel> _minhas = [];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _fetchDados();
  }

  Future<void> _fetchDados() async {
    _fetchElegiveis();
    _fetchMinhas();
  }

  Future<void> _fetchElegiveis() async {
    setState(() => _isLoadingElegiveis = true);
    try {
      final data = await _renovacaoService.fetchElegiveis();
      setState(() {
        _elegiveis = data;
        _isLoadingElegiveis = false;
      });
    } catch (e) {
      setState(() => _isLoadingElegiveis = false);
      debugPrint(e.toString());
    }
  }

  Future<void> _fetchMinhas() async {
    setState(() => _isLoadingMinhas = true);
    try {
      final data = await _renovacaoService.fetchMinhasRenovacoes();
      setState(() {
        _minhas = data;
        _isLoadingMinhas = false;
      });
    } catch (e) {
      setState(() => _isLoadingMinhas = false);
      debugPrint(e.toString());
    }
  }

  void _openRenewalEvidence(RenovacaoElegivelModel item) async {
    final result = await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (ctx) => RenewalEvidenceScreen(badgeItem: item),
      ),
    );
    if (result == true) {
      _fetchDados();
    }
  }



  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text(
          AppLocalizations.of(context)!.renewalsManagement,
          style: GoogleFonts.inter(
            color: const Color(0xFF0F172B),
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        centerTitle: true,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF155DFC),
          labelColor: const Color(0xFF155DFC),
          unselectedLabelColor: const Color(0xFF64748B),
          labelStyle:
              GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
          unselectedLabelStyle:
              GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14),
          tabs: [
            Tab(text: AppLocalizations.of(context)!.eligible),
            Tab(text: AppLocalizations.of(context)!.myApplicationsTab),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildElegiveisTab(),
          _buildMinhasTab(),
        ],
      ),
    );
  }

  Widget _buildElegiveisTab() {
    if (_isLoadingElegiveis) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_elegiveis.isEmpty) {
      return Center(
        child: Text(AppLocalizations.of(context)!.noBadgesToRenew),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchElegiveis,
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: _elegiveis.length,
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final item = _elegiveis[index];
          final isExpired = item.diasRestantes <= 0;
          final isPending = item.statusRenovacao == 'pendente';

          final logoUrl = item.badgeLogo != null
              ? '${ApiConfig.baseUrl}/uploads/logo_badges/${item.badgeLogo}'
              : null;

          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isExpired
                    ? Colors.red.withValues(alpha: 0.4)
                    : const Color(0xFFE2E8F0),
              ),
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
              children: [
                Row(
                  children: [
                    Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: logoUrl != null
                          ? ClipRRect(
                              borderRadius: BorderRadius.circular(12),
                              child: Image.network(
                                logoUrl,
                                fit: BoxFit.cover,
                                errorBuilder: (ctx, err, stack) =>
                                    const Icon(Icons.shield),
                              ),
                            )
                          : const Icon(Icons.shield),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            item.badgeNome,
                            style: GoogleFonts.inter(
                                fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          Text(
                            '${item.lpNome} • ${item.areaNome}',
                            style: GoogleFonts.inter(
                                fontSize: 12, color: const Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      '${AppLocalizations.of(context)!.renewalPointsPrefix}${item.pontosRenovacao}',
                      style: GoogleFonts.inter(
                          fontWeight: FontWeight.w600,
                          color: const Color(0xFF10B981)),
                    ),
                    Text(
                      isExpired
                          ? AppLocalizations.of(context)!.expired
                          : AppLocalizations.of(context)!.expiresInDays(item.diasRestantes.toString()),
                      style: GoogleFonts.inter(
                        color: isExpired ? Colors.red : const Color(0xFFD97706),
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (isPending)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFFBEB),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      AppLocalizations.of(context)!.pendingModeration,
                      style: GoogleFonts.inter(
                          color: const Color(0xFFD97706),
                          fontWeight: FontWeight.w600),
                    ),
                  )
                else
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        if (isPending) {
                          _openRenewalEvidence(item);
                        } else {
                          // Se já tem renovação pendente pode apenas retomar o upload
                          // O botão devia dizer continuar, mas para manter simples:
                          _openRenewalEvidence(item);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF155DFC),
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(8)),
                      ),
                      child: Text(AppLocalizations.of(context)!.renew,
                          style: const TextStyle(color: Colors.white)),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildMinhasTab() {
    if (_isLoadingMinhas) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_minhas.isEmpty) {
      return Center(
        child: Text(AppLocalizations.of(context)!.noRenewalRequestsSubmitted),
      );
    }

    return RefreshIndicator(
      onRefresh: _fetchMinhas,
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: _minhas.length,
        separatorBuilder: (context, index) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final item = _minhas[index];
          final isPending = item.renovacaoAprovada == null;
          final isApproved = item.renovacaoAprovada == true;
          final isRejected = item.renovacaoAprovada == false;

          final logoUrl = item.badgeLogo != null
              ? '${ApiConfig.baseUrl}/uploads/logo_badges/${item.badgeLogo}'
              : null;

          return InkWell(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (ctx) => RenewalDetailsScreen(renovacao: item),
                ),
              );
            },
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: const Color(0xFFE2E8F0)),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.04),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: const Color(0xFFF1F5F9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: logoUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: Image.network(
                              logoUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (ctx, err, stack) =>
                                  const Icon(Icons.shield),
                            ),
                          )
                        : const Icon(Icons.shield),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          item.badgeNome,
                          style: GoogleFonts.inter(
                              fontWeight: FontWeight.bold, fontSize: 15),
                        ),
                        Text(
                          '${item.dataPedido.day}/${item.dataPedido.month}/${item.dataPedido.year}',
                          style: GoogleFonts.inter(
                              fontSize: 12, color: const Color(0xFF64748B)),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 12),
                  if (isPending)
                    const Icon(Icons.schedule, color: Color(0xFFD97706))
                  else if (isApproved)
                    const Icon(Icons.check_circle, color: Color(0xFF10B981))
                  else if (isRejected)
                    const Icon(Icons.cancel, color: Colors.red),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}
