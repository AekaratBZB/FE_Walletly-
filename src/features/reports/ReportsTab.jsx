import React, { useRef } from 'react';
import { useWallet } from '../../context/WalletContext';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
} from 'chart.js';
import { Doughnut, Bar, Pie } from 'react-chartjs-2';
import {
  Download,
  Upload,
  RotateCcw,
  Trash2,
  FileSpreadsheet,
  PieChart as PieIcon,
  BarChart2
} from 'lucide-react';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export const ReportsTab = () => {
  const {
    transactions,
    fixedCosts,
    exportTransactionsCSV,
    exportBackupJSON,
    importBackupJSON,
    resetToDemo,
    clearAllData
  } = useWallet();

  const fileInputRef = useRef(null);

  // 1. Doughnut Chart: Category Breakdown
  const categoryTotals = {};
  transactions.filter(t => t.type === 'expense').forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + (Number(t.amount) || 0);
  });
  fixedCosts.forEach(fc => {
    const key = `ฟิกคอส: ${fc.title}`;
    categoryTotals[key] = (categoryTotals[key] || 0) + (Number(fc.amount) || 0);
  });

  const doughnutLabels = Object.keys(categoryTotals);
  const doughnutDataValues = Object.values(categoryTotals);

  const colors = [
    '#059669', '#3b82f6', '#8b5cf6', '#f59e0b', '#f43f5e',
    '#10b981', '#0ea5e9', '#ec4899', '#6366f1', '#14b8a6'
  ];

  const categoryChartData = {
    labels: doughnutLabels.length > 0 ? doughnutLabels : ['ไม่มีข้อมูล'],
    datasets: [
      {
        data: doughnutDataValues.length > 0 ? doughnutDataValues : [1],
        backgroundColor: doughnutLabels.length > 0 ? colors.slice(0, doughnutLabels.length) : ['#e2e8f0'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  // 2. Bar Chart: Cash Flow Breakdown
  const totalFixedCosts = fixedCosts.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalVariable = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const totalSavings = transactions.filter(t => t.type === 'savings').reduce((s, t) => s + (Number(t.amount) || 0), 0);
  const netCashflow = totalIncome - totalFixedCosts - totalVariable - totalSavings;

  const barChartData = {
    labels: ['รายรับรวม', 'ฟิกคอสคงที่', 'รายจ่ายผันแปร', 'ออม & ลงทุน', 'เงินเหลือสุทธิ'],
    datasets: [
      {
        label: 'จำนวนเงิน (บาท)',
        data: [totalIncome, totalFixedCosts, totalVariable, totalSavings, Math.max(0, netCashflow)],
        backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#059669'],
        borderRadius: 8
      }
    ]
  };

  // 3. Pie Chart: Fixed vs Variable vs Savings
  const pieChartData = {
    labels: ['ฟิกคอสคงที่', 'รายจ่ายกินใช้ผันแปร', 'เงินออม/ลงทุน'],
    datasets: [
      {
        data: [totalFixedCosts, totalVariable, totalSavings],
        backgroundColor: ['#f59e0b', '#ef4444', '#10b981'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }
    ]
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      importBackupJSON(event.target.result);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleResetDemo = () => {
    if (window.confirm('คุณต้องการโหลดข้อมูลตัวอย่าง (Demo Data) หรือไม่? ข้อมูลที่มีอยู่จะถูกเขียนทับ')) {
      resetToDemo();
    }
  };

  const handleClearAll = () => {
    if (window.confirm('⚠️ คำเตือน: คุณต้องการล้างข้อมูลทั้งหมดในระบบใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้')) {
      clearAllData();
    }
  };

  return (
    <div className="tab-panel active">
      {/* Header */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <div>
          <h2>📈 รายงานสถิติ & จัดการสำรองข้อมูล (Reports & Backup)</h2>
          <p>วิเคราะห์ภาพรวมการเงินผ่านชาร์ตสถิติ และสำรองหรือกู้คืนข้อมูลในระบบ</p>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Doughnut Chart: Expense Categories */}
        <div className="card" style={{ gridColumn: 'span 2' }}>
          <div className="card-header">
            <div>
              <div className="card-title">
                <PieIcon size={18} color="var(--primary)" />
                <span>สัดส่วนค่าใช้จ่ายจำแนกตามหมวดหมู่</span>
              </div>
              <div className="card-subtitle">รวมทั้งรายจ่ายผันแปรและฟิกคอส</div>
            </div>
          </div>
          <div style={{ height: '280px', position: 'relative' }}>
            <Doughnut
              data={categoryChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { family: 'Prompt', size: 11 } } },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` ${ctx.label}: ${(ctx.raw || 0).toLocaleString()} ฿`
                    }
                  }
                },
                cutout: '65%'
              }}
            />
          </div>
        </div>

        {/* Pie Chart: Fixed vs Variable */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">
                <PieIcon size={18} color="var(--accent-amber)" />
                <span>สัดส่วน 3 เสาหลัก</span>
              </div>
              <div className="card-subtitle">ฟิกคอส vs กินใช้ vs เงินออม</div>
            </div>
          </div>
          <div style={{ height: '280px', position: 'relative' }}>
            <Pie
              data={pieChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { font: { family: 'Prompt', size: 11 } } },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => ` ${ctx.label}: ${(ctx.raw || 0).toLocaleString()} ฿`
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Bar Chart Full Width */}
      <div className="card mb-6">
        <div className="card-header">
          <div>
            <div className="card-title">
              <BarChart2 size={18} color="var(--secondary)" />
              <span>เปรียบเทียบกระแสเงินสดรายรับ - รายจ่าย - เงินออม</span>
            </div>
            <div className="card-subtitle">ภาพรวมเม็ดเงินที่เข้ามาและจัดสรรไปในส่วนต่าง ๆ</div>
          </div>
        </div>
        <div style={{ height: '300px', position: 'relative' }}>
          <Bar
            data={barChartData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { display: false },
                tooltip: {
                  callbacks: {
                    label: (ctx) => ` ${(ctx.raw || 0).toLocaleString()} บาท`
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
            }}
          />
        </div>
      </div>

      {/* Data Management & Backup Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">💾 สำรองข้อมูล & กู้คืนระบบ (Data Management & Backup)</div>
            <div className="card-subtitle">
              ข้อมูลทั้งหมดถูกเก็บอย่างปลอดภัยบนเครื่องของคุณ (Browser LocalStorage)
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <button className="btn btn-outline" onClick={exportTransactionsCSV}>
            <FileSpreadsheet size={16} />
            <span>ส่งออกธุรกรรม (.CSV)</span>
          </button>

          <button className="btn btn-outline" onClick={exportBackupJSON}>
            <Download size={16} />
            <span>สำรองข้อมูลระบบ (.JSON)</span>
          </button>

          <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
            <Upload size={16} />
            <span>นำเข้าข้อมูล (.JSON)</span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
          </label>

          <button className="btn btn-outline" onClick={handleResetDemo}>
            <RotateCcw size={16} />
            <span>โหลด Demo Data</span>
          </button>
        </div>

        <div className="mt-4 pt-3 flex justify-between items-center" style={{ borderTop: '1px solid var(--border-light)' }}>
          <span className="text-xs text-muted">
            ต้องการล้างข้อมูลเพื่อเริ่มต้นบันทึกใหม่ทั้งหมดหรือไม่?
          </span>
          <button className="btn btn-danger btn-sm" onClick={handleClearAll}>
            <Trash2 size={14} />
            <span>ล้างข้อมูลทั้งหมด (Clear All)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
