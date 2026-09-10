-- ===================================================================================
-- Walletly (FinSmart Thai) Database Seed Data Script
-- Target Database: Microsoft SQL Server 2019+ / 2022+ / Azure SQL / LocalDB
-- Encoding: UTF-8
-- ===================================================================================

SET NOCOUNT ON;
BEGIN TRANSACTION;

-- ===================================================================================
-- 1. SEED SYSTEM REFERENCE: THAI TAX BRACKETS (ปีภาษี 2026)
-- ===================================================================================
PRINT N'Seeding Thai Tax Brackets...';

IF NOT EXISTS (SELECT 1 FROM dbo.tax_bracket_rules WHERE tax_year = 2026)
BEGIN
    INSERT INTO dbo.tax_bracket_rules (tax_year, bracket_min, bracket_max, rate, label_th)
    VALUES
        (2026, 0.00,       150000.00,  0.0000, N'0 - 150,000 บาท (0% ได้รับยกเว้น)'),
        (2026, 150000.00,  300000.00,  0.0500, N'150,001 - 300,000 บาท (5%)'),
        (2026, 300000.00,  500000.00,  0.1000, N'300,001 - 500,000 บาท (10%)'),
        (2026, 500000.00,  750000.00,  0.1500, N'500,001 - 750,000 บาท (15%)'),
        (2026, 750000.00,  1000000.00, 0.2000, N'750,001 - 1,000,000 บาท (20%)'),
        (2026, 1000000.00, 2000000.00, 0.2500, N'1,000,001 - 2,000,000 บาท (25%)'),
        (2026, 2000000.00, 5000000.00, 0.3000, N'2,000,001 - 5,000,000 บาท (30%)'),
        (2026, 5000000.00, NULL,       0.3500, N'เกิน 5,000,000 บาทขึ้นไป (35%)');
END
GO

-- ===================================================================================
-- 2. SEED DEMO USER & ACCOUNTS
-- ===================================================================================
PRINT N'Seeding Demo User and Accounts...';

DECLARE @DemoUserId UNIQUEIDENTIFIER = '11111111-1111-1111-1111-111111111111';

IF NOT EXISTS (SELECT 1 FROM dbo.users WHERE id = @DemoUserId)
BEGIN
    INSERT INTO dbo.users (id, email, password_hash, display_name, auth_provider, is_guest, is_active)
    VALUES (
        @DemoUserId,
        N'demo@walletly.app',
        N'$argon2id$v=19$m=65536,t=3,p=1$DemoPasswordHashSample',
        N'สมชาย ฟินสมาร์ท (Demo)',
        N'local',
        0,
        1
    );
END

-- Demo Accounts
DECLARE @AccBankId UNIQUEIDENTIFIER = 'A1111111-1111-1111-1111-111111111111';
DECLARE @AccKeptId UNIQUEIDENTIFIER = 'A2222222-2222-2222-2222-222222222222';
DECLARE @AccCardId UNIQUEIDENTIFIER = 'A3333333-3333-3333-3333-333333333333';
DECLARE @AccCashId UNIQUEIDENTIFIER = 'A4444444-4444-4444-4444-444444444444';

IF NOT EXISTS (SELECT 1 FROM dbo.accounts WHERE user_id = @DemoUserId)
BEGIN
    INSERT INTO dbo.accounts (id, user_id, name, account_type, current_balance, credit_limit, color, icon)
    VALUES
        (@AccBankId, @DemoUserId, N'KBANK บัญชีเงินเดือน', N'bank', 24500.00, NULL, N'emerald', N'Building2'),
        (@AccKeptId, @DemoUserId, N'Kept by Krungsri (Grow)', N'bank', 95000.00, NULL, N'blue', N'PiggyBank'),
        (@AccCardId, @DemoUserId, N'KTC Visa Platinum', N'credit_card', -2450.00, 50000.00, N'purple', N'CreditCard'),
        (@AccCashId, @DemoUserId, N'กระเป๋าเงินสด', N'cash', 1200.00, NULL, N'amber', N'Banknote');
