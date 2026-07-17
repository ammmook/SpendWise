// Simulation — หน้าถาม AI เรื่องอนาคตการเงิน (ออกแบบใหม่: aurora hero + prompt เป็นพระเอก)
import { useRef, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, CalendarDays, CalendarRange, TrendingUp, TrendingDown } from 'lucide-react'
import { aiWhatIf } from '../lib/api'
import { formatMoney } from '../lib/format'

// การ์ดลอย — ขาว ขอบบางโปร่ง เงานุ่ม กระจกบางๆ (ไม่มีพื้นสีซ้อนกัน)
const FLOATING_CARD =
  'relative z-10 rounded-[24px] border border-ink/[0.06] bg-white/80 shadow-[0_8px_32px_-12px_rgb(10_10_10/0.12)] backdrop-blur-[12px]'

const SUGGESTIONS = [
  { emoji: '☕', text: 'Stop buying coffee' },
  { emoji: '🍔', text: 'Eat at home' },
  { emoji: '💰', text: 'Save 10% of income' },
  { emoji: '📈', text: 'Invest every month' },
  { emoji: '🏡', text: 'Buy a house' },
  { emoji: '🚗', text: 'Buy a new car' },
]

const INCOME_COLOR = '#22c55e'
const EXPENSE_COLOR = '#ef4444'

