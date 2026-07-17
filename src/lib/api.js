// Fake API layer (Phase 1) — จำลอง REST endpoints ของ Go backend ด้วยข้อมูลในหน่วยความจำ
// ทุกฟังก์ชันคืน Promise + หน่วงเล็กน้อย เพื่อให้ UI จัดการ loading/error ได้เหมือนของจริง
// เปลี่ยนเป็น fetch() จริงภายหลังได้โดยไม่ต้องแก้ฝั่ง component
import {
  CATEGORIES,
  TRANSACTIONS,
  GOALS,
  PROFILE,
  BASE_SALARY,
  todayISO,
} from './mockData'
import { currentMonthKey, shiftMonth } from './format'

// state ที่แก้ไขได้ (clone จาก seed)
const db = {
  profile: { ...PROFILE },
  categories: [...CATEGORIES],
  transactions: [...TRANSACTIONS],
  goals: GOALS.map((g) => ({ ...g })),
}

let idSeq = 1000
const newId = () => `id-${idSeq++}`
const delay = (ms = 260) => new Promise((r) => setTimeout(r, ms))
const clone = (v) => JSON.parse(JSON.stringify(v))

const catById = (id) => db.categories.find((c) => c.id === id)
const monthOf = (isoDate) => (isoDate || '').slice(0, 7)

// ---------------- Savings model ----------------
// เงินออมเข้า  = รายจ่ายที่จัดอยู่ในหมวด "Savings" (ย้ายเงินเข้ากระปุก)
// ถอนเงินออม   = รายการที่จ่ายด้วย funding_source = 'savings' (ไม่นับตัวที่เป็นหมวด Savings เอง)
// คงเหลือ      = สะสมทั้งหมดตั้งแต่ต้นจนถึงวันสิ้นงวด (เข้า - ถอน)
const savingsCatId = () => db.categories.find((c) => c.name === 'Savings')?.id

function savingsIn(t) {
  return t.type === 'expense' && t.category_id === savingsCatId()
}
function savingsOut(t) {
  return t.funding_source === 'savings' && t.category_id !== savingsCatId()
}

/** รวมเงินออมเข้า/ออก ของรายการที่ผ่าน filter */
function sumSavings(rows) {
  let saved = 0
  let withdrawn = 0
  for (const t of rows) {
    if (savingsIn(t)) saved += t.amount
    else if (savingsOut(t)) withdrawn += t.amount
  }
  return { saved, withdrawn }
}

/** เงินออมคงเหลือสะสม ณ วันสิ้นงวด (endISO) */
function savingsRemainingAsOf(endISO) {
  const rows = db.transactions.filter((t) => t.transaction_date <= endISO)
  const { saved, withdrawn } = sumSavings(rows)
  return saved - withdrawn
}

/** วันสุดท้ายของเดือน "YYYY-MM" */
function endOfMonth(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  const last = new Date(y, m, 0).getDate()
  return `${monthKey}-${String(last).padStart(2, '0')}`
}

// ---------------- Profile ----------------
export async function getMe() {
  await delay(120)
  return clone(db.profile)
}

export async function updateMe(patch) {
  await delay()
  db.profile = { ...db.profile, ...patch }
  return clone(db.profile)
}

// ---------------- Categories ----------------
export async function getCategories() {
  await delay(120)
  return clone(db.categories)
}

export async function addCategory({ name_th, type, icon = 'Tag' }) {
  await delay()
  const name = name_th
  if (!name_th || !type) throw new Error('กรุณากรอกชื่อและประเภทหมวดหมู่')
  const exists = db.categories.some(
    (c) => c.name_th === name_th && c.type === type && !c.is_default,
  )
  if (exists) throw new Error('มีหมวดหมู่นี้อยู่แล้ว')
  const cat = {
    id: newId(),
    name,
    name_th,
    type,
    icon,
    is_default: false,
    user_id: db.profile.id,
  }
  db.categories.push(cat)
  return clone(cat)
}

export async function deleteCategory(id) {
  await delay()
  const cat = catById(id)
  if (cat?.is_default) throw new Error('ลบหมวดหมู่เริ่มต้นไม่ได้')
  db.categories = db.categories.filter((c) => c.id !== id)
  // รายการที่อ้างถึงหมวดนี้ ให้ category_id = null (ตาม on delete set null)
  db.transactions = db.transactions.map((t) =>
    t.category_id === id ? { ...t, category_id: null } : t,
  )
  return { ok: true }
}

