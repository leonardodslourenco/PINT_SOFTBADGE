const TraducaoConteudo = require('./traducao_conteudo.model')
const Perfil = require('./perfil.model')
const LearningPath = require('./learning_path.model')
const ServiceLine = require('./service_line.model')
const Area = require('./area.model')
const NivelArea = require('./nivel.model')
const RequisitoBadge = require('./requisito_badge.model')
const Badge = require('./badge.model')
const Utilizador = require('./utilizador.model')
const PerfilUtilizador = require('./perfil_utilizador.model')
const EstadoCandidatura = require('./estado_candidatura.model')
const TipoAcao = require('./tipo_acao.model')
const Candidatura = require('./candidatura_badge.model')
const AcaoCandidatura = require('./acao_candidatura.model')
const EvidenciaCandidatura = require('./evidencia.model')
const BadgeAtribuido = require('./badge_atribuido.model')
const Competencia = require('./competencia.model')
const CompetenciaBadge = require('./competencia_badge.model')
const CategoriaMiniforum = require('./categoria_miniforum.model')
const PostagemMiniforum = require('./postagem_miniforum.model')
const LeituraPostagem = require('./leitura_postagem.model')
const TipoNotificacao = require('./tipo_notificacao.model')
const Notificacao = require('./notificacao.model')
const ConfiguracaoSLA = require('./configuracao_sla.model')
const RenovacaoBadge = require('./renovacao_badge.model')
const EvidenciaRenovacao = require('./evidencia_renovacao.model')
const TipoObjetivo = require('./tipo_objetivo.model')
const ObjetivoConsultor = require('./objetivo_consultor.model')

