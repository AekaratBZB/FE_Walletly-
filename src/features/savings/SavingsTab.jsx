import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';
import { StatCard } from '../../components/StatCard';
import { formatCurrency } from '../../shared/formatters';
import {
  Target,
  PiggyBank,
  ShieldCheck,
  TrendingUp,
  Plus,
  Trash2
} from 'lucide-react';

export const SavingsTab = () => {
  const {
    savingsGoals,
    fixedCosts,
    allocationSettings,
    setIsAddGoalOpen,
    setQuickDepositGoal,
    deleteSavingsGoal,
    addSavingsGoal
  } = useWallet();

  const totalSaved = savingsGoals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
  const totalTarget = savingsGoals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0);

  // Emergency Fund Calculations
  const monthlyIncome = Number(allocationSettings.monthlyIncome) || 50000;
  const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const monthlyEssentialSpend = totalFixedCosts + Math.max(10000, monthlyIncome * 0.25);

  const ef3 = monthlyEssentialSpend * 3;
  const ef6 = monthlyEssentialSpend * 6;
  const ef12 = monthlyEssentialSpend * 12;

  const handleCreateEmergencyGoal = (months) => {
    const targetAmount = Math.round(monthlyEssentialSpend * months);
    addSavingsGoal({
      title: `เงินสำรองฉุกเฉิน ${months} เดือน`,
      category: 'ความมั่นคง',
      targetAmount,
      currentAmount: 0,
      monthlyContribution: Math.round(targetAmount / 12),
      targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      color: 'emerald'
    });
  };

  const handleDeleteGoal = (id, title) => {
    if (window.confirm(`คุณต้องการลบเป้าหมาย "${title}" ใช่หรือไม่?`)) {
      deleteSavingsGoal(id);
    }
  };

  // Compound Interest State
  const [ciInitial, setCiInitial] = useState('10000');
  const [ciMonthly, setCiMonthly] = useState('5000');
  const [ciRate, setCiRate] = useState('8');
  const [ciYears, setCiYears] = useState('10');

  const initial = parseFloat(ciInitial) || 0;
  const monthly = parseFloat(ciMonthly) || 0;
  const annualRate = parseFloat(ciRate) || 0;
  const years = parseFloat(ciYears) || 0;

  const monthlyRate = (annualRate / 100) / 12;
  const totalMonths = years * 12;

  let balance = initial;
  let totalPrincipal = initial;

  for (let m = 1; m <= totalMonths; m++) {
    balance = (balance + monthly) * (1 + monthlyRate);
    totalPrincipal += monthly;
  }
  const totalInterest = Math.max(0, balance - totalPrincipal);

  return (
    <div className="tab-panel active">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>🎯 วางแผนเป้าหมายการออม & ลงทุน (Wealth Goals)</h2>
          <p>ตั้งเป้าหมายทางการเงิน คำนวณเงินสำรองฉุกเฉิน และจำลองพลังดอกเบี้ยทบต้นระยะยาว</p>
        </div>
        <div className="flex gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddGoalOpen(true)}
          >
            <Plus size={14} />
            <span>+ ตั้งเป้าหมายใหม่</span>
          </button>
        </div>
      </div>

      {/* Top 2 Stat Cards */}
      <div className="grid grid-cols-2 mb-6">
        <StatCard
          label="ยอดเงินออมสะสมปัจจุบัน"
          value={formatCurrency(totalSaved)}
          subtext={`จากทั้งหมด ${savingsGoals.length} เป้าหมาย`}
          icon={PiggyBank}
          colorScheme="emerald"
          valueClass="text-success"
        />

        <StatCard
          label="ยอดเป้าหมายรวมทั้งหมด"
          value={formatCurrency(totalTarget)}
          subtext={`ความคืบหน้ารวม ${totalTarget > 0 ? ((totalSaved / totalTarget) * 100).toFixed(1) : 0}%`}
          icon={Target}
          colorScheme="blue"
          valueClass="text-primary"
        />
      </div>

      {/* Savings Goals Grid */}
      <div className="mb-6">
        <div className="card-header" style={{ border: 'none', marginBottom: '0.75rem', paddingBottom: 0 }}>
          <div className="card-title">📌 รายการเป้าหมายของคุณ</div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          {savingsGoals.length === 0 ? (
            <div className="card text-center text-muted" style={{ padding: '3rem 1rem', gridColumn: '1 / -1' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>🎯</div>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>ยังไม่มีเป้าหมายการออมหรือการลงทุน</div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                กดปุ่ม "+ ตั้งเป้าหมายใหม่" หรือเลือกสร้างเงินสำรองฉุกเฉินด้านล่าง
              </div>
            </div>
          ) : (
            savingsGoals.map(g => {
              const progress = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
              const remaining = Math.max(0, g.targetAmount - g.currentAmount);

              let estMonths = 'ไม่ระบุ';
              if (g.monthlyContribution > 0 && remaining > 0) {
                estMonths = `อีก ~${Math.ceil(remaining / g.monthlyContribution)} เดือน`;
              } else if (remaining === 0) {
                estMonths = '🎉 บรรลุเป้าหมายแล้ว!';
              }

              return (
                <div key={g.id} className="card">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="badge" style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }}>
                        {g.category}
                      </span>
                      <h4 className="mt-1" style={{ fontSize: '1.1rem' }}>
                        {g.title}
                      </h4>
                    </div>
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleDeleteGoal(g.id, g.title)}
                      title="ลบเป้าหมาย"
                      style={{ color: 'var(--danger)' }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="flex justify-between items-baseline mb-1">
                      <span className="num-font font-bold text-xl text-primary">
                        {formatCurrency(g.currentAmount)}
                      </span>
                      <span className="text-xs text-muted">
                        เป้าหมาย: <b className="num-font">{formatCurrency(g.targetAmount)}</b>
                      </span>
                    </div>

                    <div className="progress-bar-wrapper" style={{ height: '10px' }}>
                      <div
                        className={`progress-bar-fill progress-fill-${g.color || 'emerald'}`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center mt-2 text-xs">
                      <span className="num-font font-semibold text-primary">
                        คืบหน้า {progress}%
                      </span>
                      <span className="text-muted">
                        ขาดอีก {formatCurrency(remaining)} ({estMonths})
                      </span>
                    </div>
                  </div>

                  <div
                    className="mt-4 pt-3 flex justify-between items-center"
                    style={{ borderTop: '1px solid var(--border-light)' }}
                  >
                    <div className="text-xs text-muted">
                      ออมเดือนละ:{' '}
                      <b className="num-font font-semibold text-main">
                        {g.monthlyContribution ? `${formatCurrency(g.monthlyContribution)}/ด.` : '-'}
                      </b>
                    </div>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => setQuickDepositGoal(g)}
                    >
                      <Plus size={14} />
                      <span>ฝากเพิ่ม</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Bottom Two Cards: Emergency Fund Calculator & Compound Interest */}
      <div className="grid grid-cols-2 gap-6">
        {/* Emergency Fund Calculator */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <ShieldCheck size={20} color="var(--primary)" />
                <span>คำนวณเงินสำรองฉุกเฉิน (Emergency Fund)</span>
              </div>
              <div className="card-subtitle">
                คำนวณจากค่าใช้จ่ายจำเป็นเดือนละ {formatCurrency(Math.round(monthlyEssentialSpend))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="p-3" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div className="text-xs text-muted">ระยะสั้น (3 เดือน)</div>
              <div className="num-font font-bold text-lg text-main mt-1">{formatCurrency(Math.round(ef3))}</div>
              <button
                className="btn btn-outline btn-sm mt-2"
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.25rem 0.4rem' }}
                onClick={() => handleCreateEmergencyGoal(3)}
              >
                + ตั้งเป้า 3 ด.
              </button>
            </div>

            <div className="p-3" style={{ background: 'var(--primary-light)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(5, 150, 105, 0.2)' }}>
              <div className="text-xs text-primary font-semibold">แนะนำ (6 เดือน) ⭐</div>
              <div className="num-font font-bold text-lg text-primary mt-1">{formatCurrency(Math.round(ef6))}</div>
              <button
                className="btn btn-primary btn-sm mt-2"
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.25rem 0.4rem' }}
                onClick={() => handleCreateEmergencyGoal(6)}
              >
                + ตั้งเป้า 6 ด.
              </button>
            </div>

            <div className="p-3" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
              <div className="text-xs text-muted">มั่นคงสูง (12 เดือน)</div>
              <div className="num-font font-bold text-lg text-main mt-1">{formatCurrency(Math.round(ef12))}</div>
              <button
                className="btn btn-outline btn-sm mt-2"
                style={{ width: '100%', fontSize: '0.75rem', padding: '0.25rem 0.4rem' }}
                onClick={() => handleCreateEmergencyGoal(12)}
              >
                + ตั้งเป้า 12 ด.
              </button>
            </div>
          </div>
        </div>

        {/* Compound Interest Simulator */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <TrendingUp size={20} color="var(--secondary)" />
                <span>จำลองดอกเบี้ยทบต้น (Compound Interest)</span>
              </div>
              <div className="card-subtitle">ดูการเติบโตของพอร์ตลงทุนในอนาคต</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">เงินต้นเริ่มต้น (บาท):</label>
              <input
                type="number"
                className="form-input num-font"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                value={ciInitial}
                onChange={(e) => setCiInitial(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">ออมเพิ่มต่อเดือน (บาท):</label>
              <input
                type="number"
                className="form-input num-font"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                value={ciMonthly}
                onChange={(e) => setCiMonthly(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">ผลตอบแทนเฉลี่ย (% ต่อปี):</label>
              <input
                type="number"
                className="form-input num-font"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                value={ciRate}
                onChange={(e) => setCiRate(e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted block mb-1">ระยะเวลาลงทุน (ปี):</label>
              <input
                type="number"
                className="form-input num-font"
                style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                value={ciYears}
                onChange={(e) => setCiYears(e.target.value)}
              />
            </div>
          </div>

          <div className="p-3" style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)' }}>
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-muted">มูลค่าพอร์ตในอนาคต:</span>
              <span className="num-font font-bold text-xl text-primary">{formatCurrency(Math.round(balance))}</span>
            </div>
            <div className="flex justify-between text-xs text-muted">
              <span>เงินต้นสะสม: <b className="num-font text-main">{formatCurrency(Math.round(totalPrincipal))}</b></span>
              <span>ดอกเบี้ยทบต้น: <b className="num-font text-success">+{formatCurrency(Math.round(totalInterest))}</b></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
