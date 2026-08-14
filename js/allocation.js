/**
 * FinSmart Thai - Percentage Budget Allocation Module
 * Supports 50/30/20, 60/20/20, 6 Jars, and Custom % Budgeting with Real-Time Comparison.
 */

const AllocationModule = {
  presets: {
    '50-30-20': {
      name: '50/30/20 Rule (ยอดนิยมสากล)',
      description: 'จำเป็น (Needs) 50% | ตามใจ (Wants) 30% | ออม & ลงทุน (Savings) 20%',
      buckets: [
        { key: 'needs', name: 'จำเป็น (Needs & Fixed Costs)', percent: 50, color: 'blue', types: ['fixed', 'expense'] },
        { key: 'wants', name: 'ตามใจ (Wants & Lifestyle)', percent: 30, color: 'rose', types: ['expense'] },
        { key: 'savings', name: 'ออม & ลงทุน (Savings & Invest)', percent: 20, color: 'emerald', types: ['savings'] }
      ]
    },
    '60-20-20': {
      name: '60/20/20 Rule (เน้นภาระครอบครัว)',
      description: 'จำเป็น 60% | ตามใจ 20% | ออม & ลงทุน 20%',
      buckets: [
        { key: 'needs', name: 'จำเป็น & ผ่อนชำระ', percent: 60, color: 'blue', types: ['fixed', 'expense'] },
        { key: 'wants', name: 'ตามใจ & ช้อปปิ้ง', percent: 20, color: 'rose', types: ['expense'] },
        { key: 'savings', name: 'ออม & ลงทุน', percent: 20, color: 'emerald', types: ['savings'] }
      ]
    },
    '70-20-10': {
      name: '70/20/10 Rule (เน้นค่าครองชีพสูง)',
      description: 'ใช้จ่ายทั่วไป 70% | ออมเงิน 20% | ลงทุน/แบ่งปัน 10%',
      buckets: [
        { key: 'needs', name: 'ค่าใช้จ่ายรายวัน & ฟิกคอส', percent: 70, color: 'blue', types: ['fixed', 'expense'] },
        { key: 'savings', name: 'เงินออม & สำรองฉุกเฉิน', percent: 20, color: 'emerald', types: ['savings'] },
        { key: 'invest', name: 'ลงทุน & พัฒนาตนเอง', percent: 10, color: 'purple', types: ['savings'] }
      ]
    },
    '6jars': {
      name: '6 Jars System (สูตร 6 โหลของ T. Harv Eker)',
      description: 'NEC 55% | FFA 10% | LTSS 10% | PLAY 10% | EDU 10% | GIVE 5%',
      buckets: [
        { key: 'nec', name: 'NEC (ใช้จ่ายจำเป็น)', percent: 55, color: 'blue', types: ['fixed', 'expense'] },
        { key: 'ffa', name: 'FFA (ลงทุนสู่อิสรภาพการเงิน)', percent: 10, color: 'emerald', types: ['savings'] },
        { key: 'ltss', name: 'LTSS (ออมระยะยาว/ฉุกเฉิน)', percent: 10, color: 'amber', types: ['savings'] },
        { key: 'play', name: 'PLAY (สันทนาการ/ให้รางวัลตัวเอง)', percent: 10, color: 'rose', types: ['expense'] },
        { key: 'edu', name: 'EDU (พัฒนาตนเอง/คอร์สเรียน)', percent: 10, color: 'purple', types: ['expense'] },
        { key: 'give', name: 'GIVE (ทำบุญ/ตอบแทนครอบครัว)', percent: 5, color: 'emerald', types: ['expense'] }
      ]
    }
  },

  init() {
    this.bindEvents();
    this.renderAllocationUI();
  },

  bindEvents() {
    const ruleSelect = document.getElementById('alloc-preset-select');
    if (ruleSelect) {
      ruleSelect.addEventListener('change', (e) => {
        const settings = window.storageManager.getAllocationSettings();
        settings.rule = e.target.value;
        window.storageManager.saveAllocationSettings(settings);
        this.renderAllocationUI();
      });
    }

    const incomeInput = document.getElementById('alloc-monthly-income');
    if (incomeInput) {
      incomeInput.addEventListener('input', (e) => {
        const settings = window.storageManager.getAllocationSettings();
        settings.monthlyIncome = parseFloat(e.target.value) || 0;
        window.storageManager.saveAllocationSettings(settings);
        this.renderAllocationUI();
      });
    }

    // Storage listener
    window.storageManager.onDataChange((detail) => {
      if (['allocation', 'transactions', 'fixedCosts', 'all'].includes(detail.scope)) {
        this.renderAllocationUI();
      }
    });
  },

  renderAllocationUI() {
    const settings = window.storageManager.getAllocationSettings();
    const ruleSelect = document.getElementById('alloc-preset-select');
    const incomeInput = document.getElementById('alloc-monthly-income');
    const container = document.getElementById('alloc-buckets-container');

    if (ruleSelect && settings.rule) ruleSelect.value = settings.rule;
    if (incomeInput && settings.monthlyIncome) incomeInput.value = settings.monthlyIncome;

    if (!container) return;

    const monthlyIncome = Number(settings.monthlyIncome) || 50000;
    const preset = this.presets[settings.rule] || this.presets['50-30-20'];

    // Get current month transactions
    const txs = window.storageManager.getTransactions();
    const fixedCosts = window.storageManager.getFixedCosts();
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const thisMonthExpenses = txs
      .filter(t => t.type === 'expense' && (t.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const thisMonthSavings = txs
      .filter(t => t.type === 'savings' && (t.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Render Cards for each bucket
    container.innerHTML = preset.buckets.map(b => {
      const targetBudget = (monthlyIncome * b.percent) / 100;
      let actualSpent = 0;

      if (b.key === 'needs' || b.key === 'nec') {
        actualSpent = totalFixedCosts + (thisMonthExpenses * 0.5); // Fixed cost + estimate 50% essential food
      } else if (b.key === 'wants' || b.key === 'play') {
        actualSpent = thisMonthExpenses * 0.5; // Leisure expenses
      } else if (b.key === 'savings' || b.key === 'ffa' || b.key === 'ltss') {
        actualSpent = thisMonthSavings;
      } else {
        actualSpent = (targetBudget * 0.6); // demo fallback
      }

      const progressPercent = targetBudget > 0 ? Math.min(100, Math.round((actualSpent / targetBudget) * 100)) : 0;
      const remainingBudget = targetBudget - actualSpent;

      let statusColor = 'var(--primary)';
      let statusText = 'อยู่ในกรอบงบประมาณ';
      if (actualSpent > targetBudget) {
        statusColor = 'var(--danger)';
        statusText = `เกินงบ ${Math.abs(Math.round(remainingBudget)).toLocaleString()} ฿`;
      } else if (progressPercent >= 80) {
        statusColor = 'var(--warning)';
        statusText = `เหลืองบ ${Math.round(remainingBudget).toLocaleString()} ฿`;
      } else {
        statusText = `เหลืองบ ${Math.round(remainingBudget).toLocaleString()} ฿`;
      }

      return `
        <div class="card bucket-card" style="border-top: 4px solid var(--accent-${b.color}, var(--primary));">
          <div class="flex items-center justify-between mb-2">
            <div>
              <span class="badge" style="background: var(--${b.color}-light, #ecfdf5); color: var(--${b.color}, #059669); font-size: 0.85rem; font-weight: 700;">
                ${b.percent}%
              </span>
              <h4 class="mt-1" style="font-size: 1.05rem;">${b.name}</h4>
            </div>
            <div class="text-right">
              <div class="text-xs text-muted">งบประมาณที่จัดสรร</div>
              <div class="num-font font-bold text-lg" style="color: var(--text-main);">${Math.round(targetBudget).toLocaleString()} ฿</div>
            </div>
          </div>

          <div class="mt-3">
            <div class="flex justify-between text-xs text-muted mb-1">
              <span>ใช้จริง/จัดสรรแล้ว: <b class="num-font font-semibold text-main">${Math.round(actualSpent).toLocaleString()} ฿</b></span>
              <span class="num-font font-semibold" style="color: ${statusColor};">${progressPercent}%</span>
            </div>
            <div class="progress-bar-wrapper" style="height: 10px;">
              <div class="progress-bar-fill progress-fill-${b.color}" style="width: ${progressPercent}%;"></div>
            </div>
            <div class="flex justify-between items-center mt-2 text-xs">
              <span style="color: ${statusColor}; font-weight: 600;">${statusText}</span>
              <span class="text-muted">เป้าหมาย: ${b.percent}% ของรายได้</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
};

window.AllocationModule = AllocationModule;
