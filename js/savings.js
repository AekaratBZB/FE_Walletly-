/**
 * FinSmart Thai - Savings & Investment Goals Module
 * Goal tracking, Emergency Fund calculator, and Compound Interest Wealth projection.
 */

const SavingsModule = {
  init() {
    this.bindEvents();
    this.renderSavingsGoals();
    this.calculateEmergencyFund();
    this.calculateCompoundInterest();
  },

  bindEvents() {
    // Add Goal Form Submission
    const goalForm = document.getElementById('add-goal-form');
    if (goalForm) {
      goalForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddGoalSubmit();
      });
    }

    // Compound Interest Inputs
    const compoundInputs = ['ci-initial', 'ci-monthly', 'ci-rate', 'ci-years'];
    compoundInputs.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', () => this.calculateCompoundInterest());
    });

    // Storage listener
    window.storageManager.onDataChange((detail) => {
      if (['savings', 'fixedCosts', 'transactions', 'all'].includes(detail.scope)) {
        this.renderSavingsGoals();
        this.calculateEmergencyFund();
      }
    });
  },

  handleAddGoalSubmit() {
    const title = document.getElementById('goal-title-input').value.trim();
    const category = document.getElementById('goal-category-select').value;
    const targetAmount = parseFloat(document.getElementById('goal-target-input').value);
    const currentAmount = parseFloat(document.getElementById('goal-current-input').value) || 0;
    const monthlyContribution = parseFloat(document.getElementById('goal-monthly-input').value) || 0;
    const targetDate = document.getElementById('goal-date-input').value;
    const expectedReturnRate = parseFloat(document.getElementById('goal-return-input').value) || 0;

    if (!title || !targetAmount || targetAmount <= 0) {
      window.app.showToast('กรุณากรอกชื่อเป้าหมายและจำนวนเงินเป้าหมาย', 'danger');
      return;
    }

    const newGoal = {
      title,
      category,
      targetAmount,
      currentAmount,
      monthlyContribution,
      targetDate,
      expectedReturnRate,
      color: category === 'การลงทุน' ? 'blue' : (category === 'ความมั่นคง' ? 'emerald' : 'purple')
    };

    window.storageManager.addSavingsGoal(newGoal);
    window.app.closeModal('add-goal-modal');
    window.app.showToast(`สร้างเป้าหมาย "${title}" เรียบร้อยแล้ว`, 'success');
    document.getElementById('add-goal-form').reset();
  },

  renderSavingsGoals() {
    const container = document.getElementById('savings-goals-list');
    const totalSavedEl = document.getElementById('savings-total-accumulated');
    const totalTargetEl = document.getElementById('savings-total-target');

    const goals = window.storageManager.getSavingsGoals();
    const totalSaved = goals.reduce((sum, g) => sum + (Number(g.currentAmount) || 0), 0);
    const totalTarget = goals.reduce((sum, g) => sum + (Number(g.targetAmount) || 0), 0);

    if (totalSavedEl) totalSavedEl.textContent = `${totalSaved.toLocaleString()} ฿`;
    if (totalTargetEl) totalTargetEl.textContent = `${totalTarget.toLocaleString()} ฿`;

    if (!container) return;

    if (goals.length === 0) {
      container.innerHTML = `
        <div class="card text-center" style="padding: 2.5rem 1rem; color: var(--text-muted); grid-column: 1 / -1;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎯</div>
          <div style="font-weight: 600; font-size: 1.1rem;">ยังไม่มีเป้าหมายการออมหรือการลงทุน</div>
          <div style="font-size: 0.85rem; margin-top: 4px;">กดปุ่ม "+ เพิ่มเป้าหมายใหม่" หรือสร้างเงินสำรองฉุกเฉินด้านล่าง</div>
        </div>
      `;
      return;
    }

    container.innerHTML = goals.map(g => {
      const progress = g.targetAmount > 0 ? Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) : 0;
      const remaining = Math.max(0, g.targetAmount - g.currentAmount);

      // Estimate months remaining based on monthly contribution
      let estMonths = 'ไม่ระบุ';
      if (g.monthlyContribution > 0 && remaining > 0) {
        estMonths = `อีกประมาณ ${Math.ceil(remaining / g.monthlyContribution)} เดือน`;
      } else if (remaining === 0) {
        estMonths = '🎉 บรรลุเป้าหมายแล้ว!';
      }

      return `
        <div class="card">
          <div class="flex justify-between items-start mb-2">
            <div>
              <span class="badge" style="background: var(--bg-subtle); color: var(--text-muted); font-size: 0.75rem;">${g.category}</span>
              <h4 class="mt-1" style="font-size: 1.1rem;">${g.title}</h4>
            </div>
            <button class="btn btn-ghost btn-sm" onclick="SavingsModule.handleDelete('${g.id}')" title="ลบเป้าหมาย" style="color: var(--danger);">
              🗑️
            </button>
          </div>

          <div class="mt-3">
            <div class="flex justify-between items-baseline mb-1">
              <span class="num-font font-bold text-xl text-primary">${g.currentAmount.toLocaleString()} ฿</span>
              <span class="text-xs text-muted">เป้าหมาย: <b class="num-font">${g.targetAmount.toLocaleString()} ฿</b></span>
            </div>
            <div class="progress-bar-wrapper" style="height: 10px;">
              <div class="progress-bar-fill progress-fill-${g.color || 'emerald'}" style="width: ${progress}%;"></div>
            </div>
            <div class="flex justify-between items-center mt-2 text-xs">
              <span class="num-font font-semibold text-primary">คืบหน้า ${progress}%</span>
              <span class="text-muted">ขาดอีก ${remaining.toLocaleString()} ฿ (${estMonths})</span>
            </div>
          </div>

          <div class="mt-4 pt-3 border-top flex justify-between items-center" style="border-top: 1px solid var(--border-light);">
            <div class="text-xs text-muted">
              ออมเดือนละ: <b class="num-font font-semibold text-main">${g.monthlyContribution ? g.monthlyContribution.toLocaleString() + ' ฿' : '-'}</b>
            </div>
            <button class="btn btn-outline btn-sm" onclick="SavingsModule.openDepositModal('${g.id}', '${g.title}', ${g.currentAmount})">
              + ฝากเพิ่ม
            </button>
          </div>
        </div>
      `;
    }).join('');
  },

  openDepositModal(id, title, currentAmount) {
    const amountStr = prompt(`ฝากเงินเพิ่มเข้าเป้าหมาย "${title}"\nปัจจุบันมีอยู่: ${currentAmount.toLocaleString()} ฿\nกรุณาระบุยอดเงินที่ต้องการฝากเพิ่ม (บาท):`, '5000');
    if (amountStr !== null) {
      const deposit = parseFloat(amountStr);
      if (!isNaN(deposit) && deposit > 0) {
        const newTotal = currentAmount + deposit;
        window.storageManager.updateSavingsGoalProgress(id, newTotal);

        // Also record as a savings transaction
        window.storageManager.addTransaction({
          date: new Date().toISOString().slice(0, 10),
          type: 'savings',
          category: `ออมเข้า: ${title}`,
          amount: deposit,
          paymentMethod: 'โอนผ่านธนาคาร',
          note: `ฝากเพิ่มเข้าเป้าหมาย ${title}`
        });

        window.app.showToast(`ฝากเงิน ${deposit.toLocaleString()} ฿ เข้าเป้าหมาย "${title}" เรียบร้อยแล้ว`, 'success');
      }
    }
  },

  calculateEmergencyFund() {
    const fixedCosts = window.storageManager.getFixedCosts();
    const alloc = window.storageManager.getAllocationSettings();
    const monthlyIncome = alloc.monthlyIncome || 50000;
    const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    // Approximate monthly essential living costs
    const monthlyEssentialSpend = totalFixedCosts + Math.max(10000, monthlyIncome * 0.25);

    const m3 = monthlyEssentialSpend * 3;
    const m6 = monthlyEssentialSpend * 6;
    const m12 = monthlyEssentialSpend * 12;

    const el3 = document.getElementById('ef-3m');
    const el6 = document.getElementById('ef-6m');
    const el12 = document.getElementById('ef-12m');

    if (el3) el3.textContent = `${m3.toLocaleString()} ฿`;
    if (el6) el6.textContent = `${m6.toLocaleString()} ฿`;
    if (el12) el12.textContent = `${m12.toLocaleString()} ฿`;
  },

  createEmergencyGoalAuto(months) {
    const fixedCosts = window.storageManager.getFixedCosts();
    const alloc = window.storageManager.getAllocationSettings();
    const monthlyIncome = alloc.monthlyIncome || 50000;
    const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const monthlyEssentialSpend = totalFixedCosts + Math.max(10000, monthlyIncome * 0.25);
    const targetAmount = Math.round(monthlyEssentialSpend * months);

    const newGoal = {
      title: `เงินสำรองฉุกเฉิน ${months} เดือน`,
      category: 'ความมั่นคง',
      targetAmount,
      currentAmount: 0,
      monthlyContribution: Math.round(targetAmount / 12),
      targetDate: new Date(Date.now() + 365*24*60*60*1000).toISOString().slice(0, 10),
      color: 'emerald'
    };

    window.storageManager.addSavingsGoal(newGoal);
    window.app.showToast(`สร้างเป้าหมาย "${newGoal.title}" ยอด ${targetAmount.toLocaleString()} ฿ เรียบร้อยแล้ว`, 'success');
  },

  calculateCompoundInterest() {
    const initial = parseFloat(document.getElementById('ci-initial')?.value) || 10000;
    const monthly = parseFloat(document.getElementById('ci-monthly')?.value) || 5000;
    const annualRate = parseFloat(document.getElementById('ci-rate')?.value) || 8;
    const years = parseFloat(document.getElementById('ci-years')?.value) || 10;

    const monthlyRate = (annualRate / 100) / 12;
    const totalMonths = years * 12;

    let balance = initial;
    let totalPrincipal = initial;

    for (let m = 1; m <= totalMonths; m++) {
      balance = (balance + monthly) * (1 + monthlyRate);
      totalPrincipal += monthly;
    }

    const totalInterest = Math.max(0, balance - totalPrincipal);

    const fvEl = document.getElementById('ci-future-value');
    const princEl = document.getElementById('ci-total-principal');
    const intEl = document.getElementById('ci-total-interest');

    if (fvEl) fvEl.textContent = `${Math.round(balance).toLocaleString()} ฿`;
    if (princEl) princEl.textContent = `${Math.round(totalPrincipal).toLocaleString()} ฿`;
    if (intEl) intEl.textContent = `${Math.round(totalInterest).toLocaleString()} ฿`;
  },

  handleDelete(id) {
    if (confirm('คุณต้องการลบเป้าหมายการออมนี้ใช่หรือไม่?')) {
      window.storageManager.deleteSavingsGoal(id);
      window.app.showToast('ลบเป้าหมายเรียบร้อยแล้ว', 'info');
    }
  }
};

window.SavingsModule = SavingsModule;
