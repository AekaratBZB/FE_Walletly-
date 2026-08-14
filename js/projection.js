/**
 * FinSmart Thai - Cash Flow & Future Spending Projection Module
 * Forecasts future account balances, daily burn rates, liquidity runway, and "Can I Afford It?" simulator.
 */

const ProjectionModule = {
  init() {
    this.bindEvents();
    this.calculateAndRender();
  },

  bindEvents() {
    // Range / Horizon Selector
    const horizonSelect = document.getElementById('proj-horizon-select');
    if (horizonSelect) {
      horizonSelect.addEventListener('change', () => this.calculateAndRender());
    }

    // Daily Spend Input override
    const customDailySpend = document.getElementById('proj-custom-daily-spend');
    if (customDailySpend) {
      customDailySpend.addEventListener('input', () => this.calculateAndRender());
    }

    // Starting Balance Input
    const startingBalance = document.getElementById('proj-starting-balance');
    if (startingBalance) {
      startingBalance.addEventListener('input', () => this.calculateAndRender());
    }

    // "Can I Afford It?" Simulator Form
    const affordForm = document.getElementById('afford-simulator-form');
    if (affordForm) {
      affordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.runAffordabilitySimulation();
      });
    }

    // Storage listener
    window.storageManager.onDataChange((detail) => {
      if (['transactions', 'fixedCosts', 'allocation', 'all'].includes(detail.scope)) {
        this.calculateAndRender();
      }
    });
  },

  calculateAndRender() {
    const fixedCosts = window.storageManager.getFixedCosts();
    const alloc = window.storageManager.getAllocationSettings();
    const transactions = window.storageManager.getTransactions();

    const monthlyIncome = alloc.monthlyIncome || 50000;
    const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const unpaidFixedCosts = fixedCosts.filter(c => !c.isPaid).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    // Calculate Variable Expenses this month so far
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const thisMonthVariableExpenses = transactions
      .filter(t => t.type === 'expense' && (t.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    // Days in current month and remaining days
    const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const currentDay = now.getDate();
    const daysRemaining = Math.max(1, totalDaysInMonth - currentDay);

    // Starting Balance (or estimated current liquid balance)
    let initialBalance = parseFloat(document.getElementById('proj-starting-balance')?.value);
    if (isNaN(initialBalance)) {
      initialBalance = monthlyIncome - thisMonthVariableExpenses - (totalFixedCosts - unpaidFixedCosts);
      if (document.getElementById('proj-starting-balance')) {
        document.getElementById('proj-starting-balance').value = Math.max(0, Math.round(initialBalance));
      }
    }

    // Net Available for Daily Spending = Starting Balance - Unpaid Fixed Costs
    const availableForSpending = Math.max(0, initialBalance - unpaidFixedCosts);
    const safeDailyBudget = Math.floor(availableForSpending / daysRemaining);

    // User custom daily spend or default calculated
    let dailySpendRate = parseFloat(document.getElementById('proj-custom-daily-spend')?.value);
    if (isNaN(dailySpendRate) || dailySpendRate <= 0) {
      dailySpendRate = safeDailyBudget;
      if (document.getElementById('proj-custom-daily-spend')) {
        document.getElementById('proj-custom-daily-spend').placeholder = `${safeDailyBudget}`;
      }
    }

    // Projected End of Month Balance
    const projectedEndOfMonthBalance = initialBalance - unpaidFixedCosts - (dailySpendRate * daysRemaining);

    // Update UI Stats Cards
    const safeDailyEl = document.getElementById('proj-safe-daily-amount');
    const unpaidFcEl = document.getElementById('proj-unpaid-fc-amount');
    const projectedEndEl = document.getElementById('proj-end-month-balance');
    const runwayDaysEl = document.getElementById('proj-runway-days');

    if (safeDailyEl) safeDailyEl.textContent = `${safeDailyBudget.toLocaleString()} ฿/วัน`;
    if (unpaidFcEl) unpaidFcEl.textContent = `${unpaidFixedCosts.toLocaleString()} ฿`;
    if (projectedEndEl) {
      projectedEndEl.textContent = `${Math.round(projectedEndOfMonthBalance).toLocaleString()} ฿`;
      projectedEndEl.className = projectedEndOfMonthBalance >= 0 ? 'stat-value num-font text-success' : 'stat-value num-font text-danger';
    }

    // Calculate Runway (How many months/days of survival if income stops)
    const monthlyTotalBurn = totalFixedCosts + (dailySpendRate * 30);
    const runwayMonths = monthlyTotalBurn > 0 ? (initialBalance / monthlyTotalBurn) : 0;
    if (runwayDaysEl) {
      runwayDaysEl.textContent = `${(runwayMonths * 30).toFixed(0)} วัน (${runwayMonths.toFixed(1)} เดือน)`;
    }

    // Render 30-Day Projection Timeline Table / Chart
    this.renderTimeline(initialBalance, dailySpendRate, fixedCosts);
  },

  renderTimeline(currentBalance, dailySpend, fixedCosts) {
    const container = document.getElementById('projection-timeline-body');
    if (!container) return;

    const horizonDays = parseInt(document.getElementById('proj-horizon-select')?.value || '30', 10);
    let runningBalance = currentBalance;
    const now = new Date();
    const rows = [];

    for (let dayOffset = 1; dayOffset <= Math.min(horizonDays, 30); dayOffset++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
      const dayOfMonth = targetDate.getDate();
      const dateString = targetDate.toISOString().slice(0, 10);

      // Check if any unpaid fixed cost due on this day
      const dueItems = fixedCosts.filter(c => !c.isPaid && c.dueDay === dayOfMonth);
      const dueTotal = dueItems.reduce((s, c) => s + (Number(c.amount) || 0), 0);

      runningBalance = runningBalance - dailySpend - dueTotal;

      let eventBadge = '';
      if (dueItems.length > 0) {
        eventBadge = `<span class="badge badge-fixed">หักฟิกคอส: ${dueItems.map(d => d.title).join(', ')} (-${dueTotal.toLocaleString()} ฿)</span>`;
      }

      rows.push(`
        <tr>
          <td class="num-font text-sm">${dateString} (วันที่ ${dayOfMonth})</td>
          <td>${eventBadge || '<span style="color: var(--text-subtle);">-</span>'}</td>
          <td class="text-right num-font text-danger text-sm">-${dailySpend.toLocaleString()} ฿</td>
          <td class="text-right num-font font-bold ${runningBalance >= 0 ? 'text-success' : 'text-danger'}">
            ${Math.round(runningBalance).toLocaleString()} ฿
          </td>
        </tr>
      `);
    }

    container.innerHTML = rows.join('');
  },

  runAffordabilitySimulation() {
    const itemName = document.getElementById('afford-item-name').value.trim() || 'สินค้า';
    const itemPrice = parseFloat(document.getElementById('afford-item-price').value);
    const paymentMonths = parseInt(document.getElementById('afford-installments').value || '1', 10);

    const resultBox = document.getElementById('afford-result-box');
    if (!resultBox) return;

    if (!itemPrice || itemPrice <= 0) {
      window.app.showToast('กรุณากรอกราคาสินค้า', 'danger');
      return;
    }

    const alloc = window.storageManager.getAllocationSettings();
    const fixedCosts = window.storageManager.getFixedCosts();
    const monthlyIncome = alloc.monthlyIncome || 50000;
    const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const disposableIncome = monthlyIncome - totalFixedCosts;

    const monthlyPayment = paymentMonths > 1 ? (itemPrice / paymentMonths) : itemPrice;
    const monthlyImpactRatio = (monthlyPayment / disposableIncome) * 100;

    let verdict = '';
    let verdictClass = '';
    let verdictDesc = '';

    if (monthlyImpactRatio <= 15) {
      verdict = '🟢 ซื้อได้สบายมาก (Safe to Buy)';
      verdictClass = 'text-success';
      verdictDesc = `ค่าใช้จ่าย ${monthlyPayment.toLocaleString()} ฿ คิดเป็นเพียง ${monthlyImpactRatio.toFixed(1)}% ของเงินอิสระ ไม่กระทบสภาพคล่อง`;
    } else if (monthlyImpactRatio <= 35) {
      verdict = '🟡 ซื้อได้ แต่ควรระวัง (Manageable)';
      verdictClass = 'text-warning';
      verdictDesc = `ค่าใช้จ่าย ${monthlyPayment.toLocaleString()} ฿ คิดเป็น ${monthlyImpactRatio.toFixed(1)}% ของเงินอิสระ ควรลดค่าใช้จ่ายฟุ่มเฟือยอื่นในเดือนนี้`;
    } else {
      verdict = '🔴 สภาพคล่องตึงตัว / เสี่ยงเงินขาดมือ (High Risk)';
      verdictClass = 'text-danger';
      verdictDesc = `ค่าใช้จ่าย ${monthlyPayment.toLocaleString()} ฿ กินสัดส่วนสูงถึง ${monthlyImpactRatio.toFixed(1)}% ของเงินอิสระ แนะนำให้เก็บเงินสำรองก่อน`;
    }

    resultBox.style.display = 'block';
    resultBox.innerHTML = `
      <div style="padding: 1.25rem; background: var(--bg-subtle); border-radius: var(--radius-md); border: 1px solid var(--border-color);">
        <div style="font-size: 1.15rem; font-weight: 700;" class="${verdictClass}">${verdict}</div>
        <p style="margin: 0.5rem 0; font-size: 0.9rem; color: var(--text-main);">${verdictDesc}</p>
        <div class="grid grid-cols-3 gap-2 mt-3" style="font-size: 0.85rem;">
          <div style="background: white; padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
            <div class="text-muted">ราคาสินค้า:</div>
            <div class="font-bold num-font">${itemPrice.toLocaleString()} ฿</div>
          </div>
          <div style="background: white; padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
            <div class="text-muted">ผ่อนชำระ:</div>
            <div class="font-bold num-font">${monthlyPayment.toLocaleString(undefined, { maximumFractionDigits: 0 })} ฿/เดือน (${paymentMonths} เดือน)</div>
          </div>
          <div style="background: white; padding: 0.5rem; border-radius: var(--radius-sm); border: 1px solid var(--border-light);">
            <div class="text-muted">ภาระต่อเงินอิสระ:</div>
            <div class="font-bold num-font ${verdictClass}">${monthlyImpactRatio.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    `;
  }
};

window.ProjectionModule = ProjectionModule;
