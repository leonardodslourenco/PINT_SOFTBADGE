const Notificacao = require('../models/notificacao.model');
const TipoNotificacao = require('../models/tipo_notificacao.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const { emitToRoom } = require('./websocket.service');
const { processarTraducao } = require('./tradutor_helper');

/**
 * SERVIÇO CENTRALIZADO DE CRIAÇÃO E DISPARO DE NOTIFICAÇÕES
 * Grava na base de dados (com i18n em PT, EN, ES) e emite evento WebSocket em tempo real.
 * 
 * @param {Object} params
 * @param {string|null} params.id_user_notificador - UUID do utilizador emissor (null para sistema)
 * @param {string} params.id_user_alvo_notificacao - UUID do utilizador destinatário
 * @param {string} params.codigo_tipo - Código do tipo (ex: 'candidatura_pre_aprovada')
 * @param {Object} params.titulo - { pt, en, es }
 * @param {Object} params.mensagem - { pt, en, es }
 * @param {Object|null} params.parametros - Metadados JSON para o frontend (ex: { id_candidatura, id_badge })
 * @param {Object|null} params.transaction - Transação Sequelize opcional
 */
async function criarENotificar({
  id_user_notificador = null,
  id_user_alvo_notificacao,
  codigo_tipo,
  titulo,
  mensagem,
  parametros = null,
  transaction = null
}) {
  try {
    // 1. Procura o TipoNotificacao pelo código (com fallback para sistema_alerta)
    let tipo = await TipoNotificacao.findOne({
      where: { codigo_tipo },
      transaction
    });

    if (!tipo) {
      tipo = await TipoNotificacao.findOne({
        where: { codigo_tipo: 'sistema_alerta' },
        transaction
      });
    }

    if (!tipo) {
      console.error(`TipoNotificacao '${codigo_tipo}' não encontrado.`);
      return null;
    }

    // 2. Processa a tradução automática (caso receba string simples)
    let tituloObj;
    let mensagemObj;

    if (typeof titulo === 'object' && titulo !== null) {
      tituloObj = titulo;
    } else {
      try {
        tituloObj = await processarTraducao(titulo, 'pt');
      } catch (err) {
        tituloObj = { pt: titulo, en: titulo, es: titulo };
      }
    }

    if (typeof mensagem === 'object' && mensagem !== null) {
      mensagemObj = mensagem;
    } else {
      try {
        mensagemObj = await processarTraducao(mensagem, 'pt');
      } catch (err) {
        mensagemObj = { pt: mensagem, en: mensagem, es: mensagem };
      }
    }

    // 3. Cria as entradas de i18n para o Título
    const traducaoTitulo = await TraducaoConteudo.create({
      tabela: 'notificacao',
      coluna: 'titulo',
      pt: tituloObj.pt || tituloObj.en || tituloObj.es || '',
      en: tituloObj.en || tituloObj.pt || '',
      es: tituloObj.es || tituloObj.pt || ''
    }, { transaction });

    // 4. Cria as entradas de i18n para a Mensagem
    const traducaoMensagem = await TraducaoConteudo.create({
      tabela: 'notificacao',
      coluna: 'mensagem',
      pt: mensagemObj.pt || mensagemObj.en || mensagemObj.es || '',
      en: mensagemObj.en || mensagemObj.pt || '',
      es: mensagemObj.es || mensagemObj.pt || ''
    }, { transaction });

    // 4. Grava o registo de Notificação
    const notificacao = await Notificacao.create({
      id_user_notificador,
      id_user_alvo_notificacao,
      id_tipo_notificacao: tipo.id_tipo_notificacao,
      id_traducao_titulo: traducaoTitulo.id_traducao_conteudo,
      id_traducao_mensagem: traducaoMensagem.id_traducao_conteudo,
      lida: false,
      parametros
    }, { transaction });

    // 5. Emissão em Tempo Real via WebSocket (para a sala do utilizador recetor)
    const payloadSocket = {
      id_notificacao: notificacao.id_notificacao,
      id_user_notificador,
      id_user_alvo_notificacao,
      codigo_tipo,
      titulo,
      mensagem,
      lida: false,
      parametros,
      createdAt: notificacao.createdAt
    };

    const targetRoom = `user_${id_user_alvo_notificacao}`;
    const eventosNotificacao = ['notification', 'nova_notificacao', codigo_tipo];
    if (codigo_tipo === 'candidatura_aprovada' || codigo_tipo === 'badge_atribuido') {
      eventosNotificacao.push('candidatura_badge_emitido');
    }

    const pushMeta = {
      title: tituloObj.pt || tituloObj.en || tituloObj.es || 'SoftBadge',
      body: mensagemObj.pt || mensagemObj.en || mensagemObj.es || 'Nova notificação'
    };

    for (let i = 0; i < eventosNotificacao.length; i++) {
      const ev = eventosNotificacao[i];
      // Apenas o primeiro evento dispara notificação push no telemóvel para evitar alertas duplicados
      emitToRoom(targetRoom, ev, payloadSocket, i === 0 ? pushMeta : { skipPush: true });
    }

    return notificacao;
  } catch (error) {
    console.error("Erro ao criar e disparar notificacao:", error.message);
    return null;
  }
}

module.exports = {
  criarENotificar
};
