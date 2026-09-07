import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { formatMonthLabel } from '../../shared/formatters';
import { TrendingDown } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

export const AmortizationChart = ({ projection }) => {
  if (!projection.Months.length) return null;

  const labels = projection.Months.map((m) => formatMonthLabel(m.Month));

  const data = {
    labels,
    datasets: [
      {
        label: 'เงินต้นคงเหลือ',
        data: projection.Months.map((m) => Math.round(m.PrincipalBalance)),
        borderColor: '#f43f5e',
        backgroundColor: 'rgba(244, 63, 94, 0.12)',
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2
      },
      {
        label: 'ดอกเบี้ยค้างสะสม',
        data: projection.Months.map((m) => Math.round(m.AccruedInterestBalance)),
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.12)',
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
        tension: 0.2
      },
      {
        label: 'กองฉุกเฉิน',
        data: projection.Months.map((m) => Math.round(m.EmergencyFundBalance)),
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.10)',
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
        borderDash: [5, 4],
        tension: 0.2
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
      y: {
        ticks: {
          font: { size: 10 },
          callback: (v) => `${(v / 1000).toLocaleString('th-TH')}k`
        }
      }
    }
  };

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">
            <TrendingDown size={18} />
            <span>เส้นทางลดหนี้ (Amortization)</span>
          </div>
          <div className="card-subtitle">
            เงินต้นจะยังไม่ลงจนกว่าดอกเบี้ยค้างจะถูกล้างหมดก่อน
          </div>
        </div>
      </div>

      <div style={{ height: '320px' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};
