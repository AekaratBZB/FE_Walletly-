import { apiClient } from './client';

// BE บน Cloud Run หลับเมื่อไม่มี traffic (scale to zero): ยิงครั้งเดียวตั้งแต่เปิดแอป
// ให้ server เริ่ม boot ไปพร้อมกับที่ React โหลด แล้วทุกจุดใช้ promise เดียวกัน
let warmUpPromise = null;

export const healthApi = {
  async check() {
    return apiClient('/health');
  },

  warmUp() {
    if (!warmUpPromise) {
      warmUpPromise = healthApi.check();
      // อย่าให้ promise ที่ล้มเหลวค้างอยู่: ครั้งถัดไปจะได้ลองใหม่
      warmUpPromise.catch(() => {
        warmUpPromise = null;
      });
    }
    return warmUpPromise;
  },

  async checkDb() {
    return apiClient('/health/db-check');
  }
};
