import { describe, it, expect } from 'vitest';
import { toRecurringIncomePayload } from '../RecurringIncomeModal';

const base = {
  title: ' เงินเดือน ',
  amount: '50000',
  payDay: '1',
  categoryId: 'cat-1',
  startMonth: '2026-10',
  durationMonths: '12',
  note: ' x ',
  effectiveFrom: null
};

describe('toRecurringIncomePayload', () => {
  it('คำนวณเดือนสิ้นสุดจากเดือนเริ่มและระยะเวลา', () => {
    const p = toRecurringIncomePayload(base);
    expect(p.startMonth).toBe('2026-10-01');
    expect(p.endMonth).toBe('2027-09-01');
    expect(p.title).toBe('เงินเดือน');
    expect(p.amount).toBe(50000);
    expect(p.payDay).toBe(1);
    expect(p.categoryId).toBe('cat-1');
    expect(p.note).toBe('x');
  });

  it('ระยะเวลาว่าง = ไม่มีกำหนด', () => {
    expect(toRecurringIncomePayload({ ...base, durationMonths: '' }).endMonth).toBeNull();
  });

  it('effectiveFrom ส่งผ่านเป็น YYYY-MM-01', () => {
    expect(toRecurringIncomePayload({ ...base, effectiveFrom: '2026-11' }).effectiveFrom).toBe('2026-11-01');
  });
});