// ---------------- Transactions ----------------
export async function getTransactions({ month, type, category_id } = {}) {
  await delay()
  let rows = db.transactions
  if (month) rows = rows.filter((t) => monthOf(t.transaction_date) === month)
  if (type) rows = rows.filter((t) => t.type === type)
  if (category_id) rows = rows.filter((t) => t.category_id === category_id)
  rows = [...rows].sort((a, b) =>
    a.transaction_date < b.transaction_date ? 1 : a.transaction_date > b.transaction_date ? -1 : 0,
  )
  // แนบข้อมูลหมวดหมู่ให้ frontend ใช้ได้เลย
  return clone(rows).map((t) => ({ ...t, category: catById(t.category_id) || null }))
}

function validateTransaction({ type, amount, transaction_date }) {
  if (!['income', 'expense'].includes(type)) throw new Error('ประเภทไม่ถูกต้อง')
  if (!(Number(amount) > 0)) throw new Error('จำนวนเงินต้องมากกว่า 0')
  if (!transaction_date) throw new Error('กรุณาระบุวันที่')
}

export async function addTransaction(input) {
  await delay()
  validateTransaction(input)
  const tx = {
    id: newId(),
    category_id: input.category_id || null,
    type: input.type,
    amount: Number(input.amount),
    description: input.description?.trim() || '',
    transaction_date: input.transaction_date || todayISO(),
    created_at: new Date().toISOString(),
    funding_source: input.funding_source || 'cash',
    funding_source_label: input.funding_source_label?.trim() || '',
    source: 'manual',
    ai_categorized: !!input.ai_categorized,
  }
  db.transactions.unshift(tx)
  return { ...clone(tx), category: catById(tx.category_id) || null }
}

export async function updateTransaction(id, patch) {
  await delay()
  const idx = db.transactions.findIndex((t) => t.id === id)
  if (idx === -1) throw new Error('ไม่พบรายการ')
  const merged = { ...db.transactions[idx], ...patch, amount: Number(patch.amount ?? db.transactions[idx].amount) }
  validateTransaction(merged)
  db.transactions[idx] = merged
  return { ...clone(merged), category: catById(merged.category_id) || null }
}

export async function deleteTransaction(id) {
  await delay()
  db.transactions = db.transactions.filter((t) => t.id !== id)
  return { ok: true }
}

// ---------------- Dashboard summary ----------------
export async function getDashboardSummary({ month } = {}) {
  await delay(320)
  const m = month || currentMonthKey()
  const inMonth = db.transactions.filter((t) => monthOf(t.transaction_date) === m)

  const income = inMonth.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
  const expense = inMonth.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)

  // breakdown รายจ่ายตามหมวด
  const map = new Map()
  for (const t of inMonth) {
    if (t.type !== 'expense') continue
    const cat = catById(t.category_id)
    const key = cat?.id || 'none'
    const cur = map.get(key) || { category_id: key, name_th: cat?.name_th || 'ไม่ระบุ', icon: cat?.icon || 'Tag', total: 0 }
    cur.total += t.amount
    map.set(key, cur)
  }
  const breakdown = [...map.values()].sort((a, b) => b.total - a.total)

  // แนวโน้ม 6 เดือน
  const trend = []
  for (let back = 5; back >= 0; back--) {
    const key = shiftMonth(m, -back)
    const rows = db.transactions.filter((t) => monthOf(t.transaction_date) === key)
    trend.push({
      month: key,
      income: rows.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0),
      expense: rows.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0),
    })
  }

  const recent = clone(
    [...inMonth]
      .sort((a, b) => (a.transaction_date < b.transaction_date ? 1 : -1))
      .slice(0, 6),
  ).map((t) => ({ ...t, category: catById(t.category_id) || null }))

  const { saved, withdrawn } = sumSavings(inMonth)

  return {
    month: m,
    income,
    expense,
    balance: income - expense,
    tx_count: inMonth.length,
    savings: {
      saved,
      withdrawn,
      remaining: savingsRemainingAsOf(endOfMonth(m)),
    },
    breakdown,
    trend,
    recent,
  }
}

