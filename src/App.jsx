import React from 'react';
import { useWallet } from './context/WalletContext';
import { useAuth } from './context/AuthContext';
import { useCookieConsent } from './context/CookieContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';
import { AuthView } from './features/auth/AuthView';
import { CookieConsentBanner } from './features/cookie/CookieConsentBanner';
import { CookiePreferencesModal } from './features/cookie/CookiePreferencesModal';
import { PrivacyPolicyModal } from './features/cookie/PrivacyPolicyModal';

// Feature Modules
import { DashboardTab } from './features/dashboard/DashboardTab';
import { TransactionsTab } from './features/transactions/TransactionsTab';
import { AddTransactionModal } from './features/transactions/AddTransactionModal';
import { FixedCostsTab } from './features/fixed-costs/FixedCostsTab';
import { AddFixedCostModal } from './features/fixed-costs/AddFixedCostModal';
import { ProjectionTab } from './features/projection/ProjectionTab';
import { DebtTab } from './features/debt/DebtTab';
import { AddDebtModal } from './features/debt/AddDebtModal';
import { AllocationTab } from './features/allocation/AllocationTab';
import { SavingsTab } from './features/savings/SavingsTab';
import { AddGoalModal } from './features/savings/AddGoalModal';
import { QuickDepositModal } from './features/savings/QuickDepositModal';
import { TaxTab } from './features/tax/TaxTab';
import { ReportsTab } from './features/reports/ReportsTab';

export const App = () => {
  const { activeTab } = useWallet();
  const { isAuthenticated } = useAuth();
  const { setIsPreferencesOpen, setIsPolicyOpen } = useCookieConsent();

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardTab />;
      case 'transactions':
        return <TransactionsTab />;
      case 'fixed-costs':
        return <FixedCostsTab />;
      case 'projection':
        return <ProjectionTab />;
      case 'debt':
        return <DebtTab />;
      case 'allocation':
        return <AllocationTab />;
      case 'savings':
        return <SavingsTab />;
      case 'tax':
        return <TaxTab />;
      case 'reports':
        return <ReportsTab />;
      default:
        return <DashboardTab />;
    }
  };

  // If not logged in, render the Auth View (Login & Register cards) + Cookie banner
  if (!isAuthenticated) {
    return (
      <>
        <AuthView />
        <CookieConsentBanner />
        <CookiePreferencesModal />
        <PrivacyPolicyModal />
        <ToastContainer />
      </>
    );
  }

  return (
    <>
      {/* Top Navbar */}
      <Navbar />

      {/* Main Container */}
      <main className="app-container">
        {renderActiveTab()}
      </main>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '1.5rem',
        fontSize: '0.8rem',
        color: 'var(--text-subtle)',
        borderTop: '1px solid var(--border-color)',
        background: 'var(--bg-card)'
      }}>
        <div>
          💰 <b>Future Wallet</b> - ระบบบริหารการเงินส่วนบุคคล & วางแผนภาษีครบวงจร
        </div>
        {/* PDPA & Cookie Links in Footer */}
        <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.85rem', fontSize: '0.78rem' }}>
          <button
            type="button"
            onClick={() => setIsPreferencesOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-subtle)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>🍪</span>
            <span>การตั้งค่าคุกกี้</span>
          </button>
          <span style={{ color: 'var(--border-color)' }}>•</span>
          <button
            type="button"
            onClick={() => setIsPolicyOpen(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-subtle)',
              cursor: 'pointer'
            }}
          >
            นโยบายความเป็นส่วนตัวและคุกกี้ (PDPA)
          </button>
        </div>
      </footer>

      {/* Modals from Features */}
      <AddTransactionModal />
      <AddFixedCostModal />
      <AddGoalModal />
      <QuickDepositModal />
      <AddDebtModal />

      {/* Cookie Consent & Modals */}
      <CookieConsentBanner />
      <CookiePreferencesModal />
      <PrivacyPolicyModal />

      {/* Toast Notifications */}
      <ToastContainer />
    </>
  );
};
