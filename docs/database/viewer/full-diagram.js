/**
 * Walletly (FinSmart Thai) - Full 21-Table SVG Canvas Map
 * Generates clean, non-overlapping SVG structure for all 21 tables.
 */

function renderFullDiagramSvg() {
  return `
    <svg id="full-svg" width="2450" height="1750" viewBox="0 0 2450 1750" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <marker id="full-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 1 L 10 5 L 0 9 z" fill="#3B82F6"/>
        </marker>
        <marker id="full-dot" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5">
          <circle cx="5" cy="5" r="4" fill="#60A5FA" />
        </marker>
        <filter id="full-card-shadow" x="-10%" y="-10%" width="120%" height="125%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000000" flood-opacity="0.65"/>
        </filter>
      </defs>

      <!-- ================= RELATIONSHIP CONNECTOR LINES ================= -->
      <g id="full-rel-lines">
        <!-- users -> user_refresh_tokens -->
        <path d="M 210 330 L 210 380" class="rel-line auth" marker-end="url(#full-arrow)" />
        <!-- users -> user_consents -->
        <path d="M 210 560 L 210 610" class="rel-line auth" marker-end="url(#full-arrow)" />
        <!-- users -> user_backups -->
        <path d="M 210 830 L 210 880" class="rel-line auth" marker-end="url(#full-arrow)" />
        <!-- users -> audit_logs -->
        <path d="M 210 1060 L 210 1110" class="rel-line auth" marker-end="url(#full-arrow)" />

        <!-- users -> accounts -->
        <path d="M 360 210 L 420 210" class="rel-line core" marker-end="url(#full-arrow)" />
        <!-- users -> categories -->
        <path d="M 360 160 L 780 160" class="rel-line core" marker-end="url(#full-arrow)" />
        <!-- users -> transactions -->
        <path d="M 360 270 L 780 480" class="rel-line core" marker-end="url(#full-arrow)" />
        <!-- users -> affordability_simulations -->
        <path d="M 360 290 L 420 670" class="rel-line core" marker-end="url(#full-arrow)" />

        <!-- accounts -> payment_methods -->
        <path d="M 570 340 L 570 410" class="rel-line core" marker-end="url(#full-arrow)" />
        <!-- accounts -> transactions -->
        <path d="M 720 230 L 780 440" class="rel-line core" marker-end="url(#full-arrow)" />
        <!-- payment_methods -> transactions -->
        <path d="M 720 500 L 780 500" class="rel-line core" marker-end="url(#full-arrow)" />
        <!-- categories -> transactions -->
        <path d="M 930 330 L 930 410" class="rel-line core" marker-end="url(#full-arrow)" />

        <!-- users -> fixed_costs -->
        <path d="M 360 130 L 1220 130" class="rel-line fixed" marker-end="url(#full-arrow)" />
        <!-- categories -> fixed_costs -->
        <path d="M 1080 200 L 1220 200" class="rel-line fixed" marker-end="url(#full-arrow)" />
        <!-- fixed_costs -> fixed_cost_payments -->
        <path d="M 1370 330 L 1370 410" class="rel-line fixed" marker-end="url(#full-arrow)" />
        <!-- transactions -> fixed_cost_payments -->
        <path d="M 1080 470 L 1220 470" class="rel-line fixed" marker-end="url(#full-dot)" />

        <!-- users -> debts -->
        <path d="M 360 320 L 780 820" class="rel-line debt" marker-end="url(#full-arrow)" />
        <!-- debts -> transactions -->
        <path d="M 930 790 L 930 740" class="rel-line debt" marker-end="url(#full-dot)" />
        <!-- debts -> fixed_costs -->
        <path d="M 1080 820 C 1180 820, 1180 270, 1220 270" class="rel-line debt" marker-end="url(#full-arrow)" />
        <!-- debt_budget_profiles -> debt_schedule_overrides -->
        <path d="M 1370 880 L 1370 940" class="rel-line debt" marker-end="url(#full-arrow)" />

        <!-- users -> allocation_settings -->
        <path d="M 360 110 L 1660 110" class="rel-line budget" marker-end="url(#full-arrow)" />
        <!-- allocation_settings -> allocation_buckets -->
        <path d="M 1810 280 L 1810 340" class="rel-line budget" marker-end="url(#full-arrow)" />
        <!-- allocation_buckets -> allocation_bucket_categories -->
        <path d="M 1810 520 L 1810 580" class="rel-line budget" marker-end="url(#full-arrow)" />
        <!-- categories -> allocation_bucket_categories -->
        <path d="M 1080 240 C 1400 240, 1500 620, 1660 620" class="rel-line budget" marker-end="url(#full-arrow)" />

        <!-- users -> savings_goals -->
        <path d="M 360 250 C 1200 250, 1500 810, 1660 810" class="rel-line goals" marker-end="url(#full-arrow)" />
        <!-- transactions -> savings_goals -->
        <path d="M 1080 550 C 1350 550, 1500 860, 1660 860" class="rel-line goals" marker-end="url(#full-dot)" />

        <!-- users -> tax_settings -->
        <path d="M 360 120 C 1400 120, 1500 1110, 1660 1110" class="rel-line tax" marker-end="url(#full-arrow)" />
        <!-- tax_settings -> tax_bracket_rules -->
        <path d="M 1810 1370 L 1810 1430" class="rel-line tax" marker-end="url(#full-arrow)" />
      </g>

      <!-- ================= COLUMN 1: AUTH & PDPA ================= -->
      <!-- 1. users -->
      <g class="full-node auth" id="full-node-users" onclick="inspectTable('users')" transform="translate(60, 100)">
        <rect width="300" height="230" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2.5" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#1E293B" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="16">👤 users</text>
        <text x="282" y="27" fill="#60A5FA" font-size="11.5" font-weight="600" text-anchor="end">[AUTH]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">UQ </tspan>email VARCHAR(256)</text>
        <text x="18" y="120" fill="#94A3B8" font-size="13">password_hash VARCHAR(512)</text>
        <text x="18" y="146" fill="#F8FAFC" font-size="13">display_name VARCHAR(128)</text>
        <text x="18" y="172" fill="#F8FAFC" font-size="13">auth_provider VARCHAR(32)</text>
        <text x="18" y="198" fill="#94A3B8" font-size="13">is_guest / is_active BOOLEAN</text>
        <text x="18" y="222" fill="#64748B" font-size="11.5">created_at, updated_at</text>
      </g>

      <!-- 2. user_refresh_tokens -->
      <g class="full-node auth" id="full-node-user_refresh_tokens" onclick="inspectTable('user_refresh_tokens')" transform="translate(60, 380)">
        <rect width="300" height="180" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#1E293B" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">🔑 user_refresh_tokens</text>
        <text x="282" y="27" fill="#60A5FA" font-size="11.5" font-weight="600" text-anchor="end">[SESSION]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id BIGINT</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">token_hash VARCHAR(256)</text>
        <text x="18" y="146" fill="#94A3B8" font-size="13">expires_at / revoked_at</text>
      </g>

      <!-- 3. user_consents -->
      <g class="full-node auth" id="full-node-user_consents" onclick="inspectTable('user_consents')" transform="translate(60, 610)">
        <rect width="300" height="220" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#1E293B" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">🛡️ user_consents</text>
        <text x="282" y="27" fill="#60A5FA" font-size="11.5" font-weight="600" text-anchor="end">[PDPA]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id BIGINT</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID (Null=Guest)</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">policy_version: 1.0</text>
        <text x="18" y="146" fill="#F8FAFC" font-size="13">necessary: 1, functional: 1</text>
        <text x="18" y="172" fill="#94A3B8" font-size="13">analytics, marketing</text>
        <text x="18" y="198" fill="#64748B" font-size="11.5">ip_address, consented_at</text>
      </g>

      <!-- 4. user_backups -->
      <g class="full-node security" id="full-node-user_backups" onclick="inspectTable('user_backups')" transform="translate(60, 880)">
        <rect width="300" height="180" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#1E293B" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">💾 user_backups</text>
        <text x="282" y="27" fill="#60A5FA" font-size="11.5" font-weight="600" text-anchor="end">[BACKUP]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
        <text x="18" y="120" fill="#38BDF8" font-size="13">backup_type: json | csv</text>
        <text x="18" y="146" fill="#94A3B8" font-size="13">schema_version, file_size_bytes</text>
      </g>

      <!-- 5. audit_logs -->
      <g class="full-node security" id="full-node-audit_logs" onclick="inspectTable('audit_logs')" transform="translate(60, 1110)">
        <rect width="300" height="190" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#1E293B" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">📋 audit_logs</text>
        <text x="282" y="27" fill="#60A5FA" font-size="11.5" font-weight="600" text-anchor="end">[AUDIT]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id BIGINT</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID (Set Null)</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">action: LOGIN, EXPORT</text>
        <text x="18" y="146" fill="#94A3B8" font-size="13">entity_name, entity_id</text>
      </g>

      <!-- ================= COLUMN 2: ACCOUNTS & SIMULATION ================= -->
      <!-- 6. accounts -->
      <g class="full-node core" id="full-node-accounts" onclick="inspectTable('accounts')" transform="translate(420, 100)">
        <rect width="300" height="240" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2.5" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#1E293B" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="16">🏦 accounts</text>
        <text x="282" y="27" fill="#60A5FA" font-size="11.5" font-weight="600" text-anchor="end">[WALLET]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">name VARCHAR(100)</text>
        <text x="18" y="146" fill="#F8FAFC" font-size="13">account_type VARCHAR(32)</text>
        <text x="18" y="172" fill="#10B981" font-size="13.5" font-weight="700">current_balance DECIMAL</text>
        <text x="18" y="198" fill="#94A3B8" font-size="13">credit_limit DECIMAL</text>
        <text x="18" y="222" fill="#64748B" font-size="11.5">currency: THB | color, icon</text>
      </g>

      <!-- 7. payment_methods -->
      <g class="full-node core" id="full-node-payment_methods" onclick="inspectTable('payment_methods')" transform="translate(420, 410)">
        <rect width="300" height="170" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#1E293B" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">💳 payment_methods</text>
        <text x="282" y="27" fill="#60A5FA" font-size="11.5" font-weight="600" text-anchor="end">[PAYMENT]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">name VARCHAR(100)</text>
        <text x="18" y="146" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>account_id UUID</text>
      </g>

      <!-- 8. affordability_simulations -->
      <g class="full-node sim" id="full-node-affordability_simulations" onclick="inspectTable('affordability_simulations')" transform="translate(420, 640)">
        <rect width="300" height="210" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#1E293B" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">🔮 afford_simulations</text>
        <text x="282" y="27" fill="#60A5FA" font-size="11.5" font-weight="600" text-anchor="end">[SIM]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">item_name / item_price</text>
        <text x="18" y="146" fill="#F8FAFC" font-size="13">installments / monthly_payment</text>
        <text x="18" y="172" fill="#10B981" font-size="13" font-weight="600">status: safe|caution|danger</text>
      </g>

      <!-- ================= COLUMN 3: CATEGORIES, TRANSACTIONS, DEBTS ================= -->
      <!-- 9. categories -->
      <g class="full-node core" id="full-node-categories" onclick="inspectTable('categories')" transform="translate(780, 100)">
        <rect width="300" height="230" rx="10" fill="#0F172A" stroke="#3B82F6" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#1E293B" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="16">🏷️ categories</text>
        <text x="282" y="27" fill="#60A5FA" font-size="11.5" font-weight="600" text-anchor="end">[MASTER]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
        <text x="18" y="120" fill="#38BDF8" font-size="13" font-weight="600">type: income|expense|fixed</text>
        <text x="18" y="146" fill="#F8FAFC" font-size="13">name VARCHAR(128)</text>
        <text x="18" y="172" fill="#94A3B8" font-size="13">color, icon, sort_order</text>
      </g>

      <!-- 10. transactions (HUB) -->
      <g class="full-node core" id="full-node-transactions" onclick="inspectTable('transactions')" transform="translate(780, 410)">
        <rect width="300" height="330" rx="10" fill="#091328" stroke="#2563EB" stroke-width="3" filter="url(#full-card-shadow)" />
        <rect width="300" height="44" rx="10" fill="#1D4ED8" />
        <text x="18" y="28" fill="#FFF" font-weight="800" font-size="17">💸 transactions</text>
        <text x="282" y="28" fill="#93C5FD" font-size="12" font-weight="700" text-anchor="end">[LEDGER]</text>
        
        <text x="18" y="70" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="96" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
        <text x="18" y="122" fill="#38BDF8" font-size="13" font-weight="600">type: income|expense|fixed</text>
        <text x="18" y="148" fill="#10B981" font-size="14" font-weight="800">amount DECIMAL(18,2)</text>
        <text x="18" y="174" fill="#F8FAFC" font-size="13">tx_date DATE</text>
        <text x="18" y="200" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>category_id UUID</text>
        <text x="18" y="226" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>account_id UUID</text>
        <text x="18" y="252" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>savings_goal_id UUID</text>
        <text x="18" y="278" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>fixed_cost_id / debt_id</text>
        <text x="18" y="304" fill="#64748B" font-size="12">note, is_recurring</text>
      </g>

      <!-- 11. debts -->
      <g class="full-node debt" id="full-node-debts" onclick="inspectTable('debts')" transform="translate(780, 790)">
        <rect width="300" height="260" rx="10" fill="#0F172A" stroke="#EC4899" stroke-width="2.5" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#831843" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="16">📉 debts</text>
        <text x="282" y="27" fill="#F472B6" font-size="11.5" font-weight="600" text-anchor="end">[3 TYPES]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">name VARCHAR(150)</text>
        <text x="18" y="146" fill="#F472B6" font-size="13" font-weight="700">type (amort|hirePurchase|0%)</text>
        <text x="18" y="172" fill="#F8FAFC" font-size="13">principal / annual_rate_pct</text>
        <text x="18" y="198" fill="#F8FAFC" font-size="13">monthly_payment, periods_total</text>
        <text x="18" y="224" fill="#38BDF8" font-size="12.5" font-weight="600">settlement_quote (ปิดบัญชี)</text>
      </g>

      <!-- ================= COLUMN 4: FIXED COSTS & DEBT STRATEGY ================= -->
      <!-- 12. fixed_costs -->
      <g class="full-node fixed" id="full-node-fixed_costs" onclick="inspectTable('fixed_costs')" transform="translate(1220, 100)">
        <rect width="300" height="230" rx="10" fill="#0F172A" stroke="#F43F5E" stroke-width="2.5" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#881337" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="16">🗓️ fixed_costs</text>
        <text x="282" y="27" fill="#FDA4AF" font-size="11.5" font-weight="600" text-anchor="end">[BILLS]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id / category_id</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">title VARCHAR(150)</text>
        <text x="18" y="146" fill="#F43F5E" font-size="13.5" font-weight="800">amount DECIMAL(18,2)</text>
        <text x="18" y="172" fill="#F8FAFC" font-size="13">due_day TINYINT (1-31)</text>
        <text x="18" y="198" fill="#94A3B8" font-size="13">is_paid, auto_deduct, linked_debt</text>
      </g>

      <!-- 13. fixed_cost_payments -->
      <g class="full-node fixed" id="full-node-fixed_cost_payments" onclick="inspectTable('fixed_cost_payments')" transform="translate(1220, 410)">
        <rect width="300" height="170" rx="10" fill="#0F172A" stroke="#F43F5E" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#881337" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">🧾 fixed_cost_payments</text>
        <text x="282" y="27" fill="#FDA4AF" font-size="11.5" font-weight="600" text-anchor="end">[HISTORY]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>fixed_cost_id UUID</text>
        <text x="18" y="120" fill="#38BDF8" font-size="13" font-weight="700">period_month DATE</text>
        <text x="18" y="146" fill="#10B981" font-size="13.5" font-weight="800">amount_paid DECIMAL</text>
      </g>

      <!-- 14. debt_budget_profiles -->
      <g class="full-node debt" id="full-node-debt_budget_profiles" onclick="inspectTable('debt_budget_profiles')" transform="translate(1220, 660)">
        <rect width="300" height="220" rx="10" fill="#0F172A" stroke="#EC4899" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#831843" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">📊 debt_budget_profiles</text>
        <text x="282" y="27" fill="#F472B6" font-size="11.5" font-weight="600" text-anchor="end">[STRATEGY]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID (UQ)</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">net_monthly_income DECIMAL</text>
        <text x="18" y="146" fill="#F8FAFC" font-size="13">discretionary_budget DECIMAL</text>
        <text x="18" y="172" fill="#F472B6" font-size="13" font-weight="700">strategy: avalanche|snowball</text>
      </g>

      <!-- 15. debt_schedule_overrides -->
      <g class="full-node debt" id="full-node-debt_schedule_overrides" onclick="inspectTable('debt_schedule_overrides')" transform="translate(1220, 940)">
        <rect width="300" height="170" rx="10" fill="#0F172A" stroke="#EC4899" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#831843" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="14">⏱️ debt_schedule_overrides</text>
        <text x="282" y="27" fill="#F472B6" font-size="11.5" font-weight="600" text-anchor="end">[ENGINE]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id BIGINT</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>profile_id UUID</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">override_type VARCHAR</text>
        <text x="18" y="146" fill="#F8FAFC" font-size="13">from_month INT | amount</text>
      </g>

      <!-- ================= COLUMN 5: BUDGET, SAVINGS & TAX ================= -->
      <!-- 16. allocation_settings -->
      <g class="full-node budget" id="full-node-allocation_settings" onclick="inspectTable('allocation_settings')" transform="translate(1660, 100)">
        <rect width="300" height="170" rx="10" fill="#0F172A" stroke="#F59E0B" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#78350F" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">🥧 allocation_settings</text>
        <text x="282" y="27" fill="#FCD34D" font-size="11.5" font-weight="600" text-anchor="end">[FORMULA]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID (UQ)</text>
        <text x="18" y="120" fill="#FCD34D" font-size="13" font-weight="700">rule_key (50-30-20 | 6jars)</text>
        <text x="18" y="146" fill="#10B981" font-size="13">monthly_income DECIMAL</text>
      </g>

      <!-- 17. allocation_buckets -->
      <g class="full-node budget" id="full-node-allocation_buckets" onclick="inspectTable('allocation_buckets')" transform="translate(1660, 340)">
        <rect width="300" height="180" rx="10" fill="#0F172A" stroke="#F59E0B" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#78350F" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">🪣 allocation_buckets</text>
        <text x="282" y="27" fill="#FCD34D" font-size="11.5" font-weight="600" text-anchor="end">[BUCKETS]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>allocation_settings_id</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">bucket_key (needs, wants)</text>
        <text x="18" y="146" fill="#FCD34D" font-size="13" font-weight="700">target_percent DECIMAL(5,2)</text>
      </g>

      <!-- 18. allocation_bucket_categories -->
      <g class="full-node budget" id="full-node-allocation_bucket_categories" onclick="inspectTable('allocation_bucket_categories')" transform="translate(1660, 580)">
        <rect width="300" height="150" rx="10" fill="#0F172A" stroke="#F59E0B" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#78350F" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">🔗 bucket_categories</text>
        <text x="282" y="27" fill="#FCD34D" font-size="11.5" font-weight="600" text-anchor="end">[MAPPING]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id BIGINT</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>bucket_id UUID</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>category_id UUID</text>
      </g>

      <!-- 19. savings_goals -->
      <g class="full-node goals" id="full-node-savings_goals" onclick="inspectTable('savings_goals')" transform="translate(1660, 790)">
        <rect width="300" height="230" rx="10" fill="#0F172A" stroke="#10B981" stroke-width="2.5" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#064E3B" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="16">🎯 savings_goals</text>
        <text x="282" y="27" fill="#6EE7B7" font-size="11.5" font-weight="600" text-anchor="end">[WEALTH]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID</text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">title VARCHAR(150)</text>
        <text x="18" y="146" fill="#10B981" font-size="13.5" font-weight="800">target_amount DECIMAL</text>
        <text x="18" y="172" fill="#94A3B8" font-size="13">initial_amount DECIMAL</text>
        <text x="18" y="198" fill="#F8FAFC" font-size="13">monthly_contribution DECIMAL</text>
      </g>

      <!-- 20. tax_settings -->
      <g class="full-node tax" id="full-node-tax_settings" onclick="inspectTable('tax_settings')" transform="translate(1660, 1080)">
        <rect width="300" height="280" rx="10" fill="#0F172A" stroke="#8B5CF6" stroke-width="2.5" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#4C1D95" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">🧾 tax_settings</text>
        <text x="282" y="27" fill="#C4B5FD" font-size="11.5" font-weight="600" text-anchor="end">[ภ.ง.ด.]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id UUID | <tspan fill="#C4B5FD">2026</tspan></text>
        <text x="18" y="94" fill="#F8FAFC" font-size="13"><tspan fill="#3B82F6" font-weight="700">FK </tspan>user_id UUID</text>
        <text x="18" y="120" fill="#F8FAFC" font-size="13">annual_salary DECIMAL</text>
        <text x="18" y="146" fill="#F8FAFC" font-size="13">personal_deduction: 60k</text>
        <text x="18" y="172" fill="#C4B5FD" font-size="13" font-weight="600">ssf, rmf, thai_esg</text>
        <text x="18" y="198" fill="#F8FAFC" font-size="13">mortgage_interest (max 100k)</text>
        <text x="18" y="224" fill="#F8FAFC" font-size="13">withholding_tax DECIMAL</text>
        <text x="18" y="250" fill="#94A3B8" font-size="11.5">UQ(user_id, tax_year)</text>
      </g>

      <!-- 21. tax_bracket_rules -->
      <g class="full-node tax" id="full-node-tax_bracket_rules" onclick="inspectTable('tax_bracket_rules')" transform="translate(1660, 1420)">
        <rect width="300" height="150" rx="10" fill="#0F172A" stroke="#8B5CF6" stroke-width="2" filter="url(#full-card-shadow)" />
        <rect width="300" height="42" rx="10" fill="#4C1D95" />
        <text x="18" y="27" fill="#FFF" font-weight="700" font-size="15">🏛️ tax_bracket_rules</text>
        <text x="282" y="27" fill="#C4B5FD" font-size="11.5" font-weight="600" text-anchor="end">[TAX]</text>
        <text x="18" y="68" fill="#F8FAFC" font-size="13"><tspan fill="#EAB308" font-weight="700">PK </tspan>id INT | tax_year: 2026</text>
        <text x="18" y="94" fill="#C4B5FD" font-size="13">bracket_min / bracket_max</text>
        <text x="18" y="120" fill="#10B981" font-size="13.5" font-weight="700">rate: 0% - 35% กรมสรรพากร</text>
      </g>
    </svg>
  `;
}