END

-- ===================================================================================
-- 3. SEED CATEGORIES FOR DEMO USER
-- ===================================================================================
PRINT N'Seeding Categories...';

DECLARE @CatSalaryId UNIQUEIDENTIFIER = 'C0100000-0000-0000-0000-000000000001';
DECLARE @CatBonusId  UNIQUEIDENTIFIER = 'C0100000-0000-0000-0000-000000000002';
DECLARE @CatFreeId   UNIQUEIDENTIFIER = 'C0100000-0000-0000-0000-000000000003';

DECLARE @CatFoodId   UNIQUEIDENTIFIER = 'C0200000-0000-0000-0000-000000000001';
DECLARE @CatShopId   UNIQUEIDENTIFIER = 'C0200000-0000-0000-0000-000000000002';
DECLARE @CatEntId    UNIQUEIDENTIFIER = 'C0200000-0000-0000-0000-000000000003';

DECLARE @CatHomeId   UNIQUEIDENTIFIER = 'C0300000-0000-0000-0000-000000000001';
DECLARE @CatCarId    UNIQUEIDENTIFIER = 'C0300000-0000-0000-0000-000000000002';
DECLARE @CatUtilId   UNIQUEIDENTIFIER = 'C0300000-0000-0000-0000-000000000003';
DECLARE @CatInsId    UNIQUEIDENTIFIER = 'C0300000-0000-0000-0000-000000000004';
DECLARE @CatSubId    UNIQUEIDENTIFIER = 'C0300000-0000-0000-0000-000000000005';
DECLARE @CatFamId    UNIQUEIDENTIFIER = 'C0300000-0000-0000-0000-000000000006';

DECLARE @CatSavEmerId UNIQUEIDENTIFIER = 'C0400000-0000-0000-0000-000000000001';
DECLARE @CatSavInvId  UNIQUEIDENTIFIER = 'C0400000-0000-0000-0000-000000000002';

IF NOT EXISTS (SELECT 1 FROM dbo.categories WHERE user_id = @DemoUserId)
BEGIN
    INSERT INTO dbo.categories (id, user_id, type, name, color, sort_order, is_system_default)
    VALUES
        -- Income
        (@CatSalaryId, @DemoUserId, N'income', N'เงินเดือน (Salary)', N'emerald', 1, 1),
        (@CatBonusId,  @DemoUserId, N'income', N'โบนัส (Bonus)', N'emerald', 2, 1),
        (@CatFreeId,   @DemoUserId, N'income', N'รายได้เสริม (Freelance)', N'emerald', 3, 1),
        
        -- Expense
        (@CatFoodId,   @DemoUserId, N'expense', N'อาหารและเครื่องดื่ม', N'rose', 1, 1),
        (@CatShopId,   @DemoUserId, N'expense', N'ช้อปปิ้งและของใช้', N'rose', 2, 1),
        (@CatEntId,    @DemoUserId, N'expense', N'บันเทิงและสันทนาการ', N'rose', 3, 1),
        
        -- Fixed Costs
        (@CatHomeId,   @DemoUserId, N'fixed', N'ที่อยู่อาศัย (ผ่อนบ้าน/คอนโด/ค่าเช่า)', N'blue', 1, 1),
        (@CatCarId,    @DemoUserId, N'fixed', N'ยานพาหนะ (ค่างวดรถ/ประกันรถ)', N'blue', 2, 1),
        (@CatUtilId,   @DemoUserId, N'fixed', N'สาธารณูปโภค (เน็ต/มือถือ/ค่าน้ำไฟ)', N'blue', 3, 1),
        (@CatInsId,    @DemoUserId, N'fixed', N'ประกัน (ชีวิต/สุขภาพ/โรคร้าย)', N'blue', 4, 1),
        (@CatSubId,    @DemoUserId, N'fixed', N'Subscriptions (สตรีมมิ่ง/คลาวด์/สมาชิก)', N'blue', 5, 1),
        (@CatFamId,    @DemoUserId, N'fixed', N'ครอบครัว (ให้พ่อแม่/ค่าเทอมลูก)', N'blue', 6, 1),
        
        -- Savings
        (@CatSavEmerId, @DemoUserId, N'savings', N'กองทุนสำรองฉุกเฉิน', N'purple', 1, 1),
        (@CatSavInvId,  @DemoUserId, N'savings', N'ลงทุน DCA (หุ้น/กองทุน)', N'purple', 2, 1);
