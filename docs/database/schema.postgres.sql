-- ===================================================================================
-- Walletly (FinSmart Thai) Database Schema DDL Script
-- Target Database: PostgreSQL 14+ / 15+ / 16+ / Supabase / Neon
-- Encoding: UTF-8
-- ===================================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ===================================================================================
-- DOMAIN 1: AUTHENTICATION, USERS & PDPA CONSENT
-- ===================================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(256) NOT NULL UNIQUE,
    password_hash VARCHAR(512) NULL,
    display_name VARCHAR(128) NOT NULL DEFAULT 'ผู้ใช้งาน',
    avatar_url VARCHAR(512) NULL,
    auth_provider VARCHAR(32) NOT NULL DEFAULT 'local',
    provider_id VARCHAR(256) NULL,
    is_guest BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMPTZ NULL
);

CREATE TABLE IF NOT EXISTS user_refresh_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(256) NOT NULL,
    device_info VARCHAR(256) NULL,
    ip_address VARCHAR(64) NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_consents (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NULL REFERENCES users(id) ON DELETE CASCADE,
    anonymous_id VARCHAR(128) NULL,
    policy_version VARCHAR(32) NOT NULL DEFAULT '1.0',
    consent_necessary BOOLEAN NOT NULL DEFAULT TRUE,
    consent_functional BOOLEAN NOT NULL DEFAULT FALSE,
    consent_analytics BOOLEAN NOT NULL DEFAULT FALSE,
    consent_marketing BOOLEAN NOT NULL DEFAULT FALSE,
    ip_address VARCHAR(64) NULL,
    user_agent VARCHAR(512) NULL,
    consented_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================================
-- DOMAIN 2: ACCOUNTS, CATEGORIES & PAYMENT METHODS
-- ===================================================================================

CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_type VARCHAR(32) NOT NULL DEFAULT 'bank' CHECK (account_type IN ('bank', 'cash', 'credit_card', 'e_wallet', 'investment')),
    current_balance NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    credit_limit NUMERIC(18,2) NULL,
    billing_day SMALLINT NULL CHECK (billing_day IS NULL OR (billing_day >= 1 AND billing_day <= 31)),
    currency CHAR(3) NOT NULL DEFAULT 'THB',
    color VARCHAR(32) NULL DEFAULT 'blue',
    icon VARCHAR(64) NULL DEFAULT 'Wallet',
    include_in_net_worth BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'fixed', 'savings')),
    name VARCHAR(128) NOT NULL,
    color VARCHAR(32) NULL,
    icon VARCHAR(64) NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_categories_user_type_name UNIQUE (user_id, type, name)
);

CREATE TABLE IF NOT EXISTS payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    account_id UUID NULL REFERENCES accounts(id) ON DELETE SET NULL,
    sort_order INT NOT NULL DEFAULT 0,
    is_system_default BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_payment_methods_user_name UNIQUE (user_id, name)
);

-- ===================================================================================
-- DOMAIN 6 & 7 & 4: SAVINGS_GOALS, DEBTS, FIXED_COSTS
-- ===================================================================================

CREATE TABLE IF NOT EXISTS savings_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'ความมั่นคง',
    target_amount NUMERIC(18,2) NOT NULL CHECK (target_amount >= 0),
    initial_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00 CHECK (initial_amount >= 0),
    monthly_contribution NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    target_date DATE NULL,
    expected_return_rate NUMERIC(5,2) NULL,
    color VARCHAR(32) NULL DEFAULT 'emerald',
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(150) NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('amortizing', 'hirePurchase', 'installment')),
    is_closed BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Amortizing only
    principal NUMERIC(18,2) NULL,
    accrued_interest NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    annual_rate_pct NUMERIC(6,3) NULL,
    frequency VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (frequency IN ('monthly', 'annual')),
    annual_due_month SMALLINT NULL CHECK (annual_due_month IS NULL OR (annual_due_month >= 1 AND annual_due_month <= 12)),
    accepts_early_payment BOOLEAN NOT NULL DEFAULT TRUE,
    min_payment_mode VARCHAR(20) NOT NULL DEFAULT 'none' CHECK (min_payment_mode IN ('none', 'fixed', 'percentOfBalance')),
    min_payment_amount NUMERIC(18,2) NULL,
    min_payment_percent NUMERIC(5,2) NULL,
    min_payment_floor NUMERIC(18,2) NULL,
    
    -- HirePurchase & Installment only
    monthly_payment NUMERIC(18,2) NULL,
    periods_paid INT NULL DEFAULT 0,
    periods_total INT NULL DEFAULT 0,
    settlement_quote NUMERIC(18,2) NULL,
    settlement_quote_date DATE NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fixed_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
    due_day SMALLINT NOT NULL DEFAULT 1 CHECK (due_day >= 1 AND due_day <= 31),
    is_paid BOOLEAN NOT NULL DEFAULT FALSE,
    auto_deduct BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    linked_debt_id UUID NULL REFERENCES debts(id) ON DELETE SET NULL,
    note VARCHAR(500) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================================
