import React from 'react';
import { useWallet } from './context/WalletContext';
import { Navbar } from './components/Navbar';
import { ToastContainer } from './components/Toast';

// Feature Modules
import { DashboardTab } from './features/dashboard/DashboardTab';
import { TransactionsTab } from './features/transactions/TransactionsTab';
import { AddTransactionModal } from './features/transactions/AddTransactionModal';
import { FixedCostsTab } from './features/fixed-costs/FixedCostsTab';
import { AddFixedCostModal } from './features/fixed-costs/AddFixedCostModal';
import { ProjectionTab } from './features/projection/ProjectionTab';
import { AllocationTab } from './features/allocation/AllocationTab';
import { SavingsTab } from './features/savings/SavingsTab';
import { AddGoalModal } from './features/savings/AddGoalModal';
import { QuickDepositModal } from './features/savings/QuickDepositModal';
import { TaxTab } from './features/tax/TaxTab';
import { ReportsTab } from './features/reports/ReportsTab';

export const App = () => {
  const { activeTab } = useWallet();

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
          💰 <b>Walletly (FinSmart Thai)</b> - ระบบบริหารการเงินส่วนบุคคล & วางแผนภาษีครบวงจร
        </div>
        <div style={{ marginTop: '4px' }}>
          พัฒนาด้วย React + Vite • โครงสร้าง Feature-Based Modular Architecture
        </div>
      </footer>

      {/* Modals from Features */}
      <AddTransactionModal />
      <AddFixedCostModal />
      <AddGoalModal />
      <QuickDepositModal />

      {/* Toast Notifications */}
      <ToastContainer />
    </>
  );
};
