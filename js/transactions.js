/**
 * FinSmart Thai - Transactions Module
 * Manages daily Income, Expense, Fixed Cost, and Savings records.
 */

const TransactionModule = {
  categories: {
    income: ['เงินเดือน (Salary)', 'โบนัส (Bonus)', 'รายได้เสริม (Freelance)', 'กำไร/ปันผลลงทุน', 'ขายของออนไลน์', 'อื่นๆ'],
    expense: ['อาหารและเครื่องดื่ม', 'ช้อปปิ้งและของใช้', 'การเดินทาง/น้ำมัน', 'บิลค่าน้ำค่าไฟ', 'บันเทิงและสันทนาการ', 'สุขภาพและยารักษาโรค', 'การศึกษา/คอร์สเรียน', 'ของขวัญ/ทำบุญ', 'อื่นๆ'],
    fixed: ['ที่อยู่อาศัย (ผ่อนคอนโด/บ้าน/ค่าเช่า)', 'ยานพาหนะ (ค่างวดรถ)', 'ค่าอินเทอร์เน็ต/มือถือ', 'เบี้ยประกันชีวิต/สุขภาพ', 'เงินให้ครอบครัว', 'Subscriptions'],
    savings: ['กองทุนสำรองฉุกเฉิน', 'ลงทุน DCA (หุ้น/กองทุน)', 'เงินฝากประจำ/ดิจิทัล', 'ทองคำ/สินทรัพย์ทางเลือก', 'เป้าหมายระยะสั้น']
  },

  paymentMethods: ['โอนผ่านธนาคาร', 'สแกน QR', 'เงินสด', 'บัตรเครดิต', 'บัตรเดบิต', 'e-Wallet (TrueMoney/ShopeePay)'],

  init() {
    this.bindEvents();
    this.renderCategoryOptions('expense');
    this.renderPaymentMethodOptions();
    this.renderTransactionsList();
  },

  bindEvents() {
    // Transaction Type Radio Change in Modal
    const typeRadios = document.querySelectorAll('input[name="tx-type"]');
    typeRadios.forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.renderCategoryOptions(e.target.value);
      });
    });

    // Filter Controls
    const searchInput = document.getElementById('tx-search');
    const typeFilter = document.getElementById('tx-filter-type');
    if (searchInput) searchInput.addEventListener('input', () => this.renderTransactionsList());
    if (typeFilter) typeFilter.addEventListener('change', () => this.renderTransactionsList());

    // New Transaction Form Submission
    const txForm = document.getElementById('add-transaction-form');
    if (txForm) {
      txForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddTransactionSubmit();
      });
    }

    // Storage listener to refresh list
    window.storageManager.onDataChange((detail) => {
      if (detail.scope === 'transactions' || detail.scope === 'all') {
        this.renderTransactionsList();
      }
    });
  },

  renderCategoryOptions(type) {
    const select = document.getElementById('tx-category-select');
    if (!select) return;
    const cats = this.categories[type] || this.categories.expense;
    select.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
  },

  renderPaymentMethodOptions() {
    const select = document.getElementById('tx-payment-select');
    if (!select) return;
    select.innerHTML = this.paymentMethods.map(m => `<option value="${m}">${m}</option>`).join('');
  },

  handleAddTransactionSubmit() {
    const type = document.querySelector('input[name="tx-type"]:checked')?.value || 'expense';
    const amount = parseFloat(document.getElementById('tx-amount-input').value);
    const category = document.getElementById('tx-category-select').value;
    const date = document.getElementById('tx-date-input').value || new Date().toISOString().slice(0, 10);
    const paymentMethod = document.getElementById('tx-payment-select').value;
    const note = document.getElementById('tx-note-input').value.trim();

    if (!amount || amount <= 0) {
      window.app.showToast('กรุณากรอกจำนวนเงินให้ถูกต้อง', 'danger');
      return;
    }

    const newTx = {
      date,
      type,
      category,
      amount,
      paymentMethod,
      note
    };

    window.storageManager.addTransaction(newTx);
    window.app.closeModal('add-transaction-modal');
    window.app.showToast(`บันทึกรายการ "${category}" จำนวน ${amount.toLocaleString()} บาท เรียบร้อยแล้ว`, 'success');

    // Reset Form
    document.getElementById('add-transaction-form').reset();
    document.getElementById('tx-date-input').value = new Date().toISOString().slice(0, 10);
  },

  renderTransactionsList() {
    const container = document.getElementById('transactions-table-body');
    if (!container) return;

    const txs = window.storageManager.getTransactions();
    const search = document.getElementById('tx-search')?.value?.toLowerCase() || '';
    const filterType = document.getElementById('tx-filter-type')?.value || 'all';

    // Apply Filter
    let filtered = txs.filter(t => {
      const matchType = filterType === 'all' || t.type === filterType;
      const matchSearch = (t.category || '').toLowerCase().includes(search) ||
                          (t.note || '').toLowerCase().includes(search) ||
                          (t.paymentMethod || '').toLowerCase().includes(search);
      return matchType && matchSearch;
    });

    if (filtered.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="6" class="text-center" style="padding: 2.5rem 1rem; color: var(--text-muted);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📄</div>
            <div style="font-weight: 500;">ไม่พบรายการธุรกรรม</div>
            <div style="font-size: 0.8rem;">กดปุ่ม "+ บันทึกรายการ" เพื่อเริ่มต้นบันทึก</div>
          </td>
        </tr>
      `;
      return;
    }

    // Format & Render Rows
    container.innerHTML = filtered.map(t => {
      let typeBadge = '';
      let amountFormatted = '';
      let amountClass = '';

      if (t.type === 'income') {
        typeBadge = '<span class="badge badge-income">รายรับ</span>';
        amountFormatted = `+${Number(t.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
        amountClass = 'text-success font-semibold num-font';
      } else if (t.type === 'fixed') {
        typeBadge = '<span class="badge badge-fixed">ฟิกคอส</span>';
        amountFormatted = `-${Number(t.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
        amountClass = 'text-warning font-semibold num-font';
      } else if (t.type === 'savings') {
        typeBadge = '<span class="badge badge-savings">ออม/ลงทุน</span>';
        amountFormatted = `-${Number(t.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
        amountClass = 'text-info font-semibold num-font';
      } else {
        typeBadge = '<span class="badge badge-expense">รายจ่าย</span>';
        amountFormatted = `-${Number(t.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })}`;
        amountClass = 'text-danger font-semibold num-font';
      }

      return `
        <tr>
          <td style="white-space: nowrap; font-size: 0.85rem;" class="num-font">${t.date}</td>
          <td>${typeBadge}</td>
          <td style="font-weight: 500;">${t.category}</td>
          <td>
            <span style="font-size: 0.8rem; background: var(--bg-subtle); padding: 2px 8px; border-radius: 4px; border: 1px solid var(--border-light);">
              ${t.paymentMethod || 'ไม่ระบุ'}
            </span>
          </td>
          <td class="text-right ${amountClass}">${amountFormatted} ฿</td>
          <td class="text-right" style="white-space: nowrap;">
            <button class="btn btn-ghost btn-sm" onclick="TransactionModule.handleDelete('${t.id}')" title="ลบรายการ" style="color: var(--danger);">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  handleDelete(id) {
    if (confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) {
      window.storageManager.deleteTransaction(id);
      window.app.showToast('ลบรายการเรียบร้อยแล้ว', 'info');
    }
  }
};

window.TransactionModule = TransactionModule;
