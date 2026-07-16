// What-if — ถามภาษาไทยอิสระ + การ์ด color-block แสดงผลเดือน/ปี/5 ปี
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, Send, CalendarDays, CalendarRange, TrendingUp } from 'lucide-react'
import { aiWhatIf } from '../lib/api'
import { formatMoney } from '../lib/format'
import { Button, ColorBlock, Input, Eyebrow } from '../components/ui'

const SUGGESTIONS = [
  'ถ้าเลิกซื้อกาแฟทุกวัน',
  'ถ้าลดช้อปปิ้งลงครึ่งหนึ่ง',
  'ถ้าเงินเดือนขึ้น 10%',
  'ถ้าตัดค่าบันเทิงออก',
]

export default function WhatIf() {
  const [question, setQuestion] = useState('')
  const mutation = useMutation({ mutationFn: (q) => aiWhatIf({ question: q }) })

  function ask(q) {
    const query = (q ?? question).trim()
    if (!query) return
    setQuestion(query)
    mutation.mutate(query)
  }

  const result = mutation.data

  return (
    <div className="space-y-6">
      <div>
        <Eyebrow>Simulation</Eyebrow>
        <h2 className="display mt-1 text-2xl text-ink">จำลองสถานการณ์ “ถ้า...”</h2>
        <p className="mt-1 text-sm text-muted">
          ลองถามว่าถ้าเปลี่ยนพฤติกรรมการเงิน จะส่งผลอย่างไรในระยะยาว
        </p>
      </div>

      <ColorBlock tone="lilac" className="p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          <p className="eyebrow !text-ink/70">Ask AI</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask()
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="เช่น ถ้าเลิกซื้อกาแฟทุกวันจะประหยัดได้เท่าไหร่?"
            className="flex-1 border-transparent"
          />
          <Button type="submit" loading={mutation.isPending} className="sm:w-auto">
            <Send className="h-4 w-4" /> จำลอง
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-ink/15 bg-canvas/60 px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-canvas"
            >
              {s}
            </button>
          ))}
        </div>
      </ColorBlock>

      {mutation.isPending && (
        <div className="space-y-3">
          <p className="text-sm text-muted">AI กำลังคำนวณผลลัพธ์...</p>
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <div className="h-24 animate-pulse rounded-3xl bg-hairline-soft" />
              <div className="h-24 animate-pulse rounded-3xl bg-hairline-soft" />
            </div>
            <div className="min-h-[120px] animate-pulse rounded-3xl bg-hairline-soft lg:col-span-2" />
          </div>
        </div>
      )}

      {result && !mutation.isPending && (
        <div className="space-y-4">
          {/* crescendo: เดือน/ปี เล็ก, 5 ปี เป็น poster ใหญ่ (payoff ระยะยาว) */}
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              <ResultBlock tone="mint" icon={CalendarDays} label="ต่อเดือน" value={result.monthly} />
              <ResultBlock tone="lime" icon={CalendarRange} label="ต่อปี" value={result.yearly} />
            </div>
            <ColorBlock tone="lilac" interactive className="flex flex-col justify-between p-6 lg:col-span-2">
              <div className="flex items-center gap-2 text-ink/70">
                <TrendingUp className="h-5 w-5" />
                <span className="text-sm">ใน 5 ปี</span>
              </div>
              <div className="mt-8">
                <p className="text-4xl font-semibold tracking-tight tabular text-ink sm:text-5xl">
                  {formatMoney(result.fiveYear)}
                </p>
                <p className="mt-1 text-xs text-ink/55">ประหยัด/เพิ่มขึ้น</p>
              </div>
            </ColorBlock>
          </div>

          <ColorBlock tone="cream" className="p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              <p className="eyebrow !text-ink/70">AI Insight</p>
            </div>
            <p className="leading-relaxed text-ink">{result.insight_th}</p>
          </ColorBlock>

          <p className="text-center text-xs text-muted">
            * ตัวเลขคำนวณจากค่าเฉลี่ยรายรับ-รายจ่าย 3 เดือนล่าสุด (ข้อมูลจำลองในเดโม)
          </p>
        </div>
      )}
    </div>
  )
}

function ResultBlock({ tone, icon: Icon, label, value }) {
  return (
    <ColorBlock tone={tone} interactive className="p-5">
      <div className="flex items-center gap-2 text-ink/70">
        <Icon className="h-5 w-5" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-semibold tracking-tight tabular text-ink">{formatMoney(value)}</p>
      <p className="mt-0.5 text-xs text-ink/55">ประหยัด/เพิ่มขึ้น</p>
    </ColorBlock>
  )
}
