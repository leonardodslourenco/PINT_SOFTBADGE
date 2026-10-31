const CategoriaMiniforum = require('../models/categoria_miniforum.model');
const TraducaoConteudo = require('../models/traducao_conteudo.model');

const categoriasDefault = [
  {
    id_categoria_miniforum: 1,
    id_traducao_nome_categoria: '019fb95e-0781-76d1-9304-8c66e28168dd',
    traducao: {
      tabela: 'categoria_miniforum',
      coluna: 'nome_categoria',
      pt: 'Avisos Gerais',
      en: 'General Announcements',
      es: 'Avisos Generales'
    }
  },
  {
    id_categoria_miniforum: 2,
    id_traducao_nome_categoria: '019fb95e-0782-7019-a380-e543c321fc74',
    traducao: {
      tabela: 'categoria_miniforum',
      coluna: 'nome_categoria',
      pt: 'Diretivas & Processos',
      en: 'Directives & Processes',
      es: 'Directivas y Procesos'
    }
  },
  {
    id_categoria_miniforum: 3,
    id_traducao_nome_categoria: '019fb95e-0782-7019-a380-e83870b4c1eb',
    traducao: {
      tabela: 'categoria_miniforum',
      coluna: 'nome_categoria',
      pt: 'Learning Paths & Cursos',
      en: 'Learning Paths & Courses',
      es: 'Learning Paths y Cursos'
    }
  },
  {
    id_categoria_miniforum: 4,
    id_traducao_nome_categoria: '019fb95e-0782-7019-a380-ed9ccc3f6f93',
    traducao: {
      tabela: 'categoria_miniforum',
      coluna: 'nome_categoria',
      pt: 'Badges & Reconhecimento',
      en: 'Badges & Recognition',
      es: 'Badges y Reconocimiento'
    }
  },
  {
    id_categoria_miniforum: 5,
    id_traducao_nome_categoria: '019fb95e-0782-7019-a380-f00a521f8c43',
    traducao: {
      tabela: 'categoria_miniforum',
      coluna: 'nome_categoria',
      pt: 'Eventos & Notícias',
      en: 'Events & News',
      es: 'Eventos y Noticias'
    }
  }
];

async function seedCategoriaMiniforum(transaction) {
  try {
    for (const cat of categoriasDefault) {
      await TraducaoConteudo.findOrCreate({
        where: { id_traducao_conteudo: cat.id_traducao_nome_categoria },
        defaults: {
          id_traducao_conteudo: cat.id_traducao_nome_categoria,
          ...cat.traducao
        },
        transaction
      });

      await CategoriaMiniforum.findOrCreate({
        where: { id_categoria_miniforum: cat.id_categoria_miniforum },
        defaults: {
          id_categoria_miniforum: cat.id_categoria_miniforum,
          id_traducao_nome_categoria: cat.id_traducao_nome_categoria,
          relacionamentoAtivo: true
        },
        transaction
      });
    }
    console.log("Seed CategoriaMiniforum executado com sucesso.");
  } catch (error) {
    console.error("Erro ao executar Seed CategoriaMiniforum:", error.message);
    throw error;
  }
}

module.exports = seedCategoriaMiniforum;
