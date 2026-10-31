import { api } from './api'; // Instância do Axios com intercetores configurada

export const apiBadge = {
  
  /**
   * Busca todos os badges.
   * @param {string} ativo - Filtro opcional ('true', 'false' ou vazio para todos)
   */
  getAll: async (ativo = '') => {
    try {
      const response = await api.get(`/badge?ativo=${ativo}`);
      return response.data;
    } catch (error) {
      console.error("Erro ao obter todos os badges:", error);
      throw error;
    }
  },

  /**
   * Busca badges filtrados por nível.
   * @param {number|string} idNivel - O ID do nível da área
   * @param {string} ativo - Filtro opcional ('true', 'false' ou vazio)
   */
  getByNivel: async (idNivel, ativo = '') => {
    try {
      const response = await api.get(`/badge/nivel/${idNivel}?ativo=${ativo}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter badges do nível ${idNivel}:`, error);
      throw error;
    }
  },

  /**
   * Busca detalhes de um badge específico pelo seu UUID.
   */
  getDetail: async (id) => {
    try {
      const response = await api.get(`/badge/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao obter detalhes do badge ${id}:`, error);
      throw error;
    }
  },

  /**
   * Cria um novo badge.
   * @param {object} badgeData - Objeto contendo os dados do badge
   */
  create: async (badgeData) => {
    try {
      const response = await api.post('/badge', badgeData);
      return response.data;
    } catch (error) {
      console.error("Erro ao criar badge:", error);
      throw error;
    }
  },

  /**
   * Atualiza os dados completos de um badge (PUT).
   */
  update: async (id, badgeData) => {
    try {
      const response = await api.put(`/badge/${id}`, badgeData);
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar badge ${id}:`, error);
      throw error;
    }
  },

  /**
   * Atualiza apenas o status (ativo/inativo) do badge (PATCH).
   */
  updateStatus: async (id, badgeAtivo) => {
    try {
      const response = await api.patch(`/badge/${id}/status`, { badgeAtivo });
      return response.data;
    } catch (error) {
      console.error(`Erro ao atualizar status do badge ${id}:`, error);
      throw error;
    }
  },

  /**
   * Desativa (Soft Delete) um badge.
   */
  delete: async (id) => {
    try {
      const response = await api.delete(`/badge/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Erro ao desativar badge ${id}:`, error);
      throw error;
    }
  }
};