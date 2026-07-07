// What-if — ถามคำถามภาษาไทยอิสระ + การ์ดแสดงผลเดือน/ปี/5 ปี
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Sparkles, Send, CalendarDays, CalendarRange, TrendingUp } from 'lucide-react'
import { aiWhatIf } from '../lib/api'
import { formatMoney } from '../lib/format'
import { Button, Card, Input } from '../components/ui'

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
        <h2 className="text-xl font-bold text-ink-900">จำลองสถานการณ์ “ถ้า...”</h2>
        <p className="text-sm text-ink-500">
          ลองถามว่าถ้าเปลี่ยนพฤติกรรมการเงิน จะส่งผลอย่างไรในระยะยาว
        </p>
      </div>

      <Card className="p-5">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            ask()
          }}
          className="flex flex-col gap-2 sm:flex-row"
        >
          <div className="relative flex-1">
            <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="เช่น ถ้าเลิกซื้อกาแฟทุกวันจะประหยัดได้เท่าไหร่?"
              className="pl-9"
            />
          </div>
          <Button type="submit" loading={mutation.isPending} className="sm:w-auto">
            <Send className="h-4 w-4" /> จำลอง
          </Button>
        </form>

        <div className="mt-3 flex flex-wrap gap-2">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => ask(s)}
              className="rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-medium text-ink-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
            >
              {s}
            </button>
          ))}
        </div>
      </Card>

      {mutation.isPending && (
        <Card className="p-8">
          <div className="flex flex-col items-center gap-3 text-ink-400">
            <Sparkles className="h-6 w-6 animate-pulse text-violet-400" />
            <span className="text-sm">AI กำลังคำนวณผลลัพธ์...</span>
          </div>
        </Card>
      )}

      {result && !mutation.isPending && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <ResultCard
              icon={CalendarDays}
              label="ต่อเดือน"
              value={result.monthly}
              tone="from-sky-400 to-sky-600"
            />
            <ResultCard
              icon={CalendarRange}
              label="ต่อปี"
              value={result.yearly}
              tone="from-brand-400 to-brand-600"
            />
            <ResultCard
              icon={TrendingUp}
              label="ใน 5 ปี"
              value={result.fiveYear}
              tone="from-violet-400 to-violet-600"
            />
          </div>

          <Card className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-violet-600">
              <Sparkles className="h-4 w-4" /> คำอธิบายจาก AI
            </div>
            <p className="mt-2 leading-relaxed text-ink-700">{result.insight_th}</p>
          </Card>

          <p className="text-center text-xs text-ink-400">
            * ตัวเลขคำนวณจากค่าเฉลี่ยรายรับ-รายจ่าย 3 เดือนล่าสุด (ข้อมูลจำลองในเดโม)
          </p>
        </div>
      )}
    </div>
  )
}

function ResultCard({ icon: Icon, label, value, tone }) {
  return (
    <Card className={`bg-gradient-to-br ${tone} p-5 text-white`}>
      <div className="flex items-center gap-2 text-white/90">
        <Icon className="h-5 w-5" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-3 text-2xl font-bold tabular">{formatMoney(value)}</p>
      <p className="mt-0.5 text-xs text-white/70">ประหยัด/เพิ่มขึ้น</p>
    </Card>
  )
}
