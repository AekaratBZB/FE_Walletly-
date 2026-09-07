import React from 'react';
import { useWallet } from '../context/WalletContext';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  ReceiptText,
  CalendarCheck,
  TrendingUp,
  PieChart,
  Target,
  FileSpreadsheet,
  BarChart3,
  Plus,
  Landmark,
  LogOut,
  User as UserIcon
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'ภาพรวม', fullLabel: 'ภาพรวมการเงิน', icon: LayoutDashboard },
  { id: 'transactions', label: 'รายรับ-จ่าย', fullLabel: 'บันทึกรายรับ-รายจ่าย', icon: ReceiptText },
  { id: 'fixed-costs', label: 'ฟิกคอส', fullLabel: 'ฟิกคอสรายเดือน', icon: CalendarCheck },
  { id: 'projection', label: 'คาดการณ์เงิน', fullLabel: 'คาดการณ์กระแสเงินล่วงหน้า', icon: TrendingUp },
  { id: 'debt', label: 'ปลอดหนี้', fullLabel: 'วางแผนปลอดหนี้ (Debt Payoff Planner)', icon: Landmark },
  { id: 'allocation', label: 'แบ่งสัดส่วน', fullLabel: 'แบ่งสัดส่วนการเงิน 50/30/20', icon: PieChart },
  { id: 'savings', label: 'แผนการออม', fullLabel: 'วางแผนเป้าหมายการออม', icon: Target },
  { id: 'tax', label: 'คำนวณภาษี', fullLabel: 'วางแผนและคำนวณภาษีบุคคล', icon: FileSpreadsheet },
  { id: 'reports', label: 'รายงาน', fullLabel: 'รายงานและสรุปข้อมูลการเงิน', icon: BarChart3 }
];

export const Navbar = () => {
  const { activeTab, setActiveTab, setIsAddTxOpen } = useWallet();
  const { user, logout } = useAuth();

  return (
    <header className="top-header">
      <div className="navbar">
        {/* Modern FinTech Brand Logo */}
        <div className="brand-logo" onClick={() => setActiveTab('dashboard')} role="button" tabIndex={0} title="Future Wallet - กลับสู่หน้าหลัก">
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
                <path
                  d="M5 11.5L9.5 22.5L14 13.5L18.5 22.5L24.5 9"
                  stroke="#10b981"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M19.5 9H24.5V14"
                  stroke="#10b981"
                  strokeWidth="3.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="brand-icon-glow" aria-hidden="true" />
          </div>

          <div className="brand-text-block">
            <div className="brand-title-wrap">
              <span className="brand-name">
                Future <span className="brand-accent">Wallet</span>
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

        {/* Quick Action Button & User Profile */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setIsAddTxOpen(true)}
          >
            <Plus size={16} />
            <span>บันทึกรายการ</span>
          </button>

          {user && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(255, 255, 255, 0.08)',
                padding: '0.25rem 0.55rem',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                fontSize: '0.82rem',
                color: 'var(--text-main)'
              }}
              title={`เข้าสู่ระบบโดย: ${user.email || user.name}`}
            >
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '0.75rem'
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : <UserIcon size={12} />}
              </div>
              <span style={{ maxWidth: '90px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.name}
              </span>
              <button
                type="button"
                onClick={logout}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-subtle)',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: '4px'
                }}
                title="ออกจากระบบ / สลับบัญชี"
              >
                <LogOut size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
