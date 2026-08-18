import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { calculateThaiTax } from './taxCalculator';
import { formatCurrency } from '../../shared/formatters';
import { RotateCcw, Receipt } from 'lucide-react';

export const TaxTab = () => {
  const { taxSettings, updateTaxSettings, resetTaxSettings } = useWallet();

  const res = calculateThaiTax(taxSettings);

  const handleChange = (field, val) => {
    updateTaxSettings({ [field]: parseFloat(val) || 0 });
  };

  const handleIntChange = (field, val) => {
    updateTaxSettings({ [field]: parseInt(val, 10) || 0 });
  };

  const handleReset = () => {
    if (window.confirm('ต้องการรีเซ็ตแบบฟอร์มภาษีเป็นค่าเริ่มต้นหรือไม่?')) {
      resetTaxSettings();
    }
  };

  return (
    <div className="tab-panel active">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>🧾 คำนวณภาษีเงินได้บุคคลธรรมดา ภ.ง.ด. 90/91 (ปีภาษี 2569 / 2026)</h2>
          <p>คำนวณภาษีอัตราก้าวหน้า หักค่าใช้จ่ายและค่าลดหย่อนตามหลักเกณฑ์กรมสรรพากร พร้อมประเมินยอดเงินคืนภาษี</p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-outline btn-sm" onClick={handleReset}>
            <RotateCcw size={14} />
            <span>รีเซ็ตแบบฟอร์ม</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Left 2 Cols: Comprehensive Deduction Inputs */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div>
              <div className="card-title">📝 ข้อมูลรายได้และสิทธิลดหย่อนภาษี</div>
              <div className="card-subtitle">กรอกตัวเลขยอดเงินทั้งปี (บาท) ระบบจะคำนวณสิทธิสูงสุดให้อัตโนมัติ</div>
            </div>
          </div>

          {/* Section 1: Income */}
          <div className="mb-4">
            <h4 className="text-sm font-semibold text-primary mb-2 flex items-center gap-1">
              <span>1. รายได้ทั้งปี (Gross Income)</span>
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">เงินเดือนรวมทั้งปี (40(1)):</label>
                <input
                  type="number"
                  className="form-input num-font"
                  value={taxSettings.annualSalary ?? 0}
                  onChange={(e) => handleChange('annualSalary', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">โบนัสทั้งปี:</label>
                <input
                  type="number"
                  className="form-input num-font"
                  value={taxSettings.annualBonus ?? 0}
                  onChange={(e) => handleChange('annualBonus', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">รายได้เสริม / ฟรีแลนซ์ (40(2)):</label>
                <input
                  type="number"
                  className="form-input num-font"
                  value={taxSettings.freelanceIncome ?? 0}
                  onChange={(e) => handleChange('freelanceIncome', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Family & Social Security */}
          <div className="mb-4 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
            <h4 className="text-sm font-semibold text-primary mb-2">
              2. ค่าลดหย่อนส่วนตัว & ครอบครัว
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">ประกันสังคม (สูงสุด 9,000 ฿):</label>
                <input
                  type="number"
                  className="form-input num-font"
                  max="9000"
                  value={taxSettings.socialSecurity ?? 9000}
                  onChange={(e) => handleChange('socialSecurity', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">ลดหย่อนบิดามารดา (คนละ 30k):</label>
                <select
                  className="form-select num-font"
                  value={taxSettings.parentCount ?? 0}
                  onChange={(e) => handleIntChange('parentCount', e.target.value)}
                >
                  <option value="0">0 ท่าน (0 ฿)</option>
                  <option value="1">1 ท่าน (30,000 ฿)</option>
                  <option value="2">2 ท่าน (60,000 ฿)</option>
                  <option value="3">3 ท่าน (90,000 ฿)</option>
                  <option value="4">4 ท่าน (120,000 ฿)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">ลดหย่อนบุตร (คนละ 30k):</label>
                <input
                  type="number"
                  min="0"
                  className="form-input num-font"
                  value={taxSettings.childCount ?? 0}
                  onChange={(e) => handleIntChange('childCount', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Insurance & Retirement Investments */}
          <div className="mb-4 pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
            <h4 className="text-sm font-semibold text-primary mb-2">
              3. ประกันชีวิต/สุขภาพ & กองทุนลดหย่อนภาษี
            </h4>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">เบี้ยประกันชีวิตทั่วไป (รวมไม่เกิน 100k):</label>
                <input
                  type="number"
                  className="form-input num-font"
                  value={taxSettings.lifeInsurance ?? 0}
                  onChange={(e) => handleChange('lifeInsurance', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">เบี้ยประกันสุขภาพ (สูงสุด 25k):</label>
                <input
                  type="number"
                  className="form-input num-font"
                  value={taxSettings.healthInsurance ?? 0}
                  onChange={(e) => handleChange('healthInsurance', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">กองทุนสำรองเลี้ยงชีพ / กบข. (PVD):</label>
                <input
                  type="number"
                  className="form-input num-font"
                  value={taxSettings.providentFund ?? 0}
                  onChange={(e) => handleChange('providentFund', e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">กองทุน SSF (สูงสุด 200k):</label>
                <input
                  type="number"
                  className="form-input num-font"
                  value={taxSettings.ssfAmount ?? 0}
                  onChange={(e) => handleChange('ssfAmount', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">กองทุน RMF (สูงสุด 500k):</label>
                <input
                  type="number"
                  className="form-input num-font"
                  value={taxSettings.rmfAmount ?? 0}
                  onChange={(e) => handleChange('rmfAmount', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">กองทุน ThaiESG (สูงสุด 300k):</label>
                <input
                  type="number"
                  className="form-input num-font"
                  value={taxSettings.thaiEsgAmount ?? 0}
                  onChange={(e) => handleChange('thaiEsgAmount', e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Section 4: Special Allowances & Withholding Tax */}
          <div className="pt-3" style={{ borderTop: '1px solid var(--border-light)' }}>
            <h4 className="text-sm font-semibold text-primary mb-2">
              4. ดอกเบี้ยกู้บ้าน, ช้อปปิ้ง & ภาษีหัก ณ ที่จ่าย
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-muted block mb-1">ดอกเบี้ยเงินกู้ยืมเพื่อที่อยู่อาศัย:</label>
                <input
                  type="number"
                  className="form-input num-font"
                  value={taxSettings.mortgageInterest ?? 0}
                  onChange={(e) => handleChange('mortgageInterest', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">Easy E-Receipt / ช้อปลดหย่อน:</label>
                <input
                  type="number"
                  className="form-input num-font"
                  value={taxSettings.easyReceipt ?? 0}
                  onChange={(e) => handleChange('easyReceipt', e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted block mb-1">ภาษีหัก ณ ที่จ่ายที่จ่ายไปแล้ว:</label>
                <input
                  type="number"
                  className="form-input num-font font-bold"
                  style={{ borderColor: 'var(--secondary)' }}
                  value={taxSettings.withholdingTax ?? 0}
                  onChange={(e) => handleChange('withholdingTax', e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right 1 Col: Tax Calculation Summary & Bracket Breakdown */}
        <div className="flex flex-col gap-4">
          {/* Main Refund / Due Result Card */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '0.75rem', paddingBottom: '0.5rem' }}>
              <div className="card-title">
                <Receipt size={18} />
                <span>สรุปผลการคำนวณภาษี</span>
              </div>
            </div>

            {/* Refund / Due Status Banner */}
            <div
              className="p-3 mb-3 text-center"
              style={{
                background: res.finalDifference >= 0 ? 'var(--primary-light)' : 'var(--danger-light)',
                borderRadius: 'var(--radius-md)',
                border: `1px solid ${res.finalDifference >= 0 ? 'var(--primary)' : 'var(--danger)'}`
              }}
            >
              <div
                className="text-xs font-bold"
                style={{ color: res.finalDifference >= 0 ? 'var(--primary)' : 'var(--danger)' }}
              >
                {res.finalDifference >= 0
                  ? '🎉 ได้รับเงินคืนภาษี (Tax Refund)'
                  : '⚠️ ต้องชำระภาษีเพิ่มเติม (Tax Due)'}
              </div>
              <div
                className={`num-font font-bold text-2xl mt-1 ${
                  res.finalDifference >= 0 ? 'text-success' : 'text-danger'
                }`}
              >
                {res.finalDifference >= 0 ? '+' : '-'}
                {formatCurrency(Math.abs(Math.round(res.finalDifference)))}
              </div>
            </div>

            {/* Breakdown List */}
            <div className="text-xs" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div className="flex justify-between">
                <span className="text-muted">รายได้พึงประเมินรวม:</span>
                <span className="font-semibold num-font text-main">{formatCurrency(Math.round(res.grossIncome))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">หักค่าใช้จ่าย 50% (สูงสุด 100k):</span>
                <span className="font-semibold num-font text-danger">-{formatCurrency(Math.round(res.expenseDeduction))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">หักค่าลดหย่อนรวม:</span>
                <span className="font-semibold num-font text-danger">-{formatCurrency(Math.round(res.totalAllowances))}</span>
              </div>
              <div className="flex justify-between pt-2" style={{ borderTop: '1px solid var(--border-light)' }}>
                <span className="text-main font-semibold">เงินได้สุทธิ (Net Taxable):</span>
                <span className="font-bold num-font text-primary">{formatCurrency(Math.round(res.netTaxableIncome))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-main font-semibold">ภาษีที่คำนวณได้รวม:</span>
                <span className="font-bold num-font text-danger">{formatCurrency(Math.round(res.totalTaxPayable))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">ภาษีที่หัก ณ ที่จ่ายไว้แล้ว:</span>
                <span className="font-semibold num-font text-main">{formatCurrency(Math.round(res.withholdingTax))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">อัตราภาษีที่แท้จริง (Effective Rate):</span>
                <span className="font-bold num-font text-info">{res.effectiveTaxRate.toFixed(2)}%</span>
              </div>
            </div>
          </div>

          {/* Tax Tiers Breakdown Table */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: '0.5rem', paddingBottom: '0.5rem' }}>
              <div className="card-title" style={{ fontSize: '0.95rem' }}>
                📊 แจกแจงภาษีขั้นบันได 8 ขั้น
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {res.bracketBreakdowns.map((b, idx) => (
                <div key={idx} className={`tax-tier-row ${b.isActive ? 'active-tier' : ''}`}>
                  <div style={{ flex: 2 }}>
                    <div style={{ fontSize: '0.78rem' }}>{b.label}</div>
                  </div>
                  <div style={{ flex: 1, textAlign: 'right' }} className="num-font text-muted text-xs">
                    {b.amountInBracket > 0 ? formatCurrency(Math.round(b.amountInBracket)) : '-'}
                  </div>
                  <div
                    style={{ flex: 1, textAlign: 'right' }}
                    className={`num-font font-bold text-xs ${b.tax > 0 ? 'text-danger' : 'text-muted'}`}
                  >
                    {b.tax > 0 ? formatCurrency(Math.round(b.tax)) : '0 ฿'}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