-- DOMAIN 3: TRANSACTIONS & RECONCILIATION
-- ===================================================================================

CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense', 'fixed', 'savings', 'transfer')),
    amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
    tx_date DATE NOT NULL,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    payment_method_id UUID NULL REFERENCES payment_methods(id) ON DELETE RESTRICT,
    account_id UUID NULL REFERENCES accounts(id) ON DELETE SET NULL,
    destination_account_id UUID NULL REFERENCES accounts(id) ON DELETE NO ACTION,
    savings_goal_id UUID NULL REFERENCES savings_goals(id) ON DELETE SET NULL,
    fixed_cost_id UUID NULL REFERENCES fixed_costs(id) ON DELETE SET NULL,
    debt_id UUID NULL REFERENCES debts(id) ON DELETE SET NULL,
    note VARCHAR(500) NULL,
    is_recurring BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS fixed_cost_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fixed_cost_id UUID NOT NULL REFERENCES fixed_costs(id) ON DELETE CASCADE,
    period_month DATE NOT NULL,
    amount_paid NUMERIC(18,2) NOT NULL,
    paid_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    transaction_id UUID NULL REFERENCES transactions(id) ON DELETE SET NULL,
    is_on_time BOOLEAN NOT NULL DEFAULT TRUE,
    note VARCHAR(256) NULL,
    CONSTRAINT uq_fixed_cost_payments_period UNIQUE (fixed_cost_id, period_month)
);

-- ===================================================================================
-- DOMAIN 5: BUDGET ALLOCATION
-- ===================================================================================

CREATE TABLE IF NOT EXISTS allocation_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    rule_key VARCHAR(50) NOT NULL DEFAULT '50-30-20',
    monthly_income NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    notes VARCHAR(500) NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS allocation_buckets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    allocation_settings_id UUID NOT NULL REFERENCES allocation_settings(id) ON DELETE CASCADE,
    bucket_key VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    target_percent NUMERIC(5,2) NOT NULL CHECK (target_percent >= 0.00 AND target_percent <= 100.00),
    color VARCHAR(32) NULL DEFAULT 'blue',
    sort_order INT NOT NULL DEFAULT 0,
    CONSTRAINT uq_allocation_buckets_setting_key UNIQUE (allocation_settings_id, bucket_key)
);

