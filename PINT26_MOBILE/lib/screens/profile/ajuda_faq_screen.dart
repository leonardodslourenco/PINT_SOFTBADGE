import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:projeto_pratico/l10n/app_localizations.dart';

class AjudaFaqScreen extends StatefulWidget {
  const AjudaFaqScreen({super.key});

  @override
  State<AjudaFaqScreen> createState() => _AjudaFaqScreenState();
}

class _AjudaFaqScreenState extends State<AjudaFaqScreen> {
  int? _expandedIndex;

  final List<Map<String, String>> _faqs = [
    {
      'question': 'Como ganho badges?',
      'answer':
          'Os badges são atribuídos automaticamente quando completares as evidências de uma Learning Path. O teu progresso é avaliado e, ao atingir os critérios definidos, o badge é concedido.',
    },
    {
      'question': 'O que são pontos e para que servem?',
      'answer':
          'Os pontos acumulam-se à medida que completas badges. Funcionam como uma métrica do teu crescimento profissional na plataforma e poderão desbloquear futuros benefícios.',
    },
    {
      'question': 'Como submeto evidências?',
      'answer':
          'Vai a "Evidências" no menu principal, seleciona a Learning Path correspondente e preenche os campos solicitados. Podes anexar documentos, links ou descrições detalhadas.',
    },
    {
      'question': 'O que acontece se a minha candidatura for devolvida?',
      'answer':
          'Será notificado e a candidatura aparece na secção "Retornadas". Podes corrigir as evidências indicadas e reenviar novamente para avaliação.',
    },
    {
      'question': 'Posso alterar os meus dados de perfil?',
      'answer':
          'Sim. Em Perfil > Definições de Perfil podes atualizar o teu nome, apelido e email. As alterações ficam sincronizadas com o servidor.',
    },
    {
      'question': 'A aplicação funciona sem internet?',
      'answer':
          'A aplicação necessita de ligação à internet para sincronizar dados. Alguns conteúdos podem estar disponíveis em cache, mas a submissão de evidências requer ligação ativa.',
    },
    {
      'question': 'Como contacto o suporte?',
      'answer':
          'Para questões não respondidas aqui, envia um email para suporte@softinsa.pt. A equipa responde em 1-2 dias úteis.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          AppLocalizations.of(context)!.helpFaqTitle,
          style: GoogleFonts.plusJakartaSans(
            color: const Color(0xFF0F172A),
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
      ),
      body: ListView(
        physics: const BouncingScrollPhysics(),
        padding: const EdgeInsets.all(24),
        children: [
          // Header card
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF155DFC), Color(0xFF369FFF)],
              ),
              borderRadius: BorderRadius.circular(16),
              boxShadow: const [
                BoxShadow(
                  color: Color(0x33155DFC),
                  blurRadius: 10,
                  offset: Offset(0, 4),
                ),
              ],
            ),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(14),
                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                  ),
                  child: const Icon(Icons.help_outline_rounded, color: Colors.white, size: 26),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        AppLocalizations.of(context)!.faqHeaderTitle,
                        style: GoogleFonts.plusJakartaSans(
                          color: Colors.white,
                          fontSize: 15,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        AppLocalizations.of(context)!.faqHeaderSubtitle,
                        style: GoogleFonts.plusJakartaSans(
                          color: Colors.white.withOpacity(0.9),
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 32),

          // FAQ list
          Text(
            AppLocalizations.of(context)!.frequentQuestionsTitle,
            style: GoogleFonts.plusJakartaSans(
              color: const Color(0xFF64748B),
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 16),
          Container(
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
            child: ClipRRect(
              borderRadius: BorderRadius.circular(16),
              child: Column(
                children: List.generate(_faqs.length, (index) {
                  final isExpanded = _expandedIndex == index;
                  final isLast = index == _faqs.length - 1;
                  return _buildFaqItem(
                    question: _faqs[index]['question']!,
                    answer: _faqs[index]['answer']!,
                    isExpanded: isExpanded,
                    showDivider: !isLast,
                    onTap: () {
                      setState(() {
                        _expandedIndex = isExpanded ? null : index;
                      });
                    },
                  );
                }),
              ),
            ),
          ),
          const SizedBox(height: 32),

          // Contact card
          Text(
            AppLocalizations.of(context)!.stillHaveQuestionsTitle,
            style: GoogleFonts.plusJakartaSans(
              color: const Color(0xFF64748B),
              fontSize: 14,
              fontWeight: FontWeight.bold,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 16),
          Container(
            width: double.infinity,
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
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {},
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: const Color(0xFFEFF6FF),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(Icons.mail_outline_rounded, color: Color(0xFF155DFC), size: 22),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              AppLocalizations.of(context)!.contactSupportTitle,
                              style: GoogleFonts.plusJakartaSans(
                                color: const Color(0xFF0F172A),
                                fontSize: 15,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                            const SizedBox(height: 3),
                            Text(
                              'suporte@softinsa.pt',
                              style: GoogleFonts.plusJakartaSans(
                                color: const Color(0xFF64748B),
                                fontSize: 13,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFFCBD5E1), size: 14),
                    ],
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildFaqItem({
    required String question,
    required String answer,
    required bool isExpanded,
    required bool showDivider,
    required VoidCallback onTap,
  }) {
    return Column(
      children: [
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: onTap,
            child: AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              color: isExpanded ? const Color(0xFFF8FAFC) : Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  AnimatedRotation(
                    turns: isExpanded ? 0.25 : 0,
                    duration: const Duration(milliseconds: 200),
                    child: const Icon(Icons.arrow_forward_ios_rounded, color: Color(0xFF155DFC), size: 14),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      question,
                      style: GoogleFonts.plusJakartaSans(
                        color: isExpanded ? const Color(0xFF155DFC) : const Color(0xFF0F172A),
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
        AnimatedSize(
          duration: const Duration(milliseconds: 250),
          curve: Curves.easeInOut,
          child: isExpanded
              ? Container(
                  color: const Color(0xFFF8FAFC),
                  padding: const EdgeInsets.fromLTRB(46, 0, 20, 16),
                  child: Text(
                    answer,
                    style: GoogleFonts.plusJakartaSans(
                      color: const Color(0xFF64748B),
                      fontSize: 13,
                      height: 1.6,
                    ),
                  ),
                )
              : const SizedBox.shrink(),
        ),
        if (showDivider)
          const Divider(height: 1, thickness: 1, color: Color(0xFFF1F5F9), indent: 0, endIndent: 0),
      ],
    );
  }
}
