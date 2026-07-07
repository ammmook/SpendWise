// Transactions — filter เดือน/ประเภท/หมวด + quick-add ด้วย AI + แก้ไข/ลบ
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Sparkles, Pencil, Trash2, Check, X, Filter } from 'lucide-react'
import {
  getTransactions, getCategories, addTransaction, updateTransaction,
  deleteTransaction, aiCategorize,
} from '../lib/api'
import { formatMoney, formatDate, currentMonthKey, todayISO } from '../lib/format'
import {
  Button, Card, CategoryIcon, Field, Input, Select, Badge, Modal, LoadingBlock, EmptyState,
} from '../components/ui'
import MonthPicker from '../components/MonthPicker'

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

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: getCategories,
  })
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ['transactions', { month, filterType, filterCat }],
    queryFn: () =>
      getTransactions({ month, type: filterType || undefined, category_id: filterCat || undefined }),
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['transactions'] })
    qc.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const [editing, setEditing] = useState(null) // transaction object | 'new' | null

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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-ink-900">รายการรับ-จ่าย</h2>
          <p className="text-sm text-ink-500">
            เดือนนี้ รับ{' '}
            <span className="font-medium text-brand-600">{formatMoney(monthTotals.income)}</span> · จ่าย{' '}
            <span className="font-medium text-rose-600">{formatMoney(monthTotals.expense)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <MonthPicker value={month} onChange={setMonth} />
          <Button size="md" onClick={() => setEditing('new')}>
            <Plus className="h-4 w-4" /> เพิ่มรายการ
          </Button>
        </div>
      </div>

      {/* Quick add ด้วย AI */}
      <QuickAdd categories={categories} onAdded={invalidate} />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setShowFilters((s) => !s)}
          className="inline-flex items-center gap-2 rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm font-medium text-ink-600 hover:bg-ink-50"
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
                className="text-sm text-ink-400 hover:text-ink-600"
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
          <LoadingBlock />
        ) : transactions.length === 0 ? (
          <EmptyState
            title="ไม่มีรายการในเดือนนี้"
            description="ลองเพิ่มรายการด้วยช่องด้านบน หรือกดปุ่มเพิ่มรายการ"
          />
        ) : (
          <ul className="divide-y divide-ink-100">
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

// ---------------- Quick add ----------------
function QuickAdd({ categories, onAdded }) {
  const [text, setText] = useState('')
  const [pending, setPending] = useState(null) // { description, amount, category_id, type }
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
        ai_category_name: ai.category_name,
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
    <Card className="p-4">
      <form onSubmit={analyze} className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Sparkles className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-400" />
          <Input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="เพิ่มเร็ว: พิมพ์ “KFC 249” แล้วให้ AI จัดหมวดให้"
            className="pl-9"
          />
        </div>
        <Button type="submit" loading={analyzing} className="sm:w-auto">
          <Sparkles className="h-4 w-4" /> วิเคราะห์
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}

      {pending && (
        <div className="mt-3 rounded-xl border border-violet-200 bg-violet-50/60 p-3">
          <div className="flex flex-wrap items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-ink-600">
              <CategoryIcon
                name={categories.find((c) => c.id === pending.category_id)?.icon}
              />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium text-ink-800">{pending.description}</p>
              <div className="mt-0.5 flex items-center gap-2">
                <Badge tone="ai">
                  <Sparkles className="h-3 w-3" />
                  {pending.from_cache ? 'AI (จำได้)' : 'AI แนะนำ'}
                </Badge>
                <span className="text-xs text-ink-400">
                  ความมั่นใจ {Math.round(pending.confidence * 100)}%
                </span>
              </div>
            </div>
            <span className="font-semibold tabular text-ink-900">{formatMoney(pending.amount)}</span>
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
            <p className="mt-2 text-xs text-amber-600">
              AI ไม่ค่อยมั่นใจ — โปรดตรวจสอบหมวดหมู่ก่อนยืนยัน
            </p>
          )}
        </div>
      )}
    </Card>
  )
}

