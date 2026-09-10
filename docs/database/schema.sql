-- ===================================================================================
-- Walletly (FinSmart Thai) Database Schema DDL Script
-- Target Database: Microsoft SQL Server 2019+ / 2022+ / Azure SQL / LocalDB
-- Encoding: UTF-8
-- ===================================================================================

-- 1. Ensure UTF-8 collation or Thai collation compatibility
-- ALTER DATABASE CURRENT COLLATE Latin1_General_100_CI_AS_SC_UTF8;

-- Enable Foreign Key Constraints
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- ===================================================================================
-- DOMAIN 1: AUTHENTICATION, USERS & PDPA CONSENT
-- ===================================================================================

-- 1. Users Table
IF OBJECT_ID('dbo.users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.users (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_users_id DEFAULT NEWSEQUENTIALID(),
        email NVARCHAR(256) NOT NULL,
        password_hash NVARCHAR(512) NULL,
        display_name NVARCHAR(128) NOT NULL CONSTRAINT DF_users_display_name DEFAULT N'ผู้ใช้งาน',
        avatar_url NVARCHAR(512) NULL,
        auth_provider NVARCHAR(32) NOT NULL CONSTRAINT DF_users_auth_provider DEFAULT N'local',
        provider_id NVARCHAR(256) NULL,
        is_guest BIT NOT NULL CONSTRAINT DF_users_is_guest DEFAULT 0,
        is_active BIT NOT NULL CONSTRAINT DF_users_is_active DEFAULT 1,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_users_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_users_updated_at DEFAULT SYSUTCDATETIME(),
        last_login_at DATETIME2(3) NULL,
        CONSTRAINT PK_users PRIMARY KEY CLUSTERED (id),
        CONSTRAINT UQ_users_email UNIQUE NONCLUSTERED (email)
    );
END
GO

