import React from 'react';
import { Plus } from 'lucide-react';
import { useWallet } from '../context/WalletContext';

// Mobile-only floating "add transaction" button; on wider screens the navbar button is used
export const AddTransactionFab = () => {
  const { setIsAddTxOpen } = useWallet();

  return (
    <button
      type="button"
      className="add-tx-fab"
      onClick={() => setIsAddTxOpen(true)}
      title="บันทึกรายการ"
      aria-label="บันทึกรายการ"
    >
      <Plus size={26} />
    </button>
  );
};
