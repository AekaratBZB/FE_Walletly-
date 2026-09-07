import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { formatCurrency, formatMonthLabel } from '../../shared/formatters';
import { Utensils } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  LineController,
  Tooltip,
  Legend
);

/**
 * The discretionary ceiling: the spend level at which the debt stops shrinking.
 * It is a LIMIT, not a target, and is labelled that way. The ceiling rises in
 * steps as installment plans expire, which is the point of showing it.
 */
export const CeilingPanel = ({ projection, budgetProfile }) => {
  if (!projection.Months.length) return null;

  const shown = projection.Months.slice(0, 36);
  const budget = Number(budgetProfile.discretionaryBudget) || 0;
  const first = shown[0];
  const breathingRoom = first.DiscretionaryCeiling - budget;
  const roundedBreathingRoom = Math.round(breathingRoom);

  const data = {
    labels: shown.map((m) => formatMonthLabel(m.Month)),
    datasets: [
      {
        type: 'bar',
        label: 'เพดานงบกินใช้ (ขีดจำกัด)',
        data: shown.map((m) => Math.round(m.DiscretionaryCeiling)),
        backgroundColor: 'rgba(56, 189, 248, 0.45)',
        borderColor: '#0ea5e9',
        borderWidth: 1
      },
      {
        type: 'line',
        label: 'งบกินใช้ที่ตั้งไว้',
        data: shown.map(() => Math.round(budget)),
        borderColor: '#f43f5e',
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 0,
        fill: false
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) =>
            `${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString('th-TH')} ฿`
        }
      }
    },
    scales: {
      x: { ticks: { maxTicksLimit: 12, font: { size: 10 } }, grid: { display: false } },
      y: { ticks: { font: { size: 10 } } }
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <Utensils size={18} />
            <span>เพดานงบกินใช้รายเดือน</span>
          </div>
          <div className="card-subtitle">
            เพดานนี้เป็น <b>ขีดจำกัด ไม่ใช่เป้า</b> — ใช้เกินเส้นนี้เดือนไหน หนี้เดือนนั้นโต
            และเพดานจะขึ้นเป็นขั้นบันไดทุกครั้งที่ผ่อนก้อนหนึ่งหมดงวด
          </div>
        </div>
      </div>

      <div
        className="mb-3 p-3"
        style={{
          background: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-color)'
        }}
      >
        <div className="text-xs text-muted">ช่องว่างหายใจเดือนนี้ (Breathing Room)</div>
        <div
          className={`font-bold text-lg num-font ${
            roundedBreathingRoom >= 0 ? 'text-success' : 'text-danger'
          }`}
        >
          {roundedBreathingRoom >= 0 ? '+' : '-'}
          {formatCurrency(Math.abs(roundedBreathingRoom))}
        </div>
        <div className="text-xs text-subtle">
          {roundedBreathingRoom >= 0
            ? 'ยังใช้จ่ายได้ต่ำกว่าเพดาน หนี้เดือนนี้จึงลดลง'
            : 'ใช้จ่ายเกินเพดาน หนี้เดือนนี้จะโตขึ้น ไม่ลด'}
        </div>
      </div>

      <div style={{ height: '300px' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};
