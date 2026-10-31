// =========================================================================
// IMPORTAÇÃO DE COMPONENTES ORM E DEPENDÊNCIAS DE PERMISSÕES
// =========================================================================
const sequelize = require('../config/database');                      // Instância do Sequelize para controlo ACID por transações SQL
const PerfilUtilizador = require('../models/perfil_utilizador.model');   // Modelo da tabela pivot de associação Muitos-para-Muitos

// REGRA DE NEGÓCIO: ID estático que mapeia o nível de acesso básico e obrigatório de qualquer conta no sistema
const PERFIL_CONSULTOR = 4;

/**
 * SERVIÇO: removerPerfil
 * Governa a remoção segura de permissões, blindando o sistema contra utilizadores sem cargo.
 */
async function removerPerfil(id_utilizador, id_perfil) {

  // Inicia uma transação SQL isolada. Se alguma das validações ou escritas falhar, reverte tudo.
  const t = await sequelize.transaction();

  try {
    // 1. CARREGAMENTO DOS PERFIS ATUAIS:
    // Procura todas as permissões associadas a este utilizador específico na tabela intermédia
    const perfis = await PerfilUtilizador.findAll({
      where: { id_utilizador },
      transaction: t // Garante que a leitura faz parte do bloco transacional ativo
    });

    // FLUXO DE REMOÇÃO SIMPLES (Cenário A):
    // Se o utilizador possui mais do que um perfil (ex: é Admin e também Consultor)
    if (perfis.length > 1) {
      // Elimina fisicamente apenas a associação do perfil que foi solicitado
      await PerfilUtilizador.destroy({
        where: { id_utilizador, id_perfil },
        transaction: t
      });

      // Consolida a operação com sucesso na base de dados e interrompe a execução da função
      await t.commit();
      return;
    }

    // FLUXO DEFENSIVO AVANÇADO (Cenário B - O utilizador tem apenas 1 único perfil):
    // Captura o ID do último perfil resistente que o utilizador possui
    const perfilAtual = perfis[0].id_perfil;

    // Se o único perfil que lhe resta já for o perfil mínimo de 'Consultor', barra a operação.
    // Uma conta ativa nunca pode ficar com menos direitos do que um consultor comum.
    if (perfilAtual === PERFIL_CONSULTOR) {
      throw new Error("Não é possível remover o único perfil 'Consultor'."); // Dispara exceção para o catch
    }

    // ALGORITMO DE DESPROMOÇÃO DE SEGURANÇA (Mecanismo de Salvaguarda):
    // Se o utilizador tinha apenas um perfil e ele NÃO era Consultor (ex: era apenas Admin),
    // para evitar que a conta fique flutuante com 0 perfis (gerando falhas graves no middleware de rotas),
    // primeiro Criamos de forma preventiva o vínculo com o Perfil de Consultor...
    await PerfilUtilizador.create({
      id_utilizador,
      id_perfil: PERFIL_CONSULTOR
    }, { transaction: t });

    // ...e só depois é que avançamos para a destruição física do perfil antigo (ex: Admin)
    await PerfilUtilizador.destroy({
      where: { id_utilizador, id_perfil },
      transaction: t
    });

    // Grava de forma atómica e sequencial ambas as operações no PostgreSQL
    await t.commit();

  } catch (error) {
    // PROTEÇÃO ATÓMICA: Se o utilizador tentou remover o único perfil Consultor 
    // ou se ocorreu erro de restrição, cancela qualquer inserção intermédia, mantendo a BD intacta.
    await t.rollback();
    throw error; // Lança o erro para o controlador capturar e responder à rede HTTP
  }
}

module.exports = {
  removerPerfil
};