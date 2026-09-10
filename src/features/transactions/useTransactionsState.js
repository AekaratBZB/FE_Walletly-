import { useState, useEffect } from 'react';
import { loadTransactions, saveTransactions } from './transactionsStorage';

export const useTransactionsState = ({ addToast } = {}) => {
  const [transactions, setTransactions] = useState(() => loadTransactions());
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);

  useEffect(() => {
    saveTransactions(transactions);
  }, [transactions]);

  const addTransaction = (tx) => {
    const newTx = {
      ...tx,
      id: tx.id || `tx-${Date.now()}`,
      amount: Number(tx.amount) || 0
    };
    setTransactions(prev => [newTx, ...prev]);
    if (addToast) {
      addToast(`บันทึกรายการ "${newTx.category}" จำนวน ${newTx.amount.toLocaleString()} ฿ เรียบร้อยแล้ว`, 'success');
    }
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (addToast) {
      addToast('ลบรายการธุรกรรมเรียบร้อยแล้ว', 'info');
    }
  };

  return {
    transactions,
    setTransactions,
    isAddTxOpen,
    setIsAddTxOpen,
    addTransaction,
    deleteTransaction
  };
};
