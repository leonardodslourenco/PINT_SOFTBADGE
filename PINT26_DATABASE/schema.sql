/*==============================================================*/
/* DBMS name:      Microsoft SQL Server 2017                    */
/*==============================================================*/

-- ELIMINAÇÃO DE TABELAS (ORDEM INVERSA ÀS DEPENDÊNCIAS)
IF OBJECT_ID('NOTIFICACAO', 'U') IS NOT NULL DROP TABLE NOTIFICACAO;
IF OBJECT_ID('SEGUNDA_AVALICAO', 'U') IS NOT NULL DROP TABLE SEGUNDA_AVALICAO;
IF OBJECT_ID('PRIMEIRA_AVALIACAO', 'U') IS NOT NULL DROP TABLE PRIMEIRA_AVALIACAO;
IF OBJECT_ID('EVIDENCIA', 'U') IS NOT NULL DROP TABLE EVIDENCIA;
IF OBJECT_ID('CANDIDATURA_A_BADGE', 'U') IS NOT NULL DROP TABLE CANDIDATURA_A_BADGE;
IF OBJECT_ID('BADGE_ATRIBUIDO', 'U') IS NOT NULL DROP TABLE BADGE_ATRIBUIDO;
IF OBJECT_ID('BADGE', 'U') IS NOT NULL DROP TABLE BADGE;
IF OBJECT_ID('REQUISITO', 'U') IS NOT NULL DROP TABLE REQUISITO;
IF OBJECT_ID('NIVEL', 'U') IS NOT NULL DROP TABLE NIVEL;
IF OBJECT_ID('AREA', 'U') IS NOT NULL DROP TABLE AREA;
IF OBJECT_ID('SERVICE_LINE', 'U') IS NOT NULL DROP TABLE SERVICE_LINE;
IF OBJECT_ID('LEARNING_PATH', 'U') IS NOT NULL DROP TABLE LEARNING_PATH;
IF OBJECT_ID('ADMINISTRADOR', 'U') IS NOT NULL DROP TABLE ADMINISTRADOR;
IF OBJECT_ID('CONSULTOR', 'U') IS NOT NULL DROP TABLE CONSULTOR;
IF OBJECT_ID('SERVICE_LINE_LIDER', 'U') IS NOT NULL DROP TABLE SERVICE_LINE_LIDER;
IF OBJECT_ID('TALENT_MANAGER', 'U') IS NOT NULL DROP TABLE TALENT_MANAGER;
IF OBJECT_ID('PESSOA', 'U') IS NOT NULL DROP TABLE PESSOA;
IF OBJECT_ID('PERFIL_LOOKUP', 'U') IS NOT NULL DROP TABLE PERFIL_LOOKUP;
IF OBJECT_ID('DEPARTAMENTO', 'U') IS NOT NULL DROP TABLE DEPARTAMENTO;
IF OBJECT_ID('TITULO_EMPREGO', 'U') IS NOT NULL DROP TABLE TITULO_EMPREGO;
IF OBJECT_ID('IDIOMA', 'U') IS NOT NULL DROP TABLE IDIOMA;
GO

/*==============================================================*/
/* TABELAS DE SUPORTE / LOOKUP                                  */
/*==============================================================*/

CREATE TABLE IDIOMA (
   N_IDIOMA             INT                  NOT NULL,
   NOME_IDIOMA          VARCHAR(50)          NOT NULL, -- Ex: Português, Inglês, Espanhol
   SIGLA                CHAR(2)              NOT NULL, -- Ex: PT, EN, ES
   CONSTRAINT PK_IDIOMA PRIMARY KEY (N_IDIOMA)
);

CREATE TABLE PERFIL_LOOKUP (
   N_PERFIL_TIPO        INT                  NOT NULL,
   NOME_PERFIL          VARCHAR(50)          NOT NULL, -- Admin, Consultor, TM, SLL
   CONSTRAINT PK_PERFIL_LOOKUP PRIMARY KEY (N_PERFIL_TIPO)
);

CREATE TABLE DEPARTAMENTO (
   N_DEPARTAMENTO       INT                  NOT NULL,
   NOME_DEPARTAMENTO    VARCHAR(100)         NOT NULL,
   CONSTRAINT PK_DEPARTAMENTO PRIMARY KEY (N_DEPARTAMENTO)
);

CREATE TABLE TITULO_EMPREGO (
   N_TITULO_EMPREGO     INT                  NOT NULL,
   NOME_TITULO          VARCHAR(100)         NOT NULL,
   CONSTRAINT PK_TITULO_EMPREGO PRIMARY KEY (N_TITULO_EMPREGO)
);

