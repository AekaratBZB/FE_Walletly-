/**
 * FinSmart Thai - Thai Personal Income Tax Calculator (ภ.ง.ด. 90 / 91)
 * Up to date with Thai Revenue Department tax brackets and allowable deductions.
 */

const TaxModule = {
  brackets: [
    { min: 0, max: 150000, rate: 0.00, label: '0 - 150,000 บาท (0% ได้รับยกเว้น)' },
    { min: 150000, max: 300000, rate: 0.05, label: '150,001 - 300,000 บาท (5%)' },
    { min: 300000, max: 500000, rate: 0.10, label: '300,001 - 500,000 บาท (10%)' },
    { min: 500000, max: 750000, rate: 0.15, label: '500,001 - 750,000 บาท (15%)' },
    { min: 750000, max: 1000000, rate: 0.20, label: '750,001 - 1,000,000 บาท (20%)' },
    { min: 1000000, max: 2000000, rate: 0.25, label: '1,000,001 - 2,000,000 บาท (25%)' },
    { min: 2000000, max: 5000000, rate: 0.30, label: '2,000,001 - 5,000,000 บาท (30%)' },
    { min: 5000000, max: Infinity, rate: 0.35, label: 'เกิน 5,000,000 บาทขึ้นไป (35%)' }
  ],

  init() {
    this.populateFormFromStorage();
    this.bindEvents();
    this.calculateTax();
  },

  bindEvents() {
    const form = document.getElementById('tax-calculator-form');
    if (form) {
      form.addEventListener('input', () => {
        this.saveFormToStorage();
        this.calculateTax();
      });
    }

    const resetBtn = document.getElementById('tax-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('ต้องการรีเซ็ตค่าคำนวณภาษีเป็นค่าเริ่มต้นหรือไม่?')) {
          window.storageManager.saveTaxSettings(DEMO_DATA.taxSettings);
          this.populateFormFromStorage();
          this.calculateTax();
          window.app.showToast('รีเซ็ตแบบฟอร์มภาษีเรียบร้อยแล้ว', 'info');
        }
      });
    }
  },

  populateFormFromStorage() {
    const s = window.storageManager.getTaxSettings();
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.value = val !== undefined ? val : 0;
    };

    setVal('tax-salary', s.annualSalary || 0);
    setVal('tax-bonus', s.annualBonus || 0);
    setVal('tax-freelance', s.freelanceIncome || 0);
    setVal('tax-social-security', s.socialSecurity || 9000);
    setVal('tax-parents', s.parentCount || 0);
    setVal('tax-children', s.childCount || 0);
    setVal('tax-life-insurance', s.lifeInsurance || 0);
    setVal('tax-health-insurance', s.healthInsurance || 0);
    setVal('tax-pvd', s.providentFund || 0);
    setVal('tax-ssf', s.ssfAmount || 0);
    setVal('tax-rmf', s.rmfAmount || 0);
    setVal('tax-thaiesg', s.thaiEsgAmount || 0);
    setVal('tax-mortgage', s.mortgageInterest || 0);
    setVal('tax-easy-receipt', s.easyReceipt || 0);
    setVal('tax-donation', s.donationGeneral || 0);
    setVal('tax-withholding', s.withholdingTax || 0);
  },

  saveFormToStorage() {
    const getVal = (id) => parseFloat(document.getElementById(id)?.value) || 0;

    const s = {
      annualSalary: getVal('tax-salary'),
      annualBonus: getVal('tax-bonus'),
      freelanceIncome: getVal('tax-freelance'),
      socialSecurity: getVal('tax-social-security'),
      parentCount: parseInt(document.getElementById('tax-parents')?.value || '0', 10),
      childCount: parseInt(document.getElementById('tax-children')?.value || '0', 10),
      lifeInsurance: getVal('tax-life-insurance'),
      healthInsurance: getVal('tax-health-insurance'),
      providentFund: getVal('tax-pvd'),
      ssfAmount: getVal('tax-ssf'),
      rmfAmount: getVal('tax-rmf'),
      thaiEsgAmount: getVal('tax-thaiesg'),
      mortgageInterest: getVal('tax-mortgage'),
      easyReceipt: getVal('tax-easy-receipt'),
      donationGeneral: getVal('tax-donation'),
      withholdingTax: getVal('tax-withholding')
    };

    window.storageManager.saveTaxSettings(s);
  },

  calculateTax() {
    const s = window.storageManager.getTaxSettings();

    // 1. Total Income
    const grossIncome = (s.annualSalary || 0) + (s.annualBonus || 0) + (s.freelanceIncome || 0);

    // 2. Standard Expense Deduction (50% of 40(1)+40(2), Max 100,000 THB)
    const expenseDeduction = Math.min(100000, grossIncome * 0.5);

    // 3. Deductions & Allowances
    const personalAllowance = 60000;
    const parentAllowance = Math.min(120000, (s.parentCount || 0) * 30000);
    const childAllowance = (s.childCount || 0) * 30000;
    const socialSecurityDeduction = Math.min(9000, s.socialSecurity || 0);

    // Life & Health Insurance (Combined max 100,000 THB, health max 25,000 THB)
    const validHealth = Math.min(25000, s.healthInsurance || 0);
    const validLife = s.lifeInsurance || 0;
    const totalInsuranceDeduction = Math.min(100000, validLife + validHealth);

    // Retirement Group (SSF, RMF, PVD combined max 500,000 THB)
    const validSSF = Math.min(200000, Math.min(grossIncome * 0.3, s.ssfAmount || 0));
    const validRMF = Math.min(500000, Math.min(grossIncome * 0.3, s.rmfAmount || 0));
    const validPVD = Math.min(500000, Math.min(grossIncome * 0.15, s.providentFund || 0));
    const retirementGroupTotal = Math.min(500000, validSSF + validRMF + validPVD);

    // ThaiESG (Separate quota: max 300,000 THB and <= 30% of income)
    const validThaiESG = Math.min(300000, Math.min(grossIncome * 0.3, s.thaiEsgAmount || 0));

    // Mortgage Interest (Max 100,000 THB)
    const validMortgage = Math.min(100000, s.mortgageInterest || 0);

    // Easy E-Receipt (Max 50,000 THB)
    const validEasyReceipt = Math.min(50000, s.easyReceipt || 0);

    // Total Allowances before donation
    const subtotalAllowances = personalAllowance + parentAllowance + childAllowance +
      socialSecurityDeduction + totalInsuranceDeduction + retirementGroupTotal +
      validThaiESG + validMortgage + validEasyReceipt;

    // Income before donation
    const incomeBeforeDonation = Math.max(0, grossIncome - expenseDeduction - subtotalAllowances);

    // Donations (Max 10% of income after deductions)
    const maxDonationAllowed = incomeBeforeDonation * 0.10;
    const validDonation = Math.min(maxDonationAllowed, s.donationGeneral || 0);

    const totalAllowances = subtotalAllowances + validDonation;

    // 4. Net Taxable Income (เงินได้สุทธิ)
    const netTaxableIncome = Math.max(0, grossIncome - expenseDeduction - totalAllowances);

    // 5. Progressive Tax Calculation
    let totalTaxPayable = 0;
    let bracketBreakdowns = [];

    for (const b of this.brackets) {
      if (netTaxableIncome > b.min) {
        const taxableInThisBracket = Math.min(netTaxableIncome, b.max) - b.min;
        const taxInThisBracket = taxableInThisBracket * b.rate;
        totalTaxPayable += taxInThisBracket;

        bracketBreakdowns.push({
          label: b.label,
          rate: (b.rate * 100) + '%',
          amountInBracket: taxableInThisBracket,
          tax: taxInThisBracket,
          isActive: true
        });
      } else {
        bracketBreakdowns.push({
          label: b.label,
          rate: (b.rate * 100) + '%',
          amountInBracket: 0,
          tax: 0,
          isActive: false
        });
      }
    }

    // 6. Withholding Tax Offset & Final Result
    const withholdingTax = s.withholdingTax || 0;
    const finalDifference = withholdingTax - totalTaxPayable; // >0 is refund, <0 is due
    const effectiveTaxRate = grossIncome > 0 ? (totalTaxPayable / grossIncome) * 100 : 0;

    // Update UI Elements
    this.updateTaxUI({
      grossIncome,
      expenseDeduction,
      totalAllowances,
      netTaxableIncome,
      totalTaxPayable,
      withholdingTax,
      finalDifference,
      effectiveTaxRate,
      bracketBreakdowns
    });
  },

  updateTaxUI(res) {
    const grossEl = document.getElementById('tax-res-gross');
    const expEl = document.getElementById('tax-res-expenses');
    const allowEl = document.getElementById('tax-res-allowances');
    const netEl = document.getElementById('tax-res-net');
    const taxTotalEl = document.getElementById('tax-res-total-tax');
    const effRateEl = document.getElementById('tax-res-effective-rate');
    const finalDiffEl = document.getElementById('tax-res-final-diff');
    const finalDiffBadge = document.getElementById('tax-res-final-badge');
    const bracketTbody = document.getElementById('tax-bracket-breakdown-body');

    if (grossEl) grossEl.textContent = `${Math.round(res.grossIncome).toLocaleString()} ฿`;
    if (expEl) expEl.textContent = `-${Math.round(res.expenseDeduction).toLocaleString()} ฿`;
    if (allowEl) allowEl.textContent = `-${Math.round(res.totalAllowances).toLocaleString()} ฿`;
    if (netEl) netEl.textContent = `${Math.round(res.netTaxableIncome).toLocaleString()} ฿`;
    if (taxTotalEl) taxTotalEl.textContent = `${Math.round(res.totalTaxPayable).toLocaleString()} ฿`;
    if (effRateEl) effRateEl.textContent = `${res.effectiveTaxRate.toFixed(2)}%`;

    if (finalDiffEl && finalDiffBadge) {
      if (res.finalDifference >= 0) {
        finalDiffBadge.className = 'badge badge-income';
        finalDiffBadge.textContent = '🎉 ได้รับเงินคืนภาษี (Tax Refund)';
        finalDiffEl.textContent = `+${Math.round(res.finalDifference).toLocaleString()} ฿`;
        finalDiffEl.className = 'stat-value num-font text-success';
      } else {
        finalDiffBadge.className = 'badge badge-expense';
        finalDiffBadge.textContent = '⚠️ ต้องชำระภาษีเพิ่ม (Tax Due)';
        finalDiffEl.textContent = `-${Math.round(Math.abs(res.finalDifference)).toLocaleString()} ฿`;
        finalDiffEl.className = 'stat-value num-font text-danger';
      }
    }

    // Render Bracket Breakdown Rows
    if (bracketTbody) {
      bracketTbody.innerHTML = res.bracketBreakdowns.map(b => `
        <div class="tax-tier-row ${b.isActive ? 'active-tier' : ''}">
          <div style="flex: 2;">
            <div>${b.label}</div>
          </div>
          <div style="flex: 1; text-align: right;" class="num-font text-muted">
            ${b.amountInBracket > 0 ? b.amountInBracket.toLocaleString() + ' ฿' : '-'}
          </div>
          <div style="flex: 1; text-align: right;" class="num-font font-bold ${b.tax > 0 ? 'text-danger' : 'text-muted'}">
            ${b.tax > 0 ? b.tax.toLocaleString() + ' ฿' : '0 ฿'}
          </div>
        </div>
      `).join('');
    }
  }
};

window.TaxModule = TaxModule;
