import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:projeto_pratico/riverpood/auth_notifier.dart';
import 'package:projeto_pratico/services/area_service.dart';
import 'package:projeto_pratico/services/learning_path_service.dart';
import 'package:projeto_pratico/models/learning_path_model.dart';
import 'package:projeto_pratico/models/service_line_model.dart';
import 'package:projeto_pratico/models/area_model.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class AreaSelectionScreen extends ConsumerStatefulWidget {
  const AreaSelectionScreen({super.key});

  @override
  ConsumerState<AreaSelectionScreen> createState() => _AreaSelectionScreenState();
}

class _AreaSelectionScreenState extends ConsumerState<AreaSelectionScreen> {
  int _currentStep = 0; // 0: LP, 1: SL, 2: Area
  bool _isLoading = true;
  bool _isSaving = false;

  List<LearningPathModel> _learningPaths = [];
  List<ServiceLineModel> _serviceLines = [];
  List<AreaModel> _areas = [];

  LearningPathModel? _selectedLP;
  ServiceLineModel? _selectedSL;
  AreaModel? _selectedArea;

  final LearningPathService _lpService = LearningPathService();
  final AreaService _areaService = AreaService();

  @override
  void initState() {
    super.initState();
    _loadLearningPaths();
  }

  Future<void> _loadLearningPaths() async {
    setState(() => _isLoading = true);
    final lps = await _lpService.fetchAllLearningPaths();
    if (mounted) {
      setState(() {
        _learningPaths = lps;
        _isLoading = false;
      });
    }
  }

  Future<void> _loadServiceLines(int idLp) async {
    setState(() => _isLoading = true);
    final sls = await _lpService.fetchServiceLinesByLP(idLp);
    if (mounted) {
      setState(() {
        _serviceLines = sls;
        _isLoading = false;
        _currentStep = 1;
      });
    }
  }

  Future<void> _loadAreas(int idSl) async {
    setState(() => _isLoading = true);
    final areas = await _lpService.fetchAreasBySL(idSl);
    if (mounted) {
      setState(() {
        _areas = areas;
        _isLoading = false;
        _currentStep = 2;
      });
    }
  }

  void _goBack() {
    setState(() {
      if (_currentStep == 2) {
        _currentStep = 1;
        _selectedArea = null;
      } else if (_currentStep == 1) {
        _currentStep = 0;
        _selectedSL = null;
      }
    });
  }

  Future<void> _confirmSelection() async {
    if (_selectedArea == null) return;

    setState(() => _isSaving = true);

    try {
      final authNotifier = ref.read(authProvider.notifier);
      await authNotifier.updateSelectedArea(_selectedArea!.nome, _selectedArea!.idArea);

      final authState = ref.read(authProvider);
      await _areaService.updateUserArea(authState.user!.nPessoa, _selectedArea!.idArea);

      if (mounted) {
        if (!authState.user!.rgpdConsent) {
          Navigator.pushReplacementNamed(context, '/rgpd_screen');
        } else {
          Navigator.pushReplacementNamed(context, '/main');
        }
      }
    } catch (e) {
      debugPrint('Erro ao gravar área: $e');
      if (mounted) {
        Navigator.pushReplacementNamed(context, '/main');
      }
    }
  }

