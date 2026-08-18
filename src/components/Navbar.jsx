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
  { id: 'dashboard', label: 'ภาพรวม', icon: LayoutDashboard },
  { id: 'transactions', label: 'รายรับ-รายจ่าย', icon: ReceiptText },
  { id: 'fixed-costs', label: 'ฟิกคอสรายเดือน', icon: CalendarCheck },
  { id: 'projection', label: 'คำนวณเงินล่วงหน้า', icon: TrendingUp },
  { id: 'allocation', label: 'แบ่งสัดส่วน %', icon: PieChart },
  { id: 'savings', label: 'วางแผนการออม', icon: Target },
  { id: 'tax', label: 'คำนวณภาษี', icon: FileSpreadsheet },
  { id: 'reports', label: 'รีพอร์ต & ข้อมูล', icon: BarChart3 }
];

export const Navbar = () => {
  const { activeTab, setActiveTab, setIsAddTxOpen } = useWallet();

  return (
    <header className="top-header">
      <div className="navbar">
        {/* Brand Logo */}
        <div className="brand-logo" onClick={() => setActiveTab('dashboard')}>
          <div className="brand-icon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div>
            <span>Walletly</span>
            <span className="brand-badge">Smart Financial OS</span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-tabs-wrapper">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`nav-tab-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(tab.id);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

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
