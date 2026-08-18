export const DEMO_DATA = {
  transactions: [
    {
      id: 'tx-1',
      date: '2026-08-01',
      type: 'income',
      category: 'เงินเดือน (Salary)',
      amount: 45000,
      paymentMethod: 'โอนผ่านธนาคาร',
      note: 'เงินเดือนประจำเดือนสิงหาคม',
      isRecurring: true
    },
    {
      id: 'tx-2',
      date: '2026-08-01',
      type: 'income',
      category: 'รายได้เสริม (Freelance)',
      amount: 8000,
      paymentMethod: 'โอนผ่านธนาคาร',
      note: 'รับงานออกแบบเว็บ',
      isRecurring: false
    },
    {
      id: 'tx-3',
      date: '2026-08-02',
      type: 'fixed',
      category: 'ที่อยู่อาศัย (ผ่อนคอนโด)',
      amount: 12000,
      paymentMethod: 'หักบัญชีอัตโนมัติ',
      note: 'ผ่อนคอนโด ธ.กสิกร',
      isRecurring: true
    },
    {
      id: 'tx-4',
      date: '2026-08-03',
      type: 'fixed',
      category: 'ค่าเดินทาง (ค่างวดรถ)',
      amount: 7500,
      paymentMethod: 'หักบัญชีอัตโนมัติ',
      note: 'ค่างวดรถยนต์',
      isRecurring: true
    },
    {
      id: 'tx-5',
      date: '2026-08-04',
      type: 'expense',
      category: 'อาหารและเครื่องดื่ม',
      amount: 450,
      paymentMethod: 'สแกน QR',
      note: 'มื้อกลางวันและกาแฟ',
      isRecurring: false
    },
    {
      id: 'tx-6',
      date: '2026-08-05',
      type: 'expense',
      category: 'ช้อปปิ้งและของใช้',
      amount: 1850,
      paymentMethod: 'บัตรเครดิต',
      note: 'ซื้อของเข้าห้อง Big C',
      isRecurring: false
    },
    {
      id: 'tx-7',
      date: '2026-08-06',
      type: 'savings',
      category: 'กองทุนสำรองฉุกเฉิน',
      amount: 5000,
      paymentMethod: 'โอนผ่านธนาคาร',
      note: 'โอนเข้า Kept บัญชี Grow',
      isRecurring: true
    },
    {
      id: 'tx-8',
      date: '2026-08-07',
      type: 'savings',
      category: 'ลงทุน DCA (Dime / ThaiESG)',
      amount: 5000,
      paymentMethod: 'โอนผ่านธนาคาร',
      note: 'DCA S&P500 และ ThaiESG',
      isRecurring: true
    },
    {
      id: 'tx-9',
      date: '2026-08-08',
      type: 'expense',
      category: 'อาหารและเครื่องดื่ม',
      amount: 320,
      paymentMethod: 'สแกน QR',
      note: 'มื้อเย็นข้าวต้ม',
      isRecurring: false
    },
    {
      id: 'tx-10',
      date: '2026-08-10',
      type: 'expense',
      category: 'บันเทิงและสันทนาการ',
      amount: 600,
      paymentMethod: 'บัตรเครดิต',
      note: 'ตั๋วหนังและป๊อปคอร์น',
      isRecurring: false
    }
  ],

  fixedCosts: [
    {
      id: 'fc-1',
      title: 'ผ่อนคอนโด',
      category: 'ที่อยู่อาศัย (ผ่อนบ้าน/คอนโด/ค่าเช่า)',
      amount: 12000,
      dueDay: 2,
      isPaid: true,
      autoDeduct: true,
      note: 'ตัดผ่าน ธ.กสิกร'
    },
    {
      id: 'fc-2',
      title: 'ค่างวดรถยนต์',
      category: 'ยานพาหนะ (ค่างวดรถ/ประกันรถ)',
      amount: 7500,
      dueDay: 3,
      isPaid: true,
      autoDeduct: true,
      note: 'กรุงศรี ออโต้'
    },
    {
      id: 'fc-3',
      title: 'ค่าอินเทอร์เน็ตบ้าน & มือถือ',
      category: 'สาธารณูปโภค (เน็ต/มือถือ/ค่าน้ำไฟ)',
      amount: 1099,
      dueDay: 15,
      isPaid: false,
      autoDeduct: false,
      note: 'AIS Fibre + 5G'
    },
    {
      id: 'fc-4',
      title: 'เบี้ยประกันชีวิตและสุขภาพ',
      category: 'ประกัน (ชีวิต/สุขภาพ/โรคร้าย)',
      amount: 3200,
      dueDay: 20,
      isPaid: false,
      autoDeduct: true,
      note: 'AIA ประกันชีวิต+สุขภาพ'
    },
    {
      id: 'fc-5',
      title: 'Netflix & Spotify Family',
      category: 'Subscriptions (สตรีมมิ่ง/คลาวด์/สมาชิก)',
      amount: 499,
      dueDay: 25,
      isPaid: false,
      autoDeduct: true,
      note: 'ตัดบัตรเครดิต'
    },
    {
      id: 'fc-6',
      title: 'ให้คุณพ่อคุณแม่',
      category: 'ครอบครัว (ให้พ่อแม่/ค่าเทอมลูก)',
      amount: 5000,
      dueDay: 1,
      isPaid: true,
      autoDeduct: false,
      note: 'โอนเงินวันเงินเดือนออก'
    }
  ],

  allocationSettings: {
    rule: '50-30-20',
    monthlyIncome: 53000,
    buckets: {
      needs: 50,
      wants: 30,
      savings: 20
    }
  },

  savingsGoals: [
    {
      id: 'goal-1',
      title: 'เงินสำรองฉุกเฉิน 6 เดือน',
      category: 'ความมั่นคง',
      targetAmount: 150000,
      currentAmount: 95000,
      targetDate: '2026-12-31',
      monthlyContribution: 5000,
      color: 'emerald'
    },
    {
      id: 'goal-2',
      title: 'พอร์ตลงทุนเกษียณ (DCA หุ้น/กองทุน)',
      category: 'การลงทุน',
      targetAmount: 1000000,
      currentAmount: 220000,
      targetDate: '2035-12-31',
      monthlyContribution: 5000,
      expectedReturnRate: 8,
      color: 'blue'
    },
    {
      id: 'goal-3',
      title: 'ทริปเที่ยวญี่ปุ่นปลายปี',
      category: 'ท่องเที่ยว',
      targetAmount: 60000,
      currentAmount: 35000,
      targetDate: '2026-11-30',
      monthlyContribution: 5000,
      color: 'purple'
    }
  ],

  taxSettings: {
    taxYear: 2026,
    annualSalary: 540000,
    annualBonus: 90000,
    freelanceIncome: 96000,
    socialSecurity: 9000,
    personalDeduction: 60000,
    spouseDeduction: 0,
    childCount: 0,
    parentCount: 2,
    lifeInsurance: 38400,
    healthInsurance: 15000,
    ssfAmount: 30000,
    rmfAmount: 30000,
    thaiEsgAmount: 30000,
    providentFund: 27000,
    mortgageInterest: 45000,
    easyReceipt: 10000,
    donationGeneral: 5000,
    donationEducation: 0,
    withholdingTax: 18500
  }
};
