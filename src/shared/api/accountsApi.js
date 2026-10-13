import { apiClient } from './client';

export const accountsApi = {
  async getAll() {
    return apiClient('/accounts');
  },

  async getSummary() {
    return apiClient('/accounts/summary');
  },

  async getById(id) {
    return apiClient(`/accounts/${id}`);
  },

  async create(data) {
    return apiClient('/accounts', {
      method: 'POST',
      body: data
    });
  },

  async update(id, data) {
    return apiClient(`/accounts/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async delete(id) {
    return apiClient(`/accounts/${id}`, {
      method: 'DELETE'
    });
  }
};
