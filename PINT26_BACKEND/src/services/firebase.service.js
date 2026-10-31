// =========================================================================
// SERVIÇO CENTRAL DO FIREBASE ADMIN SDK (PUSH NOTIFICATIONS ANDROID/FLUTTER)
// =========================================================================
const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const fs = require('fs');
const path = require('path');
const { FIREBASE } = require('../config/parameters');

let isInitialized = false;

/**
 * Inicializa o Firebase Admin SDK de forma resiliente.
 * Suporta credenciais via ficheiro JSON local ou variável de ambiente.
 */
function initFirebase() {
  if (isInitialized || (admin.getApps && admin.getApps().length > 0)) {
    isInitialized = true;
    return admin;
  }

  try {
    let serviceAccount = null;

    // 1. Tentar ler JSON diretamente da variável de ambiente
    if (FIREBASE.SERVICE_ACCOUNT_JSON) {
      try {
        serviceAccount = JSON.parse(FIREBASE.SERVICE_ACCOUNT_JSON);
        console.log('[Firebase] Credenciais carregadas a partir de FIREBASE_SERVICE_ACCOUNT_JSON.');
      } catch (errJson) {
        console.warn('[Firebase] Erro ao analisar FIREBASE_SERVICE_ACCOUNT_JSON:', errJson.message);
      }
    }

    // 2. Se não houver JSON em string, procurar pelo caminho do ficheiro
    if (!serviceAccount && FIREBASE.SERVICE_ACCOUNT_PATH) {
      const resolvedPath = path.isAbsolute(FIREBASE.SERVICE_ACCOUNT_PATH)
        ? FIREBASE.SERVICE_ACCOUNT_PATH
        : path.resolve(process.cwd(), FIREBASE.SERVICE_ACCOUNT_PATH);

      if (fs.existsSync(resolvedPath)) {
        const fileContent = fs.readFileSync(resolvedPath, 'utf8');
        serviceAccount = JSON.parse(fileContent);
        console.log(`[Firebase] Credenciais carregadas com sucesso de: ${resolvedPath}`);
      }
    }

    // 3. Inicializar se as credenciais foram encontradas
    if (serviceAccount) {
      const credential = typeof admin.cert === 'function' 
        ? admin.cert(serviceAccount)
        : admin.credential?.cert(serviceAccount);

      admin.initializeApp({
        credential,
        projectId: serviceAccount.project_id || FIREBASE.PROJECT_ID || undefined
      });
      isInitialized = true;
      console.log(`[Firebase] Firebase Admin SDK inicializado para o projeto: ${serviceAccount.project_id || FIREBASE.PROJECT_ID || 'default'}`);
    } else {
      console.warn('[Firebase] Ficheiro de credenciais (firebase-service-account.json) não encontrado. Modo de simulação/fallback ativo (notificações push desativadas até inserção do ficheiro).');
    }
  } catch (error) {
    console.error('[Firebase] Erro ao inicializar Firebase Admin SDK:', error.message);
    isInitialized = false;
  }

  return admin;
}

// Inicializar na carga do módulo
initFirebase();

/**
 * Extrai texto simples para título ou corpo da notificação, suportando strings ou objetos i18n { pt, en, es }.
 * 
 * @param {string|object} val 
 * @param {string} fallback 
 * @returns {string}
 */
function extractText(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    return val.pt || val.en || val.es || Object.values(val)[0] || fallback;
  }
  return String(val);
}

/**
 * Envia notificação Push via Firebase Cloud Messaging para um Tópico/Canal.
 * O tópico tem correspondência direta com as salas do Socket.IO (ex: user_<UUID>, room_consultor, global).
 * 
 * @param {Object} options
 * @param {string} options.topic - Nome do tópico FCM (ex: 'user_UUID', 'room_consultor', 'global')
 * @param {string} options.event - Código do evento (ex: 'candidatura_aprovada', 'nova_notificacao')
 * @param {Object} [options.data] - Dados complementares para o cliente
 * @param {Object} [options.notificationMeta] - Título e Mensagem { title, body }
 * @returns {Promise<Object>} Resultado do envio
 */
async function sendPushToTopic({ topic, event, data = {}, notificationMeta = null }) {
  if (!isInitialized || (admin.getApps && admin.getApps().length === 0)) {
    return { success: false, skipped: true, reason: 'Firebase Admin não inicializado.' };
  }

  if (!topic) {
    return { success: false, skipped: true, reason: 'Tópico não especificado.' };
  }

  // Sanitizar o nome do tópico para respeitar regras do FCM: [a-zA-Z0-9-_.~%]+
  const cleanTopic = String(topic).trim().replace(/[^a-zA-Z0-9-_.~%]/g, '_');

  // Determinar Título e Corpo para exibição no telemóvel (ecrã bloqueado)
  const title = extractText(
    notificationMeta?.title || notificationMeta?.titulo || data?.titulo,
    'SoftBadge'
  );

  const body = extractText(
    notificationMeta?.body || notificationMeta?.mensagem || data?.mensagem,
    'Nova atualização disponível na sua conta.'
  );

  // Serializar payload de dados (o FCM exige que todos os valores no objeto data sejam strings)
  const fcmData = {
    event: String(event || 'notification'),
    topic: cleanTopic,
    timestamp: new Date().toISOString()
  };

  if (data && typeof data === 'object') {
    try {
      fcmData.payload = JSON.stringify(data);
    } catch {
      fcmData.payload = String(data);
    }
    if (data.id_candidatura) fcmData.id_candidatura = String(data.id_candidatura);
    if (data.id_badge) fcmData.id_badge = String(data.id_badge);
    if (data.id_notificacao) fcmData.id_notificacao = String(data.id_notificacao);
    if (data.codigo_tipo) fcmData.codigo_tipo = String(data.codigo_tipo);
  } else if (data) {
    fcmData.payload = String(data);
  }

  const message = {
    topic: cleanTopic,
    notification: {
      title,
      body
    },
    data: fcmData,
    android: {
      priority: 'high',
      notification: {
        channelId: 'softbadge_notifications',
        sound: 'default',
        priority: 'max',
        visibility: 'public', // Visível mesmo com o ecrã bloqueado no Android
        clickAction: 'FLUTTER_NOTIFICATION_CLICK'
      }
    }
  };

  try {
    const messaging = getMessaging();
    const response = await messaging.send(message);
    console.log(`[Firebase Push] Notificação enviada para o tópico '${cleanTopic}' (Msg ID: ${response})`);
    return { success: true, messageId: response, topic: cleanTopic };
  } catch (error) {
    console.error(`[Firebase Push] Erro ao enviar para o tópico '${cleanTopic}':`, error.message);
    return { success: false, error: error.message, topic: cleanTopic };
  }
}

/**
 * Retorna o estado de inicialização do Firebase.
 */
function isFirebaseReady() {
  return isInitialized;
}

module.exports = {
  initFirebase,
  sendPushToTopic,
  isFirebaseReady,
  getAdmin: () => admin
};
