import React, { useMemo } from 'react';
import { Banknote, Wallet, CreditCard, PiggyBank } from 'lucide-react';
import { StatCard } from '../../components/StatCard';
import { formatCurrency, getCurrentMonthPrefix } from '../../shared/formatters';
import { summarizeWallet, periodToRange } from './transactionMapping';
import { useProjectedEntries } from './useProjectedEntries';

// ภาพรวมกระเป๋าเงิน: ยอดสะสมทุกเดือนถึงสิ้นเดือนนี้ รวมเงินเดือน/ฟิกคอสของเดือนนี้ที่ยังไม่ถึงวัน (แสดงอย่างเดียว)
export const WalletOverview = ({ transactions }) => {
  const month = getCurrentMonthPrefix();
  const range = useMemo(() => periodToRange({ periodMode: 'month', month }), [month]);
  const { projected } = useProjectedEntries(range);
  const s = summarizeWallet(transactions, projected, range.endDate);

  return (
    <div className="grid grid-cols-4 mb-4">
      <StatCard
        label="เงินคงเหลือทั้งหมด"
        value={formatCurrency(s.balance)}
        subtext="รายรับ หัก รายจ่าย ฟิกคอส และเงินออม ถึงสิ้นเดือนนี้"
        icon={Banknote}
        colorScheme="blue"
        variant="dark"
        valueClass={s.balance >= 0 ? '' : 'text-danger'}
      />
      <StatCard
        label="รายรับสะสม"
        value={formatCurrency(s.income)}
        subtext={
          s.pendingIncome > 0
            ? `รวมเงินเดือนรอเข้าเดือนนี้ ${formatCurrency(s.pendingIncome)}`
            : 'เงินเดือน + รายได้อื่น'
        }
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
