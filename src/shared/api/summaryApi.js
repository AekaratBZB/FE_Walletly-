import { apiClient } from './client';

// ยอดสรุปที่ BE คำนวณ (แหล่งตัวเลขเดียวของหน้าภาพรวมและรายงาน) เดือนเป็น 'YYYY-MM' (ค.ศ.)
export const summaryApi = {
  async getMonthly(month) {
    return apiClient(`/summary/monthly?month=${encodeURIComponent(month)}`);
  },

  async getReport(fromMonth, toMonth) {
    const query = new URLSearchParams({ fromMonth, toMonth });
    return apiClient(`/summary/report?${query.toString()}`);
  }
};
