// AI Quick Add — พิมพ์ "KFC 249" แล้วให้ AI จัดหมวดให้ (อยู่บนหน้า Home)
import { useState } from 'react'
import { Sparkles, Check, X } from 'lucide-react'
import { addTransaction, aiCategorize } from '../lib/api'
import { FUNDING_SOURCES } from '../lib/mockData'
import { formatMoney, todayISO } from '../lib/format'
import { Button, ColorBlock, CategoryIcon, Input, Select, Badge } from './ui'

// แยกจำนวนเงินที่อยู่ท้ายข้อความ เช่น "KFC 249" -> { description: 'KFC', amount: 249 }
function parseQuickInput(text) {
  const m = text.trim().match(/^(.*?)[\s]*([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*$/)
  if (!m) return { description: text.trim(), amount: '' }
  return { description: m[1].trim(), amount: Number(m[2].replace(/,/g, '')) }
}

export default function QuickAdd({ categories, defaultDate, onAdded }) {
  const [text, setText] = useState('')
  const [pending, setPending] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const expenseCats = categories.filter((c) => c.type === 'expense')

  async function analyze(e) {
    e.preventDefault()
    setError('')
    const { description, amount } = parseQuickInput(text)
    if (!description) return setError('พิมพ์รายละเอียด เช่น “KFC 249”')
    if (!(amount > 0)) return setError('ระบุจำนวนเงินท้ายข้อความ เช่น “กาแฟ 60”')

    setAnalyzing(true)
    try {
      const ai = await aiCategorize({ description, amount })
      setPending({
        description,
        amount,
        type: 'expense',
        category_id: ai.category_id,
        funding_source: 'cash',
        confidence: ai.confidence,
        from_cache: ai.from_cache,
        ai_categorized: true,
      })
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
      setPending(null)
      setText('')
      onAdded()
    } catch {
      setError('บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง')
    } finally {
      setSaving(false)
    }
  }

  return (
    <ColorBlock tone="lavender" className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-4 w-4" />
        <p className="eyebrow !text-ink/70">AI Quick Add</p>
      </div>
      <form onSubmit={analyze} className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="พิมพ์ “KFC 249” แล้วให้ AI จัดหมวดให้"
          className="flex-1 border-transparent"
        />
        <Button type="submit" loading={analyzing} className="sm:w-auto">
          <Sparkles className="h-4 w-4" /> วิเคราะห์
        </Button>
      </form>
      {error && <p className="mt-2 text-sm font-medium text-ink">{error}</p>}

      {pending && (
        <div className="mt-3 rounded-2xl border border-hairline bg-canvas p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-card text-ink">
              <CategoryIcon name={categories.find((c) => c.id === pending.category_id)?.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{pending.description}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge tone="ai">
                  <Sparkles className="h-3 w-3" />
                  {pending.from_cache ? 'AI (จำได้)' : 'AI แนะนำ'}
                </Badge>
                <span className="text-xs text-muted">
                  ความมั่นใจ {Math.round(pending.confidence * 100)}%
                </span>
              </div>
            </div>
            <span className="font-semibold tabular text-ink">{formatMoney(pending.amount)}</span>
          </div>

          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Select
              value={pending.category_id}
              onChange={(e) => setPending((p) => ({ ...p, category_id: e.target.value }))}
              className="h-10"
            >
              {expenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_th}
                </option>
              ))}
            </Select>
            <Select
              value={pending.funding_source}
              onChange={(e) => setPending((p) => ({ ...p, funding_source: e.target.value }))}
              className="h-10"
            >
              {FUNDING_SOURCES.map((s) => (
                <option key={s.id} value={s.id}>
                  จ่ายด้วย: {s.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-2 flex items-center gap-2">
            <Button size="sm" onClick={confirm} loading={saving}>
              <Check className="h-4 w-4" /> ยืนยัน
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
              <X className="h-4 w-4" /> ยกเลิก
            </Button>
            {pending.confidence < 0.7 && (
              <span className="text-xs text-muted">AI ไม่ค่อยมั่นใจ — ตรวจสอบหมวดก่อนยืนยัน</span>
            )}
          </div>
        </div>
      )}
    </ColorBlock>
  )
}
