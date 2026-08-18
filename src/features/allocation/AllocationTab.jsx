import React from 'react';
import { useWallet } from '../../context/WalletContext';
import { ALLOCATION_PRESETS } from '../../shared/constants';
import { formatCurrency, getCurrentMonthPrefix } from '../../shared/formatters';
import { SlidersHorizontal, DollarSign } from 'lucide-react';

export const AllocationTab = () => {
  const {
    allocationSettings,
    updateAllocationSettings,
    transactions,
    fixedCosts
  } = useWallet();

  const currentPresetKey = allocationSettings.rule || '50-30-20';
  const currentPreset = ALLOCATION_PRESETS[currentPresetKey] || ALLOCATION_PRESETS['50-30-20'];
  const monthlyIncome = Number(allocationSettings.monthlyIncome) || 50000;

  const currentMonthPrefix = getCurrentMonthPrefix();
  const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const thisMonthExpenses = transactions
    .filter(t => t.type === 'expense' && (t.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const thisMonthSavings = transactions
    .filter(t => t.type === 'savings' && (t.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const handleRuleChange = (e) => {
    updateAllocationSettings({ rule: e.target.value });
  };

  const handleIncomeChange = (e) => {
    updateAllocationSettings({ monthlyIncome: parseFloat(e.target.value) || 0 });
  };

  return (
    <div className="tab-panel active">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>🥧 แบ่งสัดส่วนงบประมาณ (Bucket Budgeting)</h2>
          <p>จัดสรรสัดส่วนรายได้ตามสูตรการเงินสากล เปรียบเทียบงบประมาณที่วางไว้กับยอดใช้จริง</p>
        </div>
      </div>

      {/* Settings Card */}
      <div className="card mb-6" style={{ padding: '1.25rem 1.5rem' }}>
        <div className="grid grid-cols-2 gap-4 items-center">
          {/* Preset Selector */}
          <div>
            <label className="form-label flex items-center gap-1">
              <SlidersHorizontal size={16} color="var(--primary)" />
              <span>เลือกสูตรการจัดสรรงบประมาณ:</span>
            </label>
            <select
              className="form-select"
              value={currentPresetKey}
              onChange={handleRuleChange}
            >
              {Object.entries(ALLOCATION_PRESETS).map(([key, preset]) => (
                <option key={key} value={key}>
                  {preset.name}
                </option>
              ))}
            </select>
            <div className="text-xs text-muted mt-1">{currentPreset.description}</div>
          </div>

          {/* Monthly Income Input */}
          <div>
            <label className="form-label flex items-center gap-1">
              <DollarSign size={16} color="var(--primary)" />
              <span>ฐานรายได้ต่อเดือน (บาท):</span>
            </label>
            <input
              type="number"
              className="form-input num-font font-bold"
              placeholder="50000"
              value={monthlyIncome}
              onChange={handleIncomeChange}
            />
            <div className="text-xs text-muted mt-1">ใช้คำนวณยอดเงินบาทของแต่ละสัดส่วน</div>
          </div>
        </div>
      </div>

      {/* Bucket Cards Grid */}
      <div className="grid grid-cols-3 gap-6">
        {currentPreset.buckets.map((b) => {
          const targetBudget = (monthlyIncome * b.percent) / 100;
          let actualSpent = 0;

          if (b.key === 'needs' || b.key === 'nec') {
            actualSpent = totalFixedCosts + thisMonthExpenses * 0.5;
          } else if (b.key === 'wants' || b.key === 'play') {
            actualSpent = thisMonthExpenses * 0.5;
          } else if (b.key === 'savings' || b.key === 'ffa' || b.key === 'ltss') {
            actualSpent = thisMonthSavings;
          } else {
            actualSpent = targetBudget * 0.5;
          }

          const progressPercent = targetBudget > 0 ? Math.min(100, Math.round((actualSpent / targetBudget) * 100)) : 0;
          const remainingBudget = targetBudget - actualSpent;

          let statusColor = 'var(--primary)';
          let statusText = `เหลืองบ ${formatCurrency(Math.round(remainingBudget))}`;

          if (actualSpent > targetBudget) {
            statusColor = 'var(--danger)';
            statusText = `เกินงบ ${formatCurrency(Math.round(Math.abs(remainingBudget)))}`;
          } else if (progressPercent >= 80) {
            statusColor = 'var(--warning)';
            statusText = `เหลืองบ ${formatCurrency(Math.round(remainingBudget))}`;
          }

          return (
            <div
              key={b.key}
              className="card"
              style={{
                borderTop: `4px solid var(--accent-${b.color}, var(--primary))`
              }}
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span
                    className="badge"
                    style={{
                      background: `var(--accent-${b.color}-light, var(--primary-light))`,
                      color: `var(--accent-${b.color}, var(--primary))`,
                      fontSize: '0.85rem',
                      fontWeight: 700
                    }}
                  >
                    {b.percent}%
                  </span>
                  <h4 className="mt-1" style={{ fontSize: '1.05rem' }}>
                    {b.name}
                  </h4>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted">งบประมาณที่จัดสรร</div>
                  <div className="num-font font-bold text-lg text-main">
                    {formatCurrency(Math.round(targetBudget))}
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <div className="flex justify-between text-xs text-muted mb-1">
                  <span>
                    ใช้จริง/จัดสรรแล้ว: <b className="num-font font-semibold text-main">{formatCurrency(Math.round(actualSpent))}</b>
                  </span>
                  <span className="num-font font-semibold" style={{ color: statusColor }}>
                    {progressPercent}%
                  </span>
                </div>
                <div className="progress-bar-wrapper" style={{ height: '10px' }}>
                  <div
                    className={`progress-bar-fill progress-fill-${b.color}`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between items-center mt-2 text-xs">
                  <span style={{ color: statusColor, fontWeight: 600 }}>{statusText}</span>
                  <span className="text-muted">เป้าหมาย {b.percent}% ของรายได้</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
