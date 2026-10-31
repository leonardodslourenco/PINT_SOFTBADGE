// =========================================================================
// SERVIÇO DE MARCOS E CELEBRAÇÕES (MILESTONES SERVICE)
// =========================================================================
const TipoMarco = require('../models/tipo_marco.model');
const ConfiguracaoMarco = require('../models/configuracao_marco.model');
const UtilizadorMarco = require('../models/utilizador_marco.model');
const Candidatura = require('../models/candidatura_badge.model');
const Badge = require('../models/badge.model');
const NivelArea = require('../models/nivel.model');
const Area = require('../models/area.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');
const { emitToRoom } = require('./websocket.service');
const { criarENotificar } = require('./notificacao.service');

/**
 * Calcula a diferença em meses entre duas datas
 */
function mesesDiferenca(d1, d2) {
  const data1 = new Date(d1);
  const data2 = new Date(d2);
  return (data2.getFullYear() - data1.getFullYear()) * 12 + (data2.getMonth() - data1.getMonth());
}

/**
 * Avalia e atribui marcos conquistados por um utilizador.
 * 
 * @param {string} idUtilizador UUID do utilizador
 * @param {string} tipoDisparo 'INICIO_CANDIDATURA' | 'APROVACAO_CANDIDATURA'
 * @param {object} [transaction] Transação do Sequelize (opcional)
 */
