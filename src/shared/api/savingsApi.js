import { apiClient } from './client';

export const savingsApi = {
  async getAll() {
    return apiClient('/savings-goals');
  },

  async getSummary() {
    return apiClient('/savings-goals/summary');
  },

  async getById(id) {
    return apiClient(`/savings-goals/${id}`);
  },

  async create(data) {
    return apiClient('/savings-goals', {
      method: 'POST',
      body: data
    });
  },

  async update(id, data) {
    return apiClient(`/savings-goals/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async delete(id) {
    return apiClient(`/savings-goals/${id}`, {
      method: 'DELETE'
    });
  },

  async deposit(id, depositData) {
    return apiClient(`/savings-goals/${id}/deposit`, {
      method: 'POST',
      body: depositData
    });
  },

  async withdraw(id, withdrawData) {
    return apiClient(`/savings-goals/${id}/withdraw`, {
      method: 'POST',
      body: withdrawData
    });
  }
};
