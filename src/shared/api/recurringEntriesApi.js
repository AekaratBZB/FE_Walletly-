import { apiClient } from './client';

export const recurringEntriesApi = {
  async getProjected({ startDate, endDate }) {
    const query = new URLSearchParams();
    if (startDate) query.append('startDate', startDate);
    if (endDate) query.append('endDate', endDate);
    return apiClient(`/recurring-entries/projected?${query.toString()}`);
  },

  async materialize({ sourceType, sourceId, period, amount, txDate, note }) {
    return apiClient('/recurring-entries/materialize', {
      method: 'POST',
      body: { sourceType, sourceId, period, amount, txDate, note }
    });
  },

  async exclude({ sourceType, sourceId, period }) {
    return apiClient('/recurring-entries/exclude', {
      method: 'POST',
      body: { sourceType, sourceId, period }
    });
  }
};