END

-- ===================================================================================
-- 4. SEED PAYMENT METHODS
-- ===================================================================================
PRINT N'Seeding Payment Methods...';

DECLARE @PmBankId UNIQUEIDENTIFIER = 'P1000000-0000-0000-0000-000000000001';
DECLARE @PmQrId   UNIQUEIDENTIFIER = 'P1000000-0000-0000-0000-000000000002';
DECLARE @PmCardId UNIQUEIDENTIFIER = 'P1000000-0000-0000-0000-000000000003';
DECLARE @PmAutoId UNIQUEIDENTIFIER = 'P1000000-0000-0000-0000-000000000004';

IF NOT EXISTS (SELECT 1 FROM dbo.payment_methods WHERE user_id = @DemoUserId)
BEGIN
    INSERT INTO dbo.payment_methods (id, user_id, name, account_id, sort_order, is_system_default)
    VALUES
        (@PmBankId, @DemoUserId, N'โอนผ่านธนาคาร', @AccBankId, 1, 1),
        (@PmQrId,   @DemoUserId, N'สแกน QR', @AccBankId, 2, 1),
        (@PmCardId, @DemoUserId, N'บัตรเครดิต', @AccCardId, 3, 1),
        (@PmAutoId, @DemoUserId, N'หักบัญชีอัตโนมัติ', @AccBankId, 4, 1);
END

-- ===================================================================================
-- 5. SEED SAVINGS GOALS
-- ===================================================================================
PRINT N'Seeding Savings Goals...';

DECLARE @GoalEmerId UNIQUEIDENTIFIER = 'G1000000-0000-0000-0000-000000000001';
DECLARE @GoalRetId  UNIQUEIDENTIFIER = 'G2000000-0000-0000-0000-000000000002';
DECLARE @GoalTripId UNIQUEIDENTIFIER = 'G3000000-0000-0000-0000-000000000003';

IF NOT EXISTS (SELECT 1 FROM dbo.savings_goals WHERE user_id = @DemoUserId)
BEGIN
    INSERT INTO dbo.savings_goals (id, user_id, title, category, target_amount, initial_amount, monthly_contribution, target_date, expected_return_rate, color)
    VALUES
        (@GoalEmerId, @DemoUserId, N'เงินสำรองฉุกเฉิน 6 เดือน', N'ความมั่นคง', 150000.00, 90000.00, 5000.00, '2026-12-31', 1.50, N'emerald'),
        (@GoalRetId,  @DemoUserId, N'พอร์ตลงทุนเกษียณ (DCA หุ้น/กองทุน)', N'การลงทุน', 1000000.00, 215000.00, 5000.00, '2035-12-31', 8.00, N'blue'),
        (@GoalTripId, @DemoUserId, N'ทริปเที่ยวญี่ปุ่นปลายปี', N'ท่องเที่ยว', 60000.00, 35000.00, 5000.00, '2026-11-30', NULL, N'purple');
END

-- ===================================================================================
-- 6. SEED FIXED COSTS
-- ===================================================================================
PRINT N'Seeding Fixed Costs...';