-- 2. User Refresh Tokens & Sessions
IF OBJECT_ID('dbo.user_refresh_tokens', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_refresh_tokens (
        id BIGINT IDENTITY(1,1) NOT NULL,
        user_id UNIQUEIDENTIFIER NOT NULL,
        token_hash NVARCHAR(256) NOT NULL,
        device_info NVARCHAR(256) NULL,
        ip_address NVARCHAR(64) NULL,
        expires_at DATETIME2(3) NOT NULL,
        revoked_at DATETIME2(3) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_user_refresh_tokens_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_user_refresh_tokens PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_user_refresh_tokens_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
END
GO

-- 3. PDPA & Cookie Consents Audit Trail
IF OBJECT_ID('dbo.user_consents', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_consents (
        id BIGINT IDENTITY(1,1) NOT NULL,
        user_id UNIQUEIDENTIFIER NULL,
        anonymous_id NVARCHAR(128) NULL,
        policy_version NVARCHAR(32) NOT NULL CONSTRAINT DF_user_consents_version DEFAULT N'1.0',
        consent_necessary BIT NOT NULL CONSTRAINT DF_user_consents_necessary DEFAULT 1,
        consent_functional BIT NOT NULL CONSTRAINT DF_user_consents_functional DEFAULT 0,
        consent_analytics BIT NOT NULL CONSTRAINT DF_user_consents_analytics DEFAULT 0,
        consent_marketing BIT NOT NULL CONSTRAINT DF_user_consents_marketing DEFAULT 0,
        ip_address NVARCHAR(64) NULL,
        user_agent NVARCHAR(512) NULL,
        consented_at DATETIME2(3) NOT NULL CONSTRAINT DF_user_consents_consented_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_user_consents PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_user_consents_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
END
GO

-- ===================================================================================
-- DOMAIN 2: ACCOUNTS, CATEGORIES & PAYMENT METHODS
-- ===================================================================================

-- 4. Accounts / Wallets Table
IF OBJECT_ID('dbo.accounts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.accounts (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_accounts_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        name NVARCHAR(100) NOT NULL,
        account_type NVARCHAR(32) NOT NULL CONSTRAINT DF_accounts_type DEFAULT N'bank', -- bank, cash, credit_card, e_wallet, investment
        current_balance DECIMAL(18,2) NOT NULL CONSTRAINT DF_accounts_balance DEFAULT 0.00,
        credit_limit DECIMAL(18,2) NULL,
        billing_day TINYINT NULL,
        currency CHAR(3) NOT NULL CONSTRAINT DF_accounts_currency DEFAULT 'THB',
        color NVARCHAR(32) NULL CONSTRAINT DF_accounts_color DEFAULT N'blue',
        icon NVARCHAR(64) NULL CONSTRAINT DF_accounts_icon DEFAULT N'Wallet',
        include_in_net_worth BIT NOT NULL CONSTRAINT DF_accounts_include DEFAULT 1,
        is_active BIT NOT NULL CONSTRAINT DF_accounts_is_active DEFAULT 1,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_accounts_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_accounts_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_accounts PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_accounts_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT CK_accounts_type CHECK (account_type IN (N'bank', N'cash', N'credit_card', N'e_wallet', N'investment')),
        CONSTRAINT CK_accounts_billing_day CHECK (billing_day IS NULL OR (billing_day >= 1 AND billing_day <= 31))
    );
END
GO

-- 5. Categories Table
IF OBJECT_ID('dbo.categories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.categories (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_categories_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        type NVARCHAR(20) NOT NULL, -- income, expense, fixed, savings
        name NVARCHAR(128) NOT NULL,
        color NVARCHAR(32) NULL,
        icon NVARCHAR(64) NULL,
        sort_order INT NOT NULL CONSTRAINT DF_categories_sort_order DEFAULT 0,
        is_system_default BIT NOT NULL CONSTRAINT DF_categories_is_default DEFAULT 0,
        is_active BIT NOT NULL CONSTRAINT DF_categories_is_active DEFAULT 1,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_categories_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_categories PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_categories_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_categories_user_type_name UNIQUE NONCLUSTERED (user_id, type, name),
        CONSTRAINT CK_categories_type CHECK (type IN (N'income', N'expense', N'fixed', N'savings'))
    );
END
GO

-- 6. Payment Methods Table
IF OBJECT_ID('dbo.payment_methods', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.payment_methods (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_payment_methods_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        name NVARCHAR(100) NOT NULL,
        account_id UNIQUEIDENTIFIER NULL,
        sort_order INT NOT NULL CONSTRAINT DF_payment_methods_sort_order DEFAULT 0,
        is_system_default BIT NOT NULL CONSTRAINT DF_payment_methods_is_default DEFAULT 0,
        is_active BIT NOT NULL CONSTRAINT DF_payment_methods_is_active DEFAULT 1,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_payment_methods_created_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_payment_methods PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_payment_methods_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT FK_payment_methods_accounts FOREIGN KEY (account_id) REFERENCES dbo.accounts(id) ON DELETE SET NULL,
        CONSTRAINT UQ_payment_methods_user_name UNIQUE NONCLUSTERED (user_id, name)
    );
END
GO

-- ===================================================================================
-- DOMAIN 6 & 7 & 4 FORWARD REFERENCES: SAVINGS_GOALS, DEBTS, FIXED_COSTS
-- ===================================================================================

-- 13. Savings Goals Table
IF OBJECT_ID('dbo.savings_goals', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.savings_goals (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_savings_goals_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        title NVARCHAR(150) NOT NULL,
        category NVARCHAR(100) NOT NULL CONSTRAINT DF_savings_goals_cat DEFAULT N'ความมั่นคง',
        target_amount DECIMAL(18,2) NOT NULL,
        initial_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_savings_goals_initial DEFAULT 0.00,
        monthly_contribution DECIMAL(18,2) NOT NULL CONSTRAINT DF_savings_goals_monthly DEFAULT 0.00,
        target_date DATE NULL,
        expected_return_rate DECIMAL(5,2) NULL, -- Annual APY / CAGR %
        color NVARCHAR(32) NULL CONSTRAINT DF_savings_goals_color DEFAULT N'emerald',
        is_completed BIT NOT NULL CONSTRAINT DF_savings_goals_completed DEFAULT 0,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_savings_goals_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_savings_goals_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_savings_goals PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_savings_goals_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT CK_savings_goals_target CHECK (target_amount >= 0),
        CONSTRAINT CK_savings_goals_initial CHECK (initial_amount >= 0)
    );
END
GO

-- 14. Debts Table (3 Debt Types: amortizing, hirePurchase, installment)
IF OBJECT_ID('dbo.debts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.debts (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_debts_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        name NVARCHAR(150) NOT NULL,
        type NVARCHAR(30) NOT NULL, -- amortizing, hirePurchase, installment
        is_closed BIT NOT NULL CONSTRAINT DF_debts_is_closed DEFAULT 0,
        
        -- Amortizing only
        principal DECIMAL(18,2) NULL,
        accrued_interest DECIMAL(18,2) NOT NULL CONSTRAINT DF_debts_accrued DEFAULT 0.00,
        annual_rate_pct DECIMAL(6,3) NULL,
        frequency NVARCHAR(20) NOT NULL CONSTRAINT DF_debts_freq DEFAULT N'monthly',
        annual_due_month TINYINT NULL,
        accepts_early_payment BIT NOT NULL CONSTRAINT DF_debts_early_pay DEFAULT 1,
        min_payment_mode NVARCHAR(20) NOT NULL CONSTRAINT DF_debts_min_mode DEFAULT N'none', -- none, fixed, percentOfBalance
        min_payment_amount DECIMAL(18,2) NULL,
        min_payment_percent DECIMAL(5,2) NULL,
        min_payment_floor DECIMAL(18,2) NULL,
        
        -- HirePurchase & Installment only
        monthly_payment DECIMAL(18,2) NULL,
        periods_paid INT NULL CONSTRAINT DF_debts_periods_paid DEFAULT 0,
        periods_total INT NULL CONSTRAINT DF_debts_periods_total DEFAULT 0,
        settlement_quote DECIMAL(18,2) NULL,
        settlement_quote_date DATE NULL,
        
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_debts_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_debts_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_debts PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_debts_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT CK_debts_type CHECK (type IN (N'amortizing', N'hirePurchase', N'installment')),
        CONSTRAINT CK_debts_freq CHECK (frequency IN (N'monthly', N'annual')),
        CONSTRAINT CK_debts_min_mode CHECK (min_payment_mode IN (N'none', N'fixed', N'percentOfBalance')),
        CONSTRAINT CK_debts_annual_month CHECK (annual_due_month IS NULL OR (annual_due_month >= 1 AND annual_due_month <= 12))
    );
END
GO

-- 8. Fixed Costs Table
IF OBJECT_ID('dbo.fixed_costs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.fixed_costs (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_fixed_costs_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        category_id UNIQUEIDENTIFIER NOT NULL,
        title NVARCHAR(150) NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        due_day TINYINT NOT NULL CONSTRAINT DF_fixed_costs_due_day DEFAULT 1,
        is_paid BIT NOT NULL CONSTRAINT DF_fixed_costs_is_paid DEFAULT 0,
        auto_deduct BIT NOT NULL CONSTRAINT DF_fixed_costs_auto_deduct DEFAULT 0,
        is_active BIT NOT NULL CONSTRAINT DF_fixed_costs_is_active DEFAULT 1,
        linked_debt_id UNIQUEIDENTIFIER NULL,
        note NVARCHAR(500) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_fixed_costs_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_fixed_costs_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_fixed_costs PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_fixed_costs_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT FK_fixed_costs_categories FOREIGN KEY (category_id) REFERENCES dbo.categories(id) ON DELETE NO ACTION,
        CONSTRAINT FK_fixed_costs_debts FOREIGN KEY (linked_debt_id) REFERENCES dbo.debts(id) ON DELETE SET NULL,
        CONSTRAINT CK_fixed_costs_amount CHECK (amount >= 0),
        CONSTRAINT CK_fixed_costs_due_day CHECK (due_day >= 1 AND due_day <= 31)
    );
END
GO

-- ===================================================================================
-- DOMAIN 3: TRANSACTIONS (CASH IN/OUT LEDGER)
-- ===================================================================================

-- 7. Transactions Table
IF OBJECT_ID('dbo.transactions', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.transactions (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_transactions_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        type NVARCHAR(20) NOT NULL, -- income, expense, fixed, savings, transfer
        amount DECIMAL(18,2) NOT NULL,
        tx_date DATE NOT NULL,
        category_id UNIQUEIDENTIFIER NOT NULL,
        payment_method_id UNIQUEIDENTIFIER NULL,
        account_id UNIQUEIDENTIFIER NULL,
        destination_account_id UNIQUEIDENTIFIER NULL,
        savings_goal_id UNIQUEIDENTIFIER NULL,
        fixed_cost_id UNIQUEIDENTIFIER NULL,
        debt_id UNIQUEIDENTIFIER NULL,
        note NVARCHAR(500) NULL,
        is_recurring BIT NOT NULL CONSTRAINT DF_transactions_recurring DEFAULT 0,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_transactions_created_at DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_transactions_updated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_transactions PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_transactions_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT FK_transactions_categories FOREIGN KEY (category_id) REFERENCES dbo.categories(id) ON DELETE NO ACTION,
        CONSTRAINT FK_transactions_payment_methods FOREIGN KEY (payment_method_id) REFERENCES dbo.payment_methods(id) ON DELETE NO ACTION,
        CONSTRAINT FK_transactions_accounts FOREIGN KEY (account_id) REFERENCES dbo.accounts(id) ON DELETE SET NULL,
        CONSTRAINT FK_transactions_dest_accounts FOREIGN KEY (destination_account_id) REFERENCES dbo.accounts(id) ON DELETE NO ACTION,
        CONSTRAINT FK_transactions_savings_goals FOREIGN KEY (savings_goal_id) REFERENCES dbo.savings_goals(id) ON DELETE SET NULL,
        CONSTRAINT FK_transactions_fixed_costs FOREIGN KEY (fixed_cost_id) REFERENCES dbo.fixed_costs(id) ON DELETE SET NULL,
        CONSTRAINT FK_transactions_debts FOREIGN KEY (debt_id) REFERENCES dbo.debts(id) ON DELETE SET NULL,
        CONSTRAINT CK_transactions_amount CHECK (amount >= 0),
        CONSTRAINT CK_transactions_type CHECK (type IN (N'income', N'expense', N'fixed', N'savings', N'transfer'))
    );
END
GO

-- 9. Fixed Cost Payments Table (Payment History & Month-by-month Log)
IF OBJECT_ID('dbo.fixed_cost_payments', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.fixed_cost_payments (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_fixed_cost_payments_id DEFAULT NEWSEQUENTIALID(),
        fixed_cost_id UNIQUEIDENTIFIER NOT NULL,
        period_month DATE NOT NULL, -- e.g. '2026-08-01'
        amount_paid DECIMAL(18,2) NOT NULL,
        paid_at DATETIME2(3) NOT NULL CONSTRAINT DF_fc_payments_paid_at DEFAULT SYSUTCDATETIME(),
        transaction_id UNIQUEIDENTIFIER NULL,
        is_on_time BIT NOT NULL CONSTRAINT DF_fc_payments_on_time DEFAULT 1,
        note NVARCHAR(256) NULL,
        CONSTRAINT PK_fixed_cost_payments PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_fixed_cost_payments_fc FOREIGN KEY (fixed_cost_id) REFERENCES dbo.fixed_costs(id) ON DELETE CASCADE,
        CONSTRAINT FK_fixed_cost_payments_tx FOREIGN KEY (transaction_id) REFERENCES dbo.transactions(id) ON DELETE SET NULL,
        CONSTRAINT UQ_fixed_cost_payments_period UNIQUE NONCLUSTERED (fixed_cost_id, period_month)
    );
END
GO

-- ===================================================================================
-- DOMAIN 5: BUDGET ALLOCATION (50/30/20 & 6 JARS BUCKETS)
-- ===================================================================================

-- 10. Allocation Settings Table
IF OBJECT_ID('dbo.allocation_settings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.allocation_settings (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_allocation_settings_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        rule_key NVARCHAR(50) NOT NULL CONSTRAINT DF_allocation_rule DEFAULT N'50-30-20',
        monthly_income DECIMAL(18,2) NOT NULL CONSTRAINT DF_allocation_income DEFAULT 0.00,
        notes NVARCHAR(500) NULL,
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_allocation_updated DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_allocation_settings PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_allocation_settings_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_allocation_settings_user UNIQUE NONCLUSTERED (user_id)
    );
END
GO

-- 11. Allocation Buckets Table
IF OBJECT_ID('dbo.allocation_buckets', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.allocation_buckets (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_allocation_buckets_id DEFAULT NEWSEQUENTIALID(),
        allocation_settings_id UNIQUEIDENTIFIER NOT NULL,
        bucket_key NVARCHAR(50) NOT NULL,
        name NVARCHAR(100) NOT NULL,
        target_percent DECIMAL(5,2) NOT NULL,
        color NVARCHAR(32) NULL CONSTRAINT DF_allocation_buckets_color DEFAULT N'blue',
        sort_order INT NOT NULL CONSTRAINT DF_allocation_buckets_sort DEFAULT 0,
        CONSTRAINT PK_allocation_buckets PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_allocation_buckets_settings FOREIGN KEY (allocation_settings_id) REFERENCES dbo.allocation_settings(id) ON DELETE CASCADE,
        CONSTRAINT UQ_allocation_buckets_setting_key UNIQUE NONCLUSTERED (allocation_settings_id, bucket_key),
        CONSTRAINT CK_allocation_buckets_percent CHECK (target_percent >= 0.00 AND target_percent <= 100.00)
    );
END
GO

-- 12. Allocation Bucket Categories Mapping Table
IF OBJECT_ID('dbo.allocation_bucket_categories', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.allocation_bucket_categories (
        id BIGINT IDENTITY(1,1) NOT NULL,
        bucket_id UNIQUEIDENTIFIER NOT NULL,
        category_id UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT PK_allocation_bucket_categories PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_abc_bucket FOREIGN KEY (bucket_id) REFERENCES dbo.allocation_buckets(id) ON DELETE CASCADE,
        CONSTRAINT FK_abc_category FOREIGN KEY (category_id) REFERENCES dbo.categories(id) ON DELETE CASCADE,
        CONSTRAINT UQ_abc_bucket_category UNIQUE NONCLUSTERED (bucket_id, category_id)
    );
END
GO

-- ===================================================================================
-- DOMAIN 7 (CONT.): DEBT PAYOFF PROFILES & SCHEDULE OVERRIDES
-- ===================================================================================

-- 15. Debt Budget Profiles Table
IF OBJECT_ID('dbo.debt_budget_profiles', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.debt_budget_profiles (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_debt_budget_profiles_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        net_monthly_income DECIMAL(18,2) NOT NULL CONSTRAINT DF_dbp_income DEFAULT 0.00,
        fixed_expenses DECIMAL(18,2) NOT NULL CONSTRAINT DF_dbp_fixed DEFAULT 0.00,
        discretionary_budget DECIMAL(18,2) NOT NULL CONSTRAINT DF_dbp_disc DEFAULT 0.00,
        extra_income DECIMAL(18,2) NOT NULL CONSTRAINT DF_dbp_extra DEFAULT 0.00,
        emergency_fund_current DECIMAL(18,2) NOT NULL CONSTRAINT DF_dbp_efund_curr DEFAULT 0.00,
        emergency_fund_target DECIMAL(18,2) NOT NULL CONSTRAINT DF_dbp_efund_targ DEFAULT 0.00,
        emergency_monthly_contribution DECIMAL(18,2) NOT NULL CONSTRAINT DF_dbp_efund_contrib DEFAULT 0.00,
        short_term_buffer DECIMAL(18,2) NOT NULL CONSTRAINT DF_dbp_buffer DEFAULT 0.00,
        strategy NVARCHAR(20) NOT NULL CONSTRAINT DF_dbp_strategy DEFAULT N'avalanche', -- avalanche, snowball, manual
        manual_order_json NVARCHAR(MAX) NULL,
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_dbp_updated DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_debt_budget_profiles PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_debt_budget_profiles_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_debt_budget_profiles_user UNIQUE NONCLUSTERED (user_id),
        CONSTRAINT CK_dbp_strategy CHECK (strategy IN (N'avalanche', N'snowball', N'manual'))
    );
END
GO

-- 16. Debt Schedule Overrides Table
IF OBJECT_ID('dbo.debt_schedule_overrides', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.debt_schedule_overrides (
        id BIGINT IDENTITY(1,1) NOT NULL,
        profile_id UNIQUEIDENTIFIER NOT NULL,
        override_type NVARCHAR(32) NOT NULL, -- emergency_contribution, short_term_buffer
        from_month INT NOT NULL,
        amount DECIMAL(18,2) NOT NULL,
        CONSTRAINT PK_debt_schedule_overrides PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_dso_profile FOREIGN KEY (profile_id) REFERENCES dbo.debt_budget_profiles(id) ON DELETE CASCADE,
        CONSTRAINT UQ_dso_profile_type_month UNIQUE NONCLUSTERED (profile_id, override_type, from_month),
        CONSTRAINT CK_dso_type CHECK (override_type IN (N'emergency_contribution', N'short_term_buffer')),
        CONSTRAINT CK_dso_month CHECK (from_month >= 0),
        CONSTRAINT CK_dso_amount CHECK (amount >= 0.00)
    );
END
GO

-- ===================================================================================
-- DOMAIN 8: THAI PERSONAL INCOME TAX (ภ.ง.ด. 90/91)
-- ===================================================================================

-- 17. Tax Settings Table
IF OBJECT_ID('dbo.tax_settings', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tax_settings (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_tax_settings_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        tax_year INT NOT NULL CONSTRAINT DF_tax_settings_year DEFAULT 2026,
        annual_salary DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_salary DEFAULT 0.00,
        annual_bonus DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_bonus DEFAULT 0.00,
        freelance_income DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_freelance DEFAULT 0.00,
        other_income DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_other DEFAULT 0.00,
        social_security DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_sso DEFAULT 0.00,
        personal_deduction DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_personal DEFAULT 60000.00,
        spouse_deduction DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_spouse DEFAULT 0.00,
        child_count INT NOT NULL CONSTRAINT DF_tax_child DEFAULT 0,
        parent_count INT NOT NULL CONSTRAINT DF_tax_parent DEFAULT 0,
        life_insurance DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_life DEFAULT 0.00,
        health_insurance DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_health DEFAULT 0.00,
        ssf_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_ssf DEFAULT 0.00,
        rmf_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_rmf DEFAULT 0.00,
        thai_esg_amount DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_thaiesg DEFAULT 0.00,
        provident_fund DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_pvd DEFAULT 0.00,
        mortgage_interest DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_mortgage DEFAULT 0.00,
        easy_receipt DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_easy_receipt DEFAULT 0.00,
        donation_general DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_donation_gen DEFAULT 0.00,
        donation_education DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_donation_edu DEFAULT 0.00,
        withholding_tax DECIMAL(18,2) NOT NULL CONSTRAINT DF_tax_wht DEFAULT 0.00,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_tax_settings_created DEFAULT SYSUTCDATETIME(),
        updated_at DATETIME2(3) NOT NULL CONSTRAINT DF_tax_settings_updated DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_tax_settings PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_tax_settings_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE,
        CONSTRAINT UQ_tax_settings_user_year UNIQUE NONCLUSTERED (user_id, tax_year)
    );
END
GO

-- 18. Tax Bracket Reference Rules Table (Thai Revenue Department)
IF OBJECT_ID('dbo.tax_bracket_rules', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.tax_bracket_rules (
        id INT IDENTITY(1,1) NOT NULL,
        tax_year INT NOT NULL CONSTRAINT DF_tbr_year DEFAULT 2026,
        bracket_min DECIMAL(18,2) NOT NULL,
        bracket_max DECIMAL(18,2) NULL, -- NULL = Infinity
        rate DECIMAL(5,4) NOT NULL,
        label_th NVARCHAR(100) NOT NULL,
        CONSTRAINT PK_tax_bracket_rules PRIMARY KEY CLUSTERED (id)
    );
END
GO

-- ===================================================================================
-- DOMAIN 9: AFFORDABILITY SIMULATIONS ("Can I Afford It?")
-- ===================================================================================

-- 19. Affordability Simulations Table
IF OBJECT_ID('dbo.affordability_simulations', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.affordability_simulations (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_affordability_simulations_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        item_name NVARCHAR(150) NOT NULL,
        item_price DECIMAL(18,2) NOT NULL,
        installments INT NOT NULL CONSTRAINT DF_afford_installments DEFAULT 1,
        monthly_payment DECIMAL(18,2) NOT NULL,
        disposable_income_impact DECIMAL(5,2) NOT NULL,
        feasibility_status NVARCHAR(32) NOT NULL, -- safe, caution, danger
        simulated_at DATETIME2(3) NOT NULL CONSTRAINT DF_afford_simulated_at DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_affordability_simulations PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_affordability_simulations_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
END
GO

-- ===================================================================================
-- DOMAIN 10: BACKUPS & SYSTEM AUDIT LOGS
-- ===================================================================================

-- 20. User Backups Table
IF OBJECT_ID('dbo.user_backups', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.user_backups (
        id UNIQUEIDENTIFIER NOT NULL CONSTRAINT DF_user_backups_id DEFAULT NEWSEQUENTIALID(),
        user_id UNIQUEIDENTIFIER NOT NULL,
        backup_type NVARCHAR(32) NOT NULL CONSTRAINT DF_backups_type DEFAULT N'json_full',
        schema_version NVARCHAR(32) NOT NULL CONSTRAINT DF_backups_version DEFAULT N'2.1-react',
        payload_json NVARCHAR(MAX) NULL,
        file_size_bytes BIGINT NOT NULL CONSTRAINT DF_backups_size DEFAULT 0,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_backups_created DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_user_backups PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_user_backups_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE CASCADE
    );
END
GO

-- 21. Audit Logs Table
IF OBJECT_ID('dbo.audit_logs', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.audit_logs (
        id BIGINT IDENTITY(1,1) NOT NULL,
        user_id UNIQUEIDENTIFIER NULL,
        action NVARCHAR(100) NOT NULL,
        entity_name NVARCHAR(64) NULL,
        entity_id NVARCHAR(128) NULL,
        details_json NVARCHAR(MAX) NULL,
        ip_address NVARCHAR(64) NULL,
        created_at DATETIME2(3) NOT NULL CONSTRAINT DF_audit_logs_created DEFAULT SYSUTCDATETIME(),
        CONSTRAINT PK_audit_logs PRIMARY KEY CLUSTERED (id),
        CONSTRAINT FK_audit_logs_users FOREIGN KEY (user_id) REFERENCES dbo.users(id) ON DELETE SET NULL
    );
END
GO

-- ===================================================================================
-- PERFORMANCE INDEXES
-- ===================================================================================

-- Transactions Indexes
CREATE NONCLUSTERED INDEX IX_transactions_user_txdate
ON dbo.transactions (user_id, tx_date DESC)
INCLUDE (amount, type, category_id, payment_method_id, account_id);
GO

CREATE NONCLUSTERED INDEX IX_transactions_user_type_category
ON dbo.transactions (user_id, type, category_id)
INCLUDE (amount, tx_date);
GO

CREATE NONCLUSTERED INDEX IX_transactions_savings_goal
ON dbo.transactions (savings_goal_id)
INCLUDE (amount)
WHERE savings_goal_id IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_transactions_debt
ON dbo.transactions (debt_id)
INCLUDE (amount, tx_date)
WHERE debt_id IS NOT NULL;
GO

CREATE NONCLUSTERED INDEX IX_transactions_account
ON dbo.transactions (account_id, tx_date DESC)
INCLUDE (amount, type);
GO

-- Fixed Costs Indexes
CREATE NONCLUSTERED INDEX IX_fixed_costs_user_active
ON dbo.fixed_costs (user_id, is_active)
INCLUDE (title, amount, due_day, is_paid);
GO

CREATE NONCLUSTERED INDEX IX_fixed_cost_payments_lookup
ON dbo.fixed_cost_payments (fixed_cost_id, period_month);
GO

-- Debts Indexes
CREATE NONCLUSTERED INDEX IX_debts_user_status
ON dbo.debts (user_id, is_closed)
INCLUDE (name, type, principal, monthly_payment, annual_rate_pct);
GO

-- Refresh Tokens Index
CREATE NONCLUSTERED INDEX IX_user_refresh_tokens_lookup
ON dbo.user_refresh_tokens (user_id, token_hash)
WHERE revoked_at IS NULL;
GO

-- ===================================================================================
-- ANALYTICAL VIEWS FOR REPORTING & DASHBOARD
-- ===================================================================================

-- View: vw_savings_goal_progress
-- Computes the dynamic derived current saved amount without data redundancy
CREATE OR ALTER VIEW dbo.vw_savings_goal_progress
AS
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
    g.initial_amount + ISNULL(SUM(t.amount), 0.00) AS current_amount,
    CASE 
        WHEN g.target_amount > 0 THEN 
            ROUND(((g.initial_amount + ISNULL(SUM(t.amount), 0.00)) / g.target_amount) * 100.0, 2)
        ELSE 0.00 
    END AS progress_percent
FROM dbo.savings_goals g
LEFT JOIN dbo.transactions t ON g.id = t.savings_goal_id
GROUP BY 
    g.id, g.user_id, g.title, g.category, g.target_amount, 
    g.initial_amount, g.monthly_contribution, g.target_date, 
    g.expected_return_rate, g.color, g.is_completed;
GO

-- View: vw_monthly_fixed_cost_summary
-- Summarizes total fixed costs, paid amount and unpaid obligations for the current cycle
CREATE OR ALTER VIEW dbo.vw_monthly_fixed_cost_summary
AS
SELECT 
    user_id,
    COUNT(id) AS total_items_count,
    SUM(amount) AS total_fixed_cost_amount,
    SUM(CASE WHEN is_paid = 1 THEN amount ELSE 0.00 END) AS total_paid_amount,
    SUM(CASE WHEN is_paid = 0 THEN amount ELSE 0.00 END) AS total_unpaid_amount,
    SUM(CASE WHEN auto_deduct = 1 THEN amount ELSE 0.00 END) AS total_auto_deduct_amount
FROM dbo.fixed_costs
WHERE is_active = 1
GROUP BY user_id;
GO

PRINT N'Walletly database schema created successfully.';
GO
