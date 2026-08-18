# 💰 Walletly (FinSmart Thai) - ระบบบริหารการเงินส่วนบุคคลครบวงจร (React + Vite)

**Walletly** เว็บแอปพลิเคชันจัดการการเงินส่วนบุคคลยุคใหม่ พัฒนาด้วย **React + Vite** ครอบคลุมตั้งแต่การบันทึกรายรับ-รายจ่าย, พยากรณ์กระแสเงินสดล่วงหน้า, ควบคุมฟิกคอสประจำเดือน, จัดสรรงบประมาณตามสูตร 50/30/20 & 6 Jars, วางแผนเป้าหมายการเงิน, ไปจนถึงการคำนวณภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด. 90/91)

---

## ✨ ฟีเจอร์เด่นของระบบ (Core Features)

1. 📊 **แดชบอร์ดภาพรวมการเงิน (Dashboard Overview)**
   - สรุปรายรับรวม, รายจ่ายรวม, ยอดเงินคงเหลือสุทธิ, ฟิกคอสประจำเดือน
   - รายการธุรกรรมล่าสุด และ Mini Checklist ค่าใช้จ่ายคงที่รอบเดือนนี้

2. 📝 **บันทึกรายรับ-รายจ่าย (Transaction Tracker)**
   - บันทึกแยกประเภท: รายรับ (Income), รายจ่ายทั่วไป (Expense), ฟิกคอส (Fixed Cost), และออม/ลงทุน (Savings/Investment)
   - ระบบค้นหาและตัวกรองตามประเภทรายการ
   - ส่งออกข้อมูลเป็นไฟล์ CSV

3. 🗓️ **จัดการฟิกคอสรายเดือน (Monthly Fixed Costs)**
   - ควบคุมภาระค่าใช้จ่ายคงที่ (ค่าผ่อนบ้าน, ค่าผ่อนรถ, ค่าเน็ต, ประกัน, Subscriptions)
   - กำหนดรอบวันที่ต้องจ่าย (Due Date) พร้อมปุ่มติ๊กสถานะ "ชำระแล้ว / รอชำระ"
   - คำนวณ Fixed Cost Burden Ratio (% ภาระต่อรายได้) ป้องกันค่าใช้จ่ายเกินตัว
   - ปุ่มเริ่มรอบเดือนใหม่ (Reset Monthly Status) ใน 1 คลิก

4. 🔮 **คำนวณการใช้เงินล่วงหน้า & สภาพคล่อง (Cash Flow Forecast & Simulator)**
   - คำนวณงบกินใช้ปลอดภัยต่อวัน (Safe Daily Spend)
   - ประมาณการเงินคงเหลือสิ้นเดือนและระยะเวลาสภาพคล่อง (Runway Days/Months)
   - **"Can I Afford It?" Simulator**: เครื่องมือจำลองก่อนตัดสินใจซื้อของชิ้นใหญ่ (จ่ายสด vs ผ่อน 0% X เดือน) เพื่อดูผลกระทบต่อสภาพคล่อง

5. 🥧 **แบ่งสัดส่วน % งบประมาณ (Bucket Budgeting)**
   - รองรับสูตรสากล: **50/30/20 Rule**, **60/20/20**, **70/20/10**, และ **6 Jars System**
   - คำนวณยอดเงินบาทให้อัตโนมัติตามฐานรายได้ต่อเดือน
   - เปรียบเทียบงบประมาณที่จัดสรร vs ยอดที่ใช้จ่ายจริง พร้อมแถบความคืบหน้า

