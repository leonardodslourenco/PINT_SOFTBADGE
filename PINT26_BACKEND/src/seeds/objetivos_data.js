// =========================================================================
// DATASET ESTÁTICO DE TIPOS DE OBJETIVO (OBJECTIVES)
// Os 5 tipos são fixos e imutáveis — não podem ser criados, editados ou removidos.
// =========================================================================

const TIPOS_OBJETIVO_LIST = [
  {
    id_tipo_objetivo: '01a0447b-bd74-727d-b614-fce0512d22bc',
    codigo_tipo: 'BADGES_NORMAL_TEMPO',
    id_traducao_titulo: '01a0447b-bd74-727d-b615-01ab5c0ac6c6',
    id_traducao_descricao: '01a0447b-bd74-727d-b615-0797fb1a608b',
    tem_prazo: true,
    titulo: {
      pt: 'Badges Normais em Tempo',
      en: 'Normal Badges in Time',
      es: 'Badges Normales en Tiempo'
    },
    descricao: {
      pt: 'Objetivo pessoal para obter uma determinada quantidade de Badges normais dentro de um prazo estipulado pelo Consultor.',
      en: 'Personal goal to earn a specified number of normal Badges within a deadline set by the Consultant.',
      es: 'Objetivo personal para obtener una cantidad determinada de Badges normales dentro de un plazo establecido por el Consultor.'
    }
  },
  {
    id_tipo_objetivo: '01a0447b-bd74-727d-b615-0a0151908c61',
    codigo_tipo: 'BADGES_NORMAL_DIVERSIDADE',
    id_traducao_titulo: '01a0447b-bd74-727d-b615-0f372ded4c91',
    id_traducao_descricao: '01a0447b-bd74-727d-b615-127a66b380bf',
    tem_prazo: false,
    titulo: {
      pt: 'Badges Normais em Diversidade',
      en: 'Normal Badges in Diversity',
      es: 'Badges Normales en Diversidad'
    },
    descricao: {
      pt: 'Objetivo pessoal para obter uma determinada quantidade de Badges normais distribuídos por várias Áreas, Service Lines ou Learning Paths distintas.',
      en: 'Personal goal to earn a specified number of normal Badges distributed across multiple distinct Areas, Service Lines or Learning Paths.',
      es: 'Objetivo personal para obtener una cantidad determinada de Badges normales distribuidos en varias Áreas, Service Lines o Learning Paths distintas.'
    }
  },
  {
    id_tipo_objetivo: '01a0447b-bd74-727d-b615-174670da0cee',
    codigo_tipo: 'PONTOS_NORMAL_TEMPO',
    id_traducao_titulo: '01a0447b-bd74-727d-b615-182f808d89c3',
    id_traducao_descricao: '01a0447b-bd74-727d-b615-1f7349d53756',
    tem_prazo: true,
    titulo: {
      pt: 'Pontos de Badges Normais em Tempo',
      en: 'Normal Badge Points in Time',
      es: 'Puntos de Badges Normales en Tiempo'
    },
    descricao: {
      pt: 'Objetivo pessoal para acumular uma determinada quantidade de pontos provenientes de Badges normais dentro de um prazo estipulado.',
      en: 'Personal goal to accumulate a specified number of points from normal Badges within a set deadline.',
      es: 'Objetivo personal para acumular una cantidad determinada de puntos provenientes de Badges normales dentro de un plazo estipulado.'
    }
  },
  {
    id_tipo_objetivo: '01a0447b-bd74-727d-b615-23b18ba3f403',
    codigo_tipo: 'BADGES_ESPECIAL_TEMPO',
    id_traducao_titulo: '01a0447b-bd74-727d-b615-26bd87ca5354',
    id_traducao_descricao: '01a0447b-bd74-727d-b615-2867dabbcb5d',
    tem_prazo: true,
    titulo: {
      pt: 'Badges Especiais em Tempo',
      en: 'Special Badges in Time',
      es: 'Badges Especiales en Tiempo'
    },
    descricao: {
      pt: 'Objetivo pessoal para obter uma determinada quantidade de Badges especiais dentro de um prazo estipulado pelo Consultor.',
      en: 'Personal goal to earn a specified number of special Badges within a deadline set by the Consultant.',
      es: 'Objetivo personal para obtener una cantidad determinada de Badges especiales dentro de un plazo establecido por el Consultor.'
    }
  },
  {
    id_tipo_objetivo: '01a0447b-bd74-727d-b615-2dc9d4d4db0e',
    codigo_tipo: 'PONTOS_ESPECIAL_TEMPO',
    id_traducao_titulo: '01a0447b-bd74-727d-b615-30d03d7b16a7',
    id_traducao_descricao: '01a0447b-bd74-727d-b615-351ea448e653',
    tem_prazo: true,
    titulo: {
      pt: 'Pontos de Badges Especiais em Tempo',
      en: 'Special Badge Points in Time',
      es: 'Puntos de Badges Especiales en Tiempo'
    },
    descricao: {
      pt: 'Objetivo pessoal para acumular uma determinada quantidade de pontos provenientes de Badges especiais dentro de um prazo estipulado.',
      en: 'Personal goal to accumulate a specified number of points from special Badges within a set deadline.',
      es: 'Objetivo personal para acumular una cantidad determinada de puntos provenientes de Badges especiales dentro de un plazo estipulado.'
    }
  }
];

module.exports = {
  TIPOS_OBJETIVO_LIST
};