// สรุปรายปี (12 เดือน) สำหรับหน้า Dashboard analytics
export async function getYearlySummary({ year } = {}) {
  await delay(320)
  const y = year || new Date().getFullYear()
  const months = []
  let income = 0
  let expense = 0
  let saved = 0
  let withdrawn = 0
  for (let mm = 1; mm <= 12; mm++) {
    const key = `${y}-${String(mm).padStart(2, '0')}`
    const rows = db.transactions.filter((t) => monthOf(t.transaction_date) === key)
    const inc = rows.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0)
    const exp = rows.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0)
    const sv = sumSavings(rows)
    months.push({
      month: key,
      income: inc,
      expense: exp,
      balance: inc - exp,
      saved: sv.saved,
      withdrawn: sv.withdrawn,
    })
    income += inc
    expense += exp
    saved += sv.saved
    withdrawn += sv.withdrawn
  }
  const activeMonths = months.filter((mo) => mo.income > 0 || mo.expense > 0).length || 1
  const best = [...months].sort((a, b) => b.balance - a.balance)[0]
  return {
    year: y,
    months,
    income,
    expense,
    balance: income - expense,
    avg_expense: Math.round(expense / activeMonths),
    avg_income: Math.round(income / activeMonths),
    best_month: best,
    savings: {
      saved,
      withdrawn,
      remaining: savingsRemainingAsOf(`${y}-12-31`),
    },
  }
}

// ---------------- Goals ----------------
export async function getGoals() {
  await delay()
  return clone(db.goals)
}

export async function addGoal(input) {
  await delay()
  if (!input.name?.trim()) throw new Error('กรุณาตั้งชื่อเป้าหมาย')
  if (!(Number(input.target_amount) > 0)) throw new Error('จำนวนเป้าหมายต้องมากกว่า 0')
  const goal = {
    id: newId(),
    name: input.name.trim(),
    target_amount: Number(input.target_amount),
    saved_amount: Number(input.saved_amount) || 0,
    target_date: input.target_date || null,
    status: 'active',
    ai_plan: null,
  }
  db.goals.unshift(goal)
  return clone(goal)
}

export async function updateGoal(id, patch) {
  await delay()
  const idx = db.goals.findIndex((g) => g.id === id)
  if (idx === -1) throw new Error('ไม่พบเป้าหมาย')
  db.goals[idx] = { ...db.goals[idx], ...patch }
  return clone(db.goals[idx])
}

export async function deleteGoal(id) {
  await delay()
  db.goals = db.goals.filter((g) => g.id !== id)
  return { ok: true }
}

// ---------------- AI (mock) ----------------
// จำลอง keyword_map + Gemini ตาม logic ใน spec ข้อ 6 — ทำงานฝั่ง frontend ชั่วคราวเท่านั้น
const KEYWORD_MAP = [
  { kw: ['kfc', 'mcdonald', 'ข้าว', 'ก๋วยเตี๋ยว', 'อาหาร', 'มื้อ', 'food', 'ส้มตำ', 'หมูกระทะ'], cat: 'Food' },
  { kw: ['กาแฟ', 'coffee', 'ลาเต้', 'อเมริกาโน่', 'ชานม', 'starbucks', 'amazon cafe', 'เครื่องดื่ม'], cat: 'Coffee & Drinks' },
  { kw: ['grab', 'แท็กซี่', 'รถไฟฟ้า', 'bts', 'mrt', 'น้ำมัน', 'วิน', 'เดินทาง', 'รถเมล์'], cat: 'Transport' },
  { kw: ['ค่าเช่า', 'ห้อง', 'หอพัก', 'rent', 'คอนโด'], cat: 'Housing' },
  { kw: ['ค่าไฟ', 'ค่าน้ำ', 'เน็ต', 'internet', 'ค่าโทรศัพท์', 'utilities'], cat: 'Utilities' },
  { kw: ['shopee', 'lazada', 'เสื้อ', 'รองเท้า', 'ช้อป', 'ซื้อของ', 'shopping'], cat: 'Shopping' },
  { kw: ['netflix', 'หนัง', 'เกม', 'บันเทิง', 'คอนเสิร์ต', 'spotify'], cat: 'Entertainment' },
  { kw: ['ยา', 'หมอ', 'โรงพยาบาล', 'คลินิก', 'วิตามิน', 'health'], cat: 'Health' },
  { kw: ['คอร์ส', 'เรียน', 'หนังสือ', 'course', 'education'], cat: 'Education' },
]

function normalize(desc) {
  return (desc || '')
    .toLowerCase()
    .replace(/[0-9,.]+/g, ' ')
    .replace(/[฿$]/g, ' ')
    .trim()
}

