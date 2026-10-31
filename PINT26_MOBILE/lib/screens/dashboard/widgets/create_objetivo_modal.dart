import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/models/objetivo_model.dart';
import 'package:projeto_pratico/riverpood/objetivo_notifier.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

Future<void> showCreateObjetivoModal(BuildContext context, WidgetRef ref) async {
  var tiposDisponiveis = ref.read(objetivoProvider).tiposDisponiveis;
  
  if (tiposDisponiveis.isEmpty) {
    await ref.read(objetivoProvider.notifier).loadData();
    tiposDisponiveis = ref.read(objetivoProvider).tiposDisponiveis;
  }

  if (!context.mounted) return;

  if (tiposDisponiveis.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(AppLocalizations.of(context)!.noObjectiveTypesAvailable)),
    );
    return;
  }

  showModalBottomSheet(
    context: context,
    isScrollControlled: true,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
    ),
    builder: (context) => _CreateObjetivoModalContent(tipos: tiposDisponiveis),
  );
}

class _CreateObjetivoModalContent extends ConsumerStatefulWidget {
  final List<TipoObjetivoModel> tipos;

  const _CreateObjetivoModalContent({required this.tipos});

  @override
  ConsumerState<_CreateObjetivoModalContent> createState() => _CreateObjetivoModalContentState();
}

class _CreateObjetivoModalContentState extends ConsumerState<_CreateObjetivoModalContent> {
  TipoObjetivoModel? tipoSelecionado;
  
  final _qtdBadgesController = TextEditingController();
  final _qtdPontosController = TextEditingController();
  final _qtdDiversidadeController = TextEditingController();
  final _prazoValorController = TextEditingController();
  String _unidadePrazo = 'dias';
  String _tipoDiversidade = 'area';

  bool _isSaving = false;

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.of(context).viewInsets.bottom;
    