  Widget _buildStepIndicator(AppLocalizations l10n) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _buildDot(0, l10n.learningPath),
        _buildLine(0),
        _buildDot(1, l10n.serviceLine),
        _buildLine(1),
        _buildDot(2, l10n.area),
      ],
    );
  }

  Widget _buildDot(int stepIndex, String label) {
    bool isCompleted = _currentStep > stepIndex;
    bool isActive = _currentStep == stepIndex;
    Color color = isActive || isCompleted ? const Color(0xFF155DFC) : Colors.grey.shade300;

    return Column(
      children: [
        Container(
          width: 24,
          height: 24,
          decoration: BoxDecoration(
            color: isActive ? Colors.white : color,
            shape: BoxShape.circle,
            border: Border.all(color: color, width: 2),
          ),
          child: Center(
            child: isCompleted
                ? const Icon(Icons.check, size: 16, color: Colors.white)
                : isActive
                    ? Container(width: 10, height: 10, decoration: const BoxDecoration(color: Color(0xFF155DFC), shape: BoxShape.circle))
                    : null,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(
            fontSize: 10,
            fontWeight: isActive ? FontWeight.bold : FontWeight.normal,
            color: isActive ? const Color(0xFF155DFC) : Colors.grey,
          ),
        )
      ],
    );
  }

  Widget _buildLine(int stepIndex) {
    bool isCompleted = _currentStep > stepIndex;
    return Container(
      width: 40,
      height: 2,
      margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 12),
      color: isCompleted ? const Color(0xFF155DFC) : Colors.grey.shade300,
    );
  }

  Widget _buildCard({
    required String title,
    required String? description,
    required bool isSelected,
    required VoidCallback onTap,
  }) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFF155DFC).withValues(alpha: 0.05) : Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: isSelected ? const Color(0xFF155DFC) : Colors.grey.shade300,
            width: isSelected ? 2 : 1,
          ),
          boxShadow: [
            if (!isSelected)
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 8,
                offset: const Offset(0, 4),
              )
          ],
        ),
        child: Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF155DFC) : Colors.grey.shade100,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Icon(
                Icons.account_tree_rounded,
                color: isSelected ? Colors.white : Colors.grey.shade600,
              ),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: isSelected ? const Color(0xFF155DFC) : const Color(0xFF0F172B),
                    ),
                  ),
                  if (description != null && description.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      description,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ]
                ],
              ),
            ),
            if (isSelected) const Icon(Icons.check_circle_rounded, color: Color(0xFF155DFC))
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context)!;
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172B)),
                onPressed: _goBack,
              )
            : null,
      ),
      body: SafeArea(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8.0),
              child: Text(
                l10n.configureProfileTitle,
                style: const TextStyle(
                  color: Color(0xFF0E162B),
                  fontSize: 24,
                  fontFamily: 'Arimo',
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 24.0),
              child: Text(
                l10n.configureProfileSubtitle,
                textAlign: TextAlign.center,
                style: const TextStyle(
                  color: Color(0xFF6A7282),
                  fontSize: 14,
                  fontFamily: 'Arimo',
                ),
              ),
            ),
            const SizedBox(height: 24),
            _buildStepIndicator(l10n),
            const SizedBox(height: 24),
            Expanded(
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: Color(0xFF155DFC)))
                  : ListView(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      children: [
                        if (_currentStep == 0) ...[
                          Text(l10n.selectLearningPath, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 16),
                          ..._learningPaths.map((lp) => _buildCard(
                                title: lp.nome,
                                description: lp.descricao,
                                isSelected: _selectedLP?.idLearningPath == lp.idLearningPath,
                                onTap: () {
                                  setState(() => _selectedLP = lp);
                                  _loadServiceLines(lp.idLearningPath);
                                },
                              ))
                        ] else if (_currentStep == 1) ...[
                          Text(l10n.selectServiceLine, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 16),
                          ..._serviceLines.map((sl) => _buildCard(
                                title: sl.nome,
                                description: '',
                                isSelected: _selectedSL?.idServiceLine == sl.idServiceLine,
                                onTap: () {
                                  setState(() => _selectedSL = sl);
                                  _loadAreas(sl.idServiceLine);
                                },
                              ))
                        ] else if (_currentStep == 2) ...[
                          Text(l10n.selectArea, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          const SizedBox(height: 16),
                          ..._areas.map((area) => _buildCard(
                                title: area.nome,
                                description: '',
                                isSelected: _selectedArea?.idArea == area.idArea,
                                onTap: () {
                                  setState(() => _selectedArea = area);
                                },
                              ))
                        ]
                      ],
                    ),
            ),
            if (_currentStep == 2 && _selectedArea != null)
              Padding(
                padding: const EdgeInsets.all(24.0),
                child: GestureDetector(
                  onTap: _isSaving ? null : _confirmSelection,
                  child: Container(
                    width: double.infinity,
                    height: 50,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(
                        colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
                      ),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Center(
                      child: _isSaving
                          ? const CircularProgressIndicator(color: Colors.white)
                          : Text(
                              l10n.confirmArea,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
