const PostagemMiniforum = require('../models/postagem_miniforum.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');

const ADMIN_ID = '019d6cd2-baad-721b-8e8d-9761f013ceb6'; // John Doe (Admin)

const postsExemplo = [
  {
    id_postagem_miniforum: '019fb95e-0782-7019-a381-144682e3f3ef',
    id_utilizador_autor: ADMIN_ID,
    id_categoria_miniforum: 1, // Avisos Gerais
    id_perfil_alvo: null, // Visível para todos os utilizadores
    id_traducao_titulo: '019fb95e-0782-7019-a381-1b0560021026',
    id_traducao_mensagem: '019fb95e-0782-7019-a381-1cc256f5224d',
    titulo: {
      tabela: 'postagem_miniforum',
      coluna: 'titulo',
      pt: 'Boas-Vindas à Plataforma SoftBadge!',
      en: 'Welcome to the SoftBadge Platform!',
      es: '¡Bienvenidos a la Plataforma SoftBadge!'
    },
    mensagem: {
      tabela: 'postagem_miniforum',
      coluna: 'conteudo',
      pt: 'Estamos felizes por anunciar o lançamento do nosso ecossistema de avaliação e atribuição de badges. Explore as suas Learning Paths e submeta evidências!',
      en: 'We are happy to announce the launch of our badge evaluation and awarding ecosystem. Explore your Learning Paths and submit evidence!',
      es: '¡Nos complace anunciar el lanzamiento de nuestro ecosistema de evaluación y asignación de badges. ¡Explore sus Learning Paths y envíe evidencias!'
    }
  },
  {
    id_postagem_miniforum: '019fb95e-0782-7019-a381-2258cf0f75e9',
    id_utilizador_autor: ADMIN_ID,
    id_categoria_miniforum: 2, // Diretivas & Processos
    id_perfil_alvo: 3, // Destinado apenas a TMs (Talent Managers)
    id_traducao_titulo: '019fb95e-0782-7019-a381-27f5d0949a0e',
    id_traducao_mensagem: '019fb95e-0782-7019-a381-29aeb4d0477f',
    titulo: {
      tabela: 'postagem_miniforum',
      coluna: 'titulo',
      pt: 'Guia de Pré-Validação de Candidaturas para TMs',
      en: 'Candidate Application Pre-Validation Guide for TMs',
      es: 'Guía de Preadmisión de Solicitudes para TMs'
    },
    mensagem: {
      tabela: 'postagem_miniforum',
      coluna: 'conteudo',
      pt: 'Caros Talent Managers, ao realizarem a pré-validação de uma evidência, certifiquem-se de verificar o formato do ficheiro e se os requisitos do nível foram integralmente cumpridos.',
      en: 'Dear Talent Managers, when pre-validating evidence, please ensure the file format is valid and level requirements are fully satisfied.',
      es: 'Estimados Talent Managers, al realizar la preadmisión de una evidencia, asegúrese de verificar el formato del archivo y el cumplimiento de los requisitos del nivel.'
    }
  },
  {
    id_postagem_miniforum: '019fb95e-0782-7019-a381-2c8b0cb27556',
    id_utilizador_autor: ADMIN_ID,
    id_categoria_miniforum: 3, // Learning Paths & Cursos
    id_perfil_alvo: 4, // Destinado a Consultores
    id_traducao_titulo: '019fb95e-0782-7019-a381-304494d0918d',
    id_traducao_mensagem: '019fb95e-0782-7019-a381-350074a75436',
    titulo: {
      tabela: 'postagem_miniforum',
      coluna: 'titulo',
      pt: 'Novas Trilhas de Aprendizagem Disponíveis',
      en: 'New Learning Paths Available',
      es: 'Nuevas Rutas de Aprendizaje Disponibles'
    },
    mensagem: {
      tabela: 'postagem_miniforum',
      coluna: 'conteudo',
      pt: 'Já estão disponíveis novas opções nas Learning Paths. Escolha o seu próximo objetivo de carreira e inicie o processo de candidatura a novos badges!',
      en: 'New options are now available in Learning Paths. Choose your next career milestone and start applying for new badges!',
      es: 'Nuevas opciones ya están disponibles en las Learning Paths. ¡Elija su próximo objetivo profesional e inicie la solicitud de nuevos badges!'
    }
  }
];

async function seedPostagemMiniforum(transaction) {
  try {
    for (const post of postsExemplo) {
      await TraducaoConteudo.findOrCreate({
        where: { id_traducao_conteudo: post.id_traducao_titulo },
        defaults: {
          id_traducao_conteudo: post.id_traducao_titulo,
          ...post.titulo
        },
        transaction
      });

      await TraducaoConteudo.findOrCreate({
        where: { id_traducao_conteudo: post.id_traducao_mensagem },
        defaults: {
          id_traducao_conteudo: post.id_traducao_mensagem,
          ...post.mensagem
        },
        transaction
      });

      await PostagemMiniforum.findOrCreate({
        where: { id_postagem_miniforum: post.id_postagem_miniforum },
        defaults: {
          id_postagem_miniforum: post.id_postagem_miniforum,
          id_utilizador_autor: post.id_utilizador_autor,
          id_categoria_miniforum: post.id_categoria_miniforum,
          id_perfil_alvo: post.id_perfil_alvo,
          id_traducao_titulo: post.id_traducao_titulo,
          id_traducao_mensagem: post.id_traducao_mensagem,
          postagem_visivel: true
        },
        transaction
      });
    }
    console.log("Seed PostagemMiniforum executado com sucesso.");
  } catch (error) {
    console.error("Erro ao executar Seed PostagemMiniforum:", error.message);
    throw error;
  }
}

module.exports = seedPostagemMiniforum;
