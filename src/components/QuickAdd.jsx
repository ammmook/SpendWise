// AI Quick Add — โมดัลผู้ช่วย AI (ออกแบบใหม่ทั้งหมด: aurora glow + glass card + gradient focus ring)
// เปิดจากปุ่ม FAB บนหน้า Home เท่านั้น
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Sparkles, X, Check } from 'lucide-react'
import { addTransaction, aiCategorize } from '../lib/api'
import { FUNDING_SOURCES } from '../lib/mockData'
import { formatMoney, todayISO } from '../lib/format'
import { playCashSound } from '../lib/sound'
import { CategoryIcon, Select } from './ui'

const SUGGESTIONS = [
  { emoji: '🍔', text: 'KFC 249' },
  { emoji: '☕', text: 'Coffee 85' },
  { emoji: '🛒', text: 'Grocery 560' },
  { emoji: '⛽', text: 'Fuel 1,000' },
  { emoji: '💰', text: 'Salary 35,000' },
]

// แยกจำนวนเงินที่อยู่ท้ายข้อความ เช่น "KFC 249" -> { description: 'KFC', amount: 249 }
function parseQuickInput(text) {
  const m = text.trim().match(/^(.*?)[\s]*([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*$/)
  if (!m) return { description: text.trim(), amount: '' }
  return { description: m[1].trim(), amount: Number(m[2].replace(/,/g, '')) }
}

// ตรวจว่าเป็น "รายรับ" ไหม (เช่น ชิป "Salary 35,000") แล้วเลือกหมวดรายรับให้ตรง
const INCOME_RULES = [
  { kw: ['salary', 'เงินเดือน'], cat: 'Salary' },
  { kw: ['bonus', 'โบนัส'], cat: 'Bonus' },
  { kw: ['overtime', 'ot', 'ล่วงเวลา'], cat: 'Overtime' },
  { kw: ['received', 'รายได้', 'รับเงิน', 'freelance'], cat: 'Side Income' },
]
function detectIncomeCategory(description, categories) {
  const text = description.toLowerCase()
  for (const rule of INCOME_RULES) {
    if (rule.kw.some((k) => text.includes(k))) {
      return categories.find((c) => c.name === rule.cat && c.type === 'income') || null
    }
  }
  return null
}

export default function QuickAddModal({ categories, defaultDate, onClose, onSaved }) {
  const [text, setText] = useState('')
  const [focused, setFocused] = useState(false)
  const [pending, setPending] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  // ปิดด้วย ESC + ล็อค scroll + โฟกัสช่องพิมพ์ทันที
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose?.()
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    inputRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  const pendingCats = pending ? categories.filter((c) => c.type === pending.type) : []

  async function analyze(e) {
    e.preventDefault()
    setError('')
    const { description, amount } = parseQuickInput(text)
    if (!description) return setError('พิมพ์รายละเอียด เช่น “KFC 249”')
    if (!(amount > 0)) return setError('ระบุจำนวนเงินท้ายข้อความ เช่น “กาแฟ 60”')

    setAnalyzing(true)
    try {
      const incomeCat = detectIncomeCategory(description, categories)
      if (incomeCat) {
        setPending({
          description,
          amount,
          type: 'income',
          category_id: incomeCat.id,
          funding_source: 'salary',
          confidence: 0.92,
          ai_categorized: true,
        })
      } else {
        const ai = await aiCategorize({ description, amount })
        setPending({
          description,
          amount,
          type: 'expense',
          category_id: ai.category_id,
          funding_source: 'cash',
          confidence: ai.confidence,
          ai_categorized: true,
        })
      }
    } catch {
      setError('วิเคราะห์ไม่สำเร็จ ลองใหม่อีกครั้ง')
    } finally {
      setAnalyzing(false)
    }
  }

  async function confirm() {
    setSaving(true)
    try {
      await addTransaction({
        description: pending.description,
        amount: pending.amount,
        type: pending.type,
        category_id: pending.category_id,
        funding_source: pending.funding_source,
        transaction_date: defaultDate || todayISO(),
        ai_categorized: pending.ai_categorized,
      })
      playCashSound()
      onSaved()
    } catch {
      setError('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง')
      setSaving(false)
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center overflow-hidden sm:items-center sm:p-4">
      {/* ฉากหลัง */}
      <div
        className="animate-fade-in absolute inset-0 bg-ink/25 backdrop-blur-[3px]"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* gradient สำหรับระบายเส้นไอคอน */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="ai-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F76174" />
            <stop offset="100%" stopColor="#4F72E5" />
          </linearGradient>
        </defs>
      </svg>

      <div className="animate-scale-in relative isolate w-full max-w-[520px]">
        {/* Aurora — ก้อนแสงเบลอรอบโมดัล (opacity ต่ำ ให้เรืองแสง ไม่ใช่พื้นทึบ) */}
        <div aria-hidden="true" className="pointer-events-none absolute -inset-16 -z-10">
          <div className="absolute -left-4 -top-6 h-64 w-64 rounded-full bg-[#F76174] opacity-[0.18] blur-[90px]" />
          <div className="absolute -right-6 top-8 h-72 w-72 rounded-full bg-[#4F72E5] opacity-[0.16] blur-[100px]" />
          <div className="absolute -bottom-8 left-1/4 h-64 w-64 rounded-full bg-[#F76174] opacity-[0.10] blur-[100px]" />
        </div>

        {/* การ์ดโมดัล — กระจกขาว ขอบบาง เงานุ่ม */}
        <div
          role="dialog"
          aria-modal="true"
          aria-label="AI Quick Add"
          className="rounded-t-[24px] border border-white/70 bg-white/90 p-6 shadow-[0_24px_70px_-20px_rgb(10_10_10/0.35)] backdrop-blur-xl sm:rounded-[24px] sm:p-7"
        >
          {/* Header — ขาวสะอาด ไอคอนไล่สี AI */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-[22px] w-[22px]" style={{ stroke: 'url(#ai-grad)' }} strokeWidth={2} />
              <h2 className="text-[17px] font-medium tracking-tight text-ink">AI Quick Add</h2>
            </div>
            <button
              onClick={onClose}
              aria-label="ปิด"
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors duration-200 hover:bg-ink/5 hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* ช่องพิมพ์ — พระเอกของโมดัล */}
          <div className="relative mt-6">
            {/* วงเรืองแสงนุ่มๆ ตอนโฟกัส */}
            <div
              aria-hidden="true"
              className={`ai-gradient pointer-events-none absolute -inset-2 rounded-[24px] blur-lg transition-opacity duration-300 ${
                focused ? 'opacity-25' : 'opacity-0'
              }`}
            />
            {/* เส้นขอบไล่สีตอนโฟกัส */}
            <div
              aria-hidden="true"
              className={`ai-gradient pointer-events-none absolute -inset-[1.5px] rounded-[18px] transition-opacity duration-200 ${
                focused ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <input
              ref={inputRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && analyze(e)}
              placeholder="Describe your expense naturally..."
              className="relative w-full rounded-2xl border border-hairline bg-white px-5 py-4 text-[15px] text-ink placeholder:text-muted-soft shadow-[inset_0_1px_3px_rgb(10_10_10/0.06)] transition-colors duration-200 focus:border-transparent focus:outline-none"
            />
          </div>

          {/* ชิปตัวอย่าง — กดแล้วเติมข้อความให้ */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.text}
                type="button"
                onClick={() => {
                  setText(s.text)
                  inputRef.current?.focus()
                }}
                className="rounded-full border border-hairline bg-white/70 px-3 py-1.5 text-xs font-medium text-body transition-colors duration-200 hover:border-ink/20 hover:bg-white hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-ink/15"
              >
                <span className="mr-1">{s.emoji}</span>
                {s.text}
              </button>
            ))}
          </div>

          {error && <p className="mt-3 text-sm font-medium text-expense">{error}</p>}

          {/* ปุ่มวิเคราะห์ / สถานะกำลังวิเคราะห์ */}
          <div className="mt-5">
            {analyzing ? (
              <div className="ai-gradient relative flex h-[50px] items-center justify-center overflow-hidden rounded-full px-5 text-white">
                <span className="relative z-10 flex animate-pulse items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  AI is analyzing your transaction...
                </span>
                {/* shimmer กวาดผ่าน */}
                <span
                  aria-hidden="true"
                  className="animate-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent"
                />
              </div>
            ) : (
              <button
                onClick={analyze}
                className="ai-gradient flex h-[50px] w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgb(79_114_229/0.65)] transition-[filter,box-shadow] duration-200 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4F72E5]/25"
              >
                <Sparkles className="h-4 w-4" />
                Analyze with AI
              </button>
            )}
          </div>

          {/* ผลลัพธ์จาก AI */}
          {pending && !analyzing && (
            <div className="animate-result-in mt-4 rounded-2xl border border-hairline bg-white p-4">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-card text-ink">
                  <CategoryIcon
                    name={categories.find((c) => c.id === pending.category_id)?.icon}
                    className="h-[18px] w-[18px]"
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink">{pending.description}</p>
                  <p className="text-xs text-muted">
                    {pending.type === 'income' ? 'รายรับ' : 'รายจ่าย'} · ความมั่นใจ{' '}
                    {Math.round(pending.confidence * 100)}%
                  </p>
                </div>
                <span
                  className="shrink-0 text-sm font-semibold tabular"
                  style={{ color: pending.type === 'income' ? '#22c55e' : '#0a0a0a' }}
                >
                  {pending.type === 'income' ? '+' : '-'}
                  {formatMoney(pending.amount)}
                </span>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Select
                  value={pending.category_id}
                  onChange={(e) => setPending((p) => ({ ...p, category_id: e.target.value }))}
                  className="h-9 text-xs"
                >
                  {pendingCats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_th}
                    </option>
                  ))}
                </Select>
                <Select
                  value={pending.funding_source}
                  onChange={(e) => setPending((p) => ({ ...p, funding_source: e.target.value }))}
                  className="h-9 text-xs"
                >
                  {FUNDING_SOURCES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {pending.type === 'income' ? 'เข้าที่' : 'จ่ายด้วย'}: {s.label}
                    </option>
                  ))}
                </Select>
              </div>

              {pending.confidence < 0.7 && (
                <p className="mt-2 text-xs text-muted">AI ไม่ค่อยมั่นใจ — ตรวจสอบหมวดก่อนยืนยัน</p>
              )}

              <button
                onClick={confirm}
                disabled={saving}
                className="mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white transition-[opacity,transform] duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-45"
              >
                <Check className="h-4 w-4" />
                {saving ? 'กำลังบันทึก...' : 'ยืนยัน'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
