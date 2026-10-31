const PostagemMiniforum = require('../models/postagem_miniforum.model');
const CategoriaMiniforum = require('../models/categoria_miniforum.model');
const LeituraPostagem = require('../models/leitura_postagem.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const Utilizador = require('../models/utilizador.model');
const sequelize = require('../config/database');
const { Op } = require('sequelize');
const { PERFIS } = require('../middlewares/permissao.middleware');
const { emitGlobal, emitToRoom } = require('../services/websocket.service');
const { processarTraducao, tratarPayloadTraducao } = require('../services/tradutor_helper');

const controllerPostagemMiniforum = {};

/**
 * GET /postagem_miniforum/categorias
 * Retorna a listagem de categorias do minifórum com tradução no idioma solicitado (?lang=pt|en|es).
 */
controllerPostagemMiniforum.listCategorias = async (req, res) => {
  try {
    const lang = req.lang || 'pt';

    const categorias = await CategoriaMiniforum.findAll({
      where: { relacionamentoAtivo: true },
      include: [
        {
          association: 'traducao_nome_categoria',
          attributes: [lang]
        }
      ],
      order: [['id_categoria_miniforum', 'ASC']]
    });

    const data = categorias.map(c => ({
      id_categoria_miniforum: c.id_categoria_miniforum,
      nome_categoria: c.traducao_nome_categoria ? c.traducao_nome_categoria[lang] : null
    }));

    res.status(200).json({
      success: true,
      message: "Categorias do MiniFórum recuperadas com sucesso.",
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar categorias.", error: error.message });
  }
};

/**
 * GET /postagem_miniforum
 * Retorna as postagens ativas direcionadas ao perfil do utilizador logado.
 */
controllerPostagemMiniforum.listPostagens = async (req, res) => {
  try {
    const id_utilizador = req.auth?.sub || req.auth?.id_utilizador;
    const perfisToken = req.auth?.perfis || [4]; // Se não houver perfis no token, assume Consultor (4)
    const lang = req.lang || 'pt';

    // Regra de Filtro de Visibilidade por Perfil Alvo:
    // A postagem é visível se id_perfil_alvo for null (todos) OU se pertencer a um dos perfis do utilizador
    const wherePerfis = {
      postagem_visivel: true,
      [Op.or]: [
        { id_perfil_alvo: null },
        { id_perfil_alvo: { [Op.in]: perfisToken } }
      ]
    };

    // Filtro opcional por Categoria via query string (?id_categoria_miniforum=1)
    if (req.query.id_categoria_miniforum) {
      wherePerfis.id_categoria_miniforum = Number(req.query.id_categoria_miniforum);
    }

    const postagens = await PostagemMiniforum.findAll({
      where: wherePerfis,
      include: [
        {
          association: 'autor',
          attributes: ['id_utilizador', 'nome', 'apelido', 'avatar']
        },
        {
          association: 'categoria',
          attributes: ['id_categoria_miniforum'],
          include: [{ association: 'traducao_nome_categoria', attributes: [lang] }]
        },
        {
          association: 'perfil_alvo',
          attributes: ['id_perfil'],
          include: [{ association: 'traducao_perfil', attributes: [lang] }]
        },
        {
          association: 'traducao_titulo',
          attributes: [lang]
        },
        {
          association: 'traducao_mensagem',
          attributes: [lang]
        },
        {
          association: 'leituras',
          attributes: ['id_utilizador', 'data_leitura'],
          where: { id_utilizador },
          required: false // LEFT JOIN para saber se este utilizador já leu
        }
      ],
      order: [['data_postagem', 'DESC']]
    });

    const data = postagens.map(p => ({
      id_postagem_miniforum: p.id_postagem_miniforum,
      id_utilizador_autor: p.id_utilizador_autor,
      autor: p.autor ? {
        nome: p.autor.nome,
        apelido: p.autor.apelido,
        avatar: p.autor.avatar
      } : null,
      id_categoria_miniforum: p.id_categoria_miniforum,
      categoria: p.categoria?.traducao_nome_categoria ? p.categoria.traducao_nome_categoria[lang] : null,
      id_perfil_alvo: p.id_perfil_alvo,
      perfil_alvo: p.perfil_alvo?.traducao_perfil ? p.perfil_alvo.traducao_perfil[lang] : "Todos",
      titulo: p.traducao_titulo ? p.traducao_titulo[lang] : null,
      conteudo: p.traducao_mensagem ? p.traducao_mensagem[lang] : null,
      data_postagem: p.data_postagem,
      lida: p.leituras && p.leituras.length > 0,
      data_leitura: p.leituras && p.leituras.length > 0 ? p.leituras[0].data_leitura : null
    }));

    res.status(200).json({
      success: true,
      message: "Postagens do MiniFórum recuperadas com sucesso.",
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao listar postagens do MiniFórum.", error: error.message });
  }
};

/**
 * POST /postagem_miniforum
 * Cria uma nova publicação no MiniFórum com i18n (Apenas Admin, SLL, TM).
 */
controllerPostagemMiniforum.createPostagem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const id_utilizador_autor = req.auth?.sub || req.auth?.id_utilizador;
    let { id_categoria_miniforum, id_perfil_alvo, titulo, conteudo } = req.body;

    // Adaptação para a estrutura de Tradução Manual plana enviada pelo frontend do Minifórum
    if (req.body.manualTranslation === true || req.body.manualTranslation === 'true' || req.body.titulo_pt || req.body.conteudo_pt) {
      if (typeof titulo !== 'object') {
        titulo = {
          pt: req.body.titulo_pt || titulo || '',
          en: req.body.titulo_en || titulo || '',
          es: req.body.titulo_es || titulo || ''
        };
      }
      if (typeof conteudo !== 'object') {
        conteudo = {
          pt: req.body.conteudo_pt || conteudo || '',
          en: req.body.conteudo_en || conteudo || '',
          es: req.body.conteudo_es || conteudo || ''
        };
      }
    }

    // Validação de campos obrigatórios
    const hasTitulo = (typeof titulo === 'object' && titulo !== null) ? (titulo.pt || titulo.en || titulo.es) : titulo;
    const hasConteudo = (typeof conteudo === 'object' && conteudo !== null) ? (conteudo.pt || conteudo.en || conteudo.es) : conteudo;

    if (!id_categoria_miniforum || !hasTitulo || !hasConteudo) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: "Campos obrigatórios em falta: id_categoria_miniforum, titulo, conteudo."
      });
    }

    const lang = req.lang || 'pt';

    let tituloObj;
    let conteudoObj;

    try {
      tituloObj = await tratarPayloadTraducao(titulo, lang);
      conteudoObj = await tratarPayloadTraducao(conteudo, lang);
    } catch (transError) {
      await transaction.rollback();
      console.error("Falha na tradução automática no createPostagem:", transError.message);
      return res.status(422).json({
        success: false,
        code: "TRANSLATION_API_FAILED",
        message: "O serviço de tradução automática está temporariamente indisponível.",
        originalData: {
          titulo: typeof titulo === 'string' ? titulo : (titulo ? (titulo[lang] || titulo.pt || "") : ""),
          conteudo: typeof conteudo === 'string' ? conteudo : (conteudo ? (conteudo[lang] || conteudo.pt || "") : "")
        },
        lang
      });
    }

    // 1. Cria a tradução do Título
    const traducaoTitulo = await TraducaoConteudo.create({
      tabela: 'postagem_miniforum',
      coluna: 'titulo',
      pt: tituloObj.pt || tituloObj.en || tituloObj.es || '',
      en: tituloObj.en || tituloObj.pt || '',
      es: tituloObj.es || tituloObj.pt || ''
    }, { transaction });

    // 2. Cria a tradução da Mensagem/Conteúdo
    const traducaoMensagem = await TraducaoConteudo.create({
      tabela: 'postagem_miniforum',
      coluna: 'conteudo',
      pt: conteudoObj.pt || conteudoObj.en || conteudoObj.es || '',
      en: conteudoObj.en || conteudoObj.pt || '',
      es: conteudoObj.es || conteudoObj.pt || ''
    }, { transaction });

    // 3. Cria o registo de Postagem
    const novaPostagem = await PostagemMiniforum.create({
      id_utilizador_autor,
      id_categoria_miniforum: Number(id_categoria_miniforum),
      id_perfil_alvo: id_perfil_alvo ? Number(id_perfil_alvo) : null,
      id_traducao_titulo: traducaoTitulo.id_traducao_conteudo,
      id_traducao_mensagem: traducaoMensagem.id_traducao_conteudo,
      postagem_visivel: true
    }, { transaction });

    await transaction.commit();

    // NOTIFICAÇÃO EM TEMPO REAL VIA WEBSOCKET:
    // Emite todos os aliases de eventos ouvidos pelo Frontend (nova_postagem_miniforum, postagem_miniforum_criada, postagem_criada, miniforum_updated)
    try {
      const payloadSocket = {
        id_postagem_miniforum: novaPostagem.id_postagem_miniforum,
        id_utilizador_autor,
        id_categoria_miniforum: novaPostagem.id_categoria_miniforum,
        id_perfil_alvo: novaPostagem.id_perfil_alvo,
        titulo: tituloObj,
        conteudo: conteudoObj,
        data_postagem: novaPostagem.data_postagem
      };

      const eventos = ['nova_postagem_miniforum', 'postagem_miniforum_criada', 'postagem_criada', 'miniforum_updated'];

      for (const ev of eventos) {
        emitGlobal(ev, payloadSocket);
      }
    } catch (wsErr) {
      console.error("Erro ao emitir evento websocket de nova postagem:", wsErr.message);
    }

    res.status(201).json({
      success: true,
      message: "Postagem criada com sucesso no MiniFórum.",
      data: novaPostagem
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao criar postagem no MiniFórum.", error: error.message });
  }
};

/**
 * POST /postagem_miniforum/:id/lida
 * Regista que o utilizador autenticado leu uma determinada postagem.
 */
controllerPostagemMiniforum.marcarComoLida = async (req, res) => {
  try {
    const id_postagem_miniforum = req.params.id;
    const id_utilizador = req.auth?.sub || req.auth?.id_utilizador;

    const [leitura, created] = await LeituraPostagem.findOrCreate({
      where: {
        id_postagem_miniforum,
        id_utilizador
      },
      defaults: {
        id_postagem_miniforum,
        id_utilizador,
        data_leitura: new Date()
      }
    });

    res.status(200).json({
      success: true,
      message: "Postagem marcada como lida.",
      data: leitura
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao marcar postagem como lida.", error: error.message });
  }
};

/**
 * DELETE /postagem_miniforum/:id
 * Remove (ou esconde) uma postagem do MiniFórum.
 */
controllerPostagemMiniforum.deletePostagem = async (req, res) => {
  try {
    const id_postagem_miniforum = req.params.id;
    const id_utilizador = req.auth?.sub || req.auth?.id_utilizador;
    const perfisToken = req.auth?.perfis || [];
    const isAdmin = perfisToken.includes(PERFIS.ADMIN);

    const postagem = await PostagemMiniforum.findByPk(id_postagem_miniforum);
    if (!postagem) {
      return res.status(404).json({ success: false, message: "Postagem não encontrada." });
    }

    // Apenas o Autor ou um Administrador podem eliminar o post
    if (!isAdmin && postagem.id_utilizador_autor !== id_utilizador) {
      return res.status(403).json({ success: false, message: "Acesso negado. Apenas o autor ou um Administrador pode eliminar esta postagem." });
    }

    await postagem.update({ postagem_visivel: false });

    // Notifica em tempo real para atualizar o minifórum no frontend
    try {
      emitGlobal('miniforum_updated', { id_postagem_miniforum, acao: 'deleted' });
    } catch (wsErr) {
      console.error("Erro ao emitir evento de remocao no websocket:", wsErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Postagem eliminada com sucesso."
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao eliminar postagem.", error: error.message });
  }
};

/**
 * PUT /postagem_miniforum/:id
 * Atualiza uma postagem do MiniFórum com tradução automática/manual e restrição de autoria.
 */
controllerPostagemMiniforum.updatePostagem = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const id_postagem_miniforum = req.params.id;
    const id_utilizador = req.auth?.sub || req.auth?.id_utilizador;
    const lang = req.lang || 'pt';

    const postagem = await PostagemMiniforum.findByPk(id_postagem_miniforum);
    if (!postagem) {
      await transaction.rollback();
      return res.status(404).json({ success: false, message: "Postagem não encontrada." });
    }

    // Regra de Negócio: Apenas o utilizador autor pode editar a sua própria postagem
    if (postagem.id_utilizador_autor !== id_utilizador) {
      await transaction.rollback();
      return res.status(403).json({ success: false, message: "Acesso negado. Apenas o autor desta postagem a pode editar." });
    }

    let { id_categoria_miniforum, id_perfil_alvo, titulo, conteudo } = req.body;

    // Adaptação para a estrutura de Tradução Manual plana enviada pelo frontend do Minifórum
    if (req.body.manualTranslation === true || req.body.manualTranslation === 'true' || req.body.titulo_pt || req.body.conteudo_pt) {
      if (typeof titulo !== 'object' && (req.body.titulo_pt !== undefined || req.body.titulo_en !== undefined || req.body.titulo_es !== undefined)) {
        titulo = {
          pt: req.body.titulo_pt !== undefined ? req.body.titulo_pt : (titulo || ''),
          en: req.body.titulo_en !== undefined ? req.body.titulo_en : (titulo || ''),
          es: req.body.titulo_es !== undefined ? req.body.titulo_es : (titulo || '')
        };
      }
      if (typeof conteudo !== 'object' && (req.body.conteudo_pt !== undefined || req.body.conteudo_en !== undefined || req.body.conteudo_es !== undefined)) {
        conteudo = {
          pt: req.body.conteudo_pt !== undefined ? req.body.conteudo_pt : (conteudo || ''),
          en: req.body.conteudo_en !== undefined ? req.body.conteudo_en : (conteudo || ''),
          es: req.body.conteudo_es !== undefined ? req.body.conteudo_es : (conteudo || '')
        };
      }
    }

    // Atualiza metadados básicos
    if (id_categoria_miniforum !== undefined) postagem.id_categoria_miniforum = Number(id_categoria_miniforum);
    if (id_perfil_alvo !== undefined) postagem.id_perfil_alvo = id_perfil_alvo ? Number(id_perfil_alvo) : null;

    try {
      // 1. Atualizar Título se enviado
      if (titulo !== undefined) {
        const tituloObj = await tratarPayloadTraducao(titulo, lang);
        await TraducaoConteudo.update({
          pt: tituloObj.pt || '',
          en: tituloObj.en || '',
          es: tituloObj.es || ''
        }, {
          where: { id_traducao_conteudo: postagem.id_traducao_titulo },
          transaction
        });
      }

      // 2. Atualizar Conteúdo se enviado
      if (conteudo !== undefined) {
        const conteudoObj = await tratarPayloadTraducao(conteudo, lang);
        await TraducaoConteudo.update({
          pt: conteudoObj.pt || '',
          en: conteudoObj.en || '',
          es: conteudoObj.es || ''
        }, {
          where: { id_traducao_conteudo: postagem.id_traducao_mensagem },
          transaction
        });
      }
    } catch (transError) {
      await transaction.rollback();
      console.error("Falha na tradução automática no updatePostagem:", transError.message);
      return res.status(422).json({
        success: false,
        code: "TRANSLATION_API_FAILED",
        message: "O serviço de tradução automática está temporariamente indisponível.",
        originalData: {
          titulo: typeof titulo === 'string' ? titulo : (titulo ? (titulo[lang] || titulo.pt || "") : ""),
          conteudo: typeof conteudo === 'string' ? conteudo : (conteudo ? (conteudo[lang] || conteudo.pt || "") : "")
        },
        lang
      });
    }

    await postagem.save({ transaction });
    await transaction.commit();

    // Notifica em tempo real para atualizar o minifórum no frontend
    try {
      emitGlobal('miniforum_updated', { id_postagem_miniforum, acao: 'updated' });
    } catch (wsErr) {
      console.error("Erro ao emitir evento de modificação no websocket:", wsErr.message);
    }

    res.status(200).json({
      success: true,
      message: "Postagem atualizada com sucesso.",
      data: postagem
    });

  } catch (error) {
    await transaction.rollback();
    res.status(500).json({ success: false, message: "Erro ao atualizar postagem.", error: error.message });
  }
};

/**
 * GET /postagem_miniforum/:id
 * Retorna os detalhes de uma única postagem com i18n (?lang=pt|en|es).
 */
controllerPostagemMiniforum.detailPostagem = async (req, res) => {
  try {
    const id_postagem_miniforum = req.params.id;
    const id_utilizador = req.auth?.sub || req.auth?.id_utilizador;
    const lang = req.lang || 'pt';
    const p = await PostagemMiniforum.findByPk(id_postagem_miniforum, {
      include: [
        {
          association: 'autor',
          attributes: ['id_utilizador', 'nome', 'apelido', 'avatar']
        },
        {
          association: 'categoria',
          attributes: ['id_categoria_miniforum'],
          include: [{ association: 'traducao_nome_categoria', attributes: [lang] }]
        },
        {
          association: 'perfil_alvo',
          attributes: ['id_perfil'],
          include: [{ association: 'traducao_perfil', attributes: [lang] }]
        },
        {
          association: 'traducao_titulo',
          attributes: [lang]
        },
        {
          association: 'traducao_mensagem',
          attributes: [lang]
        },
        {
          association: 'leituras',
          attributes: ['id_utilizador', 'data_leitura'],
          where: { id_utilizador },
          required: false
        }
      ]
    });
    if (!p) {
      return res.status(404).json({ success: false, message: "Postagem não encontrada." });
    }
    const data = {
      id_postagem_miniforum: p.id_postagem_miniforum,
      id_utilizador_autor: p.id_utilizador_autor,
      autor: p.autor ? {
        nome: p.autor.nome,
        apelido: p.autor.apelido,
        avatar: p.autor.avatar
      } : null,
      id_categoria_miniforum: p.id_categoria_miniforum,
      categoria: p.categoria?.traducao_nome_categoria ? p.categoria.traducao_nome_categoria[lang] : null,
      id_perfil_alvo: p.id_perfil_alvo,
      perfil_alvo: p.perfil_alvo?.traducao_perfil ? p.perfil_alvo.traducao_perfil[lang] : "Todos",
      titulo: p.traducao_titulo ? p.traducao_titulo[lang] : null,
      conteudo: p.traducao_mensagem ? p.traducao_mensagem[lang] : null,
      data_postagem: p.data_postagem,
      lida: p.leituras && p.leituras.length > 0,
      data_leitura: p.leituras && p.leituras.length > 0 ? p.leituras[0].data_leitura : null
    };
    res.status(200).json({
      success: true,
      message: "Postagem recuperada com sucesso.",
      data
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Erro ao recuperar postagem.", error: error.message });
  }
};

module.exports = controllerPostagemMiniforum;