CREATE TABLE IF NOT EXISTS allocation_bucket_categories (
    id BIGSERIAL PRIMARY KEY,
    bucket_id UUID NOT NULL REFERENCES allocation_buckets(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    CONSTRAINT uq_abc_bucket_category UNIQUE (bucket_id, category_id)
);

-- ===================================================================================
-- DOMAIN 7 (CONT.): DEBT PROFILES & OVERRIDES
-- ===================================================================================

CREATE TABLE IF NOT EXISTS debt_budget_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    net_monthly_income NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    fixed_expenses NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    discretionary_budget NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    extra_income NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    emergency_fund_current NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    emergency_fund_target NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    emergency_monthly_contribution NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    short_term_buffer NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    strategy VARCHAR(20) NOT NULL DEFAULT 'avalanche' CHECK (strategy IN ('avalanche', 'snowball', 'manual')),
    manual_order_json TEXT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS debt_schedule_overrides (
    id BIGSERIAL PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES debt_budget_profiles(id) ON DELETE CASCADE,
    override_type VARCHAR(32) NOT NULL CHECK (override_type IN ('emergency_contribution', 'short_term_buffer')),
    from_month INT NOT NULL CHECK (from_month >= 0),
    amount NUMERIC(18,2) NOT NULL CHECK (amount >= 0.00),
    CONSTRAINT uq_dso_profile_type_month UNIQUE (profile_id, override_type, from_month)
);

-- ===================================================================================
-- DOMAIN 8: THAI PERSONAL INCOME TAX (ภ.ง.ด. 90/91)
-- ===================================================================================

CREATE TABLE IF NOT EXISTS tax_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tax_year INT NOT NULL DEFAULT 2026,
    annual_salary NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    annual_bonus NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    freelance_income NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    other_income NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    social_security NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    personal_deduction NUMERIC(18,2) NOT NULL DEFAULT 60000.00,
    spouse_deduction NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    child_count INT NOT NULL DEFAULT 0,
    parent_count INT NOT NULL DEFAULT 0,
    life_insurance NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    health_insurance NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    ssf_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    rmf_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    thai_esg_amount NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    provident_fund NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    mortgage_interest NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    easy_receipt NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    donation_general NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    donation_education NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    withholding_tax NUMERIC(18,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_tax_settings_user_year UNIQUE (user_id, tax_year)
);

CREATE TABLE IF NOT EXISTS tax_bracket_rules (
    id SERIAL PRIMARY KEY,
    tax_year INT NOT NULL DEFAULT 2026,
    bracket_min NUMERIC(18,2) NOT NULL,
    bracket_max NUMERIC(18,2) NULL,
    rate NUMERIC(5,4) NOT NULL,
    label_th VARCHAR(100) NOT NULL
);

-- ===================================================================================
-- DOMAIN 9 & 10: SIMULATIONS, BACKUPS & AUDITING
-- ===================================================================================

CREATE TABLE IF NOT EXISTS affordability_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_name VARCHAR(150) NOT NULL,
    item_price NUMERIC(18,2) NOT NULL,
    installments INT NOT NULL DEFAULT 1,
    monthly_payment NUMERIC(18,2) NOT NULL,
    disposable_income_impact NUMERIC(5,2) NOT NULL,
    feasibility_status VARCHAR(32) NOT NULL,
    simulated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    backup_type VARCHAR(32) NOT NULL DEFAULT 'json_full',
    schema_version VARCHAR(32) NOT NULL DEFAULT '2.1-react',
    payload_json TEXT NULL,
    file_size_bytes BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NULL REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_name VARCHAR(64) NULL,
    entity_id VARCHAR(128) NULL,
    details_json TEXT NULL,
    ip_address VARCHAR(64) NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ===================================================================================
-- INDEXES
-- ===================================================================================

CREATE INDEX IF NOT EXISTS ix_transactions_user_txdate ON transactions (user_id, tx_date DESC);
CREATE INDEX IF NOT EXISTS ix_transactions_user_type_category ON transactions (user_id, type, category_id);
CREATE INDEX IF NOT EXISTS ix_transactions_savings_goal ON transactions (savings_goal_id) WHERE savings_goal_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_transactions_debt ON transactions (debt_id) WHERE debt_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS ix_fixed_costs_user_active ON fixed_costs (user_id, is_active);
CREATE INDEX IF NOT EXISTS ix_fixed_cost_payments_lookup ON fixed_cost_payments (fixed_cost_id, period_month);
CREATE INDEX IF NOT EXISTS ix_debts_user_status ON debts (user_id, is_closed);

-- ===================================================================================
-- VIEWS
-- ===================================================================================

CREATE OR REPLACE VIEW vw_savings_goal_progress AS
SELECT 
    g.id AS goal_id,
    g.user_id,
    g.title,
    g.category,
    g.target_amount,
    g.initial_amount,
    g.monthly_contribution,
    g.target_date,
    g.expected_return_rate,
    g.color,
    g.is_completed,
    g.initial_amount + COALESCE(SUM(t.amount), 0.00) AS current_amount,
    CASE 
        WHEN g.target_amount > 0 THEN 
            ROUND(((g.initial_amount + COALESCE(SUM(t.amount), 0.00)) / g.target_amount) * 100.0, 2)
        ELSE 0.00 
    END AS progress_percent
FROM savings_goals g
LEFT JOIN transactions t ON g.id = t.savings_goal_id
GROUP BY 
    g.id, g.user_id, g.title, g.category, g.target_amount, 
    g.initial_amount, g.monthly_contribution, g.target_date, 
    g.expected_return_rate, g.color, g.is_completed;
