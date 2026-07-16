// Transactions — filter + quick-add ด้วย AI (color block) + แก้ไข/ลบ
import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Sparkles, Pencil, Trash2, Check, X, Filter } from 'lucide-react'
import {
  getTransactions, getCategories, addTransaction, deleteTransaction, aiCategorize,
} from '../lib/api'
import { formatMoney, formatDate, currentMonthKey, todayISO } from '../lib/format'
import {
  Button, Card, ColorBlock, CategoryIcon, Eyebrow, Input, Select, Badge,
  Skeleton, EmptyState,
} from '../components/ui'
import MonthPicker from '../components/MonthPicker'
import TransactionModal from '../components/TransactionModal'

const INCOME_COLOR = '#1ea64a'

// แยกจำนวนเงินที่อยู่ท้ายข้อความ เช่น "KFC 249" -> { description: 'KFC', amount: 249 }
function parseQuickInput(text) {
  const m = text.trim().match(/^(.*?)[\s]*([0-9][0-9,]*(?:\.[0-9]{1,2})?)\s*$/)
  if (!m) return { description: text.trim(), amount: '' }
  return { description: m[1].trim(), amount: Number(m[2].replace(/,/g, '')) }
}

export default function Transactions() {
  const qc = useQueryClient()
  const [month, setMonth] = useState(currentMonthKey())
  const [filterType, setFilterType] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: getCategories })
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', { month, filterType, filterCat }],
    queryFn: () =>
      getTransactions({ month, type: filterType || undefined, category_id: filterCat || undefined }),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const [editing, setEditing] = useState(null) // transaction | 'new' | null

  const monthTotals = useMemo(() => {
    let income = 0
    let expense = 0
    for (const t of transactions) {
      if (t.type === 'income') income += t.amount
      else expense += t.amount
    }
    return { income, expense }
  }, [transactions])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Eyebrow>Transactions</Eyebrow>
          <h2 className="display mt-1 text-2xl text-ink">รายการรับ-จ่าย</h2>
          <p className="mt-1 text-sm text-muted">
            เดือนนี้ รับ <span className="font-medium text-ink">{formatMoney(monthTotals.income)}</span> · จ่าย{' '}
            <span className="font-medium text-ink">{formatMoney(monthTotals.expense)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <Button size="md" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> เพิ่ม
          </Button>
        </div>
      </div>

      {/* Quick add ด้วย AI — color block (signature ของฟีเจอร์ AI) */}
      <QuickAdd categories={categories} onAdded={invalidate} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowFilters((s) => !s)}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition ${
            showFilters ? 'border-ink bg-ink text-canvas' : 'border-hairline bg-canvas text-ink hover:bg-surface'
          }`}
        >
          <Filter className="h-4 w-4" /> ตัวกรอง
        </button>
        {showFilters && (
          <>
            <Select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="h-10 w-auto">
              <option value="">ทุกประเภท</option>
              <option value="income">รายรับ</option>
              <option value="expense">รายจ่าย</option>
            </Select>
            <Select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="h-10 w-auto">
              <option value="">ทุกหมวด</option>
              {categories
                .filter((c) => !filterType || c.type === filterType)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name_th}
                  </option>
                ))}
            </Select>
            {(filterType || filterCat) && (
              <button
                onClick={() => {
                  setFilterType('')
                  setFilterCat('')
                }}
                className="text-sm text-muted underline underline-offset-2 hover:text-ink"
              >
                ล้างตัวกรอง
              </button>
            )}
          </>
        )}
      </div>

      {/* List */}
      <Card className="overflow-hidden">
        {isLoading ? (
          <ul className="divide-y divide-hairline-soft">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-5 py-3.5">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-1/3 rounded" />
                  <Skeleton className="h-3 w-1/5 rounded" />
                </div>
                <Skeleton className="h-4 w-20 rounded" />
              </li>
            ))}
          </ul>
        ) : transactions.length === 0 ? (
          <EmptyState
            title="ไม่มีรายการในเดือนนี้"
            description="ลองเพิ่มรายการด้วยช่องด้านบน หรือกดปุ่มเพิ่ม"
          />
        ) : (
          <ul className="divide-y divide-hairline-soft">
            {transactions.map((t) => (
              <TransactionRow
                key={t.id}
                tx={t}
                onEdit={() => setEditing(t)}
                onDelete={async () => {
                  await deleteTransaction(t.id)
                  invalidate()
                }}
              />
            ))}
          </ul>
        )}
      </Card>

      {editing && (
        <TransactionModal
          tx={editing === 'new' ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            invalidate()
          }}
        />
      )}
    </div>
  )
}

// ---------------- Quick add (lilac color block) ----------------
function QuickAdd({ categories, onAdded }) {
  const [text, setText] = useState('')
  const [pending, setPending] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
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
    await addTransaction({
      description: pending.description,
      amount: pending.amount,
      type: pending.type,
      category_id: pending.category_id,
      transaction_date: todayISO(),
      ai_categorized: pending.ai_categorized,
    })
    setPending(null)
    setText('')
    onAdded()
  }

  return (
    <ColorBlock tone="lilac" className="p-5">
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
      {error && <p className="mt-2 text-sm font-medium text-[#b3243a]">{error}</p>}

      {pending && (
        <div className="mt-3 rounded-2xl border border-hairline bg-canvas p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-ink">
              <CategoryIcon name={categories.find((c) => c.id === pending.category_id)?.icon} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink">{pending.description}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge tone="ai">
                  <Sparkles className="h-3 w-3" />
                  {pending.from_cache ? 'AI (จำได้)' : 'AI แนะนำ'}
                </Badge>
                <span className="text-xs text-muted">ความมั่นใจ {Math.round(pending.confidence * 100)}%</span>
              </div>
            </div>
            <span className="font-semibold tabular text-ink">{formatMoney(pending.amount)}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Select
              value={pending.category_id}
              onChange={(e) => setPending((p) => ({ ...p, category_id: e.target.value }))}
              className="h-10 w-auto flex-1"
            >
              {expenseCats.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name_th}
                </option>
              ))}
            </Select>
            <Button size="sm" onClick={confirm}>
              <Check className="h-4 w-4" /> ยืนยัน
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
              <X className="h-4 w-4" /> ยกเลิก
            </Button>
          </div>
          {pending.confidence < 0.7 && (
            <p className="mt-2 text-xs text-muted">AI ไม่ค่อยมั่นใจ — โปรดตรวจสอบหมวดหมู่ก่อนยืนยัน</p>
          )}
        </div>
      )}
    </ColorBlock>
  )
}

// ---------------- Row ----------------
function TransactionRow({ tx, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const isIncome = tx.type === 'income'

  return (
    <li className="group flex items-center gap-3 px-5 py-3.5 hover:bg-surface/60">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-ink">
        <CategoryIcon name={tx.category?.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-ink">
            {tx.description || tx.category?.name_th || 'ไม่มีรายละเอียด'}
          </p>
          {tx.ai_categorized && (
            <Badge tone="ai" className="shrink-0">
              <Sparkles className="h-3 w-3" /> AI
            </Badge>
          )}
          {tx.source === 'salary_sync' && <Badge className="shrink-0">Sync</Badge>}
        </div>
        <p className="text-xs text-muted">
          {tx.category?.name_th || 'ไม่ระบุหมวด'} · {formatDate(tx.transaction_date)}
        </p>
      </div>

      <span
        className="shrink-0 font-semibold tabular"
        style={{ color: isIncome ? INCOME_COLOR : '#000' }}
      >
        {isIncome ? '+' : '-'}
        {formatMoney(tx.amount)}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        {confirming ? (
          <>
            <button
              onClick={onDelete}
              className="rounded-full bg-[#fbeeee] px-3 py-1 text-xs font-medium text-[#e34948] hover:bg-[#f7dede]"
            >
              ลบเลย
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-full px-2 py-1 text-xs text-muted hover:text-ink"
            >
              ยกเลิก
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="rounded-full p-1.5 text-muted opacity-0 transition hover:bg-surface hover:text-ink group-hover:opacity-100"
              aria-label="แก้ไข"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="rounded-full p-1.5 text-muted opacity-0 transition hover:bg-[#fbeeee] hover:text-[#e34948] group-hover:opacity-100"
              aria-label="ลบ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
    </li>
  )
}

