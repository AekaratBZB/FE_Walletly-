import React, { useState } from 'react';
import { formatCurrency, formatMonthLabel } from '../../shared/formatters';
import { CalendarRange } from 'lucide-react';

/**
 * The monthly schedule. Columns mirror MonthlyProjection exactly so the table
 * can be compared against the golden vectors by eye — it is the primary
 * debugging tool for the engine as well as a user-facing view.
 */
export const ScheduleTable = ({ projection }) => {
  const [limit, setLimit] = useState(24);
  const rows = projection.Months.slice(0, limit);

  if (!projection.Months.length) {
    return null;
  }

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <CalendarRange size={18} />
            <span>ตารางจำลองรายเดือน</span>
          </div>
          <div className="card-subtitle">
            แถวสีอ่อนคือเดือนที่เงินต้นยังไม่ลด เพราะเงินที่จ่ายไปหมดกับดอกเบี้ยค้าง
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <label className="text-xs text-muted">แสดง:</label>
          <select
            className="form-select"
            style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: '130px' }}
            value={limit}
            onChange={(e) => setLimit(parseInt(e.target.value, 10))}
          >
            <option value="12">12 เดือนแรก</option>
            <option value="24">24 เดือนแรก</option>
            <option value="60">60 เดือนแรก</option>
            <option value="600">ทั้งหมด</option>
          </select>
        </div>
      </div>

      <div className="table-container" style={{ maxHeight: '520px', overflowY: 'auto' }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>เดือน</th>
              <th className="text-right">ค่างวดผ่อน</th>
              <th className="text-right">เงินเหลือ</th>
              <th className="text-right">กองฉุกเฉิน</th>
              <th className="text-right">จ่ายหนี้</th>
              <th className="text-right">ดอกเบี้ยเดือนนี้</th>
              <th className="text-right">ดอกค้างสะสม</th>
              <th className="text-right">เงินต้นคงเหลือ</th>
              <th className="text-right">เพดานงบกินใช้</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((m) => {
              // "Principal did not fall" is not the same as "payment did not
              // cover this month's interest" — a payment can exceed the month's
              // interest and still go entirely to clearing older arrears.
              // The honest signal is whether any principal was actually repaid.
              const principalRepaid = m.perDebt.reduce(
                (sum, d) => sum + d.principalPortion,
                0
              );
              const principalStuck = principalRepaid <= 0.005;
              const isArrearsCleared = projection.InterestArrearsClearedMonth === m.Index;

              return (
                <tr
                  key={m.Index}
                  style={principalStuck ? { opacity: 0.62 } : undefined}
                >
                  <td className="text-xs num-font" style={{ whiteSpace: 'nowrap' }}>
                    {m.Index}. {formatMonthLabel(m.Month)}
                    {isArrearsCleared && (
                      <span className="badge badge-paid" style={{ marginLeft: '6px' }}>
                        ล้างดอกค้างหมด
                      </span>
                    )}
                  </td>
                  <td className="text-right num-font text-xs">
                    {formatCurrency(Math.round(m.InstallmentTotal))}
                  </td>
                  <td
                    className={`text-right num-font text-xs ${
                      m.Surplus < 0 ? 'text-danger font-bold' : ''
                    }`}
                  >
                    {formatCurrency(Math.round(m.Surplus))}
                  </td>
                  <td className="text-right num-font text-xs text-info">
                    {formatCurrency(Math.round(m.EmergencyContribution))}
                  </td>
                  <td className="text-right num-font text-xs text-success font-semibold">
                    {formatCurrency(Math.round(m.LoanPayment))}
                    {m.HeldForAnnualPayment > 0 && (
                      <div className="text-xs text-warning">
                        กองไว้ {formatCurrency(Math.round(m.HeldForAnnualPayment))}
                      </div>
                    )}
                  </td>
                  <td className="text-right num-font text-xs text-warning">
                    {formatCurrency(Math.round(m.InterestAccrued))}
                  </td>
                  <td className="text-right num-font text-xs">
                    {formatCurrency(Math.round(m.AccruedInterestBalance))}
                  </td>
                  <td className="text-right num-font text-xs font-bold">
                    {formatCurrency(Math.round(m.PrincipalBalance))}
                  </td>
                  <td className="text-right num-font text-xs text-muted">
                    {formatCurrency(Math.round(m.DiscretionaryCeiling))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="text-xs text-subtle mt-2">
        "เพดานงบกินใช้" คือระดับการใช้จ่ายที่หนี้หยุดลดในเดือนนั้น — เป็นขีดจำกัด ไม่ใช่เป้า
      </div>
    </div>
  );
};
