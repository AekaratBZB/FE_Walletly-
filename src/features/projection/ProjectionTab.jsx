import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { StatCard } from '../../components/StatCard';
import { formatCurrency, getCurrentMonthPrefix } from '../../shared/formatters';
import {
  Coins,
  Hourglass,
  CalendarCheck,
  Zap,
  ShoppingBag,
  Calculator
} from 'lucide-react';

export const ProjectionTab = () => {
  const { fixedCosts, allocationSettings, transactions } = useWallet();

  const monthlyIncome = Number(allocationSettings.monthlyIncome) || 50000;
  const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const unpaidFixedCosts = fixedCosts.filter(c => !c.isPaid).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const now = new Date();
  const currentMonthPrefix = getCurrentMonthPrefix();
  const thisMonthExpenses = transactions
    .filter(t => t.type === 'expense' && (t.date || '').startsWith(currentMonthPrefix))
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const currentDay = now.getDate();
  const daysRemaining = Math.max(1, totalDaysInMonth - currentDay);

  // Initial balance estimation
  const defaultBalance = Math.max(0, monthlyIncome - thisMonthExpenses - (totalFixedCosts - unpaidFixedCosts));
  const [startingBalance, setStartingBalance] = useState(defaultBalance);
  const [horizonDays, setHorizonDays] = useState(30);

  const availableForSpending = Math.max(0, (Number(startingBalance) || 0) - unpaidFixedCosts);
  const safeDailyBudget = Math.floor(availableForSpending / daysRemaining);

  const [customDailySpend, setCustomDailySpend] = useState('');
  const activeDailySpend = customDailySpend !== '' && !isNaN(parseFloat(customDailySpend))
    ? parseFloat(customDailySpend)
    : safeDailyBudget;

  const projectedEndMonth = (Number(startingBalance) || 0) - unpaidFixedCosts - (activeDailySpend * daysRemaining);

  // Runway calculation
  const monthlyTotalBurn = totalFixedCosts + (activeDailySpend * 30);
  const runwayMonths = monthlyTotalBurn > 0 ? (Number(startingBalance) || 0) / monthlyTotalBurn : 0;

  // 30-Day Timeline Table Rows
  const timelineRows = [];
  let runningBal = Number(startingBalance) || 0;
  for (let offset = 1; offset <= Math.min(horizonDays, 30); offset++) {
    const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dayOfMonth = targetDate.getDate();
    const dateStr = targetDate.toISOString().slice(0, 10);

    const dueItems = fixedCosts.filter(c => !c.isPaid && c.dueDay === dayOfMonth);
    const dueTotal = dueItems.reduce((s, c) => s + (Number(c.amount) || 0), 0);

    runningBal = runningBal - activeDailySpend - dueTotal;

    timelineRows.push({
      dateStr,
      dayOfMonth,
      dueItems,
      dueTotal,
      dailySpend: activeDailySpend,
      runningBalance: runningBal
    });
  }

  // "Can I Afford It?" Simulator State
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [installments, setInstallments] = useState('1');
  const [simResult, setSimResult] = useState(null);

  const handleSimulate = (e) => {
    e.preventDefault();
    const price = parseFloat(itemPrice);
    const months = parseInt(installments, 10) || 1;

    if (!price || price <= 0) {
      alert('กรุณาระบุราคาสินค้า');
      return;
    }

    const disposableIncome = Math.max(1, monthlyIncome - totalFixedCosts);
    const monthlyPayment = months > 1 ? price / months : price;
    const impactRatio = (monthlyPayment / disposableIncome) * 100;

    let verdict = '';
    let verdictClass = '';
    let verdictDesc = '';

    if (impactRatio <= 15) {
      verdict = '🟢 ซื้อได้สบายมาก (Safe to Buy)';
      verdictClass = 'text-success';
      verdictDesc = `ค่าใช้จ่าย ${formatCurrency(monthlyPayment)} คิดเป็นเพียง ${impactRatio.toFixed(1)}% ของเงินคงเหลืออิสระ ไม่กระทบสภาพคล่อง`;
    } else if (impactRatio <= 35) {
      verdict = '🟡 ซื้อได้ แต่ควรระวัง (Manageable)';
      verdictClass = 'text-warning';
      verdictDesc = `ค่าใช้จ่าย ${formatCurrency(monthlyPayment)} คิดเป็น ${impactRatio.toFixed(1)}% ของเงินคงเหลืออิสระ ควรลดค่าใช้จ่ายตามใจอื่นในเดือนนี้`;
    } else {
      verdict = '🔴 สภาพคล่องตึงตัว / เสี่ยงเงินขาดมือ (High Risk)';
      verdictClass = 'text-danger';
      verdictDesc = `ค่าใช้จ่าย ${formatCurrency(monthlyPayment)} คิดเป็นสัดส่วนสูงถึง ${impactRatio.toFixed(1)}% ของเงินอิสระ แนะนำให้เก็บเงินสำรองก่อน`;
    }

    setSimResult({
      itemName: itemName.trim() || 'สินค้าที่ต้องการซื้อ',
      itemPrice: price,
      monthlyPayment,
      months,
      impactRatio,
      verdict,
      verdictClass,
      verdictDesc
    });
  };

  return (
    <div className="tab-panel active">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>🔮 คำนวณเงินล่วงหน้า & สภาพคล่อง (Cash Flow & Runway)</h2>
          <p>พยากรณ์เงินคงเหลือรายวัน คำนวณงบกินใช้อย่างปลอดภัย และจำลองการซื้อสินค้าชิ้นใหญ่</p>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-4 mb-6">
        <StatCard
          label="งบกินใช้ปลอดภัยต่อวัน"
          value={`${formatCurrency(safeDailyBudget)}/วัน`}
          subtext={`เหลืออีก ${daysRemaining} วันในเดือนนี้`}
          icon={Coins}
          colorScheme="emerald"
          valueClass="text-success"
        />

        <StatCard
          label="ฟิกคอสรอตัดรอบนี้"
          value={formatCurrency(unpaidFixedCosts)}
          subtext="ค่าใช้จ่ายคงที่ต้องกันไว้"
          icon={CalendarCheck}
          colorScheme="amber"
          valueClass="text-warning"
        />

        <StatCard
          label="เงินสิ้นเดือนโดยประมาณ"
          value={formatCurrency(Math.round(projectedEndMonth))}
          subtext={`หากใช้จ่ายวันละ ${formatCurrency(activeDailySpend)}`}
          icon={Zap}
          colorScheme={projectedEndMonth >= 0 ? 'emerald' : 'rose'}
          valueClass={projectedEndMonth >= 0 ? 'text-success' : 'text-danger'}
        />

        <StatCard
          label="ระยะเวลาสภาพคล่อง (Runway)"
          value={`${(runwayMonths * 30).toFixed(0)} วัน`}
          subtext={`อยู่ได้ประมาณ ${runwayMonths.toFixed(1)} เดือน`}
          icon={Hourglass}
          colorScheme="blue"
          valueClass="text-info"
        />
      </div>

      {/* Two Column Section: Simulator & 30-Day Timeline */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left 1 Col: "Can I Afford It?" Simulator */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ShoppingBag size={18} />
                <span>"Can I Afford It?" Simulator</span>
              </div>
              <div className="card-subtitle">จำลองผลกระทบก่อนตัดสินใจซื้อของชิ้นใหญ่</div>
            </div>
          </div>

          <form onSubmit={handleSimulate}>
            <div className="form-group">
              <label className="form-label">ชื่อสินค้าหรือบริการ</label>
              <input
                type="text"
                className="form-input"
                placeholder="เช่น iPhone 16 Pro, iPad, ตั๋วเครื่องบิน"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">ราคาสินค้า (บาท) *</label>
              <input
                type="number"
                className="form-input num-font"
                placeholder="35000"
                step="any"
                value={itemPrice}
                onChange={(e) => setItemPrice(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">รูปแบบการชำระเงิน</label>
              <select
                className="form-select"
                value={installments}
                onChange={(e) => setInstallments(e.target.value)}
              >
                <option value="1">จ่ายสดเต็มจำนวน (1 งวด)</option>
                <option value="3">ผ่อน 0% 3 เดือน</option>
                <option value="6">ผ่อน 0% 6 เดือน</option>
                <option value="10">ผ่อน 0% 10 เดือน</option>
                <option value="12">ผ่อน 0% 12 เดือน</option>
                <option value="24">ผ่อน 24 เดือน</option>
              </select>
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
              <Calculator size={16} />
              <span>ประเมินความพร้อมทางการเงิน</span>
            </button>
          </form>

          {/* Simulator Result Box */}
          {simResult && (
            <div className="mt-4 p-4" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
              <div className={`font-bold text-base ${simResult.verdictClass}`}>{simResult.verdict}</div>
              <p className="text-xs text-main mt-1 mb-3">{simResult.verdictDesc}</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div style={{ background: 'white', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div className="text-muted">จ่ายต่องวด:</div>
                  <div className="font-bold num-font text-main">{formatCurrency(Math.round(simResult.monthlyPayment))}/ด.</div>
                </div>
                <div style={{ background: 'white', padding: '0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)' }}>
                  <div className="text-muted">ภาระต่อเงินอิสระ:</div>
                  <div className={`font-bold num-font ${simResult.verdictClass}`}>{simResult.impactRatio.toFixed(1)}%</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 2 Cols: Daily Cash Flow Timeline */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div>
              <div className="card-title">📈 พยากรณ์กระแสเงินสดรายวัน (Daily Cash Flow Timeline)</div>
              <div className="card-subtitle">จำลองยอดเงินคงเหลือในแต่ละวัน พร้อมอีเวนต์ตัดฟิกคอส</div>
            </div>

            <div className="flex gap-2 items-center">
              <label className="text-xs text-muted">แสดง:</label>
              <select
                className="form-select"
                style={{ padding: '0.35rem 0.6rem', fontSize: '0.8rem', width: '110px' }}
                value={horizonDays}
                onChange={(e) => setHorizonDays(parseInt(e.target.value, 10))}
              >
                <option value="7">7 วันข้างหน้า</option>
                <option value="14">14 วันข้างหน้า</option>
                <option value="30">30 วันข้างหน้า</option>
              </select>
            </div>
          </div>

          {/* Setting Inputs inline */}
          <div className="flex gap-3 mb-3 p-3 flex-wrap" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div className="flex-1" style={{ minWidth: '180px' }}>
              <label className="text-xs font-semibold text-muted block mb-1">ยอดเงินสดตั้งต้น (บาท):</label>
              <input
                type="number"
                className="form-input num-font"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                value={startingBalance}
                onChange={(e) => setStartingBalance(parseFloat(e.target.value) || 0)}
              />
            </div>

            <div className="flex-1" style={{ minWidth: '180px' }}>
              <label className="text-xs font-semibold text-muted block mb-1">
                จำลองยอดใช้จ่ายต่อวัน (บาท):
              </label>
              <input
                type="number"
                className="form-input num-font"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem' }}
                placeholder={`${safeDailyBudget}`}
                value={customDailySpend}
                onChange={(e) => setCustomDailySpend(e.target.value)}
              />
            </div>
          </div>

          <div className="table-container" style={{ maxHeight: '420px', overflowY: 'auto' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>เหตุการณ์ / ฟิกคอสที่ครบกำหนด</th>
                  <th className="text-right">ใช้จ่ายประจำวัน</th>
                  <th className="text-right">ยอดคงเหลือสุทธิ</th>
                </tr>
              </thead>
              <tbody>
                {timelineRows.map((row, idx) => (
                  <tr key={idx}>
                    <td className="num-font text-xs text-muted" style={{ whiteSpace: 'nowrap' }}>
                      {row.dateStr} (วันที่ {row.dayOfMonth})
                    </td>
                    <td>
                      {row.dueItems.length > 0 ? (
                        <span className="badge badge-fixed">
                          หักฟิกคอส: {row.dueItems.map(d => d.title).join(', ')} (-{formatCurrency(row.dueTotal)})
                        </span>
                      ) : (
                        <span className="text-subtle text-xs">-</span>
                      )}
                    </td>
                    <td className="text-right num-font text-danger text-sm">
                      -{formatCurrency(row.dailySpend)}
                    </td>
                    <td
                      className={`text-right num-font font-bold ${
                        row.runningBalance >= 0 ? 'text-success' : 'text-danger'
                      }`}
                    >
                      {formatCurrency(Math.round(row.runningBalance))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