export async function aiCategorize({ description }) {
  await delay(700) // จำลองการเรียกโมเดล
  const text = normalize(description)
  let matchName = null
  let fromCache = false

  for (const entry of KEYWORD_MAP) {
    if (entry.kw.some((k) => text.includes(k))) {
      matchName = entry.cat
      fromCache = true
      break
    }
  }
  // ไม่เจอใน cache -> จำลองการเดาแบบ AI (confidence ต่ำ -> Other)
  const category =
    db.categories.find((c) => c.name === (matchName || 'Other') && c.type === 'expense') ||
    db.categories.find((c) => c.name === 'Other')

  return {
    category_id: category.id,
    category_name: category.name_th,
    confidence: fromCache ? 0.95 : 0.55,
    from_cache: fromCache,
  }
}

export async function aiGoalPlan({ goal_id }) {
  await delay(900)
  const goal = db.goals.find((g) => g.id === goal_id)
  if (!goal) throw new Error('ไม่พบเป้าหมาย')

  const remaining = Math.max(0, goal.target_amount - goal.saved_amount)
  const monthsLeft = goal.target_date ? Math.max(1, monthsBetween(new Date(), new Date(goal.target_date))) : 12
  const requiredMonthly = Math.round(remaining / monthsLeft)

  // เฉลี่ยรายรับ/รายจ่าย 3 เดือนล่าสุด
  const avg = averageLast3Months()
  const currentSurplus = Math.round(avg.income - avg.expense)

  const otRate = BASE_SALARY / 30 / 8 * 1.5
  const otHoursNeeded = Math.max(0, Math.ceil((requiredMonthly - currentSurplus) / otRate))

  // เลือกหมวด discretionary ที่ยอดสูงเพื่อแนะนำให้ลด
  const discretionary = ['Coffee & Drinks', 'Entertainment', 'Shopping']
  const cutSuggestions = Object.entries(avg.byCategory)
    .filter(([name]) => discretionary.includes(name))
    .map(([name, amount]) => ({
      category: catNameTh(name),
      current_avg: Math.round(amount),
      suggested_cut: Math.round(amount * 0.3),
    }))
    .filter((c) => c.suggested_cut > 0)
    .sort((a, b) => b.suggested_cut - a.suggested_cut)

  const advice_th =
    currentSurplus >= requiredMonthly
      ? `เยี่ยมมาก! เงินเหลือเฉลี่ยเดือนละ ${currentSurplus.toLocaleString()} บาท มากพอสำหรับเป้าหมายนี้อยู่แล้ว เพียงกันเงินออกอัตโนมัติทุกเดือนก็ถึงเป้าตามกำหนด 💪`
      : `ต้องเก็บเพิ่มเดือนละ ${requiredMonthly.toLocaleString()} บาท แต่ตอนนี้เหลือเฉลี่ย ${currentSurplus.toLocaleString()} บาท ลองลดค่าใช้จ่ายในหมวดที่แนะนำ หรือทำ OT อีกประมาณ ${otHoursNeeded} ชั่วโมง/เดือน ก็จะไปถึงเป้าหมายได้ ค่อยๆ ทำไปนะ ทำได้แน่นอน! ✨`

  const plan = {
    required_monthly: requiredMonthly,
    months_left: monthsLeft,
    current_surplus: currentSurplus,
    ot_hours_needed: otHoursNeeded,
    cut_suggestions: cutSuggestions,
    advice_th,
  }
  goal.ai_plan = plan
  return clone(plan)
}

