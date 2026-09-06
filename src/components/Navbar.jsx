import React from 'react';
import { useWallet } from '../context/WalletContext';
import {
  LayoutDashboard,
  ReceiptText,
  CalendarCheck,
  TrendingUp,
  PieChart,
  Target,
  FileSpreadsheet,
  BarChart3,
  Plus
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'ภาพรวม', fullLabel: 'ภาพรวมการเงิน', icon: LayoutDashboard },
  { id: 'transactions', label: 'รายรับ-จ่าย', fullLabel: 'บันทึกรายรับ-รายจ่าย', icon: ReceiptText },
  { id: 'fixed-costs', label: 'ฟิกคอส', fullLabel: 'ฟิกคอสรายเดือน', icon: CalendarCheck },
  { id: 'projection', label: 'คาดการณ์เงิน', fullLabel: 'คาดการณ์กระแสเงินล่วงหน้า', icon: TrendingUp },
  { id: 'allocation', label: 'แบ่งสัดส่วน', fullLabel: 'แบ่งสัดส่วนการเงิน 50/30/20', icon: PieChart },
  { id: 'savings', label: 'แผนการออม', fullLabel: 'วางแผนเป้าหมายการออม', icon: Target },
  { id: 'tax', label: 'คำนวณภาษี', fullLabel: 'วางแผนและคำนวณภาษีบุคคล', icon: FileSpreadsheet },
  { id: 'reports', label: 'รายงาน', fullLabel: 'รายงานและสรุปข้อมูลการเงิน', icon: BarChart3 }
];

export const Navbar = () => {
  const { activeTab, setActiveTab, setIsAddTxOpen } = useWallet();

  return (
    <header className="top-header">
      <div className="navbar">
        {/* Modern FinTech Brand Logo */}
        <div className="brand-logo" onClick={() => setActiveTab('dashboard')} role="button" tabIndex={0} title="Walletly - กลับสู่หน้าหลัก">
          <div className="brand-icon-wrapper">
            <div className="brand-icon">
              <svg
                width="24"
                height="24"
                viewBox="0 0 32 32"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="brand-svg"
              >
                <defs>
                  <linearGradient id="brandCyan" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#38bdf8" />
                    <stop offset="100%" stopColor="#818cf8" />
                  </linearGradient>
                  <linearGradient id="brandLight" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
                  </linearGradient>
                </defs>

                {/* Card / Vault Background Plate */}
                <rect
                  x="3.5"
                  y="5"
                  width="25"
                  height="22"
                  rx="6.5"
                  fill="rgba(255, 255, 255, 0.14)"
                  stroke="rgba(255, 255, 255, 0.3)"
                  strokeWidth="1.2"
                />

                {/* Glass sheen highlight */}
                <rect x="3.5" y="5" width="25" height="11" rx="6" fill="url(#brandLight)" />

                {/* Digital Card Chip Detail */}
                <rect x="7" y="8.5" width="4.5" height="3.5" rx="1" fill="#34d399" opacity="0.9" />

                {/* Dynamic Ascending W & Growth Trend */}
                <path
                  d="M8 18L12 23L16 16.5L20 23L24.5 12"
                  stroke="#ffffff"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Accent Arrow Head on Top Right */}
                <path
                  d="M20.5 12H24.5V16"
                  stroke="#38bdf8"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Glowing Growth Spark */}
                <circle cx="24.5" cy="12" r="1.8" fill="#67e8f9" />
              </svg>
            </div>
            <div className="brand-icon-glow" aria-hidden="true" />
          </div>

          <div className="brand-text-block">
            <div className="brand-title-wrap">
              <span className="brand-name">
                Wallet<span className="brand-accent">ly</span>
              </span>
              <span className="brand-chip">
                <span className="brand-chip-dot" />
                <span>Smart FinOS</span>
              </span>
            </div>
            <span className="brand-subtext">INTELLIGENT WEALTH OS</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs-container">
          <nav className="nav-tabs-wrapper">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                  title={tab.fullLabel || tab.label}
                  onClick={(e) => {
                    setActiveTab(tab.id);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Quick Action Button */}
        <div className="header-actions">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddTxOpen(true)}
          >
            <Plus size={16} />
            <span>บันทึกรายการ</span>
          </button>
        </div>
      </div>
    </header>
  );
};