DECLARE @FcCondoId UNIQUEIDENTIFIER = 'F1000000-0000-0000-0000-000000000001';
DECLARE @FcCarId   UNIQUEIDENTIFIER = 'F2000000-0000-0000-0000-000000000002';
DECLARE @FcNetId   UNIQUEIDENTIFIER = 'F3000000-0000-0000-0000-000000000003';
DECLARE @FcInsId   UNIQUEIDENTIFIER = 'F4000000-0000-0000-0000-000000000004';
DECLARE @FcNetfId  UNIQUEIDENTIFIER = 'F5000000-0000-0000-0000-000000000005';
DECLARE @FcMomId   UNIQUEIDENTIFIER = 'F6000000-0000-0000-0000-000000000006';

IF NOT EXISTS (SELECT 1 FROM dbo.fixed_costs WHERE user_id = @DemoUserId)
BEGIN
    INSERT INTO dbo.fixed_costs (id, user_id, category_id, title, amount, due_day, is_paid, auto_deduct, note)
    VALUES
        (@FcCondoId, @DemoUserId, @CatHomeId, N'ผ่อนคอนโด', 12000.00, 2, 1, 1, N'ตัดผ่าน ธ.กสิกร'),
        (@FcCarId,   @DemoUserId, @CatCarId,  N'ค่างวดรถยนต์', 7500.00, 3, 1, 1, N'กรุงศรี ออโต้'),
        (@FcNetId,   @DemoUserId, @CatUtilId, N'ค่าอินเทอร์เน็ตบ้าน & มือถือ', 1099.00, 15, 0, 0, N'AIS Fibre + 5G'),
        (@FcInsId,   @DemoUserId, @CatInsId,  N'เบี้ยประกันชีวิตและสุขภาพ', 3200.00, 20, 0, 1, N'AIA ประกันชีวิต+สุขภาพ'),
        (@FcNetfId,  @DemoUserId, @CatSubId,  N'Netflix & Spotify Family', 499.00, 25, 0, 1, N'ตัดบัตรเครดิต'),
        (@FcMomId,   @DemoUserId, @CatFamId,  N'ให้คุณพ่อคุณแม่', 5000.00, 1, 1, 0, N'โอนเงินวันเงินเดือนออก');
END

-- ===================================================================================
-- 7. SEED TRANSACTIONS
-- ===================================================================================
PRINT N'Seeding Transactions...';

IF NOT EXISTS (SELECT 1 FROM dbo.transactions WHERE user_id = @DemoUserId)
BEGIN
    INSERT INTO dbo.transactions (user_id, type, amount, tx_date, category_id, payment_method_id, account_id, savings_goal_id, fixed_cost_id, note, is_recurring)
    VALUES
        (@DemoUserId, N'income',  45000.00, '2026-08-01', @CatSalaryId, @PmBankId, @AccBankId, NULL, NULL, N'เงินเดือนประจำเดือนสิงหาคม', 1),
        (@DemoUserId, N'income',  8000.00,  '2026-08-01', @CatFreeId,   @PmBankId, @AccBankId, NULL, NULL, N'รับงานออกแบบเว็บ', 0),
        (@DemoUserId, N'fixed',   12000.00, '2026-08-02', @CatHomeId,   @PmAutoId, @AccBankId, NULL, @FcCondoId, N'ผ่อนคอนโด ธ.กสิกร', 1),
        (@DemoUserId, N'fixed',   7500.00,  '2026-08-03', @CatCarId,    @PmAutoId, @AccBankId, NULL, @FcCarId,   N'ค่างวดรถยนต์', 1),
        (@DemoUserId, N'expense', 450.00,   '2026-08-04', @CatFoodId,   @PmQrId,   @AccBankId, NULL, NULL, N'มื้อกลางวันและกาแฟ', 0),
        (@DemoUserId, N'expense', 1850.00,  '2026-08-05', @CatShopId,   @PmCardId, @AccCardId, NULL, NULL, N'ซื้อของเข้าห้อง Big C', 0),
        (@DemoUserId, N'savings', 5000.00,  '2026-08-06', @CatSavEmerId, @PmBankId, @AccBankId, @GoalEmerId, NULL, N'โอนเข้า Kept บัญชี Grow', 1),
        (@DemoUserId, N'savings', 5000.00,  '2026-08-07', @CatSavInvId,  @PmBankId, @AccBankId, @GoalRetId,  NULL, N'DCA S&P500 และ ThaiESG', 1),
        (@DemoUserId, N'expense', 320.00,   '2026-08-08', @CatFoodId,   @PmQrId,   @AccBankId, NULL, NULL, N'มื้อเย็นข้าวต้ม', 0),
        (@DemoUserId, N'expense', 600.00,   '2026-08-10', @CatEntId,    @PmCardId, @AccCardId, NULL, NULL, N'ตั๋วหนังและป๊อปคอร์น', 0);
