import React from 'react';
import { Banknote, Wallet, CreditCard, PiggyBank } from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { formatCurrency, getTodayDateString } from '../../shared/formatters';
import { summarizeWallet } from './transactionMapping';

// ภาพรวมกระเป๋าเงิน: ยอดสะสมทุกเดือนจากรายการที่บันทึกจริงถึงวันนี้ (แสดงอย่างเดียว)
export const WalletOverview = ({ transactions }) => {
  const s = summarizeWallet(transactions, getTodayDateString());

  return (
    <div className="grid grid-cols-4 mb-4">
      <StatCard
        label="เงินคงเหลือทั้งหมด"
        value={formatCurrency(s.balance)}
        subtext="รายรับ หัก รายจ่าย ฟิกคอส และเงินออม"
        icon={Banknote}
        colorScheme="blue"
        variant="dark"
        valueClass={s.balance >= 0 ? '' : 'text-danger'}
      />
      <StatCard
        label="รายรับสะสม"
        value={formatCurrency(s.income)}
        subtext="เงินเดือน + รายได้อื่น"
        icon={Wallet}
        colorScheme="emerald"
        valueClass="text-success"
      />
      <StatCard
        label="รายจ่ายสะสม"
        value={formatCurrency(s.expense + s.fixed)}
        subtext={`ผันแปร ${formatCurrency(s.expense)} · ฟิกคอส ${formatCurrency(s.fixed)}`}
        icon={CreditCard}
        colorScheme="rose"
        valueClass="text-danger"
      />
      <StatCard
        label="ออม/ลงทุนสะสม"
        value={formatCurrency(s.savings)}
        subtext="กันออกจากเงินใช้จ่ายแล้ว"
        icon={PiggyBank}
        colorScheme="purple"
        valueClass="text-info"
      />
    </div>
  );
};
