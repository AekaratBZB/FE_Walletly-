import { apiClient } from './client';

export const categoriesApi = {
  async getAll(type = null) {
    const query = type ? `?type=${type}` : '';
    return apiClient(`/categories${query}`);
  },

  async create(categoryData) {
    return apiClient('/categories', {
      method: 'POST',
      body: categoryData
    });
  },

  async update(id, categoryData) {
    return apiClient(`/categories/${id}`, {
      method: 'PUT',
      body: categoryData
    });
  },

  async delete(id) {
    return apiClient(`/categories/${id}`, {
      method: 'DELETE'
    });
  }
};