/*==============================================================*/
/* ESTRUTURA DE UTILIZADORES (HERANÇA)                          */
/*==============================================================*/

CREATE TABLE PESSOA (
   N_PESSOA             INT                  NOT NULL,
   N_PERFIL_TIPO        INT                  NOT NULL,
   N_DEPARTAMENTO       INT                  NULL,
   N_TITULO_EMPREGO     INT                  NULL,
   NOME_COMPLETO        VARCHAR(255)         NOT NULL,
   EMAIL                VARCHAR(150)         NOT NULL UNIQUE,
   PASSWORD_HASH        VARCHAR(255)         NOT NULL,
   PASSWORD_DEFAULT     BIT                  DEFAULT 1, -- Requisito: Trocar no 1º login
   EMAIL_VERIFICADO     BIT                  DEFAULT 0,
   N_TELEFONE           INT                  NULL,
   PAGINA_LINKEDIN      VARCHAR(255)         NULL,
   IDIOMA_PREFERIDO     INT                  NOT NULL,
   DATA_REGISTO         DATETIME             DEFAULT GETDATE(),
   LAST_LOGIN           DATETIME             NULL,
   CONSTRAINT PK_PESSOA PRIMARY KEY (N_PESSOA),
   CONSTRAINT FK_PESSOA_PERFIL FOREIGN KEY (N_PERFIL_TIPO) REFERENCES PERFIL_LOOKUP (N_PERFIL_TIPO),
   CONSTRAINT FK_PESSOA_DEP FOREIGN KEY (N_DEPARTAMENTO) REFERENCES DEPARTAMENTO (N_DEPARTAMENTO),
   CONSTRAINT FK_PESSOA_TITULO FOREIGN KEY (N_TITULO_EMPREGO) REFERENCES TITULO_EMPREGO (N_TITULO_EMPREGO),
   CONSTRAINT FK_PESSOA_IDIOMA FOREIGN KEY (IDIOMA_PREFERIDO) REFERENCES IDIOMA (N_IDIOMA)
);

/*==============================================================*/
/* ESTRUTURA ORGANIZACIONAL                                     */
/*==============================================================*/

CREATE TABLE LEARNING_PATH (
   N_LP                 INT                  NOT NULL,
   NOME_LP              VARCHAR(100)         NOT NULL,
   DESCRICAO            TEXT                 NULL,
   CONSTRAINT PK_LEARNING_PATH PRIMARY KEY (N_LP)
);

CREATE TABLE SERVICE_LINE (
   N_LP                 INT                  NOT NULL,
   N_SL                 INT                  NOT NULL,
   NOME_SL              VARCHAR(100)         NOT NULL,
   CONSTRAINT PK_SERVICE_LINE PRIMARY KEY (N_LP, N_SL),
   CONSTRAINT FK_SL_LP FOREIGN KEY (N_LP) REFERENCES LEARNING_PATH (N_LP)
);

CREATE TABLE AREA (
   N_LP                 INT                  NOT NULL,
   N_SL                 INT                  NOT NULL,
   N_AREA               INT                  NOT NULL,
   NOME_AREA            VARCHAR(100)         NOT NULL,
   CONSTRAINT PK_AREA PRIMARY KEY (N_LP, N_SL, N_AREA),
   CONSTRAINT FK_AREA_SL FOREIGN KEY (N_LP, N_SL) REFERENCES SERVICE_LINE (N_LP, N_SL)
);

/*==============================================================*/
/* ESPECIALIZAÇÕES DE UTILIZADORES                              */
/*==============================================================*/

CREATE TABLE TALENT_MANAGER (
   N_PESSOA             INT                  NOT NULL,
   CONSTRAINT PK_TALENT_MANAGER PRIMARY KEY (N_PESSOA),
   CONSTRAINT FK_TM_PESSOA FOREIGN KEY (N_PESSOA) REFERENCES PESSOA (N_PESSOA)
);

CREATE TABLE SERVICE_LINE_LIDER (
   N_PESSOA             INT                  NOT NULL,
   N_LP                 INT                  NOT NULL,
   N_SL                 INT                  NOT NULL,
   N_AREA               INT                  NOT NULL, -- Requisito: SLL tem de indicar a área
   CONSTRAINT PK_SERVICE_LINE_LIDER PRIMARY KEY (N_PESSOA),
   CONSTRAINT FK_SLL_PESSOA FOREIGN KEY (N_PESSOA) REFERENCES PESSOA (N_PESSOA),
   CONSTRAINT FK_SLL_AREA FOREIGN KEY (N_LP, N_SL, N_AREA) REFERENCES AREA (N_LP, N_SL, N_AREA)
);

