/**
 * FinSmart Thai - Fixed Cost Module
 * Manages monthly fixed recurring expenses, due dates, paid status, and burden ratio.
 */

const FixedCostModule = {
  categories: [
    'ที่อยู่อาศัย (ผ่อนบ้าน/คอนโด/ค่าเช่า)',
    'ยานพาหนะ (ค่างวดรถ/ประกันรถ)',
    'สาธารณูปโภค (เน็ต/มือถือ/ค่าน้ำไฟ)',
    'ประกัน (ชีวิต/สุขภาพ/โรคร้าย)',
    'Subscriptions (สตรีมมิ่ง/คลาวด์/สมาชิก)',
    'ครอบครัว (ให้พ่อแม่/ค่าเทอมลูก)',
    'ชำระหนี้สิน (บัตรเครดิต/สินเชื่อบุคคล)',
    'อื่นๆ'
  ],

  init() {
    this.bindEvents();
    this.renderCategoryOptions();
    this.renderFixedCosts();
  },

  bindEvents() {
    const fcForm = document.getElementById('add-fixed-cost-form');
    if (fcForm) {
      fcForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleAddFixedCostSubmit();
      });
    }

    // Storage listener
    window.storageManager.onDataChange((detail) => {
      if (detail.scope === 'fixedCosts' || detail.scope === 'all' || detail.scope === 'allocation') {
        this.renderFixedCosts();
      }
    });
  },

  renderCategoryOptions() {
    const select = document.getElementById('fc-category-select');
    if (!select) return;
    select.innerHTML = this.categories.map(c => `<option value="${c}">${c}</option>`).join('');
  },

  handleAddFixedCostSubmit() {
    const title = document.getElementById('fc-title-input').value.trim();
    const amount = parseFloat(document.getElementById('fc-amount-input').value);
    const category = document.getElementById('fc-category-select').value;
    const dueDay = parseInt(document.getElementById('fc-due-day-input').value, 10);
    const autoDeduct = document.getElementById('fc-autodeduct-input').checked;
    const note = document.getElementById('fc-note-input').value.trim();

    if (!title || !amount || amount <= 0) {
      window.app.showToast('กรุณากรอกชื่อรายการและจำนวนเงินให้ถูกต้อง', 'danger');
      return;
    }

    const newCost = {
      title,
      category,
      amount,
      dueDay: dueDay >= 1 && dueDay <= 31 ? dueDay : 1,
      isPaid: false,
      autoDeduct,
      note
    };

    window.storageManager.addFixedCost(newCost);
    window.app.closeModal('add-fixed-cost-modal');
    window.app.showToast(`เพิ่มฟิกคอส "${title}" จำนวน ${amount.toLocaleString()} ฿ เรียบร้อยแล้ว`, 'success');

    document.getElementById('add-fixed-cost-form').reset();
  },

  renderFixedCosts() {
    const container = document.getElementById('fixed-costs-table-body');
    const totalEl = document.getElementById('fc-total-amount');
    const paidEl = document.getElementById('fc-paid-amount');
    const unpaidEl = document.getElementById('fc-unpaid-amount');
    const ratioEl = document.getElementById('fc-income-ratio');

    const costs = window.storageManager.getFixedCosts();
    const alloc = window.storageManager.getAllocationSettings();
    const monthlyIncome = alloc.monthlyIncome || 50000;

    // Calculate Totals
    const totalAmount = costs.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const paidAmount = costs.filter(c => c.isPaid).reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const unpaidAmount = totalAmount - paidAmount;
    const burdenRatio = monthlyIncome > 0 ? (totalAmount / monthlyIncome) * 100 : 0;

    if (totalEl) totalEl.textContent = `${totalAmount.toLocaleString()} ฿`;
    if (paidEl) paidEl.textContent = `${paidAmount.toLocaleString()} ฿`;
    if (unpaidEl) unpaidEl.textContent = `${unpaidAmount.toLocaleString()} ฿`;
    if (ratioEl) {
      ratioEl.textContent = `${burdenRatio.toFixed(1)}%`;
      if (burdenRatio > 50) {
        ratioEl.className = 'stat-value num-font text-danger';
      } else if (burdenRatio > 40) {
        ratioEl.className = 'stat-value num-font text-warning';
      } else {
        ratioEl.className = 'stat-value num-font text-success';
      }
    }

    if (!container) return;

    if (costs.length === 0) {
      container.innerHTML = `
        <tr>
          <td colspan="7" class="text-center" style="padding: 2.5rem 1rem; color: var(--text-muted);">
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">📅</div>
            <div style="font-weight: 500;">ยังไม่มีรายการฟิกคอสประจำเดือน</div>
            <div style="font-size: 0.8rem;">กดปุ่ม "+ เพิ่มฟิกคอส" เพื่อบันทึกค่าใช้จ่ายคงที่ของคุณ</div>
          </td>
        </tr>
      `;
      return;
    }

    // Sort by Due Day
    const sorted = [...costs].sort((a, b) => (a.dueDay || 1) - (b.dueDay || 1));

    container.innerHTML = sorted.map(c => {
      const statusBadge = c.isPaid
        ? '<span class="badge badge-paid">✓ ชำระแล้ว</span>'
        : '<span class="badge badge-unpaid">⏳ รอชำระ</span>';

      const autoDeductBadge = c.autoDeduct
        ? '<span style="font-size: 0.75rem; background: var(--bg-subtle); padding: 2px 6px; border-radius: 4px; color: var(--text-muted);">หักอัตโนมัติ</span>'
        : '';

      return `
        <tr style="${c.isPaid ? 'opacity: 0.75;' : ''}">
          <td class="text-center">
            <input type="checkbox" ${c.isPaid ? 'checked' : ''} onchange="FixedCostModule.togglePaid('${c.id}')" style="cursor: pointer; width: 16px; height: 16px; accent-color: var(--primary);">
          </td>
          <td class="num-font font-semibold" style="font-size: 0.9rem;">
            ทุกวันที่ ${c.dueDay}
          </td>
          <td>
            <div style="font-weight: 600; color: var(--text-main);">${c.title}</div>
            <div style="font-size: 0.75rem; color: var(--text-muted);">${c.note || ''} ${autoDeductBadge}</div>
          </td>
          <td>
            <span style="font-size: 0.8rem; background: var(--bg-subtle); padding: 3px 8px; border-radius: 4px; border: 1px solid var(--border-light);">
              ${c.category}
            </span>
          </td>
          <td class="text-right num-font font-bold" style="color: var(--text-main);">
            ${Number(c.amount).toLocaleString('th-TH', { minimumFractionDigits: 2 })} ฿
          </td>
          <td class="text-center">${statusBadge}</td>
          <td class="text-right">
            <button class="btn btn-ghost btn-sm" onclick="FixedCostModule.handleDelete('${c.id}')" title="ลบรายการ" style="color: var(--danger);">
              🗑️
            </button>
          </td>
        </tr>
      `;
    }).join('');
  },

  togglePaid(id) {
    window.storageManager.toggleFixedCostPaid(id);
    const costs = window.storageManager.getFixedCosts();
    const item = costs.find(c => c.id === id);
    if (item) {
      window.app.showToast(item.isPaid ? `ทำเครื่องหมาย "${item.title}" ชำระแล้ว` : `ยกเลิกสถานะชำระ "${item.title}"`, 'info');
    }
  },

  handleDelete(id) {
    if (confirm('คุณต้องการลบรายการฟิกคอสนี้ใช่หรือไม่?')) {
      window.storageManager.deleteFixedCost(id);
      window.app.showToast('ลบรายการฟิกคอสเรียบร้อยแล้ว', 'info');
    }
  },

  resetAllStatus() {
    if (confirm('ต้องการรีเซ็ตสถานะการชำระเงินของทุกรายการเป็น "รอชำระ" สำหรับเริ่มต้นเดือนใหม่หรือไม่?')) {
      const costs = window.storageManager.getFixedCosts().map(c => ({ ...c, isPaid: false }));
      window.storageManager.saveFixedCosts(costs);
      window.app.showToast('รีเซ็ตสถานะรอบเดือนใหม่เรียบร้อยแล้ว', 'success');
    }
  }
};

window.FixedCostModule = FixedCostModule;
