// =========================================================================
// IMPORTAÇÃO DE MODELOS ORM, DEPENDÊNCIAS DE BASE DE DADOS E VALIDADORES
// =========================================================================
const PerfilUtilizador = require('../models/perfil_utilizador.model');   // Modelo da tabela pivot / intermédia de junção (N:M)
const sequelize = require('../config/database');                        // Instância do Sequelize para controlo de transações ACID
const gestaoPerfil = require('../services/gestaoPerfil');               // Serviço isolado com as regras de negócio para remoção/gestão de perfis
const validaUUID = require('../services/valida_UUID');                  // Utilitário defensivo para validar o formato estrito UUIDv7
const validaIDInteiro = require('../services/valida_id_inteiro');         // Utilitário defensivo para higienizar e validar números inteiros

// Objeto local que vai agrupar e exportar os métodos do controlador
const controllerPerfilUtilizador = {};

// =========================================================================
// MÉTODOS CONTROLADORES PÚBLICOS (ENDPOINTS DA API REST)
// =========================================================================

/**
 * 1. ATRIBUIR PERFIL AO UTILIZADOR
 * Associa uma nova função/permissão a uma conta, sob estrita proteção transacional.
 * URL Exemplo: POST /perfil_utilizador
 */
controllerPerfilUtilizador.addPerfil = async (req, res) => {
  // Inicia uma transação SQL isolada. Se algo falhar, impede dados órfãos ou inconsistentes
  const transaction = await sequelize.transaction();

  try {
    const { id_utilizador, id_perfil } = req.body;
    
    // CIBERSEGURANÇA / VALIDAÇÃO PRECOCE:
    // Garante que o ID do utilizador é um UUIDv7 válido E que o ID do perfil é um número inteiro válido.
    if (!id_utilizador || !validaUUID(id_utilizador, 7) || !id_perfil || !validaIDInteiro(id_perfil)) {
      await transaction.rollback(); // Cancela a transação antes de fechar o pedido
      return res.status(400).json({ // Status 400 Bad Request
        success: false,
        message: "id_utilizador e id_perfil são obrigatórios",
        data: null
      });
    }

    // REGRA DE NEGÓCIO: Verifica se esta associação exata já existe fisicamente na base de dados
    const existente = await PerfilUtilizador.findOne({
      where: { id_utilizador, id_perfil },
      transaction // Acopla a query à transação ativa
    });

    // Se o utilizador já possuir este perfil associado, aborta a operação para evitar duplicados lógicos
    if (existente) {
      await transaction.rollback(); // Desfaz e encerra a transação
      return res.status(400).json({
        success: false,
        message: "O utilizador já possui este perfil",
        data: null
      });
    }

    // Se passou as validações, cria o novo registo na tabela pivot de associação
    const novo = await PerfilUtilizador.create({
      id_utilizador,
      id_perfil
    }, { transaction });

    // Se todas as instruções correram a 100%, consolida em definitivo a gravação no PostgreSQL
    await transaction.commit();

    res.status(200).json({
      success: true,
      message: "Perfil atribuído ao utilizador",
      data: novo
    });

  } catch (error) {
    // Caso ocorra qualquer exceção de rede ou BD, garante que nada fica guardado a meio
    await transaction.rollback();

    res.status(500).json({ // Status 500 Internal Server Error
      success: false,
      message: "Erro ao atribuir perfil",
      data: null
    });
  }
};

/**
 * 2. LISTAR PERFIS DE UM UTILIZADOR
 * Recupera todas as funções/permissões associadas a uma conta específica passada no URL.
 * URL Exemplo: GET /perfil_utilizador/:id_utilizador
 */
controllerPerfilUtilizador.listPerfis = async (req, res) => {
  try {
    const { id_utilizador } = req.params; // Captura o ID dos parâmetros de rota amigáveis
    
    // Programação Defensiva: Valida o formato da string recebida antes de consultar a BD
    if (!id_utilizador || !validaUUID(id_utilizador, 7)) {
      return res.status(400).json({
        success: false,
        message: "id_utilizador é obrigatório",
        data: null
      });
    }

    // Faz a busca na tabela pivot por todas as linhas que pertençam ao ID do utilizador indicado
    const perfis = await PerfilUtilizador.findAll({
      where: { id_utilizador }
    });

    res.status(200).json({
      success: true,
      message: "Perfis recuperados",
      data: perfis
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Erro ao listar perfis",
      data: null
    });
  }
};

/**
 * 3. REMOVER PERFIL DO UTILIZADOR
 * Desvincula uma permissão de uma conta através de um serviço isolado de regras de negócio.
 * URL Exemplo: DELETE /perfil_utilizador/:id_utilizador/:id_perfil
 */
controllerPerfilUtilizador.deletePerfil = async (req, res) => {
  try {
    const { id_utilizador, id_perfil } = req.params; // Captura o par de IDs que compõem o URL composto
    
    // Validação rígida cruzada de formatos (UUIDv7 + Inteiro) nos parâmetros da rota
    if (!id_utilizador || !validaUUID(id_utilizador, 7) || !id_perfil || !validaIDInteiro(id_perfil)) {
      return res.status(400).json({
        success: false,
        message: "id_utilizador e id_perfil são obrigatórios",
        data: null
      });
    }

    // DESACOPLAMENTO DE CÓDIGO (BOAS PRÁTICAS):
    // Em vez de escrever queries diretamente aqui, o controlador invoca a função utilitária do service.
    // O service 'gestaoPerfil' vai validar se a remoção quebra alguma regra (ex: não deixar o sistema sem nenhum ADMIN).
    await gestaoPerfil.removerPerfil(id_utilizador, id_perfil);

    res.status(200).json({
      success: true,
      message: "Perfil removido do utilizador"
    });

  } catch (error) {
    // Se o Service lançar um erro (throw new Error), o fluxo salta para aqui e devolve a mensagem customizada do erro
    res.status(400).json({
      success: false,
      message: error.message,
      data: null
    });
  }
};

// Exporta o módulo controlador para ser associado ao router do Express
module.exports = controllerPerfilUtilizador;