function applyAssociations() {

Perfil.belongsTo(TraducaoConteudo, {
  foreignKey: {
    name: 'id_traducao_perfil',
    allowNull: false
  },  
  as: 'traducao_perfil',
  onUpdate: 'CASCADE',
  onDelete: 'RESTRICT',
  constraints: true
})

// LEARNING PATH → TRADUÇÃO (nome)
  LearningPath.belongsTo(TraducaoConteudo, {
    foreignKey: {
      name: 'id_traducao_learning_path',
      allowNull: false
    },
    as: 'traducao_learning_path',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    constraints: true
  })

  // LEARNING PATH → TRADUÇÃO (descrição)
  LearningPath.belongsTo(TraducaoConteudo, {
    foreignKey: {
      name: 'id_traducao_descricao_lp',
      allowNull: false
    },    
    as: 'traducao_descricao_lp',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    constraints: true
  })

  ServiceLine.belongsTo(LearningPath, {
    foreignKey: {
      name: 'id_learning_path',
      allowNull: false
    },
    as: 'learning_path',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    constraints: true
  })
  LearningPath.hasMany(ServiceLine, {
    foreignKey: 'id_learning_path',
    as: 'service_lines'
  })

  ServiceLine.belongsTo(TraducaoConteudo, {
    foreignKey: {
      name: 'id_traducao_service_line',
      allowNull: false
    },
    as: 'traducao_service_line',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    constraints: true
  })
  TraducaoConteudo.hasMany(ServiceLine, {
    foreignKey: 'id_traducao_service_line',
    as: 'service_lines'
  })

  ServiceLine.belongsTo(Utilizador, {
    foreignKey: {
      name: 'id_sl_lider',
      allowNull: true
    },
    as: 'lider_service_line',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL',
    constraints: true
  })
  Utilizador.hasOne(ServiceLine, {
    foreignKey: 'id_sl_lider',
    as: 'service_line_lider'
  })

  // UTILIZADOR <-> SERVICE LINE (membro)
  Utilizador.belongsTo(ServiceLine, {
    foreignKey: 'id_sl',
    as: 'service_line',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });
  ServiceLine.hasMany(Utilizador, {
    foreignKey: 'id_sl',
    as: 'membros'
  });

  // UTILIZADOR <-> AREA (área de preferência)
  Utilizador.belongsTo(Area, {
    foreignKey: 'id_area',
    as: 'area_preferencia',
    onUpdate: 'CASCADE',
    onDelete: 'SET NULL'
  });
  Area.hasMany(Utilizador, {
    foreignKey: 'id_area',
    as: 'utilizadores_preferencia'
  });

  Area.belongsTo(ServiceLine, {
    foreignKey: {
      name: 'id_service_line',
      allowNull: false
    },
    as: 'service_line',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    constraints: true
  })
  ServiceLine.hasMany(Area, {
    foreignKey: 'id_service_line',
    as: 'areas'
  })

  // AREA -> TRADUCAO
  Area.belongsTo(TraducaoConteudo, {
    foreignKey: {
      name: 'id_traducao_area',
      allowNull: false
    },
    as: 'traducao_area',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    constraints: true
  })
  TraducaoConteudo.hasMany(Area, {
    foreignKey: 'id_traducao_area',
    as: 'areas_traducoes'
  })

  Utilizador.belongsToMany(Perfil, {
    through: PerfilUtilizador,
    foreignKey: 'id_utilizador',
    otherKey: 'id_perfil',
    as: 'perfis'
  })

  Perfil.belongsToMany(Utilizador, {
    through: PerfilUtilizador,
    foreignKey: 'id_perfil',
    otherKey: 'id_utilizador',
    as: 'utilizadores',
    constraints: false
  })

  PerfilUtilizador.belongsTo(Utilizador, {
    foreignKey: 'id_utilizador'
  });

  PerfilUtilizador.belongsTo(Perfil, {
    foreignKey: 'id_perfil',
    constraints: false
  });

  // UTILIZADOR → PERFIL_UTILIZADOR (associação direta para queries com include)
  Utilizador.hasMany(PerfilUtilizador, {
    foreignKey: 'id_utilizador',
    as: 'perfil_utilizador_entries'
  });

  // NIVEL AREA <-> AREA
  NivelArea.belongsTo(Area, {
    foreignKey: 'id_area_sl',
    as: 'area',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });
  Area.hasMany(NivelArea, {
    foreignKey: 'id_area_sl',
    as: 'niveis'
  });

  // NIVEL AREA <-> TRADUCAO
  NivelArea.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_nivel_area',
    as: 'traducao_nivel_area',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });
  TraducaoConteudo.hasMany(NivelArea, {
    foreignKey: 'id_traducao_nivel_area',
    as: 'traducoes_niveis'
  });

  // REQUISITO <-> BADGE
  RequisitoBadge.belongsTo(Badge, {
    foreignKey: 'id_badge',
    as: 'badge',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });
  Badge.hasMany(RequisitoBadge, {
    foreignKey: 'id_badge',
    as: 'requisitos'
  });

  // REQUISITO <-> TRADUCOES
  RequisitoBadge.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_requisito',
    as: 'traducao_titulo',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });
  RequisitoBadge.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_subtitulo_req',
    as: 'traducao_subtitulo',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });
  RequisitoBadge.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_descritivo_req',
    as: 'traducao_descricao',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });

  // BADGE <-> NIVEL AREA
  Badge.belongsTo(NivelArea, {
    foreignKey: 'id_nivel_area',
    as: 'nivel_area',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });
  NivelArea.hasMany(Badge, {
    foreignKey: 'id_nivel_area',
    as: 'badges'
  });

  // BADGE <-> TRADUCOES
  Badge.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_badge',
    as: 'traducao_titulo',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });
  Badge.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_descricao_badge',
    as: 'traducao_descricao',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });

  // CANDIDATURA <-> UTILIZADOR / BADGE / ESTADO
  Candidatura.belongsTo(Utilizador, { foreignKey: 'id_utilizador', as: 'consultor' });
  Utilizador.hasMany(Candidatura, { foreignKey: 'id_utilizador', as: 'candidaturas' });
  
  Candidatura.belongsTo(Badge, { foreignKey: 'id_badge', as: 'badge' });
  Badge.hasMany(Candidatura, { foreignKey: 'id_badge', as: 'badge_candidaturas' });

  Candidatura.belongsTo(EstadoCandidatura, { foreignKey: 'id_estado_candidatura', as: 'estado' });

  // ACAO CANDIDATURA <-> CANDIDATURA / UTILIZADOR / TIPO_ACAO / TRADUCAO
  AcaoCandidatura.belongsTo(Candidatura, { foreignKey: 'id_candidatura', as: 'candidatura' });
  Candidatura.hasMany(AcaoCandidatura, { foreignKey: 'id_candidatura', as: 'acoes' });

  AcaoCandidatura.belongsTo(Utilizador, { foreignKey: 'id_utilizador', as: 'autor_acao' });
  AcaoCandidatura.belongsTo(TipoAcao, { foreignKey: 'tipo_acao_candidatura', as: 'tipo_acao' });
  AcaoCandidatura.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_comentario_acao', as: 'comentario' });

  // EVIDENCIA <-> CANDIDATURA / REQUISITO / VALIDATORS
  EvidenciaCandidatura.belongsTo(Candidatura, { foreignKey: 'id_candidatura', as: 'candidatura' });
  Candidatura.hasMany(EvidenciaCandidatura, { foreignKey: 'id_candidatura', as: 'evidencias' });

  EvidenciaCandidatura.belongsTo(RequisitoBadge, { foreignKey: 'id_requisito', as: 'requisito' });
  EvidenciaCandidatura.belongsTo(Utilizador, { foreignKey: 'id_tm_validador', as: 'tm_validador' });
  EvidenciaCandidatura.belongsTo(Utilizador, { foreignKey: 'id_sll_validador', as: 'sll_validador' });

  // ESTADO / TIPO ACAO <-> TRADUCAO
  EstadoCandidatura.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_estado_candidatura', as: 'traducao_estado' });
  TipoAcao.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_acao_candidatura', as: 'traducao_acao' });

  // BADGE ATRIBUÍDO
  BadgeAtribuido.belongsTo(Utilizador, { foreignKey: 'id_candidato', as: 'candidato' });
  Utilizador.hasMany(BadgeAtribuido, { foreignKey: 'id_candidato', as: 'badges_ganhos' });
  
  BadgeAtribuido.belongsTo(Badge, { foreignKey: 'id_badge', as: 'badge' });
  Badge.hasMany(BadgeAtribuido, { foreignKey: 'id_badge', as: 'atribuidos' });
  BadgeAtribuido.belongsTo(Candidatura, { foreignKey: 'id_candidatura', as: 'candidatura_origem' });

  // =========================================================================
  // ASSOCIAÇÕES COMPETÊNCIAS (SKILLS) & BADGES
  // =========================================================================
  Competencia.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_titulo_competencia',
    as: 'traducao_titulo',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });
  Competencia.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_descricao_competencia',
    as: 'traducao_descricao',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT'
  });

  Competencia.belongsToMany(Badge, {
    through: CompetenciaBadge,
    foreignKey: 'id_competencia',
    otherKey: 'id_badge',
    as: 'badges'
  });

  Badge.belongsToMany(Competencia, {
    through: CompetenciaBadge,
    foreignKey: 'id_badge',
    otherKey: 'id_competencia',
    as: 'competencias'
  });

  CompetenciaBadge.belongsTo(Competencia, {
    foreignKey: 'id_competencia',
    as: 'competencia'
  });
  Competencia.hasMany(CompetenciaBadge, {
    foreignKey: 'id_competencia',
    as: 'competencias_badge'
  });

  CompetenciaBadge.belongsTo(Badge, {
    foreignKey: 'id_badge',
    as: 'badge'
  });
  Badge.hasMany(CompetenciaBadge, {
    foreignKey: 'id_badge',
    as: 'competencias_badge'
  });

  // =========================================================================
  // ASSOCIAÇÕES MINIFÓRUM
  // =========================================================================
  CategoriaMiniforum.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_nome_categoria',
    as: 'traducao_nome_categoria'
  });

  PostagemMiniforum.belongsTo(Utilizador, {
    foreignKey: 'id_utilizador_autor',
    as: 'autor'
  });
  Utilizador.hasMany(PostagemMiniforum, {
    foreignKey: 'id_utilizador_autor',
    as: 'postagens_criadas'
  });

  PostagemMiniforum.belongsTo(CategoriaMiniforum, {
    foreignKey: 'id_categoria_miniforum',
    as: 'categoria'
  });
  CategoriaMiniforum.hasMany(PostagemMiniforum, {
    foreignKey: 'id_categoria_miniforum',
    as: 'postagens'
  });

  PostagemMiniforum.belongsTo(Perfil, {
    foreignKey: 'id_perfil_alvo',
    as: 'perfil_alvo'
  });

  PostagemMiniforum.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_titulo',
    as: 'traducao_titulo'
  });
  PostagemMiniforum.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_mensagem',
    as: 'traducao_mensagem'
  });

  LeituraPostagem.belongsTo(PostagemMiniforum, {
    foreignKey: 'id_postagem_miniforum',
    as: 'postagem'
  });
  PostagemMiniforum.hasMany(LeituraPostagem, {
    foreignKey: 'id_postagem_miniforum',
    as: 'leituras'
  });

  LeituraPostagem.belongsTo(Utilizador, {
    foreignKey: 'id_utilizador',
    as: 'utilizador'
  });

  // =========================================================================
  // ASSOCIAÇÕES NOTIFICAÇÕES INDIVIDUAIS
  // =========================================================================
  TipoNotificacao.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_descricao',
    as: 'traducao_descricao'
  });

  Notificacao.belongsTo(Utilizador, {
    foreignKey: 'id_user_notificador',
    as: 'notificador'
  });

  Notificacao.belongsTo(Utilizador, {
    foreignKey: 'id_user_alvo_notificacao',
    as: 'alvo'
  });
  Utilizador.hasMany(Notificacao, {
    foreignKey: 'id_user_alvo_notificacao',
    as: 'notificacoes_recebidas'
  });

  Notificacao.belongsTo(TipoNotificacao, {
    foreignKey: 'id_tipo_notificacao',
    as: 'tipo'
  });

  Notificacao.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_titulo',
    as: 'traducao_titulo'
  });
  Notificacao.belongsTo(TraducaoConteudo, {
    foreignKey: 'id_traducao_mensagem',
    as: 'traducao_mensagem'
  });

  // =========================================================================
  // ASSOCIAÇÕES CERTIFICADOS
  // =========================================================================
  const Certificado = require('./certificado.model');
  Certificado.belongsTo(Candidatura, { foreignKey: 'id_candidatura', as: 'candidatura' });
  Candidatura.hasOne(Certificado, { foreignKey: 'id_candidatura', as: 'certificado' });

  Certificado.belongsTo(Utilizador, { foreignKey: 'id_consultor', as: 'consultor' });
  Utilizador.hasMany(Certificado, { foreignKey: 'id_consultor', as: 'certificados' });

  Certificado.belongsTo(Badge, { foreignKey: 'id_badge', as: 'badge' });
  Badge.hasMany(Certificado, { foreignKey: 'id_badge', as: 'certificados' });

  // =========================================================================
  // ASSOCIAÇÕES ALERTAS DE EXPIRAÇÃO DE BADGES
  // =========================================================================
  const AlertaExpiracao = require('./alerta_expiracao.model');
  AlertaExpiracao.belongsTo(Candidatura, { foreignKey: 'id_candidatura', as: 'candidatura' });
  Candidatura.hasMany(AlertaExpiracao, { foreignKey: 'id_candidatura', as: 'alertas_expiracao' });

  AlertaExpiracao.belongsTo(Badge, { foreignKey: 'id_badge', as: 'badge' });
  Badge.hasMany(AlertaExpiracao, { foreignKey: 'id_badge', as: 'alertas_expiracao' });

  // =========================================================================
  // ASSOCIAÇÕES MARCOS (MILESTONES) & CELEBRAÇÕES
  // =========================================================================
  const TipoMarco = require('./tipo_marco.model');
  const ConfiguracaoMarco = require('./configuracao_marco.model');
  const UtilizadorMarco = require('./utilizador_marco.model');

  TipoMarco.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_titulo', as: 'traducao_titulo' });
  TipoMarco.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_descricao', as: 'traducao_descricao' });
  TipoMarco.hasMany(ConfiguracaoMarco, { foreignKey: 'id_tipo_marco', as: 'marcos' });

  ConfiguracaoMarco.belongsTo(TipoMarco, { foreignKey: 'id_tipo_marco', as: 'tipo_marco' });
  ConfiguracaoMarco.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_nome', as: 'traducao_nome' });
  ConfiguracaoMarco.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_descricao', as: 'traducao_descricao' });

  ConfiguracaoMarco.belongsToMany(Utilizador, {
    through: UtilizadorMarco,
    foreignKey: 'id_marco',
    otherKey: 'id_utilizador',
    as: 'utilizadores_conquistadores'
  });
  Utilizador.belongsToMany(ConfiguracaoMarco, {
    through: UtilizadorMarco,
    foreignKey: 'id_utilizador',
    otherKey: 'id_marco',
    as: 'marcos_conquistados'
  });

  UtilizadorMarco.belongsTo(Utilizador, { foreignKey: 'id_utilizador', as: 'utilizador' });
  Utilizador.hasMany(UtilizadorMarco, { foreignKey: 'id_utilizador', as: 'marcos_utilizador' });

  UtilizadorMarco.belongsTo(ConfiguracaoMarco, { foreignKey: 'id_marco', as: 'marco' });
  ConfiguracaoMarco.hasMany(UtilizadorMarco, { foreignKey: 'id_marco', as: 'marcos_utilizador' });

  // =========================================================================
  // ASSOCIAÇÕES BADGES DE CONQUISTAS ESPECIAIS (REQUISITO 14)
  // =========================================================================
  const TipoBadgeEspecial = require('./tipo_badge_especial.model');
  const ConquistaEspecial = require('./conquista_especial.model');
  const ConfiguracaoBadgeEspecial = require('./configuracao_badge_especial.model');
  const EstadoCandidaturaEspecial = require('./estado_candidatura_especial.model');
  const CandidaturaEspecial = require('./candidatura_especial.model');
  const ConquistaAtribuida = require('./conquista_atribuida.model');

  // TipoBadgeEspecial
  TipoBadgeEspecial.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_titulo', as: 'traducao_titulo' });
  TipoBadgeEspecial.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_descricao', as: 'traducao_descricao' });
  TipoBadgeEspecial.hasMany(ConfiguracaoBadgeEspecial, { foreignKey: 'id_tipo_badge_especial', as: 'configuracoes' });

  // ConquistaEspecial
  ConquistaEspecial.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_conquista_especial', as: 'traducao_titulo' });
  ConquistaEspecial.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_descricao_conquista_especial', as: 'traducao_descricao' });
  ConquistaEspecial.hasMany(ConfiguracaoBadgeEspecial, { foreignKey: 'id_conquista_especial', as: 'configuracoes' });
  ConquistaEspecial.hasMany(CandidaturaEspecial, { foreignKey: 'id_conquista_especial', as: 'candidaturas_especiais' });
  ConquistaEspecial.hasMany(ConquistaAtribuida, { foreignKey: 'id_conquista_especial', as: 'conquistas_atribuidas' });

  // ConfiguracaoBadgeEspecial
  ConfiguracaoBadgeEspecial.belongsTo(TipoBadgeEspecial, { foreignKey: 'id_tipo_badge_especial', as: 'tipo_badge_especial' });
  ConfiguracaoBadgeEspecial.belongsTo(ConquistaEspecial, { foreignKey: 'id_conquista_especial', as: 'conquista_especial' });
  ConfiguracaoBadgeEspecial.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_nome', as: 'traducao_nome' });
  ConfiguracaoBadgeEspecial.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_descricao', as: 'traducao_descricao' });

  // EstadoCandidaturaEspecial
  EstadoCandidaturaEspecial.belongsTo(TraducaoConteudo, { foreignKey: 'id_traducao_estado', as: 'traducao_estado' });
  EstadoCandidaturaEspecial.hasMany(CandidaturaEspecial, { foreignKey: 'id_estado_candidatura_especial', as: 'candidaturas_especiais', constraints: false });

  // CandidaturaEspecial
  CandidaturaEspecial.belongsTo(Utilizador, { foreignKey: 'id_utilizador', as: 'consultor' });
  Utilizador.hasMany(CandidaturaEspecial, { foreignKey: 'id_utilizador', as: 'candidaturas_especiais' });

  CandidaturaEspecial.belongsTo(ConquistaEspecial, { foreignKey: 'id_conquista_especial', as: 'conquista_especial' });
  CandidaturaEspecial.belongsTo(EstadoCandidaturaEspecial, { foreignKey: 'id_estado_candidatura_especial', as: 'estado', constraints: false });
  CandidaturaEspecial.hasOne(ConquistaAtribuida, { foreignKey: 'id_candidatura_especial', as: 'conquista_atribuida' });

  // ConquistaAtribuida
  ConquistaAtribuida.belongsTo(Utilizador, { foreignKey: 'id_utilizador', as: 'consultor' });
  Utilizador.hasMany(ConquistaAtribuida, { foreignKey: 'id_utilizador', as: 'conquistas_especiais_atribuidas' });

  ConquistaAtribuida.belongsTo(ConquistaEspecial, { foreignKey: 'id_conquista_especial', as: 'conquista_especial' });
  ConquistaAtribuida.belongsTo(CandidaturaEspecial, { foreignKey: 'id_candidatura_especial', as: 'candidatura_especial' });

  // RenovacaoBadge
  RenovacaoBadge.belongsTo(Candidatura, { foreignKey: 'id_candidatura', as: 'candidatura' });
  Candidatura.hasMany(RenovacaoBadge, { foreignKey: 'id_candidatura', as: 'renovacoes' });

  RenovacaoBadge.belongsTo(Utilizador, { foreignKey: 'id_moderador', as: 'moderador' });
  Utilizador.hasMany(RenovacaoBadge, { foreignKey: 'id_moderador', as: 'renovacoes_moderadas' });

  // EvidenciaRenovacao
  EvidenciaRenovacao.belongsTo(RenovacaoBadge, { foreignKey: 'id_renovacao_badge', as: 'renovacao' });
  RenovacaoBadge.hasMany(EvidenciaRenovacao, { foreignKey: 'id_renovacao_badge', as: 'evidencias' });

  EvidenciaRenovacao.belongsTo(RequisitoBadge, { foreignKey: 'id_requisito', as: 'requisito' });
  RequisitoBadge.hasMany(EvidenciaRenovacao, { foreignKey: 'id_requisito', as: 'evidencias_renovacao' });

  EvidenciaRenovacao.belongsTo(Utilizador, { foreignKey: 'id_moderador_validador', as: 'moderador_validador' });
  Utilizador.hasMany(EvidenciaRenovacao, { foreignKey: 'id_moderador_validador', as: 'evidencias_renovacao_validadas' });

  // ===== SUBSISTEMA OBJETIVO =====
  // TipoObjetivo → TraducaoConteudo (titulo + descricao)
  TipoObjetivo.belongsTo(TraducaoConteudo, {
    foreignKey: { name: 'id_traducao_titulo', allowNull: false },
    as: 'traducao_titulo',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    constraints: true
  });
  TipoObjetivo.belongsTo(TraducaoConteudo, {
    foreignKey: { name: 'id_traducao_descricao', allowNull: false },
    as: 'traducao_descricao',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    constraints: true
  });

  // ObjetivoConsultor → TipoObjetivo
  ObjetivoConsultor.belongsTo(TipoObjetivo, {
    foreignKey: { name: 'id_tipo_objetivo', allowNull: false },
    as: 'tipo_objetivo',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    constraints: true
  });
  TipoObjetivo.hasMany(ObjetivoConsultor, { foreignKey: 'id_tipo_objetivo', as: 'objetivos' });

  // ObjetivoConsultor → Utilizador
  ObjetivoConsultor.belongsTo(Utilizador, {
    foreignKey: { name: 'id_utilizador', allowNull: false },
    as: 'consultor',
    onUpdate: 'CASCADE',
    onDelete: 'RESTRICT',
    constraints: true
  });
  Utilizador.hasMany(ObjetivoConsultor, { foreignKey: 'id_utilizador', as: 'objetivos' });

}

module.exports = applyAssociations;