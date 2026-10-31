class NotificationModel {
  final String id;
  final String titulo;
  final String mensagem;
  final String tipo; // Descrição traduzida
  final String codigoTipo; // Código técnico (ex: candidatura_aprovada)
  final String emissor;
  final bool lida;
  final DateTime createdAt;

  NotificationModel({
    required this.id,
    required this.titulo,
    required this.mensagem,
    required this.tipo,
    required this.codigoTipo,
    required this.emissor,
    required this.lida,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    String getNotifText(dynamic field) {
      if (field == null) return '';
      if (field is Map) {
        return field['pt'] ?? field['en'] ?? field['es'] ?? '';
      }
      return field.toString();
    }

    final idNotificacao = json['id_notificacao']?.toString() ?? json['id']?.toString() ?? '';

    String emissorFinal = 'Sistema';
    if (json['notificador'] != null && json['notificador'] is Map) {
      final notificador = json['notificador'];
      final nome = notificador['nome'] ?? '';
      final apelido = notificador['apelido'] ?? '';
      final nomeCompleto = '$nome $apelido'.trim();
      if (nomeCompleto.isNotEmpty) {
        emissorFinal = nomeCompleto;
      }
    } else if (json['emissor'] != null && json['emissor'].toString().isNotEmpty) {
      emissorFinal = json['emissor'].toString();
    }

    DateTime parsedDate = DateTime.now();
    if (json['data_criacao'] != null) {
      parsedDate = DateTime.tryParse(json['data_criacao'].toString()) ?? parsedDate;
    } else if (json['createdAt'] != null) {
      parsedDate = DateTime.tryParse(json['createdAt'].toString()) ?? parsedDate;
    }

    return NotificationModel(
      id: idNotificacao,
      titulo: getNotifText(json['titulo']),
      mensagem: getNotifText(json['mensagem']),
      tipo: json['descricao_tipo']?.toString() ?? json['tipo']?.toString() ?? 'Geral',
      codigoTipo: json['tipo']?.toString() ?? json['codigo_tipo']?.toString() ?? '',
      emissor: emissorFinal,
      lida: json['lida'] == 1 || json['lida'] == true || json['lida'] == '1' || json['lida'] == 'true',
      createdAt: parsedDate,
    );
  }

  NotificationModel copyWith({bool? lida}) {
    return NotificationModel(
      id: id,
      titulo: titulo,
      mensagem: mensagem,
      tipo: tipo,
      codigoTipo: codigoTipo,
      emissor: emissor,
      lida: lida ?? this.lida,
      createdAt: createdAt,
    );
  }

  // ─── CATEGORIZAÇÃO SEGURA POR CÓDIGO TÉCNICO ────────────────────────────
  bool get isApproval {
    return codigoTipo == 'candidatura_aprovada' || codigoTipo == 'candidatura_pre_aprovada';
  }

  bool get isRejection {
    return codigoTipo == 'candidatura_rejeitada';
  }

  bool get isReturn {
    return codigoTipo == 'candidatura_retornada';
  }

  bool get isExpiration {
    return codigoTipo == 'sistema_alerta' && (titulo.toLowerCase().contains('expir') || titulo.toLowerCase().contains('validade'));
  }

  bool get isReminder {
    return codigoTipo == 'lembrete_prazo';
  }
  
  bool get isMilestone {
    return codigoTipo == 'sistema_alerta' && (titulo.toLowerCase().contains('marco') || titulo.toLowerCase().contains('milestone'));
  }

  bool get isForum {
    return codigoTipo == 'nova_postagem_miniforum';
  }

  /// Categoria simplificada para filtros na UI
  String get category {
    if (isApproval) return 'aprovacao';
    if (isRejection) return 'rejeicao';
    if (isReturn) return 'retorno';
    if (isExpiration) return 'expiracao';
    if (isReminder) return 'lembrete';
    if (isMilestone) return 'marco';
    if (isForum) return 'forum';
    return 'geral';
  }
}