END

-- ===================================================================================
-- 8. SEED BUDGET ALLOCATION (50/30/20)
-- ===================================================================================
PRINT N'Seeding Budget Allocation...';

DECLARE @AllocSettingsId UNIQUEIDENTIFIER = 'B1000000-0000-0000-0000-000000000001';

IF NOT EXISTS (SELECT 1 FROM dbo.allocation_settings WHERE user_id = @DemoUserId)
BEGIN
    INSERT INTO dbo.allocation_settings (id, user_id, rule_key, monthly_income)
    VALUES (@AllocSettingsId, @DemoUserId, N'50-30-20', 53000.00);

    INSERT INTO dbo.allocation_buckets (allocation_settings_id, bucket_key, name, target_percent, color, sort_order)
    VALUES
        (@AllocSettingsId, N'needs',   N'จำเป็น (Needs & Fixed Costs)', 50.00, N'blue', 1),
        (@AllocSettingsId, N'wants',   N'ตามใจ (Wants & Lifestyle)',    30.00, N'rose', 2),
        (@AllocSettingsId, N'savings', N'ออม & ลงทุน (Savings & Invest)', 20.00, N'emerald', 3);
END

-- ===================================================================================
-- 9. SEED TAX SETTINGS (ปี 2026)
-- ===================================================================================
PRINT N'Seeding Tax Settings...';

IF NOT EXISTS (SELECT 1 FROM dbo.tax_settings WHERE user_id = @DemoUserId AND tax_year = 2026)
BEGIN
    INSERT INTO dbo.tax_settings (
        user_id, tax_year, annual_salary, annual_bonus, freelance_income, social_security,
        personal_deduction, spouse_deduction, child_count, parent_count,
        life_insurance, health_insurance, ssf_amount, rmf_amount, thai_esg_amount,
        provident_fund, mortgage_interest, easy_receipt, donation_general,
        donation_education, withholding_tax
    )
    VALUES (
        @DemoUserId, 2026, 540000.00, 90000.00, 96000.00, 9000.00,
        60000.00, 0.00, 0, 2,
        38400.00, 15000.00, 30000.00, 30000.00, 30000.00,
        27000.00, 45000.00, 10000.00, 5000.00,
        0.00, 18500.00
    );
END

-- ===================================================================================
-- 10. SEED DEBT PLANNER PROFILE
-- ===================================================================================
PRINT N'Seeding Debt Profile...';

DECLARE @DebtProfileId UNIQUEIDENTIFIER = 'D1000000-0000-0000-0000-000000000001';

IF NOT EXISTS (SELECT 1 FROM dbo.debt_budget_profiles WHERE user_id = @DemoUserId)
BEGIN
    INSERT INTO dbo.debt_budget_profiles (
        id, user_id, net_monthly_income, fixed_expenses, discretionary_budget,
        extra_income, emergency_fund_current, emergency_fund_target,
        emergency_monthly_contribution, short_term_buffer, strategy
    )
    VALUES (
        @DebtProfileId, @DemoUserId, 53000.00, 29298.00, 2620.00,
        0.00, 95000.00, 150000.00,
        5000.00, 0.00, N'avalanche'
    );
END

COMMIT TRANSACTION;
PRINT N'Seeding completed successfully!';
GO
