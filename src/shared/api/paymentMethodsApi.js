import { apiClient } from './client';

export const paymentMethodsApi = {
  async getAll() {
    return apiClient('/payment-methods');
  },

  // BE หาตามชื่อ ถ้ายังไม่มีจะสร้างให้ (เรียกซ้ำด้วยชื่อเดิมได้ id เดิม)
  async ensure(name) {
    return apiClient('/payment-methods', {
      method: 'POST',
      body: { name }
    });
  }
};
