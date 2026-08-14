/**
 * FinSmart Thai - Data Storage & Persistence Module
 * Manages LocalStorage, Demo Data seeding, JSON/CSV Export & Import.
 */

const STORAGE_KEYS = {
  TRANSACTIONS: 'finsmart_transactions_v1',
  FIXED_COSTS: 'finsmart_fixed_costs_v1',
  ALLOCATION_SETTINGS: 'finsmart_allocation_v1',
  SAVINGS_GOALS: 'finsmart_savings_goals_v1',
  TAX_SETTINGS: 'finsmart_tax_settings_v1',
  APP_CONFIG: 'finsmart_app_config_v1'
};

// Initial Demo Dataset (Realistic Thai financial scenario)
const DEMO_DATA = {
  transactions: [
    {
      id: 'tx-1',
      date: '2026-08-01',
      type: 'income',
      category: 'เงินเดือน (Salary)',
      amount: 45000,
      paymentMethod: 'โอนผ่านธนาคาร',
      note: 'เงินเดือนประจำเดือนสิงหาคม',
      isRecurring: true
    },
    {
      id: 'tx-2',
      date: '2026-08-01',
      type: 'income',
      category: 'รายได้เสริม (Freelance)',
      amount: 8000,
      paymentMethod: 'โอนผ่านธนาคาร',
      note: 'รับงานออกแบบเว็บ',
      isRecurring: false
    },
    {
      id: 'tx-3',
      date: '2026-08-02',
      type: 'fixed',
      category: 'ที่อยู่อาศัย (ผ่อนคอนโด)',
      amount: 12000,
      paymentMethod: 'หักบัญชีอัตโนมัติ',
      note: 'ผ่อนคอนโด ธ.กสิกร',
      isRecurring: true
    },
    {
      id: 'tx-4',
      date: '2026-08-03',
      type: 'fixed',
      category: 'ค่าเดินทาง (ค่างวดรถ)',
      amount: 7500,
      paymentMethod: 'หักบัญชีอัตโนมัติ',
      note: 'ค่างวดรถยนต์',
      isRecurring: true
    },
    {
      id: 'tx-5',
      date: '2026-08-04',
      type: 'expense',
      category: 'อาหารและเครื่องดื่ม',
      amount: 450,
      paymentMethod: 'สแกน QR',
      note: 'มื้อกลางวันและกาแฟ',
      isRecurring: false
    },
    {
      id: 'tx-6',
      date: '2026-08-05',
      type: 'expense',
      category: 'ช้อปปิ้งและของใช้',
      amount: 1850,
      paymentMethod: 'บัตรเครดิต',
      note: 'ซื้อของเข้าห้อง Big C',
      isRecurring: false
    },
    {
      id: 'tx-7',
      date: '2026-08-06',
      type: 'savings',
      category: 'กองทุนสำรองฉุกเฉิน',
      amount: 5000,
      paymentMethod: 'โอนผ่านธนาคาร',
      note: 'โอนเข้า Kept บัญชี Grow',
      isRecurring: true
    },
    {
      id: 'tx-8',
      date: '2026-08-07',
      type: 'savings',
      category: 'ลงทุน DCA (Dime / ThaiESG)',
      amount: 5000,
      paymentMethod: 'โอนผ่านธนาคาร',
      note: 'DCA S&P500 และ ThaiESG',
      isRecurring: true
    },
    {
      id: 'tx-9',
      date: '2026-08-08',
      type: 'expense',
      category: 'อาหารและเครื่องดื่ม',
      amount: 320,
      paymentMethod: 'สแกน QR',
      note: 'มื้อเย็นข้าวต้ม',
      isRecurring: false
    },
    {
      id: 'tx-10',
      date: '2026-08-10',
      type: 'expense',
      category: 'บันเทิงและสันทนาการ',
      amount: 600,
      paymentMethod: 'บัตรเครดิต',
      note: 'ตั๋วหนังและป๊อปคอร์น',
      isRecurring: false
    }
  ],

  fixedCosts: [
    {
      id: 'fc-1',
      title: 'ผ่อนคอนโด',
      category: 'ที่อยู่อาศัย',
      amount: 12000,
      dueDay: 2,
      isPaid: true,
      autoDeduct: true,
      note: 'ตัดผ่าน ธ.กสิกร'
    },
    {
      id: 'fc-2',
      title: 'ค่างวดรถยนต์',
      category: 'ยานพาหนะ',
      amount: 7500,
      dueDay: 3,
      isPaid: true,
      autoDeduct: true,
      note: 'กรุงศรี ออโต้'
    },
    {
      id: 'fc-3',
      title: 'ค่าอินเทอร์เน็ตบ้าน & มือถือ',
      category: 'สาธารณูปโภค',
      amount: 1099,
      dueDay: 15,
      isPaid: false,
      autoDeduct: false,
      note: 'AIS Fibre + 5G'
    },
    {
      id: 'fc-4',
      title: 'เบี้ยประกันชีวิตและสุขภาพ',
      category: 'ประกัน',
      amount: 3200,
      dueDay: 20,
      isPaid: false,
      autoDeduct: true,
      note: 'AIA ประกันชีวิต+สุขภาพ'
    },
    {
      id: 'fc-5',
      title: 'Netflix & Spotify Family',
      category: 'Subscriptions',
      amount: 499,
      dueDay: 25,
      isPaid: false,
      autoDeduct: true,
      note: 'ตัดบัตรเครดิต'
    },
    {
      id: 'fc-6',
      title: 'ให้คุณพ่อคุณแม่',
      category: 'ครอบครัว',
      amount: 5000,
      dueDay: 1,
      isPaid: true,
      autoDeduct: false,
      note: 'โอนเงินวันเงินเดือนออก'
    }
  ],

  allocationSettings: {
    rule: '50-30-20', // 50-30-20, 60-20-20, 6jars, custom
    monthlyIncome: 53000,
    buckets: {
      needs: 50,      // จำเป็น / Fix cost + อาหารเดินทาง
      wants: 30,      // ตามใจ / ช้อปปิ้ง ท่องเที่ยว
      savings: 20     // ออม & ลงทุน
    }
  },

  savingsGoals: [
    {
      id: 'goal-1',
      title: 'เงินสำรองฉุกเฉิน 6 เดือน',
      category: 'ความมั่นคง',
      targetAmount: 150000,
      currentAmount: 95000,
      targetDate: '2026-12-31',
      monthlyContribution: 5000,
      icon: 'shield-check',
      color: 'emerald'
    },
    {
      id: 'goal-2',
      title: 'พอร์ตลงทุนเกษียณ (DCA หุ้น/กองทุน)',
      category: 'การลงทุน',
      targetAmount: 1000000,
      currentAmount: 220000,
      targetDate: '2035-12-31',
      monthlyContribution: 5000,
      expectedReturnRate: 8, // 8% p.a.
      icon: 'trending-up',
      color: 'blue'
    },
    {
      id: 'goal-3',
      title: 'ทริปเที่ยวญี่ปุ่นปลายปี',
      category: 'ท่องเที่ยว',
      targetAmount: 60000,
      currentAmount: 35000,
      targetDate: '2026-11-30',
      monthlyContribution: 5000,
      icon: 'plane',
      color: 'purple'
    }
  ],

  taxSettings: {
    taxYear: 2026,
    annualSalary: 540000, // 45k x 12
    annualBonus: 90000,   // 2 เดือน
    freelanceIncome: 96000, // 8k x 12
    socialSecurity: 9000, // 750 x 12
    personalDeduction: 60000,
    spouseDeduction: 0,
    childCount: 0,
    parentCount: 2, // 30k x 2 = 60k
    lifeInsurance: 38400, // 3.2k x 12
    healthInsurance: 15000,
    ssfAmount: 30000,
    rmfAmount: 30000,
    thaiEsgAmount: 30000,
    providentFund: 27000, // 5%
    mortgageInterest: 45000,
    easyReceipt: 10000,
    donationGeneral: 5000,
    donationEducation: 0,
    withholdingTax: 18500 // ภาษีที่ถูกหัก ณ ที่จ่ายไปแล้ว
  }
};