// ---------------- Row ----------------
function TransactionRow({ tx, onEdit, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const isIncome = tx.type === 'income'

  return (
    <li className="group flex items-center gap-3 px-4 py-3 hover:bg-ink-50/60">
      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
          isIncome ? 'bg-brand-50 text-brand-600' : 'bg-ink-100 text-ink-500'
        }`}
      >
        <CategoryIcon name={tx.category?.icon} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium text-ink-800">
            {tx.description || tx.category?.name_th || 'ไม่มีรายละเอียด'}
          </p>
          {tx.ai_categorized && (
            <Badge tone="ai" className="shrink-0">
              <Sparkles className="h-3 w-3" /> AI
            </Badge>
          )}
          {tx.source === 'salary_sync' && (
            <Badge className="shrink-0">Sync</Badge>
          )}
        </div>
        <p className="text-xs text-ink-400">
          {tx.category?.name_th || 'ไม่ระบุหมวด'} · {formatDate(tx.transaction_date)}
        </p>
      </div>

      <span className={`shrink-0 font-semibold tabular ${isIncome ? 'text-brand-600' : 'text-ink-800'}`}>
        {isIncome ? '+' : '-'}
        {formatMoney(tx.amount)}
      </span>

      <div className="flex shrink-0 items-center gap-1">
        {confirming ? (
          <>
            <button
              onClick={onDelete}
              className="rounded-lg bg-rose-50 px-2 py-1 text-xs font-medium text-rose-600 hover:bg-rose-100"
            >
              ลบเลย
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-lg px-2 py-1 text-xs text-ink-400 hover:text-ink-600"
            >
              ยกเลิก
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onEdit}
              className="rounded-lg p-1.5 text-ink-400 opacity-0 transition hover:bg-ink-100 hover:text-ink-700 group-hover:opacity-100"
              aria-label="แก้ไข"
            >
              <Pencil className="h-4 w-4" />
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="rounded-lg p-1.5 text-ink-400 opacity-0 transition hover:bg-rose-50 hover:text-rose-600 group-hover:opacity-100"
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

// ---------------- Add/Edit Modal ----------------
function TransactionModal({ tx, categories, onClose, onSaved }) {
  const isEdit = !!tx
  const [form, setForm] = useState({
    type: tx?.type || 'expense',
    amount: tx?.amount || '',
    description: tx?.description || '',
    category_id: tx?.category_id || '',
    transaction_date: tx?.transaction_date || todayISO(),
  })
  const [error, setError] = useState('')

  const cats = categories.filter((c) => c.type === form.type)

  const mutation = useMutation({
    mutationFn: async () => {
      const payload = { ...form, amount: Number(form.amount), category_id: form.category_id || null }
      if (isEdit) return updateTransaction(tx.id, payload)
      return addTransaction(payload)
    },
    onSuccess: onSaved,
    onError: (e) => setError(e.message || 'บันทึกไม่สำเร็จ'),
  })

  function submit(e) {
    e.preventDefault()
    setError('')
    if (!(Number(form.amount) > 0)) return setError('จำนวนเงินต้องมากกว่า 0')
    mutation.mutate()
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}
      footer={
        <>
          <Button variant="secondary" className="flex-1" onClick={onClose}>
            ยกเลิก
          </Button>
          <Button className="flex-1" onClick={submit} loading={mutation.isPending}>
            {isEdit ? 'บันทึก' : 'เพิ่มรายการ'}
          </Button>
        </>
      }
    >
      <form onSubmit={submit} className="space-y-4">
        {/* Type toggle */}
        <div className="grid grid-cols-2 gap-2 rounded-xl bg-ink-100 p-1">
          {[
            { v: 'expense', label: 'รายจ่าย' },
            { v: 'income', label: 'รายรับ' },
          ].map((opt) => (
            <button
              key={opt.v}
              type="button"
              onClick={() => setForm((f) => ({ ...f, type: opt.v, category_id: '' }))}
              className={`rounded-lg py-2 text-sm font-medium transition ${
                form.type === opt.v
                  ? opt.v === 'income'
                    ? 'bg-white text-brand-600 shadow-sm'
                    : 'bg-white text-rose-600 shadow-sm'
                  : 'text-ink-500'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <Field label="จำนวนเงิน (บาท)">
          <Input
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={form.amount}
            onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
            autoFocus
          />
        </Field>

        <Field label="รายละเอียด">
          <Input
            placeholder="เช่น ข้าวมันไก่"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </Field>

        <Field label="หมวดหมู่">
          <Select
            value={form.category_id}
            onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
          >
            <option value="">— เลือกหมวด —</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name_th}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="วันที่">
          <Input
            type="date"
            value={form.transaction_date}
            max={todayISO()}
            onChange={(e) => setForm((f) => ({ ...f, transaction_date: e.target.value }))}
          />
        </Field>

        {error && <p className="text-sm text-rose-500">{error}</p>}
      </form>
    </Modal>
  )
}
