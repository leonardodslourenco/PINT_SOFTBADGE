# SoftBadge - Base de Dados (PostgreSQL)

Esquema relacional utilizado pela plataforma SoftBadge.

## Conteúdo

- [`schema.sql`](./schema.sql) - Script DDL para criação das tabelas, chaves primárias, chaves estrangeiras e restrições de integridade.

## Inicialização

1. Ter o PostgreSQL 14+ em execução (porta `5432`).
2. Criar a base de dados:
   ```sql
   CREATE DATABASE softbadge;
   ```
3. Importar o esquema:
   ```bash
   psql -U postgres -d softbadge -f schema.sql
   ```
4. Ao iniciar o servidor em `PINT26_BACKEND`, o Sequelize valida a ligação e carrega os dados base necessários ao funcionamento da plataforma.
