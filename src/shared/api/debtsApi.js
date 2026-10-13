import { apiClient } from './client';

export const debtsApi = {
  // isClosed: false = เฉพาะหนี้ที่ยังไม่ปิด (ค่าเริ่มต้นของ BE), true = เฉพาะหนี้ที่ปิดแล้ว
  async getAll(isClosed = false) {
    return apiClient(`/debts?isClosed=${isClosed ? 'true' : 'false'}`);
  },

  async getById(id) {
    return apiClient(`/debts/${id}`);
  },

  async create(data) {
    return apiClient('/debts', {
      method: 'POST',
      body: data
    });
  },

  async update(id, data) {
    return apiClient(`/debts/${id}`, {
      method: 'PUT',
      body: data
    });
  },

  async delete(id) {
    return apiClient(`/debts/${id}`, {
      method: 'DELETE'
    });
  },

  async pay(id, paymentData) {
    return apiClient(`/debts/${id}/pay`, {
      method: 'POST',
      body: paymentData
    });
  },

  async getProfile() {
    return apiClient('/debts/profile');
  },

  async updateProfile(profileData) {
    return apiClient('/debts/profile', {
      method: 'PUT',
      body: profileData
    });
  },

  async simulate(extraMonthlyBudget) {
    const query = extraMonthlyBudget ? `?extraMonthlyBudget=${extraMonthlyBudget}` : '';
    return apiClient(`/debts/simulation${query}`);
  }
};
