// =========================================================================
// IMPORTAÇÃO DE MODELOS ORM, PLUGINS DE BASE DE DADOS E SERVIÇOS
// =========================================================================
const Perfil = require('../models/perfil.model');                     // Modelo da tabela de cabeçalhos de Perfis
const TraducaoConteudo = require('../models/traducao_conteudo.model'); // Tabela centralizada para persistência multi-idioma
const sequelize = require('../config/database');                      // Instância do Sequelize para controlo de transações ACID
const { gerarUUIDv7 } = require('../services/geradores');             // Gerador de chaves primárias ordenáveis por tempo (UUIDv7)
const validaIDInteiro = require('../services/valida_id_inteiro');     // Utilitário de segurança para higienização de inteiros

const controllersPerfil = {};

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API REST)
// =========================================================================

/**
 * 1. CRIAR PERFIL
 * Regista uma nova função no sistema, inserindo as chaves idiomáticas em background.
 * Caminho: POST /perfil/
 */
controllersPerfil.createPerfil = async (req, res) => {
  // Inicia uma transação SQL isolada para garantir a atomicidade da escrita dupla
  const transaction = await sequelize.transaction();

  try {
    // Desestrutura as traduções obrigatórias enviadas pelo Frontend no corpo do pedido
    const { pt, en, es } = req.body;

    // Gera um identificador único estável cronologicamente (UUIDv7) para o nó textual
    const idTraducao = gerarUUIDv7();

    // 1º Passo: Cria o dicionário idiomático com os nomes do perfil em PT, EN e ES
    await TraducaoConteudo.create({
      id_traducao_conteudo: idTraducao,
      tabela: 'perfil',
      coluna: 'perfil',
      pt,
      en,
      es
    }, { transaction });

    // 2º Passo: Cria a entidade Perfil atando a sua chave estrangeira ao ID da tradução
    const novoPerfil = await Perfil.create({
      id_traducao_perfil: idTraducao
    }, { transaction });

    // Se ambas as operações ocorreram a 100%, consolida em definitivo no PostgreSQL
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Perfil criado com sucesso",
      data: novoPerfil
    });

  } catch (error) {
    // Arquitetura Resiliente: Se uma das duas tabelas falhar, desfaz tudo e impede dados corrompidos
    await transaction.rollback();

    res.status(500).json({
      success: false,
      message: "Erro ao criar perfil",
      error: error.message
    });
  }
};

/**
 * 2. LISTAR PERFIS
 * Retorna os nomes de todos os perfis existentes filtrados dinamicamente pelo idioma do request.
 * Caminho: GET /perfil/list
 */
controllersPerfil.listPerfil = async (req, res) => {
  try {
    const lang = req.lang; // Captura o idioma do utilizador extraído no middleware global

    // EAGER LOADING: Faz o JOIN com a tabela de traduções e extrai APENAS a coluna do idioma atual
    const perfis = await Perfil.findAll({
      include: [
        {
          association: 'traducao_perfil', // Utiliza o alias de relacionamento mapeado no Modelo
          attributes: [lang]              // Otimização: Traz só a coluna ativa (ex: 'pt')
        }
      ],
      order: [['id_perfil', 'ASC']]       // Ordenação sequencial crescente por ID
    });

    // DATA MAPPER: Transforma a coleção complexa do ORM num array de objetos JSON simples e planos
    const resultado = perfis.map(p => ({
      id_perfil: p.id_perfil,
      // Operador ternário defensivo: evita erros se o nó de tradução vier nulo por alguma falha
      perfil: p.traducao_perfil ? p.traducao_perfil[lang] : null
    }));

    res.status(200).json({
      success: true,
      message: "Listagem de perfis recuperada com sucesso",
      data: resultado
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao listar perfis.",
      data: null
    });
  }
};

/**
 * 3. DETALHAR PERFIL
 * Retorna os dados traduzidos de um único perfil, validando defensivamente o parâmetro da rota.
 * Caminho: GET /perfil/getid/:id
 */