CREATE TABLE CONSULTOR (
   N_PESSOA             INT                  NOT NULL,
   N_LP                 INT                  NOT NULL,
   N_SL                 INT                  NOT NULL,
   N_AREA               INT                  NOT NULL, -- Requisito: Escolher área no registo
   N_PONTOS             INT                  DEFAULT 0,
   RGPD_CONSENT         BIT                  DEFAULT 0,
   CONSTRAINT PK_CONSULTOR PRIMARY KEY (N_PESSOA),
   CONSTRAINT FK_CONS_PESSOA FOREIGN KEY (N_PESSOA) REFERENCES PESSOA (N_PESSOA),
   CONSTRAINT FK_CONS_AREA FOREIGN KEY (N_LP, N_SL, N_AREA) REFERENCES AREA (N_LP, N_SL, N_AREA)
);

CREATE TABLE ADMINISTRADOR (
   N_PESSOA             INT                  NOT NULL,
   CONSTRAINT PK_ADMIN PRIMARY KEY (N_PESSOA),
   CONSTRAINT FK_ADMIN_PESSOA FOREIGN KEY (N_PESSOA) REFERENCES PESSOA (N_PESSOA)
);

/*==============================================================*/
/* NÍVEIS, REQUISITOS E BADGES                                  */
/*==============================================================*/

CREATE TABLE NIVEL (
   N_LP                 INT                  NOT NULL,
   N_SL                 INT                  NOT NULL,
   N_AREA               INT                  NOT NULL,
   N_NIVEL              INT                  NOT NULL,
   LETRA_NIVEL          CHAR(1)              NOT NULL, -- A, B, C, D, E
   NOME_NIVEL           VARCHAR(100)         NOT NULL,
   PRAZO_DIAS           INT                  NULL, -- Requisito: Intervalo temporal opcional
   CONSTRAINT PK_NIVEL PRIMARY KEY (N_LP, N_SL, N_AREA, N_NIVEL),
   CONSTRAINT FK_NIVEL_AREA FOREIGN KEY (N_LP, N_SL, N_AREA) REFERENCES AREA (N_LP, N_SL, N_AREA)
);

CREATE TABLE REQUISITO (
   N_REQUISITO          INT                  NOT NULL,
   N_LP                 INT                  NOT NULL,
   N_SL                 INT                  NOT NULL,
   N_AREA               INT                  NOT NULL,
   N_NIVEL              INT                  NOT NULL,
   TITULO               VARCHAR(150)         NOT NULL,
   DESCRICAO            TEXT                 NOT NULL,
   OBRIGATORIO          BIT                  DEFAULT 1,
   CONSTRAINT PK_REQUISITO PRIMARY KEY (N_REQUISITO),
   CONSTRAINT FK_REQ_NIVEL FOREIGN KEY (N_LP, N_SL, N_AREA, N_NIVEL) REFERENCES NIVEL (N_LP, N_SL, N_AREA, N_NIVEL)
);

CREATE TABLE BADGE (
   N_BADGE              INT                  NOT NULL,
   N_LP                 INT                  NOT NULL,
   N_SL                 INT                  NOT NULL,
   N_AREA               INT                  NOT NULL,
   N_NIVEL              INT                  NOT NULL,
   NOME_BADGE           VARCHAR(100)         NOT NULL,
   IMAGEM_URL           VARCHAR(255)         NOT NULL,
   PONTOS_ATRIBUIDOS    INT                  NOT NULL,
   VALIDADE_MESES       INT                  NULL, -- Requisito: Data de expiração opcional
   CONSTRAINT PK_BADGE PRIMARY KEY (N_BADGE),
   CONSTRAINT FK_BADGE_NIVEL FOREIGN KEY (N_LP, N_SL, N_AREA, N_NIVEL) REFERENCES NIVEL (N_LP, N_SL, N_AREA, N_NIVEL)
);

/*==============================================================*/
/* WORKFLOW DE CANDIDATURA                                      */
/*==============================================================*/

CREATE TABLE CANDIDATURA_A_BADGE (
   N_CANDIDATURA        INT                  NOT NULL,
   N_PESSOA             INT                  NOT NULL, -- Consultor
   N_BADGE              INT                  NOT NULL,
   DATA_SUBMISSAO       DATETIME             DEFAULT GETDATE(),
   ESTADO               VARCHAR(20)          NOT NULL, -- Open, Submitted, Em Validação, Fechado
   DATA_CONCLUSAO       DATETIME             NULL,
   CONSTRAINT PK_CANDIDATURA PRIMARY KEY (N_CANDIDATURA),
   CONSTRAINT FK_CAND_CONSULTOR FOREIGN KEY (N_PESSOA) REFERENCES CONSULTOR (N_PESSOA),
   CONSTRAINT FK_CAND_BADGE FOREIGN KEY (N_BADGE) REFERENCES BADGE (N_BADGE)
);

