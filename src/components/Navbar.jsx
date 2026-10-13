import React, { useState } from 'react';
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
  User as UserIcon,
  Database,
  RefreshCw,
  CheckCircle2,
  ShieldCheck,
  Server
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
  const {
    activeTab,
    setActiveTab,
    setIsAddTxOpen,
    transactions = [],
    fixedCosts = [],
    savingsGoals = [],
    debts = [],
    categories = [],
    addToast
  } = useWallet();
  const { user, logout, backendStatus } = useAuth();
  const [showBeModal, setShowBeModal] = useState(false);

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

        {/* Quick Action Button, Backend Badge & User Profile */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* BE Connection Indicator & Verifier */}
          <button
            type="button"
            onClick={() => setShowBeModal(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.72rem',
              fontWeight: 500,
              padding: '0.28rem 0.65rem',
              borderRadius: '20px',
              background:
                backendStatus === 'connected'
                  ? 'rgba(16, 185, 129, 0.12)'
                  : 'rgba(245, 158, 11, 0.12)',
              color: backendStatus === 'connected' ? '#10b981' : '#f59e0b',
              border: `1px solid ${
                backendStatus === 'connected' ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'
              }`,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            title="คลิกเพื่อตรวจสอบสถานะ API และฐานข้อมูล Database"
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: backendStatus === 'connected' ? '#10b981' : '#f59e0b',
                boxShadow:
                  backendStatus === 'connected'
                    ? '0 0 6px #10b981'
                    : '0 0 6px #f59e0b',
                display: 'inline-block'
              }}
            />
            <span>{backendStatus === 'connected' ? 'BE: Connected' : 'BE: Offline'}</span>
            <Database size={11} />
          </button>

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

      {/* Backend & Database Verification Modal */}
      {showBeModal && (
        <div
          className="auth-modal-backdrop"
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={() => setShowBeModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-main, #0f172a)',
              borderRadius: '20px',
              maxWidth: '460px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-light, #e2e8f0)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Server size={22} color="#10b981" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700 }}>
                  สถานะ API & ฐานข้อมูลจริง
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowBeModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer', color: 'var(--text-muted, #64748b)' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted, #64748b)', marginBottom: '1rem', lineHeight: '1.4' }}>
              ระบบเชื่อมต่อกับ .NET Web API และฐานข้อมูล SQL Server LocalDB เพื่อจัดเก็บและประมวลผลข้อมูลจริง:
            </p>

            {/* Connection Information */}
            <div style={{ background: 'var(--bg-subtle, #f8fafc)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1rem', border: '1px solid var(--border-light, #e2e8f0)', fontSize: '0.82rem', display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #64748b)' }}>สถานะเซิร์ฟเวอร์:</span>
                <span style={{ fontWeight: 600, color: backendStatus === 'connected' ? '#10b981' : '#f59e0b' }}>
                  {backendStatus === 'connected' ? '🟢 ออนไลน์ (Connected)' : '🟡 ออฟไลน์ (Offline Mode)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #64748b)' }}>API Base URL:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>https://localhost:7056</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted, #64748b)' }}>ฐานข้อมูล:</span>
                <span style={{ fontWeight: 600 }}>SQL Server (WalletlyDb)</span>
              </div>
              {user && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted, #64748b)' }}>ผู้ใช้งานปัจจุบัน:</span>
                    <span style={{ fontWeight: 600 }}>{user.name} ({user.email})</span>
                  </div>
                  {user.id && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted, #64748b)' }}>User ID (SQL GUID):</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#10b981' }}>{user.id.slice(0, 8)}...</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Live Data Counts from DB */}
            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-main, #1e293b)' }}>
                📊 ข้อมูลสดที่โหลดมาจาก Backend API:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.25)', fontSize: '0.78rem' }}>
                  <div style={{ color: '#10b981', fontWeight: 600 }}>{transactions.length} รายการ</div>
                  <div style={{ color: 'var(--text-muted, #64748b)' }}>ธุรกรรม (/api/Transactions)</div>
                </div>
                <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.25)', fontSize: '0.78rem' }}>
                  <div style={{ color: '#3b82f6', fontWeight: 600 }}>{fixedCosts.length} รายการ</div>
                  <div style={{ color: 'var(--text-muted, #64748b)' }}>ฟิกคอส (/api/fixed-costs)</div>
                </div>
                <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(168, 85, 247, 0.08)', border: '1px solid rgba(168, 85, 247, 0.25)', fontSize: '0.78rem' }}>
                  <div style={{ color: '#a855f7', fontWeight: 600 }}>{savingsGoals.length} เป้าหมาย</div>
                  <div style={{ color: 'var(--text-muted, #64748b)' }}>การออม (/api/savings-goals)</div>
                </div>
                <div style={{ padding: '0.65rem', borderRadius: '10px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.25)', fontSize: '0.78rem' }}>
                  <div style={{ color: '#f59e0b', fontWeight: 600 }}>{categories.length} หมวดหมู่</div>
                  <div style={{ color: 'var(--text-muted, #64748b)' }}>หมวดหมู่ (/api/Categories)</div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                style={{ flex: 1 }}
                onClick={() => {
                  window.location.reload();
                }}
              >
                <RefreshCw size={14} />
                <span>รีเฟรชข้อมูล</span>
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                style={{ flex: 1 }}
                onClick={() => {
                  setShowBeModal(false);
                  logout();
                }}
              >
                <LogOut size={14} />
                <span>สลับบัญชีใหม่</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
