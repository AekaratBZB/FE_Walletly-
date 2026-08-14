/**
 * FinSmart Thai - Reports, Visual Charts & Data Export Module
 * Integrates Chart.js for data visualization, category breakdowns, and export/import.
 */

const ReportsModule = {
  charts: {},

  init() {
    this.bindEvents();
    this.renderAllReports();
  },

  bindEvents() {
    // Export CSV Button
    const btnExportCSV = document.getElementById('btn-export-csv');
    if (btnExportCSV) {
      btnExportCSV.addEventListener('click', () => {
        const success = window.storageManager.exportTransactionsCSV();
        if (success) {
          window.app.showToast('ส่งออกไฟล์ CSV เรียบร้อยแล้ว', 'success');
        } else {
          window.app.showToast('ไม่มีข้อมูลธุรกรรมสำหรับส่งออก', 'warning');
        }
      });
    }

    // Export JSON Backup Button
    const btnExportJSON = document.getElementById('btn-export-json');
    if (btnExportJSON) {
      btnExportJSON.addEventListener('click', () => {
        window.storageManager.exportFullBackupJSON();
        window.app.showToast('สำรองข้อมูล JSON เรียบร้อยแล้ว', 'success');
      });
    }

    // Import JSON File
    const fileImportJSON = document.getElementById('file-import-json');
    if (fileImportJSON) {
      fileImportJSON.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = window.storageManager.importFullBackupJSON(event.target.result);
          if (res.success) {
            window.app.showToast('นำเข้าข้อมูลสำเร็จเรียบร้อยแล้ว!', 'success');
          } else {
            window.app.showToast('เกิดข้อผิดพลาดในการนำเข้าไฟล์: ' + res.error, 'danger');
          }
        };
        reader.readAsText(file);
      });
    }

    // Reset to Demo Button
    const btnResetDemo = document.getElementById('btn-reset-demo');
    if (btnResetDemo) {
      btnResetDemo.addEventListener('click', () => {
        if (confirm('คุณต้องการโหลดข้อมูลตัวอย่าง (Demo Data) หรือไม่? ข้อมูลที่มีอยู่จะถูกเขียนทับ')) {
          window.storageManager.resetToDemo();
          window.app.showToast('โหลดข้อมูลตัวอย่างสำเร็จแล้ว!', 'success');
        }
      });
    }

    // Clear All Data Button
    const btnClearAll = document.getElementById('btn-clear-all');
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        if (confirm('⚠️ คำเตือน: คุณต้องการล้างข้อมูลทั้งหมดในระบบใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
          window.storageManager.clearAll();
          window.app.showToast('ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว', 'info');
        }
      });
    }

    // Storage listener
    window.storageManager.onDataChange(() => {
      this.renderAllReports();
    });
  },

  renderAllReports() {
    if (typeof Chart === 'undefined') return;

    this.renderCategoryDoughnut();
    this.renderIncomeExpenseBar();
    this.renderFixedVsVariable();
  },

  renderCategoryDoughnut() {
    const canvas = document.getElementById('chart-category-doughnut');
    if (!canvas) return;

    const txs = window.storageManager.getTransactions();
    const fixedCosts = window.storageManager.getFixedCosts();

    // Group expenses by category
    const categoryTotals = {};

    // Variable expenses
    txs.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + Number(t.amount || 0);
    });

    // Fixed Costs
    fixedCosts.forEach(fc => {
      const key = `ฟิกคอส: ${fc.title}`;
      categoryTotals[key] = (categoryTotals[key] || 0) + Number(fc.amount || 0);
    });

    const labels = Object.keys(categoryTotals);
    const data = Object.values(categoryTotals);

    if (this.charts.category) {
      this.charts.category.destroy();
    }

    const colors = [
      '#059669', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e',
      '#10b981', '#0ea5e9', '#ec4899', '#6366f1', '#14b8a6'
    ];

    this.charts.category = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: labels.length > 0 ? labels : ['ไม่มีข้อมูล'],
        datasets: [{
          data: data.length > 0 ? data : [1],
          backgroundColor: labels.length > 0 ? colors.slice(0, labels.length) : ['#e2e8f0'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Prompt', size: 12 }, padding: 14 }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.raw || 0;
                return ` ${context.label}: ${val.toLocaleString()} ฿`;
              }
            }
          }
        },
        cutout: '65%'
      }
    });
  },

  renderIncomeExpenseBar() {
    const canvas = document.getElementById('chart-monthly-bar');
    if (!canvas) return;

    const txs = window.storageManager.getTransactions();
    const fixedCosts = window.storageManager.getFixedCosts();
    const totalFixedCosts = fixedCosts.reduce((s, c) => s + Number(c.amount || 0), 0);

    const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalVariableExpenses = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalSavings = txs.filter(t => t.type === 'savings').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExpenses = totalFixedCosts + totalVariableExpenses;
    const netCashflow = totalIncome - totalExpenses - totalSavings;

    if (this.charts.monthlyBar) {
      this.charts.monthlyBar.destroy();
    }

    this.charts.monthlyBar = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: ['รายรับรวม', 'ฟิกคอสคงที่', 'รายจ่ายผันแปร', 'ออม & ลงทุน', 'เงินเหลือสุทธิ'],
        datasets: [{
          label: 'จำนวนเงิน (บาท)',
          data: [totalIncome, totalFixedCosts, totalVariableExpenses, totalSavings, Math.max(0, netCashflow)],
          backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#059669'],
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.raw.toLocaleString()} บาท`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: (val) => `${(val / 1000).toLocaleString()}k ฿`,
              font: { family: 'Outfit', size: 11 }
            }
          },
          x: {
            ticks: { font: { family: 'Prompt', size: 12 } }
          }
        }
      }
    });
  },

  renderFixedVsVariable() {
    const canvas = document.getElementById('chart-fixed-ratio');
    if (!canvas) return;

    const txs = window.storageManager.getTransactions();
    const fixedCosts = window.storageManager.getFixedCosts();

    const totalFixed = fixedCosts.reduce((s, c) => s + Number(c.amount || 0), 0);
    const totalVariable = txs.filter(t => t.type === 'expense').reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalSavings = txs.filter(t => t.type === 'savings').reduce((s, t) => s + Number(t.amount || 0), 0);

    if (this.charts.fixedRatio) {
      this.charts.fixedRatio.destroy();
    }

    this.charts.fixedRatio = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['ฟิกคอสคงที่', 'รายจ่ายกินใช้ผันแปร', 'เงินออม/ลงทุน'],
        datasets: [{
          data: [totalFixed, totalVariable, totalSavings],
          backgroundColor: ['#f59e0b', '#ef4444', '#10b981'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { family: 'Prompt', size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw.toLocaleString()} ฿`
            }
          }
        }
      }
    });
  }
};

window.ReportsModule = ReportsModule;
