// ข้อมูลจำลอง (mock) สำหรับ Phase 1 — frontend อย่างเดียว ยังไม่ต่อ backend
// โครงสร้างอิงตาม schema ใน PROJECT_SPEC.md เพื่อให้เปลี่ยนเป็น API จริงได้ง่ายภายหลัง
import { currentMonthKey, shiftMonth, todayISO } from './format'

let seq = 1
const uid = () => `id-${seq++}`

// ---------- Categories (default ตาม spec, is_default = true) ----------
export const CATEGORIES = [
  // income
  { id: uid(), name: 'Salary', name_th: 'เงินเดือน', type: 'income', icon: 'Wallet', is_default: true },
  { id: uid(), name: 'Overtime', name_th: 'ค่า OT', type: 'income', icon: 'Clock', is_default: true },
  { id: uid(), name: 'Bonus', name_th: 'โบนัส', type: 'income', icon: 'Gift', is_default: true },
  { id: uid(), name: 'Side Income', name_th: 'รายได้เสริม', type: 'income', icon: 'Briefcase', is_default: true },
  // expense
  { id: uid(), name: 'Food', name_th: 'อาหาร', type: 'expense', icon: 'UtensilsCrossed', is_default: true },
  { id: uid(), name: 'Coffee & Drinks', name_th: 'กาแฟ', type: 'expense', icon: 'Coffee', is_default: true },
  { id: uid(), name: 'Transport', name_th: 'เดินทาง', type: 'expense', icon: 'Bus', is_default: true },
  { id: uid(), name: 'Housing', name_th: 'ที่พัก', type: 'expense', icon: 'Home', is_default: true },
  { id: uid(), name: 'Utilities', name_th: 'น้ำไฟเน็ต', type: 'expense', icon: 'Plug', is_default: true },
  { id: uid(), name: 'Shopping', name_th: 'ช้อปปิ้ง', type: 'expense', icon: 'ShoppingBag', is_default: true },
  { id: uid(), name: 'Entertainment', name_th: 'บันเทิง', type: 'expense', icon: 'Clapperboard', is_default: true },
  { id: uid(), name: 'Health', name_th: 'สุขภาพ', type: 'expense', icon: 'HeartPulse', is_default: true },
  { id: uid(), name: 'Education', name_th: 'การศึกษา', type: 'expense', icon: 'GraduationCap', is_default: true },
  { id: uid(), name: 'Savings', name_th: 'เงินออม', type: 'expense', icon: 'PiggyBank', is_default: true },
  { id: uid(), name: 'Other', name_th: 'อื่นๆ', type: 'expense', icon: 'Ellipsis', is_default: true },
]

const catByName = (name) => CATEGORIES.find((c) => c.name === name)

export const BASE_SALARY = 32000

// ---------- Transactions ----------
// สร้างรายการย้อนหลัง 6 เดือน ให้ dashboard มีข้อมูลกราฟ
const EXPENSE_TEMPLATES = [
  { cat: 'Food', desc: 'ข้าวมันไก่', min: 45, max: 90, perMonth: 22 },
  { cat: 'Coffee & Drinks', desc: 'ลาเต้ร้านกาแฟ', min: 55, max: 120, perMonth: 14 },
  { cat: 'Transport', desc: 'ค่ารถไฟฟ้า', min: 30, max: 80, perMonth: 18 },
  { cat: 'Housing', desc: 'ค่าเช่าห้อง', min: 6500, max: 6500, perMonth: 1 },
  { cat: 'Utilities', desc: 'ค่าน้ำไฟเน็ต', min: 900, max: 1600, perMonth: 2 },
  { cat: 'Shopping', desc: 'ซื้อของใช้', min: 200, max: 1500, perMonth: 3 },
  { cat: 'Entertainment', desc: 'ดูหนัง/Netflix', min: 150, max: 600, perMonth: 2 },
  { cat: 'Health', desc: 'ยา/วิตามิน', min: 120, max: 800, perMonth: 1 },
]

function randBetween(min, max) {
  if (min === max) return min
  return Math.round((min + Math.random() * (max - min)) / 5) * 5
}

// สร้าง created_at ให้มีเวลาในวัน เพื่อให้แท็บ Daily เรียงตามเวลา + แสดงเวลาได้
const withTime = (dateStr, hour) =>
  `${dateStr}T${String(hour).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00`

function buildTransactions() {
  const txns = []
  const now = new Date()
  const thisMonth = currentMonthKey(now)

  for (let back = 5; back >= 0; back--) {
    const monthKey = shiftMonth(thisMonth, -back)
    const [y, m] = monthKey.split('-').map(Number)
    const daysInMonth = new Date(y, m, 0).getDate()
    // เดือนปัจจุบันให้ใส่รายการถึงแค่วันนี้เท่านั้น
    const maxDay = back === 0 ? now.getDate() : daysInMonth

    const dayISO = (day) =>
      `${y}-${String(m).padStart(2, '0')}-${String(Math.min(day, maxDay)).padStart(2, '0')}`

    // เงินเดือน (income) วันที่ 1 ของเดือน
    txns.push({
      id: uid(),
      category_id: catByName('Salary').id,
      type: 'income',
      amount: BASE_SALARY,
      description: 'เงินเดือน',
      transaction_date: dayISO(1),
      created_at: withTime(dayISO(1), 9),
      source: 'salary_sync',
      ai_categorized: false,
    })

    // OT บางเดือน
    if (Math.random() > 0.4) {
      txns.push({
        id: uid(),
        category_id: catByName('Overtime').id,
        type: 'income',
        amount: randBetween(1500, 4500),
        description: 'ค่าล่วงเวลา',
        transaction_date: dayISO(20),
        created_at: withTime(dayISO(20), 18),
        source: 'manual',
        ai_categorized: false,
      })
    }

    // รายจ่ายตาม template
    for (const t of EXPENSE_TEMPLATES) {
      const count = back === 0 ? Math.ceil((t.perMonth * maxDay) / daysInMonth) : t.perMonth
      for (let i = 0; i < count; i++) {
        const day = 1 + Math.floor(Math.random() * maxDay)
        const dateStr = dayISO(day)
        txns.push({
          id: uid(),
          category_id: catByName(t.cat).id,
          type: 'expense',
          amount: randBetween(t.min, t.max),
          description: t.desc,
          transaction_date: dateStr,
          created_at: withTime(dateStr, 7 + Math.floor(Math.random() * 14)),
          source: 'manual',
          ai_categorized: Math.random() > 0.7,
        })
      }
    }
  }

  // เรียงใหม่ล่าสุดขึ้นก่อน
  return txns.sort((a, b) =>
    a.transaction_date < b.transaction_date ? 1 : a.transaction_date > b.transaction_date ? -1 : 0,
  )
}

export const TRANSACTIONS = buildTransactions()

// ---------- Goals ----------
export const GOALS = [
  {
    id: uid(),
    name: 'เที่ยวญี่ปุ่น',
    target_amount: 60000,
    saved_amount: 24000,
    target_date: shiftMonth(currentMonthKey(), 8) + '-01',
    status: 'active',
    ai_plan: null,
  },
  {
    id: uid(),
    name: 'กองทุนฉุกเฉิน 3 เดือน',
    target_amount: 90000,
    saved_amount: 51000,
    target_date: shiftMonth(currentMonthKey(), 12) + '-01',
    status: 'active',
    ai_plan: null,
  },
]

// ---------- Profile ----------
export const PROFILE = {
  id: uid(),
  display_name: 'คุณรุ่งทิพย์',
  base_salary: BASE_SALARY,
  currency: 'THB',
}

export { todayISO }
