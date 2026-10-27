import React, { useRef, useState } from 'react';
import { CHART_COLORS, CHART_PALETTE } from '../../shared/chartColors';
import { useWallet } from '../../context/WalletContext';
import { useAuth } from '../../context/AuthContext';
import { getStoredToken } from '../../shared/api';
import { getCurrentMonthPrefix } from '../../shared/formatters';
import { MemberOnly } from '../../components/MemberOnly';
import { ReportPeriodPicker } from './ReportPeriodPicker';
import { getPresetRange } from './reportPeriod';
import { useFinanceReport } from './useFinanceReport';
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
    exportTransactionsCSV,
    exportBackupJSON,
    importBackupJSON,
    resetToDemo,
    clearAllData
  } = useWallet();
  const { user } = useAuth();
  const isGuest = !!user?.isGuest;

  const fileInputRef = useRef(null);
  const isLoggedIn = !!getStoredToken();

  // ช่วงเวลา: ค่าเริ่มต้นทั้งปีปัจจุบัน ตัวเลือกด่วนคำนวณจากเดือนปัจจุบันจริงทุกครั้ง
  const [preset, setPreset] = useState('thisYear');
  const [customRange, setCustomRange] = useState(() => getPresetRange('thisYear', getCurrentMonthPrefix()));
  const range = preset === 'custom' ? customRange : getPresetRange(preset, getCurrentMonthPrefix());

  const handlePresetChange = (key) => {
    // เปิด "กำหนดเอง" ครั้งแรกเริ่มจากช่วงที่ดูอยู่
    if (key === 'custom' && preset !== 'custom') setCustomRange(range);
    setPreset(key);
  };

  // ตัวเลขทั้งหมดคำนวณที่ BE (ฟิกคอสนับแยกรายเดือนตามระยะเวลาและการติ๊กออก)
  const { report, error, isLoading, reload } = useFinanceReport(range, !isGuest);

  const totalIncome = report?.totalIncome || 0;
  const totalFixedCosts = report?.totalFixedCosts || 0;
  const totalVariable = report?.totalVariableExpense || 0;
  const totalSavings = report?.totalSavings || 0;
  const netCashflow = report?.netCashflow || 0;

  // 1. Doughnut Chart: Category Breakdown
  const breakdown = report?.expenseBreakdown || [];
  const doughnutLabels = breakdown.map(i => (i.kind === 'fixed' ? `ฟิกคอส: ${i.name}` : i.name));
  const doughnutDataValues = breakdown.map(i => Number(i.amount) || 0);

  const colors = CHART_PALETTE;

  const categoryChartData = {
    labels: doughnutLabels.length > 0 ? doughnutLabels : ['ไม่มีข้อมูล'],
    datasets: [
      {
        data: doughnutDataValues.length > 0 ? doughnutDataValues : [1],
        backgroundColor: doughnutLabels.length > 0 ? colors.slice(0, doughnutLabels.length) : [CHART_COLORS.empty],
        borderWidth: 2,
        borderColor: CHART_COLORS.surface
      }
    ]
  };

  // 2. Bar Chart: Cash Flow Breakdown
  const barChartData = {
    labels: ['รายรับรวม', 'ฟิกคอสคงที่', 'รายจ่ายผันแปร', 'ออม & ลงทุน', 'เงินเหลือสุทธิ'],
    datasets: [
      {
        label: 'จำนวนเงิน (บาท)',
        data: [totalIncome, totalFixedCosts, totalVariable, totalSavings, Math.max(0, netCashflow)],
        backgroundColor: [CHART_COLORS.income, CHART_COLORS.fixed, CHART_COLORS.expense, CHART_COLORS.savings, CHART_COLORS.net],
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
        backgroundColor: [CHART_COLORS.fixed, CHART_COLORS.expense, CHART_COLORS.savings],
        borderWidth: 2,
        borderColor: CHART_COLORS.surface
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

      {/* รายงาน (คำนวณที่ BE) — โหมดทดลองเห็นการ์ดชวนสมัคร ส่วนสำรองข้อมูลด้านล่างยังใช้ได้ */}
      <MemberOnly
        icon={BarChart2}
        title="รายงานใช้ได้เฉพาะสมาชิก"
        description="ดูสรุปรายรับ รายจ่าย และฟิกคอสแยกตามหมวดหมู่ เลือกช่วงเดือนหรือปีได้อิสระ"
      >
      <ReportPeriodPicker
        preset={preset}
        range={range}
        onPresetChange={handlePresetChange}
        onRangeChange={setCustomRange}
      />

      {error && (
        <div className="flex items-center justify-between gap-2 mb-4 text-sm text-danger">
          <span>โหลดรายงานจากเซิร์ฟเวอร์ไม่สำเร็จ</span>
          <button className="btn btn-outline btn-sm" onClick={reload}>
            <RotateCcw size={14} />
            <span>ลองอีกครั้ง</span>
          </button>
        </div>
      )}
      {isLoading && !report && <div className="text-sm text-muted mb-4">กำลังโหลดรายงาน…</div>}

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
                    // Placeholder slice when empty: no tooltip, it is not a real amount
                    enabled: doughnutLabels.length > 0,
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

      </MemberOnly>

      {/* Data Management & Backup Card */}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">💾 สำรองข้อมูล & กู้คืนระบบ (Data Management & Backup)</div>
            <div className="card-subtitle">
              {isLoggedIn
                ? 'ส่งออกหรือสำรองข้อมูลบัญชีของคุณเป็นไฟล์ CSV / JSON'
                : 'ข้อมูลทั้งหมดถูกเก็บอย่างปลอดภัยบนเครื่องของคุณ (Browser LocalStorage)'}
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

          {/* Demo data only lives locally and never syncs, so it would mix
              fake rows into a real account */}
          {!isLoggedIn && (
            <button className="btn btn-outline" onClick={handleResetDemo}>
              <RotateCcw size={16} />
              <span>โหลด Demo Data</span>
            </button>
          )}
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
