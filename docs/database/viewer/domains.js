/**
 * Walletly (FinSmart Thai) - Domain Modules Configuration and Clean Focused Diagrams
 */

const DOMAIN_DATA = {
  core: {
    key: 'core',
    title: '💳 1. ระบบบัญชี, กระเป๋า & ธุรกรรมหลัก (Core Ledger)',
    desc: 'ศูนย์กลางการบันทึกกระแสเงินสดเข้า-ออกของ Walletly เชื่อมโยงบัญชีธนาคาร (Bank/Cash/Kept/Credit Card), หมวดหมู่รายรับ-รายจ่าย และช่องทางการชำระเงิน พร้อมเชื่อมต่อไปยังเงินออมและภาระหนี้สิน',
    tableCount: 4,
    fkCount: 7,
    tables: ['transactions', 'accounts', 'categories', 'payment_methods'],
    renderSvg: function() {
      return `
        <svg viewBox="0 0 920 380" class="subdiagram-svg">
          <defs>
            <marker id="sub-arr-core" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#3B82F6"/>
            </marker>
          </defs>

          <!-- Relationship Paths -->
          <path d="M 260 100 L 370 100" stroke="#3B82F6" stroke-width="2.5" stroke-dasharray="4,3" marker-end="url(#sub-arr-core)" />
          <text x="275" y="90" fill="#60A5FA" font-size="12" font-weight="600">account_id</text>

          <path d="M 260 270 L 370 200" stroke="#3B82F6" stroke-width="2.5" stroke-dasharray="4,3" marker-end="url(#sub-arr-core)" />
          <text x="275" y="245" fill="#60A5FA" font-size="12" font-weight="600">via account</text>

          <path d="M 660 100 L 610 100" stroke="#3B82F6" stroke-width="2.5" stroke-dasharray="4,3" marker-end="url(#sub-arr-core)" />
          <text x="618" y="90" fill="#60A5FA" font-size="12" font-weight="600">category_id</text>

          <!-- 1. accounts -->
          <g transform="translate(20, 30)" class="svg-node" onclick="inspectTable('accounts')">
            <rect width="240" height="150" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" />
            <rect width="240" height="38" rx="10" fill="#1E293B" />
            <text x="16" y="25" fill="#FFF" font-weight="700" font-size="15">🏦 accounts</text>
            <text x="224" y="25" fill="#60A5FA" font-size="11" font-weight="600" text-anchor="end">[WALLET]</text>
            <text x="16" y="65" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="16" y="88" fill="#F8FAFC" font-size="12.5">name VARCHAR(100)</text>
            <text x="16" y="111" fill="#10B981" font-size="13" font-weight="700">current_balance DECIMAL</text>
            <text x="16" y="133" fill="#94A3B8" font-size="11.5">bank, cash, credit, e_wallet</text>
          </g>

          <!-- 2. payment_methods -->
          <g transform="translate(20, 210)" class="svg-node" onclick="inspectTable('payment_methods')">
            <rect width="240" height="135" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" />
            <rect width="240" height="38" rx="10" fill="#1E293B" />
            <text x="16" y="25" fill="#FFF" font-weight="700" font-size="15">💳 payment_methods</text>
            <text x="16" y="65" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="16" y="90" fill="#F8FAFC" font-size="12.5">name VARCHAR(100)</text>
            <text x="16" y="115" fill="#F8FAFC" font-size="12.5"><tspan fill="#3B82F6" font-weight="700">FK </tspan>account_id UUID</text>
          </g>

          <!-- 3. transactions (CENTER HUB) -->
          <g transform="translate(370, 20)" class="svg-node" onclick="inspectTable('transactions')">
            <rect width="240" height="325" rx="10" fill="#091328" stroke="#2563EB" stroke-width="3" />
            <rect width="240" height="42" rx="10" fill="#1D4ED8" />
            <text x="16" y="27" fill="#FFF" font-weight="800" font-size="16">💸 transactions</text>
            <text x="224" y="27" fill="#93C5FD" font-size="11" font-weight="700" text-anchor="end">[LEDGER]</text>
            
            <text x="16" y="70" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="16" y="94" fill="#38BDF8" font-size="12.5" font-weight="600">type (income|expense|fixed)</text>
            <text x="16" y="120" fill="#10B981" font-size="14" font-weight="800">amount DECIMAL(18,2)</text>
            <text x="16" y="145" fill="#F8FAFC" font-size="12.5">tx_date DATE</text>
            <text x="16" y="170" fill="#F8FAFC" font-size="12.5"><tspan fill="#3B82F6" font-weight="700">FK </tspan>category_id UUID</text>
            <text x="16" y="195" fill="#F8FAFC" font-size="12.5"><tspan fill="#3B82F6" font-weight="700">FK </tspan>account_id UUID</text>
            <text x="16" y="220" fill="#F8FAFC" font-size="12.5"><tspan fill="#3B82F6" font-weight="700">FK </tspan>savings_goal_id UUID</text>
            <text x="16" y="245" fill="#F8FAFC" font-size="12.5"><tspan fill="#3B82F6" font-weight="700">FK </tspan>fixed_cost_id UUID</text>
            <text x="16" y="270" fill="#F8FAFC" font-size="12.5"><tspan fill="#3B82F6" font-weight="700">FK </tspan>debt_id UUID</text>
            <text x="16" y="298" fill="#94A3B8" font-size="11.5">note, is_recurring</text>
          </g>

          <!-- 4. categories -->
          <g transform="translate(660, 30)" class="svg-node" onclick="inspectTable('categories')">
            <rect width="240" height="165" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" />
            <rect width="240" height="38" rx="10" fill="#1E293B" />
            <text x="16" y="25" fill="#FFF" font-weight="700" font-size="15">🏷️ categories</text>
            <text x="224" y="25" fill="#60A5FA" font-size="11" font-weight="600" text-anchor="end">[MASTER]</text>
            <text x="16" y="65" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="16" y="90" fill="#38BDF8" font-size="12.5" font-weight="600">type (income|expense|fixed)</text>
            <text x="16" y="115" fill="#F8FAFC" font-size="12.5">name VARCHAR(128)</text>
            <text x="16" y="140" fill="#94A3B8" font-size="11.5">color, icon, sort_order</text>
          </g>
        </svg>
      `;
    }
  },

  fixed: {
    key: 'fixed',
    title: '🗓️ 2. ภาระค่าใช้จ่ายประจำ & ประวัติบิล (Fixed Costs & Payments)',
    desc: 'จัดเก็บภาระบิลที่ต้องจ่ายทุกเดือน (ผ่อนบ้าน, ผ่อนรถ, ประกัน, Subscriptions) พร้อมระบบบันทึกประวัติการจ่ายเงิน (fixed_cost_payments) แยกรายเดือน เพื่อแก้ปัญหาข้อมูลหายเวลากดเริ่มรอบเดือนใหม่',
    tableCount: 2,
    fkCount: 3,
    tables: ['fixed_costs', 'fixed_cost_payments'],
    renderSvg: function() {
      return `
        <svg viewBox="0 0 780 260" class="subdiagram-svg">
          <defs>
            <marker id="sub-arr-fixed" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#F43F5E"/>
            </marker>
          </defs>

          <!-- 1:N Connection -->
          <path d="M 330 115 L 430 115" stroke="#F43F5E" stroke-width="3" marker-end="url(#sub-arr-fixed)" />
          <text x="345" y="103" fill="#FB7185" font-size="12" font-weight="700">1 : N (บิลรายเดือน)</text>

          <!-- fixed_costs -->
          <g transform="translate(30, 20)" class="svg-node" onclick="inspectTable('fixed_costs')">
            <rect width="300" height="205" rx="10" fill="#0F172A" stroke="#F43F5E" stroke-width="2.5" />
            <rect width="300" height="40" rx="10" fill="#881337" />
            <text x="18" y="26" fill="#FFF" font-weight="700" font-size="15">🗓️ fixed_costs</text>
            <text x="282" y="26" fill="#FDA4AF" font-size="11" font-weight="600" text-anchor="end">[OBLIGATION]</text>
            <text x="18" y="70" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="18" y="96" fill="#F8FAFC" font-size="13">title VARCHAR(150)</text>
            <text x="18" y="122" fill="#F43F5E" font-size="13.5" font-weight="800">amount DECIMAL(18,2)</text>
            <text x="18" y="148" fill="#F8FAFC" font-size="13">due_day TINYINT (1-31)</text>
            <text x="18" y="174" fill="#94A3B8" font-size="12">is_paid, auto_deduct, linked_debt_id</text>
          </g>

          <!-- fixed_cost_payments -->
          <g transform="translate(430, 20)" class="svg-node" onclick="inspectTable('fixed_cost_payments')">
            <rect width="320" height="205" rx="10" fill="#0F172A" stroke="#F43F5E" stroke-width="2.5" />
            <rect width="320" height="40" rx="10" fill="#881337" />
            <text x="18" y="26" fill="#FFF" font-weight="700" font-size="15">🧾 fixed_cost_payments</text>
            <text x="302" y="26" fill="#FDA4AF" font-size="11" font-weight="600" text-anchor="end">[HISTORY]</text>
            <text x="18" y="70" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="18" y="96" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>fixed_cost_id UUID</text>
            <text x="18" y="122" fill="#38BDF8" font-size="13" font-weight="700">period_month DATE (2026-08-01)</text>
            <text x="18" y="148" fill="#10B981" font-size="13.5" font-weight="800">amount_paid DECIMAL(18,2)</text>
            <text x="18" y="174" fill="#94A3B8" font-size="12">paid_at TIMESTAMPTZ, is_on_time</text>
          </g>
        </svg>
      `;
    }
  },

  debt: {
    key: 'debt',
    title: '📉 3. แผนปลดหนี้อัจฉริยะ 3 รูปแบบ (Debt Planner Engine)',
    desc: 'โครงสร้างหนี้สินมาตรฐานการเงินไทย รองรับทั้งลดต้นลดดอก (Amortizing), สัญญาเช่าซื้อรถยนต์ (Hire Purchase คำนวณยอดปิดบัญชีลดดอกเบี้ย 50-100% สคบ.) และผ่อน 0% พร้อมระบบจำลองปลดหนี้ Snowball / Avalanche',
    tableCount: 3,
    fkCount: 3,
    tables: ['debts', 'debt_budget_profiles', 'debt_schedule_overrides'],
    renderSvg: function() {
      return `
        <svg viewBox="0 0 940 290" class="subdiagram-svg">
          <defs>
            <marker id="sub-arr-debt" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#EC4899"/>
            </marker>
          </defs>

          <!-- Connection -->
          <path d="M 620 130 L 670 130" stroke="#EC4899" stroke-width="2.5" marker-end="url(#sub-arr-debt)" />

          <!-- 1. debts -->
          <g transform="translate(20, 20)" class="svg-node" onclick="inspectTable('debts')">
            <rect width="290" height="235" rx="10" fill="#0F172A" stroke="#EC4899" stroke-width="2.5" />
            <rect width="290" height="40" rx="10" fill="#831843" />
            <text x="16" y="26" fill="#FFF" font-weight="700" font-size="15">📉 debts (หนี้สิน 3 รูปแบบ)</text>
            <text x="274" y="26" fill="#F472B6" font-size="11" font-weight="600" text-anchor="end">[3 TYPES]</text>
            <text x="16" y="70" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="16" y="95" fill="#F8FAFC" font-size="12.5">name VARCHAR(150)</text>
            <text x="16" y="120" fill="#F472B6" font-size="12.5" font-weight="700">type (amort | hirePurchase | 0%)</text>
            <text x="16" y="145" fill="#F8FAFC" font-size="12.5">principal / annual_rate_pct</text>
            <text x="16" y="170" fill="#F8FAFC" font-size="12.5">monthly_payment, periods_total</text>
            <text x="16" y="195" fill="#38BDF8" font-size="12.5" font-weight="600">settlement_quote (ปิดบัญชี)</text>
          </g>

          <!-- 2. debt_budget_profiles -->
          <g transform="translate(340, 20)" class="svg-node" onclick="inspectTable('debt_budget_profiles')">
            <rect width="280" height="235" rx="10" fill="#0F172A" stroke="#EC4899" stroke-width="2.5" />
            <rect width="280" height="40" rx="10" fill="#831843" />
            <text x="16" y="26" fill="#FFF" font-weight="700" font-size="15">📊 debt_budget_profiles</text>
            <text x="264" y="26" fill="#F472B6" font-size="11" font-weight="600" text-anchor="end">[STRATEGY]</text>
            <text x="16" y="70" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="16" y="95" fill="#F8FAFC" font-size="12.5">net_monthly_income DECIMAL</text>
            <text x="16" y="120" fill="#F8FAFC" font-size="12.5">fixed_expenses DECIMAL</text>
            <text x="16" y="145" fill="#F8FAFC" font-size="12.5">discretionary_budget DECIMAL</text>
            <text x="16" y="170" fill="#F472B6" font-size="12.5" font-weight="700">strategy (snowball | avalanche)</text>
            <text x="16" y="195" fill="#94A3B8" font-size="12">emergency_fund, buffer</text>
          </g>

          <!-- 3. debt_schedule_overrides -->
          <g transform="translate(670, 40)" class="svg-node" onclick="inspectTable('debt_schedule_overrides')">
            <rect width="250" height="185" rx="10" fill="#0F172A" stroke="#EC4899" stroke-width="2" />
            <rect width="250" height="40" rx="10" fill="#831843" />
            <text x="14" y="26" fill="#FFF" font-weight="700" font-size="14">⏱️ debt_schedule_overrides</text>
            <text x="14" y="70" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id BIGINT</text>
            <text x="14" y="96" fill="#F8FAFC" font-size="12.5"><tspan fill="#3B82F6" font-weight="700">FK </tspan>profile_id UUID</text>
            <text x="14" y="122" fill="#F8FAFC" font-size="12.5">override_type VARCHAR</text>
            <text x="14" y="148" fill="#F8FAFC" font-size="12.5">from_month INT | amount</text>
          </g>
        </svg>
      `;
    }
  },

  goals: {
    key: 'goals',
    title: '🎯 4. เป้าหมายเงินออม & สำรองฉุกเฉิน (Savings Goals & Wealth)',
    desc: 'จัดเก็บเป้าหมายการเงิน, เงินสำรองฉุกเฉิน 3-6 เดือน โดยยอดเงินออมจริงจะคำนวณแบบ Dynamic จากยอดรวมธุรกรรม (SUM transactions) เพื่อป้องกันข้อมูลขัดแย้ง',
    tableCount: 1,
    fkCount: 2,
    tables: ['savings_goals'],
    renderSvg: function() {
      return `
        <svg viewBox="0 0 680 230" class="subdiagram-svg">
          <g transform="translate(20, 20)" class="svg-node" onclick="inspectTable('savings_goals')">
            <rect width="640" height="185" rx="10" fill="#0F172A" stroke="#10B981" stroke-width="2.5" />
            <rect width="640" height="42" rx="10" fill="#064E3B" />
            <text x="18" y="27" fill="#FFF" font-weight="700" font-size="16">🎯 savings_goals (เป้าหมายเงินออม & สำรองฉุกเฉิน)</text>
            <text x="622" y="27" fill="#6EE7B7" font-size="11" font-weight="600" text-anchor="end">[WEALTH]</text>
            
            <text x="18" y="72" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID | <tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
            <text x="18" y="98" fill="#F8FAFC" font-size="13">title VARCHAR(150) — เช่น กองทุนสำรองฉุกเฉิน 6 เดือน, เที่ยวญี่ปุ่น, ดาวน์บ้าน</text>
            <text x="18" y="124" fill="#10B981" font-size="14" font-weight="800">target_amount DECIMAL(18,2) | initial_amount DECIMAL(18,2)</text>
            <text x="18" y="150" fill="#F8FAFC" font-size="13">monthly_contribution DECIMAL | target_date DATE | expected_return_rate %</text>
            <text x="18" y="174" fill="#38BDF8" font-size="12">💡 ยอดเงินออมสะสม = initial_amount + SUM(transactions ที่ผูกกับ goal_id นี้)</text>
          </g>
        </svg>
      `;
    }
  },

  budget: {
    key: 'budget',
    title: '🥧 5. สัดส่วนงบประมาณ 50/30/20 & 6 Jars (Budget Allocation)',
    desc: 'บริหารสัดส่วนรายได้ตามทฤษฎีการเงินยอดนิยม (Needs 50%, Wants 30%, Savings 20% หรือ 6 Jars) พร้อมจับคู่หมวดหมู่รายจ่ายเข้าถังงบประมาณ เพื่อวิเคราะห์ผลการใช้เงินจริงเปรียบเทียบงบ',
    tableCount: 3,
    fkCount: 4,
    tables: ['allocation_settings', 'allocation_buckets', 'allocation_bucket_categories'],
    renderSvg: function() {
      return `
        <svg viewBox="0 0 920 250" class="subdiagram-svg">
          <defs>
            <marker id="sub-arr-bud" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#F59E0B"/>
            </marker>
          </defs>
          <path d="M 290 110 L 350 110" stroke="#F59E0B" stroke-width="2.5" marker-end="url(#sub-arr-bud)" />
          <path d="M 620 110 L 670 110" stroke="#F59E0B" stroke-width="2.5" marker-end="url(#sub-arr-bud)" />

          <!-- allocation_settings -->
          <g transform="translate(20, 20)" class="svg-node" onclick="inspectTable('allocation_settings')">
            <rect width="270" height="185" rx="10" fill="#0F172A" stroke="#F59E0B" stroke-width="2.5" />
            <rect width="270" height="40" rx="10" fill="#78350F" />
            <text x="16" y="26" fill="#FFF" font-weight="700" font-size="15">🥧 allocation_settings</text>
            <text x="254" y="26" fill="#FCD34D" font-size="11" font-weight="600" text-anchor="end">[FORMULA]</text>
            <text x="16" y="70" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="16" y="96" fill="#FCD34D" font-size="13" font-weight="700">rule_key (50-30-20 | 6jars)</text>
            <text x="16" y="122" fill="#10B981" font-size="13" font-weight="700">monthly_income DECIMAL</text>
            <text x="16" y="148" fill="#94A3B8" font-size="12">UQ(user_id)</text>
          </g>

          <!-- allocation_buckets -->
          <g transform="translate(350, 20)" class="svg-node" onclick="inspectTable('allocation_buckets')">
            <rect width="270" height="185" rx="10" fill="#0F172A" stroke="#F59E0B" stroke-width="2.5" />
            <rect width="270" height="40" rx="10" fill="#78350F" />
            <text x="16" y="26" fill="#FFF" font-weight="700" font-size="15">🪣 allocation_buckets</text>
            <text x="254" y="26" fill="#FCD34D" font-size="11" font-weight="600" text-anchor="end">[BUCKETS]</text>
            <text x="16" y="70" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="16" y="96" fill="#F8FAFC" font-size="12.5">bucket_key (needs, wants, savings)</text>
            <text x="16" y="122" fill="#FCD34D" font-size="13" font-weight="700">target_percent DECIMAL(5,2)</text>
            <text x="16" y="148" fill="#94A3B8" font-size="12">color, sort_order</text>
          </g>

          <!-- allocation_bucket_categories -->
          <g transform="translate(670, 30)" class="svg-node" onclick="inspectTable('allocation_bucket_categories')">
            <rect width="230" height="165" rx="10" fill="#0F172A" stroke="#F59E0B" stroke-width="2" />
            <rect width="230" height="38" rx="10" fill="#78350F" />
            <text x="14" y="25" fill="#FFF" font-weight="700" font-size="14">🔗 bucket_categories</text>
            <text x="14" y="68" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id BIGINT</text>
            <text x="14" y="94" fill="#F8FAFC" font-size="12.5"><tspan fill="#3B82F6" font-weight="700">FK </tspan>bucket_id UUID</text>
            <text x="14" y="120" fill="#F8FAFC" font-size="12.5"><tspan fill="#3B82F6" font-weight="700">FK </tspan>category_id UUID</text>
            <text x="14" y="146" fill="#94A3B8" font-size="11.5">UQ(bucket_id, category_id)</text>
          </g>
        </svg>
      `;
    }
  },

  tax: {
    key: 'tax',
    title: '🧾 6. วางแผนภาษีเงินได้บุคคลธรรมดา ภ.ง.ด. 90/91 (Thai Tax 2026)',
    desc: 'โมดูลคำนวณภาษีบุคคลธรรมดาของไทย รองรับเงินได้ ม.40(1) เงินเดือนโบนัส, สิทธิลดหย่อนครบทุกประเภท (ส่วนตัว, คู่สมรส, บุตร, ประกัน, ดอกเบี้ยบ้าน) กองทุนลดหย่อนปี 2026 (SSF, RMF, ThaiESG แยกวงเงิน 300,000 บาท) พร้อมตารางอัตราภาษีขั้นบันได 0%-35%',
    tableCount: 2,
    fkCount: 2,
    tables: ['tax_settings', 'tax_bracket_rules'],
    renderSvg: function() {
      return `
        <svg viewBox="0 0 840 260" class="subdiagram-svg">
          <defs>
            <marker id="sub-arr-tax" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#8B5CF6"/>
            </marker>
          </defs>
          <path d="M 400 120 L 470 120" stroke="#8B5CF6" stroke-width="2.5" marker-end="url(#sub-arr-tax)" />

          <!-- tax_settings -->
          <g transform="translate(20, 20)" class="svg-node" onclick="inspectTable('tax_settings')">
            <rect width="380" height="215" rx="10" fill="#0F172A" stroke="#8B5CF6" stroke-width="2.5" />
            <rect width="380" height="40" rx="10" fill="#4C1D95" />
            <text x="18" y="26" fill="#FFF" font-weight="700" font-size="15">🧾 tax_settings (วางแผนภาษีประจำปี)</text>
            <text x="362" y="26" fill="#C4B5FD" font-size="11" font-weight="600" text-anchor="end">[ภ.ง.ด. 90/91]</text>
            
            <text x="18" y="70" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID | <tspan fill="#C4B5FD" font-weight="700">tax_year: 2026</tspan></text>
            <text x="18" y="95" fill="#F8FAFC" font-size="12.5">annual_salary DECIMAL(18,2) (ม.40(1))</text>
            <text x="18" y="120" fill="#F8FAFC" font-size="12.5">personal_deduction: 60,000 บาท</text>
            <text x="18" y="145" fill="#C4B5FD" font-size="12.5" font-weight="600">ssf, rmf, thai_esg (แยกสิทธิ์ 300k)</text>
            <text x="18" y="170" fill="#F8FAFC" font-size="12.5">mortgage_interest (max 100k), withholding_tax</text>
            <text x="18" y="195" fill="#94A3B8" font-size="12">UQ(user_id, tax_year)</text>
          </g>

          <!-- tax_bracket_rules -->
          <g transform="translate(470, 20)" class="svg-node" onclick="inspectTable('tax_bracket_rules')">
            <rect width="340" height="215" rx="10" fill="#0F172A" stroke="#8B5CF6" stroke-width="2" />
            <rect width="340" height="40" rx="10" fill="#4C1D95" />
            <text x="18" y="26" fill="#FFF" font-weight="700" font-size="15">🏛️ tax_bracket_rules (สรรพากร)</text>
            <text x="322" y="26" fill="#C4B5FD" font-size="11" font-weight="600" text-anchor="end">[TAX BRACKETS]</text>
            
            <text x="18" y="70" fill="#F8FAFC" font-size="12.5">0 - 150,000 บาท : <tspan fill="#10B981" font-weight="700">ยกเว้นภาษี (0%)</tspan></text>
            <text x="18" y="95" fill="#F8FAFC" font-size="12.5">150,001 - 300,000 บาท : <tspan fill="#C4B5FD" font-weight="700">5%</tspan></text>
            <text x="18" y="120" fill="#F8FAFC" font-size="12.5">300,001 - 500,000 บาท : <tspan fill="#C4B5FD" font-weight="700">10%</tspan></text>
            <text x="18" y="145" fill="#F8FAFC" font-size="12.5">500,001 - 750,000 บาท : <tspan fill="#C4B5FD" font-weight="700">15%</tspan></text>
            <text x="18" y="170" fill="#F8FAFC" font-size="12.5">... สูงสุดมากกว่า 5,000,000 บาท : <tspan fill="#F43F5E" font-weight="700">35%</tspan></text>
            <text x="18" y="195" fill="#94A3B8" font-size="11.5">อ้างอิงประกาศกระทรวงการคลัง</text>
          </g>
        </svg>
      `;
    }
  },

  sim: {
    key: 'sim',
    title: '🔮 7. จำลองสภาพคล่องการซื้อของ (Can I Afford It?)',
    desc: 'ทดสอบคำนวณผลกระทบต่อกระแสเงินสดก่อนตัดสินใจซื้อสินค้าหรือของชิ้นใหญ่ (จ่ายสด vs ผ่อน 0% เทียบกับเงินคงเหลือในบัญชีและภาระหนี้)',
    tableCount: 1,
    fkCount: 1,
    tables: ['affordability_simulations'],
    renderSvg: function() {
      return `
        <svg viewBox="0 0 680 220" class="subdiagram-svg">
          <g transform="translate(20, 20)" class="svg-node" onclick="inspectTable('affordability_simulations')">
            <rect width="640" height="175" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2.5" />
            <rect width="640" height="40" rx="10" fill="#1E293B" />
            <text x="18" y="26" fill="#FFF" font-weight="700" font-size="15">🔮 affordability_simulations (แบบจำลอง)</text>
            <text x="622" y="26" fill="#60A5FA" font-size="11" font-weight="600" text-anchor="end">[SIMULATION]</text>
            <text x="18" y="70" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID | <tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
            <text x="18" y="96" fill="#F8FAFC" font-size="13">item_name VARCHAR(150) | item_price DECIMAL(18,2)</text>
            <text x="18" y="122" fill="#F8FAFC" font-size="13">installments INT (งวดผ่อน) | monthly_payment DECIMAL(18,2)</text>
            <text x="18" y="148" fill="#10B981" font-size="13.5" font-weight="700">feasibility_status: safe | caution | danger</text>
          </g>
        </svg>
      `;
    }
  },

  auth: {
    key: 'auth',
    title: '👤 8. สมาชิก, เซสชัน & ความยินยอม PDPA (Auth & PDPA)',
    desc: 'ระบบยืนยันตัวตน (Local Email/Password, OAuth Google/Facebook, Guest Mode), จัดการ Token Session แบบ Stateless และบันทึกหลักฐานความยินยอมคุกกี้ตามกฎหมาย PDPA ของไทย',
    tableCount: 3,
    fkCount: 3,
    tables: ['users', 'user_refresh_tokens', 'user_consents'],
    renderSvg: function() {
      return `
        <svg viewBox="0 0 920 270" class="subdiagram-svg">
          <defs>
            <marker id="sub-arr-auth" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38BDF8"/>
            </marker>
          </defs>
          <path d="M 300 90 L 360 90" stroke="#38BDF8" stroke-width="2.5" marker-end="url(#sub-arr-auth)" />
          <path d="M 300 170 L 640 170" stroke="#38BDF8" stroke-width="2.5" marker-end="url(#sub-arr-auth)" />

          <!-- users -->
          <g transform="translate(20, 20)" class="svg-node" onclick="inspectTable('users')">
            <rect width="280" height="220" rx="10" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5" />
            <rect width="280" height="40" rx="10" fill="#0369A1" />
            <text x="16" y="26" fill="#FFF" font-weight="700" font-size="15">👤 users (ศูนย์กลาง)</text>
            <text x="264" y="26" fill="#BAE6FD" font-size="11" font-weight="600" text-anchor="end">[AUTH]</text>
            <text x="16" y="70" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="16" y="96" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">UQ </tspan>email VARCHAR(256)</text>
            <text x="16" y="122" fill="#94A3B8" font-size="12.5">password_hash VARCHAR(512)</text>
            <text x="16" y="148" fill="#F8FAFC" font-size="12.5">display_name, auth_provider</text>
            <text x="16" y="174" fill="#F8FAFC" font-size="12.5">is_guest, is_active, created_at</text>
          </g>

          <!-- user_refresh_tokens -->
          <g transform="translate(360, 20)" class="svg-node" onclick="inspectTable('user_refresh_tokens')">
            <rect width="250" height="165" rx="10" fill="#0F172A" stroke="#38BDF8" stroke-width="2" />
            <rect width="250" height="40" rx="10" fill="#1E293B" />
            <text x="14" y="26" fill="#FFF" font-weight="700" font-size="14">🔑 user_refresh_tokens</text>
            <text x="14" y="70" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id BIGINT</text>
            <text x="14" y="96" fill="#F8FAFC" font-size="12.5"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
            <text x="14" y="122" fill="#F8FAFC" font-size="12.5">token_hash, expires_at</text>
          </g>

          <!-- user_consents -->
          <g transform="translate(640, 50)" class="svg-node" onclick="inspectTable('user_consents')">
            <rect width="260" height="180" rx="10" fill="#0F172A" stroke="#38BDF8" stroke-width="2" />
            <rect width="260" height="40" rx="10" fill="#1E293B" />
            <text x="14" y="26" fill="#FFF" font-weight="700" font-size="14">🛡️ user_consents (PDPA)</text>
            <text x="14" y="70" fill="#F8FAFC" font-size="12.5"><tspan fill="#EAB308" font-weight="700">PK </tspan>id BIGINT</text>
            <text x="14" y="96" fill="#F8FAFC" font-size="12.5"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID (Null=Guest)</text>
            <text x="14" y="122" fill="#F8FAFC" font-size="12.5">policy_version: '1.0'</text>
            <text x="14" y="148" fill="#94A3B8" font-size="12">necessary, analytics, marketing</text>
          </g>
        </svg>
      `;
    }
  },

  security: {
    key: 'security',
    title: '🛡️ 9. สำรองข้อมูล & ตรวจสอบประวัติ (Backup & Audit Logs)',
    desc: 'ระบบส่งออก/นำเข้าสำรองข้อมูล JSON และ CSV สำหรับผู้ใช้งาน พร้อมบันทึกประวัติการกระทำสำคัญและความปลอดภัย (Security Audit Trail)',
    tableCount: 2,
    fkCount: 2,
    tables: ['user_backups', 'audit_logs'],
    renderSvg: function() {
      return `
        <svg viewBox="0 0 720 240" class="subdiagram-svg">
          <!-- user_backups -->
          <g transform="translate(20, 20)" class="svg-node" onclick="inspectTable('user_backups')">
            <rect width="320" height="190" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" />
            <rect width="320" height="40" rx="10" fill="#1E293B" />
            <text x="16" y="26" fill="#FFF" font-weight="700" font-size="15">💾 user_backups (สำรองข้อมูล)</text>
            <text x="304" y="26" fill="#60A5FA" font-size="11" font-weight="600" text-anchor="end">[BACKUP]</text>
            <text x="16" y="70" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
            <text x="16" y="96" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
            <text x="16" y="122" fill="#38BDF8" font-size="13">backup_type: json_full | csv</text>
            <text x="16" y="148" fill="#F8FAFC" font-size="13">schema_version, file_size_bytes</text>
          </g>

          <!-- audit_logs -->
          <g transform="translate(380, 20)" class="svg-node" onclick="inspectTable('audit_logs')">
            <rect width="320" height="190" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" />
            <rect width="320" height="40" rx="10" fill="#1E293B" />
            <text x="16" y="26" fill="#FFF" font-weight="700" font-size="15">📋 audit_logs (Audit Trail)</text>
            <text x="304" y="26" fill="#60A5FA" font-size="11" font-weight="600" text-anchor="end">[AUDIT]</text>
            <text x="16" y="70" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id BIGINT</text>
            <text x="16" y="96" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID (Set Null)</text>
            <text x="16" y="122" fill="#F8FAFC" font-size="13">action: LOGIN, EXPORT_DATA</text>
            <text x="16" y="148" fill="#94A3B8" font-size="12">ip_address, user_agent, created_at</text>
          </g>
        </svg>
      `;
    }
  },

  all: {
    key: 'all',
    title: '🌟 ภาพรวมสถาปัตยกรรมทั้ง 10 กลุ่ม 21 ตาราง (Full System Architecture)',
    desc: 'โครงสร้างฐานข้อมูลองค์รวมที่ออกแบบครอบคลุมทุกมิติทางการเงินของผู้ใช้งานคนไทย ประกอบด้วย 10 โดเมน 21 ตาราง เชื่อมโยงกันอย่างไร้รอยต่อ',
    tableCount: 21,
    fkCount: 28,
    tables: [
      'transactions', 'accounts', 'categories', 'payment_methods',
      'fixed_costs', 'fixed_cost_payments',
      'debts', 'debt_budget_profiles', 'debt_schedule_overrides',
      'savings_goals',
      'allocation_settings', 'allocation_buckets', 'allocation_bucket_categories',
      'tax_settings', 'tax_bracket_rules',
      'affordability_simulations',
      'users', 'user_refresh_tokens', 'user_consents', 'user_backups', 'audit_logs'
    ],
    renderSvg: function() {
      return `
        <div style="display: flex; flex-direction: column; align-items: center; width: 100%; gap: 1rem;">
          <div style="display: flex; align-items: center; justify-content: space-between; width: 100%; max-width: 960px; padding: 0 0.5rem; flex-wrap: wrap; gap: 0.5rem;">
            <span style="font-size: 0.9rem; color: #93C5FD; font-weight: 700;">🗺️ แผนผังภาพรวมการเชื่อมต่อระหว่าง 10 ระบบงาน (10 Financial Domains):</span>
            <button class="btn btn-primary" onclick="switchView('canvas')" style="padding: 0.4rem 0.85rem; font-size: 0.8rem;">
              <span>🔍</span> ขยายดูแผนผังใหญ่ 21 ตาราง (Drag & Pan)
            </button>
          </div>

          <svg viewBox="0 0 960 460" class="subdiagram-svg" style="max-width: 960px;">
            <defs>
              <marker id="all-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#3B82F6"/>
              </marker>
            </defs>

            <!-- Connections from users (left) to central core (center) -->
            <path d="M 230 110 L 370 110" stroke="#38BDF8" stroke-width="2.5" marker-end="url(#all-arr)" />
            <path d="M 230 130 L 370 230" stroke="#3B82F6" stroke-width="2.5" marker-end="url(#all-arr)" />
            
            <!-- Connections from central core to other modules -->
            <path d="M 590 110 L 710 70" stroke="#F43F5E" stroke-width="2" marker-end="url(#all-arr)" />
            <path d="M 590 125 L 710 160" stroke="#EC4899" stroke-width="2" marker-end="url(#all-arr)" />
            <path d="M 590 145 L 710 250" stroke="#10B981" stroke-width="2" marker-end="url(#all-arr)" />
            <path d="M 590 250 L 710 340" stroke="#F59E0B" stroke-width="2" marker-end="url(#all-arr)" />
            
            <!-- Bottom connects -->
            <path d="M 480 300 L 480 370" stroke="#8B5CF6" stroke-width="2" marker-end="url(#all-arr)" />
            <path d="M 125 180 L 125 240" stroke="#38BDF8" stroke-width="2" marker-end="url(#all-arr)" />
            <path d="M 125 325 L 125 370" stroke="#3B82F6" stroke-width="2" marker-end="url(#all-arr)" />

            <!-- MODULE 1: AUTH & IDENTITY -->
            <g transform="translate(20, 40)" class="svg-node" onclick="onDomainChange('auth')">
              <rect width="210" height="140" rx="12" fill="#0F172A" stroke="#38BDF8" stroke-width="2.5" />
              <rect width="210" height="36" rx="12" fill="#0369A1" />
              <text x="14" y="24" fill="#FFF" font-weight="700" font-size="13.5">👤 1. Auth & PDPA</text>
              <text x="14" y="65" fill="#F8FAFC" font-size="12">• users (ตารางศูนย์กลาง)</text>
              <text x="14" y="90" fill="#94A3B8" font-size="12">• user_refresh_tokens</text>
              <text x="14" y="115" fill="#94A3B8" font-size="12">• user_consents (PDPA)</text>
            </g>

            <!-- MODULE 2: ACCOUNTS & ASSETS -->
            <g transform="translate(370, 40)" class="svg-node" onclick="onDomainChange('core')">
              <rect width="220" height="140" rx="12" fill="#0F172A" stroke="#3B82F6" stroke-width="2.5" />
              <rect width="220" height="36" rx="12" fill="#1D4ED8" />
              <text x="14" y="24" fill="#FFF" font-weight="700" font-size="13.5">🏦 2. กระเป๋า & บัญชีเงินจริง</text>
              <text x="14" y="65" fill="#F8FAFC" font-size="12">• accounts (ธนาคาร/Kept/สด)</text>
              <text x="14" y="90" fill="#94A3B8" font-size="12">• payment_methods (ช่องทาง)</text>
              <text x="14" y="115" fill="#10B981" font-size="12" font-weight="600">Net Worth & Balances</text>
            </g>

            <!-- MODULE 3: TRANSACTIONS & CATEGORIES (HUB) -->
            <g transform="translate(370, 200)" class="svg-node" onclick="onDomainChange('core')">
              <rect width="220" height="110" rx="12" fill="#091328" stroke="#2563EB" stroke-width="3" />
              <rect width="220" height="36" rx="12" fill="#1E40AF" />
              <text x="14" y="24" fill="#FFF" font-weight="800" font-size="14">💸 3. ธุรกรรมหลัก (LEDGER)</text>
              <text x="14" y="65" fill="#F8FAFC" font-size="12.5" font-weight="600">• transactions (ศูนย์กลาง)</text>
              <text x="14" y="90" fill="#94A3B8" font-size="12">• categories (หมวดหมู่)</text>
            </g>

            <!-- MODULE 4: FIXED COSTS -->
            <g transform="translate(710, 20)" class="svg-node" onclick="onDomainChange('fixed')">
              <rect width="230" height="85" rx="10" fill="#0F172A" stroke="#F43F5E" stroke-width="2" />
              <rect width="230" height="32" rx="10" fill="#881337" />
              <text x="12" y="21" fill="#FFF" font-weight="700" font-size="12.5">🗓️ 4. ค่าใช้จ่ายประจำ (Bills)</text>
              <text x="12" y="54" fill="#F8FAFC" font-size="11.5">• fixed_costs (ภาระรายเดือน)</text>
              <text x="12" y="74" fill="#94A3B8" font-size="11.5">• fixed_cost_payments (ประวัติ)</text>
            </g>

            <!-- MODULE 5: DEBT PLANNER -->
            <g transform="translate(710, 115)" class="svg-node" onclick="onDomainChange('debt')">
              <rect width="230" height="95" rx="10" fill="#0F172A" stroke="#EC4899" stroke-width="2" />
              <rect width="230" height="32" rx="10" fill="#831843" />
              <text x="12" y="21" fill="#FFF" font-weight="700" font-size="12.5">📉 5. แผนปลดหนี้ 3 รูปแบบ</text>
              <text x="12" y="52" fill="#F8FAFC" font-size="11.5">• debts (ลดต้นดอก/เช่าซื้อ/0%)</text>
              <text x="12" y="72" fill="#94A3B8" font-size="11.5">• debt_budget_profiles</text>
              <text x="12" y="88" fill="#94A3B8" font-size="11">• debt_schedule_overrides</text>
            </g>

            <!-- MODULE 6: SAVINGS GOALS -->
            <g transform="translate(710, 220)" class="svg-node" onclick="onDomainChange('goals')">
              <rect width="230" height="75" rx="10" fill="#0F172A" stroke="#10B981" stroke-width="2" />
              <rect width="230" height="32" rx="10" fill="#064E3B" />
              <text x="12" y="21" fill="#FFF" font-weight="700" font-size="12.5">🎯 6. เป้าหมายเงินออม (Wealth)</text>
              <text x="12" y="54" fill="#F8FAFC" font-size="11.5">• savings_goals (สำรองฉุกเฉิน)</text>
              <text x="12" y="68" fill="#6EE7B7" font-size="10.5">ยอดออมคำนวณจาก SUM Transactions</text>
            </g>

            <!-- MODULE 7: BUDGET 50/30/20 -->
            <g transform="translate(710, 305)" class="svg-node" onclick="onDomainChange('budget')">
              <rect width="230" height="95" rx="10" fill="#0F172A" stroke="#F59E0B" stroke-width="2" />
              <rect width="230" height="32" rx="10" fill="#78350F" />
              <text x="12" y="21" fill="#FFF" font-weight="700" font-size="12.5">🥧 7. สัดส่วนงบประมาณ 50/30/20</text>
              <text x="12" y="52" fill="#F8FAFC" font-size="11.5">• allocation_settings (สูตร)</text>
              <text x="12" y="70" fill="#94A3B8" font-size="11.5">• allocation_buckets (ถังงบ)</text>
              <text x="12" y="88" fill="#94A3B8" font-size="11">• bucket_categories (ผูกหมวดหมู่)</text>
            </g>

            <!-- MODULE 8: THAI TAX -->
            <g transform="translate(370, 360)" class="svg-node" onclick="onDomainChange('tax')">
              <rect width="220" height="85" rx="10" fill="#0F172A" stroke="#8B5CF6" stroke-width="2" />
              <rect width="220" height="32" rx="10" fill="#4C1D95" />
              <text x="12" y="21" fill="#FFF" font-weight="700" font-size="12.5">🧾 8. ภาษี ภ.ง.ด. 90/91 (2026)</text>
              <text x="12" y="52" fill="#F8FAFC" font-size="11.5">• tax_settings (เงินได้ & ลดหย่อน)</text>
              <text x="12" y="72" fill="#94A3B8" font-size="11.5">• tax_bracket_rules (0-35%)</text>
            </g>

            <!-- MODULE 9: SIMULATION -->
            <g transform="translate(20, 240)" class="svg-node" onclick="onDomainChange('sim')">
              <rect width="210" height="85" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" />
              <rect width="210" height="32" rx="10" fill="#1E293B" />
              <text x="12" y="21" fill="#FFF" font-weight="700" font-size="12.5">🔮 9. จำลองการซื้อของ</text>
              <text x="12" y="54" fill="#F8FAFC" font-size="11.5">• affordability_simulations</text>
              <text x="12" y="74" fill="#94A3B8" font-size="11">Can I Afford It? Simulator</text>
            </g>

            <!-- MODULE 10: BACKUP & AUDIT -->
            <g transform="translate(20, 345)" class="svg-node" onclick="onDomainChange('security')">
              <rect width="210" height="95" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" />
              <rect width="210" height="32" rx="10" fill="#1E293B" />
              <text x="12" y="21" fill="#FFF" font-weight="700" font-size="12.5">🛡️ 10. สำรอง & ความปลอดภัย</text>
              <text x="12" y="54" fill="#F8FAFC" font-size="11.5">• user_backups (JSON/CSV)</text>
              <text x="12" y="74" fill="#94A3B8" font-size="11.5">• audit_logs (Audit Trail)</text>
            </g>
          </svg>
        </div>
      `;
    }
  }
};