export async function aiWhatIf({ question }) {
  await delay(900)
  const avg = averageLast3Months()
  const q = (question || '').toLowerCase()

  let monthlyEffect = 0
  let label = ''

  const coffee = avg.byCategory['Coffee & Drinks'] || 0
  const shopping = avg.byCategory['Shopping'] || 0
  const ent = avg.byCategory['Entertainment'] || 0
  const food = avg.byCategory['Food'] || 0
  const housing = avg.byCategory['Housing'] || 0
  const surplus = Math.round(avg.income - avg.expense)

  // ค่าประมาณสำหรับสถานการณ์ที่ "เพิ่มภาระ" (ไม่มีอยู่ในข้อมูลผู้ใช้)
  const HOUSE_INSTALLMENT = 12000
  const CAR_INSTALLMENT = 8000

  if (q.includes('กาแฟ') || q.includes('coffee')) {
    monthlyEffect = coffee
    label = 'เลิกซื้อกาแฟ'
  } else if (q.includes('ทำอาหาร') || q.includes('กินข้าวบ้าน') || q.includes('eat at home') || q.includes('cook')) {
    monthlyEffect = Math.round(food * 0.4)
    label = 'ทำอาหารกินเอง'
  } else if (q.includes('ลงทุน') || q.includes('invest')) {
    monthlyEffect = Math.max(2000, Math.round(surplus * 0.5))
    label = 'ลงทุนทุกเดือน'
  } else if (q.includes('บ้าน') || q.includes('house')) {
    // ผ่อนบ้านแทนค่าเช่าปัจจุบัน -> ส่วนต่างคือภาระที่เพิ่มขึ้น
    monthlyEffect = -Math.max(0, HOUSE_INSTALLMENT - Math.round(housing))
    label = 'ซื้อบ้าน'
  } else if (q.includes('รถ') || q.includes('car')) {
    monthlyEffect = -CAR_INSTALLMENT
    label = 'ซื้อรถใหม่'
  } else if (q.includes('ช้อป') || q.includes('shopping')) {
    monthlyEffect = Math.round(shopping * 0.5)
    label = 'ลดช้อปปิ้งลงครึ่งหนึ่ง'
  } else if (q.includes('บันเทิง') || q.includes('netflix') || q.includes('หนัง')) {
    monthlyEffect = ent
    label = 'ตัดค่าบันเทิง'
  } else if (q.includes('เงินเดือน') || q.includes('ขึ้น')) {
    const pctMatch = q.match(/(\d+)\s*%/)
    const pct = pctMatch ? Number(pctMatch[1]) : 10
    monthlyEffect = Math.round((BASE_SALARY * pct) / 100)
    label = `เงินเดือนขึ้น ${pct}%`
  } else if (q.includes('save') || q.includes('ออม') || q.includes('เก็บเงิน')) {
    const pctMatch = q.match(/(\d+)\s*%/)
    const amountMatch = q.match(/([0-9][0-9,]{2,})/)
    if (pctMatch) {
      monthlyEffect = Math.round((avg.income * Number(pctMatch[1])) / 100)
      label = `ออม ${pctMatch[1]}% ของรายรับ`
    } else if (amountMatch) {
      monthlyEffect = Number(amountMatch[1].replace(/,/g, ''))
      label = `ออมเดือนละ ${monthlyEffect.toLocaleString()} บาท`
    } else {
      monthlyEffect = Math.round(avg.income * 0.1)
      label = 'ออม 10% ของรายรับ'
    }
  } else {
    // fallback ทั่วไป: สมมติประหยัดได้ 10% ของรายจ่าย
    monthlyEffect = Math.round(avg.expense * 0.1)
    label = 'ประหยัดค่าใช้จ่าย 10%'
  }

  const abs = Math.abs(monthlyEffect)
  const isCost = monthlyEffect < 0

  return {
    label,
    direction: isCost ? 'cost' : 'save',
    monthly: monthlyEffect,
    yearly: monthlyEffect * 12,
    fiveYear: monthlyEffect * 12 * 5,
    insight_th: isCost
      ? `ถ้า${label} จะมีภาระเพิ่มเดือนละ ${abs.toLocaleString()} บาท คิดเป็น ${(abs * 12).toLocaleString()} บาท/ปี — ตอนนี้เหลือเฉลี่ยเดือนละ ${surplus.toLocaleString()} บาท ลองเช็กว่ารองรับไหวก่อนตัดสินใจ`
      : `ถ้า${label} จะช่วยให้มีเงินเพิ่มขึ้นเดือนละ ${abs.toLocaleString()} บาท คิดเป็น ${(abs * 12).toLocaleString()} บาท/ปี — ลองกันเงินส่วนนี้ไปลงทุนหรือเก็บออม จะเห็นผลชัดในระยะยาว`,
  }
}

// ---------------- helpers ----------------
function monthsBetween(a, b) {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
}

function catNameTh(name) {
  return db.categories.find((c) => c.name === name)?.name_th || name
}

function averageLast3Months() {
  const now = currentMonthKey()
  const months = [0, 1, 2].map((i) => shiftMonth(now, -i))
  let income = 0
  let expense = 0
  const byCategory = {}
  for (const t of db.transactions) {
    const mk = monthOf(t.transaction_date)
    if (!months.includes(mk)) continue
    if (t.type === 'income') income += t.amount
    else {
      expense += t.amount
      const name = catById(t.category_id)?.name || 'Other'
      byCategory[name] = (byCategory[name] || 0) + t.amount
    }
  }
  const n = months.length
  const avgByCat = {}
  for (const k of Object.keys(byCategory)) avgByCat[k] = byCategory[k] / n
  return { income: income / n, expense: expense / n, byCategory: avgByCat }
}