CREATE TABLE EVIDENCIA (
   N_EVIDENCIA          INT                  NOT NULL,
   N_CANDIDATURA        INT                  NOT NULL,
   N_REQUISITO          INT                  NOT NULL,
   URL_FICHEIRO         VARCHAR(255)         NOT NULL,
   DATA_UPLOAD          DATETIME             DEFAULT GETDATE(),
   CONSTRAINT PK_EVIDENCIA PRIMARY KEY (N_EVIDENCIA),
   CONSTRAINT FK_EVID_CANDIDATURA FOREIGN KEY (N_CANDIDATURA) REFERENCES CANDIDATURA_A_BADGE (N_CANDIDATURA),
   CONSTRAINT FK_EVID_REQ FOREIGN KEY (N_REQUISITO) REFERENCES REQUISITO (N_REQUISITO)
);

CREATE TABLE PRIMEIRA_AVALIACAO (
   N_CANDIDATURA        INT                  NOT NULL,
   N_TM                 INT                  NOT NULL, -- Talent Manager
   DATA_AVALIACAO       DATETIME             DEFAULT GETDATE(),
   RESULTADO            VARCHAR(20)          NOT NULL, -- Correto / Incorreto
   OBSERVACOES          TEXT                 NULL,
   CONSTRAINT PK_PRIMEIRA_AVAL PRIMARY KEY (N_CANDIDATURA),
   CONSTRAINT FK_AVAL1_CANDIDATURA FOREIGN KEY (N_CANDIDATURA) REFERENCES CANDIDATURA_A_BADGE (N_CANDIDATURA),
   CONSTRAINT FK_AVAL1_TM FOREIGN KEY (N_TM) REFERENCES TALENT_MANAGER (N_PESSOA)
);

CREATE TABLE SEGUNDA_AVALICAO (
   N_CANDIDATURA        INT                  NOT NULL,
   N_SLL                INT                  NOT NULL, -- Service Line Leader
   DATA_AVALIACAO       DATETIME             DEFAULT GETDATE(),
   RESULTADO            VARCHAR(20)          NOT NULL, -- Aprovar / Rejeitar / Send Back
   OBSERVACOES          TEXT                 NULL,
   CONSTRAINT PK_SEGUNDA_AVAL PRIMARY KEY (N_CANDIDATURA),
   CONSTRAINT FK_AVAL2_CANDIDATURA FOREIGN KEY (N_CANDIDATURA) REFERENCES CANDIDATURA_A_BADGE (N_CANDIDATURA),
   CONSTRAINT FK_AVAL2_SLL FOREIGN KEY (N_SLL) REFERENCES SERVICE_LINE_LIDER (N_PESSOA)
);

/*==============================================================*/
/* GAMIFICAÇÃO E NOTIFICAÇÕES                                   */
/*==============================================================*/

CREATE TABLE BADGE_ATRIBUIDO (
   N_ATRIBUICAO         INT                  NOT NULL,
   N_PESSOA             INT                  NOT NULL,
   N_BADGE              INT                  NOT NULL,
   DATA_ATRIBUICAO      DATETIME             DEFAULT GETDATE(),
   URL_PUBLICO_VERIF    VARCHAR(255)         NOT NULL, -- Requisito: Link único público
   CONSTRAINT PK_BADGE_ATRIBUIDO PRIMARY KEY (N_ATRIBUICAO),
   CONSTRAINT FK_ATRIB_CONSULTOR FOREIGN KEY (N_PESSOA) REFERENCES CONSULTOR (N_PESSOA),
   CONSTRAINT FK_ATRIB_BADGE FOREIGN KEY (N_BADGE) REFERENCES BADGE (N_BADGE)
);

CREATE TABLE NOTIFICACAO (
   N_NOTIFICACAO        INT                  NOT NULL,
   N_PESSOA_ALVO        INT                  NOT NULL,
   TITULO               VARCHAR(100)         NOT NULL,
   MENSAGEM             TEXT                 NOT NULL,
   LIDA                 BIT                  DEFAULT 0,
   DATA_ENVIO           DATETIME             DEFAULT GETDATE(),
   CONSTRAINT PK_NOTIFICACAO PRIMARY KEY (N_NOTIFICACAO),
   CONSTRAINT FK_NOTIF_PESSOA FOREIGN KEY (N_PESSOA_ALVO) REFERENCES PESSOA (N_PESSOA)
);
GO