    return Padding(
      padding: EdgeInsets.only(bottom: bottomPadding, left: 24, right: 24, top: 24),
      child: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              AppLocalizations.of(context)!.newObjective,
              style: GoogleFonts.inter(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            
            // TIPO DE OBJETIVO
            DropdownButtonFormField<TipoObjetivoModel>(
              decoration: InputDecoration(
                labelText: AppLocalizations.of(context)!.objectiveType,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              initialValue: tipoSelecionado,
              isExpanded: true,
              hint: Text(AppLocalizations.of(context)!.select),
              items: widget.tipos.map((tipo) {
                return DropdownMenuItem<TipoObjetivoModel>(
                  value: tipo,
                  child: Text(tipo.getTitulo(Localizations.localeOf(context).languageCode), overflow: TextOverflow.ellipsis),
                );
              }).toList(),
              onChanged: (val) {
                setState(() {
                  tipoSelecionado = val;
                });
              },
            ),
            
            if (tipoSelecionado != null) ...[
              const SizedBox(height: 8),
              Text(
                tipoSelecionado!.getDescricao(Localizations.localeOf(context).languageCode),
                style: GoogleFonts.inter(color: Colors.grey.shade600, fontSize: 13),
              ),
              const SizedBox(height: 16),
              
              // CAMPOS DINÂMICOS CONSOANTE O TIPO
              ..._buildDynamicFields(),
              const SizedBox(height: 24),
              
              SizedBox(
                width: double.infinity,
                height: 48,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _guardarObjetivo,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF155DFC),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: _isSaving 
                    ? const CircularProgressIndicator(color: Colors.white)
                    : Text(AppLocalizations.of(context)!.createObjectiveAction, style: const TextStyle(color: Colors.white, fontSize: 16)),
                ),
              ),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  List<Widget> _buildDynamicFields() {
    if (tipoSelecionado == null) return [];
    final codigo = tipoSelecionado!.codigoTipo;
    List<Widget> fields = [];

    // Badges ou Pontos
    if (codigo.contains('BADGES')) {
      fields.add(_buildTextField(AppLocalizations.of(context)!.qtyBadges, _qtdBadgesController, TextInputType.number));
    } else if (codigo.contains('PONTOS')) {
      fields.add(_buildTextField(AppLocalizations.of(context)!.qtyPoints, _qtdPontosController, TextInputType.number));
    }

    // Diversidade
    if (codigo.contains('DIVERSIDADE')) {
      fields.add(const SizedBox(height: 16));
      fields.add(DropdownButtonFormField<String>(
        decoration: InputDecoration(
          labelText: AppLocalizations.of(context)!.diversityType,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
        initialValue: _tipoDiversidade,
        items: [
          DropdownMenuItem(value: 'area', child: Text(AppLocalizations.of(context)!.area)),
          DropdownMenuItem(value: 'service_line', child: Text(AppLocalizations.of(context)!.serviceLine)),
          DropdownMenuItem(value: 'learning_path', child: Text(AppLocalizations.of(context)!.learningPath)),
        ],
        onChanged: (v) => setState(() => _tipoDiversidade = v ?? 'area'),
      ));
      fields.add(const SizedBox(height: 16));
      fields.add(_buildTextField(AppLocalizations.of(context)!.qtyDiversity, _qtdDiversidadeController, TextInputType.number));
    }

    // Prazo
    if (codigo.contains('TEMPO')) {
      fields.add(const SizedBox(height: 16));
      fields.add(Row(
        children: [
          Expanded(child: _buildTextField(AppLocalizations.of(context)!.deadline, _prazoValorController, TextInputType.number)),
          const SizedBox(width: 12),
          Expanded(
            child: DropdownButtonFormField<String>(
              decoration: InputDecoration(
                labelText: AppLocalizations.of(context)!.unit,
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
              ),
              initialValue: _unidadePrazo,
              items: [
                DropdownMenuItem(value: 'dias', child: Text(AppLocalizations.of(context)!.days)),
                DropdownMenuItem(value: 'semanas', child: Text(AppLocalizations.of(context)!.weeks)),
                DropdownMenuItem(value: 'meses', child: Text(AppLocalizations.of(context)!.months)),
              ],
              onChanged: (v) => setState(() => _unidadePrazo = v ?? 'dias'),
            ),
          ),
        ],
      ));
    }

    return fields;
  }

  Widget _buildTextField(String label, TextEditingController controller, TextInputType type) {
    return TextField(
      controller: controller,
      keyboardType: type,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
      ),
    );
  }

  Future<void> _guardarObjetivo() async {
    setState(() => _isSaving = true);
    
    final payload = <String, dynamic>{
      'id_tipo_objetivo': tipoSelecionado!.idTipoObjetivo,
    };
    
    final codigo = tipoSelecionado!.codigoTipo;
    
    if (codigo.contains('BADGES')) {
      payload['quantidade_badges'] = int.tryParse(_qtdBadgesController.text);
    }
    if (codigo.contains('PONTOS')) {
      payload['quantidade_pontos'] = int.tryParse(_qtdPontosController.text);
    }
    if (codigo.contains('DIVERSIDADE')) {
      payload['tipo_diversidade'] = _tipoDiversidade;
      payload['quantidade_diversidade'] = int.tryParse(_qtdDiversidadeController.text);
    }
    if (codigo.contains('TEMPO')) {
      payload['prazo_valor'] = int.tryParse(_prazoValorController.text);
      payload['unidade_prazo'] = _unidadePrazo;
    }

    final success = await ref.read(objetivoProvider.notifier).criarObjetivo(payload);
    
    if (!mounted) return;
    
    if (success) {
      Navigator.pop(context);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context)!.objectiveCreatedSuccess)));
    } else {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(AppLocalizations.of(context)!.errorCreatingObjective, style: const TextStyle(color: Colors.white)), backgroundColor: Colors.red));
    }
    setState(() => _isSaving = false);
  }
}
