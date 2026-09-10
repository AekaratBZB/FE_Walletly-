/**
 * Walletly (FinSmart Thai) - Complete Database Data Dictionary (21 Tables)
 * Contains schema specifications, columns, data types, constraints, descriptions, and relations.
 */

const TABLE_SCHEMAS = {
  // Domain 1: Auth & PDPA
  users: {
    name: 'users',
    title: '👤 users',
    domain: 'auth',
    badge: 'AUTH',
    badgeClass: 'badge-auth',
    desc: 'ตารางศูนย์กลางเก็บข้อมูลผู้ใช้งาน, รหัสผ่านแฮช (Argon2id), ผู้ให้บริการ OAuth (Google/Facebook/Guest) และสถานะบัญชี',
    relationsIn: [],
    relationsOut: [
      '1:N -> user_refresh_tokens (user_id)',
      '1:N -> user_consents (user_id)',
      '1:N -> accounts (user_id)',
      '1:N -> categories (user_id)',
      '1:N -> transactions (user_id)',
      '1:N -> fixed_costs (user_id)',
      '1:N -> debts (user_id)',
      '1:N -> savings_goals (user_id)',
      '1:1 -> allocation_settings (user_id)',
      '1:N -> tax_settings (user_id)'
    ],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key ประจำตัวผู้ใช้' },
      { name: 'email', type: 'VARCHAR(256)', key: 'UQ', note: 'อีเมลล็อกอิน (Unique)' },
      { name: 'password_hash', type: 'VARCHAR(512)', key: '', note: 'แฮชรหัสผ่าน Argon2id (Null ถ้าเป็น OAuth/Guest)' },
      { name: 'display_name', type: 'VARCHAR(128)', key: '', note: 'ชื่อที่แสดงผลใน UI' },
      { name: 'auth_provider', type: 'VARCHAR(32)', key: '', note: 'local, google, facebook, guest' },
      { name: 'is_guest', type: 'BOOLEAN', key: '', note: 'สถานะบัญชีทดลองใช้ (Guest)' },
      { name: 'is_active', type: 'BOOLEAN', key: '', note: 'เปิดใช้งานบัญชี' },
      { name: 'created_at', type: 'TIMESTAMPTZ', key: '', note: 'วันเวลาที่สมัครสมาชิก' },
      { name: 'updated_at', type: 'TIMESTAMPTZ', key: '', note: 'วันเวลาแก้ไขล่าสุด' }
    ]
  },
  user_refresh_tokens: {
    name: 'user_refresh_tokens',
    title: '🔑 user_refresh_tokens',
    domain: 'auth',
    badge: 'AUTH',
    badgeClass: 'badge-auth',
    desc: 'จัดเก็บ Refresh Token และประวัติ Session การล็อกอินของอุปกรณ์ต่างๆ เพื่อรองรับ Stateless JWT Authentication',
    relationsIn: ['FK user_id -> users(id) ON DELETE CASCADE'],
    relationsOut: [],
    fields: [
      { name: 'id', type: 'BIGINT', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id) ON DELETE CASCADE' },
      { name: 'token_hash', type: 'VARCHAR(256)', key: '', note: 'แฮชของ Refresh Token (SHA-256)' },
      { name: 'device_info', type: 'VARCHAR(256)', key: '', note: 'ข้อมูลเบราว์เซอร์/อุปกรณ์' },
      { name: 'expires_at', type: 'TIMESTAMPTZ', key: '', note: 'วันเวลาหมดอายุของ Token' },
      { name: 'revoked_at', type: 'TIMESTAMPTZ', key: '', note: 'วันเวลาที่ยกเลิก Token (Null = ยังใช้งานได้)' }
    ]
  },
  user_consents: {
    name: 'user_consents',
    title: '🛡️ user_consents',
    domain: 'auth',
    badge: 'PDPA',
    badgeClass: 'badge-auth',
    desc: 'บันทึกหลักฐานความยินยอมคุกกี้และนโยบายความเป็นส่วนตัวตามกฎหมาย PDPA ของไทย พร้อม IP และ User-Agent',
    relationsIn: ['FK user_id -> users(id) (ON DELETE CASCADE, Null ได้ถ้าเป็น Guest/Anonymous)'],
    relationsOut: [],
    fields: [
      { name: 'id', type: 'BIGINT', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id) (Null ได้ถ้ายังไม่ล็อกอิน)' },
      { name: 'anonymous_id', type: 'VARCHAR(128)', key: '', note: 'รหัสประจำเครื่อง Anonymous (Cookie UUID)' },
      { name: 'policy_version', type: 'VARCHAR(32)', key: '', note: 'เวอร์ชั่นนโยบายความเป็นส่วนตัว เช่น 1.0' },
      { name: 'consent_necessary', type: 'BOOLEAN', key: '', note: 'คุกกี้จำเป็น (True เสมอ)' },
      { name: 'consent_functional', type: 'BOOLEAN', key: '', note: 'คุกกี้ฟังก์ชันการทำงาน' },
      { name: 'consent_analytics', type: 'BOOLEAN', key: '', note: 'คุกกี้สถิติและการวิเคราะห์' },
      { name: 'consent_marketing', type: 'BOOLEAN', key: '', note: 'คุกกี้การตลาดและโฆษณา' },
      { name: 'ip_address', type: 'VARCHAR(64)', key: '', note: 'IP Address ขณะกดยินยอม' },
      { name: 'consented_at', type: 'TIMESTAMPTZ', key: '', note: 'วันเวลาที่บันทึกความยินยอม' }
    ]
  },

  // Domain 2: Accounts & Masters
  accounts: {
    name: 'accounts',
    title: '🏦 accounts',
    domain: 'core',
    badge: 'WALLET',
    badgeClass: 'badge-core',
    desc: 'กระเป๋าเงินและบัญชีธนาคาร รองรับหลายประเภท (ออมทรัพย์, Kept, บัตรเครดิต, เงินสด, e-Wallet) เพื่อบริหารสินทรัพย์สุทธิ (Net Worth)',
    relationsIn: ['FK user_id -> users(id) ON DELETE CASCADE'],
    relationsOut: [
      '1:N -> payment_methods (account_id)',
      '1:N -> transactions (account_id)'
    ],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key ของบัญชี' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id) ON DELETE CASCADE' },
      { name: 'name', type: 'VARCHAR(100)', key: '', note: 'ชื่อบัญชี เช่น KBANK ออมทรัพย์' },
      { name: 'account_type', type: 'VARCHAR(32)', key: '', note: 'bank, cash, credit_card, e_wallet' },
      { name: 'current_balance', type: 'DECIMAL(18,2)', key: '', note: 'ยอดเงินคงเหลือจริงในบัญชี' },
      { name: 'credit_limit', type: 'DECIMAL(18,2)', key: '', note: 'วงเงินบัตรเครดิต (ถ้ามี)' },
      { name: 'currency', type: 'CHAR(3)', key: '', note: 'THB มาตรฐาน' },
      { name: 'color', type: 'VARCHAR(32)', key: '', note: 'สีของแท่งบัญชี' },
      { name: 'icon', type: 'VARCHAR(64)', key: '', note: 'รหัสไอคอน' }
    ]
  },
  categories: {
    name: 'categories',
    title: '🏷️ categories',
    domain: 'core',
    badge: 'MASTER',
    badgeClass: 'badge-core',
    desc: 'หมวดหมู่รายรับ-รายจ่ายที่กำหนดโดยผู้ใช้ แยกตามประเภท income, expense, fixed, savings (User สามารถเพิ่ม ลบ แก้ไขได้)',
    relationsIn: ['FK user_id -> users(id) ON DELETE CASCADE'],
    relationsOut: [
      '1:N -> transactions (category_id)',
      '1:N -> fixed_costs (category_id)',
      '1:N -> allocation_bucket_categories (category_id)'
    ],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key หมวดหมู่' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id)' },
      { name: 'type', type: 'VARCHAR(20)', key: '', note: 'income, expense, fixed, savings' },
      { name: 'name', type: 'VARCHAR(128)', key: '', note: 'ชื่อหมวดหมู่ เช่น อาหาร, เงินเดือน, ค่าเน็ต' },
      { name: 'color', type: 'VARCHAR(32)', key: '', note: 'สีประจำหมวดหมู่' },
      { name: 'icon', type: 'VARCHAR(64)', key: '', note: 'รหัสไอคอน' },
      { name: 'sort_order', type: 'INT', key: '', note: 'ลำดับการจัดเรียงใน UI' }
    ]
  },
  payment_methods: {
    name: 'payment_methods',
    title: '💳 payment_methods',
    domain: 'core',
    badge: 'MASTER',
    badgeClass: 'badge-core',
    desc: 'ช่องทางการชำระเงินของผู้ใช้ (โอนผ่านแอปธนาคาร, สแกน QR, บัตรเครดิต, เงินสด) เชื่อมโยงกับบัญชีเงินจริง',
    relationsIn: [
      'FK user_id -> users(id)',
      'FK account_id -> accounts(id) ON DELETE SET NULL'
    ],
    relationsOut: ['1:N -> transactions (payment_method_id)'],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id)' },
      { name: 'name', type: 'VARCHAR(100)', key: '', note: 'ชื่อช่องทางชำระเงิน' },
      { name: 'account_id', type: 'UUID', key: 'FK', note: 'FK -> accounts(id) บัญชีตัดเงิน' }
    ]
  },

  // Domain 3: Core Ledger
  transactions: {
    name: 'transactions',
    title: '💸 transactions',
    domain: 'core',
    badge: 'LEDGER',
    badgeClass: 'badge-core',
    desc: 'ตารางศูนย์กลางบันทึกกระแสเงินสดเข้า-ออกหลักของระบบ เชื่อมโยงบัญชี, หมวดหมู่, ช่องทางชำระเงิน, เป้าหมายออมเงิน และภาระหนี้สิน',
    relationsIn: [
      'FK user_id -> users(id) ON DELETE CASCADE',
      'FK account_id -> accounts(id)',
      'FK category_id -> categories(id)',
      'FK savings_goal_id -> savings_goals(id)',
      'FK fixed_cost_id -> fixed_costs(id)',
      'FK debt_id -> debts(id)'
    ],
    relationsOut: [],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key ธุรกรรม' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id) ON DELETE CASCADE' },
      { name: 'type', type: 'VARCHAR(20)', key: '', note: 'income, expense, fixed, savings, transfer' },
      { name: 'amount', type: 'DECIMAL(18,2)', key: '', note: 'ยอดเงินในธุรกรรม (CHECK amount > 0)' },
      { name: 'tx_date', type: 'DATE', key: '', note: 'วันที่ทำรายการ (YYYY-MM-DD)' },
      { name: 'category_id', type: 'UUID', key: 'FK', note: 'FK -> categories(id)' },
      { name: 'account_id', type: 'UUID', key: 'FK', note: 'FK -> accounts(id) บัญชีต้นทาง' },
      { name: 'destination_account_id', type: 'UUID', key: 'FK', note: 'FK -> accounts(id) กรณีโอนข้ามบัญชี' },
      { name: 'savings_goal_id', type: 'UUID', key: 'FK', note: 'FK -> savings_goals(id) กรณีฝากเงินเข้าเป้าหมาย' },
      { name: 'fixed_cost_id', type: 'UUID', key: 'FK', note: 'FK -> fixed_costs(id) กรณีจ่ายบิลประจำเดือน' },
      { name: 'debt_id', type: 'UUID', key: 'FK', note: 'FK -> debts(id) กรณีจ่ายค่างวดหนี้สิน' },
      { name: 'note', type: 'NVARCHAR(500)', key: '', note: 'บันทึกช่วยจำ' },
      { name: 'is_recurring', type: 'BOOLEAN', key: '', note: 'เป็นรายการประจำหรือไม่' }
    ]
  },

  // Domain 4: Fixed Costs
  fixed_costs: {
    name: 'fixed_costs',
    title: '🗓️ fixed_costs',
    domain: 'fixed',
    badge: 'BILLS',
    badgeClass: 'badge-fixed',
    desc: 'ภาระค่าใช้จ่ายคงที่ประจำเดือน (ผ่อนบ้าน, ผ่อนรถ, ประกัน, Subscriptions) พร้อม Due Day และคำนวณ Burden Ratio',
    relationsIn: [
      'FK user_id -> users(id)',
      'FK category_id -> categories(id)',
      'FK linked_debt_id -> debts(id)'
    ],
    relationsOut: ['1:N -> fixed_cost_payments (fixed_cost_id)'],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id)' },
      { name: 'title', type: 'VARCHAR(150)', key: '', note: 'ชื่อรายการ เช่น ผ่อนคอนโด, Netflix' },
      { name: 'amount', type: 'DECIMAL(18,2)', key: '', note: 'ยอดที่ต้องจ่ายต่อเดือน' },
      { name: 'due_day', type: 'TINYINT', key: '', note: 'วันที่ครบกำหนดชำระ (1-31)' },
      { name: 'category_id', type: 'UUID', key: 'FK', note: 'FK -> categories(id)' },
      { name: 'is_paid', type: 'BOOLEAN', key: '', note: 'สถานะการชำระในรอบเดือนปัจจุบัน' },
      { name: 'auto_deduct', type: 'BOOLEAN', key: '', note: 'หักบัญชีอัตโนมัติหรือไม่' },
      { name: 'linked_debt_id', type: 'UUID', key: 'FK', note: 'FK -> debts(id) กรณีผูกกับหนี้สิน' }
    ]
  },
  fixed_cost_payments: {
    name: 'fixed_cost_payments',
    title: '🧾 fixed_cost_payments',
    domain: 'fixed',
    badge: 'AUDIT',
    badgeClass: 'badge-fixed',
    desc: 'ประวัติการจ่ายเงินบิลฟิกคอสรายเดือน แก้ปัญหาข้อมูลสูญหายเมื่อกดเริ่มรอบเดือนใหม่ในระบบเดิม',
    relationsIn: ['FK fixed_cost_id -> fixed_costs(id) ON DELETE CASCADE'],
    relationsOut: [],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key' },
      { name: 'fixed_cost_id', type: 'UUID', key: 'FK', note: 'FK -> fixed_costs(id) ON DELETE CASCADE' },
      { name: 'period_month', type: 'DATE', key: 'UQ', note: 'วันที่ 1 ของรอบเดือนที่จ่าย (เช่น 2026-08-01)' },
      { name: 'amount_paid', type: 'DECIMAL(18,2)', key: '', note: 'ยอดเงินจริงที่ชำระในรอบนั้น' },
      { name: 'paid_at', type: 'TIMESTAMPTZ', key: '', note: 'วันเวลาที่กดชำระเงินจริง' },
      { name: 'is_on_time', type: 'BOOLEAN', key: '', note: 'ชำระตรงเวลาหรือไม่' }
    ]
  },

  // Domain 5: Savings Goals
  savings_goals: {
    name: 'savings_goals',
    title: '🎯 savings_goals',
    domain: 'goals',
    badge: 'WEALTH',
    badgeClass: 'badge-goal',
    desc: 'เป้าหมายการเงินและเงินสำรองฉุกเฉิน 3-6 เดือน โดยยอดเงินออมปัจจุบันคำนวณแบบ Dynamic จาก Transactions ไม่เก็บซ้ำซ้อน',
    relationsIn: ['FK user_id -> users(id)'],
    relationsOut: ['1:N -> transactions (FK savings_goal_id)'],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id)' },
      { name: 'title', type: 'VARCHAR(150)', key: '', note: 'ชื่อเป้าหมาย เช่น สำรองฉุกเฉิน 6 เดือน, เที่ยวญี่ปุ่น' },
      { name: 'category', type: 'VARCHAR(100)', key: '', note: 'ความมั่นคง, การลงทุน, เกษียณ, ท่องเที่ยว' },
      { name: 'target_amount', type: 'DECIMAL(18,2)', key: '', note: 'ยอดเงินเป้าหมาย' },
      { name: 'initial_amount', type: 'DECIMAL(18,2)', key: '', note: 'ยอดเงินตั้งต้นก่อนเริ่มระบบ' },
      { name: 'monthly_contribution', type: 'DECIMAL(18,2)', key: '', note: 'ยอดเงินวางแผนฝากต่อเดือน' },
      { name: 'target_date', type: 'DATE', key: '', note: 'วันที่เป้าหมายสำเร็จ' },
      { name: 'expected_return_rate', type: 'DECIMAL(5,2)', key: '', note: 'อัตราผลตอบแทนคาดหวัง (% APY)' }
    ]
  },

  // Domain 6: Allocation Buckets
  allocation_settings: {
    name: 'allocation_settings',
    title: '🥧 allocation_settings',
    domain: 'budget',
    badge: 'BUDGET',
    badgeClass: 'badge-budget',
    desc: 'การตั้งค่าสัดส่วนงบประมาณ (สูตร 50/30/20, 6 Jars, 60/20/20) พร้อมฐานรายได้ต่อเดือน',
    relationsIn: ['FK user_id -> users(id) (Unique)'],
    relationsOut: ['1:N -> allocation_buckets (allocation_settings_id)'],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id) (Unique)' },
      { name: 'rule_key', type: 'VARCHAR(50)', key: '', note: '50-30-20, 6jars, custom' },
      { name: 'monthly_income', type: 'DECIMAL(18,2)', key: '', note: 'ฐานรายได้ต่อเดือนที่ใช้จัดสรร' }
    ]
  },
  allocation_buckets: {
    name: 'allocation_buckets',
    title: '🪣 allocation_buckets',
    domain: 'budget',
    badge: 'BUCKETS',
    badgeClass: 'badge-budget',
    desc: 'ถังงบประมาณย่อยตามสูตรที่เลือก (เช่น Needs 50%, Wants 30%, Savings 20%) พร้อมสีแสดงผล',
    relationsIn: ['FK allocation_settings_id -> allocation_settings(id) ON DELETE CASCADE'],
    relationsOut: ['1:N -> allocation_bucket_categories (bucket_id)'],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key' },
      { name: 'allocation_settings_id', type: 'UUID', key: 'FK', note: 'FK -> allocation_settings(id)' },
      { name: 'bucket_key', type: 'VARCHAR(50)', key: '', note: 'needs, wants, savings, ffa, nec, lts' },
      { name: 'name', type: 'VARCHAR(100)', key: '', note: 'ชื่อที่แสดงผล' },
      { name: 'target_percent', type: 'DECIMAL(5,2)', key: '', note: 'สัดส่วนเปอร์เซ็นต์เป้าหมาย' },
      { name: 'color', type: 'VARCHAR(32)', key: '', note: 'สีของแท่งกราฟ' }
    ]
  },
  allocation_bucket_categories: {
    name: 'allocation_bucket_categories',
    title: '🔗 bucket_categories',
    domain: 'budget',
    badge: 'MAPPING',
    badgeClass: 'badge-budget',
    desc: 'ตารางจับคู่ระหว่างหมวดหมู่รายจ่ายของผู้ใช้กับถังงบประมาณ เพื่อให้ระบบเทียบงบ vs ใช้จริงได้อัตโนมัติ',
    relationsIn: [
      'FK bucket_id -> allocation_buckets(id) ON DELETE CASCADE',
      'FK category_id -> categories(id) ON DELETE CASCADE'
    ],
    relationsOut: [],
    fields: [
      { name: 'id', type: 'BIGINT', key: 'PK', note: 'Primary Key' },
      { name: 'bucket_id', type: 'UUID', key: 'FK', note: 'FK -> allocation_buckets(id)' },
      { name: 'category_id', type: 'UUID', key: 'FK', note: 'FK -> categories(id)' }
    ]
  },

  // Domain 7: Debt Planner
  debts: {
    name: 'debts',
    title: '📉 debts',
    domain: 'debt',
    badge: 'DEBT 3 TYPES',
    badgeClass: 'badge-debt',
    desc: 'โครงสร้างหนี้สิน 3 รูปแบบตามมาตรฐานการเงินไทย (ลดต้นลดดอก, เช่าซื้อรถยนต์ Flat Rate พร้อมยอดปิดบัญชีลดดอกเบี้ยตามเกณฑ์ สคบ., ผ่อน 0%)',
    relationsIn: ['FK user_id -> users(id)'],
    relationsOut: [
      '1:N -> transactions (debt_id)',
      '1:N -> fixed_costs (linked_debt_id)'
    ],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id)' },
      { name: 'name', type: 'VARCHAR(150)', key: '', note: 'ชื่อหนี้ เช่น สินเชื่อบ้าน, ผ่อนรถยนต์' },
      { name: 'type', type: 'VARCHAR(30)', key: '', note: 'amortizing, hirePurchase, installment' },
      { name: 'principal', type: 'DECIMAL(18,2)', key: '', note: 'เงินต้นคงเหลือ (เฉพาะ amortizing)' },
      { name: 'annual_rate_pct', type: 'DECIMAL(6,3)', key: '', note: 'อัตราดอกเบี้ยต่อปี (% APR)' },
      { name: 'monthly_payment', type: 'DECIMAL(18,2)', key: '', note: 'ค่างวดต่อเดือน' },
      { name: 'periods_total', type: 'INT', key: '', note: 'จำนวนงวดทั้งหมดตามสัญญา' },
      { name: 'periods_paid', type: 'INT', key: '', note: 'จำนวนงวดที่จ่ายไปแล้ว' },
      { name: 'settlement_quote', type: 'DECIMAL(18,2)', key: '', note: 'ยอดปิดบัญชีตามหนังสือไฟแนนซ์' }
    ]
  },
  debt_budget_profiles: {
    name: 'debt_budget_profiles',
    title: '📊 debt_budget_profiles',
    domain: 'debt',
    badge: 'SIMULATION',
    badgeClass: 'badge-debt',
    desc: 'โปรไฟล์กระแสเงินสดสำหรับคำนวณและจำลองการปลดหนี้ (Avalanche / Snowball / Manual)',
    relationsIn: ['FK user_id -> users(id) (Unique)'],
    relationsOut: ['1:N -> debt_schedule_overrides (profile_id)'],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id) (Unique)' },
      { name: 'net_monthly_income', type: 'DECIMAL(18,2)', key: '', note: 'รายได้สุทธิต่อเดือน' },
      { name: 'fixed_expenses', type: 'DECIMAL(18,2)', key: '', note: 'ฟิกคอสไม่รวมหนี้' },
      { name: 'discretionary_budget', type: 'DECIMAL(18,2)', key: '', note: 'งบกินใช้ตามใจ' },
      { name: 'emergency_fund_target', type: 'DECIMAL(18,2)', key: '', note: 'เป้าหมายเงินสำรอง' },
      { name: 'emergency_fund_current', type: 'DECIMAL(18,2)', key: '', note: 'เงินสำรองที่มีอยู่ปัจจุบัน' },
      { name: 'emergency_fund_monthly', type: 'DECIMAL(18,2)', key: '', note: 'ยอดกันเงินสำรองต่อเดือน' },
      { name: 'cash_buffer', type: 'DECIMAL(18,2)', key: '', note: 'เงินกันชนสภาพคล่อง' },
      { name: 'strategy', type: 'VARCHAR(20)', key: '', note: 'avalanche, snowball, manual' }
    ]
  },
  debt_schedule_overrides: {
    name: 'debt_schedule_overrides',
    title: '⏱️ debt_schedule_overrides',
    domain: 'debt',
    badge: 'ENGINE',
    badgeClass: 'badge-debt',
    desc: 'ตารางบันทึกการปรับเปลี่ยนงบสำรองฉุกเฉินและเงินกันชนตามช่วงเวลา (เช่น เดือน 0-2 กัน 2k, เดือน 3 กัน 3k)',
    relationsIn: ['FK profile_id -> debt_budget_profiles(id) ON DELETE CASCADE'],
    relationsOut: [],
    fields: [
      { name: 'id', type: 'BIGINT', key: 'PK', note: 'Primary Key' },
      { name: 'profile_id', type: 'UUID', key: 'FK', note: 'FK -> debt_budget_profiles(id)' },
      { name: 'override_type', type: 'VARCHAR(50)', key: '', note: 'emergency_contribution, buffer' },
      { name: 'from_month', type: 'INT', key: '', note: 'ดัชนีเดือนเริ่มต้น (0 = เดือนแรก)' },
      { name: 'amount', type: 'DECIMAL(18,2)', key: '', note: 'ยอดเงินใหม่ที่กำหนด' }
    ]
  },

  // Domain 8: Thai Tax
  tax_settings: {
    name: 'tax_settings',
    title: '🧾 tax_settings',
    domain: 'tax',
    badge: 'THAI TAX ภ.ง.ด.',
    badgeClass: 'badge-tax',
    desc: 'ข้อมูลการวางแผนและคำนวณภาษีบุคคลธรรมดาประจำปี ครอบคลุมเงินได้ ม.40(1) และสิทธิลดหย่อนทุกหมวดหมู่ปี 2026',
    relationsIn: ['FK user_id -> users(id)'],
    relationsOut: ['อ้างอิงอัตราภาษีจาก tax_bracket_rules ตาม tax_year'],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id)' },
      { name: 'tax_year', type: 'INT', key: '', note: 'ปีภาษี เช่น 2026' },
      { name: 'annual_salary', type: 'DECIMAL(18,2)', key: '', note: 'เงินเดือนรวมทั้งปี (ม.40(1))' },
      { name: 'annual_bonus', type: 'DECIMAL(18,2)', key: '', note: 'โบนัสประจำปี' },
      { name: 'other_income', type: 'DECIMAL(18,2)', key: '', note: 'เงินได้อื่นๆ ม.40(2)-(8)' },
      { name: 'personal_deduction', type: 'DECIMAL(18,2)', key: '', note: 'ลดหย่อนส่วนตัว 60,000 บาท' },
      { name: 'social_security', type: 'DECIMAL(18,2)', key: '', note: 'ประกันสังคม (สูงสุด 9,000 บาท)' },
      { name: 'provident_fund', type: 'DECIMAL(18,2)', key: '', note: 'กองทุนสำรองเลี้ยงชีพ PVD' },
      { name: 'ssf_amount', type: 'DECIMAL(18,2)', key: '', note: 'กองทุน SSF (สูงสุด 200,000 บาท)' },
      { name: 'rmf_amount', type: 'DECIMAL(18,2)', key: '', note: 'กองทุน RMF (สูงสุด 500,000 บาท)' },
      { name: 'thai_esg_amount', type: 'DECIMAL(18,2)', key: '', note: 'กองทุน ThaiESG (แยกโควตา 300,000 บาท)' },
      { name: 'life_insurance', type: 'DECIMAL(18,2)', key: '', note: 'เบี้ยประกันชีวิต (สูงสุด 100,000 บาท)' },
      { name: 'health_insurance', type: 'DECIMAL(18,2)', key: '', note: 'เบี้ยประกันสุขภาพ (สูงสุด 25,000 บาท)' },
      { name: 'mortgage_interest', type: 'DECIMAL(18,2)', key: '', note: 'ดอกเบี้ยกู้ซื้อบ้าน (สูงสุด 100,000 บาท)' },
      { name: 'withholding_tax', type: 'DECIMAL(18,2)', key: '', note: 'ภาษีหัก ณ ที่จ่ายรวมทั้งปี' }
    ]
  },
  tax_bracket_rules: {
    name: 'tax_bracket_rules',
    title: '🏛️ tax_bracket_rules',
    domain: 'tax',
    badge: 'REFERENCE',
    badgeClass: 'badge-tax',
    desc: 'ตารางอ้างอิงอัตราภาษีเงินได้บุคคลธรรมดาขั้นบันได 0% - 35% กรมสรรพากรไทย',
    relationsIn: [],
    relationsOut: ['Lookup Table อ้างอิงตาม tax_year'],
    fields: [
      { name: 'id', type: 'INT', key: 'PK', note: 'Primary Key' },
      { name: 'tax_year', type: 'INT', key: '', note: 'ปีภาษี 2026' },
      { name: 'bracket_min', type: 'DECIMAL(18,2)', key: '', note: 'ฐานเงินได้สุทธิขั้นต่ำ' },
      { name: 'bracket_max', type: 'DECIMAL(18,2)', key: '', note: 'ฐานเงินได้สุทธิสูงสุด (Null = ไม่จำกัด)' },
      { name: 'rate', type: 'DECIMAL(5,4)', key: '', note: 'อัตราภาษี เช่น 0.00, 0.05, 0.10 ถึง 0.35' }
    ]
  },

  // Domain 9: Liquidity Simulation
  affordability_simulations: {
    name: 'affordability_simulations',
    title: '🔮 afford_simulations',
    domain: 'sim',
    badge: 'SIMULATION',
    badgeClass: 'badge-core',
    desc: 'บันทึกประวัติการทดสอบคำนวณการซื้อของชิ้นใหญ่ (Can I Afford It?) เพื่อดูผลกระทบต่อสภาพคล่องก่อนตัดสินใจซื้อจริง',
    relationsIn: ['FK user_id -> users(id)'],
    relationsOut: [],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id)' },
      { name: 'item_name', type: 'VARCHAR(150)', key: '', note: 'ชื่อสินค้าที่อยากได้ เช่น iPhone 16 Pro' },
      { name: 'item_price', type: 'DECIMAL(18,2)', key: '', note: 'ราคาเต็มของสินค้า' },
      { name: 'installments', type: 'INT', key: '', note: 'จำนวนงวดผ่อน (1 = ซื้อสด)' },
      { name: 'monthly_payment', type: 'DECIMAL(18,2)', key: '', note: 'ค่างวดที่ต้องจ่ายต่อเดือน' },
      { name: 'cash_balance_before', type: 'DECIMAL(18,2)', key: '', note: 'เงินคงเหลือในบัญชีก่อนซื้อ' },
      { name: 'cash_balance_after', type: 'DECIMAL(18,2)', key: '', note: 'เงินคงเหลือที่คาดว่าจะเหลือหลังซื้อ' },
      { name: 'feasibility_status', type: 'VARCHAR(32)', key: '', note: 'safe (ปลอดภัย), caution (ระวัง), danger (เสี่ยง)' },
      { name: 'simulated_at', type: 'TIMESTAMPTZ', key: '', note: 'วันเวลาที่จำลอง' }
    ]
  },

  // Domain 10: Security & Audit
  user_backups: {
    name: 'user_backups',
    title: '💾 user_backups',
    domain: 'security',
    badge: 'BACKUP',
    badgeClass: 'badge-auth',
    desc: 'บันทึกประวัติการส่งออกและนำเข้าสำรองข้อมูล JSON / CSV ทั้งหมดของผู้ใช้',
    relationsIn: ['FK user_id -> users(id) ON DELETE CASCADE'],
    relationsOut: [],
    fields: [
      { name: 'id', type: 'UUID', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id)' },
      { name: 'backup_type', type: 'VARCHAR(32)', key: '', note: 'json_full, csv_transactions' },
      { name: 'schema_version', type: 'VARCHAR(32)', key: '', note: 'เวอร์ชั่นโครงสร้าง เช่น 1.0.0' },
      { name: 'file_size_bytes', type: 'BIGINT', key: '', note: 'ขนาดไฟล์สำรองข้อมูล' },
      { name: 'created_at', type: 'TIMESTAMPTZ', key: '', note: 'วันเวลาที่สำรองข้อมูล' }
    ]
  },
  audit_logs: {
    name: 'audit_logs',
    title: '📋 audit_logs',
    domain: 'security',
    badge: 'AUDIT',
    badgeClass: 'badge-auth',
    desc: 'บันทึกประวัติกิจกรรมความมั่นคงปลอดภัย การเข้าสู่ระบบ และการกระทำสำคัญในระบบ',
    relationsIn: ['FK user_id -> users(id) ON DELETE SET NULL'],
    relationsOut: [],
    fields: [
      { name: 'id', type: 'BIGINT', key: 'PK', note: 'Primary Key' },
      { name: 'user_id', type: 'UUID', key: 'FK', note: 'FK -> users(id) (ON DELETE SET NULL)' },
      { name: 'action', type: 'VARCHAR(100)', key: '', note: 'เช่น USER_LOGIN, EXPORT_DATA, PASSWORD_CHANGE' },
      { name: 'entity_name', type: 'VARCHAR(64)', key: '', note: 'ชื่อตารางที่เกี่ยวข้อง' },
      { name: 'entity_id', type: 'VARCHAR(64)', key: '', note: 'ID ของข้อมูลที่ถูกกระทำ' },
      { name: 'ip_address', type: 'VARCHAR(64)', key: '', note: 'IP Address ต้นทาง' },
      { name: 'user_agent', type: 'VARCHAR(512)', key: '', note: 'User Agent เบราว์เซอร์' },
      { name: 'created_at', type: 'TIMESTAMPTZ', key: '', note: 'วันเวลาที่เกิดเหตุการณ์' }
    ]
  }
};
