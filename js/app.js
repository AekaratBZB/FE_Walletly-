/**
 * FinSmart Thai - Main Application Controller
 * Handles tab navigation, modal state, dashboard metrics, and toast notifications.
 */

const App = {
  currentTab: 'dashboard',

  init() {
    this.bindNavigation();
    this.bindModals();
    this.renderDashboardOverview();

    // Initialize submodules
    if (window.TransactionModule) window.TransactionModule.init();
    if (window.FixedCostModule) window.FixedCostModule.init();
    if (window.ProjectionModule) window.ProjectionModule.init();
    if (window.AllocationModule) window.AllocationModule.init();
    if (window.SavingsModule) window.SavingsModule.init();
    if (window.TaxModule) window.TaxModule.init();
    if (window.ReportsModule) window.ReportsModule.init();

    // Listen for storage changes to update Dashboard
    window.storageManager.onDataChange(() => {
      this.renderDashboardOverview();
    });

    console.log('FinSmart Thai - App Initialized successfully.');
  },

  bindNavigation() {
    const navButtons = document.querySelectorAll('.nav-tab-btn');
    navButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const targetTab = btn.getAttribute('data-tab');
        if (targetTab) {
          this.switchTab(targetTab);
        }
      });
    });
  },

  switchTab(tabId) {
    this.currentTab = tabId;

    // Update Nav Buttons
    document.querySelectorAll('.nav-tab-btn').forEach(btn => {
      if (btn.getAttribute('data-tab') === tabId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Update Tab Panels
    document.querySelectorAll('.tab-panel').forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Trigger charts re-render if reports tab
    if (tabId === 'reports' && window.ReportsModule) {
      setTimeout(() => window.ReportsModule.renderAllReports(), 100);
    }
    if (tabId === 'projection' && window.ProjectionModule) {
      window.ProjectionModule.calculateAndRender();
    }
    if (tabId === 'dashboard') {
      this.renderDashboardOverview();
    }

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  bindModals() {
    // Open Modal buttons
    document.querySelectorAll('[data-open-modal]').forEach(btn => {
      btn.addEventListener('click', () => {
        const modalId = btn.getAttribute('data-open-modal');
        this.openModal(modalId);
      });
    });

    // Close Modal buttons
    document.querySelectorAll('.modal-close-btn, .modal-backdrop').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target === el || el.classList.contains('modal-close-btn')) {
          const backdrop = el.closest('.modal-backdrop');
          if (backdrop) backdrop.classList.remove('active');
        }
      });
    });

    // Escape key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-backdrop.active').forEach(m => m.classList.remove('active'));
      }
    });
  },

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.add('active');
      const firstInput = modal.querySelector('input:not([type="hidden"]), select, textarea');
      if (firstInput) setTimeout(() => firstInput.focus(), 150);
    }
  },

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('active');
    }
  },

  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'danger') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `
      <span style="font-size: 1.1rem;">${icon}</span>
      <div style="flex: 1; color: var(--text-main);">${message}</div>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.animation = 'fadeOutToast 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  },

  renderDashboardOverview() {
    const txs = window.storageManager.getTransactions();
    const fixedCosts = window.storageManager.getFixedCosts();
    const alloc = window.storageManager.getAllocationSettings();

    // Month calculations
    const now = new Date();
    const currentMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const totalIncome = txs
      .filter(t => t.type === 'income' && (t.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalFixedCosts = fixedCosts.reduce((sum, c) => sum + Number(c.amount || 0), 0);
    const unpaidFixedCosts = fixedCosts.filter(c => !c.isPaid).reduce((sum, c) => sum + Number(c.amount || 0), 0);

    const totalVariableExpenses = txs
      .filter(t => t.type === 'expense' && (t.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalSavings = txs
      .filter(t => t.type === 'savings' && (t.date || '').startsWith(currentMonthPrefix))
      .reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const totalSpentSoFar = totalFixedCosts + totalVariableExpenses;
    const netRemainingCash = totalIncome - totalSpentSoFar - totalSavings;

    // Update Dashboard Stat Cards
    const incEl = document.getElementById('dash-income-total');
    const expEl = document.getElementById('dash-expense-total');
    const fixEl = document.getElementById('dash-fixed-total');
    const savEl = document.getElementById('dash-savings-total');
    const remEl = document.getElementById('dash-remaining-total');

    if (incEl) incEl.textContent = `${totalIncome.toLocaleString()} ฿`;
    if (expEl) expEl.textContent = `${totalSpentSoFar.toLocaleString()} ฿`;
    if (fixEl) fixEl.textContent = `${totalFixedCosts.toLocaleString()} ฿ (${unpaidFixedCosts > 0 ? 'รอจ่าย ' + unpaidFixedCosts.toLocaleString() + ' ฿' : 'จ่ายครบแล้ว'})`;
    if (savEl) savEl.textContent = `${totalSavings.toLocaleString()} ฿`;
    if (remEl) {
      remEl.textContent = `${netRemainingCash.toLocaleString()} ฿`;
      remEl.className = netRemainingCash >= 0 ? 'stat-value num-font text-success' : 'stat-value num-font text-danger';
    }

    // Render Recent 5 Transactions in Dashboard
    const recentTableBody = document.getElementById('dash-recent-tx-body');
    if (recentTableBody) {
      const recentTxs = txs.slice(0, 5);
      if (recentTxs.length === 0) {
        recentTableBody.innerHTML = `<tr><td colspan="4" class="text-center text-muted" style="padding: 1.5rem;">ยังไม่มีรายการล่าสุด</td></tr>`;
      } else {
        recentTableBody.innerHTML = recentTxs.map(t => {
          let badge = `<span class="badge badge-expense">จ่าย</span>`;
          let amountColor = 'text-danger';
          let sign = '-';
          if (t.type === 'income') {
            badge = `<span class="badge badge-income">รับ</span>`;
            amountColor = 'text-success';
            sign = '+';
          } else if (t.type === 'fixed') {
            badge = `<span class="badge badge-fixed">ฟิกคอส</span>`;
            amountColor = 'text-warning';
          } else if (t.type === 'savings') {
            badge = `<span class="badge badge-savings">ออม</span>`;
            amountColor = 'text-info';
          }

          return `
            <tr>
              <td class="num-font text-xs" style="color: var(--text-muted);">${t.date}</td>
              <td>${badge}</td>
              <td style="font-weight: 500;">${t.category}</td>
              <td class="text-right num-font font-semibold ${amountColor}">${sign}${Number(t.amount).toLocaleString()} ฿</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Mini Fixed Costs Checklist in Dashboard
    const miniFcList = document.getElementById('dash-fixed-checklist');
    if (miniFcList) {
      const sortedFc = [...fixedCosts].sort((a, b) => (a.dueDay || 1) - (b.dueDay || 1));
      if (sortedFc.length === 0) {
        miniFcList.innerHTML = `<div class="text-muted text-center" style="padding: 1rem;">ไม่มีฟิกคอสในระบบ</div>`;
      } else {
        miniFcList.innerHTML = sortedFc.slice(0, 4).map(fc => `
          <div class="flex items-center justify-between p-2" style="padding: 0.6rem 0; border-bottom: 1px solid var(--border-light);">
            <div class="flex items-center gap-2">
              <input type="checkbox" ${fc.isPaid ? 'checked' : ''} onchange="FixedCostModule.togglePaid('${fc.id}')" style="accent-color: var(--primary);">
              <div>
                <div style="font-size: 0.85rem; font-weight: 600; ${fc.isPaid ? 'text-decoration: line-through; opacity: 0.6;' : ''}">${fc.title}</div>
                <div style="font-size: 0.75rem; color: var(--text-muted);">กำหนดชำระวันที่ ${fc.dueDay}</div>
              </div>
            </div>
            <div class="num-font font-bold text-sm ${fc.isPaid ? 'text-muted' : 'text-main'}">
              ${fc.amount.toLocaleString()} ฿
            </div>
          </div>
        `).join('');
      }
    }
  }
};

// Start the app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  window.app = App;
  App.init();
});
