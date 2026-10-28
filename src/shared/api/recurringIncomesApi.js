import { apiClient } from './client';

export const recurringIncomesApi = {
  async getAll() {
    return apiClient('/recurring-incomes');
  },

  async create(data) {
    return apiClient('/recurring-incomes', {
      method: 'POST',
      body: data
    });
  },

  // data รวม effectiveFrom
  async update(id, data) {
    return apiClient(`/recurring-incomes/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async delete(id) {
    return apiClient(`/recurring-incomes/${id}`, {
      method: 'DELETE'
    });
  },

  // data: { periodMonth: 'YYYY-MM-01', recurringIncomeIds: [], included: boolean }
  async setInclusion(data) {
    return apiClient('/recurring-incomes/inclusion', {
      method: 'PUT',
      body: data
    });
  }
};