export default function WhatIf() {
  const [question, setQuestion] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef(null)
  const mutation = useMutation({ mutationFn: (q) => aiWhatIf({ question: q }) })

  function ask(e) {
    e?.preventDefault?.()
    const query = question.trim()
    if (!query) return
    mutation.mutate(query)
  }

  const result = mutation.data
  const loading = mutation.isPending

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* gradient สำหรับระบายเส้นไอคอน */}
      <svg width="0" height="0" className="absolute" aria-hidden="true">
        <defs>
          <linearGradient id="sim-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F76174" />
            <stop offset="100%" stopColor="#4F72E5" />
          </linearGradient>
        </defs>
      </svg>

      {/* ===== Hero: การ์ด prompt ลอยบนพื้นขาว + Aurora (Aurora อยู่ระดับ Layout) ===== */}
      <div className={`${FLOATING_CARD} p-6 sm:p-8`}>
          {/* AI header — สั้น เป็นกันเอง */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="h-6 w-6" style={{ stroke: 'url(#sim-grad)' }} strokeWidth={2} />
              <h2 className="text-xl font-medium tracking-tight text-ink sm:text-[22px]">
                Financial Simulation
              </h2>
            </div>
            <p className="mx-auto mt-2 max-w-sm text-[13px] leading-relaxed text-muted sm:text-sm">
              Ask AI how today’s financial decisions may affect your future.
            </p>
          </div>

          {/* Prompt — พระเอกของหน้า */}
          <form onSubmit={ask} className="relative mt-6">
            {/* เรืองแสงนุ่มตอนโฟกัส */}
            <div
              aria-hidden="true"
              className={`ai-gradient pointer-events-none absolute -inset-2 rounded-[24px] blur-lg transition-opacity duration-300 ${
                focused ? 'opacity-25' : 'opacity-0'
              }`}
            />
            {/* ขอบไล่สีตอนโฟกัส */}
            <div
              aria-hidden="true"
              className={`ai-gradient pointer-events-none absolute -inset-[1.5px] rounded-[18px] transition-opacity duration-200 ${
                focused ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <input
              ref={inputRef}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="What happens if I save 5,000 THB every month?"
              className="relative w-full rounded-2xl border border-hairline bg-white px-5 py-4 text-[15px] text-ink placeholder:text-muted-soft shadow-[inset_0_1px_3px_rgb(10_10_10/0.06)] transition-colors duration-200 focus:border-transparent focus:outline-none"
            />
          </form>

          {/* ปุ่ม / สถานะกำลังจำลอง */}
          <div className="mt-4">
            {loading ? (
              <div className="ai-gradient relative flex h-[50px] items-center justify-center overflow-hidden rounded-full px-5 text-white">
                <span className="relative z-10 flex animate-pulse items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4" />
                  AI is simulating your future...
                </span>
                <span
                  aria-hidden="true"
                  className="animate-sheen absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/35 to-transparent"
                />
              </div>
            ) : (
              <button
                onClick={ask}
                className="ai-gradient flex h-[50px] w-full items-center justify-center gap-2 rounded-full text-sm font-semibold text-white shadow-[0_8px_22px_-8px_rgb(79_114_229/0.65)] transition-[filter,box-shadow] duration-200 hover:brightness-110 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#4F72E5]/25"
              >
                <Sparkles className="h-4 w-4" />
                Simulate with AI
              </button>
            )}
          </div>

          {/* ชิปคำถามแนะนำ — กดแล้วเติมช่องพิมพ์ */}
          <div className="mt-4 flex flex-wrap justify-center gap-1.5">
            {SUGGESTIONS.map((s) => {
              const active = question === s.text
              return (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => {
                    setQuestion(s.text)
                    inputRef.current?.focus()
                  }}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4F72E5]/30 ${
                    active
                      ? 'ai-gradient border-transparent text-white'
                      : 'border-hairline bg-white/70 text-body hover:border-ink/20 hover:bg-white hover:text-ink'
                  }`}
                >
                  <span className="mr-1">{s.emoji}</span>
                  {s.text}
                </button>
              )
            })}
          </div>
      </div>

      {/* ===== ผลลัพธ์ — เหมือน AI ตอบกลับ ===== */}
      {result && !loading && (
        <div className="animate-result-in">
          <div className={`${FLOATING_CARD} p-5 sm:p-6`}>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-4 w-4" style={{ stroke: 'url(#sim-grad)' }} />
              <span className="ai-gradient-text text-[11px] font-semibold uppercase tracking-wider">
                AI Result
              </span>
            </div>

            <p className="mt-3 text-base font-medium text-ink sm:text-lg">{result.label}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              <Metric icon={CalendarDays} label="ต่อเดือน" value={result.monthly} direction={result.direction} />
              <Metric icon={CalendarRange} label="ต่อปี" value={result.yearly} direction={result.direction} />
              <Metric
                icon={result.direction === 'cost' ? TrendingDown : TrendingUp}
                label="ใน 5 ปี"
                value={result.fiveYear}
                direction={result.direction}
                emphasized
              />
            </div>

            <p className="mt-4 rounded-xl border border-ink/[0.05] bg-white/60 p-3.5 text-[13px] leading-relaxed text-body sm:text-sm">
              {result.insight_th}
            </p>

            <p className="mt-3 text-center text-[11px] text-muted-soft">
              * คำนวณจากค่าเฉลี่ยรายรับ-รายจ่าย 3 เดือนล่าสุด (ข้อมูลจำลองในเดโม)
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

/** ตัวเลขผลลัพธ์ 1 ช่อง — สีตามทิศทาง (ประหยัด = เขียว / เพิ่มภาระ = แดง) */
function Metric({ icon: Icon, label, value, direction, emphasized }) {
  const isCost = direction === 'cost'
  const color = isCost ? EXPENSE_COLOR : INCOME_COLOR
  return (
    <div
      className={`rounded-xl border bg-white p-2.5 sm:p-3 ${
        emphasized ? 'border-ink/15 shadow-[0_2px_10px_-4px_rgb(10_10_10/0.12)]' : 'border-ink/[0.06]'
      }`}
    >
      <div className="flex items-center gap-1 text-muted">
        <Icon className="h-3 w-3 shrink-0" style={{ color }} />
        <span className="truncate text-[10px] sm:text-[11px]">{label}</span>
      </div>
      <p
        className={`mt-1 truncate font-semibold tabular ${emphasized ? 'text-sm sm:text-lg' : 'text-[13px] sm:text-base'}`}
        style={{ color }}
      >
        {isCost ? '-' : '+'}
        {formatMoney(Math.abs(value))}
      </p>
      <p className="mt-0.5 truncate text-[10px] text-muted-soft">
        {isCost ? 'ภาระเพิ่ม' : 'ประหยัด/เพิ่มขึ้น'}
      </p>
    </div>
  )
}