class StorageManager {
  constructor() {
    this.init();
  }

  init() {
    // If first time, load initial demo dataset
    if (!localStorage.getItem(STORAGE_KEYS.TRANSACTIONS)) {
      this.loadDemoData();
    }
  }

  loadDemoData() {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(DEMO_DATA.transactions));
    localStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(DEMO_DATA.fixedCosts));
    localStorage.setItem(STORAGE_KEYS.ALLOCATION_SETTINGS, JSON.stringify(DEMO_DATA.allocationSettings));
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(DEMO_DATA.savingsGoals));
    localStorage.setItem(STORAGE_KEYS.TAX_SETTINGS, JSON.stringify(DEMO_DATA.taxSettings));
  }

  // Transactions
  getTransactions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveTransactions(transactions) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    this.notifyDataChange('transactions');
  }

  addTransaction(tx) {
    const list = this.getTransactions();
    list.unshift({
      ...tx,
      id: tx.id || 'tx-' + Date.now(),
      amount: Number(tx.amount) || 0
    });
    this.saveTransactions(list);
  }

  deleteTransaction(id) {
    const list = this.getTransactions().filter(t => t.id !== id);
    this.saveTransactions(list);
  }

  // Fixed Costs
  getFixedCosts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FIXED_COSTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveFixedCosts(costs) {
    localStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(costs));
    this.notifyDataChange('fixedCosts');
  }

  addFixedCost(cost) {
    const list = this.getFixedCosts();
    list.push({
      ...cost,
      id: cost.id || 'fc-' + Date.now(),
      amount: Number(cost.amount) || 0,
      dueDay: Number(cost.dueDay) || 1,
      isPaid: cost.isPaid || false
    });
    this.saveFixedCosts(list);
  }

  toggleFixedCostPaid(id) {
    const list = this.getFixedCosts().map(fc => {
      if (fc.id === id) {
        return { ...fc, isPaid: !fc.isPaid };
      }
      return fc;
    });
    this.saveFixedCosts(list);
  }

  deleteFixedCost(id) {
    const list = this.getFixedCosts().filter(fc => fc.id !== id);
    this.saveFixedCosts(list);
  }

  // Allocation Settings
  getAllocationSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ALLOCATION_SETTINGS);
      return data ? JSON.parse(data) : DEMO_DATA.allocationSettings;
    } catch (e) {
      return DEMO_DATA.allocationSettings;
    }
  }

  saveAllocationSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.ALLOCATION_SETTINGS, JSON.stringify(settings));
    this.notifyDataChange('allocation');
  }

  // Savings Goals
  getSavingsGoals() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  saveSavingsGoals(goals) {
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(goals));
    this.notifyDataChange('savings');
  }

  addSavingsGoal(goal) {
    const list = this.getSavingsGoals();
    list.push({
      ...goal,
      id: goal.id || 'goal-' + Date.now(),
      targetAmount: Number(goal.targetAmount) || 0,
      currentAmount: Number(goal.currentAmount) || 0,
      monthlyContribution: Number(goal.monthlyContribution) || 0,
      expectedReturnRate: Number(goal.expectedReturnRate) || 0
    });
    this.saveSavingsGoals(list);
  }

  updateSavingsGoalProgress(id, newAmount) {
    const list = this.getSavingsGoals().map(g => {
      if (g.id === id) {
        return { ...g, currentAmount: Number(newAmount) };
      }
      return g;
    });
    this.saveSavingsGoals(list);
  }

  deleteSavingsGoal(id) {
    const list = this.getSavingsGoals().filter(g => g.id !== id);
    this.saveSavingsGoals(list);
  }

  // Tax Settings
  getTaxSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TAX_SETTINGS);
      return data ? JSON.parse(data) : DEMO_DATA.taxSettings;
    } catch (e) {
      return DEMO_DATA.taxSettings;
    }
  }

  saveTaxSettings(settings) {
    localStorage.setItem(STORAGE_KEYS.TAX_SETTINGS, JSON.stringify(settings));
    this.notifyDataChange('tax');
  }

  // Backup and Restore (JSON)
  exportFullBackupJSON() {
    const backup = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions: this.getTransactions(),
      fixedCosts: this.getFixedCosts(),
      allocationSettings: this.getAllocationSettings(),
      savingsGoals: this.getSavingsGoals(),
      taxSettings: this.getTaxSettings()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinSmart_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  importFullBackupJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (data.transactions) localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(data.transactions));
      if (data.fixedCosts) localStorage.setItem(STORAGE_KEYS.FIXED_COSTS, JSON.stringify(data.fixedCosts));
      if (data.allocationSettings) localStorage.setItem(STORAGE_KEYS.ALLOCATION_SETTINGS, JSON.stringify(data.allocationSettings));
      if (data.savingsGoals) localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(data.savingsGoals));
      if (data.taxSettings) localStorage.setItem(STORAGE_KEYS.TAX_SETTINGS, JSON.stringify(data.taxSettings));
      this.notifyDataChange('all');
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }

  // CSV Export for Transactions
  exportTransactionsCSV() {
    const txs = this.getTransactions();
    if (!txs.length) return false;

    const headers = ['ID', 'Date', 'Type', 'Category', 'Amount (THB)', 'Payment Method', 'Note'];
    const rows = txs.map(t => [
      t.id,
      t.date,
      t.type,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.paymentMethod || '').replace(/"/g, '""')}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinSmart_Transactions_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    return true;
  }

  // Reset to Demo Data
  resetToDemo() {
    this.loadDemoData();
    this.notifyDataChange('all');
  }

  // Clear All Data
  clearAll() {
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.FIXED_COSTS);
    localStorage.removeItem(STORAGE_KEYS.SAVINGS_GOALS);
    localStorage.removeItem(STORAGE_KEYS.ALLOCATION_SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.TAX_SETTINGS);
    this.notifyDataChange('all');
  }

  // Event listener callback registration
  onDataChange(callback) {
    window.addEventListener('finsmart_datachange', (e) => callback(e.detail));
  }

  notifyDataChange(scope) {
    const event = new CustomEvent('finsmart_datachange', { detail: { scope, timestamp: Date.now() } });
    window.dispatchEvent(event);
  }
}

// Global Singleton Instance
window.storageManager = new StorageManager();