async function verificarEAtribuirMarcos(idUtilizador, tipoDisparo, transaction = null) {
  if (!idUtilizador) return;

  try {
    // 1. Carregar todas as configurações de marcos ativas com o respetivo tipo e traduções
    const marcos = await ConfiguracaoMarco.findAll({
      where: { ativo: true },
      include: [
        {
          model: TipoMarco,
          as: 'tipo_marco',
          where: { ativo: true }
        },
        { model: TraducaoConteudo, as: 'traducao_nome' },
        { model: TraducaoConteudo, as: 'traducao_descricao' }
      ],
      transaction
    });

    if (!marcos || marcos.length === 0) return;

    // 2. Carregar os marcos que o utilizador já conquistou previamente
    const marcosJaConquistados = await UtilizadorMarco.findAll({
      where: { id_utilizador: idUtilizador },
      attributes: ['id_marco'],
      transaction
    });
    const idsJaConquistados = new Set(marcosJaConquistados.map(m => m.id_marco));

    // 3. Filtrar apenas marcos relevantes para o disparo e que ainda não foram conquistados
    const marcosParaAvaliar = marcos.filter(m => {
      if (idsJaConquistados.has(m.id_marco)) return false;

      const codigo = m.tipo_marco?.codigo_tipo;
      if (tipoDisparo === 'INICIO_CANDIDATURA') {
        return codigo === 'INICIO_CANDIDATURA';
      }
      if (tipoDisparo === 'APROVACAO_CANDIDATURA') {
        return codigo !== 'INICIO_CANDIDATURA';
      }
      return true;
    });

    if (marcosParaAvaliar.length === 0) return;

    // 4. Obter dados de candidaturas do utilizador conforme a necessidade
    // a) Candidaturas totais
    let totalCandidaturas = 0;
    if (tipoDisparo === 'INICIO_CANDIDATURA' || marcosParaAvaliar.some(m => m.tipo_marco?.codigo_tipo === 'INICIO_CANDIDATURA')) {
      totalCandidaturas = await Candidatura.count({
        where: { id_utilizador: idUtilizador, candidaturaAtiva: true },
        transaction
      });
    }

    // b) Candidaturas concluídas (Estado 4 - Encerrada OK) com hierarquia de Badge -> Nível -> Área
    let candidaturasConcluidas = [];
    const precisaConcluidas = marcosParaAvaliar.some(m => m.tipo_marco?.codigo_tipo !== 'INICIO_CANDIDATURA');
    
    if (precisaConcluidas) {
      candidaturasConcluidas = await Candidatura.findAll({
        where: {
          id_utilizador: idUtilizador,
          id_estado_candidatura: 4,
          candidaturaAtiva: true
        },
        include: [{
          model: Badge,
          as: 'badge',
          include: [{
            model: NivelArea,
            as: 'nivel_area',
            include: [{
              model: Area,
              as: 'area'
            }]
          }]
        }],
        order: [['data_encerramento_candidatura', 'ASC']],
        transaction
      });
    }

    // 5. Avaliar cada marco
    const novosMarcosConquistados = [];

    for (const marco of marcosParaAvaliar) {
      const codigo = marco.tipo_marco?.codigo_tipo;
      const objetivo = marco.quantidade_objetivo;
      let atingiu = false;

      switch (codigo) {
        case 'INICIO_CANDIDATURA': {
          atingiu = totalCandidaturas >= objetivo;
          break;
        }

        case 'CONQUISTA_BADGE': {
          atingiu = candidaturasConcluidas.length >= objetivo;
          break;
        }

        case 'AREAS_DISTINTAS': {
          const areasUnicas = new Set();
          candidaturasConcluidas.forEach(c => {
            const areaId = c.badge?.nivel_area?.area?.id_area || c.badge?.nivel_area?.id_area_sl;
            if (areaId) areasUnicas.add(String(areaId));
          });
          atingiu = areasUnicas.size >= objetivo;
          break;
        }

        case 'SL_DISTINTAS': {
          const slUnicas = new Set();
          candidaturasConcluidas.forEach(c => {
            const slId = c.badge?.nivel_area?.area?.id_service_line;
            if (slId) slUnicas.add(String(slId));
          });
          atingiu = slUnicas.size >= objetivo;
          break;
        }

        case 'MENSAL':
        case 'BIMESTRAL':
        case 'TRIMESTRAL':
        case 'QUADRIMESTRAL':
        case 'SEMESTRAL': {
          const janelaMeses = {
            'MENSAL': 1,
            'BIMESTRAL': 2,
            'TRIMESTRAL': 3,
            'QUADRIMESTRAL': 4,
            'SEMESTRAL': 6
          }[codigo] || 1;

          // Extrair datas de encerramento válidas
          const datasEncerramento = candidaturasConcluidas
            .map(c => c.data_encerramento_candidatura ? new Date(c.data_encerramento_candidatura) : null)
            .filter(d => d !== null);

          // Verificar se existe alguma janela de X meses com >= objetivo conquistas
          for (let i = 0; i < datasEncerramento.length; i++) {
            const dataBase = datasEncerramento[i];
            let contagemNaJanela = 0;

            for (let j = 0; j < datasEncerramento.length; j++) {
              const dataComparada = datasEncerramento[j];
              const diffMeses = mesesDiferenca(dataBase, dataComparada);
              
              if (diffMeses >= 0 && diffMeses < janelaMeses) {
                contagemNaJanela++;
              }
            }

            if (contagemNaJanela >= objetivo) {
              atingiu = true;
              break;
            }
          }
          break;
        }

        default:
          break;
      }

      if (atingiu) {
        novosMarcosConquistados.push(marco);
      }
    }

    // 6. Atribuir os novos marcos, registar notificação e emitir WebSocket
    for (const marco of novosMarcosConquistados) {
      const dataConquista = new Date();

      await UtilizadorMarco.create({
        id_utilizador: idUtilizador,
        id_marco: marco.id_marco,
        data_conquista_marco: dataConquista,
        celebrado: false
      }, { transaction });

      const nomePT = marco.traducao_nome?.pt || 'Novo Marco';
      const nomeEN = marco.traducao_nome?.en || 'New Milestone';
      const nomeES = marco.traducao_nome?.es || 'Nuevo Marco';

      const descPT = marco.traducao_descricao?.pt || 'Conquistou um novo marco na plataforma!';
      const descEN = marco.traducao_descricao?.en || 'You achieved a new milestone on the platform!';
      const descES = marco.traducao_descricao?.es || '¡Has alcanzado un nuevo marco en la plataforma!';

      // Disparar notificação na plataforma
      try {
        await criarENotificar({
          id_user_alvo_notificacao: idUtilizador,
          codigo_tipo: 'sistema_alerta',
          titulo: {
            pt: `🏆 Marco Conquistado: ${nomePT}`,
            en: `🏆 Milestone Achieved: ${nomeEN}`,
            es: `🏆 Marco Conquistado: ${nomeES}`
          },
          mensagem: {
            pt: descPT,
            en: descEN,
            es: descES
          },
          parametros: {
            id_marco: marco.id_marco,
            codigo_tipo: marco.tipo_marco?.codigo_tipo,
            quantidade_objetivo: marco.quantidade_objetivo
          },
          transaction
        });
      } catch (errNotif) {
        console.error(`[Marcos] Erro ao criar notificação de marco:`, errNotif.message);
      }

      // Emissão dedicada de WebSocket para a sala do utilizador para ativar o efeito de celebração
      const payloadSocket = {
        id_marco: marco.id_marco,
        codigo_tipo: marco.tipo_marco?.codigo_tipo,
        quantidade_objetivo: marco.quantidade_objetivo,
        data_conquista: dataConquista,
        nome: { pt: nomePT, en: nomeEN, es: nomeES },
        descricao: { pt: descPT, en: descEN, es: descES }
      };

      emitToRoom(`user_${idUtilizador}`, 'novo_marco', payloadSocket);
      console.log(`[Marcos] Marco "${nomePT}" atribuído ao utilizador ${idUtilizador} e emitido via WebSocket.`);
    }

  } catch (error) {
    console.error('[Marcos] Erro ao verificar e atribuir marcos:', error);
  }
}

module.exports = {
  verificarEAtribuirMarcos
};