6. 🎯 **วางแผนการออม & ลงทุน (Savings & Wealth Goals)**
   - ตั้งเป้าหมายทางการเงินและแถบแสดงความคืบหน้า (Progress Bar)
   - ปุ่ม "+ ฝากเพิ่ม" เข้าเป้าหมาย และบันทึกลงบัญชีออมอัตโนมัติ
   - **Emergency Fund Calculator**: คำนวณเงินสำรองฉุกเฉิน 3, 6, 12 เดือน จากฐานค่าใช้จ่ายจริง พร้อมปุ่มสร้างเป้าหมายใน 1 คลิก
   - **Compound Interest Calculator**: เครื่องมือคำนวณพลังดอกเบี้ยทบต้นและผลตอบแทนในอนาคต

7. 🧾 **คำนวณภาษีบุคคลธรรมดา ภ.ง.ด. 90/91 (Thai Tax Calculator)**
   - โครงสร้างภาษีขั้นบันได 0% - 35%
   - หักค่าใช้จ่าย 50% สูงสุด 100,000 บาท
   - ค่าลดหย่อนส่วนตัว, บิดามารดา, บุตร, ประกันสังคม, ประกันชีวิต/สุขภาพ
   - กองทุนลดหย่อนภาษี: SSF, RMF, ThaiESG, สำรองเลี้ยงชีพ (PVD)
   - สิทธิลดหย่อนพิเศษ: ดอกเบี้ยกู้บ้าน, Easy E-Receipt, เงินบริจาค
   - สรุปยอดขอคืนภาษี (Tax Refund) หรือ ภาษีที่ต้องชำระเพิ่ม (Tax Due)

8. 📈 **รายงานสถิติ & สำรองข้อมูล (Reports & Backup)**
   - กราฟโดนัทจำแนกสัดส่วนค่าใช้จ่ายตามหมวดหมู่ (Chart.js)
   - กราฟแท่งเปรียบเทียบกระแสเงินสด
   - กราฟสัดส่วน Fixed vs Variable vs Savings
   - สำรองข้อมูลเป็นไฟล์ JSON (Export/Import Backup) และปุ่มโหลดข้อมูลตัวอย่าง (Demo Data)

---

## 🛠️ โครงสร้างโปรเจกต์ (React Component Architecture)

```
FE_wallet/
├── index.html                  # HTML Root Entry
├── package.json                # Dependencies: React 18, Vite, Lucide React, Chart.js
├── vite.config.js              # Vite Config
├── src/
│   ├── main.jsx                # React Entry Point
│   ├── App.jsx                 # App Shell & Router
│   ├── index.css               # Design System & Theme Styles
│   ├── context/
│   │   └── WalletContext.jsx   # Global State & LocalStorage Sync
│   ├── data/
│   │   ├── demoData.js         # Realistic Thai Financial Scenario
│   │   └── constants.js        # Categories & Presets
│   ├── utils/
│   │   ├── formatters.js       # Thai Baht & Date Formatters
│   │   └── taxCalculator.js    # Thai Tax ภ.ง.ด. 90/91 Calculation Engine
│   └── components/
│       ├── common/
│       │   ├── Navbar.jsx
│       │   ├── StatCard.jsx
│       │   ├── Modal.jsx
│       │   └── Toast.jsx
│       ├── modals/
│       │   ├── AddTransactionModal.jsx
│       │   ├── AddFixedCostModal.jsx
│       │   ├── AddGoalModal.jsx
│       │   └── QuickDepositModal.jsx
│       └── tabs/
│           ├── DashboardTab.jsx
│           ├── TransactionsTab.jsx
│           ├── FixedCostsTab.jsx
│           ├── ProjectionTab.jsx
│           ├── AllocationTab.jsx
│           ├── SavingsTab.jsx
│           ├── TaxTab.jsx
│           └── ReportsTab.jsx
└── README.md
```

---

## 🚀 วิธีการรันโปรเจกต์ (Development & Build)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. รันโหมด Development Server
```bash
npm run dev
```
เปิดเบราว์เซอร์ไปที่: `http://localhost:3000`

### 3. Build สำหรับ Production
```bash
npm run build
```
ไฟล์ production bundle จะถูกสร้างไว้ในโฟลเดอร์ `dist/`
