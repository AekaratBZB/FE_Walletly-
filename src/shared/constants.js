export const TRANSACTION_CATEGORIES = {
  income: [
    'เงินเดือน (Salary)',
    'โบนัส (Bonus)',
    'รายได้เสริม (Freelance)',
    'กำไร/ปันผลลงทุน',
    'ขายของออนไลน์',
    'อื่นๆ'
  ],
  expense: [
    'อาหารและเครื่องดื่ม',
    'ช้อปปิ้งและของใช้',
    'การเดินทาง/น้ำมัน',
    'บิลค่าน้ำค่าไฟ',
    'บันเทิงและสันทนาการ',
    'สุขภาพและยารักษาโรค',
    'การศึกษา/คอร์สเรียน',
    'ของขวัญ/ทำบุญ',
    'อื่นๆ'
  ],
  fixed: [
    'ที่อยู่อาศัย (ผ่อนคอนโด/บ้าน/ค่าเช่า)',
    'ยานพาหนะ (ค่างวดรถ/ประกันรถ)',
    'ค่าอินเทอร์เน็ต/มือถือ',
    'เบี้ยประกันชีวิต/สุขภาพ',
    'เงินให้ครอบครัว',
    'Subscriptions (สตรีมมิ่ง/คลาวด์/สมาชิก)',
    'ชำระหนี้สิน (บัตรเครดิต/สินเชื่อ)'
  ],
  savings: [
    'กองทุนสำรองฉุกเฉิน',
    'ลงทุน DCA (หุ้น/กองทุน)',
    'เงินฝากประจำ/ดิจิทัล',
    'ทองคำ/สินทรัพย์ทางเลือก',
    'เป้าหมายระยะสั้น'
  ]
};

export const FIXED_COST_CATEGORIES = [
  'ที่อยู่อาศัย (ผ่อนบ้าน/คอนโด/ค่าเช่า)',
  'ยานพาหนะ (ค่างวดรถ/ประกันรถ)',
  'สาธารณูปโภค (เน็ต/มือถือ/ค่าน้ำไฟ)',
  'ประกัน (ชีวิต/สุขภาพ/โรคร้าย)',
  'Subscriptions (สตรีมมิ่ง/คลาวด์/สมาชิก)',
  'ครอบครัว (ให้พ่อแม่/ค่าเทอมลูก)',
  'ชำระหนี้สิน (บัตรเครดิต/สินเชื่อบุคคล)',
  'อื่นๆ'
];

export const PAYMENT_METHODS = [
  'โอนผ่านธนาคาร',
  'สแกน QR',
  'เงินสด',
  'บัตรเครดิต',
  'บัตรเดบิต',
  'e-Wallet (TrueMoney/ShopeePay)'
];

export const ALLOCATION_PRESETS = {
  '50-30-20': {
    name: '50/30/20 Rule (ยอดนิยมสากล)',
    description: 'จำเป็น (Needs) 50% | ตามใจ (Wants) 30% | ออม & ลงทุน (Savings) 20%',
    buckets: [
      { key: 'needs', name: 'จำเป็น (Needs & Fixed Costs)', percent: 50, color: 'blue' },
      { key: 'wants', name: 'ตามใจ (Wants & Lifestyle)', percent: 30, color: 'rose' },
      { key: 'savings', name: 'ออม & ลงทุน (Savings & Invest)', percent: 20, color: 'emerald' }
    ]
  },
  '60-20-20': {
    name: '60/20/20 Rule (เน้นภาระครอบครัว)',
    description: 'จำเป็น 60% | ตามใจ 20% | ออม & ลงทุน 20%',
    buckets: [
      { key: 'needs', name: 'จำเป็น & ผ่อนชำระ', percent: 60, color: 'blue' },
      { key: 'wants', name: 'ตามใจ & ช้อปปิ้ง', percent: 20, color: 'rose' },
      { key: 'savings', name: 'ออม & ลงทุน', percent: 20, color: 'emerald' }
    ]
  },
  '70-20-10': {
    name: '70/20/10 Rule (เน้นค่าครองชีพสูง)',
    description: 'ใช้จ่ายทั่วไป 70% | ออมเงิน 20% | ลงทุน/พัฒนาตนเอง 10%',
    buckets: [
      { key: 'needs', name: 'ค่าใช้จ่ายรายวัน & ฟิกคอส', percent: 70, color: 'blue' },
      { key: 'savings', name: 'เงินออม & สำรองฉุกเฉิน', percent: 20, color: 'emerald' },
      { key: 'invest', name: 'ลงทุน & พัฒนาตนเอง', percent: 10, color: 'purple' }
    ]
  },
  '6jars': {
    name: '6 Jars System (สูตร 6 โหลของ T. Harv Eker)',
    description: 'NEC 55% | FFA 10% | LTSS 10% | PLAY 10% | EDU 10% | GIVE 5%',
    buckets: [
      { key: 'nec', name: 'NEC (ใช้จ่ายจำเป็น)', percent: 55, color: 'blue' },
      { key: 'ffa', name: 'FFA (ลงทุนสู่อิสรภาพการเงิน)', percent: 10, color: 'emerald' },
      { key: 'ltss', name: 'LTSS (ออมระยะยาว/ฉุกเฉิน)', percent: 10, color: 'amber' },
      { key: 'play', name: 'PLAY (สันทนาการ/ให้รางวัลตัวเอง)', percent: 10, color: 'rose' },
      { key: 'edu', name: 'EDU (พัฒนาตนเอง/คอร์สเรียน)', percent: 10, color: 'purple' },
      { key: 'give', name: 'GIVE (ทำบุญ/ตอบแทนครอบครัว)', percent: 5, color: 'emerald' }
    ]
  }
};
