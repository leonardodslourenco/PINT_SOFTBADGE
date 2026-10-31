const Sequelize = require('sequelize');


// Cria uma nova instância do Sequelize para configurar a ligação à base de dados
const sequelize = new Sequelize(
  //Parâmetros de configuração da base de dados, obtidos a partir das variáveis de ambiente ou valores padrão
  process.env.DB_NAME || 'softbadge',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  // 4º Parâmetro: Objeto de configuração adicional com os detalhes do servidor
  {
    host: process.env.DB_HOST || 'localhost', // Define o endereço do servidor onde a base de dados está alojada (ex: 'localhost')
    port: Number(process.env.DB_PORT || 5432), // Define o porto de escuta do PostgreSQL (converte para Número, usando o porto padrão 5432)
    dialect: process.env.DB_DIALECT || 'postgres', // Especifica o dialeto da base de dados, indicando ao Sequelize que estamos a usar o PostgreSQL
    logging: console.log, // Desativa a exibição dos comandos SQL puros no terminal (mantém a consola limpa durante a execução)
  }
);

sequelize.authenticate()
  .then(() => console.log('Conectado à BD:', sequelize.config.database))
  .catch(err => console.error('Erro de conexão:', err));
module.exports = sequelize;