controllersPerfil.detailPerfil = async (req, res) => {
  // CIBERSEGURANÇA: Higieniza o ID recebido no URL contra ataques de injeção de código (SQL Injection)
  const id_perfil = validaIDInteiro(req.params.id);

  // Early Return: Se o parâmetro não for um inteiro válido, bloqueia o pedido no imediato
  if (!id_perfil) {
    return res.status(400).json({
      success: false,
      message: "ID inválido",
      data: null
    });
  }

  try {
    const lang = req.lang;

    // Procura o registo único correspondente ao ID aplicando o JOIN multi-idioma
    const perfil = await Perfil.findOne({
      where: { id_perfil },
      include: [
        {
          association: 'traducao_perfil',
          attributes: [lang]
        }
      ]
    });

    // Se o ID não constar na base de dados, devolve o status HTTP 404 (Not Found)
    if (!perfil) {
      return res.status(404).json({
        success: false,
        message: "Perfil não encontrado.",
        data: null
      });
    }

    // Formata o resultado final de saída de forma plana antes de responder
    const resultado = {
      id_perfil: perfil.id_perfil,
      perfil: perfil.traducao_perfil ? perfil.traducao_perfil[lang] : null
    };

    res.status(200).json({
      success: true,
      message: "Perfil recuperado com sucesso.",
      data: resultado
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao recuperar perfil.",
      data: null
    });
  }
};

/**
 * 4. ATUALIZAR PERFIL
 * Atualiza os dicionários de tradução (PT, EN, ES) associados ao ID de um perfil existente.
 * Caminho: PUT /perfil/update/:id
 */
controllersPerfil.updatePerfil = async (req, res) => {
  // Inicia controlo transacional para garantir a integridade da modificação
  const transaction = await sequelize.transaction();

  try {
    const id_perfil = validaIDInteiro(req.params.id);
    const { pt, en, es } = req.body; // Captura os novos textos vindos do formulário do frontend

    // Verifica a existência prévia do perfil alvo antes de processar alterações
    const perfil = await Perfil.findByPk(id_perfil);

    if (!perfil) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Perfil não encontrado"
      });
    }

    // Propaga a atualização do dicionário de idiomas diretamente na tabela pivot de traduções
    await TraducaoConteudo.update({
      pt,
      en,
      es
    }, {
      where: {
        id_traducao_conteudo: perfil.id_traducao_perfil // Filtra pela chave estrangeira de tradução do perfil
      },
      transaction
    });

    await transaction.commit(); // Fecha e consolida com sucesso a operação no banco de dados

    res.status(200).json({
      success: true,
      message: "Perfil atualizado"
    });

  } catch (error) {
    await transaction.rollback(); // Cancela a atualização em caso de quebra de runtime

    res.status(500).json({
      success: false,
      message: "Erro ao atualizar perfil",
      error: error.message
    });
  }
};

/**
 * 5. APAGAR PERFIL (Hard Delete)
 * Elimina definitivamente o registo do perfil e as suas respectivas traduções da base de dados.
 * Caminho: DELETE /perfil/delete/:id
 */
controllersPerfil.deletePerfil = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const id_perfil = validaIDInteiro(req.params.id);

    // Localiza a instância do perfil para conseguir descobrir a sua chave estrangeira de tradução
    const perfil = await Perfil.findByPk(id_perfil);

    if (!perfil) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: "Perfil não encontrado"
      });
    }

    // 1º Passo: Destrói fisicamente o registo de dicionário idiomático associado na tabela de traduções
    await TraducaoConteudo.destroy({
      where: {
        id_traducao_conteudo: perfil.id_traducao_perfil
      },
      transaction
    });

    // 2º Passo: Destrói fisicamente a linha correspondente ao Perfil na tabela mãe
    await perfil.destroy({ transaction });

    // Consolida de forma atómica a remoção definitiva de ambas as tabelas no PostgreSQL
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Perfil apagado"
    });

  } catch (error) {
    await transaction.rollback(); // Reverte a tentativa de eliminação caso ocorra violação de Foreign Key

    res.status(500).json({
      success: false,
      message: "Erro ao apagar perfil",
      error: error.message
    });
  }
};

module.exports = controllersPerfil;