import { apiClient } from './client';

export const transactionsApi = {
  async getAll(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page);
    if (params.pageSize) query.append('pageSize', params.pageSize);
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);
    if (params.type) query.append('type', params.type);
    if (params.categoryId) query.append('categoryId', params.categoryId);
    if (params.search) query.append('search', params.search);

    const queryString = query.toString();
    return apiClient(`/transactions${queryString ? `?${queryString}` : ''}`);
  },

  async getSummary(params = {}) {
    const query = new URLSearchParams();
    if (params.startDate) query.append('startDate', params.startDate);
    if (params.endDate) query.append('endDate', params.endDate);

    const queryString = query.toString();
    return apiClient(`/transactions/summary${queryString ? `?${queryString}` : ''}`);
  },

  async getById(id) {
    return apiClient(`/transactions/${id}`);
  },

  async create(data) {
    return apiClient('/transactions', {
      method: 'POST',
      body: data
    });
  },

  async update(id, data) {
    return apiClient(`/transactions/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async delete(id) {
    return apiClient(`/transactions/${id}`, {
      method: 'DELETE'
    });
  }
};
